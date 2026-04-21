import { api } from '@/lib/api';

type PushPublicKeyResponse = {
  configured: boolean;
  publicKey: string | null;
};

type PushEnableResult = {
  enabled: boolean;
  reason?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Service Worker еще активируется. Подождите пару секунд и повторите попытку.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Не удалось включить Push-уведомления.';
}

function waitForServiceWorkerActivation(
  worker: ServiceWorker,
  timeoutMs = 10000,
) {
  if (worker.state === 'activated') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const onStateChange = () => {
      if (worker.state === 'activated') {
        cleanup();
        resolve();
      }

      if (worker.state === 'redundant') {
        cleanup();
        reject(new Error('Service Worker не активировался.'));
      }
    };

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Service Worker не успел активироваться.'));
    }, timeoutMs);

    const cleanup = () => {
      worker.removeEventListener('statechange', onStateChange);
      window.clearTimeout(timer);
    };

    worker.addEventListener('statechange', onStateChange);
  });
}

async function getActivePushRegistration() {
  const registration = await navigator.serviceWorker.register('/push-sw.js', {
    scope: '/',
  });

  if (registration.active?.state === 'activated') {
    return registration;
  }

  const transitioningWorker =
    registration.installing || registration.waiting || registration.active;

  if (transitioningWorker) {
    await waitForServiceWorkerActivation(transitioningWorker);
  }

  const readyRegistration = await navigator.serviceWorker.ready.catch(() => null);
  const resolvedRegistration =
    readyRegistration && readyRegistration.scope === registration.scope
      ? readyRegistration
      : registration;

  if (!resolvedRegistration.active || resolvedRegistration.active.state !== 'activated') {
    throw new Error('Service Worker не активирован. Обновите страницу и повторите попытку.');
  }

  return resolvedRegistration;
}

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

  try {
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

    const registration = await getActivePushRegistration();
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
  } catch (error) {
    return {
      enabled: false,
      reason: getErrorMessage(error),
    };
  }
}

export async function disablePushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration =
    (await navigator.serviceWorker.getRegistration('/')) ||
    (await navigator.serviceWorker.getRegistration()) ||
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
