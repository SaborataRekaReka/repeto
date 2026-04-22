import { useApi } from './useApi';
import { api } from '@/lib/api';
import type { Payment, StudentBalance } from '@/types/finance';

function mapPayment(raw: any): Payment {
  const externalPaymentId = raw.externalPaymentId || undefined;
  const lessonDate = raw.lesson?.scheduledAt
    ? new Date(raw.lesson.scheduledAt).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : undefined;

  return {
    id: raw.id,
    studentId: raw.studentId,
    studentName: raw.student?.name || raw.studentName || '',
    studentAccountId:
      raw.student?.accountId ??
      raw.studentAccountId ??
      raw.accountId ??
      null,
    lessonId: raw.lessonId || raw.lesson?.id || undefined,
    lessonSubject: raw.lesson?.subject || undefined,
    lessonDate,
    amount: raw.amount,
    date: new Date(raw.date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    method: (raw.method || '').toLowerCase() as Payment['method'],
    status: (raw.status || 'pending').toLowerCase() as Payment['status'],
    comment: raw.comment || undefined,
    externalPaymentId,
    isManual: !externalPaymentId,
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
}, options?: { skip?: boolean }) {
  const studentId = params?.studentId;
  const hasInvalidStudent = studentId === '__no-student__' || studentId === '';
  const result = useApi<PaymentsResponse>('/payments', {
    status: params?.status?.toUpperCase(),
    studentId: hasInvalidStudent ? undefined : studentId,
    from: params?.from,
    to: params?.to,
    method: params?.method?.toUpperCase(),
    page: params?.page,
    limit: params?.limit,
    sort: params?.sort,
    order: params?.order,
  }, { skip: options?.skip || hasInvalidStudent });

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

function normalizePaymentDate(date?: string): string | undefined {
  if (!date) return undefined;

  const raw = String(date).trim();
  if (!raw) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const ru = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (ru) {
    return `${ru[3]}-${ru[2]}-${ru[1]}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export async function createPayment(data: {
  studentId: string;
  lessonId?: string;
  amount: number;
  method: string;
  date?: string;
  comment?: string;
}) {
  return api('/payments', {
    method: 'POST',
    body: {
      ...data,
      date: normalizePaymentDate(data.date),
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

export async function deleteManualPayments() {
  return api<{ deleted: number }>('/payments/manual/all', { method: 'DELETE' });
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
  const result = useApi<{ data: any[]; total: number; page: number; pages: number }>(
    '/finance/balances',
    params
  );

  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          data: result.data.data.map(
            (row: any): StudentBalance => ({
              ...row,
              studentAccountId:
                row.studentAccountId ??
                row.accountId ??
                row.student?.accountId ??
                null,
            }),
          ),
        }
      : undefined,
  };
}

type IncomeByStudent = {
  studentId: string;
  studentName: string;
  studentAccountId?: string | null;
  subject: string;
  total: number;
};

export function useIncomeByStudents(period = 'month') {
  const result = useApi<any[]>('/finance/income-by-students', { period });
  return {
    ...result,
    data: (result.data || []).map(
      (row: any): IncomeByStudent => ({
        studentId: row.studentId,
        studentName: row.studentName,
        studentAccountId:
          row.studentAccountId ??
          row.accountId ??
          row.student?.accountId ??
          null,
        subject: row.subject,
        total: Number(row.total ?? 0),
      }),
    ),
  };
}
