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
): { rating: number; feedback?: string; tags: string[] } | null {
  if (!isPortalReviewNoteContent(content)) {
    return null;
  }

  try {
    const parsed = JSON.parse(content.slice(PORTAL_REVIEW_PREFIX.length)) as {
      rating?: unknown;
      feedback?: unknown;
      tags?: unknown;
    };
    const rating = Number(parsed.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return null;
    }

    const feedback =
      typeof parsed.feedback === 'string' && parsed.feedback.trim().length > 0
        ? parsed.feedback.trim()
        : undefined;

    const tags = normalizePortalReviewTags(parsed.tags);

    return { rating, feedback, tags };
  } catch {
    return null;
  }
}

export function normalizePortalReviewTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const tag = item.trim().slice(0, 48);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= 8) break;
  }

  return tags;
}

export function buildPortalReviewNote(payload: {
  rating: number;
  feedback?: string | null;
  tags?: unknown;
}): string {
  const feedback =
    typeof payload.feedback === 'string' && payload.feedback.trim().length > 0
      ? payload.feedback.trim()
      : null;

  return `${PORTAL_REVIEW_PREFIX}${JSON.stringify({
    rating: payload.rating,
    feedback,
    tags: normalizePortalReviewTags(payload.tags),
  })}`;
}
