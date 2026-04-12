import { api } from '@/lib/api';

type PushPublicKeyResponse = {
  configured: boolean;
  publicKey: string | null;
};

type PushEnableResult = {
  enabled: boolean;
  reason?: string;
};

function base64UrlToUint8Array(base64Url: string) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }

  return output;
}

export function isPushSupported() {
  if (typeof window === 'undefined') return false;

  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function enablePushNotifications(): Promise<PushEnableResult> {
  if (!isPushSupported()) {
    return {
      enabled: false,
      reason: 'Push не поддерживается в этом браузере.',
    };
  }

  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    return {
      enabled: false,
      reason: 'Push работает только по HTTPS.',
    };
  }

  const keyData = await api<PushPublicKeyResponse>('/notifications/push/public-key');
  if (!keyData.configured || !keyData.publicKey) {
    return {
      enabled: false,
      reason: 'Push не настроен на сервере.',
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      enabled: false,
      reason: 'Разрешите уведомления в браузере, чтобы включить Push.',
    };
  }

  const registration = await navigator.serviceWorker.register('/push-sw.js');
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(keyData.publicKey),
    });
  }

  const serialized = subscription.toJSON();
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys?.auth) {
    return {
      enabled: false,
      reason: 'Не удалось сформировать подписку браузера.',
    };
  }

  await api('/notifications/push/subscribe', {
    method: 'POST',
    body: {
      subscription: serialized,
    },
  });

  return { enabled: true };
}

export async function disablePushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration =
    (await navigator.serviceWorker.getRegistration('/push-sw.js')) ||
    (await navigator.serviceWorker.ready.catch(() => null));

  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await api('/notifications/push/unsubscribe', {
    method: 'POST',
    body: { endpoint: subscription.endpoint },
  }).catch(() => null);

  await subscription.unsubscribe().catch(() => false);
}
