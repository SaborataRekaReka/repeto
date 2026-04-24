import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed wrapper around ConfigService.
 * All environment variable access should go through this service —
 * no direct `process.env` in domain services/modules.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  // ─── Core ─────────────────────────────────────────────────────────────────

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.config.get<number>('PORT', 3200);
  }

  get frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:3300');
  }

  get allowedOrigins(): string[] {
    return this.frontendUrl
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  // ─── Auth / JWT ────────────────────────────────────────────────────────────

  get jwtSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  get jwtAccessExpiresIn(): string {
    return this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
  }

  get authRegistrationCodeSecret(): string | undefined {
    return this.config.get<string>('AUTH_REGISTRATION_CODE_SECRET');
  }

  get studentOtpSecret(): string | undefined {
    return this.config.get<string>('STUDENT_OTP_SECRET');
  }

  // ─── Database / Cache ──────────────────────────────────────────────────────

  get databaseUrl(): string {
    return this.config.getOrThrow<string>('DATABASE_URL');
  }

  get redisUrl(): string {
    return this.config.getOrThrow<string>('REDIS_URL');
  }

  // ─── Email (Resend) ────────────────────────────────────────────────────────

  get resendApiKey(): string | undefined {
    return this.config.get<string>('RESEND_API_KEY');
  }

  get resendFromEmail(): string {
    return this.config.get<string>('RESEND_FROM_EMAIL', 'noreply@repeto.ru');
  }

  // ─── Email (SMTP fallback) ─────────────────────────────────────────────────

  get smtpHost(): string | undefined {
    return this.config.get<string>('SMTP_HOST');
  }

  get smtpPort(): number {
    return this.config.get<number>('SMTP_PORT', 587);
  }

  get smtpSecure(): boolean {
    return this.config.get<string>('SMTP_SECURE', 'false') === 'true';
  }

  get smtpUser(): string | undefined {
    return this.config.get<string>('SMTP_USER');
  }

  get smtpPass(): string | undefined {
    return this.config.get<string>('SMTP_PASS');
  }

  get smtpFromEmail(): string {
    return this.config.get<string>('SMTP_FROM_EMAIL', 'noreply@repeto.ru');
  }

  // ─── Push Notifications ────────────────────────────────────────────────────

  get vapidPublicKey(): string | undefined {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? this.config.get<string>('WEB_PUSH_PUBLIC_KEY');
  }

  get vapidPrivateKey(): string | undefined {
    return this.config.get<string>('VAPID_PRIVATE_KEY') ?? this.config.get<string>('WEB_PUSH_PRIVATE_KEY');
  }

  get vapidSubject(): string {
    return (
      this.config.get<string>('VAPID_SUBJECT') ??
      this.config.get<string>('WEB_PUSH_SUBJECT') ??
      'mailto:admin@repeto.ru'
    );
  }

  // ─── Messenger bots ───────────────────────────────────────────────────────

  get telegramBotToken(): string | undefined {
    return this.config.get<string>('TELEGRAM_BOT_TOKEN');
  }

  get maxBotToken(): string | undefined {
    return this.config.get<string>('MAX_BOT_TOKEN');
  }

  get messengerTestMode(): boolean {
    return this.config.get<string>('MESSENGER_TEST_MODE', 'false') === 'true';
  }

  // ─── YooKassa ─────────────────────────────────────────────────────────────

  get yukassaShopId(): string | undefined {
    return this.config.get<string>('YUKASSA_SHOP_ID');
  }

  get yukassaSecretKey(): string | undefined {
    return this.config.get<string>('YUKASSA_SECRET_KEY');
  }

  get yukassaPlatformShopId(): string | undefined {
    return this.config.get<string>('YUKASSA_PLATFORM_SHOP_ID');
  }

  get yukassaPlatformSecretKey(): string | undefined {
    return this.config.get<string>('YUKASSA_PLATFORM_SECRET_KEY');
  }

  // ─── Yandex Disk ──────────────────────────────────────────────────────────

  get yandexDiskStateSecret(): string | undefined {
    return this.config.get<string>('YANDEX_DISK_STATE_SECRET');
  }

  // ─── Monitoring ───────────────────────────────────────────────────────────

  get sentryDsn(): string | undefined {
    return this.config.get<string>('SENTRY_DSN');
  }

  // ─── Admin / E2E ──────────────────────────────────────────────────────────

  get adminEmails(): string[] {
    const raw = this.config.get<string>('ADMIN_EMAILS', '');
    return raw.split(',').map((e) => e.trim()).filter(Boolean);
  }

  get e2eTestHarnessKey(): string | undefined {
    return this.config.get<string>('E2E_TEST_HARNESS_KEY');
  }

  get allowProductionDemoSeed(): boolean {
    return this.config.get<string>('ALLOW_PRODUCTION_DEMO_SEED', 'false') === 'true';
  }
}
