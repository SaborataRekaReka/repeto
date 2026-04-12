import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private formatMethodLabel(method: string) {
    switch (method) {
      case 'SBP':
        return 'СБП';
      case 'CASH':
        return 'Наличные';
      case 'TRANSFER':
        return 'Перевод';
      case 'YUKASSA':
        return 'ЮKassa';
      default:
        return method;
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

    const orderBy: Record<string, string> = {};
    if (query.sort) {
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
        package: true,
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new ForbiddenException();

    return payment;
  }

  async create(userId: string, dto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        ...dto,
        userId,
        date: dto.date ? new Date(dto.date) : new Date(),
        status: 'PAID',
      },
      include: { student: { select: { id: true, name: true } } },
    });

    try {
      await this.notifications.create({
        userId,
        studentId: payment.studentId,
        type: 'PAYMENT_RECEIVED',
        title: 'Оплата получена',
        description: `${payment.student.name} · ${payment.amount.toLocaleString('ru-RU')} ₽ (${this.formatMethodLabel(payment.method)})`,
        actionUrl: '/finance/payments',
      });
    } catch (error) {
      this.logger.warn(
        `Payment ${payment.id} was created, but notification dispatch failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return payment;
  }

  async update(id: string, userId: string, dto: UpdatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new ForbiddenException();

    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);

    return this.prisma.payment.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new ForbiddenException();

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
