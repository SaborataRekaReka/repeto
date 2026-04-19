import { useApi } from './useApi';
import { api, resolveApiAssetUrl } from '@/lib/api';
import type { Student, StudentAvatarTone } from '@/types/student';

// Backend returns UPPER_CASE statuses, frontend uses lowercase
const EMOJI_AVATAR_POOL = [
  '📚', '🧠', '🎯', '🚀', '🌟', '🧩', '🎨', '⚡', '🌈', '📘',
  '🔬', '🧪', '🔭', '🧮', '📝', '📌', '🧭', '💡', '🎵', '🎬',
  '🎲', '🕹️', '🪐', '🌱', '🍀', '🌻', '🌊', '☀️', '☁️', '🍎',
  '🍓', '🍇', '🍉', '🥝', '🐬', '🐼', '🦊', '🐯', '🐨', '🐳',
  '🦄', '🧸', '🏆', '🎖️', '🎻', '🎹', '📷', '🎤', '🧵', '🛸',
] as const;

const EMOJI_AVATAR_BACKGROUNDS = [
  'linear-gradient(135deg, #eaf4ff 0%, #cbe5ff 100%)',
  'linear-gradient(135deg, #efe7ff 0%, #d8c8ff 100%)',
  'linear-gradient(135deg, #ffe8db 0%, #ffc7ab 100%)',
  'linear-gradient(135deg, #e6ecff 0%, #cfd8ff 100%)',
  'linear-gradient(135deg, #fff1cb 0%, #ffe09a 100%)',
  'linear-gradient(135deg, #e8f9e1 0%, #c8ebad 100%)',
  'linear-gradient(135deg, #ffe8f2 0%, #ffcfe2 100%)',
  'linear-gradient(135deg, #fff5d8 0%, #ffe8af 100%)',
  'linear-gradient(135deg, #e8f9ff 0%, #c9edff 100%)',
  'linear-gradient(135deg, #dfe9ff 0%, #c1d3ff 100%)',
  'linear-gradient(135deg, #f2f7ff 0%, #dae7ff 100%)',
  'linear-gradient(135deg, #f6f0ff 0%, #dfd1ff 100%)',
  'linear-gradient(135deg, #fff0e6 0%, #ffd8c1 100%)',
  'linear-gradient(135deg, #e9f8f2 0%, #c8ebdd 100%)',
  'linear-gradient(135deg, #fff3de 0%, #ffe2b8 100%)',
  'linear-gradient(135deg, #e7fbff 0%, #c8eef7 100%)',
  'linear-gradient(135deg, #fceeff 0%, #e8d1ff 100%)',
  'linear-gradient(135deg, #f0ffe9 0%, #daf4c9 100%)',
  'linear-gradient(135deg, #fff2f2 0%, #ffd9d9 100%)',
  'linear-gradient(135deg, #edf7ff 0%, #d3e9ff 100%)',
  'linear-gradient(135deg, #f8f0e8 0%, #edd7c4 100%)',
  'linear-gradient(135deg, #f1f5ff 0%, #dbe2ff 100%)',
  'linear-gradient(135deg, #e9faf5 0%, #cdeedd 100%)',
  'linear-gradient(135deg, #fff7e7 0%, #ffe9c4 100%)',
] as const;

const EMOJI_AVATAR_TONES: readonly StudentAvatarTone[] = [
  'soft',
  'normal',
  'strong',
] as const;

type EmojiAvatarTheme = {
  emoji: string;
  background: string;
  tone: StudentAvatarTone;
};

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickByHash<T>(items: readonly T[], seed: string, salt: string): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty collection');
  }

  const hash = stableHash(`${seed}:${salt}`);
  return items[hash % items.length] as T;
}

function resolveStudentAvatarUrl(raw: any): string | undefined {
  return resolveApiAssetUrl(raw.avatarUrl ?? raw.avatar ?? raw.photoUrl ?? null);
}

function resolveStudentEmojiTheme(raw: any): EmojiAvatarTheme {
  const seedSource = String(raw.id || raw.name || 'student').trim() || 'student';

  return {
    emoji: pickByHash(EMOJI_AVATAR_POOL, seedSource, 'emoji'),
    background: pickByHash(EMOJI_AVATAR_BACKGROUNDS, seedSource, 'background'),
    tone: pickByHash(EMOJI_AVATAR_TONES, seedSource, 'tone'),
  };
}

function mapStudent(raw: any): Student {
  const emojiTheme = resolveStudentEmojiTheme(raw);

  return {
    id: raw.id,
    name: raw.name,
    avatarUrl: resolveStudentAvatarUrl(raw),
    avatarEmoji: emojiTheme.emoji,
    avatarBackground: emojiTheme.background,
    avatarTone: emojiTheme.tone,
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

export async function createStudent(data: Partial<Student>) {
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
  return api<{ accountId: string; email: string; status: string; invited: boolean }>(
    `/students/${id}/activate-account`,
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
