import { api } from '@/lib/api';
import { toLocalDateKey } from '@/lib/dates';
import { isSystemLessonNoteContent, parsePortalReviewNote } from '@/lib/lessonNotes';
import type { Lesson } from '@/types/schedule';

// ─── Raw backend shape ──────────────────────────────────────────────────────
export interface RawNote {
  id?: string;
  content?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawLessonStudent {
  id?: string;
  name?: string;
  subject?: string;
  accountId?: string | null;
}

export interface RawLesson {
  id: string;
  scheduledAt: string;
  duration?: number;
  format?: string;
  status?: string;
  rate?: number;
  subject?: string;
  studentId?: string;
  studentName?: string;
  studentAccountId?: string | null;
  student?: RawLessonStudent;
  /** Backend may return notes as a flat string or an array of note objects */
  notes?: string | RawNote[] | null;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function extractLessonReview(raw: RawLesson): { rating: number; feedback?: string } | null {
  if (Array.isArray(raw.notes)) {
    const sorted = [...raw.notes].sort((a, b) => {
      const aTime = new Date((a.updatedAt || a.createdAt) ?? 0).getTime();
      const bTime = new Date((b.updatedAt || b.createdAt) ?? 0).getTime();
      return bTime - aTime;
    });

    for (const note of sorted) {
      const review = parsePortalReviewNote(note.content);
      if (review) return review;
    }
    return null;
  }

  return parsePortalReviewNote(raw.notes);
}

function extractLessonNote(raw: RawLesson): string | undefined {
  if (typeof raw.notes === 'string') {
    if (isSystemLessonNoteContent(raw.notes)) return undefined;
    const normalized = raw.notes.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  if (Array.isArray(raw.notes)) {
    const sorted = [...raw.notes]
      .filter(
        (item) =>
          typeof item.content === 'string' && !isSystemLessonNoteContent(item.content),
      )
      .sort((a, b) => {
        const aTime = new Date((a.updatedAt || a.createdAt) ?? 0).getTime();
        const bTime = new Date((b.updatedAt || b.createdAt) ?? 0).getTime();
        return bTime - aTime;
      });

    const rawContent = sorted[0]?.content;
    const content = typeof rawContent === 'string' ? rawContent.trim() : undefined;
    return content ? content : undefined;
  }

  return undefined;
}

export function mapLesson(raw: RawLesson): Lesson {
  const scheduledAt = new Date(raw.scheduledAt);
  const endAt = new Date(scheduledAt.getTime() + (raw.duration || 60) * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const review = extractLessonReview(raw);

  const subject = raw.student?.subject || raw.subject || '';
  const studentName = raw.student?.name || raw.studentName || '';

  return {
    id: raw.id,
    studentId: raw.studentId || raw.student?.id || undefined,
    studentName,
    studentAccountId: raw.student?.accountId ?? raw.studentAccountId ?? null,
    subject,
    date: toLocalDateKey(scheduledAt),
    startTime: `${pad(scheduledAt.getHours())}:${pad(scheduledAt.getMinutes())}`,
    endTime: `${pad(endAt.getHours())}:${pad(endAt.getMinutes())}`,
    duration: raw.duration || 60,
    format: (raw.format || 'online').toLowerCase() as Lesson['format'],
    status: (raw.status || 'planned').toLowerCase().replace(/_/g, '_') as Lesson['status'],
    rate: raw.rate || 0,
    notes: extractLessonNote(raw),
    reviewRating: review?.rating,
    reviewFeedback: review?.feedback,
    hasReview: Boolean(review),
  };
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function createLesson(data: {
  studentId: string;
  subject?: string;
  scheduledAt: string;
  duration?: number;
  format?: string;
  location?: string;
  rate?: number;
  notes?: string;
  recurrence?: {
    enabled: boolean;
    until: string;
    weekdays: number[];
  };
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
