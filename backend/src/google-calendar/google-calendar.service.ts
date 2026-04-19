import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getPrimaryFrontendUrl } from '../common/utils/frontend-url';

interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── OAuth helpers ──

  private isProductionEnv() {
    return process.env.NODE_ENV === 'production';
  }

  private getEnvValue(prodKey: string, devKey?: string) {
    if (!this.isProductionEnv() && devKey) {
      const devValue = (process.env[devKey] || '').trim();
      if (devValue) {
        return devValue;
      }
    }

    const prodValue = (process.env[prodKey] || '').trim();
    return prodValue || null;
  }

  private getClientId(): string | null {
    return this.getEnvValue('GOOGLE_CALENDAR_CLIENT_ID', 'GOOGLE_CALENDAR_CLIENT_ID_DEV')
      || this.getEnvValue('GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_ID_DEV')
      || null;
  }

  private getClientSecret(): string | null {
    return this.getEnvValue('GOOGLE_CALENDAR_CLIENT_SECRET', 'GOOGLE_CALENDAR_CLIENT_SECRET_DEV')
      || this.getEnvValue('GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_CLIENT_SECRET_DEV')
      || null;
  }

  private getRedirectUri(): string {
    const calendarRedirect = this.getEnvValue(
      'GOOGLE_CALENDAR_REDIRECT_URI',
      'GOOGLE_CALENDAR_REDIRECT_URI_DEV',
    );
    if (calendarRedirect) {
      return calendarRedirect;
    }

    const driveRedirect = this.getEnvValue(
      'GOOGLE_DRIVE_REDIRECT_URI',
      'GOOGLE_DRIVE_REDIRECT_URI_DEV',
    );
    if (driveRedirect) {
      return driveRedirect;
    }

    const frontend = getPrimaryFrontendUrl();
    return `${frontend}/settings?tab=integrations&integration=google-calendar`;
  }

  private createOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
      this.getClientId() || undefined,
      this.getClientSecret() || undefined,
      this.getRedirectUri(),
    );
  }

  private async getAuthenticatedClient(userId: string): Promise<{
    oauth2: OAuth2Client;
    calendar: calendar_v3.Calendar;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarToken: true },
    });

    const tokens = user?.googleCalendarToken as GoogleTokens | null;
    if (!tokens?.refresh_token) return null;

    const oauth2 = this.createOAuth2Client();
    oauth2.setCredentials(tokens);

    // Auto-refresh token if expired
    oauth2.on('tokens', async (newTokens) => {
      const merged = { ...tokens, ...newTokens };
      await this.prisma.user.update({
        where: { id: userId },
        data: { googleCalendarToken: merged as unknown as Prisma.InputJsonValue },
      });
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2 });
    return { oauth2, calendar };
  }

  // ── OAuth flow ──

  async startConnect(userId: string): Promise<
    | { oauthConfigured: false }
    | { oauthConfigured: true; authUrl: string }
  > {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    if (!clientId || !clientSecret) {
      return { oauthConfigured: false };
    }

    const oauth2 = this.createOAuth2Client();

    const authUrl = oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state: userId,
    });

    return { oauthConfigured: true, authUrl };
  }

  async completeConnect(
    userId: string,
    code: string,
  ): Promise<{ connected: boolean; email: string }> {
    const oauth2 = this.createOAuth2Client();

    const { tokens } = await oauth2.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new BadRequestException('Не удалось получить токены от Google');
    }

    oauth2.setCredentials(tokens);

    // Get user email
    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
    const { data: userInfo } = await oauth2Api.userinfo.get();
    const email = userInfo.email || '';

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleCalendarToken: tokens as unknown as Prisma.InputJsonValue,
        googleCalendarEmail: email,
      },
    });

    return { connected: true, email };
  }

  async disconnect(userId: string) {
    // Clear google calendar event IDs from lessons
    await this.prisma.lesson.updateMany({
      where: { userId, googleCalendarEventId: { not: null } },
      data: { googleCalendarEventId: null },
    });

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleCalendarToken: Prisma.DbNull,
        googleCalendarEmail: null,
      },
    });
  }

  // ── Calendar event CRUD ──

  async createEvent(
    userId: string,
    lesson: {
      id: string;
      subject: string;
      scheduledAt: Date;
      duration: number;
      format: string;
      location?: string | null;
      student: { name: string };
    },
  ): Promise<string | null> {
    const client = await this.getAuthenticatedClient(userId);
    if (!client) return null;

    try {
      const endTime = new Date(lesson.scheduledAt.getTime() + lesson.duration * 60000);

      const event: calendar_v3.Schema$Event = {
        summary: `${lesson.subject} — ${lesson.student.name}`,
        description: `Урок: ${lesson.subject}\nУченик: ${lesson.student.name}\nФормат: ${lesson.format === 'ONLINE' ? 'Онлайн' : 'Очно'}`,
        start: {
          dateTime: lesson.scheduledAt.toISOString(),
          timeZone: 'Europe/Moscow',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Moscow',
        },
        location: lesson.location || undefined,
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 30 }],
        },
      };

      const { data } = await client.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      if (data.id) {
        await this.prisma.lesson.update({
          where: { id: lesson.id },
          data: { googleCalendarEventId: data.id },
        });
      }

      return data.id || null;
    } catch (err) {
      this.logger.warn(`Failed to create GCal event for lesson ${lesson.id}: ${err}`);
      return null;
    }
  }

  async updateEvent(
    userId: string,
    lesson: {
      id: string;
      subject: string;
      scheduledAt: Date;
      duration: number;
      format: string;
      location?: string | null;
      googleCalendarEventId: string | null;
      student: { name: string };
    },
  ): Promise<void> {
    if (!lesson.googleCalendarEventId) return;

    const client = await this.getAuthenticatedClient(userId);
    if (!client) return;

    try {
      const endTime = new Date(lesson.scheduledAt.getTime() + lesson.duration * 60000);

      await client.calendar.events.update({
        calendarId: 'primary',
        eventId: lesson.googleCalendarEventId,
        requestBody: {
          summary: `${lesson.subject} — ${lesson.student.name}`,
          description: `Урок: ${lesson.subject}\nУченик: ${lesson.student.name}\nФормат: ${lesson.format === 'ONLINE' ? 'Онлайн' : 'Очно'}`,
          start: {
            dateTime: lesson.scheduledAt.toISOString(),
            timeZone: 'Europe/Moscow',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Europe/Moscow',
          },
          location: lesson.location || undefined,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to update GCal event for lesson ${lesson.id}: ${err}`);
    }
  }

  async deleteEvent(userId: string, googleCalendarEventId: string | null): Promise<void> {
    if (!googleCalendarEventId) return;

    const client = await this.getAuthenticatedClient(userId);
    if (!client) return;

    try {
      await client.calendar.events.delete({
        calendarId: 'primary',
        eventId: googleCalendarEventId,
      });
    } catch (err) {
      this.logger.warn(`Failed to delete GCal event ${googleCalendarEventId}: ${err}`);
    }
  }

  async cancelEvent(userId: string, googleCalendarEventId: string | null): Promise<void> {
    if (!googleCalendarEventId) return;

    const client = await this.getAuthenticatedClient(userId);
    if (!client) return;

    try {
      await client.calendar.events.patch({
        calendarId: 'primary',
        eventId: googleCalendarEventId,
        requestBody: {
          status: 'cancelled',
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to cancel GCal event ${googleCalendarEventId}: ${err}`);
    }
  }

  // ── Full sync (push all PLANNED lessons to GCal) ──

  async syncAllLessons(userId: string): Promise<{ synced: number; errors: number }> {
    const client = await this.getAuthenticatedClient(userId);
    if (!client) throw new BadRequestException('Google Calendar не подключен');

    const lessons = await this.prisma.lesson.findMany({
      where: {
        userId,
        status: 'PLANNED',
        scheduledAt: { gte: new Date() },
      },
      include: { student: { select: { name: true } } },
      orderBy: { scheduledAt: 'asc' },
    });

    let synced = 0;
    let errors = 0;

    for (const lesson of lessons) {
      try {
        if (lesson.googleCalendarEventId) {
          // Update existing event
          await this.updateEvent(userId, lesson);
        } else {
          // Create new event
          await this.createEvent(userId, lesson);
        }
        synced++;
      } catch {
        errors++;
      }
    }

    return { synced, errors };
  }

  // ── Pull changes from GCal ──

  async pullChanges(userId: string): Promise<{
    created: number;
    updated: number;
    cancelled: number;
  }> {
    const client = await this.getAuthenticatedClient(userId);
    if (!client) throw new BadRequestException('Google Calendar не подключен');

    // Fetch recent events from the primary calendar
    const now = new Date();
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60000);
    const threeMonthsAhead = new Date(now.getTime() + 90 * 24 * 60 * 60000);

    const { data } = await client.calendar.events.list({
      calendarId: 'primary',
      timeMin: twoMonthsAgo.toISOString(),
      timeMax: threeMonthsAhead.toISOString(),
      singleEvents: true,
      maxResults: 500,
    });

    const gcalEvents = data.items || [];

    // Get all lessons that have googleCalendarEventId
    const linkedLessons = await this.prisma.lesson.findMany({
      where: {
        userId,
        googleCalendarEventId: { not: null },
      },
      select: {
        id: true,
        googleCalendarEventId: true,
        scheduledAt: true,
        duration: true,
      },
    });

    const lessonsByEventId = new Map(
      linkedLessons.map((l) => [l.googleCalendarEventId!, l]),
    );

    let updated = 0;
    let cancelled = 0;

    for (const event of gcalEvents) {
      if (!event.id) continue;
      const lesson = lessonsByEventId.get(event.id);
      if (!lesson) continue;

      // Event was cancelled in GCal
      if (event.status === 'cancelled') {
        await this.prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            status: 'CANCELLED_TUTOR',
            cancelReason: 'Отменено в Google Calendar',
            cancelledAt: new Date(),
          },
        });
        cancelled++;
        continue;
      }

      // Event was moved in GCal
      const eventStart = event.start?.dateTime
        ? new Date(event.start.dateTime)
        : null;

      if (eventStart && Math.abs(eventStart.getTime() - lesson.scheduledAt.getTime()) > 60000) {
        const eventEnd = event.end?.dateTime ? new Date(event.end.dateTime) : null;
        const newDuration = eventEnd
          ? Math.round((eventEnd.getTime() - eventStart.getTime()) / 60000)
          : lesson.duration;

        await this.prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            scheduledAt: eventStart,
            duration: newDuration,
          },
        });
        updated++;
      }
    }

    return { created: 0, updated, cancelled };
  }
}
