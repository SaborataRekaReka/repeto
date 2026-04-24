import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CloudProvider, Prisma } from '@prisma/client';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { getPrimaryFrontendUrl } from '../common/utils/frontend-url';
import {
  extractTutorPaymentCardNumber,
  extractTutorPaymentRequisites,
  extractTutorPaymentSbpPhone,
  mergeTutorPaymentRequisites,
  normalizeTutorPaymentCardNumber,
  normalizeTutorPaymentRequisites,
  normalizeTutorPaymentSbpPhone,
} from '../common/utils/payment-requisites';
import {
  extractQualificationVerificationSets,
  mergeQualificationVerificationSets,
  normalizeCertificateEntries,
  normalizeEducationEntries,
  resolveQualificationVerificationLabel,
  splitExperienceLines,
} from '../common/utils/qualification-verification';
import {
  UpdateAccountDto,
  ChangePasswordDto,
  UpdateNotificationsDto,
  UpdatePoliciesDto,
} from './dto';

@Injectable()
export class SettingsService {
  private static readonly SLUG_FALLBACK = 'tutor';
  private static readonly MAX_SLUG_LENGTH = 100;
  private static readonly YANDEX_DEFAULT_ROOT_PATH = 'disk:/';
  private static readonly CYRILLIC_TO_LATIN: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  private normalizeSlug(raw?: string | null) {
    const value = (raw || '').trim().toLowerCase();
    if (!value) {
      return '';
    }

    const transliterated = value
      .split('')
      .map((char) => SettingsService.CYRILLIC_TO_LATIN[char] ?? char)
      .join('');

    return transliterated
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, SettingsService.MAX_SLUG_LENGTH)
      .replace(/-+$/g, '');
  }

  private withSlugSuffix(baseSlug: string, index: number) {
    const suffix = `-${index}`;
    const maxBaseLength = SettingsService.MAX_SLUG_LENGTH - suffix.length;
    const cutBase = baseSlug.slice(0, Math.max(1, maxBaseLength)).replace(/-+$/g, '');
    return `${cutBase || SettingsService.SLUG_FALLBACK}${suffix}`;
  }

  private async isSlugTaken(slug: string, userId: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        slug,
        id: { not: userId },
      },
      select: { id: true },
    });

    return !!existing;
  }

  private async suggestAvailableSlug(baseSlug: string, userId: string) {
    const normalizedBase =
      this.normalizeSlug(baseSlug) || SettingsService.SLUG_FALLBACK;

    if (!(await this.isSlugTaken(normalizedBase, userId))) {
      return normalizedBase;
    }

    for (let i = 2; i <= 9999; i += 1) {
      const candidate = this.withSlugSuffix(normalizedBase, i);
      if (!(await this.isSlugTaken(candidate, userId))) {
        return candidate;
      }
    }

    throw new InternalServerErrorException('Не удалось подобрать свободный адрес');
  }

  async checkSlugAvailability(userId: string, requestedValue?: string, fallbackName?: string) {
    const normalizedRequested = this.normalizeSlug(requestedValue);
    const normalizedFallback = this.normalizeSlug(fallbackName);
    const baseSlug =
      normalizedRequested || normalizedFallback || SettingsService.SLUG_FALLBACK;

    const suggested = await this.suggestAvailableSlug(baseSlug, userId);

    return {
      requested: normalizedRequested,
      isAvailable: normalizedRequested ? suggested === normalizedRequested : true,
      suggested,
    };
  }

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

  private resolveYandexRootPath(raw?: string | null) {
    const hasExplicitPath = typeof raw === 'string' && raw.trim().length > 0;
    return this.normalizeYandexRootPath(
      hasExplicitPath ? raw : SettingsService.YANDEX_DEFAULT_ROOT_PATH,
    );
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

  private async ensureYandexDiskFolderExists(accessToken: string, normalizedRootPath: string) {
    if (!accessToken || normalizedRootPath === 'disk:/') {
      return;
    }

    const getResourceUrl = new URL('https://cloud-api.yandex.net/v1/disk/resources');
    getResourceUrl.searchParams.set('path', normalizedRootPath);
    getResourceUrl.searchParams.set('fields', 'path,type');

    const getResponse = await fetch(getResourceUrl.toString(), {
      headers: { Authorization: `OAuth ${accessToken}` },
    });

    if (getResponse.ok) {
      const payload = await getResponse.json().catch(() => ({} as any));
      if (payload?.type && payload.type !== 'dir') {
        throw new BadRequestException('Указанный путь на Яндекс.Диске не является папкой.');
      }
      return;
    }

    if (getResponse.status !== 404) {
      if (getResponse.status === 401) {
        throw new BadRequestException('Токен Яндекс.Диска недействителен. Переподключите интеграцию.');
      }
      throw new BadRequestException('Не удалось проверить папку на Яндекс.Диске. Повторите попытку.');
    }

    const createUrl = new URL('https://cloud-api.yandex.net/v1/disk/resources');
    createUrl.searchParams.set('path', normalizedRootPath);

    const createResponse = await fetch(createUrl.toString(), {
      method: 'PUT',
      headers: { Authorization: `OAuth ${accessToken}` },
    });

    if ([201, 202, 409].includes(createResponse.status)) {
      return;
    }

    if (createResponse.status === 401) {
      throw new BadRequestException('Токен Яндекс.Диска недействителен. Переподключите интеграцию.');
    }

    throw new BadRequestException(
      `Не удалось создать папку ${this.toDisplayYandexRootPath(normalizedRootPath)} на Яндекс.Диске.`,
    );
  }

  private isProductionEnv() {
    return process.env.NODE_ENV === 'production';
  }

  private getEnvValue(prodKey: string, devKey?: string) {
    if (!this.isProductionEnv() && devKey) {
      const devValue = (process.env[devKey] || '').trim();
      if (devValue) {
        return devValue;
      }
    }

    const prodValue = (process.env[prodKey] || '').trim();
    return prodValue || null;
  }

  private getYandexClientId(): string | null {
    return this.getEnvValue('YANDEX_DISK_CLIENT_ID', 'YANDEX_DISK_CLIENT_ID_DEV');
  }

  private getYandexClientSecret(): string | null {
    return this.getEnvValue('YANDEX_DISK_CLIENT_SECRET', 'YANDEX_DISK_CLIENT_SECRET_DEV');
  }

  private getYandexRedirectUri() {
    const configured = this.getEnvValue(
      'YANDEX_DISK_REDIRECT_URI',
      'YANDEX_DISK_REDIRECT_URI_DEV',
    );
    if (configured) {
      return configured;
    }

    const frontendUrl = getPrimaryFrontendUrl();
    return `${frontendUrl}/settings?tab=integrations&integration=yandex-disk`;
  }

  private getYandexStateSecret() {
    const secret = process.env.YANDEX_DISK_STATE_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException(
        'YANDEX_DISK_STATE_SECRET or JWT_SECRET must be configured',
      );
    }
    return secret;
  }

  private getGoogleDriveClientId(): string | null {
    return this.getEnvValue('GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_ID_DEV');
  }

  private getGoogleDriveClientSecret(): string | null {
    return this.getEnvValue('GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_CLIENT_SECRET_DEV');
  }

  private getGoogleDriveRedirectUri() {
    const configured = this.getEnvValue(
      'GOOGLE_DRIVE_REDIRECT_URI',
      'GOOGLE_DRIVE_REDIRECT_URI_DEV',
    );
    if (configured) {
      return configured;
    }

    const frontendUrl = getPrimaryFrontendUrl();
    return `${frontendUrl}/settings?tab=integrations&integration=google-drive`;
  }

  private createGoogleDriveOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
      this.getGoogleDriveClientId() || undefined,
      this.getGoogleDriveClientSecret() || undefined,
      this.getGoogleDriveRedirectUri(),
    );
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
        showPublicPackages: true,
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
        googleDriveToken: true,
        googleDriveRootPath: true,
        googleDriveEmail: true,
        homeworkDefaultCloud: true,
        googleCalendarToken: true,
        googleCalendarEmail: true,
        yandexCalendarToken: true,
        yandexCalendarEmail: true,
        education: true,
        experience: true,
        qualificationVerified: true,
        qualificationLabel: true,
        certificates: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const paymentRequisites = extractTutorPaymentRequisites(user.paymentSettings);
    const paymentCardNumber = extractTutorPaymentCardNumber(user.paymentSettings);
    const paymentSbpPhone = extractTutorPaymentSbpPhone(user.paymentSettings);
    const verificationSets = extractQualificationVerificationSets(user.paymentSettings);

    const education = normalizeEducationEntries(user.education).map((entry) => {
      const verified = verificationSets.education.has(entry.id) || entry.legacyVerified;
      return {
        id: entry.id,
        institution: entry.institution,
        program: entry.program,
        years: entry.years,
        verified,
        verificationLabel: resolveQualificationVerificationLabel(verified),
      };
    });

    const experienceLines = splitExperienceLines(user.experience).map((entry) => {
      const verified = verificationSets.experience.has(entry.id);
      return {
        ...entry,
        verified,
        verificationLabel: resolveQualificationVerificationLabel(verified),
      };
    });

    const certificates = normalizeCertificateEntries(user.certificates).map((entry) => {
      const verified = verificationSets.certificates.has(entry.id) || entry.legacyVerified;
      return {
        id: entry.id,
        title: entry.title,
        fileUrl: entry.fileUrl,
        uploadedAt: entry.uploadedAt,
        verified,
        verificationLabel: resolveQualificationVerificationLabel(verified),
      };
    });

    return {
      ...user,
      education,
      certificates,
      experienceLines,
      qualificationLabel: user.qualificationVerified ? 'Верифицирован' : null,
      paymentRequisites,
      paymentCardNumber,
      paymentSbpPhone,
      hasYukassa: !!user.yukassaShopId,
      hasYandexDisk: !!user.yandexDiskToken,
      hasGoogleDrive: !!user.googleDriveToken,
      hasGoogleCalendar: !!user.googleCalendarToken,
      hasYandexCalendar: !!user.yandexCalendarToken,
      googleDriveEmail: user.googleDriveEmail || '',
      googleDriveRootPath: user.googleDriveRootPath || '/',
      homeworkDefaultCloud: user.homeworkDefaultCloud,
      googleCalendarEmail: user.googleCalendarEmail || '',
      yandexCalendarEmail: user.yandexCalendarEmail || '',
      yandexDiskRootPath: this.toDisplayYandexRootPath(user.yandexDiskRootPath),
      yandexDiskEmail: user.yandexDiskEmail || '',
      yukassaShopId: undefined,
      yandexDiskToken: undefined,
      googleDriveToken: undefined,
      googleCalendarToken: undefined,
      yandexCalendarToken: undefined,
    };
  }

  async startGoogleDriveConnect(userId: string) {
    const clientId = this.getGoogleDriveClientId();
    const clientSecret = this.getGoogleDriveClientSecret();

    if (!clientId || !clientSecret) {
      return { oauthConfigured: false as const };
    }

    const oauth2 = this.createGoogleDriveOAuth2Client();

    const authUrl = oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state: userId,
    });

    return {
      oauthConfigured: true as const,
      authUrl,
    };
  }

  async completeGoogleDriveConnect(userId: string, code: string) {
    const oauth2 = this.createGoogleDriveOAuth2Client();

    const { tokens } = await oauth2.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new BadRequestException('Не удалось получить токены от Google');
    }

    oauth2.setCredentials(tokens);

    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
    const { data: userInfo } = await oauth2Api.userinfo.get();
    const email = userInfo.email || '';

    const previousGoogleState = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleDriveToken: true,
        googleDriveEmail: true,
        googleDriveRootPath: true,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleDriveToken: tokens as unknown as Prisma.InputJsonValue,
        googleDriveEmail: email,
        googleDriveRootPath: '/',
      },
    });

    try {
      const syncResult = await this.filesService.syncFromGoogleDrive(userId);

      return {
        connected: true,
        email,
        rootPath: '/',
        syncedItems: syncResult.syncedItems,
      };
    } catch (error) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          googleDriveToken: previousGoogleState?.googleDriveToken
            ? (previousGoogleState.googleDriveToken as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          googleDriveEmail: previousGoogleState?.googleDriveEmail || null,
          googleDriveRootPath: previousGoogleState?.googleDriveRootPath || null,
        },
      });

      throw error;
    }
  }

  async startYandexDiskConnect(userId: string, rootPath?: string) {
    const clientId = this.getYandexClientId();

    if (!clientId) {
      return { oauthConfigured: false as const };
    }

    const redirectUri = this.getYandexRedirectUri();
    const normalizedRootPath = this.resolveYandexRootPath(rootPath);

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
    const normalizedRootPath = this.resolveYandexRootPath(rootPath);

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

    await this.ensureYandexDiskFolderExists(token, normalizedRootPath);

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

    await this.ensureYandexDiskFolderExists(tokenPayload.access_token, parsedState.rootPath);

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
    const { paymentRequisites, paymentCardNumber, paymentSbpPhone, ...restDto } = dto;
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        slug: true,
        published: true,
        showPublicPackages: true,
        education: true,
        experience: true,
        certificates: true,
        paymentSettings: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const hasSlugInPayload = dto.slug !== undefined;
    const hasPublishedInPayload = dto.published !== undefined;

    const nextSlug = hasSlugInPayload
      ? this.normalizeSlug(dto.slug) || null
      : currentUser.slug;
    const nextPublished = hasPublishedInPayload ? !!dto.published : currentUser.published;

    if (nextPublished && !nextSlug) {
      throw new BadRequestException('Нельзя публиковать страницу без персональной ссылки');
    }

    if (nextSlug && (await this.isSlugTaken(nextSlug, userId))) {
      throw new BadRequestException('Такой адрес уже занят.');
    }

    const data: any = { ...restDto };

    if (dto.education !== undefined) {
      const normalizedEducation = normalizeEducationEntries(dto.education).map((entry) => ({
        id: entry.id,
        institution: entry.institution,
        program: entry.program,
        years: entry.years,
      }));

      data.education =
        normalizedEducation.length > 0
          ? (normalizedEducation as Prisma.InputJsonValue)
          : Prisma.DbNull;
    }

    if (dto.certificates !== undefined) {
      const normalizedCertificates = normalizeCertificateEntries(dto.certificates).map(
        (entry) => ({
          id: entry.id,
          title: entry.title,
          fileUrl: entry.fileUrl,
          uploadedAt: entry.uploadedAt,
        }),
      );

      data.certificates =
        normalizedCertificates.length > 0
          ? (normalizedCertificates as Prisma.InputJsonValue)
          : Prisma.DbNull;
    }

    if (
      dto.paymentRequisites !== undefined ||
      dto.paymentCardNumber !== undefined ||
      dto.paymentSbpPhone !== undefined
    ) {
      data.paymentSettings = mergeTutorPaymentRequisites(
        currentUser.paymentSettings,
        {
          requisites:
            dto.paymentRequisites !== undefined
              ? normalizeTutorPaymentRequisites(paymentRequisites)
              : undefined,
          cardNumber:
            dto.paymentCardNumber !== undefined
              ? normalizeTutorPaymentCardNumber(paymentCardNumber)
              : undefined,
          sbpPhone:
            dto.paymentSbpPhone !== undefined
              ? normalizeTutorPaymentSbpPhone(paymentSbpPhone)
              : undefined,
        },
      ) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    }

    if (
      dto.education !== undefined ||
      dto.experience !== undefined ||
      dto.certificates !== undefined
    ) {
      const verificationSets = extractQualificationVerificationSets(currentUser.paymentSettings);

      const nextEducation =
        dto.education !== undefined
          ? normalizeEducationEntries(dto.education)
          : normalizeEducationEntries(currentUser.education);
      const nextExperienceLines = splitExperienceLines(
        dto.experience !== undefined ? dto.experience : currentUser.experience,
      );
      const nextCertificates =
        dto.certificates !== undefined
          ? normalizeCertificateEntries(dto.certificates)
          : normalizeCertificateEntries(currentUser.certificates);

      const allowedEducationIds = new Set(nextEducation.map((entry) => entry.id));
      const allowedExperienceIds = new Set(nextExperienceLines.map((entry) => entry.id));
      const allowedCertificateIds = new Set(nextCertificates.map((entry) => entry.id));

      verificationSets.education = new Set(
        Array.from(verificationSets.education).filter((id) => allowedEducationIds.has(id)),
      );
      verificationSets.experience = new Set(
        Array.from(verificationSets.experience).filter((id) => allowedExperienceIds.has(id)),
      );
      verificationSets.certificates = new Set(
        Array.from(verificationSets.certificates).filter((id) => allowedCertificateIds.has(id)),
      );

      data.paymentSettings = mergeQualificationVerificationSets(
        data.paymentSettings !== undefined ? data.paymentSettings : currentUser.paymentSettings,
        verificationSets,
      ) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    }

    if (hasSlugInPayload) {
      data.slug = nextSlug;
    }

    if (hasPublishedInPayload) {
      data.published = nextPublished;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        slug: true,
        published: true,
        showPublicPackages: true,
        timezone: true,
        subjects: true,
        subjectDetails: true,
        aboutText: true,
        tagline: true,
        vk: true,
        website: true,
        format: true,
        offlineAddress: true,
        homeworkDefaultCloud: true,
        education: true,
        experience: true,
        qualificationVerified: true,
        qualificationLabel: true,
        certificates: true,
        paymentSettings: true,
      },
    });

    const verificationSets = extractQualificationVerificationSets(updatedUser.paymentSettings);

    const education = normalizeEducationEntries(updatedUser.education).map((entry) => {
      const verified = verificationSets.education.has(entry.id) || entry.legacyVerified;
      return {
        id: entry.id,
        institution: entry.institution,
        program: entry.program,
        years: entry.years,
        verified,
        verificationLabel: resolveQualificationVerificationLabel(verified),
      };
    });

    const experienceLines = splitExperienceLines(updatedUser.experience).map((entry) => {
      const verified = verificationSets.experience.has(entry.id);
      return {
        ...entry,
        verified,
        verificationLabel: resolveQualificationVerificationLabel(verified),
      };
    });

    const certificates = normalizeCertificateEntries(updatedUser.certificates).map((entry) => {
      const verified = verificationSets.certificates.has(entry.id) || entry.legacyVerified;
      return {
        id: entry.id,
        title: entry.title,
        fileUrl: entry.fileUrl,
        uploadedAt: entry.uploadedAt,
        verified,
        verificationLabel: resolveQualificationVerificationLabel(verified),
      };
    });

    return {
      ...updatedUser,
      education,
      certificates,
      experienceLines,
      qualificationLabel: updatedUser.qualificationVerified ? 'Верифицирован' : null,
      paymentRequisites: extractTutorPaymentRequisites(updatedUser.paymentSettings),
      paymentCardNumber: extractTutorPaymentCardNumber(updatedUser.paymentSettings),
      paymentSbpPhone: extractTutorPaymentSbpPhone(updatedUser.paymentSettings),
    };
  }

  private static readonly ALLOWED_AVATAR_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = SettingsService.ALLOWED_AVATAR_EXT.includes(rawExt) ? rawExt : '.jpg';
    const filename = `${userId}_${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  private static readonly ALLOWED_CERT_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];

  async uploadCertificate(userId: string, file: Express.Multer.File, title?: string) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = SettingsService.ALLOWED_CERT_EXT.includes(rawExt) ? rawExt : '.jpg';
    const filename = `${userId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    const fileUrl = `/uploads/certificates/${filename}`;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { certificates: true },
    });

    const existing = normalizeCertificateEntries(user?.certificates).map((entry) => ({
      id: entry.id,
      title: entry.title,
      fileUrl: entry.fileUrl,
      uploadedAt: entry.uploadedAt,
    }));
    const newCert = {
      id: crypto.randomUUID(),
      title: (title || file.originalname || '').slice(0, 200),
      fileUrl,
      uploadedAt: new Date().toISOString(),
    };

    const updated = [...existing, newCert];

    await this.prisma.user.update({
      where: { id: userId },
      data: { certificates: updated as any },
    });

    return {
      ...newCert,
      verified: false,
      verificationLabel: null,
    };
  }

  async deleteCertificate(userId: string, certId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { certificates: true, paymentSettings: true },
    });

    const existing = normalizeCertificateEntries(user?.certificates).map((entry) => ({
      id: entry.id,
      title: entry.title,
      fileUrl: entry.fileUrl,
      uploadedAt: entry.uploadedAt,
    }));
    const cert = existing.find((c: any) => c.id === certId);

    if (!cert) {
      throw new NotFoundException('Сертификат не найден');
    }

    // Delete file from disk
    if (cert.fileUrl) {
      const filepath = path.join(process.cwd(), cert.fileUrl);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    const updated = existing.filter((c: any) => c.id !== certId);
    const verificationSets = extractQualificationVerificationSets(user?.paymentSettings);
    verificationSets.certificates.delete(certId);
    const nextPaymentSettings = mergeQualificationVerificationSets(
      user?.paymentSettings,
      verificationSets,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        certificates: updated.length > 0 ? (updated as any) : Prisma.DbNull,
        paymentSettings:
          nextPaymentSettings !== null
            ? (nextPaymentSettings as Prisma.InputJsonValue)
            : Prisma.DbNull,
      },
    });

    return { deleted: true };
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

  private normalizeNotificationChannels(
    channelsValue: unknown,
    fallbackChannel?: unknown,
  ) {
    const allowedChannels = new Set(['EMAIL', 'PUSH', 'TELEGRAM', 'MAX']);

    if (Array.isArray(channelsValue)) {
      const normalized = channelsValue
        .map((value) => String(value || '').trim().toUpperCase())
        .filter((value) => allowedChannels.has(value));

      if (normalized.length > 0) {
        return Array.from(new Set(normalized));
      }
    }

    const normalizedSingle = String(fallbackChannel || '')
      .trim()
      .toUpperCase();

    if (allowedChannels.has(normalizedSingle)) {
      return [normalizedSingle];
    }

    return ['EMAIL'];
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

    const normalizedChannels = this.normalizeNotificationChannels(
      dto.channels ?? currentSettings.channels,
      dto.channel ?? currentSettings.channel,
    );

    const nextSettings = {
      ...currentSettings,
      ...dto,
      channels: normalizedChannels,
      channel: normalizedChannels[0].toLowerCase(),
    };

    delete (nextSettings as Record<string, unknown>).weeklyReport;
    delete (nextSettings as Record<string, unknown>).reportDay;

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
      case 'google-drive':
        return this.prisma.$transaction(async (tx) => {
          await tx.fileRecord.deleteMany({
            where: {
              userId,
              cloudProvider: CloudProvider.GOOGLE_DRIVE,
            },
          });

          return tx.user.update({
            where: { id: userId },
            data: {
              googleDriveToken: Prisma.DbNull,
              googleDriveRootPath: null,
              googleDriveEmail: null,
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
