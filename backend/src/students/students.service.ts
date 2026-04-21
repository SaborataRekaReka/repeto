import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FileType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { StudentAuthService } from '../student-auth/student-auth.service';

const LOCKED_PERSONAL_FIELDS_FOR_LINKED_STUDENT = [
  'name',
  'grade',
  'age',
  'phone',
  'whatsapp',
  'telegram',
  'email',
  'parentName',
  'parentPhone',
  'parentWhatsapp',
  'parentTelegram',
  'parentEmail',
] as const;

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private studentAuth: StudentAuthService,
  ) {}

  private readonly homeworkWithMaterialsInclude = {
    lesson: {
      select: {
        id: true,
        subject: true,
        scheduledAt: true,
      },
    },
    materials: {
      include: {
        file: {
          select: {
            id: true,
            name: true,
            type: true,
            extension: true,
            size: true,
            cloudUrl: true,
            cloudProvider: true,
          },
        },
      },
    },
  } as const;

  private async resolveHomeworkFileIds(userId: string, fileIds?: string[]) {
    if (fileIds === undefined) {
      return undefined;
    }

    if (!Array.isArray(fileIds)) {
      throw new BadRequestException('fileIds must be an array');
    }

    const uniqueIds = Array.from(
      new Set(
        fileIds
          .filter((id): id is string => typeof id === 'string')
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    );

    if (uniqueIds.length === 0) {
      return [];
    }

    const files = await this.prisma.fileRecord.findMany({
      where: {
        id: { in: uniqueIds },
        userId,
        type: { in: [FileType.FILE, FileType.FOLDER] },
      },
      select: { id: true },
    });

    if (files.length !== uniqueIds.length) {
      throw new BadRequestException('Некоторые материалы недоступны для прикрепления');
    }

    return uniqueIds;
  }

  private mapHomework(homework: any) {
    const linkedFiles = (homework.materials || []).map((material: any) => ({
      id: material.file.id,
      name: material.file.name,
      url: material.file.cloudUrl,
      cloudUrl: material.file.cloudUrl,
      type: material.file.type === FileType.FOLDER ? 'folder' : 'file',
      extension: material.file.extension || undefined,
      size: material.file.size || undefined,
      cloudProvider:
        material.file.cloudProvider === 'GOOGLE_DRIVE' ? 'google-drive' : 'yandex-disk',
    }));

    const { materials, lesson, ...rest } = homework;
    return {
      ...rest,
      lessonId: lesson?.id || homework.lessonId || null,
      lesson: lesson
        ? {
            id: lesson.id,
            subject: lesson.subject,
            scheduledAt: lesson.scheduledAt,
          }
        : null,
      linkedFiles,
    };
  }

  private async validateHomeworkLessonLink(params: {
    userId: string;
    studentId: string;
    lessonId: string;
  }) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: params.lessonId },
      select: {
        id: true,
        userId: true,
        studentId: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Занятие не найдено');
    }

    if (lesson.userId !== params.userId) {
      throw new ForbiddenException();
    }

    if (lesson.studentId !== params.studentId) {
      throw new BadRequestException('Занятие не принадлежит выбранному ученику');
    }
  }

  async findAll(
    userId: string,
    query: {
      status?: string;
      search?: string;
      sort?: string;
      order?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = { userId };

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const ALLOWED_SORT_FIELDS = ['name', 'subject', 'rate', 'createdAt', 'updatedAt'];
    const orderBy: Record<string, string> = {};
    if (query.sort && ALLOWED_SORT_FIELDS.includes(query.sort)) {
      orderBy[query.sort] = query.order || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          account: {
            select: { avatarUrl: true },
          },
          lessons: {
            where: { status: 'COMPLETED' },
            select: { rate: true },
          },
          payments: {
            where: { status: 'PAID' },
            select: { amount: true },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    const data = students.map((s) => {
      const earned = s.lessons.reduce((sum, l) => sum + l.rate, 0);
      const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
      const { lessons, payments, account, ...rest } = s;
      return {
        ...rest,
        avatarUrl: account?.avatarUrl || null,
        balance: paid - earned,
      };
    });

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        account: {
          select: { avatarUrl: true },
        },
        lessons: {
          where: { status: 'COMPLETED' },
          select: { rate: true },
        },
        payments: {
          where: { status: 'PAID' },
          select: { amount: true },
        },
        _count: {
          select: {
            lessons: true,
            payments: true,
          },
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();

    const earned = student.lessons.reduce((sum, l) => sum + l.rate, 0);
    const paid = student.payments.reduce((sum, p) => sum + p.amount, 0);
    const { lessons, payments, account, ...rest } = student;
    return {
      ...rest,
      avatarUrl: account?.avatarUrl || null,
      balance: paid - earned,
    };
  }

  // Notes CRUD

  async findNotes(
    studentId: string,
    userId: string,
    query: { page?: number; limit?: number },
  ) {
    await this.ensureOwner(studentId, userId);
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where = { studentId };
    const [data, total] = await Promise.all([
      this.prisma.lessonNote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lessonNote.count({ where }),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async createNote(
    studentId: string,
    userId: string,
    body: { content: string; lessonId?: string },
  ) {
    await this.ensureOwner(studentId, userId);
    return this.prisma.lessonNote.create({
      data: { studentId, content: body.content, lessonId: body.lessonId },
    });
  }

  async updateNote(
    studentId: string,
    noteId: string,
    userId: string,
    body: { content: string },
  ) {
    await this.ensureOwner(studentId, userId);
    const note = await this.prisma.lessonNote.findUnique({ where: { id: noteId } });
    if (!note || note.studentId !== studentId) throw new NotFoundException('Note not found');
    return this.prisma.lessonNote.update({ where: { id: noteId }, data: { content: body.content } });
  }

  async deleteNote(studentId: string, noteId: string, userId: string) {
    await this.ensureOwner(studentId, userId);
    const note = await this.prisma.lessonNote.findUnique({ where: { id: noteId } });
    if (!note || note.studentId !== studentId) throw new NotFoundException('Note not found');
    return this.prisma.lessonNote.delete({ where: { id: noteId } });
  }

  // Homework CRUD

  async findHomework(
    studentId: string,
    userId: string,
    query: { status?: string; page?: number; limit?: number },
  ) {
    await this.ensureOwner(studentId, userId);
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.HomeworkWhereInput = { studentId };
    if (query.status) where.status = query.status as any;

    const [rows, total] = await Promise.all([
      this.prisma.homework.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: this.homeworkWithMaterialsInclude,
      }),
      this.prisma.homework.count({ where }),
    ]);

    const data = rows.map((homework) => this.mapHomework(homework));

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async createHomework(
    studentId: string,
    userId: string,
    body: { task: string; dueAt?: string; lessonId?: string; fileIds?: string[] },
  ) {
    await this.ensureOwner(studentId, userId);
    const fileIds = await this.resolveHomeworkFileIds(userId, body.fileIds);

    if (body.lessonId) {
      await this.validateHomeworkLessonLink({
        userId,
        studentId,
        lessonId: body.lessonId,
      });
    }

    const created = await this.prisma.homework.create({
      data: {
        studentId,
        task: body.task,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        lessonId: body.lessonId,
        ...(fileIds && fileIds.length > 0
          ? {
              materials: {
                create: fileIds.map((fileId) => ({ fileId })),
              },
            }
          : {}),
      },
      include: this.homeworkWithMaterialsInclude,
    });

    return this.mapHomework(created);
  }

  async updateHomework(
    studentId: string,
    hwId: string,
    userId: string,
    body: {
      task?: string;
      dueAt?: string;
      status?: string;
      lessonId?: string | null;
      fileIds?: string[];
    },
  ) {
    await this.ensureOwner(studentId, userId);
    const hw = await this.prisma.homework.findUnique({ where: { id: hwId } });
    if (!hw || hw.studentId !== studentId) throw new NotFoundException('Homework not found');

    const fileIds = await this.resolveHomeworkFileIds(userId, body.fileIds);
    const data: any = {};
    if (body.task !== undefined) data.task = body.task;
    if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.status !== undefined) data.status = body.status;
    if (body.lessonId !== undefined) {
      if (body.lessonId) {
        await this.validateHomeworkLessonLink({
          userId,
          studentId,
          lessonId: body.lessonId,
        });
      }

      data.lessonId = body.lessonId || null;
    }

    if (fileIds !== undefined) {
      data.materials = {
        deleteMany: {},
        ...(fileIds.length > 0
          ? {
              create: fileIds.map((fileId) => ({ fileId })),
            }
          : {}),
      };
    }

    const updated = await this.prisma.homework.update({
      where: { id: hwId },
      data,
      include: this.homeworkWithMaterialsInclude,
    });

    return this.mapHomework(updated);
  }

  async deleteHomework(studentId: string, hwId: string, userId: string) {
    await this.ensureOwner(studentId, userId);
    const hw = await this.prisma.homework.findUnique({ where: { id: hwId } });
    if (!hw || hw.studentId !== studentId) throw new NotFoundException('Homework not found');
    return this.prisma.homework.delete({ where: { id: hwId } });
  }

  // Helpers

  private async ensureOwner(studentId: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();
    return student;
  }

  private normalizeEmail(raw?: string | null) {
    const normalized = (raw || '').trim().toLowerCase();
    return normalized || null;
  }

  async checkEmail(rawEmail: string) {
    const email = this.normalizeEmail(rawEmail);
    if (!email) {
      return { exists: false };
    }
    const account = await this.prisma.studentAccount.findUnique({
      where: { email },
      select: { id: true, name: true },
    });
    return account
      ? { exists: true, name: account.name }
      : { exists: false };
  }

  async create(userId: string, dto: CreateStudentDto) {
    const { invite, ...rawData } = dto;
    const data: Prisma.StudentUncheckedCreateInput = {
      ...rawData,
      userId,
    };

    const rawEmail = this.normalizeEmail(rawData.email);
    if (rawEmail) {
      data.email = rawEmail;
    } else {
      delete data.email;
    }

    if (invite && !rawEmail) {
      throw new BadRequestException(
        'Укажите email ученика, чтобы отправить приглашение.',
      );
    }

    const existingAccount = rawEmail
      ? await this.prisma.studentAccount.findUnique({
          where: { email: rawEmail },
        })
      : null;
    if (existingAccount) {
      data.accountId = existingAccount.id;
    }

    const student = await this.prisma.student.create({ data });

    // Send invite email (fire-and-forget). No StudentAccount is created here
    // when it does not exist yet - it will be created after OTP verification.
    if (invite && rawEmail) {
      const tutor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      this.studentAuth
        .sendAccountInviteEmail(rawEmail, tutor?.name || 'Репетитор')
        .catch(() => {
          /* logged inside service */
        });
    }

    return student;
  }

  async update(id: string, userId: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();

    const { invite: _invite, ...incoming } = dto as UpdateStudentDto & { invite?: boolean };

    if (student.accountId) {
      const touchedLockedFields = LOCKED_PERSONAL_FIELDS_FOR_LINKED_STUDENT.filter((field) =>
        Object.prototype.hasOwnProperty.call(incoming, field),
      );
      if (touchedLockedFields.length > 0) {
        throw new BadRequestException(
          'У ученика есть аккаунт Repeto. Личные данные редактирует сам ученик в своем кабинете.',
        );
      }
    }

    const data = { ...incoming } as Prisma.StudentUncheckedUpdateInput;
    if (Object.prototype.hasOwnProperty.call(data, 'email')) {
      const normalizedEmail = this.normalizeEmail(data.email as string | null | undefined);
      data.email = normalizedEmail;

      if (!student.accountId && normalizedEmail) {
        const existingAccount = await this.prisma.studentAccount.findUnique({
          where: { email: normalizedEmail },
        });
        if (existingAccount) {
          data.accountId = existingAccount.id;
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return student;
    }

    return this.prisma.student.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();

    return this.prisma.student.delete({ where: { id } });
  }

  /**
   * Detach a per-tutor Student row from a portal StudentAccount and turn it
   * back into a plain CRM student record editable by the tutor.
   */
  async unlinkAccount(id: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();

    let normalizedEmail = this.normalizeEmail(student.email);
    if (!normalizedEmail && student.accountId) {
      const linkedAccount = await this.prisma.studentAccount.findUnique({
        where: { id: student.accountId },
        select: { email: true },
      });
      normalizedEmail = this.normalizeEmail(linkedAccount?.email);
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        accountId: null,
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
      },
      select: {
        id: true,
        accountId: true,
        email: true,
      },
    });

    return updated;
  }

  /**
   * Create (or link) a StudentAccount for this per-tutor Student record so the
   * student can log into the portal with email + OTP. Triggered by the tutor
   * pressing "Создать личную страницу".
   */
  async activateAccount(id: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();

    const rawEmail = (student.email || '').trim().toLowerCase();
    if (!rawEmail || !rawEmail.includes('@')) {
      throw new BadRequestException(
        'У ученика не указан email. Добавьте email, чтобы создать личный кабинет.',
      );
    }

    const existingAccount = await this.prisma.studentAccount.findUnique({
      where: { email: rawEmail },
    });

    // If account already exists - link it to this student and resend invite.
    if (existingAccount) {
      if (student.accountId !== existingAccount.id) {
        await this.prisma.student.update({
          where: { id },
          data: { accountId: existingAccount.id, email: rawEmail },
        });
      }
    }
    // If no account - do NOT create it. The student will create it themselves
    // by going through OTP verification on the login page.

    const tutor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Fire-and-forget invite email (non-blocking).
    this.studentAuth
      .sendAccountInviteEmail(rawEmail, tutor?.name || 'Репетитор')
      .catch(() => {
        /* logged inside service */
      });

    return {
      accountId: existingAccount?.id || null,
      email: rawEmail,
      status: existingAccount?.status || 'INVITED',
      invited: !existingAccount,
    };
  }
}
