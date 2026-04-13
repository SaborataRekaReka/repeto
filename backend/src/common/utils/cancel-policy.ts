export type PolicyAction = 'full' | 'half' | 'none';

export interface CancelPolicy {
  freeHours: number;
  lateCancelAction: PolicyAction;
  noShowAction: PolicyAction;
  lateCancelCost?: number;
}

export function normalizePolicyAction(
  action: unknown,
  fallback: PolicyAction = 'full',
): PolicyAction {
  const normalized = String(action ?? '').trim().toLowerCase();

  if (normalized === 'full' || normalized === 'full_charge' || normalized === 'charge') {
    return 'full';
  }
  if (normalized === 'half' || normalized === 'half_charge') {
    return 'half';
  }
  if (normalized === 'none' || normalized === 'no_charge') {
    return 'none';
  }

  return fallback;
}

export function mapCancelPolicy(raw: unknown): CancelPolicy {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const freeHoursValue = Number(obj.cancelTimeHours ?? obj.freeHours ?? 24);
  const freeHours =
    Number.isFinite(freeHoursValue) && freeHoursValue >= 0 ? freeHoursValue : 24;

  const lateCancelCostValue = Number(obj.lateCancelCost);
  const lateCancelCost =
    Number.isFinite(lateCancelCostValue) && lateCancelCostValue > 0
      ? lateCancelCostValue
      : undefined;

  return {
    freeHours,
    lateCancelAction: normalizePolicyAction(
      obj.lateCancelAction ?? obj.lateAction,
      'full',
    ),
    noShowAction: normalizePolicyAction(obj.noShowAction, 'full'),
    lateCancelCost,
  };
}

export function calculatePenalty(
  rate: number,
  action: PolicyAction,
): number | null {
  if (action === 'none') return null;
  if (action === 'half') return Math.round(rate / 2);
  return rate;
}
