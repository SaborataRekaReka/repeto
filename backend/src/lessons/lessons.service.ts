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
import { CreateLessonDto, UpdateLessonDto, UpdateLessonStatusDto } from './dto';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private googleCalendar: GoogleCalendarService,
    private yandexCalendar: YandexCalendarService,
  ) {}

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
      include: { student: { select: { id: true, name: true, subject: true } } },
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
    const { recurrence, scheduledAt, ...rest } = dto;

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

      // Sync to Google Calendar (fire-and-forget)
      for (const lesson of created) {
        this.googleCalendar.createEvent(userId, lesson).catch(() => {});
        this.yandexCalendar.createEvent(userId, lesson).catch(() => {});
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

    // Sync to Google Calendar (fire-and-forget)
    this.googleCalendar.createEvent(userId, single).catch(() => {});
    this.yandexCalendar.createEvent(userId, single).catch(() => {});

    return single;
  }

  async update(id: string, userId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.userId !== userId) throw new ForbiddenException();

    const data: any = { ...dto };
    if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);

    const updated = await this.prisma.lesson.update({
      where: { id },
      data,
      include: { student: { select: { id: true, name: true, subject: true } } },
    });

    // Sync to Google Calendar (fire-and-forget)
    this.googleCalendar.updateEvent(userId, updated).catch(() => {});
    this.yandexCalendar.updateEvent(userId, updated).catch(() => {});

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

    // Late cancel charge: if student cancels < 24h before
    if (dto.status === LessonStatus.CANCELLED_STUDENT) {
      const hoursUntil =
        (lesson.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
      const tutor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { cancelPolicySettings: true },
      });
      const cancelPolicy = (tutor?.cancelPolicySettings as any) || {};
      const freeHours = Number(
        cancelPolicy.cancelTimeHours ?? cancelPolicy.freeHours ?? 24,
      );
      if (hoursUntil < freeHours) {
        data.lateCancelCharge = lesson.rate;
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
