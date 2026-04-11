import { useApi } from './useApi';
import { api } from '@/lib/api';
import type { Student } from '@/types/student';

// Backend returns UPPER_CASE statuses, frontend uses lowercase
function mapStudent(raw: any): Student {
  return {
    id: raw.id,
    name: raw.name,
    subject: raw.subject,
    grade: raw.grade || '',
    age: raw.age ?? undefined,
    rate: raw.rate,
    balance: raw.balance ?? 0,
    status: (raw.status || 'active').toLowerCase() as Student['status'],
    phone: raw.phone || undefined,
    whatsapp: raw.whatsapp || undefined,
    telegram: raw.telegram || undefined,
    parentName: raw.parentName || undefined,
    parentPhone: raw.parentPhone || undefined,
    parentWhatsapp: raw.parentWhatsapp || undefined,
    parentTelegram: raw.parentTelegram || undefined,
    parentEmail: raw.parentEmail || undefined,
    telegramChatId: raw.telegramChatId || undefined,
    maxChatId: raw.maxChatId || undefined,
    notes: raw.notes || undefined,
  };
}

type StudentsResponse = {
  data: any[];
  total: number;
  page: number;
  pages: number;
};

export function useStudents(params?: {
  status?: string;
  search?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}) {
  const result = useApi<StudentsResponse>('/students', {
    status: params?.status?.toUpperCase(),
    search: params?.search,
    sort: params?.sort,
    order: params?.order,
    page: params?.page,
    limit: params?.limit,
  });

  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          data: result.data.data.map(mapStudent),
        }
      : undefined,
  };
}

export function useStudent(id: string | undefined) {
  const result = useApi<any>(id ? `/students/${id}` : null);
  return {
    ...result,
    data: result.data ? mapStudent(result.data) : undefined,
  };
}

export async function createStudent(data: Partial<Student>) {
  return api('/students', {
    method: 'POST',
    body: {
      ...data,
      status: data.status?.toUpperCase(),
    },
  });
}

export async function updateStudent(id: string, data: Partial<Student>) {
  return api(`/students/${id}`, {
    method: 'PATCH',
    body: {
      ...data,
      status: data.status?.toUpperCase(),
    },
  });
}

export async function deleteStudent(id: string) {
  return api(`/students/${id}`, { method: 'DELETE' });
}

export async function generatePortalLink(id: string) {
  return api<{ portalUrl: string; token: string }>(`/students/${id}/portal-link`, {
    method: 'POST',
  });
}

export async function revokePortalLink(id: string) {
  return api(`/students/${id}/portal-link`, { method: 'DELETE' });
}

// ── Notes ──

export function useStudentNotes(studentId: string | undefined) {
  return useApi<{ data: any[]; total: number }>(
    studentId ? `/students/${studentId}/notes` : null,
    { limit: 100 },
  );
}

export async function createNote(studentId: string, content: string) {
  return api(`/students/${studentId}/notes`, {
    method: 'POST',
    body: { content },
  });
}

export async function deleteNote(studentId: string, noteId: string) {
  return api(`/students/${studentId}/notes/${noteId}`, { method: 'DELETE' });
}

// ── Homework ──

export function useStudentHomework(studentId: string | undefined) {
  return useApi<{ data: any[]; total: number }>(
    studentId ? `/students/${studentId}/homework` : null,
    { limit: 100 },
  );
}

export async function createHomework(
  studentId: string,
  body: { task: string; dueAt?: string },
) {
  return api(`/students/${studentId}/homework`, {
    method: 'POST',
    body,
  });
}

export async function updateHomework(
  studentId: string,
  hwId: string,
  body: { task?: string; dueAt?: string; status?: string },
) {
  return api(`/students/${studentId}/homework/${hwId}`, {
    method: 'PATCH',
    body,
  });
}

export async function deleteHomework(studentId: string, hwId: string) {
  return api(`/students/${studentId}/homework/${hwId}`, { method: 'DELETE' });
}
