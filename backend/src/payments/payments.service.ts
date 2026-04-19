import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { LessonStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  private async validateLessonLink(params: {
    userId: string;
    studentId: string;
    lessonId: string;
    excludePaymentId?: string;
  }) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: params.lessonId },
      select: {
        id: true,
        userId: true,
        studentId: true,
        status: true,
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

    if (lesson.status !== LessonStatus.COMPLETED) {
      throw new BadRequestException('Можно привязывать оплату только к проведенному занятию');
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        userId: params.userId,
        lessonId: params.lessonId,
        ...(params.excludePaymentId
          ? {
              id: {
                not: params.excludePaymentId,
              },
            }
          : {}),
      },
      select: { id: true },
    });

    if (existingPayment) {
      throw new BadRequestException('Это занятие уже связано с оплатой');
    }
  }

  async findAll(
    userId: string,
    query: {
      status?: string;
      studentId?: string;
      from?: string;
      to?: string;
      method?: string;
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = { userId };

    if (query.status) where.status = query.status as any;
    if (query.studentId) where.studentId = query.studentId;
    if (query.method) where.method = query.method as any;

    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }

    const ALLOWED_SORT_FIELDS = ['date', 'amount', 'status', 'method', 'createdAt'];
    const orderBy: Record<string, string> = {};
    if (query.sort && ALLOWED_SORT_FIELDS.includes(query.sort)) {
      orderBy[query.sort] = query.order || 'desc';
    } else {
      orderBy.date = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          student: { select: { id: true, name: true } },
          lesson: { select: { id: true, subject: true, scheduledAt: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        lesson: { select: { id: true, subject: true, scheduledAt: true } },
        package: true,
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new ForbiddenException();

    return payment;
  }

  async create(userId: string, dto: CreatePaymentDto) {
    if (dto.lessonId) {
      await this.validateLessonLink({
        userId,
        studentId: dto.studentId,
        lessonId: dto.lessonId,
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        ...dto,
        userId,
        date: dto.date ? new Date(dto.date) : new Date(),
        status: 'PAID',
      },
      include: {
        student: { select: { id: true, name: true } },
        lesson: { select: { id: true, subject: true, scheduledAt: true } },
      },
    });

    return payment;
  }

  async update(id: string, userId: string, dto: UpdatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new ForbiddenException();

    const nextStudentId = dto.studentId || payment.studentId;
    const nextLessonId = dto.lessonId !== undefined ? dto.lessonId : payment.lessonId;

    if (nextLessonId) {
      await this.validateLessonLink({
        userId,
        studentId: nextStudentId,
        lessonId: nextLessonId,
        excludePaymentId: id,
      });
    }

    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);

    return this.prisma.payment.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, name: true } },
        lesson: { select: { id: true, subject: true, scheduledAt: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new ForbiddenException();
    if (payment.externalPaymentId) {
      throw new BadRequestException(
        'Оплаты из платежной системы удалять нельзя',
      );
    }

    return this.prisma.payment.delete({ where: { id } });
  }

  async removeManual(userId: string) {
    const result = await this.prisma.payment.deleteMany({
      where: {
        userId,
        externalPaymentId: null,
      },
    });

    return { deleted: result.count };
  }

  async exportCsv(
    userId: string,
    query: { from?: string; to?: string; studentId?: string },
  ): Promise<string> {
    const where: Prisma.PaymentWhereInput = { userId };
    if (query.studentId) where.studentId = query.studentId;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: { student: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    const header = 'Дата,Ученик,Сумма,Способ,Статус,Комментарий';
    const rows = payments.map((p) =>
      [
        p.date.toISOString().split('T')[0],
        `"${p.student.name}"`,
        p.amount,
        p.method,
        p.status,
        `"${p.comment || ''}"`,
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
