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
      {
        id: string;
        name: string;
        subject: string;
        parentEmail: string | null;
        balance: number;
      }[]
    >`
      SELECT s.id, s.name, s.subject, s.parent_email AS "parentEmail",
        COALESCE(p.total_paid, 0) - COALESCE(l.total_rate, 0) AS balance
      FROM "students" s
      LEFT JOIN (
        SELECT student_id, SUM(rate) AS total_rate
        FROM "lessons" WHERE status = 'COMPLETED' AND user_id = ${userId} GROUP BY student_id
      ) l ON s.id = l.student_id
      LEFT JOIN (
        SELECT student_id, SUM(amount) AS total_paid
        FROM "payments" WHERE status = 'PAID' AND user_id = ${userId} GROUP BY student_id
      ) p ON s.id = p.student_id
      WHERE s.user_id = ${userId}
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

  async getIncomeChart(userId: string, _period: 'month' | 'quarter' | 'year' = 'month') {
    const now = new Date();
    const today = now.getDate();

    const MONTH_SHORT = [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
    ];
    const MONTH_GENITIVE = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ];

    const sumPeriod = async (start: Date, end: Date) => {
      const [paid, planned] = await Promise.all([
        this.prisma.payment.aggregate({
          where: { userId, status: 'PAID', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        this.prisma.lesson.aggregate({
          where: { userId, status: 'PLANNED', scheduledAt: { gte: start, lte: end } },
          _sum: { rate: true },
        }),
      ]);
      return {
        received: paid._sum.amount || 0,
        expected: planned._sum.rate || 0,
      };
    };

    // 12 months window: last 11 + current
    const months: Array<{
      key: string;
      label: string;
      received: number;
      expected: number;
      isCurrent: boolean;
    }> = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
      const { received, expected } = await sumPeriod(start, end);
      months.push({
        key: `${start.getFullYear()}-${start.getMonth() + 1}`,
        label: MONTH_SHORT[start.getMonth()],
        received,
        expected,
        isCurrent: i === 0,
      });
    }

    // Current month MTD (1 .. today)
    const currStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currMtdEnd = new Date(now.getFullYear(), now.getMonth(), today, 23, 59, 59);
    const current = await sumPeriod(currStart, currMtdEnd);

    // Prev month MTD (1 .. today of prev month)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthDaysInMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const prevMonthMtdDay = Math.min(today, prevMonthDaysInMonth);
    const prevMonthMtdEnd = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      prevMonthMtdDay,
      23, 59, 59,
    );
    const prevMonth = await sumPeriod(prevMonthStart, prevMonthMtdEnd);

    // Same month previous year MTD
    const prevYearMtdStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const prevYearDaysInMonth = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0).getDate();
    const prevYearMtdDay = Math.min(today, prevYearDaysInMonth);
    const prevYearMtdEnd = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      prevYearMtdDay,
      23, 59, 59,
    );
    const prevYearMtd = await sumPeriod(prevYearMtdStart, prevYearMtdEnd);

    // Year-to-date (Jan 1 .. today)
    const ytdStart = new Date(now.getFullYear(), 0, 1);
    const ytdEnd = new Date(now.getFullYear(), now.getMonth(), today, 23, 59, 59);
    const ytd = await sumPeriod(ytdStart, ytdEnd);

    // Previous year YTD (Jan 1 .. same month/day)
    const prevYtdStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYtdEnd = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      prevYearMtdDay,
      23, 59, 59,
    );
    const prevYtd = await sumPeriod(prevYtdStart, prevYtdEnd);

    const currTotal = current.received + current.expected;
    const prevMonthTotal = prevMonth.received + prevMonth.expected;
    const prevYearMtdTotal = prevYearMtd.received + prevYearMtd.expected;
    const ytdTotal = ytd.received + ytd.expected;
    const prevYtdTotal = prevYtd.received + prevYtd.expected;

    const calcDelta = (curr: number, base: number) => {
      if (base === 0) return curr > 0 ? 100 : 0;
      return ((curr - base) / base) * 100;
    };

    const fmtRangeLabel = (date: Date, endDay: number) => {
      const yy = String(date.getFullYear()).slice(2);
      return `1\u00a0—\u00a0${endDay}\u00a0${MONTH_SHORT[date.getMonth()].toLowerCase()}\u00a0${yy}`;
    };

    return {
      months,
      current: {
        title: `Входящие 1\u00a0—\u00a0${today}\u00a0${MONTH_GENITIVE[now.getMonth()]}`,
        total: currTotal,
        received: current.received,
        expected: current.expected,
        vsPrevMonth: {
          pct: Math.round(calcDelta(currTotal, prevMonthTotal) * 10) / 10,
          rangeLabel: `к\u00a0${fmtRangeLabel(prevMonthStart, prevMonthMtdDay)}`,
        },
        vsPrevYear: {
          pct: Math.round(calcDelta(currTotal, prevYearMtdTotal) * 10) / 10,
          rangeLabel: `к\u00a0${fmtRangeLabel(prevYearMtdStart, prevYearMtdDay)}`,
        },
      },
      ytd: {
        title: `Входящие 1\u00a0января\u00a0—\u00a0${today}\u00a0${MONTH_GENITIVE[now.getMonth()]}`,
        total: ytdTotal,
        received: ytd.received,
        expected: ytd.expected,
        vsPrevYear: {
          pct: Math.round(calcDelta(ytdTotal, prevYtdTotal) * 10) / 10,
          rangeLabel: `к\u00a01\u00a0янв\u00a0—\u00a0${prevYearMtdDay}\u00a0${MONTH_SHORT[now.getMonth()].toLowerCase()}\u00a0${String(now.getFullYear() - 1).slice(2)}`,
        },
      },
    };
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
        status: 'PLANNED',
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
    const [earnedByStudent, paidByStudent] = await Promise.all([
      this.prisma.lesson.groupBy({
        by: ['studentId'],
        where: { userId, status: 'COMPLETED' },
        _sum: { rate: true },
      }),
      this.prisma.payment.groupBy({
        by: ['studentId'],
        where: { userId, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    const paidByStudentMap = new Map<string, number>();
    for (const row of paidByStudent) {
      paidByStudentMap.set(row.studentId, row._sum.amount || 0);
    }

    let totalDebt = 0;
    for (const row of earnedByStudent) {
      const earned = row._sum.rate || 0;
      const paid = paidByStudentMap.get(row.studentId) || 0;
      if (earned > paid) {
        totalDebt += earned - paid;
      }
    }

    return totalDebt;
  }
}
