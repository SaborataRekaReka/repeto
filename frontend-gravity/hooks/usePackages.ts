import { useApi } from './useApi';
import { api } from '@/lib/api';
import { toDateInputValue } from '@/lib/dates';
import type { LessonPackage } from '@/types/package';

function normalizePackageComment(rawComment?: string | null): string | undefined {
  const value = String(rawComment || '').trim();
  return value || undefined;
}

function mapPackage(raw: any): LessonPackage {
  const isPublic = !!raw.isPublic;
  const studentName =
    raw.student?.name || raw.studentName || (isPublic ? 'Публичный пакет' : 'Без ученика');

  return {
    id: raw.id,
    studentId: raw.studentId,
    studentName,
    studentAccountId:
      raw.student?.accountId ??
      raw.studentAccountId ??
      raw.accountId ??
      null,
    subject: raw.subject || raw.student?.subject || '',
    lessonsTotal: raw.lessonsTotal,
    lessonsUsed: raw.lessonsUsed,
    totalPrice: raw.totalPrice,
    comment: normalizePackageComment(raw.comment),
    isPublic,
    status: (raw.status || 'active').toLowerCase() as LessonPackage['status'],
    validUntil: raw.validUntil
      ? new Date(raw.validUntil).toLocaleDateString('ru-RU')
      : '',
    validUntilValue: toDateInputValue(raw.validUntil),
    createdAt: raw.createdAt
      ? new Date(raw.createdAt).toLocaleDateString('ru-RU')
      : '',
    createdAtValue: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

type PackagesResponse = {
  data: any[];
  total: number;
  page: number;
  pages: number;
};

export function usePackages(params?: {
  studentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const result = useApi<PackagesResponse>('/packages', {
    studentId: params?.studentId,
    status: params?.status?.toUpperCase(),
    page: params?.page,
    limit: params?.limit,
  });

  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          data: result.data.data.map(mapPackage),
        }
      : undefined,
  };
}

export async function createPackage(data: {
  studentId?: string;
  isPublic?: boolean;
  subject: string;
  lessonsTotal: number;
  totalPrice: number;
  validUntil?: string;
  comment?: string | null;
}) {
  return api('/packages', {
    method: 'POST',
    body: data,
  });
}

export async function updatePackage(id: string, data: Record<string, unknown>) {
  return api(`/packages/${id}`, { method: 'PATCH', body: data });
}

export async function deletePackage(id: string) {
  return api(`/packages/${id}`, { method: 'DELETE' });
}
