import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CloudProvider, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import {
  UpdateAccountDto,
  ChangePasswordDto,
  UpdateNotificationsDto,
  UpdatePoliciesDto,
} from './dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  private normalizeYandexRootPath(raw?: string | null) {
    const value = (raw || '').trim();

    if (!value || value === '/' || value === 'disk:/' || value === 'disk:') {
      return 'disk:/';
    }

    if (value.startsWith('disk:/')) {
      return value.length > 6 && value.endsWith('/') ? value.slice(0, -1) : value;
    }

    if (value.startsWith('/')) {
      return value.length > 1 && value.endsWith('/')
        ? `disk:${value.slice(0, -1)}`
        : `disk:${value}`;
    }

    return value.endsWith('/') ? `disk:/${value.slice(0, -1)}` : `disk:/${value}`;
  }

  private toDisplayYandexRootPath(normalized?: string | null) {
    if (!normalized || normalized === 'disk:/') {
      return '/';
    }

    if (normalized.startsWith('disk:/')) {
      return normalized.slice('disk:'.length);
    }

    return normalized;
  }

  private getYandexClientId(): string | null {
    return process.env.YANDEX_DISK_CLIENT_ID || null;
  }

  private getYandexClientSecret(): string | null {
    return process.env.YANDEX_DISK_CLIENT_SECRET || null;
  }

  private getYandexRedirectUri() {
    if (process.env.YANDEX_DISK_REDIRECT_URI) {
      return process.env.YANDEX_DISK_REDIRECT_URI;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3100';
    return `${frontendUrl}/settings?tab=integrations&integration=yandex-disk`;
  }

  private getYandexStateSecret() {
    return process.env.YANDEX_DISK_STATE_SECRET || process.env.JWT_SECRET || 'repeto-yandex-state-secret';
  }

  private encodeYandexState(payload: {
    userId: string;
    rootPath: string;
    ts: number;
    nonce: string;
  }) {
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.getYandexStateSecret())
      .update(encodedPayload)
      .digest('base64url');

    return `${encodedPayload}.${signature}`;
  }

  private decodeYandexState(state: string) {
    const [encodedPayload, signature] = state.split('.');
    if (!encodedPayload || !signature) {
      throw new BadRequestException('Некорректный state OAuth');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.getYandexStateSecret())
      .update(encodedPayload)
      .digest('base64url');

    const expected = Buffer.from(expectedSignature);
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      throw new BadRequestException('Подпись state OAuth не прошла проверку');
    }

    let payload: { userId?: string; rootPath?: string; ts?: number };
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    } catch {
      throw new BadRequestException('Некорректный payload state OAuth');
    }

    if (!payload.userId || !payload.rootPath || !payload.ts) {
      throw new BadRequestException('State OAuth не содержит обязательных полей');
    }

    const ttlMs = 15 * 60 * 1000;
    if (Date.now() - payload.ts > ttlMs) {
      throw new BadRequestException('State OAuth устарел. Повторите подключение.');
    }

    return {
      userId: payload.userId,
      rootPath: this.normalizeYandexRootPath(payload.rootPath),
    };
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        slug: true,
        published: true,
        timezone: true,
        subjects: true,
        subjectDetails: true,
        aboutText: true,
        tagline: true,
        vk: true,
        website: true,
        format: true,
        offlineAddress: true,
        avatarUrl: true,
        taxStatus: true,
        notificationSettings: true,
        cancelPolicySettings: true,
        paymentSettings: true,
        yukassaShopId: true,
        yandexDiskToken: true,
        yandexDiskRootPath: true,
        yandexDiskEmail: true,
        googleCalendarToken: true,
        googleCalendarEmail: true,
        yandexCalendarToken: true,
        yandexCalendarEmail: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      hasYukassa: !!user.yukassaShopId,
      hasYandexDisk: !!user.yandexDiskToken,
      hasGoogleCalendar: !!user.googleCalendarToken,
      hasYandexCalendar: !!user.yandexCalendarToken,
      googleCalendarEmail: user.googleCalendarEmail || '',
      yandexCalendarEmail: user.yandexCalendarEmail || '',
      yandexDiskRootPath: this.toDisplayYandexRootPath(user.yandexDiskRootPath),
      yandexDiskEmail: user.yandexDiskEmail || '',
      yukassaShopId: undefined,
      yandexDiskToken: undefined,
      googleCalendarToken: undefined,
      yandexCalendarToken: undefined,
    };
  }

  async startYandexDiskConnect(userId: string, rootPath?: string) {
    const clientId = this.getYandexClientId();

    if (!clientId) {
      return { oauthConfigured: false as const };
    }

    const redirectUri = this.getYandexRedirectUri();
    const normalizedRootPath = this.normalizeYandexRootPath(rootPath);

    const state = this.encodeYandexState({
      userId,
      rootPath: normalizedRootPath,
      ts: Date.now(),
      nonce: crypto.randomUUID(),
    });

    const authUrl = new URL('https://oauth.yandex.ru/authorize');
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    return {
      oauthConfigured: true as const,
      authUrl: authUrl.toString(),
      rootPath: this.toDisplayYandexRootPath(normalizedRootPath),
      expiresInSec: 15 * 60,
    };
  }

  async connectYandexDiskToken(userId: string, token: string, rootPath?: string) {
    const normalizedRootPath = this.normalizeYandexRootPath(rootPath);

    // Verify token is valid via Yandex user info (doesn't require Disk scope)
    const profileResponse = await fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: `OAuth ${token}` },
    }).catch(() => null);

    if (!profileResponse || !profileResponse.ok) {
      const status = profileResponse?.status || 'no response';
      throw new BadRequestException(
        `Токен недействителен (${status}). Проверьте токен и попробуйте снова.`,
      );
    }

    const profilePayload = await profileResponse.json().catch(() => ({}));
    const yandexEmail =
      typeof profilePayload?.default_email === 'string'
        ? profilePayload.default_email
        : typeof profilePayload?.login === 'string'
          ? profilePayload.login
          : null;

    const tokenToStore = {
      access_token: token,
      obtainedAt: new Date().toISOString(),
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        yandexDiskToken: tokenToStore as any,
        yandexDiskRootPath: normalizedRootPath,
        yandexDiskEmail: yandexEmail,
      },
    });

    const syncResult = await this.filesService.syncFromYandexDisk(userId);

    return {
      connected: true,
      rootPath: this.toDisplayYandexRootPath(normalizedRootPath),
      email: yandexEmail || '',
      syncedItems: syncResult.syncedItems,
    };
  }

  async completeYandexDiskConnect(userId: string, code: string, state: string) {
    const clientId = this.getYandexClientId();
    const clientSecret = this.getYandexClientSecret();

    if (!clientId || !clientSecret) {
      throw new BadRequestException('OAuth не настроен. Используйте подключение по токену.');
    }
    const redirectUri = this.getYandexRedirectUri();

    const parsedState = this.decodeYandexState(state);
    if (parsedState.userId !== userId) {
      throw new BadRequestException('State OAuth не соответствует текущему пользователю');
    }

    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    });

    const tokenPayload = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || typeof tokenPayload?.access_token !== 'string') {
      throw new BadRequestException('Не удалось получить токен Яндекс.Диска. Повторите подключение.');
    }

    const tokenToStore = {
      ...tokenPayload,
      obtainedAt: new Date().toISOString(),
    };

    let yandexEmail: string | null = null;
    const profileResponse = await fetch('https://login.yandex.ru/info?format=json', {
      headers: {
        Authorization: `OAuth ${tokenPayload.access_token}`,
      },
    }).catch(() => null);

    if (profileResponse?.ok) {
      const profilePayload = await profileResponse.json().catch(() => ({}));
      yandexEmail =
        typeof profilePayload?.default_email === 'string'
          ? profilePayload.default_email
          : typeof profilePayload?.login === 'string'
            ? profilePayload.login
            : null;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        yandexDiskToken: tokenToStore as any,
        yandexDiskRootPath: parsedState.rootPath,
        yandexDiskEmail: yandexEmail,
      },
    });

    const syncResult = await this.filesService.syncFromYandexDisk(userId);

    return {
      connected: true,
      rootPath: this.toDisplayYandexRootPath(parsedState.rootPath),
      email: yandexEmail || '',
      syncedItems: syncResult.syncedItems,
    };
  }

  async syncYandexDisk(userId: string) {
    return this.filesService.syncFromYandexDisk(userId);
  }

  async updateAccount(userId: string, dto: UpdateAccountDto) {
    if (dto.slug) {
      const existing = await this.prisma.user.findFirst({
        where: { slug: dto.slug, id: { not: userId } },
      });
      if (existing) {
        throw new BadRequestException('Slug already taken');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        slug: true,
        published: true,
        timezone: true,
        subjects: true,
        subjectDetails: true,
        aboutText: true,
        tagline: true,
        vk: true,
        website: true,
        format: true,
        offlineAddress: true,
      },
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${userId}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Password changed successfully' };
  }

  async updateNotifications(userId: string, dto: UpdateNotificationsDto) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    });

    const currentSettings =
      current?.notificationSettings && typeof current.notificationSettings === 'object'
        ? (current.notificationSettings as Record<string, unknown>)
        : {};

    const nextSettings = {
      ...currentSettings,
      ...dto,
    };

    return this.prisma.user.update({
      where: { id: userId },
      data: { notificationSettings: nextSettings as any },
      select: { notificationSettings: true },
    });
  }

  async updatePolicies(userId: string, dto: UpdatePoliciesDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { cancelPolicySettings: dto as any },
      select: { cancelPolicySettings: true },
    });
  }

  async connectYukassa(
    userId: string,
    credentials: { shopId: string; secretKey: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        yukassaShopId: credentials.shopId,
        yukassaSecretKey: credentials.secretKey,
      },
      select: { yukassaShopId: true },
    });
  }

  async disconnectIntegration(userId: string, type: string) {
    switch (type) {
      case 'yukassa':
        return this.prisma.user.update({
          where: { id: userId },
          data: { yukassaShopId: null, yukassaSecretKey: null },
        });
      case 'google-calendar':
        return this.prisma.user.update({
          where: { id: userId },
          data: {
            googleCalendarToken: Prisma.DbNull,
            googleCalendarEmail: null,
          },
        });
      case 'yandex-calendar':
        return this.prisma.user.update({
          where: { id: userId },
          data: {
            yandexCalendarToken: Prisma.DbNull,
            yandexCalendarEmail: null,
            yandexCalendarLogin: null,
          },
        });
      case 'yandex-disk':
        return this.prisma.$transaction(async (tx) => {
          await tx.fileRecord.deleteMany({
            where: {
              userId,
              cloudProvider: CloudProvider.YANDEX_DISK,
            },
          });

          return tx.user.update({
            where: { id: userId },
            data: {
              yandexDiskToken: Prisma.DbNull,
              yandexDiskRootPath: null,
              yandexDiskEmail: null,
            },
          });
        });
      default:
        throw new BadRequestException(`Unknown integration: ${type}`);
    }
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Неверный пароль');
    }

    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.fileRecord.deleteMany({ where: { userId } }),
      this.prisma.bookingRequest.deleteMany({ where: { userId } }),
      this.prisma.availabilityOverride.deleteMany({ where: { userId } }),
      this.prisma.tutorAvailability.deleteMany({ where: { userId } }),
      this.prisma.payment.deleteMany({ where: { userId } }),
      this.prisma.lesson.deleteMany({ where: { userId } }),
      this.prisma.package.deleteMany({ where: { userId } }),
      this.prisma.student.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { message: 'Account deleted' };
  }
}
