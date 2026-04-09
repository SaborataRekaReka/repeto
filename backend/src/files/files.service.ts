import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudProvider, FileType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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

type SyncedResource = {
  providerPath: string;
  parentProviderPath: string | null;
  relativePath: string;
  name: string;
  type: FileType;
  extension?: string | null;
  size?: string | null;
  cloudUrl: string;
};

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

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
        throw new BadRequestException(
          'Указанная папка не найдена на Яндекс.Диске. Проверьте путь и повторите подключение.',
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

  private async collectYandexResources(accessToken: string, rootPath: string) {
    const rootResource = await this.fetchYandexResource(accessToken, rootPath, 1, 0);
    if (rootResource.type !== 'dir') {
      throw new BadRequestException('Для интеграции можно выбрать только папку.');
    }

    const synced: SyncedResource[] = [
      {
        providerPath: rootPath,
        parentProviderPath: null,
        relativePath: '/',
        name: rootPath === 'disk:/' ? 'Мой диск' : rootResource.name,
        type: FileType.FOLDER,
        extension: null,
        size: null,
        cloudUrl: this.yandexFolderUrl(rootPath),
      },
    ];

    const queue: string[] = [rootPath];

    while (queue.length > 0) {
      const currentPath = queue.shift() as string;
      const children = await this.listYandexChildren(accessToken, currentPath);

      for (const child of children) {
        const normalizedChildPath = this.normalizeYandexPath(child.path);
        const isFolder = child.type === 'dir';

        synced.push({
          providerPath: normalizedChildPath,
          parentProviderPath: currentPath,
          relativePath: this.toRelativePath(normalizedChildPath, rootPath),
          name: child.name,
          type: isFolder ? FileType.FOLDER : FileType.FILE,
          extension: isFolder ? null : this.getExtension(child.name) || null,
          size: isFolder ? null : this.formatFileSize(child.size) || null,
          cloudUrl: isFolder
            ? this.yandexFolderUrl(normalizedChildPath)
            : child.file || this.yandexFolderUrl(normalizedChildPath),
        });

        if (isFolder) {
          queue.push(normalizedChildPath);
        }
      }
    }

    return synced;
  }

  private buildShareMapByRelativePath(
    existingFiles: Array<{
      id: string;
      name: string;
      type: FileType;
      parentId: string | null;
      shares: Array<{ studentId: string }>;
    }>,
  ) {
    const byId = new Map(existingFiles.map((item) => [item.id, item]));
    const pathById = new Map<string, string>();

    const buildPath = (fileId: string): string => {
      if (pathById.has(fileId)) {
        return pathById.get(fileId) as string;
      }

      const file = byId.get(fileId);
      if (!file) {
        return '/';
      }

      if (!file.parentId) {
        pathById.set(fileId, '/');
        return '/';
      }

      const parentPath = buildPath(file.parentId);
      const currentPath = parentPath === '/' ? `/${file.name}` : `${parentPath}/${file.name}`;
      pathById.set(fileId, currentPath);
      return currentPath;
    };

    for (const file of existingFiles) {
      buildPath(file.id);
    }

    const sharesByPath = new Map<string, string[]>();
    for (const file of existingFiles) {
      const relativePath = pathById.get(file.id) || '/';
      const key = `${file.type}:${relativePath}`;
      if (file.shares.length > 0) {
        sharesByPath.set(
          key,
          Array.from(new Set(file.shares.map((share) => share.studentId))),
        );
      }
    }

    return sharesByPath;
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
    const resources = await this.collectYandexResources(accessToken, rootPath);

    const result = await this.prisma.$transaction(async (tx) => {
      const existingFiles = await tx.fileRecord.findMany({
        where: {
          userId,
          cloudProvider: CloudProvider.YANDEX_DISK,
        },
        select: {
          id: true,
          name: true,
          type: true,
          parentId: true,
          shares: {
            select: {
              studentId: true,
            },
          },
        },
      });

      const sharesByPath = this.buildShareMapByRelativePath(existingFiles);

      await tx.fileRecord.deleteMany({
        where: {
          userId,
          cloudProvider: CloudProvider.YANDEX_DISK,
        },
      });

      const idByProviderPath = new Map<string, string>();
      let restoredShares = 0;

      for (const resource of resources) {
        const parentId = resource.parentProviderPath
          ? idByProviderPath.get(resource.parentProviderPath) || null
          : null;

        const created = await tx.fileRecord.create({
          data: {
            userId,
            name: resource.name,
            type: resource.type,
            extension: resource.extension,
            size: resource.size,
            cloudProvider: CloudProvider.YANDEX_DISK,
            cloudUrl: resource.cloudUrl,
            parentId,
          },
          select: {
            id: true,
            type: true,
          },
        });

        idByProviderPath.set(resource.providerPath, created.id);

        const shareKey = `${created.type}:${resource.relativePath}`;
        const studentIds = sharesByPath.get(shareKey) || [];
        if (studentIds.length > 0) {
          restoredShares += studentIds.length;
          await tx.fileShare.createMany({
            data: studentIds.map((studentId) => ({
              fileId: created.id,
              studentId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return {
        syncedItems: resources.length,
        restoredShares,
      };
    });

    return {
      connected: true,
      rootPath: this.yandexDisplayPath(rootPath),
      syncedItems: result.syncedItems,
      restoredShares: result.restoredShares,
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
    const totalBytes = yandexFiles.reduce((sum, item) => sum + this.parseSizeToBytes(item.size), 0);
    const lastSyncedAt = yandexFiles.reduce<Date | null>((latest, item) => {
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
    const all = new Set<string>([rootId]);
    let frontier = [rootId];

    while (frontier.length > 0) {
      const children = await this.prisma.fileRecord.findMany({
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
