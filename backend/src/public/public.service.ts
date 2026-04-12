import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BotPollerService } from '../messenger/bot-poller.service';

type ReminderMethod = 'telegram' | 'max' | 'email' | 'push';

const PORTAL_REVIEW_PREFIX = 'PORTAL_REVIEW:';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private availability: AvailabilityService,
    private notifications: NotificationsService,
    private botPoller: BotPollerService,
  ) {}

  private normalizePolicyAction(
    action: unknown,
    fallback: 'full' | 'half' | 'none' = 'full',
  ): 'full' | 'half' | 'none' {
    const normalized = String(action ?? '').trim().toLowerCase();

    if (normalized === 'full' || normalized === 'full_charge' || normalized === 'charge') {
      return 'full';
    }
    if (normalized === 'half' || normalized === 'half_charge') {
      return 'half';
    }
    if (normalized === 'none' || normalized === 'no_charge') {
      return 'none';
    }

    return fallback;
  }

  private mapCancelPolicy(raw: any) {
    const freeHoursValue = Number(raw?.cancelTimeHours ?? raw?.freeHours ?? 24);
    const freeHours = Number.isFinite(freeHoursValue) && freeHoursValue >= 0
      ? freeHoursValue
      : 24;

    return {
      freeHours,
      lateCancelAction: this.normalizePolicyAction(
        raw?.lateCancelAction ?? raw?.lateAction,
        'full',
      ),
      noShowAction: this.normalizePolicyAction(raw?.noShowAction, 'full'),
    };
  }

  private normalizePhone(value?: string | null): string {
    return (value || '').replace(/\D/g, '');
  }

  private parsePortalReview(content: string): { rating: number; feedback?: string } | null {
    if (!content.startsWith(PORTAL_REVIEW_PREFIX)) return null;
    try {
      const parsed = JSON.parse(content.slice(PORTAL_REVIEW_PREFIX.length));
      const rating = Number(parsed.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
      const feedback =
        typeof parsed.feedback === 'string' && parsed.feedback.trim().length > 0
          ? parsed.feedback.trim()
          : undefined;
      return { rating, feedback };
    } catch {
      return null;
    }
  }

  async getBookingContactStatus(slug: string, phone?: string, email?: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    const normalizedPhone = this.normalizePhone(phone);
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedPhone && !normalizedEmail) {
      return {
        found: false,
        telegramConnected: false,
        maxConnected: false,
        emailKnown: false,
        portalToken: null,
      };
    }

    const students = await this.prisma.student.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        phone: true,
        email: true,
        portalToken: true,
        telegramChatId: true,
        maxChatId: true,
      },
    });

    const matched = students.find((student) => {
      const emailMatch =
        !!normalizedEmail &&
        !!student.email &&
        student.email.trim().toLowerCase() === normalizedEmail;

      const phoneMatch =
        !!normalizedPhone &&
        this.normalizePhone(student.phone) === normalizedPhone;

      return emailMatch || phoneMatch;
    });

    if (!matched) {
      return {
        found: false,
        telegramConnected: false,
        maxConnected: false,
        emailKnown: !!normalizedEmail,
        portalToken: null,
      };
    }

    return {
      found: true,
      telegramConnected: !!matched.telegramChatId,
      maxConnected: !!matched.maxChatId,
      emailKnown: !!matched.email,
      portalToken: matched.portalToken || null,
    };
  }

  async getTutorProfile(slug: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        published: true,
        name: true,
        slug: true,
        subjects: true,
        subjectDetails: true,
        tagline: true,
        aboutText: true,
        avatarUrl: true,
        lessonsCount: true,
        rating: true,
        phone: true,
        whatsapp: true,
        cancelPolicySettings: true,
        createdAt: true,
      },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    const weeklySlotsCount = await this.prisma.tutorAvailability.count({
      where: { userId: user.id },
    });

    // Build enriched subjects from subjectDetails or plain names
    const details = user.subjectDetails as any[] | null;
    const enrichedSubjects = details && Array.isArray(details) && details.length > 0
      ? details.filter((d: any) => d.name?.trim()).map((d: any) => ({
          name: d.name,
          duration: Number(d.duration) || 60,
          price: Number(d.price) || 0,
        }))
      : user.subjects.map((name) => ({ name, duration: 60, price: 0 }));

    // Fetch portal reviews for this tutor
    const reviewNotes = await this.prisma.lessonNote.findMany({
      where: {
        content: { startsWith: PORTAL_REVIEW_PREFIX },
        lesson: { is: { userId: user.id } },
      },
      select: {
        content: true,
        createdAt: true,
        student: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reviews = reviewNotes
      .map((note) => {
        const parsed = this.parsePortalReview(note.content);
        if (!parsed) return null;
        return {
          studentName: note.student.name,
          rating: parsed.rating,
          feedback: parsed.feedback || null,
          date: note.createdAt,
        };
      })
      .filter(Boolean);

    return {
      slug: user.slug,
      name: user.name,
      tagline: user.tagline,
      subjects: enrichedSubjects,
      aboutText: user.aboutText,
      avatarUrl: user.avatarUrl,
      lessonsCount: user.lessonsCount,
      rating: user.rating,
      reviewsCount: reviews.length,
      reviews,
      contacts: {
        phone: user.phone,
        whatsapp: user.whatsapp,
      },
      cancelPolicy: this.mapCancelPolicy(user.cancelPolicySettings as any),
      memberSince: user.createdAt,
      hasWorkingDays: weeklySlotsCount > 0,
    };
  }

  /** Get free time slots for a tutor for the next N days. */
  async getTutorSlots(slug: string, from?: string, to?: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    const fromDate = from ? new Date(from) : new Date();
    const toDate = to
      ? new Date(to)
      : new Date(fromDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

    return this.availability.getFreeSlots(user.id, fromDate, toDate);
  }

  /** Create a booking request for a trial lesson. */
  async createBooking(
    slug: string,
    data: {
      subject: string;
      date: string;
      startTime: string;
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      comment?: string;
      telegramLinkCode?: string;
      maxLinkCode?: string;
      reminderChannels?: ReminderMethod[];
      reminderMinutesBefore?: number;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });

    if (!user || !user.published) throw new NotFoundException('Tutor not found');

    // Verify the slot is actually free
    const date = new Date(data.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const freeSlots = await this.availability.getFreeSlots(user.id, date, nextDay);
    const isAvailable = freeSlots.some(
      (s) => s.date === data.date && s.time === data.startTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('Выбранное время уже занято');
    }

    // Resolve messenger link codes → chat IDs
    const telegramChatId = data.telegramLinkCode
      ? this.botPoller.resolveTelegramLink(data.telegramLinkCode)
      : null;
    const maxChatId = data.maxLinkCode
      ? this.botPoller.resolveMaxLink(data.maxLinkCode)
      : null;

    const allowedChannels: ReminderMethod[] = ['telegram', 'max', 'email', 'push'];
    const reminderChannels = Array.isArray(data.reminderChannels)
      ? data.reminderChannels.filter((ch): ch is ReminderMethod => allowedChannels.includes(ch as ReminderMethod))
      : [];
    const reminderMinutesBefore = Number(data.reminderMinutesBefore);
    const reminderMins = Number.isFinite(reminderMinutesBefore)
      ? Math.max(15, Math.min(7 * 24 * 60, Math.round(reminderMinutesBefore)))
      : undefined;

    const reminderMeta = reminderChannels.length > 0
      ? `Напоминания: ${reminderChannels.map((ch) => {
          switch (ch) {
            case 'telegram': return 'Telegram';
            case 'max': return 'Max';
            case 'email': return 'Почта';
            case 'push': return 'Push';
            default: return ch;
          }
        }).join(', ')}${reminderMins ? ` · за ${reminderMins >= 60 ? `${Math.round(reminderMins / 60)} ч` : `${reminderMins} мин`}` : ''}`
      : null;

    const mergedComment = [data.comment?.trim(), reminderMeta]
      .filter(Boolean)
      .join('\n\n');

    const booking = await this.prisma.bookingRequest.create({
      data: {
        userId: user.id,
        subject: data.subject,
        date,
        startTime: data.startTime,
        duration: 30,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        comment: mergedComment || undefined,
        telegramChatId: telegramChatId || undefined,
        maxChatId: maxChatId || undefined,
      },
    });

    // Create notification for the tutor
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const comment = mergedComment;

    await this.notifications.create({
      userId: user.id,
      type: 'BOOKING_NEW' as any,
      title: 'Новая заявка на занятие',
      description: `${data.clientName} · ${data.subject} · ${dateStr} в ${data.startTime}${
        comment ? ` · Комментарий: ${comment}` : ''
      }`,
      bookingRequestId: booking.id,
      actionUrl: `/notifications`,
    });

    const normalizedClientPhone = this.normalizePhone(data.clientPhone);
    const normalizedClientEmail = data.clientEmail?.trim().toLowerCase();

    let portalToken: string | null = null;
    if (normalizedClientPhone || normalizedClientEmail) {
      const students = await this.prisma.student.findMany({
        where: {
          userId: user.id,
          portalToken: { not: null },
        },
        select: {
          id: true,
          portalToken: true,
          phone: true,
          email: true,
        },
      });

      const matched = students.find((student) => {
        const emailMatch =
          !!normalizedClientEmail &&
          !!student.email &&
          student.email.trim().toLowerCase() === normalizedClientEmail;

        const phoneMatch =
          !!normalizedClientPhone &&
          this.normalizePhone(student.phone) === normalizedClientPhone;

        return emailMatch || phoneMatch;
      });

      portalToken = matched?.portalToken || null;

      // Update existing student's chat IDs if resolved
      if (matched && (telegramChatId || maxChatId)) {
        const updateData: Record<string, string> = {};
        if (telegramChatId) updateData.telegramChatId = telegramChatId;
        if (maxChatId) updateData.maxChatId = maxChatId;
        await this.prisma.student.update({
          where: { id: matched.id },
          data: updateData,
        });
      }
    }

    return {
      ...booking,
      portalToken,
    };
  }
}
