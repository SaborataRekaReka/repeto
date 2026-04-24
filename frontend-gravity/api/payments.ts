import { api } from '@/lib/api';
import type { Payment } from '@/types/finance';

// ─── Raw backend shape ──────────────────────────────────────────────────────
export interface RawPaymentStudent {
  name?: string;
  accountId?: string | null;
}

export interface RawPaymentLesson {
  id?: string;
  subject?: string;
  scheduledAt?: string;
}

export interface RawPayment {
  id: string;
  studentId: string;
  studentName?: string;
  studentAccountId?: string | null;
  accountId?: string | null;
  lessonId?: string | null;
  amount: number;
  date: string;
  method?: string;
  status?: string;
  comment?: string | null;
  externalPaymentId?: string | null;
  student?: RawPaymentStudent | null;
  lesson?: RawPaymentLesson | null;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

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

export function mapPayment(raw: RawPayment): Payment {
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

// ─── Mutations ──────────────────────────────────────────────────────────────

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
