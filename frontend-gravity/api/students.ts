import { api, resolveApiAssetUrl } from '@/lib/api';
import type { Student } from '@/types/student';

// ─── Raw backend shape ──────────────────────────────────────────────────────
export interface RawStudentAccount {
  avatarUrl?: string | null;
}

export interface RawStudent {
  id: string;
  name: string;
  subject?: string;
  grade?: string;
  age?: number | null;
  rate?: number;
  balance?: number | null;
  status?: string;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentWhatsapp?: string | null;
  parentTelegram?: string | null;
  parentEmail?: string | null;
  telegramChatId?: string | null;
  maxChatId?: string | null;
  email?: string | null;
  accountId?: string | null;
  notes?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  photoUrl?: string | null;
  account?: RawStudentAccount | null;
  studentAccount?: RawStudentAccount | null;
  accountAvatarUrl?: string | null;
  studentAvatarUrl?: string | null;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function resolveStudentAvatarUrl(raw: RawStudent): string | undefined {
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

export function mapStudent(raw: RawStudent): Student {
  return {
    id: raw.id,
    name: raw.name,
    avatarUrl: resolveStudentAvatarUrl(raw),
    subject: raw.subject ?? '',
    grade: raw.grade || '',
    age: raw.age ?? undefined,
    rate: raw.rate ?? 0,
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

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function checkStudentEmail(email: string) {
  return api<{ exists: boolean; name?: string }>('/students/check-email', {
    method: 'GET',
    params: { email },
  });
}

export async function createStudent(data: Partial<Student> & { invite?: boolean }) {
  const created = await api<RawStudent>('/students', {
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

// ─── Notes ──────────────────────────────────────────────────────────────────

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

// ─── Homework ────────────────────────────────────────────────────────────────

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
