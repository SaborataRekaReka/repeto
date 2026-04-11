import { useApi } from './useApi';
import { api } from '@/lib/api';

export type AvailabilitySlot = {
  id: string;
  dayOfWeek: number; // 0=Mon … 6=Sun
  startTime: string;
  endTime: string;
};

export type AvailabilityOverride = {
  date: string; // "YYYY-MM-DD"
  isBlocked: boolean;
  slots: { startTime: string; endTime: string }[];
};

export function useAvailability() {
  return useApi<AvailabilitySlot[]>('/availability');
}

export async function setAvailability(slots: Omit<AvailabilitySlot, 'id'>[]) {
  return api<AvailabilitySlot[]>('/availability', {
    method: 'PUT',
    body: { slots },
  });
}

export function useOverrides() {
  return useApi<AvailabilityOverride[]>('/availability/overrides');
}

export async function setOverride(
  date: string,
  isBlocked: boolean,
  slots?: { startTime: string; endTime: string }[],
) {
  return api<AvailabilityOverride[]>(`/availability/overrides/${date}`, {
    method: 'PUT',
    body: { isBlocked, slots: slots || [] },
  });
}

export async function deleteOverride(date: string) {
  return api<AvailabilityOverride[]>(`/availability/overrides/${date}`, {
    method: 'DELETE',
  });
}
