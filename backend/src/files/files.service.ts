import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudProvider, FileType, Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { drive_v3, google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { UpdateFileShareDto } from './dto';

type YandexResource = {
  path: string;
  name: string;
  type: 'dir' | 'file';
  mime_type?: string;
  size?: number;
  modified?: string;
  file?: string;
  _embedded?: {
    total?: number;
    items?: YandexResource[];
  };
};

type GoogleDriveResource = {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
  modifiedTime?: string | null;
  webViewLink?: string | null;
};

type GoogleDriveTokens = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expiry_date?: number;
  [key: string]: unknown;
};

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cfg: AppConfigService,
  ) {}

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

  private yandexDisplayPath(path: string) {
    if (path === 'disk:/') {
      return '/';
    }

    return path.startsWith('disk:/') ? path.slice('disk:'.length) : path;
  }

  private yandexFolderUrl(providerPath: string) {
    const displayPath = this.yandexDisplayPath(providerPath);
    if (displayPath === '/') {
      return 'https://disk.yandex.ru/client/disk';
    }

    return `https://disk.yandex.ru/client/disk${encodeURI(displayPath)}`;
  }

  private isProductionEnv() {
    return this.cfg.isProduction;
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

  private normalizeGoogleDriveRootId(raw?: string | null) {
    const value = (raw || '').trim();
    if (!value || value === '/' || value === 'root') {
      return 'root';
    }

    return value;
  }

  private toDisplayGoogleDriveRootPath(raw?: string | null) {
    const value = (raw || '').trim();
    if (!value || value === 'root') {
      return '/';
    }

    return value;
  }

  private googleDriveFolderUrl(folderId: string) {
    return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`;
  }

  private googleDriveFileUrl(fileId: string) {
    return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
  }

  private extractGoogleDriveItemId(cloudUrl?: string | null) {
    if (!cloudUrl) return null;

    const parseFromPath = (path: string) => {
      const folderMatch = path.match(/\/drive\/folders\/([^/?#]+)/);
      if (folderMatch?.[1]) {
        return decodeURIComponent(folderMatch[1]);
      }

      const fileMatch = path.match(/\/file\/d\/([^/?#]+)/);
      if (fileMatch?.[1]) {
        return decodeURIComponent(fileMatch[1]);
      }

      return null;
    };

    try {
      return parseFromPath(new URL(cloudUrl).pathname);
    } catch {
      return parseFromPath(cloudUrl);
    }
  }

  private toRelativePath(providerPath: string, rootPath: string) {
    if (providerPath === rootPath) {
      return '/';
    }

    if (rootPath === 'disk:/') {
      const asDisplay = this.yandexDisplayPath(providerPath);
      return asDisplay || '/';
    }

    if (providerPath.startsWith(`${rootPath}/`)) {
      return `/${providerPath.slice(rootPath.length + 1)}`;
    }

    return this.yandexDisplayPath(providerPath);
  }

  private getExtension(fileName: string) {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex === -1) return undefined;
    return fileName.slice(dotIndex + 1).toLowerCase();
  }

  private formatFileSize(sizeBytes?: number | null) {
    if (!sizeBytes || sizeBytes <= 0) return undefined;

    if (sizeBytes >= 1024 * 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`;
    }

    if (sizeBytes >= 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)} МБ`;
    }

    if (sizeBytes >= 1024) {
      return `${Math.round(sizeBytes / 1024)} КБ`;
    }

    return `${sizeBytes} Б`;
  }

  private parseSizeToBytes(size?: string | null) {
    if (!size) return 0;

    const match = size.match(/([0-9]+(?:\.[0-9]+)?)\s*(ГБ|МБ|КБ|Б)/i);
    if (!match) return 0;

    const value = Number(match[1]);
    if (!Number.isFinite(value)) return 0;

    const unit = match[2].toUpperCase();
    if (unit === 'ГБ') return value * 1024 * 1024 * 1024;
    if (unit === 'МБ') return value * 1024 * 1024;
    if (unit === 'КБ') return value * 1024;
    return value;
  }

  private extractBadRequestMessage(error: unknown) {
    if (!(error instanceof BadRequestException)) {
      return '';
    }

    const payload = error.getResponse();
    if (typeof payload === 'string') {
      return payload;
    }

    if (payload && typeof payload === 'object' && 'message' in payload) {
      const candidate = (payload as { message?: unknown }).message;
      if (Array.isArray(candidate)) {
        return candidate.join('; ');
      }
      if (typeof candidate === 'string') {
        return candidate;
      }
    }

    return '';
  }

  private isYandexPathNotFoundError(error: unknown) {
    return this.extractBadRequestMessage(error).includes(
      'Указанная папка не найдена на Яндекс.Диске',
    );
  }

  private formatDate(date: Date) {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private extractAccessToken(token: Prisma.JsonValue | null) {
    if (!token || typeof token !== 'object' || Array.isArray(token)) {
      throw new BadRequestException('Токен Яндекс.Диска не найден. Подключите интеграцию заново.');
    }

    const accessToken = (token as Record<string, unknown>).access_token;
    if (typeof accessToken !== 'string' || !accessToken.trim()) {
      throw new BadRequestException('Токен Яндекс.Диска поврежден. Подключите интеграцию заново.');
    }

    return accessToken;
  }

  private extractGoogleDriveTokens(token: Prisma.JsonValue | null) {
    if (!token || typeof token !== 'object' || Array.isArray(token)) {
      throw new BadRequestException(
        'Токен Google Drive не найден. Подключите интеграцию заново.',
      );
    }

    const tokens = token as GoogleDriveTokens;
    if (
      (!tokens.access_token || !String(tokens.access_token).trim()) &&
      (!tokens.refresh_token || !String(tokens.refresh_token).trim())
    ) {
      throw new BadRequestException(
        'Токен Google Drive поврежден. Подключите интеграцию заново.',
      );
    }

    return tokens;
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

  private getGoogleApiReasonAndMessage(error: unknown) {
    if (!error || typeof error !== 'object') {
      return { reason: null as string | null, message: '' };
    }

    const response = (error as {
      response?: {
        data?: {
          error?: {
            message?: unknown;
            status?: unknown;
            errors?: Array<{ reason?: unknown }>;
          };
        };
      };
    }).response;

    const apiError = response?.data?.error;
    let reason: string | null = null;
    let message = '';

    if (apiError) {
      if (typeof apiError.message === 'string') {
        message = apiError.message;
      }

      if (Array.isArray(apiError.errors)) {
        const firstReason = apiError.errors.find(
          (entry): entry is { reason: string } => typeof entry?.reason === 'string',
        );
        if (firstReason?.reason) {
          reason = firstReason.reason;
        }
      }

      if (!reason && typeof apiError.status === 'string') {
        reason = apiError.status;
      }
    }

    if (!message && error instanceof Error) {
      message = error.message;
    }

    return {
      reason,
      message: message.toLowerCase(),
    };
  }

  private toGoogleDriveBadRequest(error: unknown, folderLabel?: string) {
    const status = this.getGoogleApiStatus(error);

    if (status === 401) {
      return new BadRequestException(
        'Токен Google Drive недействителен. Переподключите интеграцию.',
      );
    }

    if (status === 403) {
      const details = this.getGoogleApiReasonAndMessage(error);

      if (
        details.reason === 'accessNotConfigured' ||
        details.message.includes('api has not been used') ||
        details.message.includes('access not configured')
      ) {
        return new BadRequestException(
          'Нет доступа к Google Drive: Google Drive API выключен в Google Cloud. Включите Google Drive API и повторите подключение.',
        );
      }

      if (
        details.reason === 'insufficientPermissions' ||
        details.message.includes('insufficient authentication scopes') ||
        details.message.includes('insufficient permissions')
      ) {
        return new BadRequestException(
          'Нет доступа к Google Drive: недостаточно OAuth-прав. Переподключите интеграцию и подтвердите доступ к Drive.',
        );
      }

      return new BadRequestException(
        'Нет доступа к Google Drive. Проверьте права приложения и переподключите интеграцию.',
      );
    }

    if (status === 404) {
      if (folderLabel) {
        return new BadRequestException(
          `Указанная папка не найдена в Google Drive (${folderLabel}). Проверьте подключение и повторите попытку.`,
        );
      }

      return new BadRequestException('Папка не найдена в Google Drive.');
    }

    return new BadRequestException('Ошибка API Google Drive. Повторите попытку позже.');
  }

  private async getAuthenticatedGoogleDriveClient(userId: string): Promise<{
    oauth2: OAuth2Client;
    drive: drive_v3.Drive;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleDriveToken: true },
    });

    const clientId = this.getGoogleDriveClientId();
    const clientSecret = this.getGoogleDriveClientSecret();
    if (!clientId || !clientSecret) {
      throw new BadRequestException('OAuth Google Drive не настроен на сервере.');
    }

    const storedTokens = this.extractGoogleDriveTokens(user?.googleDriveToken || null);

    const oauth2 = this.createGoogleDriveOAuth2Client();
    oauth2.setCredentials(storedTokens);

    oauth2.on('tokens', async (newTokens) => {
      const merged = {
        ...storedTokens,
        ...newTokens,
      };

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          googleDriveToken: merged as unknown as Prisma.InputJsonValue,
        },
      });
    });

    return {
      oauth2,
      drive: google.drive({ version: 'v3', auth: oauth2 }),
    };
  }

  private async fetchGoogleDriveFolder(
    drive: drive_v3.Drive,
    folderId: string,
    displayFolder: string,
  ) {
    try {
      const response = await drive.files.get({
        fileId: folderId,
        fields: 'id,name,mimeType,webViewLink',
        supportsAllDrives: true,
      });

      const data = response.data;
      if (!data.id || !data.name || !data.mimeType) {
        throw new BadRequestException('Google Drive вернул неполные данные по папке.');
      }

      return data as GoogleDriveResource;
    } catch (error) {
      throw this.toGoogleDriveBadRequest(error, displayFolder);
    }
  }

  private async listGoogleDriveChildren(drive: drive_v3.Drive, folderId: string) {
    const children: GoogleDriveResource[] = [];
    let pageToken: string | undefined = undefined;

    try {
      do {
        const response: { data: drive_v3.Schema$FileList } = await drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          pageSize: 200,
          pageToken,
          orderBy: 'folder,name',
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink)',
        });

        const batch = (response.data.files || []).filter(
          (item: drive_v3.Schema$File): item is GoogleDriveResource =>
            !!item.id && !!item.name && !!item.mimeType,
        );

        children.push(...batch);
        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);
    } catch (error) {
      throw this.toGoogleDriveBadRequest(error);
    }

    return children;
  }

  private async fetchYandexResource(
    accessToken: string,
    providerPath: string,
    limit: number,
    offset: number,
  ) {
    const url = new URL('https://cloud-api.yandex.net/v1/disk/resources');
    url.searchParams.set('path', providerPath);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set(
      'fields',
      [
        'path',
        'name',
        'type',
        'size',
        'mime_type',
        'modified',
        'file',
        '_embedded.total',
        '_embedded.items.path',
        '_embedded.items.name',
        '_embedded.items.type',
        '_embedded.items.size',
        '_embedded.items.mime_type',
        '_embedded.items.modified',
        '_embedded.items.file',
      ].join(','),
    );

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new BadRequestException(
          'Токен Яндекс.Диска недействителен. Переподключите интеграцию.',
        );
      }

      if (response.status === 404) {
        const normalizedPath = this.normalizeYandexPath(providerPath);
        if (normalizedPath === 'disk:/') {
          throw new BadRequestException(
            'Нет доступа к корню Яндекс.Диска. Проверьте права приложения (доступ к Диску) и переподключите интеграцию.',
          );
        }

        throw new BadRequestException(
          `Указанная папка не найдена на Яндекс.Диске (${this.yandexDisplayPath(normalizedPath)}). Проверьте путь и повторите подключение.`,
        );
      }

      throw new BadRequestException('Ошибка API Яндекс.Диска. Повторите попытку позже.');
    }

    return (await response.json()) as YandexResource;
  }

  private async listYandexChildren(accessToken: string, providerPath: string) {
    const limit = 200;
    let offset = 0;
    const items: YandexResource[] = [];

    while (true) {
      const resource = await this.fetchYandexResource(accessToken, providerPath, limit, offset);
      const batch = resource._embedded?.items || [];
      const total = resource._embedded?.total ?? batch.length;

      items.push(...batch);
      offset += batch.length;

      if (batch.length === 0 || offset >= total) {
        break;
      }
    }

    return items;
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
      throw new BadRequestException(
        'Токен Яндекс.Диска недействителен. Переподключите интеграцию.',
      );
    }

    throw new BadRequestException(
      `Не удалось создать папку ${this.yandexDisplayPath(normalizedPath)} на Яндекс.Диске.`,
    );
  }

  private async ensureYandexRootFolderRecord(
    userId: string,
    rootPath: string,
    rootName: string,
  ) {
    const existingRoot = await this.prisma.fileRecord.findFirst({
      where: {
        userId,
        cloudProvider: CloudProvider.YANDEX_DISK,
        type: FileType.FOLDER,
        parentId: null,
      },
      select: {
        id: true,
      },
    });

    if (existingRoot) {
      await this.prisma.fileRecord.update({
        where: { id: existingRoot.id },
        data: {
          name: rootName,
          extension: null,
          size: null,
          cloudUrl: this.yandexFolderUrl(rootPath),
        },
      });

      return existingRoot.id;
    }

    const createdRoot = await this.prisma.fileRecord.create({
      data: {
        userId,
        name: rootName,
        type: FileType.FOLDER,
        extension: null,
        size: null,
        cloudProvider: CloudProvider.YANDEX_DISK,
        cloudUrl: this.yandexFolderUrl(rootPath),
        parentId: null,
      },
      select: {
        id: true,
      },
    });

    return createdRoot.id;
  }

  private async ensureGoogleDriveRootFolderRecord(
    userId: string,
    rootFolderId: string,
    rootName: string,
  ) {
    const existingRoot = await this.prisma.fileRecord.findFirst({
      where: {
        userId,
        cloudProvider: CloudProvider.GOOGLE_DRIVE,
        type: FileType.FOLDER,
        parentId: null,
      },
      select: {
        id: true,
      },
    });

    if (existingRoot) {
      await this.prisma.fileRecord.update({
        where: { id: existingRoot.id },
        data: {
          name: rootName,
          extension: null,
          size: null,
          cloudUrl: this.googleDriveFolderUrl(rootFolderId),
        },
      });

      return existingRoot.id;
    }

    const createdRoot = await this.prisma.fileRecord.create({
      data: {
        userId,
        name: rootName,
        type: FileType.FOLDER,
        extension: null,
        size: null,
        cloudProvider: CloudProvider.GOOGLE_DRIVE,
        cloudUrl: this.googleDriveFolderUrl(rootFolderId),
        parentId: null,
      },
      select: {
        id: true,
      },
    });

    return createdRoot.id;
  }

  private async collectDescendantIdsWithClient(
    db: PrismaService | Prisma.TransactionClient,
    userId: string,
    rootId: string,
  ) {
    const all = new Set<string>([rootId]);
    let frontier = [rootId];

    while (frontier.length > 0) {
      const children = await db.fileRecord.findMany({
        where: {
          userId,
          parentId: { in: frontier },
        },
        select: {
          id: true,
        },
      });

      frontier = [];
      for (const child of children) {
        if (!all.has(child.id)) {
          all.add(child.id);
          frontier.push(child.id);
        }
      }
    }

    return Array.from(all);
  }

  private async syncYandexFolderChildrenSnapshot(
    userId: string,
    folderId: string,
    accessToken: string,
    folderProviderPath: string,
  ) {
    const children = await this.listYandexChildren(accessToken, folderProviderPath);

    return this.prisma.$transaction(async (tx) => {
      const existingChildren = await tx.fileRecord.findMany({
        where: {
          userId,
          cloudProvider: CloudProvider.YANDEX_DISK,
          parentId: folderId,
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

      const existingByKey = new Map<string, { id: string }>();
      for (const item of existingChildren) {
        existingByKey.set(`${item.type}:${item.name}`, { id: item.id });
      }

      const touchedIds = new Set<string>();
      let createdItems = 0;
      let updatedItems = 0;

      for (const child of children) {
        const normalizedChildPath = this.normalizeYandexPath(child.path);
        const childType = child.type === 'dir' ? FileType.FOLDER : FileType.FILE;
        const key = `${childType}:${child.name}`;
        const existing = existingByKey.get(key);

        const payload = {
          name: child.name,
          type: childType,
          extension: childType === FileType.FILE ? this.getExtension(child.name) || null : null,
          size: childType === FileType.FILE ? this.formatFileSize(child.size) || null : null,
          // Persist stable Yandex web URLs; temporary downloader links may return 410 after expiry.
          cloudUrl: this.yandexFolderUrl(normalizedChildPath),
        };

        if (existing) {
          await tx.fileRecord.update({
            where: { id: existing.id },
            data: payload,
          });
          touchedIds.add(existing.id);
          updatedItems += 1;
        } else {
          const created = await tx.fileRecord.create({
            data: {
              userId,
              parentId: folderId,
              cloudProvider: CloudProvider.YANDEX_DISK,
              ...payload,
            },
            select: {
              id: true,
            },
          });
          touchedIds.add(created.id);
          createdItems += 1;
        }
      }

      const staleDirectChildren = existingChildren.filter((item) => !touchedIds.has(item.id));
      if (staleDirectChildren.length > 0) {
        const idsToDelete = new Set<string>();

        for (const stale of staleDirectChildren) {
          const subtreeIds = await this.collectDescendantIdsWithClient(tx, userId, stale.id);
          for (const id of subtreeIds) {
            idsToDelete.add(id);
          }
        }

        const staleIds = Array.from(idsToDelete);
        if (staleIds.length > 0) {
          await tx.fileRecord.deleteMany({
            where: {
              id: { in: staleIds },
              userId,
              cloudProvider: CloudProvider.YANDEX_DISK,
            },
          });
        }
      }

      return {
        syncedItems: children.length,
        createdItems,
        updatedItems,
        removedItems: staleDirectChildren.length,
      };
    });
  }

  private async syncGoogleDriveFolderChildrenSnapshot(
    userId: string,
    folderId: string,
    drive: drive_v3.Drive,
    driveFolderId: string,
  ) {
    const children = await this.listGoogleDriveChildren(drive, driveFolderId);

    return this.prisma.$transaction(async (tx) => {
      const existingChildren = await tx.fileRecord.findMany({
        where: {
          userId,
          cloudProvider: CloudProvider.GOOGLE_DRIVE,
          parentId: folderId,
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

      const existingByKey = new Map<string, Array<{ id: string }>>();
      for (const item of existingChildren) {
        const key = `${item.type}:${item.name}`;
        const current = existingByKey.get(key) || [];
        current.push({ id: item.id });
        existingByKey.set(key, current);
      }

      const touchedIds = new Set<string>();
      let createdItems = 0;
      let updatedItems = 0;

      for (const child of children) {
        const isFolder = child.mimeType === 'application/vnd.google-apps.folder';
        const childType = isFolder ? FileType.FOLDER : FileType.FILE;
        const key = `${childType}:${child.name}`;

        const bucket = existingByKey.get(key) || [];
        const existing = bucket.shift();
        if (bucket.length > 0) {
          existingByKey.set(key, bucket);
        } else {
          existingByKey.delete(key);
        }

        const parsedSize =
          child.size && Number.isFinite(Number(child.size)) ? Number(child.size) : null;

        const payload = {
          name: child.name,
          type: childType,
          extension: childType === FileType.FILE ? this.getExtension(child.name) || null : null,
          size: childType === FileType.FILE ? this.formatFileSize(parsedSize) || null : null,
          cloudUrl:
            childType === FileType.FOLDER
              ? this.googleDriveFolderUrl(child.id)
              : child.webViewLink || this.googleDriveFileUrl(child.id),
        };

        if (existing) {
          await tx.fileRecord.update({
            where: { id: existing.id },
            data: payload,
          });
          touchedIds.add(existing.id);
          updatedItems += 1;
        } else {
          const created = await tx.fileRecord.create({
            data: {
              userId,
              parentId: folderId,
              cloudProvider: CloudProvider.GOOGLE_DRIVE,
              ...payload,
            },
            select: {
              id: true,
            },
          });
          touchedIds.add(created.id);
          createdItems += 1;
        }
      }

      const staleDirectChildren = Array.from(existingByKey.values()).flat();
      if (staleDirectChildren.length > 0) {
        const idsToDelete = new Set<string>();

        for (const stale of staleDirectChildren) {
          const subtreeIds = await this.collectDescendantIdsWithClient(tx, userId, stale.id);
          for (const id of subtreeIds) {
            idsToDelete.add(id);
          }
        }

        const staleIds = Array.from(idsToDelete);
        if (staleIds.length > 0) {
          await tx.fileRecord.deleteMany({
            where: {
              id: { in: staleIds },
              userId,
              cloudProvider: CloudProvider.GOOGLE_DRIVE,
            },
          });
        }
      }

      return {
        syncedItems: children.length,
        createdItems,
        updatedItems,
        removedItems: staleDirectChildren.length,
      };
    });
  }

  private async resolveYandexFolderProviderPath(
    userId: string,
    folderId: string,
    rootPath: string,
  ) {
    const segments: string[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const current: { id: string; name: string; parentId: string | null } | null =
        await this.prisma.fileRecord.findFirst({
          where: {
            id: currentId,
            userId,
            cloudProvider: CloudProvider.YANDEX_DISK,
            type: FileType.FOLDER,
          },
          select: {
            id: true,
            name: true,
            parentId: true,
          },
        });

      if (!current) {
        throw new NotFoundException('Папка не найдена');
      }

      if (!current.parentId) {
        break;
      }

      segments.unshift(current.name);
      currentId = current.parentId;
    }

    if (segments.length === 0) {
      return rootPath;
    }

    const basePath = rootPath === 'disk:/' ? 'disk:' : rootPath;
    return this.normalizeYandexPath(`${basePath}/${segments.join('/')}`);
  }

  private async resolveGoogleDriveFolderId(userId: string, folderId: string) {
    const folder = await this.prisma.fileRecord.findFirst({
      where: {
        id: folderId,
        userId,
        cloudProvider: CloudProvider.GOOGLE_DRIVE,
        type: FileType.FOLDER,
      },
      select: {
        cloudUrl: true,
        parentId: true,
      },
    });

    if (!folder) {
      throw new NotFoundException('Папка не найдена');
    }

    const folderDriveId = this.extractGoogleDriveItemId(folder.cloudUrl);
    if (folderDriveId) {
      return folderDriveId;
    }

    if (!folder.parentId) {
      return 'root';
    }

    throw new BadRequestException(
      'Не удалось определить папку Google Drive. Синхронизируйте корень заново.',
    );
  }

  async syncFromGoogleDrive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleDriveToken: true,
        googleDriveRootPath: true,
      },
    });

    if (!user?.googleDriveToken) {
      throw new BadRequestException('Интеграция с Google Drive не подключена.');
    }

    const { drive } = await this.getAuthenticatedGoogleDriveClient(userId);
    const rootFolderDriveId = this.normalizeGoogleDriveRootId(user.googleDriveRootPath || 'root');
    const displayRootPath = this.toDisplayGoogleDriveRootPath(user.googleDriveRootPath);

    const rootResource = await this.fetchGoogleDriveFolder(
      drive,
      rootFolderDriveId,
      displayRootPath,
    );

    if (rootResource.mimeType !== 'application/vnd.google-apps.folder') {
      throw new BadRequestException('Для интеграции можно выбрать только папку.');
    }

    const rootFolderName = rootFolderDriveId === 'root' ? 'Мой диск' : rootResource.name;
    const rootFolderId = await this.ensureGoogleDriveRootFolderRecord(
      userId,
      rootFolderDriveId,
      rootFolderName,
    );

    const result = await this.syncGoogleDriveFolderChildrenSnapshot(
      userId,
      rootFolderId,
      drive,
      rootFolderDriveId,
    );

    return {
      connected: true,
      rootPath: displayRootPath,
      syncedItems: result.syncedItems,
      restoredShares: 0,
      removedItems: result.removedItems,
      scope: 'root' as const,
      syncedAt: new Date().toISOString(),
    };
  }

  async syncGoogleDriveFolder(userId: string, folderId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleDriveToken: true,
        googleDriveRootPath: true,
      },
    });

    if (!user?.googleDriveToken) {
      throw new BadRequestException('Интеграция с Google Drive не подключена.');
    }

    const { drive } = await this.getAuthenticatedGoogleDriveClient(userId);
    const displayRootPath = this.toDisplayGoogleDriveRootPath(user.googleDriveRootPath);

    const folderDriveId = await this.resolveGoogleDriveFolderId(userId, folderId);
    const folderResource = await this.fetchGoogleDriveFolder(drive, folderDriveId, folderDriveId);

    if (folderResource.mimeType !== 'application/vnd.google-apps.folder') {
      throw new BadRequestException('Синхронизировать можно только папку.');
    }

    const result = await this.syncGoogleDriveFolderChildrenSnapshot(
      userId,
      folderId,
      drive,
      folderDriveId,
    );

    return {
      connected: true,
      rootPath: displayRootPath,
      folderId,
      syncedItems: result.syncedItems,
      removedItems: result.removedItems,
      scope: 'folder' as const,
      syncedAt: new Date().toISOString(),
    };
  }

  async syncFromYandexDisk(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        yandexDiskToken: true,
        yandexDiskRootPath: true,
      },
    });

    if (!user?.yandexDiskToken) {
      throw new BadRequestException('Интеграция с Яндекс.Диском не подключена.');
    }

    const rootPath = this.normalizeYandexPath(user.yandexDiskRootPath || 'disk:/');
    const accessToken = this.extractAccessToken(user.yandexDiskToken);
    let effectiveRootPath = rootPath;
    let rootResource: YandexResource;

    try {
      rootResource = await this.fetchYandexResource(accessToken, effectiveRootPath, 1, 0);
    } catch (error) {
      if (!this.isYandexPathNotFoundError(error) || effectiveRootPath === 'disk:/') {
        throw error;
      }

      await this.createYandexFolder(accessToken, effectiveRootPath);
      rootResource = await this.fetchYandexResource(accessToken, effectiveRootPath, 1, 0);
    }

    if (rootResource.type !== 'dir') {
      throw new BadRequestException('Для интеграции можно выбрать только папку.');
    }

    const rootFolderName = effectiveRootPath === 'disk:/' ? 'Мой диск' : rootResource.name;
    const rootFolderId = await this.ensureYandexRootFolderRecord(
      userId,
      effectiveRootPath,
      rootFolderName,
    );

    const result = await this.syncYandexFolderChildrenSnapshot(
      userId,
      rootFolderId,
      accessToken,
      effectiveRootPath,
    );

    return {
      connected: true,
      rootPath: this.yandexDisplayPath(effectiveRootPath),
      syncedItems: result.syncedItems,
      restoredShares: 0,
      removedItems: result.removedItems,
      scope: 'root' as const,
      syncedAt: new Date().toISOString(),
    };
  }

  async syncYandexDiskFolder(userId: string, folderId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        yandexDiskToken: true,
        yandexDiskRootPath: true,
      },
    });

    if (!user?.yandexDiskToken) {
      throw new BadRequestException('Интеграция с Яндекс.Диском не подключена.');
    }

    const rootPath = this.normalizeYandexPath(user.yandexDiskRootPath || 'disk:/');
    const accessToken = this.extractAccessToken(user.yandexDiskToken);

    const folderProviderPath = await this.resolveYandexFolderProviderPath(
      userId,
      folderId,
      rootPath,
    );

    const folderResource = await this.fetchYandexResource(accessToken, folderProviderPath, 1, 0);
    if (folderResource.type !== 'dir') {
      throw new BadRequestException('Синхронизировать можно только папку.');
    }

    const result = await this.syncYandexFolderChildrenSnapshot(
      userId,
      folderId,
      accessToken,
      folderProviderPath,
    );

    return {
      connected: true,
      rootPath: this.yandexDisplayPath(rootPath),
      folderId,
      syncedItems: result.syncedItems,
      removedItems: result.removedItems,
      scope: 'folder' as const,
      syncedAt: new Date().toISOString(),
    };
  }

  async getFilesOverview(userId: string) {
    const [user, files, shares, students] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          yandexDiskToken: true,
          yandexDiskRootPath: true,
          yandexDiskEmail: true,
          googleDriveToken: true,
          googleDriveRootPath: true,
          googleDriveEmail: true,
        },
      }),
      this.prisma.fileRecord.findMany({
        where: { userId },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          type: true,
          extension: true,
          size: true,
          cloudProvider: true,
          cloudUrl: true,
          parentId: true,
          updatedAt: true,
        },
      }),
      this.prisma.fileShare.findMany({
        where: {
          file: { userId },
        },
        select: {
          fileId: true,
          studentId: true,
        },
      }),
      this.prisma.student.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          subject: true,
        },
      }),
    ]);

    const sharedByFileId = new Map<string, string[]>();
    for (const share of shares) {
      const current = sharedByFileId.get(share.fileId) || [];
      current.push(share.studentId);
      sharedByFileId.set(share.fileId, current);
    }

    const directChildrenCount = new Map<string, number>();
    for (const item of files) {
      if (!item.parentId) continue;
      directChildrenCount.set(item.parentId, (directChildrenCount.get(item.parentId) || 0) + 1);
    }

    const yandexFiles = files.filter((item) => item.cloudProvider === CloudProvider.YANDEX_DISK);
    const googleFiles = files.filter((item) => item.cloudProvider === CloudProvider.GOOGLE_DRIVE);
    const totalBytes = yandexFiles.reduce((sum, item) => sum + this.parseSizeToBytes(item.size), 0);
    const googleTotalBytes = googleFiles.reduce((sum, item) => sum + this.parseSizeToBytes(item.size), 0);
    const lastSyncedAt = yandexFiles.reduce<Date | null>((latest, item) => {
      if (!latest || item.updatedAt > latest) return item.updatedAt;
      return latest;
    }, null);
    const googleLastSyncedAt = googleFiles.reduce<Date | null>((latest, item) => {
      if (!latest || item.updatedAt > latest) return item.updatedAt;
      return latest;
    }, null);

    const fileTypeById = new Map(files.map((item) => [item.id, item.type]));
    const studentStats = new Map<string, { filesCount: number; foldersCount: number }>();
    for (const share of shares) {
      const current = studentStats.get(share.studentId) || { filesCount: 0, foldersCount: 0 };
      if (fileTypeById.get(share.fileId) === FileType.FOLDER) {
        current.foldersCount += 1;
      } else {
        current.filesCount += 1;
      }
      studentStats.set(share.studentId, current);
    }

    return {
      cloudConnections: [
        {
          provider: 'yandex-disk',
          connected: !!user?.yandexDiskToken,
          rootPath: this.yandexDisplayPath(this.normalizeYandexPath(user?.yandexDiskRootPath || 'disk:/')),
          email: user?.yandexDiskEmail || '',
          label: 'Яндекс.Диск',
          status: user?.yandexDiskToken ? 'active' : 'disconnected',
          fileCount: yandexFiles.filter((item) => item.type === FileType.FILE).length,
          folderCount: yandexFiles.filter((item) => item.type === FileType.FOLDER).length,
          sizeGb: Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2)),
          lastSynced: lastSyncedAt ? lastSyncedAt.toISOString() : null,
        },
        {
          provider: 'google-drive',
          connected: !!user?.googleDriveToken,
          rootPath: this.toDisplayGoogleDriveRootPath(user?.googleDriveRootPath),
          email: user?.googleDriveEmail || '',
          label: 'Google Drive',
          status: user?.googleDriveToken ? 'active' : 'disconnected',
          fileCount: googleFiles.filter((item) => item.type === FileType.FILE).length,
          folderCount: googleFiles.filter((item) => item.type === FileType.FOLDER).length,
          sizeGb: Number((googleTotalBytes / (1024 * 1024 * 1024)).toFixed(2)),
          lastSynced: googleLastSyncedAt ? googleLastSyncedAt.toISOString() : null,
        },
      ],
      files: files.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type === FileType.FOLDER ? 'folder' : 'file',
        extension: item.extension || undefined,
        size: item.size || undefined,
        modifiedAt: this.formatDate(item.updatedAt),
        cloudProvider:
          item.cloudProvider === CloudProvider.YANDEX_DISK
            ? 'yandex-disk'
            : 'google-drive',
        cloudUrl: item.cloudUrl,
        parentId: item.parentId,
        sharedWith: sharedByFileId.get(item.id) || [],
        childrenCount: directChildrenCount.get(item.id) || 0,
      })),
      studentAccess: students
        .map((student) => {
          const stat = studentStats.get(student.id) || { filesCount: 0, foldersCount: 0 };
          return {
            studentId: student.id,
            studentName: student.name,
            subject: student.subject,
            filesCount: stat.filesCount,
            foldersCount: stat.foldersCount,
          };
        })
        .filter((item) => item.filesCount > 0 || item.foldersCount > 0),
    };
  }

  private async collectDescendantIds(userId: string, rootId: string) {
    return this.collectDescendantIdsWithClient(this.prisma, userId, rootId);
  }

  async updateFileShare(userId: string, fileId: string, dto: UpdateFileShareDto) {
    const file = await this.prisma.fileRecord.findFirst({
      where: { id: fileId, userId },
      select: { id: true, type: true },
    });

    if (!file) {
      throw new NotFoundException('Файл или папка не найдены');
    }

    const studentIds = Array.from(new Set(dto.studentIds || []));

    if (studentIds.length > 0) {
      const validStudents = await this.prisma.student.findMany({
        where: {
          userId,
          id: { in: studentIds },
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      if (validStudents.length !== studentIds.length) {
        throw new BadRequestException('В списке есть недоступные ученики');
      }
    }

    const targetIds =
      dto.applyToChildren && file.type === FileType.FOLDER
        ? await this.collectDescendantIds(userId, file.id)
        : [file.id];

    await this.prisma.$transaction(async (tx) => {
      await tx.fileShare.deleteMany({
        where: {
          fileId: { in: targetIds },
        },
      });

      if (studentIds.length > 0) {
        await tx.fileShare.createMany({
          data: targetIds.flatMap((targetId) =>
            studentIds.map((studentId) => ({
              fileId: targetId,
              studentId,
            })),
          ),
          skipDuplicates: true,
        });
      }
    });

    return {
      success: true,
      fileId,
      studentsCount: studentIds.length,
      updatedItems: targetIds.length,
    };
  }
}
