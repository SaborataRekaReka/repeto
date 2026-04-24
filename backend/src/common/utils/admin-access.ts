const DEFAULT_ADMIN_EMAILS = ['breneize@yandex.ru'];

function normalizeEmail(value?: string | null) {
  return (value || '').trim().toLowerCase();
}

function buildAdminEmailSet() {
  const fromEnv = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  const all = [...DEFAULT_ADMIN_EMAILS.map((email) => normalizeEmail(email)), ...fromEnv];
  return new Set(all);
}

const ADMIN_EMAILS = buildAdminEmailSet();

export function isAdminEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return normalized ? ADMIN_EMAILS.has(normalized) : false;
}

export function resolveUserRole(email?: string | null): 'admin' | 'tutor' {
  return isAdminEmail(email) ? 'admin' : 'tutor';
}
