import type { HomeworkFile } from '@/mocks/student-details';

export const PORTAL_REVIEW_PREFIX = 'PORTAL_REVIEW:';
export const LESSON_MATERIALS_PREFIX = 'LESSON_MATERIALS:';

export function isPortalReviewNoteContent(content: unknown): content is string {
  return typeof content === 'string' && content.startsWith(PORTAL_REVIEW_PREFIX);
}

export function isLessonMaterialsNoteContent(content: unknown): content is string {
  return typeof content === 'string' && content.startsWith(LESSON_MATERIALS_PREFIX);
}

export function isSystemLessonNoteContent(content: unknown): content is string {
  return isPortalReviewNoteContent(content) || isLessonMaterialsNoteContent(content);
}

export function parsePortalReviewNote(
  content: unknown,
): { rating: number; feedback?: string } | null {
  if (!isPortalReviewNoteContent(content)) {
    return null;
  }

  try {
    const parsed = JSON.parse(content.slice(PORTAL_REVIEW_PREFIX.length)) as {
      rating?: unknown;
      feedback?: unknown;
    };
    const rating = Number(parsed.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return null;
    }

    const feedback =
      typeof parsed.feedback === 'string' && parsed.feedback.trim().length > 0
        ? parsed.feedback.trim()
        : undefined;

    return { rating, feedback };
  } catch {
    return null;
  }
}

const normalizeMaterialFile = (raw: any): HomeworkFile | null => {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim();
  if (!id) return null;
  const provider = raw.provider || raw.cloudProvider;
  return {
    id,
    name: String(raw.name || 'Файл'),
    url: raw.url || raw.cloudUrl || '#',
    provider:
      provider === 'google-drive' || provider === 'yandex-disk'
        ? provider
        : undefined,
    type: raw.type === 'folder' ? 'folder' : 'file',
    extension: raw.extension || undefined,
    size: raw.size || undefined,
  };
};

export function parseLessonMaterialsNote(content: unknown): HomeworkFile[] {
  if (!isLessonMaterialsNoteContent(content)) {
    return [];
  }

  try {
    const parsed = JSON.parse(content.slice(LESSON_MATERIALS_PREFIX.length));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeMaterialFile(item))
      .filter((item): item is HomeworkFile => !!item);
  } catch {
    return [];
  }
}

export function buildLessonMaterialsNote(files: HomeworkFile[]): string {
  const payload = files
    .map((file) => ({
      id: file.id,
      name: file.name,
      url: file.url,
      provider: file.provider,
      type: file.type || 'file',
      extension: file.extension,
      size: file.size,
    }))
    .filter((file) => file.id);

  return `${LESSON_MATERIALS_PREFIX}${JSON.stringify(payload)}`;
}
