import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { TelegramService } from './telegram.service';
import { MaxService } from './max.service';

export type MessengerRecipient = {
  telegramChatId?: string | null;
  maxChatId?: string | null;
};

export type NotificationEvent = {
  type:
    | 'lesson_assigned'
    | 'lesson_cancelled'
    | 'lesson_rescheduled'
    | 'payment_debt'
    | 'lesson_reminder'
    | 'homework_reminder'
    | 'portal_access';
  tutorId: string;
  studentId: string;
  message: string;
  channels?: NotificationChannel[];
};

export type MessengerOutboxRecord = {
  id: string;
  createdAt: string;
  deliveryMode: 'record' | 'live';
  eventType: NotificationEvent['type'];
  tutorId: string;
  studentId: string;
  message: string;
  channels: NotificationChannel[];
  results: {
    telegram: boolean;
    max: boolean;
  };
};

@Injectable()
export class MessengerDeliveryService {
  private readonly logger = new Logger(MessengerDeliveryService.name);
  private readonly outbox: MessengerOutboxRecord[] = [];
  private readonly outboxLimit = 500;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly max: MaxService,
    private readonly cfg: AppConfigService,
  ) {}

  private isTestingEnvironment() {
    return !this.cfg.isProduction;
  }

  private resolveDeliveryMode(): 'record' | 'live' {
    if (!this.isTestingEnvironment()) {
      return 'live';
    }

    const configuredMode = this.cfg.messengerTestMode ? 'record' : 'live';
    if (configuredMode === 'record') {
      return 'record';
    }

    return 'live';
  }

  private pushOutbox(
    event: NotificationEvent,
    channels: NotificationChannel[],
    results: { telegram: boolean; max: boolean },
    deliveryMode: 'record' | 'live',
  ) {
    if (!this.isTestingEnvironment()) {
      return;
    }

    this.outbox.push({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      deliveryMode,
      eventType: event.type,
      tutorId: event.tutorId,
      studentId: event.studentId,
      message: event.message,
      channels,
      results,
    });

    if (this.outbox.length > this.outboxLimit) {
      this.outbox.splice(0, this.outbox.length - this.outboxLimit);
    }
  }

  async sendToStudent(event: NotificationEvent): Promise<{ telegram: boolean; max: boolean }> {
    const results = { telegram: false, max: false };

    const [tutor, student] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: event.tutorId },
        select: {
          notificationSettings: true,
        },
      }),
      this.prisma.student.findUnique({
        where: { id: event.studentId },
        select: {
          telegramChatId: true,
          maxChatId: true,
          name: true,
        },
      }),
    ]);

    if (!tutor || !student) {
      this.logger.warn(`Missing tutor or student for event: ${event.type}`);
      return results;
    }

    const settings = (tutor.notificationSettings as Record<string, unknown>) || {};
    const channels = event.channels || this.resolveChannels(settings);
    const deliveryMode = this.resolveDeliveryMode();

    if (deliveryMode === 'record') {
      results.telegram = channels.includes(NotificationChannel.TELEGRAM);
      results.max = channels.includes(NotificationChannel.MAX);
      this.pushOutbox(event, channels, results, deliveryMode);
      return results;
    }

    // Send via Telegram (global Repeto bot)
    if (channels.includes(NotificationChannel.TELEGRAM)) {
      if (this.telegram.isConfigured && student.telegramChatId) {
        results.telegram = await this.telegram.sendMessage(
          student.telegramChatId,
          event.message,
        );
      } else {
        this.logger.debug(`Telegram skip: bot not configured or no chat ID for student ${student.name}`);
      }
    }

    // Send via Max (global Repeto bot)
    if (channels.includes(NotificationChannel.MAX)) {
      if (this.max.isConfigured && student.maxChatId) {
        results.max = await this.max.sendMessage(
          student.maxChatId,
          event.message,
        );
      } else {
        this.logger.debug(`Max skip: bot not configured or no chat ID for student ${student.name}`);
      }
    }

    this.pushOutbox(event, channels, results, deliveryMode);

    return results;
  }

  getTestingMode() {
    return this.resolveDeliveryMode();
  }

  getOutboxForTutor(tutorId: string, studentId?: string) {
    if (!this.isTestingEnvironment()) {
      throw new ForbiddenException('Messenger outbox is disabled in production');
    }

    const records = this.outbox.filter((row) => {
      if (row.tutorId !== tutorId) return false;
      if (studentId && row.studentId !== studentId) return false;
      return true;
    });

    return {
      mode: this.resolveDeliveryMode(),
      count: records.length,
      records,
    };
  }

  clearOutboxForTutor(tutorId: string) {
    if (!this.isTestingEnvironment()) {
      throw new ForbiddenException('Messenger outbox is disabled in production');
    }

    const before = this.outbox.length;
    const filtered = this.outbox.filter((row) => row.tutorId !== tutorId);
    this.outbox.length = 0;
    this.outbox.push(...filtered);

    return {
      mode: this.resolveDeliveryMode(),
      cleared: before - this.outbox.length,
      remaining: this.outbox.length,
    };
  }

  async sendToTutor(
    tutorId: string,
    message: string,
    channels?: NotificationChannel[],
  ): Promise<{ telegram: boolean; max: boolean }> {
    const results = { telegram: false, max: false };

    // For tutor self-notifications, we'd need the tutor's own chat IDs
    // Currently the tutor receives in-app notifications; messenger delivery
    // is primarily for students. This can be extended later.
    return results;
  }

  private resolveChannels(settings: Record<string, unknown>): NotificationChannel[] {
    const configured = settings.channels;
    if (Array.isArray(configured)) {
      const mapped = configured
        .map((value) => String(value).toUpperCase())
        .filter((value): value is keyof typeof NotificationChannel => value in NotificationChannel)
        .map((value) => NotificationChannel[value])
        .filter(
          (channel) =>
            channel === NotificationChannel.TELEGRAM || channel === NotificationChannel.MAX,
        );

      return Array.from(new Set(mapped));
    }

    const channel = String(settings.channel || '').toLowerCase();

    if (channel === 'all') {
      return [NotificationChannel.TELEGRAM, NotificationChannel.MAX];
    }

    switch (channel) {
      case 'telegram':
        return [NotificationChannel.TELEGRAM];
      case 'max':
        return [NotificationChannel.MAX];
      default:
        return [];
    }
  }

  formatLessonAssigned(
    studentName: string,
    subject: string,
    date: string,
    time: string,
    tutorName: string,
  ): string {
    return `📚 Назначено занятие\n\n` +
      `Предмет: ${subject}\n` +
      `Дата: ${date}\n` +
      `Время: ${time}\n` +
      `Репетитор: ${tutorName}`;
  }

  formatPortalAccess(
    tutorName: string,
    portalUrl: string,
  ): string {
    return `🔗 Доступ в портал ученика\n\n` +
      `Репетитор: ${tutorName}\n` +
      `Ссылка: ${portalUrl}`;
  }

  formatLessonCancelled(
    subject: string,
    date: string,
    time: string,
    reason?: string,
  ): string {
    let msg = `❌ Занятие отменено\n\n` +
      `Предмет: ${subject}\n` +
      `Дата: ${date}\n` +
      `Время: ${time}`;
    if (reason) msg += `\nПричина: ${reason}`;
    return msg;
  }

  formatLessonRescheduled(
    subject: string,
    oldDate: string,
    oldTime: string,
    newDate: string,
    newTime: string,
  ): string {
    return `🔄 Занятие перенесено\n\n` +
      `Предмет: ${subject}\n` +
      `Было: ${oldDate} в ${oldTime}\n` +
      `Стало: ${newDate} в ${newTime}`;
  }

  formatPaymentDebt(
    studentName: string,
    amount: number,
    tutorName: string,
    comment?: string,
  ): string {
    let msg = `💳 Напоминание об оплате\n\n` +
      `Сумма: ${amount.toLocaleString('ru-RU')} ₽\n` +
      `Репетитор: ${tutorName}`;
    if (comment) msg += `\n\n${comment}`;
    return msg;
  }

  formatLessonReminder(
    subject: string,
    date: string,
    time: string,
    tutorName: string,
  ): string {
    return `⏰ Напоминание о занятии\n\n` +
      `Предмет: ${subject}\n` +
      `Дата: ${date}\n` +
      `Время: ${time}\n` +
      `Репетитор: ${tutorName}`;
  }

  formatHomeworkReminder(
    task: string,
    dueDate?: string,
    tutorName?: string,
    comment?: string,
  ): string {
    let msg = `📝 Напоминание о домашнем задании\n\n` +
      `Задание: ${task}`;
    if (dueDate) msg += `\nСрок сдачи: ${dueDate}`;
    if (tutorName) msg += `\nРепетитор: ${tutorName}`;
    if (comment) msg += `\n\n${comment}`;
    return msg;
  }

  formatLessonReminderForStudent(
    subject: string,
    date: string,
    time: string,
    tutorName: string,
    comment?: string,
  ): string {
    let msg = `⏰ Напоминание о занятии\n\n` +
      `Предмет: ${subject}\n` +
      `Дата: ${date}\n` +
      `Время: ${time}\n` +
      `Репетитор: ${tutorName}`;
    if (comment) msg += `\n\n${comment}`;
    return msg;
  }
}
