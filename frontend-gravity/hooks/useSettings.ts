import { useApi } from './useApi';
import { api } from '@/lib/api';

export function useSettings() {
  return useApi<any>('/settings');
}

export function useProfile() {
  return useApi<any>('/profile');
}

export function useProfileStats() {
  return useApi<any>('/profile/stats');
}

export async function updateAccount(data: Record<string, unknown>) {
  return api('/settings/account', { method: 'PATCH', body: data });
}

export type AccountSlugCheckResponse = {
  requested: string;
  isAvailable: boolean;
  suggested: string;
};

export async function checkAccountSlug(data: { value?: string; name?: string }) {
  return api<AccountSlugCheckResponse>('/settings/account/slug', {
    method: 'GET',
    params: data,
  });
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return api<{ avatarUrl: string }>('/settings/avatar', {
    method: 'POST',
    body: formData,
  });
}

export type CertificateEntry = {
  id: string;
  title: string;
  fileUrl: string;
  uploadedAt: string;
  verified?: boolean;
  verificationLabel?: string | null;
};

export async function uploadCertificate(file: File, title?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }

  return api<CertificateEntry>('/settings/certificates', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteCertificate(certId: string) {
  return api<{ deleted: boolean }>(`/settings/certificates/${encodeURIComponent(certId)}`, {
    method: 'DELETE',
  });
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return api('/settings/change-password', { method: 'POST', body: data });
}

export async function deleteAccount(password: string) {
  return api('/settings/account', { method: 'DELETE', body: { password } });
}

export async function updateNotificationSettings(data: Record<string, unknown>) {
  return api('/settings/notifications', { method: 'PATCH', body: data });
}

export async function updatePolicies(data: Record<string, unknown>) {
  return api('/settings/policies', { method: 'PATCH', body: data });
}

export async function connectYukassa(data: { shopId: string; secretKey: string }) {
  return api('/settings/integrations/yukassa', { method: 'POST', body: data });
}

export async function startYandexDiskConnect(data?: { rootPath?: string }) {
  return api<
    | { oauthConfigured: false }
    | { oauthConfigured: true; authUrl: string; rootPath: string; expiresInSec: number }
  >('/settings/integrations/yandex-disk/start', {
    method: 'POST',
    body: data || {},
  });
}

export async function connectYandexDiskToken(data: { token: string; rootPath?: string }) {
  return api<{
    connected: boolean;
    rootPath: string;
    email: string;
    syncedItems: number;
  }>('/settings/integrations/yandex-disk/connect-token', {
    method: 'POST',
    body: data,
  });
}

export async function completeYandexDiskConnect(data: { code: string; state: string }) {
  return api<{
    connected: boolean;
    rootPath: string;
    email: string;
    syncedItems: number;
  }>('/settings/integrations/yandex-disk/complete', {
    method: 'POST',
    body: data,
  });
}

export async function syncYandexDiskIntegration() {
  return api('/settings/integrations/yandex-disk/sync', { method: 'POST' });
}

// ── Google Calendar ──

export async function startGoogleCalendarConnect() {
  return api<
    | { oauthConfigured: false }
    | { oauthConfigured: true; authUrl: string }
  >('/settings/integrations/google-calendar/start', {
    method: 'POST',
    body: {},
  });
}

export async function completeGoogleCalendarConnect(data: { code: string }) {
  return api<{ connected: boolean; email: string }>(
    '/settings/integrations/google-calendar/complete',
    { method: 'POST', body: data },
  );
}

export async function syncGoogleCalendar() {
  return api<{ synced: number; errors: number }>(
    '/settings/integrations/google-calendar/sync',
    { method: 'POST' },
  );
}

export async function pullGoogleCalendar() {
  return api<{ created: number; updated: number; cancelled: number }>(
    '/settings/integrations/google-calendar/pull',
    { method: 'POST' },
  );
}

// ── Google Drive ──

export async function startGoogleDriveConnect() {
  return api<
    | { oauthConfigured: false }
    | { oauthConfigured: true; authUrl: string }
  >('/settings/integrations/google-drive/start', {
    method: 'POST',
    body: {},
  });
}

export async function completeGoogleDriveConnect(data: { code: string }) {
  return api<{
    connected: boolean;
    email: string;
    rootPath: string;
    syncedItems?: number;
  }>(
    '/settings/integrations/google-drive/complete',
    { method: 'POST', body: data },
  );
}

// ── Yandex Calendar ──

export async function startYandexCalendarConnect() {
  return api<
    | { oauthConfigured: false }
    | { oauthConfigured: true; authUrl: string }
  >('/settings/integrations/yandex-calendar/start', {
    method: 'POST',
    body: {},
  });
}

export async function connectYandexCalendarToken(data: { token: string }) {
  return api<{ connected: boolean; email: string }>(
    '/settings/integrations/yandex-calendar/connect-token',
    { method: 'POST', body: data },
  );
}

export async function syncYandexCalendar() {
  return api<{ synced: number; errors: number }>(
    '/settings/integrations/yandex-calendar/sync',
    { method: 'POST' },
  );
}

export async function pullYandexCalendar() {
  return api<{ updated: number; cancelled: number }>(
    '/settings/integrations/yandex-calendar/pull',
    { method: 'POST' },
  );
}

export async function disconnectIntegration(type: string) {
  return api(`/settings/integrations/${type}`, { method: 'DELETE' });
}
