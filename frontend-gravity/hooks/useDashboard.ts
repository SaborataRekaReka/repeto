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
  subject: string;
  balance: number;
  parentEmail?: string | null;
};

type RecentPayment = {
  id: string;
  date: string;
  studentName: string;
  amount: number;
  method: string;
  status: 'received';
};

type IncomeChartItem = {
  name: string;
  received: number;
  expected: number;
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
  return useApi<DebtStudent[]>('/dashboard/debts', { limit });
}

export function useRecentPayments(limit = 5) {
  const result = useApi<any[]>('/dashboard/recent-payments', { limit });

  return {
    ...result,
    data: result.data?.map((p: any): RecentPayment => ({
      id: p.id,
      date: new Date(p.date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      studentName: p.student?.name || '',
      amount: p.amount,
      method: mapPaymentMethod(p.method),
      status: 'received' as const,
    })),
  };
}

export function useIncomeChart(period: 'month' | 'quarter' | 'year' = 'month') {
  const result = useApi<any[]>('/dashboard/income-chart', { period });

  return {
    ...result,
    data: (result.data || []).map((row: any): IncomeChartItem => ({
      name: row.name || row.week || row.label || '',
      received: Number(row.received ?? row.amount ?? 0),
      expected: Number(row.expected ?? 0),
    })),
  };
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
