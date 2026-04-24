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

export function buildPortalReviewNote(payload: {
  rating: number;
  feedback?: string | null;
}): string {
  const feedback =
    typeof payload.feedback === 'string' && payload.feedback.trim().length > 0
      ? payload.feedback.trim()
      : null;

  return `${PORTAL_REVIEW_PREFIX}${JSON.stringify({
    rating: payload.rating,
    feedback,
  })}`;
}
