import { useApi } from './useApi';
import { api } from '@/lib/api';
import type { Payment, StudentBalance } from '@/types/finance';

function mapPayment(raw: any): Payment {
  return {
    id: raw.id,
    studentId: raw.studentId,
    studentName: raw.student?.name || raw.studentName || '',
    amount: raw.amount,
    date: new Date(raw.date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    method: (raw.method || '').toLowerCase() as Payment['method'],
    status: (raw.status || 'pending').toLowerCase() as Payment['status'],
    comment: raw.comment || undefined,
  };
}

type PaymentsResponse = {
  data: any[];
  total: number;
  page: number;
  pages: number;
};

export function usePayments(params?: {
  status?: string;
  studentId?: string;
  from?: string;
  to?: string;
  method?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
}) {
  const result = useApi<PaymentsResponse>('/payments', {
    status: params?.status?.toUpperCase(),
    studentId: params?.studentId,
    from: params?.from,
    to: params?.to,
    method: params?.method?.toUpperCase(),
    page: params?.page,
    limit: params?.limit,
    sort: params?.sort,
    order: params?.order,
  });

  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          data: result.data.data.map(mapPayment),
        }
      : undefined,
  };
}

export async function createPayment(data: {
  studentId: string;
  amount: number;
  method: string;
  date?: string;
  comment?: string;
}) {
  return api('/payments', {
    method: 'POST',
    body: {
      ...data,
      method: data.method.toUpperCase(),
    },
  });
}

export async function updatePayment(id: string, data: Record<string, unknown>) {
  return api(`/payments/${id}`, { method: 'PATCH', body: data });
}

export async function deletePayment(id: string) {
  return api(`/payments/${id}`, { method: 'DELETE' });
}

// Finance overview hooks
type FinanceStats = {
  totalIncome: number;
  totalPending: number;
  totalDebt: number;
  incomeChangePercent: number;
  pendingChangePercent: number;
  debtChangePercent: number;

  previous?: {
    totalIncome: number;
    totalPending: number;
    totalDebt: number;
  };

  // Backward-compatible fields kept by backend for older consumers.
  income?: number;
  previousIncome?: number;
  change?: number;
  lessonsCount?: number;
  paymentsCount?: number;
};

export function useFinanceStats(period = 'month') {
  return useApi<FinanceStats>('/finance/stats', { period });
}

type FinanceSummary = {
  completedLessons: number;
  cancelledLessons: number;
  cancellationRate: number;
  avgRate: number;
  paymentsCount: number;
  avgPayment: number;
};

export function useFinanceSummary(period = 'month') {
  return useApi<FinanceSummary>('/finance/summary', { period });
}

export function useFinanceChart(period = 'month') {
  const result = useApi<any[]>('/finance/income-chart', { period });

  return {
    ...result,
    data: (result.data || []).map((row: any) => ({
      name: row.name || row.label || row.week || '',
      received: Number(row.received ?? row.amount ?? 0),
      expected: Number(row.expected ?? 0),
    })),
  };
}

export function usePaymentMethods(period = 'month') {
  return useApi<any[]>('/finance/payment-methods', { period });
}

export function useStudentBalances(params?: {
  page?: number;
  limit?: number;
  sort?: string;
}) {
  return useApi<{ data: StudentBalance[]; total: number; page: number; pages: number }>(
    '/finance/balances',
    params
  );
}

type IncomeByStudent = {
  studentId: string;
  studentName: string;
  subject: string;
  total: number;
};

export function useIncomeByStudents(period = 'month') {
  return useApi<IncomeByStudent[]>('/finance/income-by-students', { period });
}
