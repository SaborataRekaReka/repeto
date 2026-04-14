import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const { current, previous } = this.getStatsRanges(period);

    const [currentStats, previousStats] = await Promise.all([
      this.calculateStatsForRange(userId, current.from, current.to),
      this.calculateStatsForRange(userId, previous.from, previous.to),
    ]);

    const incomeChangePercent = this.calculateChangePercent(
      currentStats.totalIncome,
      previousStats.totalIncome,
    );
    const pendingChangePercent = this.calculateChangePercent(
      currentStats.totalPending,
      previousStats.totalPending,
    );
    // Debt trend is inverted: less debt is better (positive change).
    const debtChangePercent = this.calculateChangePercent(
      previousStats.totalDebt,
      currentStats.totalDebt,
    );

    return {
      totalIncome: currentStats.totalIncome,
      totalPending: currentStats.totalPending,
      totalDebt: currentStats.totalDebt,
      incomeChangePercent,
      pendingChangePercent,
      debtChangePercent,
      previous: {
        totalIncome: previousStats.totalIncome,
        totalPending: previousStats.totalPending,
        totalDebt: previousStats.totalDebt,
      },

      // Backward-compatible fields for existing API consumers/tests.
      income: currentStats.totalIncome,
      previousIncome: previousStats.totalIncome,
      change: incomeChangePercent,
      lessonsCount: currentStats.lessonsCount,
      paymentsCount: currentStats.paymentsCount,
    };
  }

  async getSummary(userId: string, period: 'month' | 'quarter' | 'year' = 'month') {
    const from = this.getPeriodStart(period);
    const to = this.getPeriodEnd();

    const [completed, cancelled, payments] = await Promise.all([
      this.prisma.lesson.aggregate({
        where: { userId, status: 'COMPLETED', scheduledAt: { gte: from, lte: to } },
        _count: true,
        _avg: { rate: true },
      }),
      this.prisma.lesson.count({
        where: {
          userId,
          status: { in: ['CANCELLED_STUDENT', 'CANCELLED_TUTOR', 'NO_SHOW'] },
          cancelledAt: { gte: from, lte: to },
        },
      }),
      this.prisma.payment.aggregate({
        where: { userId, status: 'PAID', date: { gte: from, lte: to } },
        _count: true,
        _avg: { amount: true },
      }),
    ]);

    const totalLessons = completed._count + cancelled;

    return {
      completedLessons: completed._count,
      cancelledLessons: cancelled,
      cancellationRate: totalLessons > 0 ? Math.round((cancelled / totalLessons) * 100) : 0,
      avgRate: Math.round(completed._avg.rate || 0),
      paymentsCount: payments._count,
      avgPayment: Math.round(payments._avg.amount || 0),
    };
  }

  async getIncomeChart(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ) {
    const from = this.getPeriodStart(period);
    const to = this.getPeriodEnd();

    const [paidAgg, plannedLessons] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          userId,
          status: 'PAID',
          date: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      this.prisma.lesson.aggregate({
        where: {
          userId,
          status: 'PLANNED',
          scheduledAt: { gte: from, lte: to },
        },
        _sum: { rate: true },
      }),
    ]);

    const received = paidAgg._sum.amount || 0;
    const expected = plannedLessons._sum.rate || 0;

    return [
      { label: 'Получено', received, expected: 0 },
      { label: 'Запланировано', received: 0, expected },
    ];
  }

  async getPaymentMethods(userId: string, period: 'month' | 'quarter' | 'year' = 'month') {
    const from = this.getPeriodStart(period);

    const payments = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { userId, status: 'PAID', date: { gte: from } },
      _sum: { amount: true },
      _count: true,
    });

    return payments.map((p) => ({
      method: p.method,
      amount: p._sum.amount || 0,
      count: p._count,
    }));
  }

  async getBalances(
    userId: string,
    query: { page?: number; limit?: number; sort?: string },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const orderClause = query.sort === 'balance' ? 'ORDER BY debt DESC' : 'ORDER BY s.name ASC';

    const data = await this.prisma.$queryRaw<
      { studentId: string; studentName: string; subject: string; lessonsCount: number; totalAmount: number; paidAmount: number; debt: number }[]
    >`
      SELECT s.id AS "studentId", s.name AS "studentName", s.subject,
        COALESCE(l.cnt, 0)::int AS "lessonsCount",
        COALESCE(l.total_rate, 0)::int AS "totalAmount",
        COALESCE(p.total_paid, 0)::int AS "paidAmount",
        (COALESCE(l.total_rate, 0) - COALESCE(p.total_paid, 0))::int AS debt
      FROM "students" s
      LEFT JOIN (
        SELECT student_id, COUNT(*)::int AS cnt, SUM(rate)::int AS total_rate
        FROM "lessons" WHERE status = 'COMPLETED' GROUP BY student_id
      ) l ON s.id = l.student_id
      LEFT JOIN (
        SELECT student_id, SUM(amount)::int AS total_paid
        FROM "payments" WHERE status = 'PAID' GROUP BY student_id
      ) p ON s.id = p.student_id
      WHERE s.user_id = ${userId} AND s.status = 'ACTIVE'
      ORDER BY CASE WHEN ${query.sort || ''} = 'balance' THEN (COALESCE(l.total_rate, 0) - COALESCE(p.total_paid, 0)) ELSE 0 END DESC, s.name ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const total = await this.prisma.student.count({
      where: { userId, status: 'ACTIVE' },
    });

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async getIncomeByStudents(userId: string, period: 'month' | 'quarter' | 'year' = 'month', limit = 5) {
    const from = this.getPeriodStart(period);

    const students = await this.prisma.student.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        payments: {
          where: { status: 'PAID', date: { gte: from } },
          select: { amount: true },
        },
      },
    });

    return students
      .map((s) => ({
        studentId: s.id,
        studentName: s.name,
        subject: s.subject,
        total: s.payments.reduce((sum, p) => sum + p.amount, 0),
      }))
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  private async calculateStatsForRange(userId: string, from: Date, to: Date) {
    const [income, plannedLessons, totalEarned, totalPaid, lessonsCount, paymentsCount] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { userId, status: 'PAID', date: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      this.prisma.lesson.aggregate({
        where: { userId, status: 'PLANNED', scheduledAt: { gte: from, lte: to } },
        _sum: { rate: true },
      }),
      this.prisma.lesson.aggregate({
        where: { userId, status: 'COMPLETED', scheduledAt: { lte: to } },
        _sum: { rate: true },
      }),
      this.prisma.payment.aggregate({
        where: { userId, status: 'PAID', date: { lte: to } },
        _sum: { amount: true },
      }),
      this.prisma.lesson.count({
        where: { userId, status: 'PLANNED', scheduledAt: { gte: from, lte: to } },
      }),
      this.prisma.payment.count({
        where: { userId, status: 'PAID', date: { gte: from, lte: to } },
      }),
    ]);

    const totalIncome = income._sum.amount || 0;
    const totalPending = plannedLessons._sum.rate || 0;
    const totalDebt = Math.max(0, (totalEarned._sum.rate || 0) - (totalPaid._sum.amount || 0));

    return {
      totalIncome,
      totalPending,
      totalDebt,
      lessonsCount,
      paymentsCount,
    };
  }

  private calculateChangePercent(current: number, previous: number): number {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }

    const raw = ((current - previous) / Math.abs(previous)) * 100;
    return Math.round(raw * 100) / 100;
  }

  private getStatsRanges(period: 'week' | 'month' | 'quarter' | 'year') {
    const now = new Date();

    if (period === 'week') {
      const currentFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      const currentTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const previousFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
      const previousTo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59, 59, 999);

      return {
        current: { from: currentFrom, to: currentTo },
        previous: { from: previousFrom, to: previousTo },
      };
    }

    if (period === 'quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const currentFrom = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
      const currentTo = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
      const previousFrom = new Date(now.getFullYear(), quarterStartMonth - 3, 1, 0, 0, 0, 0);
      const previousTo = new Date(now.getFullYear(), quarterStartMonth, 0, 23, 59, 59, 999);

      return {
        current: { from: currentFrom, to: currentTo },
        previous: { from: previousFrom, to: previousTo },
      };
    }

    if (period === 'year') {
      const currentFrom = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const currentTo = new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999);
      const previousFrom = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const previousTo = new Date(now.getFullYear() - 1, 12, 0, 23, 59, 59, 999);

      return {
        current: { from: currentFrom, to: currentTo },
        previous: { from: previousFrom, to: previousTo },
      };
    }

    const currentFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const currentTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const previousFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const previousTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return {
      current: { from: currentFrom, to: currentTo },
      previous: { from: previousFrom, to: previousTo },
    };
  }

  private getPeriodStart(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      case 'quarter':
        return new Date(now.getFullYear(), now.getMonth() - 3, 1);
      case 'year':
        return new Date(now.getFullYear() - 1, now.getMonth(), 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  private getPeriodEnd(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

}
