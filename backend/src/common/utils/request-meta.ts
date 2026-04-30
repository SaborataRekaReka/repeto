import { Request } from 'express';

export type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
};

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return value || null;
}

export function getRequestMeta(req?: Request | null): RequestMeta {
  if (!req) {
    return {
      ipAddress: null,
      userAgent: null,
    };
  }

  const forwardedFor = firstHeaderValue(req.headers['x-forwarded-for']);
  const ipFromHeader = forwardedFor?.split(',').map((part) => part.trim()).find(Boolean) || null;
  const ipAddress = ipFromHeader || req.ip || null;
  const userAgent = firstHeaderValue(req.headers['user-agent']);

  return {
    ipAddress,
    userAgent,
  };
}
