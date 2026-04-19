export function getPrimaryFrontendUrl(
  fallback: string = 'http://localhost:3300',
): string {
  const raw = process.env.FRONTEND_URL || '';
  const primary =
    raw
      .split(',')
      .map((value) => value.trim())
      .find(Boolean) || fallback;

  return primary.replace(/\/+$/, '');
}
