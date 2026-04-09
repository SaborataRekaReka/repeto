import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  LessonStatus,
  NotificationChannel,
  NotificationType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type NotificationCreatePayload = {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  studentId?: string;
  lessonId?: string;
  bookingRequestId?: string;
  actionUrl?: string;
  channel?: NotificationChannel;
};

@Injectable()
export class NotificationsService {
  private readonly syncInFlight = new Map<string, Promise<void>>();

  constructor(private prisma: PrismaService) {}

  private async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    });

    if (!user?.notificationSettings || typeof user.notificationSettings !== 'object') {
      return {} as Record<string, unknown>;
    }

    return user.notificationSettings as Record<string, unknown>;
  }

  private parsePositiveNumber(value: unknown, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private mapChannel(value: unknown): NotificationChannel | undefined {
    switch (String(value || '').toLowerCase()) {
      case 'email':
        return NotificationChannel.EMAIL;
      case 'push':
        return NotificationChannel.PUSH;
      case 'whatsapp':
        return NotificationChannel.WHATSAPP;
      case 'sms':
        return NotificationChannel.SMS;
      default:
        return undefined;
    }
  }

  private getChannelLabel(channel?: NotificationChannel) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return 'Email';
      case NotificationChannel.PUSH:
        return 'Push';
      case NotificationChannel.WHATSAPP:
        return 'WhatsApp';
      case NotificationChannel.SMS:
        return 'SMS';
      default:
        return null;
    }
  }

  private shouldCreateNotification(
    type: NotificationType,
    settings: Record<string, unknown>,
  ) {
    if (type === NotificationType.LESSON_CANCELLED) {
      return settings.cancelNotify !== false;
    }

    return true;
  }

  private async createIfMissing(
    where: Prisma.NotificationWhereInput,
    payload: NotificationCreatePayload,
    settings: Record<string, unknown>,
  ) {
    const existing = await this.prisma.notification.findFirst({
      where,
      select: { id: true },
    });

    if (existing) {
      return existing;
    }

    if (!this.shouldCreateNotification(payload.type, settings)) {
      return null;
    }

    return this.prisma.notification.create({ data: payload });
  }

  private async syncSelfReminders(
    userId: string,
    settings: Record<string, unknown>,
    channel?: NotificationChannel,
  ) {
    if (settings.selfReminder === false) return;

    const reminderMins = this.parsePositiveNumber(settings.selfReminderMins, 30);
    const now = new Date();
    const until = new Date(now.getTime() + reminderMins * 60 * 1000);

    const lessons = await this.prisma.lesson.findMany({
      where: {
        userId,
        status: LessonStatus.PLANNED,
        scheduledAt: { gte: now, lte: until },
      },
      include: {
        student: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    for (const lesson of lessons) {
      const dateStr = lesson.scheduledAt.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      });
      const timeStr = lesson.scheduledAt.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });

      await this.createIfMissing(
        {
          userId,
          lessonId: lesson.id,
          type: NotificationType.LESSON_REMINDER,
          title: 'Скоро занятие',
        },
        {
          userId,
          studentId: lesson.studentId,
          lessonId: lesson.id,
          type: NotificationType.LESSON_REMINDER,
          title: 'Скоро занятие',
          description: `${lesson.student.name} · ${lesson.subject} · ${dateStr} в ${timeStr}`,
          actionUrl: '/schedule',
          channel,
        },
        settings,
      );
    }
  }

  private async syncStudentReminderPrompts(
    userId: string,
    settings: Record<string, unknown>,
    channel?: NotificationChannel,
  ) {
    if (settings.studentReminder === false) return;

    const reminderHours = this.parsePositiveNumber(settings.studentReminderHours, 2);
    const now = new Date();
    const until = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);
    const channelLabel = this.getChannelLabel(channel);

    const lessons = await this.prisma.lesson.findMany({
      where: {
        userId,
        status: LessonStatus.PLANNED,
        scheduledAt: { gte: now, lte: until },
      },
      include: {
        student: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    for (const lesson of lessons) {
      const dateStr = lesson.scheduledAt.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      });
      const timeStr = lesson.scheduledAt.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });

      await this.createIfMissing(
        {
          userId,
          lessonId: lesson.id,
          type: NotificationType.SYSTEM,
          title: 'Напомнить ученику',
        },
        {
          userId,
          studentId: lesson.studentId,
          lessonId: lesson.id,
          type: NotificationType.SYSTEM,
          title: 'Напомнить ученику',
          description: `Пора напомнить ${lesson.student.name} о занятии ${dateStr} в ${timeStr}${
            channelLabel ? ` · Канал: ${channelLabel}` : ''
          }`,
          actionUrl: `/students/${lesson.studentId}`,
          channel,
        },
        settings,
      );
    }
  }

  private async syncPaymentReminders(
    userId: string,
    settings: Record<string, unknown>,
    channel?: NotificationChannel,
  ) {
    if (settings.paymentReminder === false) return;

    const reminderDays = this.parsePositiveNumber(settings.paymentReminderDays, 3);
    const threshold = new Date(Date.now() - reminderDays * 24 * 60 * 60 * 1000);

    const payments = await this.prisma.payment.findMany({
      where: {
        userId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        date: { lte: threshold },
      },
      include: {
        student: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    for (const payment of payments) {
      const dateStr = payment.date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      });
      const description = `${payment.student.name} · ${payment.amount.toLocaleString('ru-RU')} ₽ от ${dateStr}`;

      await this.createIfMissing(
        {
          userId,
          studentId: payment.studentId,
          type: NotificationType.PAYMENT_OVERDUE,
          title: 'Напоминание об оплате',
          description,
        },
        {
          userId,
          studentId: payment.studentId,
          type: NotificationType.PAYMENT_OVERDUE,
          title: 'Напоминание об оплате',
          description,
          actionUrl: '/finance/payments',
          channel,
        },
        settings,
      );
    }
  }

  private async syncWeeklyReport(
    userId: string,
    settings: Record<string, unknown>,
    channel?: NotificationChannel,
  ) {
    if (settings.weeklyReport === false) return;

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const reportDay = String(settings.reportDay || 'mon').toLowerCase();
    const dayMap: Record<string, number> = { sun: 0, mon: 1 };
    if (dayMap[reportDay] !== today.getDay()) return;

    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.SYSTEM,
        title: 'Еженедельный отчёт',
        createdAt: { gte: todayStart },
      },
      select: { id: true },
    });
    if (existing) return;

    const periodStart = new Date(todayStart);
    periodStart.setDate(periodStart.getDate() - 6);

    const [completedLessons, upcomingLessons, payments] = await Promise.all([
      this.prisma.lesson.count({
        where: {
          userId,
          status: LessonStatus.COMPLETED,
          scheduledAt: { gte: periodStart, lte: today },
        },
      }),
      this.prisma.lesson.count({
        where: {
          userId,
          status: LessonStatus.PLANNED,
          scheduledAt: {
            gte: today,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          userId,
          status: PaymentStatus.PAID,
          date: { gte: periodStart, lte: today },
        },
        _sum: { amount: true },
      }),
    ]);

    const received = payments._sum.amount || 0;

    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.SYSTEM,
        title: 'Еженедельный отчёт',
        description: `За 7 дней: проведено ${completedLessons}, получено ${received.toLocaleString('ru-RU')} ₽, впереди ${upcomingLessons} занятий`,
        actionUrl: '/dashboard',
        channel,
      },
    });
  }

  private async syncAutomatedNotifications(userId: string) {
    const existingSync = this.syncInFlight.get(userId);
    if (existingSync) {
      await existingSync;
      return;
    }

    const syncPromise = (async () => {
      const settings = await this.getSettings(userId);
      const channel = this.mapChannel(settings.channel);

      await this.syncSelfReminders(userId, settings, channel);
      await this.syncStudentReminderPrompts(userId, settings, channel);
      await this.syncPaymentReminders(userId, settings, channel);
      await this.syncWeeklyReport(userId, settings, channel);
    })();

    this.syncInFlight.set(userId, syncPromise);

    try {
      await syncPromise;
    } finally {
      if (this.syncInFlight.get(userId) === syncPromise) {
        this.syncInFlight.delete(userId);
      }
    }
  }

  async findAll(
    userId: string,
    query: {
      type?: string;
      read?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    await this.syncAutomatedNotifications(userId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };
    if (query.type) where.type = query.type as any;
    if (query.read !== undefined) where.read = query.read;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          student: { select: { id: true, name: true } },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async getUnreadCount(userId: string): Promise<number> {
    await this.syncAutomatedNotifications(userId);

    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException();

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async create(data: {
    userId: string;
    type: any;
    title: string;
    description: string;
    studentId?: string;
    lessonId?: string;
    bookingRequestId?: string;
    actionUrl?: string;
  }) {
    const settings = await this.getSettings(data.userId);
    const type = data.type as NotificationType;

    if (!this.shouldCreateNotification(type, settings)) {
      return null;
    }

    return this.prisma.notification.create({
      data: {
        ...data,
        type,
        channel: this.mapChannel(settings.channel),
      },
    });
  }

  async confirmBooking(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { bookingRequest: true },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException();
    if (!notification.bookingRequestId || !notification.bookingRequest) {
      throw new BadRequestException('Not a booking notification');
    }

    const booking = notification.bookingRequest;
    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Заявка уже обработана');
    }

    // Get tutor's subjectDetails for rate
    const tutor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subjectDetails: true },
    });
    const details = (tutor?.subjectDetails as any[]) || [];
    const subjectInfo = details.find(
      (d) => d.name?.toLowerCase() === booking.subject.toLowerCase(),
    );
    const rate = Number(subjectInfo?.price) || 0;

    // Find or create student
    let student = await this.prisma.student.findFirst({
      where: {
        userId,
        name: booking.clientName,
        phone: booking.clientPhone,
      },
    });

    if (!student) {
      student = await this.prisma.student.create({
        data: {
          userId,
          name: booking.clientName,
          phone: booking.clientPhone,
          email: booking.clientEmail || undefined,
          subject: booking.subject,
          rate,
          status: 'ACTIVE',
          portalToken: randomUUID(),
          portalTokenCreatedAt: new Date(),
        },
      });
    } else if (!student.portalToken) {
      // Generate portal link for existing student without one
      student = await this.prisma.student.update({
        where: { id: student.id },
        data: {
          portalToken: randomUUID(),
          portalTokenCreatedAt: new Date(),
        },
      });
    }

    // Build scheduledAt from booking date + startTime
    const [hours, minutes] = booking.startTime.split(':').map(Number);
    const scheduledAt = new Date(booking.date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    // Create lesson
    const lesson = await this.prisma.lesson.create({
      data: {
        userId,
        studentId: student.id,
        subject: booking.subject,
        scheduledAt,
        duration: booking.duration,
        rate,
        format: 'ONLINE',
        status: 'PLANNED',
      },
    });

    await this.prisma.bookingRequest.update({
      where: { id: booking.id },
      data: { status: 'CONFIRMED' },
    });

    const dateStr = booking.date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    // Create confirmation notification linked to student & lesson
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'BOOKING_CONFIRMED',
        title: 'Заявка подтверждена',
        description: `${booking.clientName} · ${booking.subject} · ${dateStr} в ${booking.startTime}`,
        bookingRequestId: booking.id,
        studentId: student.id,
        lessonId: lesson.id,
        read: false,
      },
    });

    return { status: 'CONFIRMED', studentId: student.id, lessonId: lesson.id };
  }

  async rejectBooking(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { bookingRequest: true },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException();
    if (!notification.bookingRequestId || !notification.bookingRequest) {
      throw new BadRequestException('Not a booking notification');
    }

    const booking = notification.bookingRequest;
    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Заявка уже обработана');
    }

    await this.prisma.bookingRequest.update({
      where: { id: booking.id },
      data: { status: 'REJECTED' },
    });

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return { status: 'REJECTED' };
  }

  async confirmReschedule(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { lesson: true },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException();
    if (notification.type !== 'RESCHEDULE_REQUESTED' || !notification.lessonId || !notification.lesson) {
      throw new BadRequestException('Not a reschedule notification');
    }

    const lesson = notification.lesson;
    if (lesson.status !== 'RESCHEDULE_PENDING' || !lesson.rescheduleNewTime) {
      throw new BadRequestException('Lesson is not pending reschedule');
    }

    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        scheduledAt: lesson.rescheduleNewTime,
        status: 'PLANNED',
        rescheduleNewTime: null,
      },
    });

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return { status: 'CONFIRMED', lessonId: lesson.id };
  }

  async rejectReschedule(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { lesson: true },
    });

    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException();
    if (notification.type !== 'RESCHEDULE_REQUESTED' || !notification.lessonId || !notification.lesson) {
      throw new BadRequestException('Not a reschedule notification');
    }

    const lesson = notification.lesson;

    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        status: 'PLANNED',
        rescheduleNewTime: null,
      },
    });

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return { status: 'REJECTED', lessonId: lesson.id };
  }
}
