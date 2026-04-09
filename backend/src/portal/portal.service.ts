import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FileType, Prisma } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const PORTAL_REVIEW_PREFIX = 'PORTAL_REVIEW:';

@Injectable()
export class PortalService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private parsePortalReview(content?: string | null): {
    rating: number;
    feedback?: string;
  } | null {
    if (!content || !content.startsWith(PORTAL_REVIEW_PREFIX)) return null;

    const json = content.slice(PORTAL_REVIEW_PREFIX.length);
    try {
      const parsed = JSON.parse(json) as { rating?: unknown; feedback?: unknown };
      const rating = Number(parsed.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return null;
      }

      const feedback =
        typeof parsed.feedback === 'string' && parsed.feedback.trim().length > 0
          ? parsed.feedback.trim()
          : undefined;

      return { rating, feedback };
    } catch {
      return null;
    }
  }

  async getPortalData(token: string) {
    const student = await this.prisma.student.findUnique({
      where: { portalToken: token },
      include: {
        user: {
          select: {
            name: true,
            slug: true,
            phone: true,
            whatsapp: true,
            email: true,
            subjects: true,
            avatarUrl: true,
            cancelPolicySettings: true,
          },
        },
        lessons: {
          orderBy: { scheduledAt: 'desc' },
          take: 20,
          select: {
            id: true,
            subject: true,
            scheduledAt: true,
            duration: true,
            format: true,
            rate: true,
            status: true,
            rescheduleNewTime: true,
            notes: {
              where: {
                content: { startsWith: PORTAL_REVIEW_PREFIX },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true },
            },
          },
        },
        payments: {
          orderBy: { date: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            method: true,
            date: true,
            status: true,
          },
        },
        packages: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            subject: true,
            lessonsTotal: true,
            lessonsUsed: true,
            validUntil: true,
          },
        },
        homework: {
          orderBy: { dueAt: 'asc' },
          take: 10,
          select: {
            id: true,
            task: true,
            dueAt: true,
            status: true,
          },
        },
        fileShares: {
          select: {
            file: {
              select: {
                id: true,
                name: true,
                type: true,
                extension: true,
                size: true,
                cloudUrl: true,
              },
            },
          },
        },
      },
    });

    if (!student) throw new NotFoundException('Invalid portal link');

    const now = new Date();

    const formatDate = (d: Date) => {
      const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
      ];
      return `${d.getDate()} ${months[d.getMonth()]}, ${days[d.getDay()]}`;
    };

    const formatTime = (d: Date, durationMin: number) => {
      const start = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const end = new Date(d.getTime() + durationMin * 60000);
      const endStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      return `${start} – ${endStr}`;
    };

    const cancelPolicy = (student.user.cancelPolicySettings as any) || {};
    const freeHours = Number(cancelPolicy.cancelTimeHours ?? cancelPolicy.freeHours ?? 24);

    const mapLesson = (l: typeof student.lessons[0]) => {
      const dt = new Date(l.scheduledAt);
      const hoursUntil = (dt.getTime() - now.getTime()) / (1000 * 60 * 60);

      let status: string;
      if (l.status === 'RESCHEDULE_PENDING') {
        status = 'reschedule_pending';
      } else if (l.status === 'PLANNED') {
        status = 'upcoming';
      } else if (l.status === 'COMPLETED') {
        status = 'completed';
      } else {
        status = 'cancelled';
      }

      const result: Record<string, any> = {
        id: l.id,
        date: formatDate(dt),
        dayOfWeek: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dt.getDay()],
        time: formatTime(dt, l.duration),
        subject: l.subject,
        modality: l.format.toLowerCase(),
        price: l.rate,
        status,
        canCancelFree: hoursUntil >= freeHours,
      };

      if (l.status === 'RESCHEDULE_PENDING' && l.rescheduleNewTime) {
        const newDt = new Date(l.rescheduleNewTime);
        result.rescheduleFrom = `${formatDate(dt)}, ${formatTime(dt, l.duration)}`;
        result.rescheduleTo = `${formatDate(newDt)}, ${formatTime(newDt, l.duration)}`;
      }

      return result;
    };

    const upcomingLessons = student.lessons
      .filter((l) => new Date(l.scheduledAt) > now && (l.status === 'PLANNED' || l.status === 'RESCHEDULE_PENDING'))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .map(mapLesson);

    const recentLessons = student.lessons
      .filter((l) => l.status === 'COMPLETED')
      .slice(0, 5)
      .map((l) => {
        const review = this.parsePortalReview(l.notes[0]?.content);

        return {
          id: l.id,
          date: formatDate(new Date(l.scheduledAt)),
          subject: l.subject,
          status: 'completed',
          price: l.rate,
          rating: review?.rating,
          feedback: review?.feedback,
        };
      });

    // Balance: paid - lessons cost
    const totalPaid = student.payments
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + p.amount, 0);
    const totalEarned = student.lessons
      .filter((l) => l.status === 'COMPLETED')
      .reduce((s, l) => s + l.rate, 0);
    const balance = totalPaid - totalEarned;

    const activePackage = student.packages[0] || null;

    const recentPayments = student.payments.map((p) => ({
      id: p.id,
      date: formatDate(new Date(p.date)),
      amount: p.amount,
      method: p.method || 'Перевод',
      status: p.status.toLowerCase() as 'paid' | 'pending',
    }));

    const homework = student.homework.map((h) => ({
      id: h.id,
      task: h.task,
      due: h.dueAt ? formatDate(new Date(h.dueAt)) : '',
      done: h.status === 'COMPLETED',
    }));

    const portalFiles: Array<{
      id: string;
      name: string;
      type: 'file' | 'folder';
      extension?: string;
      size?: string;
      cloudUrl: string;
      parentId: string | null;
      subject?: string;
    }> = [];

    const addedIds = new Set<string>();

    // Add directly shared files
    for (const share of student.fileShares) {
      if (addedIds.has(share.file.id)) continue;
      addedIds.add(share.file.id);

      if (share.file.type === FileType.FILE && !share.file.cloudUrl) continue;

      portalFiles.push({
        id: share.file.id,
        name: share.file.name,
        type: share.file.type === FileType.FOLDER ? 'folder' : 'file',
        extension: share.file.extension || undefined,
        size: share.file.size || undefined,
        cloudUrl: share.file.cloudUrl,
        parentId: null, // shared items are top-level in the portal
        subject: student.subject || undefined,
      });
    }

    // For shared folders, load all descendants preserving tree structure
    const sharedFolderIds = portalFiles
      .filter((f) => f.type === 'folder')
      .map((f) => f.id);

    if (sharedFolderIds.length > 0) {
      const descendants = await this.collectDescendants(sharedFolderIds);
      for (const d of descendants) {
        if (addedIds.has(d.id)) continue;
        if (d.type === FileType.FILE && !d.cloudUrl) continue;
        addedIds.add(d.id);
        portalFiles.push({
          id: d.id,
          name: d.name,
          type: d.type === FileType.FOLDER ? 'folder' : 'file',
          extension: d.extension || undefined,
          size: d.size || undefined,
          cloudUrl: d.cloudUrl,
          parentId: d.parentId,
          subject: student.subject || undefined,
        });
      }
    }

    return {
      studentName: student.name,
      studentPhone: student.phone || undefined,
      studentEmail: student.email || undefined,
      tutorName: student.user.name,
      tutorSlug: student.user.slug || '',
      tutorPhone: student.user.phone || '',
      tutorWhatsapp: student.user.whatsapp || undefined,
      tutorAvatarUrl: student.user.avatarUrl || null,
      balance,
      ratePerLesson: student.rate,
      package: activePackage
        ? {
            used: activePackage.lessonsUsed,
            total: activePackage.lessonsTotal,
            validUntil: activePackage.validUntil
              ? formatDate(new Date(activePackage.validUntil))
              : '',
          }
        : null,
      cancelPolicy: {
        freeHours,
        lateAction: cancelPolicy.lateAction || 'charge',
        lateCancelCost: cancelPolicy.lateCancelCost,
      },
      upcomingLessons,
      recentLessons,
      recentPayments,
      homework,
      files: portalFiles,
    };
  }

  /**
   * Given folder IDs, recursively collect all descendant records (files and folders).
   */
  private async collectDescendants(folderIds: string[]) {
    const result: Array<{
      id: string;
      name: string;
      type: FileType;
      extension: string | null;
      size: string | null;
      cloudUrl: string;
      parentId: string;
    }> = [];

    let currentIds = folderIds;

    while (currentIds.length > 0) {
      const children = await this.prisma.fileRecord.findMany({
        where: { parentId: { in: currentIds } },
        select: {
          id: true,
          name: true,
          type: true,
          extension: true,
          size: true,
          cloudUrl: true,
          parentId: true,
        },
      });

      const nextFolderIds: string[] = [];
      for (const child of children) {
        result.push({
          id: child.id,
          name: child.name,
          type: child.type,
          extension: child.extension,
          size: child.size,
          cloudUrl: child.cloudUrl,
          parentId: child.parentId!,
        });
        if (child.type === FileType.FOLDER) {
          nextFolderIds.push(child.id);
        }
      }

      currentIds = nextFolderIds;
    }

    return result;
  }

  async cancelLesson(token: string, lessonId: string) {
    const student = await this.prisma.student.findUnique({
      where: { portalToken: token },
    });
    if (!student) throw new NotFoundException('Invalid portal link');

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.studentId !== student.id) throw new ForbiddenException();
    if (lesson.status !== 'PLANNED') {
      throw new ForbiddenException('Only planned lessons can be cancelled');
    }

    const hoursUntil =
      (lesson.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);

    const tutor = await this.prisma.user.findUnique({
      where: { id: student.userId },
      select: { cancelPolicySettings: true },
    });
    const cp = (tutor?.cancelPolicySettings as any) || {};
    const freeHours = Number(cp.cancelTimeHours ?? cp.freeHours ?? 24);

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        status: 'CANCELLED_STUDENT',
        cancelledAt: new Date(),
        cancelReason: 'Cancelled by student via portal',
        lateCancelCharge: hoursUntil < freeHours ? lesson.rate : null,
      },
    });

    const dateStr = lesson.scheduledAt.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const timeStr = lesson.scheduledAt.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.notificationsService.create({
      userId: student.userId,
      type: 'LESSON_CANCELLED',
      title: 'Занятие отменено учеником',
      description: `${student.name} отменил(а) занятие ${dateStr} в ${timeStr}`,
      studentId: student.id,
      lessonId: lesson.id,
    });

    return updated;
  }

  async requestReschedule(
    token: string,
    lessonId: string,
    newDate: string,
    newTime: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { portalToken: token },
    });
    if (!student) throw new NotFoundException('Invalid portal link');

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.studentId !== student.id) throw new ForbiddenException();
    if (lesson.status !== 'PLANNED') {
      throw new ForbiddenException('Only planned lessons can be rescheduled');
    }

    const [hours, minutes] = newTime.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      throw new BadRequestException('Invalid time format');
    }
    const rescheduleNewTime = new Date(newDate);
    if (isNaN(rescheduleNewTime.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    rescheduleNewTime.setHours(hours, minutes, 0, 0);

    if (rescheduleNewTime.getTime() <= Date.now()) {
      throw new BadRequestException('Cannot reschedule to a past time');
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        status: 'RESCHEDULE_PENDING',
        rescheduleNewTime,
      },
    });

    const oldDateStr = lesson.scheduledAt.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const oldTimeStr = lesson.scheduledAt.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newDateStr = rescheduleNewTime.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const newTimeStr = rescheduleNewTime.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.notificationsService.create({
      userId: student.userId,
      type: 'RESCHEDULE_REQUESTED',
      title: 'Запрос на перенос занятия',
      description: `${student.name} просит перенести занятие с ${oldDateStr} ${oldTimeStr} на ${newDateStr} ${newTimeStr}`,
      studentId: student.id,
      lessonId: lesson.id,
    });

    return updated;
  }

  async toggleHomework(token: string, homeworkId: string, done: boolean) {
    const student = await this.prisma.student.findUnique({
      where: { portalToken: token },
    });
    if (!student) throw new NotFoundException('Invalid portal link');

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });
    if (!homework) throw new NotFoundException('Homework not found');
    if (homework.studentId !== student.id) throw new ForbiddenException();

    const updatedHomework = await this.prisma.homework.update({
      where: { id: homeworkId },
      data: { status: done ? 'COMPLETED' : 'PENDING' },
    });

    if (done && homework.status !== 'COMPLETED') {
      await this.notificationsService.create({
        userId: student.userId,
        studentId: student.id,
        type: 'HOMEWORK_SUBMITTED',
        title: 'ДЗ сдано',
        description: `${student.name} отметил домашнее задание как выполненное`,
      });
    }

    return updatedHomework;
  }

  async submitLessonFeedback(
    token: string,
    lessonId: string,
    rating: number,
    feedback?: string,
  ) {
    const normalizedRating = Number(rating);
    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      throw new BadRequestException('Оценка должна быть от 1 до 5');
    }

    const student = await this.prisma.student.findUnique({
      where: { portalToken: token },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Invalid portal link');

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, studentId: true, userId: true, status: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.studentId !== student.id) throw new ForbiddenException();
    if (lesson.status !== 'COMPLETED') {
      throw new BadRequestException('Оценку можно оставить только для проведенного занятия');
    }

    const trimmedFeedback = feedback?.trim();
    const serializedReview = `${PORTAL_REVIEW_PREFIX}${JSON.stringify({
      rating: normalizedRating,
      feedback: trimmedFeedback || null,
    })}`;

    const existing = await this.prisma.lessonNote.findFirst({
      where: {
        lessonId,
        studentId: student.id,
        content: { startsWith: PORTAL_REVIEW_PREFIX },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await this.prisma.lessonNote.update({
        where: { id: existing.id },
        data: { content: serializedReview },
      });
    } else {
      await this.prisma.lessonNote.create({
        data: {
          studentId: student.id,
          lessonId,
          content: serializedReview,
        },
      });
    }

    const reviewNotes = await this.prisma.lessonNote.findMany({
      where: {
        content: { startsWith: PORTAL_REVIEW_PREFIX },
        lesson: { is: { userId: lesson.userId } },
      },
      select: { content: true },
    });

    const ratings = reviewNotes
      .map((note) => this.parsePortalReview(note.content)?.rating)
      .filter((value): value is number => Number.isFinite(value));

    const average =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) /
          10
        : null;

    await this.prisma.user.update({
      where: { id: lesson.userId },
      data: {
        rating: average === null ? null : new Prisma.Decimal(average.toFixed(1)),
      },
    });

    return {
      ok: true,
      rating: average,
      feedback: trimmedFeedback || null,
    };
  }

  async uploadHomeworkFile(
    token: string,
    homeworkId: string,
    file: Express.Multer.File,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { portalToken: token },
    });
    if (!student) throw new NotFoundException('Invalid portal link');

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });
    if (!homework) throw new NotFoundException('Homework not found');
    if (homework.studentId !== student.id) throw new ForbiddenException();

    const uploadsDir = path.join(process.cwd(), 'uploads', 'homework');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '';
    const safeName = crypto.randomUUID();
    const filename = `${safeName}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    const fileUrl = `/uploads/homework/${filename}`;
    const updatedAttachments = [...homework.attachments, fileUrl];

    await this.prisma.homework.update({
      where: { id: homeworkId },
      data: { attachments: updatedAttachments },
    });

    return {
      id: safeName,
      name: file.originalname,
      size: file.size,
      url: fileUrl,
    };
  }

  async removeHomeworkFile(
    token: string,
    homeworkId: string,
    fileUrl: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { portalToken: token },
    });
    if (!student) throw new NotFoundException('Invalid portal link');

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });
    if (!homework) throw new NotFoundException('Homework not found');
    if (homework.studentId !== student.id) throw new ForbiddenException();
    if (!homework.attachments.includes(fileUrl)) {
      throw new NotFoundException('File not found');
    }

    const filepath = path.join(process.cwd(), fileUrl);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    await this.prisma.homework.update({
      where: { id: homeworkId },
      data: {
        attachments: homework.attachments.filter((a) => a !== fileUrl),
      },
    });

    return { ok: true };
  }
}
