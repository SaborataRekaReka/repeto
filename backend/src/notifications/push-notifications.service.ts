import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import * as webpush from 'web-push';

type StoredPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  type?: string;
};

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly subject: string;
  private readonly configured: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cfg: AppConfigService,
  ) {
    this.publicKey = this.cfg.vapidPublicKey || '';
    this.privateKey = this.cfg.vapidPrivateKey || '';
    this.subject = this.cfg.vapidSubject;
    this.configured = Boolean(this.publicKey && this.privateKey);
    if (this.configured) {
      webpush.setVapidDetails(this.subject, this.publicKey, this.privateKey);
    } else {
      this.logger.warn('Web Push disabled: VAPID keys are not configured');
    }
  }

  getPublicKey() {
    return {
      configured: this.configured,
      publicKey: this.configured ? this.publicKey : null,
    };
  }

  async subscribe(userId: string, rawSubscription: unknown) {
    this.ensureConfigured();

    const subscription = this.normalizeSubscription(rawSubscription);
    if (!subscription) {
      throw new BadRequestException('Invalid Push subscription payload');
    }

    const settings = await this.getSettings(userId);
    const existing = this.extractSubscriptions(settings).filter(
      (item) => item.endpoint !== subscription.endpoint,
    );
    existing.push(subscription);

    await this.saveSubscriptions(userId, settings, existing);

    return { subscribed: true, total: existing.length };
  }

  async unsubscribe(userId: string, endpoint: string) {
    if (!endpoint?.trim()) {
      throw new BadRequestException('endpoint is required');
    }

    const settings = await this.getSettings(userId);
    const existing = this.extractSubscriptions(settings);
    const next = existing.filter((item) => item.endpoint !== endpoint);

    if (next.length !== existing.length) {
      await this.saveSubscriptions(userId, settings, next);
    }

    return { unsubscribed: true, total: next.length };
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!this.configured) {
      return { sent: 0, failed: 0, total: 0 };
    }

    const settings = await this.getSettings(userId);
    const subscriptions = this.extractSubscriptions(settings);

    if (!subscriptions.length) {
      return { sent: 0, failed: 0, total: 0 };
    }

    const validSubscriptions: StoredPushSubscription[] = [];
    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/notifications',
            type: payload.type || 'system',
          }),
        );
        sent += 1;
        validSubscriptions.push(subscription);
      } catch (error: any) {
        const statusCode = Number(error?.statusCode || error?.status);
        failed += 1;

        if (statusCode !== 404 && statusCode !== 410) {
          validSubscriptions.push(subscription);
          this.logger.warn(
            `Push delivery failed for user ${userId}: ${error?.message || 'unknown error'}`,
          );
        }
      }
    }

    if (validSubscriptions.length !== subscriptions.length) {
      await this.saveSubscriptions(userId, settings, validSubscriptions);
    }

    return { sent, failed, total: subscriptions.length };
  }

  private ensureConfigured() {
    if (!this.configured) {
      throw new BadRequestException('Push notifications are not configured on server');
    }
  }

  private async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    });

    if (!user?.notificationSettings || typeof user.notificationSettings !== 'object') {
      return {} as Record<string, unknown>;
    }

    return user.notificationSettings as Record<string, unknown>;
  }

  private async saveSubscriptions(
    userId: string,
    settings: Record<string, unknown>,
    subscriptions: StoredPushSubscription[],
  ) {
    const nextSettings = {
      ...settings,
      pushSubscriptions: subscriptions,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationSettings: nextSettings as any },
    });
  }

  private extractSubscriptions(settings: Record<string, unknown>): StoredPushSubscription[] {
    const raw = settings.pushSubscriptions;
    if (!Array.isArray(raw)) return [];

    const normalized = raw
      .map((item) => this.normalizeSubscription(item))
      .filter((item): item is StoredPushSubscription => Boolean(item));

    const unique = new Map<string, StoredPushSubscription>();
    for (const item of normalized) {
      unique.set(item.endpoint, item);
    }

    return Array.from(unique.values());
  }

  private normalizeSubscription(raw: unknown): StoredPushSubscription | null {
    if (!raw || typeof raw !== 'object') return null;

    const value = raw as {
      endpoint?: unknown;
      expirationTime?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
    };

    const endpoint = typeof value.endpoint === 'string' ? value.endpoint.trim() : '';
    const p256dh = typeof value.keys?.p256dh === 'string' ? value.keys.p256dh : '';
    const auth = typeof value.keys?.auth === 'string' ? value.keys.auth : '';

    if (!endpoint || !p256dh || !auth) return null;

    const expirationTime =
      typeof value.expirationTime === 'number' ? value.expirationTime : null;

    return {
      endpoint,
      expirationTime,
      keys: { p256dh, auth },
    };
  }
}