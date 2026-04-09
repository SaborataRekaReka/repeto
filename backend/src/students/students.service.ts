import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

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

    const orderBy: Record<string, string> = {};
    if (query.sort) {
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
      const { lessons, payments, ...rest } = s;
      return { ...rest, balance: paid - earned };
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
    const { lessons, payments, ...rest } = student;
    return { ...rest, balance: paid - earned };
  }

  // ── Notes CRUD ──

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

  // ── Homework CRUD ──

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

    const [data, total] = await Promise.all([
      this.prisma.homework.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.homework.count({ where }),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async createHomework(
    studentId: string,
    userId: string,
    body: { task: string; dueAt?: string; lessonId?: string },
  ) {
    await this.ensureOwner(studentId, userId);
    return this.prisma.homework.create({
      data: {
        studentId,
        task: body.task,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        lessonId: body.lessonId,
      },
    });
  }

  async updateHomework(
    studentId: string,
    hwId: string,
    userId: string,
    body: { task?: string; dueAt?: string; status?: string },
  ) {
    await this.ensureOwner(studentId, userId);
    const hw = await this.prisma.homework.findUnique({ where: { id: hwId } });
    if (!hw || hw.studentId !== studentId) throw new NotFoundException('Homework not found');
    const data: any = {};
    if (body.task !== undefined) data.task = body.task;
    if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.status !== undefined) data.status = body.status;
    return this.prisma.homework.update({ where: { id: hwId }, data });
  }

  async deleteHomework(studentId: string, hwId: string, userId: string) {
    await this.ensureOwner(studentId, userId);
    const hw = await this.prisma.homework.findUnique({ where: { id: hwId } });
    if (!hw || hw.studentId !== studentId) throw new NotFoundException('Homework not found');
    return this.prisma.homework.delete({ where: { id: hwId } });
  }

  // ── Helpers ──

  private async ensureOwner(studentId: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();
    return student;
  }

  async create(userId: string, dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: { ...dto, userId },
    });
  }

  async update(id: string, userId: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();

    return this.prisma.student.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();

    return this.prisma.student.delete({ where: { id } });
  }

  async generatePortalLink(id: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();

    const token = randomUUID();
    await this.prisma.student.update({
      where: { id },
      data: {
        portalToken: token,
        portalTokenCreatedAt: new Date(),
      },
    });

    const tutor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { slug: true },
    });
    const base = process.env.FRONTEND_URL || 'http://localhost:3100';
    const portalUrl = `${base}/t/${tutor?.slug || 'tutor'}/s/${token}`;
    return { token, portalUrl };
  }

  async revokePortalLink(id: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.userId !== userId) throw new ForbiddenException();

    return this.prisma.student.update({
      where: { id },
      data: {
        portalToken: null,
        portalTokenCreatedAt: null,
      },
    });
  }
}
