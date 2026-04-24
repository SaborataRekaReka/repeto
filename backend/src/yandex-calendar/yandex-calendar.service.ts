import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { getPrimaryFrontendUrl } from '../common/utils/frontend-url';

const CALDAV_BASE = 'https://caldav.yandex.ru';

interface YandexTokenData {
  access_token: string;
  token_type: string;
  expires_in?: number;
  obtainedAt?: string;
}

@Injectable()
export class YandexCalendarService {
  private readonly logger = new Logger(YandexCalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── helpers ──

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
    return this.getEnvValue('YANDEX_CALENDAR_CLIENT_ID', 'YANDEX_CALENDAR_CLIENT_ID_DEV')
      || this.getEnvValue('YANDEX_DISK_CLIENT_ID', 'YANDEX_DISK_CLIENT_ID_DEV')
      || null;
  }

  private getRedirectUri(): string {
    const calendarRedirect = this.getEnvValue(
      'YANDEX_CALENDAR_REDIRECT_URI',
      'YANDEX_CALENDAR_REDIRECT_URI_DEV',
    );
    if (calendarRedirect) {
      return calendarRedirect;
    }

    const diskRedirect = this.getEnvValue(
      'YANDEX_DISK_REDIRECT_URI',
      'YANDEX_DISK_REDIRECT_URI_DEV',
    );
    if (diskRedirect) {
      return diskRedirect;
    }

    const frontend = getPrimaryFrontendUrl();
    return `${frontend}/settings?tab=integrations&integration=yandex-calendar`;
  }

  private calendarUrl(login: string): string {
    const encoded = encodeURIComponent(`${login}@yandex.ru`);
    return `${CALDAV_BASE}/calendars/${encoded}/events-default`;
  }

  private eventUrl(login: string, uid: string): string {
    return `${this.calendarUrl(login)}/${uid}.ics`;
  }

  private async getTokenAndLogin(userId: string): Promise<{
    token: string;
    login: string;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        yandexCalendarToken: true,
        yandexCalendarLogin: true,
      },
    });

    const tokenData = user?.yandexCalendarToken as YandexTokenData | null;
    if (!tokenData?.access_token || !user?.yandexCalendarLogin) return null;

    return { token: tokenData.access_token, login: user.yandexCalendarLogin };
  }

  private async caldavRequest(
    method: string,
    url: string,
    token: string,
    body?: string,
    contentType?: string,
  ): Promise<{ status: number; body: string }> {
    const headers: Record<string, string> = {
      Authorization: `OAuth ${token}`,
    };
    if (body && contentType) {
      headers['Content-Type'] = contentType;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body || undefined,
    });

    const text = await res.text();
    return { status: res.status, body: text };
  }

  // ── iCalendar builder ──

  private buildIcs(event: {
    uid: string;
    summary: string;
    description: string;
    dtstart: Date;
    dtend: Date;
    location?: string;
  }): string {
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Repeto//Tutor CRM//EN',
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTART:${fmt(event.dtstart)}`,
      `DTEND:${fmt(event.dtend)}`,
      `SUMMARY:${event.summary}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    ];

    if (event.location) {
      lines.push(`LOCATION:${event.location}`);
    }

    lines.push(
      `DTSTAMP:${fmt(new Date())}`,
      'END:VEVENT',
      'END:VCALENDAR',
    );

    return lines.join('\r\n') + '\r\n';
  }

  // ── OAuth flow ──

  async startConnect(userId: string): Promise<
    | { oauthConfigured: false }
    | { oauthConfigured: true; authUrl: string }
  > {
    const clientId = this.getClientId();
    if (!clientId) {
      return { oauthConfigured: false };
    }

    const redirectUri = this.getRedirectUri();

    const authUrl = new URL('https://oauth.yandex.ru/authorize');
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('force_confirm', 'yes');

    return { oauthConfigured: true, authUrl: authUrl.toString() };
  }

  async connectToken(
    userId: string,
    accessToken: string,
  ): Promise<{ connected: boolean; email: string }> {
    // Validate token and get user info
    const res = await fetch(
      `https://login.yandex.ru/info?oauth_token=${encodeURIComponent(accessToken)}&format=json`,
    );

    if (!res.ok) {
      throw new BadRequestException('Невалидный OAuth-токен Яндекса');
    }

    const info = await res.json() as {
      login?: string;
      default_email?: string;
    };

    const login = info.login;
    const email = info.default_email || `${login}@yandex.ru`;

    if (!login) {
      throw new BadRequestException('Не удалось получить логин Яндекса');
    }

    // Test CalDAV access
    const calUrl = this.calendarUrl(login);
    const testRes = await this.caldavRequest('PROPFIND', calUrl, accessToken);

    if (testRes.status >= 400) {
      throw new BadRequestException(
        `Нет доступа к Яндекс.Календарю (${testRes.status}). Убедитесь, что приложение имеет права на календарь.`,
      );
    }

    const tokenData: YandexTokenData = {
      access_token: accessToken,
      token_type: 'bearer',
      obtainedAt: new Date().toISOString(),
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        yandexCalendarToken: tokenData as unknown as Prisma.InputJsonValue,
        yandexCalendarEmail: email,
        yandexCalendarLogin: login,
      },
    });

    return { connected: true, email };
  }

  async disconnect(userId: string) {
    await this.prisma.lesson.updateMany({
      where: { userId, yandexCalendarEventUid: { not: null } },
      data: { yandexCalendarEventUid: null },
    });

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        yandexCalendarToken: Prisma.DbNull,
        yandexCalendarEmail: null,
        yandexCalendarLogin: null,
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
    const auth = await this.getTokenAndLogin(userId);
    if (!auth) return null;

    try {
      const uid = `repeto-${lesson.id}-${randomUUID().slice(0, 8)}`;
      const endTime = new Date(lesson.scheduledAt.getTime() + lesson.duration * 60000);

      const ics = this.buildIcs({
        uid,
        summary: `${lesson.subject} — ${lesson.student.name}`,
        description: `Урок: ${lesson.subject}\nУченик: ${lesson.student.name}\nФормат: ${lesson.format === 'ONLINE' ? 'Онлайн' : 'Очно'}`,
        dtstart: lesson.scheduledAt,
        dtend: endTime,
        location: lesson.location || undefined,
      });

      const url = this.eventUrl(auth.login, uid);
      const res = await this.caldavRequest('PUT', url, auth.token, ics, 'text/calendar; charset=utf-8');

      if (res.status >= 200 && res.status < 300) {
        await this.prisma.lesson.update({
          where: { id: lesson.id },
          data: { yandexCalendarEventUid: uid },
        });
        return uid;
      }

      this.logger.warn(`Yandex CalDAV PUT returned ${res.status} for lesson ${lesson.id}`);
      return null;
    } catch (err) {
      this.logger.warn(`Failed to create Yandex Calendar event for lesson ${lesson.id}: ${err}`);
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
      yandexCalendarEventUid: string | null;
      student: { name: string };
    },
  ): Promise<void> {
    if (!lesson.yandexCalendarEventUid) return;

    const auth = await this.getTokenAndLogin(userId);
    if (!auth) return;

    try {
      const endTime = new Date(lesson.scheduledAt.getTime() + lesson.duration * 60000);

      const ics = this.buildIcs({
        uid: lesson.yandexCalendarEventUid,
        summary: `${lesson.subject} — ${lesson.student.name}`,
        description: `Урок: ${lesson.subject}\nУченик: ${lesson.student.name}\nФормат: ${lesson.format === 'ONLINE' ? 'Онлайн' : 'Очно'}`,
        dtstart: lesson.scheduledAt,
        dtend: endTime,
        location: lesson.location || undefined,
      });

      const url = this.eventUrl(auth.login, lesson.yandexCalendarEventUid);
      await this.caldavRequest('PUT', url, auth.token, ics, 'text/calendar; charset=utf-8');
    } catch (err) {
      this.logger.warn(`Failed to update Yandex Calendar event for lesson ${lesson.id}: ${err}`);
    }
  }

  async deleteEvent(userId: string, yandexCalendarEventUid: string | null): Promise<void> {
    if (!yandexCalendarEventUid) return;

    const auth = await this.getTokenAndLogin(userId);
    if (!auth) return;

    try {
      const url = this.eventUrl(auth.login, yandexCalendarEventUid);
      await this.caldavRequest('DELETE', url, auth.token);
    } catch (err) {
      this.logger.warn(`Failed to delete Yandex Calendar event ${yandexCalendarEventUid}: ${err}`);
    }
  }

  // ── Full sync (push all PLANNED lessons) ──

  async syncAllLessons(userId: string): Promise<{ synced: number; errors: number }> {
    const auth = await this.getTokenAndLogin(userId);
    if (!auth) throw new BadRequestException('Яндекс.Календарь не подключен');

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
        if (lesson.yandexCalendarEventUid) {
          await this.updateEvent(userId, lesson);
        } else {
          await this.createEvent(userId, lesson);
        }
        synced++;
      } catch {
        errors++;
      }
    }

    return { synced, errors };
  }

  // ── Pull changes from Yandex Calendar ──

  async pullChanges(userId: string): Promise<{
    updated: number;
    cancelled: number;
  }> {
    const auth = await this.getTokenAndLogin(userId);
    if (!auth) throw new BadRequestException('Яндекс.Календарь не подключен');

    const now = new Date();
    const from = new Date(now.getTime() - 60 * 24 * 60 * 60000);
    const to = new Date(now.getTime() + 90 * 24 * 60 * 60000);

    const fmtDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const reportBody = `<?xml version="1.0" encoding="UTF-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${fmtDate(from)}" end="${fmtDate(to)}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

    const calUrl = this.calendarUrl(auth.login);
    const res = await this.caldavRequest(
      'REPORT',
      calUrl,
      auth.token,
      reportBody,
      'application/xml; charset=utf-8',
    );

    if (res.status >= 400) {
      throw new BadRequestException(`Ошибка получения событий из Яндекс.Календаря (${res.status})`);
    }

    // Get all lessons linked to Yandex Calendar
    const user = await this.prisma.user.findFirst({ where: { yandexCalendarLogin: auth.login }, select: { id: true } });
    const linkedLessons = user ? await this.prisma.lesson.findMany({
      where: {
        userId: user.id,
        yandexCalendarEventUid: { not: null },
      },
      select: {
        id: true,
        yandexCalendarEventUid: true,
        scheduledAt: true,
        duration: true,
      },
    }) : [];

    const lessonsByUid = new Map(
      linkedLessons.map((l) => [l.yandexCalendarEventUid!, l]),
    );

    // Parse CalDAV REPORT response to find events
    let updated = 0;
    let cancelled = 0;

    // Simple regex-based parsing of iCalendar data from the CalDAV response
    const calDataBlocks = res.body.match(/<C:calendar-data[^>]*>([\s\S]*?)<\/C:calendar-data>/gi) || [];

    for (const block of calDataBlocks) {
      const icsContent = block
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

      const uidMatch = icsContent.match(/UID:(.+)/);
      if (!uidMatch) continue;

      const uid = uidMatch[1].trim();
      const lesson = lessonsByUid.get(uid);
      if (!lesson) continue;

      // Check if event was cancelled (STATUS:CANCELLED)
      if (/STATUS:CANCELLED/i.test(icsContent)) {
        await this.prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            status: 'CANCELLED_TUTOR',
            cancelReason: 'Отменено в Яндекс.Календаре',
            cancelledAt: new Date(),
          },
        });
        cancelled++;
        continue;
      }

      // Check if the event was moved
      const dtstartMatch = icsContent.match(/DTSTART[^:]*:(\d{8}T\d{6}Z?)/);
      const dtendMatch = icsContent.match(/DTEND[^:]*:(\d{8}T\d{6}Z?)/);

      if (dtstartMatch) {
        const raw = dtstartMatch[1];
        const eventStart = new Date(
          `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(9, 11)}:${raw.slice(11, 13)}:${raw.slice(13, 15)}Z`,
        );

        if (Math.abs(eventStart.getTime() - lesson.scheduledAt.getTime()) > 60000) {
          let newDuration = lesson.duration;

          if (dtendMatch) {
            const rawEnd = dtendMatch[1];
            const eventEnd = new Date(
              `${rawEnd.slice(0, 4)}-${rawEnd.slice(4, 6)}-${rawEnd.slice(6, 8)}T${rawEnd.slice(9, 11)}:${rawEnd.slice(11, 13)}:${rawEnd.slice(13, 15)}Z`,
            );
            newDuration = Math.round((eventEnd.getTime() - eventStart.getTime()) / 60000);
          }

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
    }

    return { updated, cancelled };
  }
}
