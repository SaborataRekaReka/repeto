import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessonStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MessengerDeliveryService } from '../messenger/messenger-delivery.service';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messenger: MessengerDeliveryService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleLessonReminders() {
    this.logger.debug('Checking for upcoming lesson reminders...');

    // Find all tutors who have students with messenger chat IDs
    const tutors = await this.prisma.user.findMany({
      where: {
        students: {
          some: {
            OR: [
              { telegramChatId: { not: null } },
              { maxChatId: { not: null } },
            ],
          },
        },
      },
      select: {
        id: true,
        name: true,
        notificationSettings: true,
      },
    });

    for (const tutor of tutors) {
      try {
        await this.sendRemindersForTutor(tutor);
      } catch (error) {
        this.logger.error(`Reminder error for tutor ${tutor.id}: ${error}`);
      }
    }
  }

  private async sendRemindersForTutor(tutor: {
    id: string;
    name: string;
    notificationSettings: any;
  }) {
    const settings = (tutor.notificationSettings as Record<string, unknown>) || {};

    if (settings.studentReminder === false) return;

    const reminderHours = this.parsePositiveNumber(settings.studentReminderHours, 2);

    // Window: lessons starting between now and now + reminderHours
    // But only if they haven't been reminded yet (use sentAt tracking)
    const now = new Date();
    const until = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);

    const lessons = await this.prisma.lesson.findMany({
      where: {
        userId: tutor.id,
        status: LessonStatus.PLANNED,
        scheduledAt: { gte: now, lte: until },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            telegramChatId: true,
            maxChatId: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    for (const lesson of lessons) {
      // Check if we already sent a messenger reminder for this lesson
      const existingReminder = await this.prisma.notification.findFirst({
        where: {
          userId: tutor.id,
          lessonId: lesson.id,
          type: 'LESSON_REMINDER',
          sentAt: { not: null },
        },
        select: { id: true },
      });

      if (existingReminder) continue;

      // Only send if student has messenger chat IDs
      if (!lesson.student.telegramChatId && !lesson.student.maxChatId) continue;

      const date = lesson.scheduledAt;
      const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

      const msg = this.messenger.formatLessonReminder(
        lesson.subject,
        dateStr,
        timeStr,
        tutor.name,
      );

      const result = await this.messenger.sendToStudent({
        type: 'lesson_reminder',
        tutorId: tutor.id,
        studentId: lesson.studentId,
        message: msg,
      });

      if (result.telegram || result.max) {
        // Record that reminder was sent
        await this.prisma.notification.create({
          data: {
            userId: tutor.id,
            studentId: lesson.studentId,
            lessonId: lesson.id,
            type: 'LESSON_REMINDER',
            title: 'Напоминание отправлено ученику',
            description: `${lesson.student.name} · ${lesson.subject} · ${dateStr} в ${timeStr}`,
            actionUrl: '/schedule',
            sentAt: new Date(),
          },
        });

        this.logger.log(`Reminder sent to ${lesson.student.name} for lesson at ${timeStr}`);
      }
    }
  }

  private parsePositiveNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
