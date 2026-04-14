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
import { MessengerDeliveryService } from '../messenger/messenger-delivery.service';
import { PushNotificationsService } from './push-notifications.service';

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

  constructor(
    private prisma: PrismaService,
    private messenger: MessengerDeliveryService,
    private pushNotifications: PushNotificationsService,
  ) {}

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

  private async maybeSendPushNotification(
    payload: NotificationCreatePayload,
    settings?: Record<string, unknown>,
  ) {
    let channel = payload.channel;

    if (!channel) {
      const settingsToUse = settings || (await this.getSettings(payload.userId));
      channel = this.mapChannel(settingsToUse.channel);
    }

    if (channel !== NotificationChannel.PUSH) {
      return;
    }

    await this.pushNotifications.sendToUser(payload.userId, {
      title: payload.title,
      body: payload.description,
      url: payload.actionUrl || '/notifications',
      type: payload.type,
    });
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

    const created = await this.prisma.notification.create({ data: payload });
    await this.maybeSendPushNotification(payload, settings);
    return created;
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

    const payload: NotificationCreatePayload = {
      userId,
      type: NotificationType.SYSTEM,
      title: 'Еженедельный отчёт',
      description: `За 7 дней: проведено ${completedLessons}, получено ${received.toLocaleString('ru-RU')} ₽, впереди ${upcomingLessons} занятий`,
      actionUrl: '/dashboard',
      channel,
    };

    await this.prisma.notification.create({
      data: payload,
    });
    await this.maybeSendPushNotification(payload, settings);
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

  getPushPublicKey() {
    return this.pushNotifications.getPublicKey();
  }

  subscribePush(userId: string, subscription: unknown) {
    return this.pushNotifications.subscribe(userId, subscription);
  }

  unsubscribePush(userId: string, endpoint: string) {
    return this.pushNotifications.unsubscribe(userId, endpoint);
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

    const payload: NotificationCreatePayload = {
      ...data,
      type,
      channel: this.mapChannel(settings.channel),
    };

    const created = await this.prisma.notification.create({
      data: {
        ...payload,
      },
    });

    await this.maybeSendPushNotification(payload, settings);

    return created;
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
    let portalTokenIssued = false;

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
          telegramChatId: booking.telegramChatId || undefined,
          maxChatId: booking.maxChatId || undefined,
        },
      });
      portalTokenIssued = true;
    } else if (!student.portalToken) {
      // Generate portal link for existing student without one
      const updateData: Record<string, any> = {
        portalToken: randomUUID(),
        portalTokenCreatedAt: new Date(),
      };
      // Also update chat IDs if booking has them and student doesn't
      if (booking.telegramChatId && !student.telegramChatId) {
        updateData.telegramChatId = booking.telegramChatId;
      }
      if (booking.maxChatId && !student.maxChatId) {
        updateData.maxChatId = booking.maxChatId;
      }
      student = await this.prisma.student.update({
        where: { id: student.id },
        data: updateData,
      });
      portalTokenIssued = true;
    } else {
      // Existing student with portal token — still update chat IDs if needed
      const updateData: Record<string, string> = {};
      if (booking.telegramChatId && !student.telegramChatId) {
        updateData.telegramChatId = booking.telegramChatId;
      }
      if (booking.maxChatId && !student.maxChatId) {
        updateData.maxChatId = booking.maxChatId;
      }
      if (Object.keys(updateData).length > 0) {
        student = await this.prisma.student.update({
          where: { id: student.id },
          data: updateData,
        });
      }
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
    const bookingConfirmedPayload: NotificationCreatePayload = {
      userId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Заявка подтверждена',
      description: `${booking.clientName} · ${booking.subject} · ${dateStr} в ${booking.startTime}`,
      bookingRequestId: booking.id,
      studentId: student.id,
      lessonId: lesson.id,
      actionUrl: `/students/${student.id}`,
    };

    await this.prisma.notification.create({
      data: {
        ...bookingConfirmedPayload,
        read: false,
      },
    });
    await this.maybeSendPushNotification(bookingConfirmedPayload);

    // Send messenger notification to student (Telegram / Max)
    const tutorUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, slug: true },
    });
    const tutorName = tutorUser?.name || 'Репетитор';

    const msg = this.messenger.formatLessonAssigned(
      booking.clientName,
      booking.subject,
      dateStr,
      booking.startTime,
      tutorName,
    );

    this.messenger.sendToStudent({
      type: 'lesson_assigned',
      tutorId: userId,
      studentId: student.id,
      message: msg,
    }).catch((e) => { /* fire-and-forget */ });

    if (portalTokenIssued && student.portalToken) {
      const base = process.env.FRONTEND_URL || 'http://localhost:3300';
      const portalUrl = `${base}/t/${tutorUser?.slug || 'tutor'}/s/${student.portalToken}`;
      const portalMsg = this.messenger.formatPortalAccess(tutorName, portalUrl);

      this.messenger.sendToStudent({
        type: 'portal_access',
        tutorId: userId,
        studentId: student.id,
        message: portalMsg,
      }).catch((e) => { /* fire-and-forget */ });
    }

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

  async sendDebtReminder(
    userId: string,
    studentId: string,
    comment?: string,
  ) {
    const [tutor, student] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      this.prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, name: true, userId: true },
      }),
    ]);

    if (!student) throw new NotFoundException('Ученик не найден');
    if (student.userId !== userId) throw new ForbiddenException();

    // Calculate total debt: sum of PENDING+OVERDUE payments
    const debtPayments = await this.prisma.payment.aggregate({
      where: {
        userId,
        studentId,
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      _sum: { amount: true },
    });

    const debtAmount = debtPayments._sum.amount || 0;
    const tutorName = tutor?.name || 'Репетитор';

    const msg = this.messenger.formatPaymentDebt(
      student.name,
      debtAmount,
      tutorName,
      comment,
    );

    const result = await this.messenger.sendToStudent({
      type: 'payment_debt',
      tutorId: userId,
      studentId,
      message: msg,
    });

    // Also create in-app notification for the tutor (record of sending)
    const debtPayload: NotificationCreatePayload = {
      userId,
      studentId,
      type: NotificationType.PAYMENT_OVERDUE,
      title: 'Напоминание об оплате отправлено',
      description: `${student.name} · ${debtAmount.toLocaleString('ru-RU')} ₽`,
      actionUrl: `/students/${studentId}`,
    };

    await this.prisma.notification.create({
      data: {
        ...debtPayload,
        sentAt: new Date(),
      },
    });
    await this.maybeSendPushNotification(debtPayload);

    return {
      sent: result.telegram || result.max,
      telegram: result.telegram,
      max: result.max,
      debtAmount,
    };
  }

  async sendReminder(
    userId: string,
    studentId: string,
    body: {
      type: 'payment' | 'lesson' | 'homework';
      lessonIds?: string[];
      homeworkIds?: string[];
      comment?: string;
      notifyParent?: boolean;
    },
  ) {
    const [tutor, student] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      this.prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          name: true,
          userId: true,
          parentName: true,
          parentPhone: true,
          parentWhatsapp: true,
          parentEmail: true,
          telegramChatId: true,
          maxChatId: true,
        },
      }),
    ]);

    if (!student) throw new NotFoundException('Ученик не найден');
    if (student.userId !== userId) throw new ForbiddenException();

    const tutorName = tutor?.name || 'Репетитор';
    const messages: string[] = [];
    let notificationType: NotificationType;
    let notificationTitle: string;
    let notificationDescription: string;

    if (body.type === 'payment') {
      notificationType = NotificationType.PAYMENT_OVERDUE;

      // Calculate total debt
      const earned = await this.prisma.lesson.aggregate({
        where: { userId, studentId, status: LessonStatus.COMPLETED },
        _sum: { rate: true },
      });
      const paid = await this.prisma.payment.aggregate({
        where: { userId, studentId, status: 'PAID' },
        _sum: { amount: true },
      });
      const debtAmount = (earned._sum.rate || 0) - (paid._sum.amount || 0);

      const msg = this.messenger.formatPaymentDebt(student.name, debtAmount, tutorName, body.comment);
      messages.push(msg);
      notificationTitle = 'Напоминание об оплате отправлено';
      notificationDescription = `${student.name} · ${debtAmount.toLocaleString('ru-RU')} ₽`;

    } else if (body.type === 'lesson') {
      notificationType = NotificationType.LESSON_REMINDER;

      const lessonIds = body.lessonIds || [];
      if (lessonIds.length === 0) {
        throw new BadRequestException('Выберите хотя бы одно занятие');
      }

      const lessons = await this.prisma.lesson.findMany({
        where: {
          id: { in: lessonIds },
          userId,
          studentId,
        },
        orderBy: { scheduledAt: 'asc' },
      });

      if (lessons.length === 0) {
        throw new BadRequestException('Занятия не найдены');
      }

      for (const lesson of lessons) {
        const dateStr = lesson.scheduledAt.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
        });
        const timeStr = lesson.scheduledAt.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const msg = this.messenger.formatLessonReminderForStudent(
          lesson.subject,
          dateStr,
          timeStr,
          tutorName,
          body.comment,
        );
        messages.push(msg);
      }

      const firstLesson = lessons[0];
      const firstDateStr = firstLesson.scheduledAt.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      });
      const firstTimeStr = firstLesson.scheduledAt.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });

      notificationTitle = 'Напоминание о занятии отправлено';
      notificationDescription = `${student.name} · ${firstLesson.subject} · ${firstDateStr} в ${firstTimeStr}` +
        (lessons.length > 1 ? ` (+${lessons.length - 1})` : '');

    } else if (body.type === 'homework') {
      notificationType = NotificationType.SYSTEM;

      const homeworkIds = body.homeworkIds || [];
      if (homeworkIds.length === 0) {
        throw new BadRequestException('Выберите хотя бы одно домашнее задание');
      }

      const homeworks = await this.prisma.homework.findMany({
        where: {
          id: { in: homeworkIds },
          studentId,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (homeworks.length === 0) {
        throw new BadRequestException('Домашние задания не найдены');
      }

      for (const hw of homeworks) {
        const dueStr = hw.dueAt
          ? hw.dueAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
          : undefined;
        const msg = this.messenger.formatHomeworkReminder(hw.task, dueStr, tutorName, body.comment);
        messages.push(msg);
      }

      notificationTitle = 'Напоминание о домашке отправлено';
      notificationDescription = `${student.name} · ${homeworks.length} задани${homeworks.length === 1 ? 'е' : homeworks.length < 5 ? 'я' : 'й'}`;

    } else {
      throw new BadRequestException('Неизвестный тип напоминания');
    }

    // Send all messages to all available channels
    const results = { telegram: false, max: false };
    for (const msg of messages) {
      const result = await this.messenger.sendToStudent({
        type: body.type === 'payment' ? 'payment_debt' : body.type === 'lesson' ? 'lesson_reminder' : 'homework_reminder',
        tutorId: userId,
        studentId,
        message: msg,
      });
      if (result.telegram) results.telegram = true;
      if (result.max) results.max = true;
    }

    // Notify parent (send same messages to parent's messenger channels if available)
    let parentNotified = false;
    if (body.notifyParent && (student.parentPhone || student.parentWhatsapp || student.parentEmail)) {
      // Parent doesn't have separate chat IDs, so we send same message via student's channels
      // with a parent prefix
      for (const msg of messages) {
        const parentMsg = `👨‍👩‍👧 Для родителя (${student.parentName || 'родитель'}):\n\n${msg}`;
        const result = await this.messenger.sendToStudent({
          type: body.type === 'payment' ? 'payment_debt' : body.type === 'lesson' ? 'lesson_reminder' : 'homework_reminder',
          tutorId: userId,
          studentId,
          message: parentMsg,
        });
        if (result.telegram || result.max) parentNotified = true;
      }
    }

    // Create in-app notification for the tutor (record)
    const payload: NotificationCreatePayload = {
      userId,
      studentId,
      type: notificationType,
      title: notificationTitle,
      description: notificationDescription,
      actionUrl: `/students/${studentId}`,
    };

    await this.prisma.notification.create({
      data: { ...payload, sentAt: new Date() },
    });
    await this.maybeSendPushNotification(payload);

    return {
      sent: results.telegram || results.max,
      telegram: results.telegram,
      max: results.max,
      parentNotified,
    };
  }
}
