import { useApi } from './useApi';
import {
  mapPayment,
  createPayment,
  updatePayment,
  deletePayment,
  deleteManualPayments,
} from '@/api/payments';
import type { RawPayment } from '@/api/payments';
import type { StudentBalance } from '@/types/finance';

export { createPayment, updatePayment, deletePayment, deleteManualPayments };

type PaymentsResponse = {
  data: RawPayment[];
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
