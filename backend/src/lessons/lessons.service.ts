import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, LessonStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';
import { YandexCalendarService } from '../yandex-calendar/yandex-calendar.service';
import { MessengerDeliveryService } from '../messenger/messenger-delivery.service';
import { CreateLessonDto, UpdateLessonDto, UpdateLessonStatusDto } from './dto';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private googleCalendar: GoogleCalendarService,
    private yandexCalendar: YandexCalendarService,
    private messenger: MessengerDeliveryService,
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
      lateCancelCost:
        Number.isFinite(Number(raw?.lateCancelCost)) && Number(raw?.lateCancelCost) > 0
          ? Number(raw?.lateCancelCost)
          : undefined,
    };
  }

  private calculatePenalty(rate: number, action: 'full' | 'half' | 'none') {
    if (action === 'none') return null;
    if (action === 'half') return Math.round(rate / 2);
    return rate;
  }

  private parseFromBoundary(value: string): Date {
    return value.includes('T')
      ? new Date(value)
      : new Date(`${value}T00:00:00.000Z`);
  }

  private parseToBoundary(value: string): Date {
    return value.includes('T')
      ? new Date(value)
      : new Date(`${value}T23:59:59.999Z`);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  private normalizeLessonNote(note: unknown): string | null {
    if (typeof note !== 'string') return null;
    const normalized = note.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private async upsertTutorLessonNote(
    lessonId: string,
    studentId: string,
    note: unknown,
  ) {
    if (typeof note !== 'string') return;

    const normalized = this.normalizeLessonNote(note);
    const existing = await this.prisma.lessonNote.findFirst({
      where: {
        lessonId,
        NOT: {
          content: {
            startsWith: 'PORTAL_REVIEW:',
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });

    if (!normalized) {
      if (existing) {
        await this.prisma.lessonNote.delete({ where: { id: existing.id } });
      }
      return;
    }

    if (existing) {
      await this.prisma.lessonNote.update({
        where: { id: existing.id },
        data: { content: normalized },
      });
      return;
    }

    await this.prisma.lessonNote.create({
      data: {
        studentId,
        lessonId,
        content: normalized,
      },
    });
  }

  private async getTutorName(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return user?.name || 'Репетитор';
  }

  private notifyStudentLessonAssigned(userId: string, lesson: any) {
    this.getTutorName(userId).then((tutorName) => {
      const date = new Date(lesson.scheduledAt);
      const msg = this.messenger.formatLessonAssigned(
        lesson.student?.name || '',
        lesson.subject,
        this.formatDate(date),
        this.formatTime(date),
        tutorName,
      );
      this.messenger.sendToStudent({
        type: 'lesson_assigned',
        tutorId: userId,
        studentId: lesson.studentId,
        message: msg,
      }).catch(() => {});
    });
  }

  async findAll(
    userId: string,
    query: { from?: string; to?: string; studentId?: string },
  ) {
    const where: Prisma.LessonWhereInput = { userId };

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.from || query.to) {
      where.scheduledAt = {};
      if (query.from) where.scheduledAt.gte = this.parseFromBoundary(query.from);
      if (query.to) where.scheduledAt.lte = this.parseToBoundary(query.to);
    }

    return this.prisma.lesson.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, subject: true } },
        notes: {
          where: {
            NOT: {
              content: {
                startsWith: 'PORTAL_REVIEW:',
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { content: true, updatedAt: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, subject: true } },
        notes: true,
        homework: true,
      },
    });

    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.userId !== userId) throw new ForbiddenException();

    return lesson;
  }

  async create(userId: string, dto: CreateLessonDto) {
    const { recurrence, scheduledAt, notes, ...rest } = dto;
    const normalizedNote = this.normalizeLessonNote(notes);

    if (recurrence?.enabled && recurrence.until && recurrence.weekdays?.length) {
      const groupId = randomUUID();
      const lessons: Prisma.LessonCreateManyInput[] = [];
      const start = new Date(scheduledAt);
      const until = new Date(recurrence.until);

      const current = new Date(start);
      while (current <= until) {
        const dayOfWeek = current.getDay() || 7; // convert Sunday 0 -> 7
        if (recurrence.weekdays.includes(dayOfWeek)) {
          lessons.push({
            ...rest,
            userId,
            scheduledAt: new Date(current),
            recurrenceGroupId: groupId,
            format: rest.format || 'ONLINE',
          });
        }
        current.setDate(current.getDate() + 1);
      }

      if (lessons.length === 0) {
        lessons.push({
          ...rest,
          userId,
          scheduledAt: new Date(scheduledAt),
          recurrenceGroupId: groupId,
          format: rest.format || 'ONLINE',
        });
      }

      await this.prisma.lesson.createMany({ data: lessons });
      const created = await this.prisma.lesson.findMany({
        where: { recurrenceGroupId: groupId },
        include: { student: { select: { id: true, name: true, subject: true } } },
        orderBy: { scheduledAt: 'asc' },
      });

      if (normalizedNote && created.length > 0) {
        await this.prisma.lessonNote.createMany({
          data: created.map((lesson) => ({
            studentId: lesson.studentId,
            lessonId: lesson.id,
            content: normalizedNote,
          })),
        });
      }

      // Sync to Google Calendar (fire-and-forget)
      for (const lesson of created) {
        this.googleCalendar.createEvent(userId, lesson).catch(() => {});
        this.yandexCalendar.createEvent(userId, lesson).catch(() => {});
        this.notifyStudentLessonAssigned(userId, lesson);
      }

      return created;
    }

    const single = await this.prisma.lesson.create({
      data: {
        ...rest,
        userId,
        scheduledAt: new Date(scheduledAt),
        format: rest.format || 'ONLINE',
      },
      include: { student: { select: { id: true, name: true, subject: true } } },
    });

    await this.upsertTutorLessonNote(single.id, single.studentId, notes);

    // Sync to Google Calendar (fire-and-forget)
    this.googleCalendar.createEvent(userId, single).catch(() => {});
    this.yandexCalendar.createEvent(userId, single).catch(() => {});

    // Notify student via messenger (fire-and-forget)
    this.notifyStudentLessonAssigned(userId, single);

    return single;
  }

  async update(id: string, userId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.userId !== userId) throw new ForbiddenException();

    const { notes, ...lessonChanges } = dto;
    const data: any = { ...lessonChanges };
    if (lessonChanges.scheduledAt) data.scheduledAt = new Date(lessonChanges.scheduledAt);

    const updated = await this.prisma.lesson.update({
      where: { id },
      data,
      include: { student: { select: { id: true, name: true, subject: true } } },
    });

    await this.upsertTutorLessonNote(id, lesson.studentId, notes);

    // Sync to Google Calendar (fire-and-forget)
    this.googleCalendar.updateEvent(userId, updated).catch(() => {});
    this.yandexCalendar.updateEvent(userId, updated).catch(() => {});

    // If scheduledAt changed, notify student about reschedule
    if (lessonChanges.scheduledAt && lesson.scheduledAt.toISOString() !== new Date(lessonChanges.scheduledAt).toISOString()) {
      const oldDate = lesson.scheduledAt;
      const newDate = new Date(lessonChanges.scheduledAt);
      const msg = this.messenger.formatLessonRescheduled(
        updated.subject,
        this.formatDate(oldDate),
        this.formatTime(oldDate),
        this.formatDate(newDate),
        this.formatTime(newDate),
      );
      this.messenger.sendToStudent({
        type: 'lesson_rescheduled',
        tutorId: userId,
        studentId: lesson.studentId,
        message: msg,
      }).catch(() => {});
    }

    return updated;
  }

  async updateStatus(id: string, userId: string, dto: UpdateLessonStatusDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.userId !== userId) throw new ForbiddenException();

    const data: Prisma.LessonUpdateInput = {
      status: dto.status,
    };

    if (dto.cancelReason) data.cancelReason = dto.cancelReason;

    if (
      dto.status === LessonStatus.CANCELLED_STUDENT ||
      dto.status === LessonStatus.CANCELLED_TUTOR
    ) {
      data.cancelledAt = new Date();
    }

    // If completed, try to increment package lessonsUsed
    if (dto.status === LessonStatus.COMPLETED) {
      const activePackage = await this.prisma.package.findFirst({
        where: {
          studentId: lesson.studentId,
          userId,
          status: 'ACTIVE',
          subject: lesson.subject,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (activePackage) {
        await this.prisma.package.update({
          where: { id: activePackage.id },
          data: {
            lessonsUsed: { increment: 1 },
            status:
              activePackage.lessonsUsed + 1 >= activePackage.lessonsTotal
                ? 'COMPLETED'
                : 'ACTIVE',
          },
        });
      }
    }

    if (
      dto.status === LessonStatus.CANCELLED_STUDENT ||
      dto.status === LessonStatus.NO_SHOW
    ) {
      const hoursUntil =
        (lesson.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
      const tutor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { cancelPolicySettings: true },
      });

      const cancelPolicy = this.mapCancelPolicy(tutor?.cancelPolicySettings as any);

      if (dto.status === LessonStatus.CANCELLED_STUDENT) {
        if (hoursUntil < cancelPolicy.freeHours) {
          data.lateCancelCharge =
            cancelPolicy.lateCancelCost ??
            this.calculatePenalty(lesson.rate, cancelPolicy.lateCancelAction);
        } else {
          data.lateCancelCharge = null;
        }
      }

      if (dto.status === LessonStatus.NO_SHOW) {
        data.lateCancelCharge = this.calculatePenalty(
          lesson.rate,
          cancelPolicy.noShowAction,
        );
      }
    }

    // Save optional note
    if (dto.note) {
      await this.prisma.lessonNote.create({
        data: {
          studentId: lesson.studentId,
          lessonId: id,
          content: dto.note,
        },
      });
    }

    const updated = await this.prisma.lesson.update({ where: { id }, data });

    // Cancel GCal event on cancellation/no-show
    if (
      dto.status === LessonStatus.CANCELLED_STUDENT ||
      dto.status === LessonStatus.CANCELLED_TUTOR ||
      dto.status === LessonStatus.NO_SHOW
    ) {
      this.googleCalendar.cancelEvent(userId, lesson.googleCalendarEventId).catch(() => {});
      this.yandexCalendar.deleteEvent(userId, lesson.yandexCalendarEventUid).catch(() => {});

      // Notify student about cancellation via messenger
      const date = lesson.scheduledAt;
      const msg = this.messenger.formatLessonCancelled(
        lesson.subject,
        this.formatDate(date),
        this.formatTime(date),
        dto.cancelReason,
      );
      this.messenger.sendToStudent({
        type: 'lesson_cancelled',
        tutorId: userId,
        studentId: lesson.studentId,
        message: msg,
      }).catch(() => {});
    }

    return updated;
  }

  async remove(id: string, userId: string, deleteRecurrence = false) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.userId !== userId) throw new ForbiddenException();

    if (deleteRecurrence && lesson.recurrenceGroupId) {
      // Delete GCal events for all lessons in the recurrence group
      const groupLessons = await this.prisma.lesson.findMany({
        where: {
          recurrenceGroupId: lesson.recurrenceGroupId,
          userId,
          scheduledAt: { gte: lesson.scheduledAt },
          googleCalendarEventId: { not: null },
        },
        select: { googleCalendarEventId: true },
      });
      for (const l of groupLessons) {
        this.googleCalendar.deleteEvent(userId, l.googleCalendarEventId).catch(() => {});
      }

      // Delete Yandex Calendar events for all lessons in the recurrence group
      const groupLessonsYandex = await this.prisma.lesson.findMany({
        where: {
          recurrenceGroupId: lesson.recurrenceGroupId,
          userId,
          scheduledAt: { gte: lesson.scheduledAt },
          yandexCalendarEventUid: { not: null },
        },
        select: { yandexCalendarEventUid: true },
      });
      for (const l of groupLessonsYandex) {
        this.yandexCalendar.deleteEvent(userId, l.yandexCalendarEventUid).catch(() => {});
      }

      return this.prisma.lesson.deleteMany({
        where: {
          recurrenceGroupId: lesson.recurrenceGroupId,
          userId,
          scheduledAt: { gte: lesson.scheduledAt },
        },
      });
    }

    // Delete GCal event (fire-and-forget)
    this.googleCalendar.deleteEvent(userId, lesson.googleCalendarEventId).catch(() => {});
    this.yandexCalendar.deleteEvent(userId, lesson.yandexCalendarEventUid).catch(() => {});

    return this.prisma.lesson.delete({ where: { id } });
  }
}
