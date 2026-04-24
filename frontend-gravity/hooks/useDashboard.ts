import { useApi } from './useApi';
import type { Lesson } from '@/types/schedule';
import { mapLesson } from './useLessons';

type DashboardStats = {
  activeStudents: number;
  lessonsThisMonth: number;
  incomeThisMonth: number;
  totalDebt: number;
};

type DebtStudent = {
  id: string;
  name: string;
  accountId?: string | null;
  subject: string;
  balance: number;
  parentEmail?: string | null;
};

type RecentPayment = {
  id: string;
  studentId?: string;
  date: string;
  studentName: string;
  studentAccountId?: string | null;
  amount: number;
  method: string;
  status: 'received';
};

type IncomeChartMonth = {
  key: string;
  label: string;
  received: number;
  expected: number;
  isCurrent: boolean;
};

type IncomeChartComparison = {
  pct: number;
  rangeLabel: string;
};

export type IncomeChartData = {
  months: IncomeChartMonth[];
  current: {
    title: string;
    total: number;
    received: number;
    expected: number;
    vsPrevMonth: IncomeChartComparison;
    vsPrevYear: IncomeChartComparison;
  };
  ytd: {
    title: string;
    total: number;
    received: number;
    expected: number;
    vsPrevYear: IncomeChartComparison;
  };
};

// Dashboard stat cards derived from stats API
export function useDashboardStats() {
  return useApi<DashboardStats>('/dashboard/stats', undefined, {
    refreshInterval: 15000,
  });
}

export function useTodayLessons() {
  const result = useApi<any[]>('/dashboard/today-lessons');

  return {
    ...result,
    data: result.data?.map(mapLesson) as Lesson[] | undefined,
  };
}

export function useDebts(limit = 5) {
  const result = useApi<any[]>('/dashboard/debts', { limit });
  return {
    ...result,
    data: (result.data || []).map(
      (row: any): DebtStudent => ({
        id: row.id,
        name: row.name,
        accountId: row.accountId ?? row.student?.accountId ?? null,
        subject: row.subject,
        balance: Number(row.balance ?? 0),
        parentEmail: row.parentEmail ?? null,
      }),
    ),
  };
}

export function useRecentPayments(limit = 5) {
  const result = useApi<any[]>('/dashboard/recent-payments', { limit });

  return {
    ...result,
    data: result.data?.map((p: any): RecentPayment => ({
      id: p.id,
      studentId: p.student?.id ?? p.studentId ?? undefined,
      date: new Date(p.date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      studentName: p.student?.name || '',
      studentAccountId: p.student?.accountId ?? p.studentAccountId ?? null,
      amount: p.amount,
      method: mapPaymentMethod(p.method),
      status: 'received' as const,
    })),
  };
}

export function useIncomeChart(period: 'month' | 'quarter' | 'year' = 'month') {
  return useApi<IncomeChartData>('/dashboard/income-chart', { period });
}

function mapPaymentMethod(method: string): string {
  switch (method?.toUpperCase()) {
    case 'SBP': return 'СБП';
    case 'CASH': return 'Наличные';
    case 'TRANSFER': return 'Перевод';
    case 'CARD': return 'Картой';
    default: return method || '';
  }
}

// ── Week lessons ──

export function useWeekLessons() {
  const result = useApi<any[]>('/dashboard/week-lessons');
  return {
    ...result,
    data: result.data?.map(mapLesson) as Lesson[] | undefined,
  };
}

// ── Conversion rate ──

type ConversionData = {
  completedLessons: number;
  earned: number;
  paymentsCount: number;
  paid: number;
  conversionPct: number;
};

export function useConversion(period: 'month' | 'quarter' | 'year' = 'month') {
  return useApi<ConversionData>('/dashboard/conversion', { period });
}

// ── Expiring packages ──

type ExpiringPackage = {
  id: string;
  studentName: string;
  studentAccountId?: string | null;
  subject: string;
  lessonsTotal: number;
  lessonsUsed: number;
  validUntil: string;
};

export function useExpiringPackages() {
  const result = useApi<any[]>('/dashboard/expiring-packages');
  return {
    ...result,
    data: (result.data || []).map((p: any): ExpiringPackage => ({
      id: p.id,
      studentName: p.student?.name || '',
      studentAccountId: p.student?.accountId ?? p.studentAccountId ?? null,
      subject: p.subject,
      lessonsTotal: p.lessonsTotal,
      lessonsUsed: p.lessonsUsed,
      validUntil: new Date(p.validUntil).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      }),
    })),
  };
}
