import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [activeStudents, lessonsThisMonth, incomeThisMonth, totalDebt] =
      await Promise.all([
        this.prisma.student.count({
          where: { userId, status: 'ACTIVE' },
        }),
        this.prisma.lesson.count({
          where: {
            userId,
            scheduledAt: { gte: monthStart, lte: monthEnd },
            status: 'COMPLETED',
          },
        }),
        this.prisma.payment.aggregate({
          where: {
            userId,
            date: { gte: monthStart, lte: monthEnd },
            status: 'PAID',
          },
          _sum: { amount: true },
        }),
        this.calculateTotalDebt(userId),
      ]);

    return {
      activeStudents,
      lessonsThisMonth,
      incomeThisMonth: incomeThisMonth._sum.amount || 0,
      totalDebt,
    };
  }

  async getTodayLessons(userId: string) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return this.prisma.lesson.findMany({
      where: {
        userId,
        scheduledAt: { gte: start, lt: end },
      },
      include: {
        student: { select: { id: true, name: true, subject: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getDebts(userId: string, limit = 5) {
    // Use raw aggregation instead of loading all lessons/payments into memory
    const debts = await this.prisma.$queryRaw<
      { id: string; name: string; subject: string; balance: number }[]
    >`
      SELECT s.id, s.name, s.subject,
        COALESCE(p.total_paid, 0) - COALESCE(l.total_rate, 0) AS balance
      FROM "students" s
      LEFT JOIN (
        SELECT student_id, SUM(rate) AS total_rate
        FROM "lessons" WHERE status = 'COMPLETED' GROUP BY student_id
      ) l ON s.id = l.student_id
      LEFT JOIN (
        SELECT student_id, SUM(amount) AS total_paid
        FROM "payments" WHERE status = 'PAID' GROUP BY student_id
      ) p ON s.id = p.student_id
      WHERE s.user_id = ${userId} AND s.status = 'ACTIVE'
        AND COALESCE(p.total_paid, 0) - COALESCE(l.total_rate, 0) < 0
      ORDER BY balance ASC
      LIMIT ${limit}
    `;

    return debts.map((d) => ({
      ...d,
      balance: Number(d.balance),
    }));
  }

  async getRecentPayments(userId: string, limit = 5) {
    return this.prisma.payment.findMany({
      where: { userId, status: 'PAID' },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async getIncomeChart(userId: string, period: 'month' | 'quarter' | 'year' = 'month') {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (period) {
      case 'quarter':
        from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'year':
        from = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const [payments, plannedLessons] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          userId,
          status: 'PAID',
          date: { gte: from, lte: to },
        },
        select: { amount: true },
      }),
      this.prisma.lesson.findMany({
        where: {
          userId,
          status: 'PLANNED',
          scheduledAt: { gte: from, lte: to },
        },
        select: { rate: true },
      }),
    ]);

    const received = payments.reduce((sum, p) => sum + p.amount, 0);
    const expected = plannedLessons.reduce((sum, l) => sum + l.rate, 0);

    const label =
      period === 'year'
        ? 'За год'
        : period === 'quarter'
          ? 'За квартал'
          : now.toLocaleDateString('ru-RU', { month: 'long' }).replace(/^./, (c) => c.toUpperCase());

    return [{ week: label, received, expected }];
  }

  async getWeekLessons(userId: string) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.prisma.lesson.findMany({
      where: {
        userId,
        scheduledAt: { gte: start, lt: end },
      },
      include: {
        student: { select: { id: true, name: true, subject: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getConversion(userId: string, period: 'month' | 'quarter' | 'year' = 'month') {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (period) {
      case 'quarter':
        from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'year':
        from = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const [completedLessons, paidPayments] = await Promise.all([
      this.prisma.lesson.aggregate({
        where: {
          userId,
          status: 'COMPLETED',
          scheduledAt: { gte: from, lte: to },
        },
        _sum: { rate: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          userId,
          status: 'PAID',
          date: { gte: from, lte: to },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const earned = completedLessons._sum.rate || 0;
    const paid = paidPayments._sum.amount || 0;
    const conversionPct = earned > 0 ? Math.round((paid / earned) * 100) : 0;

    return {
      completedLessons: completedLessons._count,
      earned,
      paymentsCount: paidPayments._count,
      paid,
      conversionPct,
    };
  }

  async getExpiringPackages(userId: string) {
    const now = new Date();
    const twoWeeks = new Date(now);
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    return this.prisma.package.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        validUntil: { gte: now, lte: twoWeeks },
      },
      include: {
        student: { select: { id: true, name: true } },
      },
      orderBy: { validUntil: 'asc' },
    });
  }

  private async calculateTotalDebt(userId: string): Promise<number> {
    const [earned, paid] = await Promise.all([
      this.prisma.lesson.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { rate: true },
      }),
      this.prisma.payment.aggregate({
        where: { userId, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    const totalEarned = earned._sum.rate || 0;
    const totalPaid = paid._sum.amount || 0;
    return Math.max(0, totalEarned - totalPaid);
  }
}
