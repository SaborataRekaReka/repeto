import { useApi } from './useApi';
import { api } from '@/lib/api';
import { toLocalDateKey } from '@/lib/dates';
import type { Lesson } from '@/types/schedule';

function extractLessonNote(raw: any): string | undefined {
  if (typeof raw?.notes === 'string') {
    const normalized = raw.notes.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  if (Array.isArray(raw?.notes)) {
    const sorted = [...raw.notes]
      .filter(
        (item: any) =>
          typeof item?.content === 'string' &&
          !item.content.startsWith('PORTAL_REVIEW:'),
      )
      .sort((a: any, b: any) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
      });

    const content = sorted[0]?.content?.trim?.();
    return content ? content : undefined;
  }

  return undefined;
}

function mapLesson(raw: any): Lesson {
  const scheduledAt = new Date(raw.scheduledAt);
  const endAt = new Date(scheduledAt.getTime() + (raw.duration || 60) * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');

  const subject = raw.student?.subject || raw.subject || '';
  const studentName = raw.student?.name || raw.studentName || '';

  return {
    id: raw.id,
    studentId: raw.studentId || raw.student?.id || undefined,
    studentName,
    subject,
    date: toLocalDateKey(scheduledAt),
    startTime: `${pad(scheduledAt.getHours())}:${pad(scheduledAt.getMinutes())}`,
    endTime: `${pad(endAt.getHours())}:${pad(endAt.getMinutes())}`,
    duration: raw.duration || 60,
    format: (raw.format || 'online').toLowerCase() as Lesson['format'],
    status: (raw.status || 'planned').toLowerCase().replace(/_/g, '_') as Lesson['status'],
    rate: raw.rate || 0,
    notes: extractLessonNote(raw),
  };
}

export function useLessons(params?: {
  from?: string;
  to?: string;
  studentId?: string;
}) {
  const result = useApi<any[]>('/lessons', {
    from: params?.from,
    to: params?.to,
    studentId: params?.studentId,
  });

  return {
    ...result,
    data: result.data?.map(mapLesson),
  };
}

export function useLesson(id: string | undefined) {
  const result = useApi<any>(id ? `/lessons/${id}` : null);
  return {
    ...result,
    data: result.data ? mapLesson(result.data) : undefined,
  };
}

export async function createLesson(data: {
  studentId: string;
  subject?: string;
  scheduledAt: string;
  duration?: number;
  format?: string;
  location?: string;
  rate?: number;
  notes?: string;
  recurrence?: string;
}) {
  return api('/lessons', {
    method: 'POST',
    body: {
      ...data,
      format: data.format?.toUpperCase(),
    },
  });
}

export async function updateLesson(id: string, data: Record<string, unknown>) {
  return api(`/lessons/${id}`, { method: 'PATCH', body: data });
}

export async function updateLessonStatus(id: string, status: string) {
  return api(`/lessons/${id}/status`, {
    method: 'PATCH',
    body: { status: status.toUpperCase() },
  });
}

export async function deleteLesson(id: string, deleteRecurrence = false) {
  return api(`/lessons/${id}`, {
    method: 'DELETE',
    params: { deleteRecurrence },
  });
}

export { mapLesson };
