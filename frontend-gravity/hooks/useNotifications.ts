import { useApi } from './useApi';
import { api } from '@/lib/api';
import type { Notification } from '@/types/notification';

const NOTIFICATIONS_CHANGED_EVENT = 'repeto:notifications-changed';

export function emitNotificationsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}

export function onNotificationsChanged(handler: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
}

function isNetworkFetchError(error: unknown): boolean {
  return error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch');
}

function mapNotification(raw: any): Notification {
  const createdAt = new Date(raw.createdAt);
  const now = new Date();
  const diff = now.getTime() - createdAt.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  let time: string;
  if (mins < 1) time = 'Только что';
  else if (mins < 60) time = `${mins} мин назад`;
  else if (hours < 24) time = `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`;
  else if (days === 1) time = 'Вчера';
  else time = `${days} дн. назад`;

  return {
    id: raw.id,
    type: (raw.type || 'system').toLowerCase() as Notification['type'],
    title: raw.title,
    description: raw.message || raw.description || '',
    time,
    read: raw.read ?? false,
    actionLabel: raw.actionLabel || undefined,
    actionUrl: raw.actionUrl || undefined,
    bookingRequestId: raw.bookingRequestId || undefined,
    studentId: raw.studentId || raw.student?.id || undefined,
    lessonId: raw.lessonId || undefined,
  };
}

type NotificationsResponse = {
  data: any[];
  total: number;
  page: number;
  pages: number;
};

export function useNotifications(params?: {
  type?: string;
  read?: boolean;
  page?: number;
  limit?: number;
}) {
  const result = useApi<NotificationsResponse>('/notifications', {
    type: params?.type?.toUpperCase(),
    read: params?.read,
    page: params?.page,
    limit: params?.limit,
  });

  return {
    ...result,
    data: result.data
      ? {
          ...result.data,
          data: result.data.data.map(mapNotification),
        }
      : undefined,
  };
}

export function useUnreadCount() {
  return useApi<{ count: number }>('/notifications/unread-count', undefined, {
    refreshInterval: 60000,
  });
}

export async function markAsRead(id: string) {
  let result;
  try {
    result = await api(`/notifications/${id}/read`, { method: 'PATCH' });
  } catch (error) {
    if (!isNetworkFetchError(error)) {
      throw error;
    }
    result = await api(`/notifications/${id}/read`, { method: 'POST' });
  }
  emitNotificationsChanged();
  return result;
}

export async function markAllAsRead() {
  let result;
  try {
    result = await api('/notifications/read-all', { method: 'PATCH' });
  } catch (error) {
    if (!isNetworkFetchError(error)) {
      throw error;
    }
    result = await api('/notifications/read-all', { method: 'POST' });
  }
  emitNotificationsChanged();
  return result;
}

export async function confirmBooking(notificationId: string) {
  const result = await api(`/notifications/${notificationId}/confirm-booking`, { method: 'POST' });
  emitNotificationsChanged();
  return result;
}

export async function rejectBooking(notificationId: string) {
  const result = await api(`/notifications/${notificationId}/reject-booking`, { method: 'POST' });
  emitNotificationsChanged();
  return result;
}

export async function confirmReschedule(notificationId: string) {
  const result = await api(`/notifications/${notificationId}/confirm-reschedule`, { method: 'POST' });
  emitNotificationsChanged();
  return result;
}

export async function rejectReschedule(notificationId: string) {
  const result = await api(`/notifications/${notificationId}/reject-reschedule`, { method: 'POST' });
  emitNotificationsChanged();
  return result;
}

export async function sendDebtReminder(studentId: string, comment?: string) {
  const result = await api<{
    sent: boolean;
    telegram: boolean;
    max: boolean;
    debtAmount: number;
  }>(`/notifications/send-debt-reminder/${studentId}`, {
    method: 'POST',
    body: { comment },
  });
  emitNotificationsChanged();
  return result;
}

export async function sendReminder(studentId: string, body: {
  type: 'payment' | 'lesson' | 'homework';
  lessonIds?: string[];
  homeworkIds?: string[];
  comment?: string;
  notifyParent?: boolean;
}) {
  const result = await api<{
    sent: boolean;
    telegram: boolean;
    max: boolean;
    parentNotified: boolean;
  }>(`/notifications/send-reminder/${studentId}`, {
    method: 'POST',
    body,
  });
  emitNotificationsChanged();
  return result;
}
