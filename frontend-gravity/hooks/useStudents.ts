import { useApi } from './useApi';
import { api, resolveApiAssetUrl } from '@/lib/api';
import type { Student } from '@/types/student';

// Backend returns UPPER_CASE statuses, frontend uses lowercase

function resolveStudentAvatarUrl(raw: any): string | undefined {
  return resolveApiAssetUrl(
    raw.avatarUrl ??
      raw.avatar ??
      raw.photoUrl ??
      raw.account?.avatarUrl ??
      raw.studentAccount?.avatarUrl ??
      raw.accountAvatarUrl ??
      raw.studentAvatarUrl ??
      null,
  );
}

function mapStudent(raw: any): Student {
  return {
    id: raw.id,
    name: raw.name,
    avatarUrl: resolveStudentAvatarUrl(raw),
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
    email: raw.email || undefined,
    accountId: raw.accountId ?? null,
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
}, options?: { skip?: boolean }) {
  const result = useApi<StudentsResponse>('/students', {
    status: params?.status?.toUpperCase(),
    search: params?.search,
    sort: params?.sort,
    order: params?.order,
    page: params?.page,
    limit: params?.limit,
  }, {
    skip: options?.skip,
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

export async function checkStudentEmail(email: string) {
  return api<{ exists: boolean; name?: string }>('/students/check-email', {
    method: 'GET',
    params: { email },
  });
}

export async function createStudent(data: Partial<Student> & { invite?: boolean }) {
  const created = await api<any>('/students', {
    method: 'POST',
    body: {
      ...data,
      status: data.status?.toUpperCase(),
    },
  });

  return mapStudent(created);
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

export async function activateStudentAccount(id: string) {
  return api<{ accountId: string | null; email: string; status: string; invited: boolean }>(
    `/students/${id}/activate-account`,
    { method: 'POST' },
  );
}

export async function unlinkStudentAccount(id: string) {
  return api<{ id: string; accountId: string | null; email: string | null }>(
    `/students/${id}/unlink-account`,
    { method: 'POST' },
  );
}

// ── Notes ──

export function useStudentNotes(studentId: string | undefined) {
  return useApi<{ data: any[]; total: number }>(
    studentId ? `/students/${studentId}/notes` : null,
    { limit: 100 },
  );
}

export async function createNote(studentId: string, content: string, lessonId?: string) {
  return api(`/students/${studentId}/notes`, {
    method: 'POST',
    body: { content, lessonId },
  });
}

export async function deleteNote(studentId: string, noteId: string) {
  return api(`/students/${studentId}/notes/${noteId}`, { method: 'DELETE' });
}

export async function updateNote(studentId: string, noteId: string, content: string) {
  return api(`/students/${studentId}/notes/${noteId}`, {
    method: 'PATCH',
    body: { content },
  });
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
  body: { task: string; dueAt?: string; lessonId?: string; fileIds?: string[] },
) {
  return api(`/students/${studentId}/homework`, {
    method: 'POST',
    body,
  });
}

export async function updateHomework(
  studentId: string,
  hwId: string,
  body: {
    task?: string;
    dueAt?: string;
    status?: string;
    lessonId?: string | null;
    fileIds?: string[];
  },
) {
  return api(`/students/${studentId}/homework/${hwId}`, {
    method: 'PATCH',
    body,
  });
}

export async function deleteHomework(studentId: string, hwId: string) {
  return api(`/students/${studentId}/homework/${hwId}`, { method: 'DELETE' });
}
