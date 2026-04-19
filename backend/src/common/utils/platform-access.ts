export type PlatformAccessState = 'active' | 'expired' | 'missing';

export type PlatformPlanId = 'start' | 'profi' | 'center';
export type PlatformBillingCycle = 'month' | 'year';

export type NormalizedPlatformAccess = {
  status: string | null;
  planId: PlatformPlanId | null;
  billingCycle: PlatformBillingCycle | null;
  activatedAt: string | null;
  expiresAt: string | null;
  amountRub: number | null;
  paymentId: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number.parseFloat(value);
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return null;
}

export function isPlatformPlanId(value: unknown): value is PlatformPlanId {
  return value === 'start' || value === 'profi' || value === 'center';
}

export function isPlatformBillingCycle(value: unknown): value is PlatformBillingCycle {
  return value === 'month' || value === 'year';
}

export function extractPlatformAccess(paymentSettings: unknown): Record<string, unknown> | null {
  const settings = asRecord(paymentSettings);
  if (!settings) {
    return null;
  }

  const access = asRecord(settings.platformAccess);
  return access || null;
}

export function normalizePlatformAccess(paymentSettings: unknown): NormalizedPlatformAccess | null {
  const platformAccess = extractPlatformAccess(paymentSettings);
  if (!platformAccess) {
    return null;
  }

  const rawPlanId = asString(platformAccess.planId);
  const rawBillingCycle = asString(platformAccess.billingCycle);

  return {
    status: asString(platformAccess.status),
    planId: isPlatformPlanId(rawPlanId) ? rawPlanId : null,
    billingCycle: isPlatformBillingCycle(rawBillingCycle) ? rawBillingCycle : null,
    activatedAt: asString(platformAccess.activatedAt),
    expiresAt: asString(platformAccess.expiresAt),
    amountRub: asNumber(platformAccess.amountRub),
    paymentId: asString(platformAccess.paymentId),
  };
}

export function calculatePlatformAccessExpiresAt(
  activatedAt: Date,
  billingCycle: PlatformBillingCycle,
): Date {
  const expiresAt = new Date(activatedAt);

  if (billingCycle === 'year') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    return expiresAt;
  }

  expiresAt.setMonth(expiresAt.getMonth() + 1);
  return expiresAt;
}

export function getPlatformAccessState(paymentSettings: unknown): PlatformAccessState {
  const platformAccess = normalizePlatformAccess(paymentSettings);
  if (!platformAccess) {
    return 'missing';
  }

  const status = (platformAccess.status || '').toLowerCase();
  if (status && status !== 'active') {
    return 'expired';
  }

  if (!platformAccess.expiresAt) {
    return 'active';
  }

  const expiresAt = new Date(platformAccess.expiresAt);
  if (!Number.isFinite(expiresAt.getTime())) {
    return 'active';
  }

  return expiresAt <= new Date() ? 'expired' : 'active';
}