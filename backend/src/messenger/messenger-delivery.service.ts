import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
    | 'portal_access';
  tutorId: string;
  studentId: string;
  message: string;
  channels?: NotificationChannel[];
};

@Injectable()
export class MessengerDeliveryService {
  private readonly logger = new Logger(MessengerDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly max: MaxService,
  ) {}

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

    return results;
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

      if (mapped.length > 0) {
        return Array.from(new Set(mapped));
      }
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
        // If channel is email/push/whatsapp/sms, return both messenger channels
        // (messenger delivery is additional to the in-app channel)
        return [NotificationChannel.TELEGRAM, NotificationChannel.MAX];
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
}
