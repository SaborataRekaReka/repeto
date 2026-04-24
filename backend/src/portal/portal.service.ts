import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CloudProvider, FileType, NotificationType, Prisma } from '@prisma/client';
import { drive_v3, google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TelegramService } from '../messenger/telegram.service';
import { MaxService } from '../messenger/max.service';
import { mapCancelPolicy, calculatePenalty } from '../common/utils/cancel-policy';
import {
  PORTAL_REVIEW_PREFIX,
  buildPortalReviewNote,
  parsePortalReviewNote,
} from '../common/utils/lesson-note';
import {
  buildTutorPaymentRequisitesPreview,
  extractTutorPaymentCardNumber,
  extractTutorPaymentRequisites,
  extractTutorPaymentSbpPhone,
} from '../common/utils/payment-requisites';

@Injectable()
export class PortalService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private telegramService: TelegramService,
    private maxService: MaxService,
  ) {}

  private formatPortalDateLabel(value: Date) {
    const d = new Date(value);
    const months = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ];
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    return `${d.getDate()} ${months[d.getMonth()]}, ${days[d.getDay()]}`;
  }

  private normalizePortalTime(rawTime: string) {
    const value = (rawTime || '').trim();
    const match = /^(\d{1,2}):(\d{2})$/.exec(value);

    if (!match) {
      throw new BadRequestException('Неверный формат времени');
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new BadRequestException('Неверный формат времени');
    }

    return {
      hours,
      minutes,
      normalized: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  }

  private formatPortalShortDate(value: Date) {
    const date = new Date(value);

    return `${String(date.getDate()).padStart(2, '0')}.${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}.${date.getFullYear()}`;
  }

  private formatPortalPaymentMethodLabel(method?: string | null) {
    const normalized = String(method || '').toUpperCase();

    if (normalized === 'SBP') return 'Оплата через СБП';
    if (normalized === 'CASH') return 'Оплата наличными';
    if (normalized === 'YUKASSA') return 'Оплата через ЮKassa';

    return 'Оплата переводом';
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

  private getGoogleDriveClientId() {
    return this.getEnvValue('GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_ID_DEV');
  }

  private getGoogleDriveClientSecret() {
    return this.getEnvValue('GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_CLIENT_SECRET_DEV');
  }

  private getGoogleDriveRedirectUri() {
    return (
      this.getEnvValue('GOOGLE_DRIVE_REDIRECT_URI', 'GOOGLE_DRIVE_REDIRECT_URI_DEV') ||
      this.getEnvValue('GOOGLE_CALENDAR_REDIRECT_URI', 'GOOGLE_CALENDAR_REDIRECT_URI_DEV') ||
      'http://localhost:3300/settings?tab=integrations&integration=google-drive'
    );
  }

  private createGoogleDriveOAuth2Client() {
    return new google.auth.OAuth2(
      this.getGoogleDriveClientId() || undefined,
      this.getGoogleDriveClientSecret() || undefined,
      this.getGoogleDriveRedirectUri(),
    );
  }

  private normalizeYandexPath(raw?: string | null) {
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

  private yandexDisplayPath(providerPath: string) {
    if (providerPath === 'disk:/') {
      return '/';
    }

    return providerPath.startsWith('disk:/') ? providerPath.slice('disk:'.length) : providerPath;
  }

  private yandexCloudUrl(providerPath: string) {
    const displayPath = this.yandexDisplayPath(providerPath);
    if (displayPath === '/') {
      return 'https://disk.yandex.ru/client/disk';
    }

    return `https://disk.yandex.ru/client/disk${encodeURI(displayPath)}`;
  }

  private normalizeGoogleDriveRootId(raw?: string | null) {
    const value = (raw || '').trim();
    if (!value || value === '/' || value === 'root') {
      return 'root';
    }

    return value;
  }

  private googleDriveFileUrl(fileId: string) {
    return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
  }

  private sanitizeCloudSegment(value: string, fallback: string) {
    const normalized = (value || '')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return normalized || fallback;
  }

  private sanitizeCloudFileName(fileName: string) {
    const base = path.basename(fileName || '').trim();
    const sanitized = base.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();

    return sanitized || `homework-${Date.now()}`;
  }

  private extractYandexAccessToken(token: Prisma.JsonValue | null) {
    if (!token || typeof token !== 'object' || Array.isArray(token)) {
      throw new BadRequestException('Интеграция с Яндекс.Диском не подключена.');
    }

    const accessToken = (token as Record<string, unknown>).access_token;
    if (typeof accessToken !== 'string' || !accessToken.trim()) {
      throw new BadRequestException('Токен Яндекс.Диска недействителен. Переподключите интеграцию.');
    }

    return accessToken;
  }

  private extractGoogleDriveTokens(token: Prisma.JsonValue | null) {
    if (!token || typeof token !== 'object' || Array.isArray(token)) {
      throw new BadRequestException('Интеграция с Google Drive не подключена.');
    }

    const tokens = token as Record<string, unknown>;
    const accessToken = typeof tokens.access_token === 'string' ? tokens.access_token.trim() : '';
    const refreshToken =
      typeof tokens.refresh_token === 'string' ? tokens.refresh_token.trim() : '';

    if (!accessToken && !refreshToken) {
      throw new BadRequestException('Токен Google Drive недействителен. Переподключите интеграцию.');
    }

    return tokens;
  }

  private async createYandexFolder(accessToken: string, providerPath: string) {
    const normalizedPath = this.normalizeYandexPath(providerPath);
    if (normalizedPath === 'disk:/') {
      return;
    }

    const url = new URL('https://cloud-api.yandex.net/v1/disk/resources');
    url.searchParams.set('path', normalizedPath);

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    if ([201, 202, 409].includes(response.status)) {
      return;
    }

    if (response.status === 401) {
      throw new BadRequestException('Токен Яндекс.Диска недействителен. Переподключите интеграцию.');
    }

    throw new BadRequestException(
      `Не удалось создать папку ${this.yandexDisplayPath(normalizedPath)} на Яндекс.Диске.`,
    );
  }

  private async ensureYandexFolderTree(
    accessToken: string,
    rootPath: string,
    segments: string[],
  ) {
    let currentPath = this.normalizeYandexPath(rootPath);

    for (const rawSegment of segments) {
      const segment = this.sanitizeCloudSegment(rawSegment, 'Папка');
      currentPath =
        currentPath === 'disk:/' ? `disk:/${segment}` : `${currentPath}/${segment}`;
      await this.createYandexFolder(accessToken, currentPath);
    }

    return currentPath;
  }

  private async uploadFileToYandexDisk(
    accessToken: string,
    providerPath: string,
    file: Express.Multer.File,
  ) {
    const normalizedPath = this.normalizeYandexPath(providerPath);

    const uploadUrl = new URL('https://cloud-api.yandex.net/v1/disk/resources/upload');
    uploadUrl.searchParams.set('path', normalizedPath);
    uploadUrl.searchParams.set('overwrite', 'true');

    const initUploadResponse = await fetch(uploadUrl.toString(), {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    if (!initUploadResponse.ok) {
      if (initUploadResponse.status === 401) {
        throw new BadRequestException('Токен Яндекс.Диска недействителен. Переподключите интеграцию.');
      }

      throw new BadRequestException('Не удалось подготовить загрузку файла в Яндекс.Диск.');
    }

    const payload = (await initUploadResponse.json().catch(() => null)) as
      | { href?: string }
      | null;

    if (!payload?.href) {
      throw new BadRequestException('Яндекс.Диск не вернул ссылку для загрузки файла.');
    }

    const uploadResponse = await fetch(payload.href, {
      method: 'PUT',
      headers: {
        'Content-Type': file.mimetype || 'application/octet-stream',
      },
      body: new Uint8Array(file.buffer),
    });

    if (!uploadResponse.ok) {
      throw new BadRequestException('Не удалось загрузить файл в Яндекс.Диск.');
    }

    return this.yandexCloudUrl(normalizedPath);
  }

  private getGoogleApiStatus(error: unknown) {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const candidate = error as {
      status?: unknown;
      code?: unknown;
      response?: { status?: unknown };
    };

    if (typeof candidate.status === 'number') {
      return candidate.status;
    }

    if (typeof candidate.code === 'number') {
      return candidate.code;
    }

    if (candidate.response && typeof candidate.response.status === 'number') {
      return candidate.response.status;
    }

    return null;
  }

  private toGoogleDriveBadRequest(error: unknown, fallbackMessage: string) {
    const status = this.getGoogleApiStatus(error);

    if (status === 401) {
      return new BadRequestException('Токен Google Drive недействителен. Переподключите интеграцию.');
    }

    if (status === 403) {
      return new BadRequestException('Нет доступа к Google Drive. Проверьте права приложения.');
    }

    if (status === 404) {
      return new BadRequestException('Указанная папка не найдена в Google Drive.');
    }

    return new BadRequestException(fallbackMessage);
  }

  private escapeGoogleDriveQueryValue(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  private async getAuthenticatedGoogleDriveClient(userId: string, token: Prisma.JsonValue | null) {
    const clientId = this.getGoogleDriveClientId();
    const clientSecret = this.getGoogleDriveClientSecret();
    if (!clientId || !clientSecret) {
      throw new BadRequestException('OAuth Google Drive не настроен на сервере.');
    }

    const storedTokens = this.extractGoogleDriveTokens(token);
    const oauth2 = this.createGoogleDriveOAuth2Client();
    oauth2.setCredentials(storedTokens as any);

    oauth2.on('tokens', async (newTokens) => {
      const merged = {
        ...(storedTokens as Record<string, unknown>),
        ...newTokens,
      };

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          googleDriveToken: merged as Prisma.InputJsonValue,
        },
      });
    });

    return google.drive({ version: 'v3', auth: oauth2 });
  }

  private async ensureGoogleDriveFolder(
    drive: drive_v3.Drive,
    parentId: string,
    folderName: string,
  ) {
    const escapedFolderName = this.escapeGoogleDriveQueryValue(folderName);
    const query =
      `'${parentId}' in parents and trashed = false ` +
      `and mimeType = 'application/vnd.google-apps.folder' and name = '${escapedFolderName}'`;

    try {
      const existing = await drive.files.list({
        q: query,
        pageSize: 1,
        fields: 'files(id,name)',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      const foundId = existing.data.files?.[0]?.id;
      if (foundId) {
        return foundId;
      }

      const created = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        fields: 'id',
        supportsAllDrives: true,
      });

      if (!created.data.id) {
        throw new BadRequestException('Google Drive не вернул идентификатор созданной папки.');
      }

      return created.data.id;
    } catch (error) {
      throw this.toGoogleDriveBadRequest(error, 'Не удалось подготовить папку в Google Drive.');
    }
  }

  private async ensureGoogleDriveFolderTree(
    drive: drive_v3.Drive,
    rootFolderId: string,
    segments: string[],
  ) {
    let currentFolderId = this.normalizeGoogleDriveRootId(rootFolderId);

    for (const rawSegment of segments) {
      const segment = this.sanitizeCloudSegment(rawSegment, 'Папка');
      currentFolderId = await this.ensureGoogleDriveFolder(drive, currentFolderId, segment);
    }

    return currentFolderId;
  }

  private async uploadFileToGoogleDrive(
    drive: drive_v3.Drive,
    parentFolderId: string,
    file: Express.Multer.File,
    fileName: string,
  ) {
    try {
      const created = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [parentFolderId],
        },
        media: {
          mimeType: file.mimetype || 'application/octet-stream',
          body: Readable.from(file.buffer),
        },
        fields: 'id,webViewLink',
        supportsAllDrives: true,
      });

      if (!created.data.id) {
        throw new BadRequestException('Google Drive не вернул идентификатор загруженного файла.');
      }

      return created.data.webViewLink || this.googleDriveFileUrl(created.data.id);
    } catch (error) {
      throw this.toGoogleDriveBadRequest(error, 'Не удалось загрузить файл в Google Drive.');
    }
  }

  private static readonly ALLOWED_AVATAR_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  async uploadAvatar(accountId: string, file: Express.Multer.File) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = PortalService.ALLOWED_AVATAR_EXT.includes(rawExt) ? rawExt : '.jpg';
    const filename = `student_${accountId}_${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);
    const avatarUrl = `/uploads/avatars/${filename}`;
    await this.prisma.studentAccount.update({
      where: { id: accountId },
      data: { avatarUrl },
    });
    return { avatarUrl };
  }

  async getPortalData(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        account: {
          select: { avatarUrl: true },
        },
        user: {
          select: {
            name: true,
            slug: true,
            phone: true,
            whatsapp: true,
            email: true,
            subjects: true,
            avatarUrl: true,
            rating: true,
            cancelPolicySettings: true,
            notificationSettings: true,
            paymentSettings: true,
          },
        },
        lessons: {
          orderBy: { scheduledAt: 'desc' },
          take: 40,
          select: {
            id: true,
            subject: true,
            scheduledAt: true,
            duration: true,
            format: true,
            rate: true,
            status: true,
            rescheduleNewTime: true,
            notes: {
              where: {
                content: { startsWith: PORTAL_REVIEW_PREFIX },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true },
            },
          },
        },
        payments: {
          orderBy: { date: 'desc' },
          take: 30,
          select: {
            id: true,
            amount: true,
            method: true,
            date: true,
            status: true,
          },
        },
        packages: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            subject: true,
            lessonsTotal: true,
            lessonsUsed: true,
            validUntil: true,
          },
        },
        homework: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            task: true,
            dueAt: true,
            status: true,
            attachments: true,
            materials: {
              select: {
                file: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    extension: true,
                    size: true,
                    cloudUrl: true,
                    parentId: true,
                  },
                },
              },
            },
          },
        },
        fileShares: {
          select: {
            file: {
              select: {
                id: true,
                name: true,
                type: true,
                extension: true,
                size: true,
                cloudUrl: true,
              },
            },
          },
        },
      },
    });

    if (!student) throw new NotFoundException('Invalid portal link');

    const now = new Date();

    // Pending BookingRequests for this student's account email / phone for the
    // same tutor — surfaced as "unconfirmed lessons" in the portal.
    const account = student.accountId
      ? await this.prisma.studentAccount.findUnique({
          where: { id: student.accountId },
          select: { email: true },
        })
      : null;

    const pendingBookings = await this.prisma.bookingRequest.findMany({
      where: {
        userId: student.userId,
        status: 'PENDING',
        OR: [
          ...(account?.email ? [{ clientEmail: account.email }] : []),
          ...(student.phone ? [{ clientPhone: student.phone }] : []),
          ...(student.email ? [{ clientEmail: student.email }] : []),
        ],
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        subject: true,
        date: true,
        startTime: true,
        duration: true,
        createdAt: true,
      },
    });

    const tutorReviewNotes = await this.prisma.lessonNote.findMany({
      where: {
        content: { startsWith: PORTAL_REVIEW_PREFIX },
        lesson: { is: { userId: student.userId } },
      },
      select: { content: true },
    });

    const tutorRatings = tutorReviewNotes
      .map((note) => parsePortalReviewNote(note.content)?.rating)
      .filter((value): value is number => Number.isFinite(value));

    const tutorReviewsCount = tutorRatings.length;
    const tutorAverageRating =
      tutorReviewsCount > 0
        ? Math.round(
            (tutorRatings.reduce((sum, value) => sum + value, 0) / tutorReviewsCount) *
              10,
          ) / 10
        : null;
    const persistedTutorRating = Number(student.user.rating);
    const normalizedTutorRating = Number.isFinite(persistedTutorRating)
      ? persistedTutorRating
      : null;
    const tutorRating = tutorAverageRating ?? normalizedTutorRating;

    const formatDate = (d: Date) => {
      const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
      ];
      return `${d.getDate()} ${months[d.getMonth()]}, ${days[d.getDay()]}`;
    };

    const formatTime = (d: Date, durationMin: number) => {
      const start = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const end = new Date(d.getTime() + durationMin * 60000);
      const endStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      return `${start} – ${endStr}`;
    };

    const cancelPolicy = mapCancelPolicy(student.user.cancelPolicySettings);
    const freeHours = cancelPolicy.freeHours;

    const mapLesson = (l: typeof student.lessons[0]) => {
      const dt = new Date(l.scheduledAt);
      const hoursUntil = (dt.getTime() - now.getTime()) / (1000 * 60 * 60);

      let status: string;
      if (l.status === 'RESCHEDULE_PENDING') {
        status = 'reschedule_pending';
      } else if (l.status === 'PLANNED') {
        status = 'upcoming';
      } else if (l.status === 'COMPLETED') {
        status = 'completed';
      } else {
        status = 'cancelled';
      }

      const result: Record<string, any> = {
        id: l.id,
        date: formatDate(dt),
        dayOfWeek: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dt.getDay()],
        time: formatTime(dt, l.duration),
        subject: l.subject,
        modality: l.format.toLowerCase(),
        price: l.rate,
        status,
        canCancelFree: hoursUntil >= freeHours,
      };

      if (l.status === 'RESCHEDULE_PENDING' && l.rescheduleNewTime) {
        const newDt = new Date(l.rescheduleNewTime);
        result.rescheduleFrom = `${formatDate(dt)}, ${formatTime(dt, l.duration)}`;
        result.rescheduleTo = `${formatDate(newDt)}, ${formatTime(newDt, l.duration)}`;
      }

      return result;
    };

    const upcomingLessons = student.lessons
      .filter((l) => new Date(l.scheduledAt) > now && (l.status === 'PLANNED' || l.status === 'RESCHEDULE_PENDING'))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .map(mapLesson);

    const recentLessons = student.lessons
      .filter((l) => l.status === 'COMPLETED')
      .slice(0, 5)
      .map((l) => {
        const dt = new Date(l.scheduledAt);
        const review = parsePortalReviewNote(l.notes[0]?.content);

        return {
          id: l.id,
          date: formatDate(dt),
          time: formatTime(dt, l.duration),
          subject: l.subject,
          modality: l.format.toLowerCase(),
          status: 'completed',
          price: l.rate,
          rating: review?.rating,
          feedback: review?.feedback,
        };
      });

    // Balance: paid - lessons cost
    const totalPaid = student.payments
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + p.amount, 0);
    const totalEarned = student.lessons
      .filter((l) => l.status === 'COMPLETED')
      .reduce((s, l) => s + l.rate, 0);
    const balance = totalPaid - totalEarned;

    const activePackage = student.packages[0] || null;
    const paymentRequisites = extractTutorPaymentRequisites(student.user.paymentSettings);
    const paymentCardNumber = extractTutorPaymentCardNumber(student.user.paymentSettings);
    const paymentSbpPhone = extractTutorPaymentSbpPhone(student.user.paymentSettings);

    const recentPayments = student.payments.map((p) => ({
      id: p.id,
      date: formatDate(new Date(p.date)),
      amount: p.amount,
      method: p.method || 'Перевод',
      status: p.status.toLowerCase() as 'paid' | 'pending',
    }));

    const balanceOperations = [
      ...student.payments
        .filter((payment) => payment.status === 'PAID')
        .map((payment) => {
          const paymentDate = new Date(payment.date);

          return {
            id: `payment-${payment.id}`,
            kind: 'payment' as const,
            direction: 'credit' as const,
            amount: payment.amount,
            title: this.formatPortalPaymentMethodLabel(payment.method),
            subtitle: this.formatPortalShortDate(paymentDate),
            occurredAt: paymentDate.toISOString(),
          };
        }),
      ...student.lessons
        .filter((lesson) => lesson.status === 'COMPLETED')
        .map((lesson) => {
          const lessonDate = new Date(lesson.scheduledAt);

          return {
            id: `lesson-${lesson.id}`,
            kind: 'lesson' as const,
            direction: 'debit' as const,
            amount: lesson.rate,
            title: lesson.subject
              ? `Списание за занятие · ${lesson.subject}`
              : 'Списание за занятие',
            subtitle: `${this.formatPortalShortDate(lessonDate)} · ${formatTime(
              lessonDate,
              lesson.duration,
            )}`,
            occurredAt: lessonDate.toISOString(),
          };
        }),
    ]
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
      )
      .slice(0, 30);

    const formatPortalUploadSize = (bytes?: number) => {
      if (!Number.isFinite(bytes) || !bytes || bytes <= 0) {
        return '—';
      }

      if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
      }

      return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
    };

    const toPortalUpload = (fileUrl: string, index: number) => {
      const normalizedUrl = typeof fileUrl === 'string' ? fileUrl : '';
      const fallbackName = `Файл ${index + 1}`;

      let name = fallbackName;
      let size = '—';
      let uploadedAt = '';
      let expiresAt = '';

      if (normalizedUrl) {
        try {
          const basename = path.basename(normalizedUrl);
          name = decodeURIComponent(basename || fallbackName);
        } catch {
          name = path.basename(normalizedUrl) || fallbackName;
        }

        const relativePath = normalizedUrl.startsWith('/')
          ? normalizedUrl.slice(1)
          : normalizedUrl;
        const absolutePath = path.join(process.cwd(), relativePath);

        if (fs.existsSync(absolutePath)) {
          try {
            const stats = fs.statSync(absolutePath);
            size = formatPortalUploadSize(stats.size);

            const uploadedDate = stats.mtime;
            uploadedAt = uploadedDate.toISOString();

            const expiresDate = new Date(uploadedDate.getTime() + 3 * 24 * 60 * 60 * 1000);
            expiresAt = expiresDate.toISOString();
          } catch {
            // Ignore stat errors and keep fallback values.
          }
        }
      }

      return {
        id: normalizedUrl || `upload-${index + 1}`,
        name,
        size,
        uploadedAt,
        expiresAt,
        url: normalizedUrl,
      };
    };

    const homework = student.homework.map((h) => {
      const linkedFiles = h.materials
        .map((material) => material.file)
        .map((file) => ({
          id: file.id,
          name: file.name,
          type: file.type === FileType.FOLDER ? 'folder' : 'file',
          extension: file.extension || undefined,
          size: file.size || undefined,
          cloudUrl: file.cloudUrl || '#',
          parentId: file.parentId,
          subject: student.subject || undefined,
          homeworkId: h.id,
        }));

      const studentUploads = (h.attachments || [])
        .map((fileUrl, index) => toPortalUpload(fileUrl, index))
        .filter((upload) => !!upload.url);

      return {
        id: h.id,
        task: h.task,
        due: h.dueAt ? formatDate(new Date(h.dueAt)) : '',
        done: h.status === 'COMPLETED',
        attachments: h.attachments,
        studentUploads,
        linkedFiles,
      };
    });

    const portalFiles: Array<{
      id: string;
      name: string;
      type: 'file' | 'folder';
      extension?: string;
      size?: string;
      cloudUrl: string;
      parentId: string | null;
      subject?: string;
    }> = [];

    const addedIds = new Set<string>();

    // Add directly shared files
    for (const share of student.fileShares) {
      if (addedIds.has(share.file.id)) continue;
      addedIds.add(share.file.id);

      if (share.file.type === FileType.FILE && !share.file.cloudUrl) continue;

      portalFiles.push({
        id: share.file.id,
        name: share.file.name,
        type: share.file.type === FileType.FOLDER ? 'folder' : 'file',
        extension: share.file.extension || undefined,
        size: share.file.size || undefined,
        cloudUrl: share.file.cloudUrl,
        parentId: null, // shared items are top-level in the portal
        subject: student.subject || undefined,
      });
    }

    // For shared folders, load all descendants preserving tree structure
    const sharedFolderIds = portalFiles
      .filter((f) => f.type === 'folder')
      .map((f) => f.id);

    if (sharedFolderIds.length > 0) {
      const descendants = await this.collectDescendants(sharedFolderIds);
      for (const d of descendants) {
        if (addedIds.has(d.id)) continue;
        if (d.type === FileType.FILE && !d.cloudUrl) continue;
        addedIds.add(d.id);
        portalFiles.push({
          id: d.id,
          name: d.name,
          type: d.type === FileType.FOLDER ? 'folder' : 'file',
          extension: d.extension || undefined,
          size: d.size || undefined,
          cloudUrl: d.cloudUrl,
          parentId: d.parentId,
          subject: student.subject || undefined,
        });
      }
    }

    return {
      studentName: student.name,
      studentPhone: student.phone || undefined,
      studentEmail: student.email || undefined,
      studentAvatarUrl: student.account?.avatarUrl || null,
      studentGrade: student.grade || undefined,
      studentAge: student.age || undefined,
      studentParentName: student.parentName || undefined,
      studentParentPhone: student.parentPhone || undefined,
      studentParentEmail: student.parentEmail || undefined,
      tutorName: student.user.name,
      tutorSlug: student.user.slug || '',
      tutorPhone: student.user.phone || '',
      tutorWhatsapp: student.user.whatsapp || undefined,
      tutorAvatarUrl: student.user.avatarUrl || null,
      tutorRating,
      tutorReviewsCount,
      balance,
      ratePerLesson: student.rate,
      paymentRequisites,
      paymentRequisitesPreview: buildTutorPaymentRequisitesPreview(
        paymentRequisites,
        paymentCardNumber,
        paymentSbpPhone,
      ),
      paymentCardNumber,
      paymentSbpPhone,
      package: activePackage
        ? {
        subject: activePackage.subject,
            used: activePackage.lessonsUsed,
            total: activePackage.lessonsTotal,
            validUntil: activePackage.validUntil
              ? formatDate(new Date(activePackage.validUntil))
              : '',
          }
        : null,
      cancelPolicy: {
        freeHours,
        lateCancelAction: cancelPolicy.lateCancelAction,
        // Keep legacy field for backward compatibility with older frontend builds.
        lateAction: cancelPolicy.lateCancelAction,
        noShowAction: cancelPolicy.noShowAction,
        lateCancelCost: cancelPolicy.lateCancelCost,
      },
      upcomingLessons,
      recentLessons,
      recentPayments,
      balanceOperations,
      homework,
      files: portalFiles,
      pendingBookings: pendingBookings.map((b) => {
        const d = new Date(b.date);
        return {
          id: b.id,
          subject: b.subject,
          date: formatDate(d),
          startTime: b.startTime,
          duration: b.duration,
        };
      }),
      notifications: await this.buildNotificationInfo(student),
    };
  }

  private async buildNotificationInfo(student: {
    id: string;
    telegramChatId: string | null;
    maxChatId: string | null;
    user: { notificationSettings: any };
  }) {
    const settings = (student.user.notificationSettings as Record<string, unknown>) || {};
    const channels = (settings.channels as string[]) || [];
    const legacyChannel = String(settings.channel || '').toLowerCase();
    const hasTelegram =
      channels.includes('TELEGRAM') || legacyChannel === 'telegram';
    const hasMax = channels.includes('MAX') || legacyChannel === 'max';

    if (!hasTelegram && !hasMax) return null;

    const result: {
      telegram?: { connected: boolean; deepLink?: string };
      max?: { connected: boolean; deepLink?: string };
    } = {};

    if (hasTelegram && this.telegramService.isConfigured) {
      const connected = !!student.telegramChatId;
      if (connected) {
        result.telegram = { connected: true };
      } else {
        const username = await this.telegramService.botUsername;
        // Deep-link code uses student id as the nonce; bot-poller resolves it back via existing link flow.
        result.telegram = {
          connected: false,
          deepLink: username ? `https://t.me/${username}?start=${student.id}` : undefined,
        };
      }
    }

    if (hasMax && this.maxService.isConfigured) {
      const connected = !!student.maxChatId;
      result.max = { connected: connected };
      // Max deep links are not supported natively; we show instructions instead
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Given folder IDs, recursively collect all descendant records (files and folders).
   */
  private async collectDescendants(folderIds: string[]) {
    const result: Array<{
      id: string;
      name: string;
      type: FileType;
      extension: string | null;
      size: string | null;
      cloudUrl: string;
      parentId: string;
    }> = [];

    let currentIds = folderIds;

    while (currentIds.length > 0) {
      const children = await this.prisma.fileRecord.findMany({
        where: { parentId: { in: currentIds } },
        select: {
          id: true,
          name: true,
          type: true,
          extension: true,
          size: true,
          cloudUrl: true,
          parentId: true,
        },
      });

      const nextFolderIds: string[] = [];
      for (const child of children) {
        result.push({
          id: child.id,
          name: child.name,
          type: child.type,
          extension: child.extension,
          size: child.size,
          cloudUrl: child.cloudUrl,
          parentId: child.parentId!,
        });
        if (child.type === FileType.FOLDER) {
          nextFolderIds.push(child.id);
        }
      }

      currentIds = nextFolderIds;
    }

    return result;
  }

  async cancelLesson(studentId: string, lessonId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.studentId !== student.id) throw new ForbiddenException();
    if (lesson.status !== 'PLANNED') {
      throw new ForbiddenException('Only planned lessons can be cancelled');
    }

    const hoursUntil =
      (lesson.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);

    const tutor = await this.prisma.user.findUnique({
      where: { id: student.userId },
      select: { cancelPolicySettings: true },
    });
    const cancelPolicy = mapCancelPolicy(tutor?.cancelPolicySettings);
    const freeHours = cancelPolicy.freeHours;

    const lateCancelCharge =
      hoursUntil < freeHours
        ? cancelPolicy.lateCancelCost ??
          calculatePenalty(lesson.rate, cancelPolicy.lateCancelAction)
        : null;

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        status: 'CANCELLED_STUDENT',
        cancelledAt: new Date(),
        cancelReason: 'Cancelled by student via portal',
        lateCancelCharge,
      },
    });

    const dateStr = lesson.scheduledAt.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const timeStr = lesson.scheduledAt.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.notificationsService.create({
      userId: student.userId,
      type: 'LESSON_CANCELLED',
      title: 'Занятие отменено учеником',
      description: `${student.name} отменил(а) занятие ${dateStr} в ${timeStr}`,
      studentId: student.id,
      lessonId: lesson.id,
    });

    return updated;
  }

  async cancelPendingBooking(
    bookingId: string,
    tutorId: string,
    studentDisplayName?: string,
  ) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        status: true,
        subject: true,
        date: true,
        startTime: true,
        clientName: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.userId !== tutorId) {
      throw new ForbiddenException();
    }
    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Заявка уже обработана');
    }

    await this.prisma.bookingRequest.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    });

    const dateLabel = this.formatPortalDateLabel(booking.date);
    const actor = studentDisplayName || booking.clientName || 'Ученик';

    await this.notificationsService.create({
      userId: tutorId,
      type: NotificationType.SYSTEM,
      title: 'Неподтвержденное занятие отменено',
      description: `${actor} отменил(а) неподтвержденное занятие: ${booking.subject}, ${dateLabel} в ${booking.startTime}`,
      bookingRequestId: booking.id,
    });

    return {
      status: 'cancelled',
      bookingId: booking.id,
    };
  }

  async reschedulePendingBooking(
    bookingId: string,
    tutorId: string,
    studentDisplayName: string | undefined,
    newDate: string,
    newTime: string,
  ) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        status: true,
        subject: true,
        date: true,
        startTime: true,
        duration: true,
        clientName: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.userId !== tutorId) {
      throw new ForbiddenException();
    }
    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Заявка уже обработана');
    }

    const parsedDate = new Date(newDate);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Неверная дата');
    }
    parsedDate.setHours(0, 0, 0, 0);

    const normalizedTime = this.normalizePortalTime(newTime);
    const requestedDateTime = new Date(parsedDate);
    requestedDateTime.setHours(normalizedTime.hours, normalizedTime.minutes, 0, 0);

    if (requestedDateTime.getTime() <= Date.now()) {
      throw new BadRequestException('Нельзя перенести занятие на прошедшее время');
    }

    const updated = await this.prisma.bookingRequest.update({
      where: { id: booking.id },
      data: {
        date: parsedDate,
        startTime: normalizedTime.normalized,
      },
      select: {
        id: true,
        subject: true,
        date: true,
        startTime: true,
        duration: true,
      },
    });

    const actor = studentDisplayName || booking.clientName || 'Ученик';
    const dateLabel = this.formatPortalDateLabel(updated.date);

    await this.notificationsService.create({
      userId: tutorId,
      type: NotificationType.SYSTEM,
      title: 'Запрос на перенос неподтвержденного занятия',
      description: `${actor} просит перенести неподтвержденное занятие на ${dateLabel} в ${updated.startTime}`,
      bookingRequestId: updated.id,
    });

    return {
      status: 'reschedule_pending',
      booking: {
        id: updated.id,
        subject: updated.subject,
        date: this.formatPortalDateLabel(updated.date),
        startTime: updated.startTime,
        duration: updated.duration,
      },
    };
  }

  async requestReschedule(
    studentId: string,
    lessonId: string,
    newDate: string,
    newTime: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.studentId !== student.id) throw new ForbiddenException();
    if (lesson.status !== 'PLANNED') {
      throw new ForbiddenException('Only planned lessons can be rescheduled');
    }

    const [hours, minutes] = newTime.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      throw new BadRequestException('Неверный формат времени. Используйте ЧЧ:ММ.');
    }
    const rescheduleNewTime = new Date(newDate);
    if (isNaN(rescheduleNewTime.getTime())) {
      throw new BadRequestException('Неверный формат даты.');
    }
    rescheduleNewTime.setHours(hours, minutes, 0, 0);

    if (rescheduleNewTime.getTime() <= Date.now()) {
      throw new BadRequestException('Нельзя перенести занятие на прошедшее время. Выберите будущую дату.');
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        status: 'RESCHEDULE_PENDING',
        rescheduleNewTime,
      },
    });

    const oldDateStr = lesson.scheduledAt.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const oldTimeStr = lesson.scheduledAt.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newDateStr = rescheduleNewTime.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const newTimeStr = rescheduleNewTime.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.notificationsService.create({
      userId: student.userId,
      type: 'RESCHEDULE_REQUESTED',
      title: 'Запрос на перенос занятия',
      description: `${student.name} просит перенести занятие с ${oldDateStr} ${oldTimeStr} на ${newDateStr} ${newTimeStr}`,
      studentId: student.id,
      lessonId: lesson.id,
    });

    return updated;
  }

  async toggleHomework(studentId: string, homeworkId: string, done: boolean) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });
    if (!homework) throw new NotFoundException('Homework not found');
    if (homework.studentId !== student.id) throw new ForbiddenException();

    const updatedHomework = await this.prisma.homework.update({
      where: { id: homeworkId },
      data: { status: done ? 'COMPLETED' : 'PENDING' },
    });

    if (done && homework.status !== 'COMPLETED') {
      await this.notificationsService.create({
        userId: student.userId,
        studentId: student.id,
        type: 'HOMEWORK_SUBMITTED',
        title: 'ДЗ сдано',
        description: `${student.name} отметил домашнее задание как выполненное`,
      });
    }

    return updatedHomework;
  }

  async submitLessonFeedback(
    studentId: string,
    lessonId: string,
    rating: number,
    feedback?: string,
  ) {
    const normalizedRating = Number(rating);
    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      throw new BadRequestException('Оценка должна быть от 1 до 5');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        studentId: true,
        userId: true,
        status: true,
        subject: true,
        scheduledAt: true,
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.studentId !== student.id) throw new ForbiddenException();
    if (lesson.status !== 'COMPLETED') {
      throw new BadRequestException('Оценку можно оставить только для проведенного занятия');
    }

    const trimmedFeedback = feedback?.trim();
    const serializedReview = buildPortalReviewNote({
      rating: normalizedRating,
      feedback: trimmedFeedback || null,
    });

    const existing = await this.prisma.lessonNote.findFirst({
      where: {
        lessonId,
        studentId: student.id,
        content: { startsWith: PORTAL_REVIEW_PREFIX },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await this.prisma.lessonNote.update({
        where: { id: existing.id },
        data: { content: serializedReview },
      });
    } else {
      await this.prisma.lessonNote.create({
        data: {
          studentId: student.id,
          lessonId,
          content: serializedReview,
        },
      });

      const lessonDate = lesson.scheduledAt.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      });

      await this.notificationsService.create({
        userId: lesson.userId,
        studentId: student.id,
        lessonId: lesson.id,
        type: 'SYSTEM',
        title: 'Оставлен отзыв на занятие',
        description: `${student.name} · ${lesson.subject} · ${lessonDate}`,
        actionUrl: `/students/${student.id}?tab=lessons&lessonId=${lesson.id}`,
      });
    }

    const reviewNotes = await this.prisma.lessonNote.findMany({
      where: {
        content: { startsWith: PORTAL_REVIEW_PREFIX },
        lesson: { is: { userId: lesson.userId } },
      },
      select: { content: true },
    });

    const ratings = reviewNotes
      .map((note) => parsePortalReviewNote(note.content)?.rating)
      .filter((value): value is number => Number.isFinite(value));

    const average =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) /
          10
        : null;

    await this.prisma.user.update({
      where: { id: lesson.userId },
      data: {
        rating: average === null ? null : new Prisma.Decimal(average.toFixed(1)),
      },
    });

    return {
      ok: true,
      rating: average,
      feedback: trimmedFeedback || null,
    };
  }

  async uploadHomeworkFile(
    studentId: string,
    homeworkId: string,
    file: Express.Multer.File,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        userId: true,
        user: {
          select: {
            homeworkDefaultCloud: true,
            yandexDiskToken: true,
            yandexDiskRootPath: true,
            googleDriveToken: true,
            googleDriveRootPath: true,
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        id: true,
        studentId: true,
        attachments: true,
      },
    });
    if (!homework) throw new NotFoundException('Homework not found');
    if (homework.studentId !== student.id) throw new ForbiddenException();

    const preferredCloud = student.user.homeworkDefaultCloud || CloudProvider.YANDEX_DISK;
    const studentFolderName = this.sanitizeCloudSegment(student.name, 'Ученик');
    const fileName = this.sanitizeCloudFileName(file.originalname);

    let fileUrl = '';

    if (preferredCloud === CloudProvider.GOOGLE_DRIVE) {
      if (!student.user.googleDriveToken) {
        throw new BadRequestException(
          'Google Drive не подключен как диск по умолчанию. Подключите интеграцию в настройках.',
        );
      }

      const drive = await this.getAuthenticatedGoogleDriveClient(
        student.userId,
        student.user.googleDriveToken,
      );

      const studentFolderId = await this.ensureGoogleDriveFolderTree(
        drive,
        student.user.googleDriveRootPath || 'root',
        ['Repeto', 'Домашние работы', studentFolderName],
      );

      fileUrl = await this.uploadFileToGoogleDrive(drive, studentFolderId, file, fileName);
    } else {
      if (!student.user.yandexDiskToken) {
        throw new BadRequestException(
          'Яндекс.Диск не подключен как диск по умолчанию. Подключите интеграцию в настройках.',
        );
      }

      const accessToken = this.extractYandexAccessToken(student.user.yandexDiskToken);
      const studentFolderPath = await this.ensureYandexFolderTree(
        accessToken,
        student.user.yandexDiskRootPath || 'disk:/',
        ['Repeto', 'Домашние работы', studentFolderName],
      );

      const filePath =
        studentFolderPath === 'disk:/' ? `disk:/${fileName}` : `${studentFolderPath}/${fileName}`;
      fileUrl = await this.uploadFileToYandexDisk(accessToken, filePath, file);
    }

    const updatedAttachments = Array.from(new Set([...(homework.attachments || []), fileUrl]));

    await this.prisma.homework.update({
      where: { id: homeworkId },
      data: { attachments: updatedAttachments },
    });

    return {
      id: crypto.randomUUID(),
      name: file.originalname,
      size: file.size,
      url: fileUrl,
    };
  }

  async removeHomeworkFile(
    studentId: string,
    homeworkId: string,
    fileUrl: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });
    if (!homework) throw new NotFoundException('Homework not found');
    if (homework.studentId !== student.id) throw new ForbiddenException();
    if (!homework.attachments.includes(fileUrl)) {
      throw new NotFoundException('File not found');
    }

    const filepath = path.join(process.cwd(), fileUrl);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    await this.prisma.homework.update({
      where: { id: homeworkId },
      data: {
        attachments: homework.attachments.filter((a) => a !== fileUrl),
      },
    });

    return { ok: true };
  }
}
