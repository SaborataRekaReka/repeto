export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';
export const API_ORIGIN = API_BASE.replace(/\/api$/, '');

export function resolveApiAssetUrl(value?: string | null) {
  if (!value) return undefined;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return value.startsWith('/') ? value : `/${value}`;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

const VALIDATION_TRANSLATIONS: Record<string, string> = {
  'password must be longer than or equal to 8 characters': 'Пароль должен содержать минимум 8 символов',
  'name must be longer than or equal to 2 characters': 'Имя должно содержать минимум 2 символа',
  'email must be an email': 'Укажите корректный email',
  'password must be a string': 'Пароль обязателен',
  'name must be a string': 'Укажите имя',
  'email should not be empty': 'Укажите email',
  'password should not be empty': 'Укажите пароль',
};

function translateValidation(msg: string): string {
  return VALIDATION_TRANSLATIONS[msg.toLowerCase()] || VALIDATION_TRANSLATIONS[msg] || msg;
}

function extractErrorMessage(
  status: number,
  statusText: string,
  data?: unknown
): string {
  if (data && typeof data === 'object') {
    const payload = data as { message?: unknown; error?: unknown };

    if (Array.isArray(payload.message)) {
      const parts = payload.message
        .filter((m): m is string => typeof m === 'string')
        .map(translateValidation);
      if (parts.length > 0) return parts.join('; ');
    }

    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return translateValidation(payload.message);
    }

    if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
      return payload.error;
    }
  }

  return 'Запрос не выполнен';
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      accessToken = null;
      return null;
    }
    const data = await res.json();
    accessToken = data.accessToken;
    return accessToken;
  } catch {
    accessToken = null;
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(extractErrorMessage(status, statusText, data));
    this.name = 'ApiError';
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, headers: customHeaders, ...rest } = options;

  // Build URL with query params
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        searchParams.set(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...rest,
    cache: 'no-store',
    headers,
    credentials: 'include',
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  // Handle 401 — try refresh once
  if (res.status === 401 && accessToken) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, {
        ...rest,
        cache: 'no-store',
        headers,
        credentials: 'include',
        body: body
          ? body instanceof FormData
            ? body
            : JSON.stringify(body)
          : undefined,
      });
      if (!retryRes.ok) {
        const errData = await retryRes.json().catch(() => null);
        throw new ApiError(retryRes.status, retryRes.statusText, errData);
      }
      if (retryRes.status === 204) return undefined as T;
      return retryRes.json();
    }

    // Refresh failed — let AuthContext handle routing
    accessToken = null;
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new ApiError(res.status, res.statusText, errData);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
