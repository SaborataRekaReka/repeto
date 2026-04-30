import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_LEGAL_HASH,
  DEFAULT_LEGAL_PUBLISHED_AT,
  DEFAULT_LEGAL_TITLE,
  DEFAULT_LEGAL_URL,
  DEFAULT_LEGAL_VERSION,
} from './legal.constants';

export type LegalConsentLogEntry = {
  consentType: string;
  granted: boolean;
  checkboxText: string;
  documentAnchor?: string | null;
  documentUrl?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export type RecordLegalConsentsInput = {
  userId?: string | null;
  tutorId?: string | null;
  source: string;
  version?: string;
  title?: string;
  url?: string;
  hash?: string;
  publishedAt?: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  entries: LegalConsentLogEntry[];
};

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  async hasGrantedConsent(userId: string, consentType: string) {
    const latest = await this.prisma.legalConsent.findFirst({
      where: {
        userId,
        consentType,
      },
      orderBy: [
        { occurredAt: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        granted: true,
      },
    });

    return latest?.granted === true;
  }

  async recordConsents(input: RecordLegalConsentsInput) {
    if (!input.entries || input.entries.length === 0) return;

    const version = this.normalizeValue(input.version) || DEFAULT_LEGAL_VERSION;
    const title = this.normalizeValue(input.title) || DEFAULT_LEGAL_TITLE;
    const url = this.normalizeValue(input.url) || DEFAULT_LEGAL_URL;
    const hash = this.normalizeValue(input.hash) || DEFAULT_LEGAL_HASH;
    const publishedAt = input.publishedAt || DEFAULT_LEGAL_PUBLISHED_AT;

    const legalVersion = await this.prisma.$transaction(async (tx) => {
      await tx.legalVersion.updateMany({
        where: {
          active: true,
          version: { not: version },
        },
        data: { active: false },
      });

      return tx.legalVersion.upsert({
        where: { version },
        create: {
          version,
          title,
          publishedAt,
          url,
          hash,
          active: true,
        },
        update: {
          title,
          publishedAt,
          url,
          hash,
          active: true,
        },
      });
    });

    const now = new Date();
    const rows: Prisma.LegalConsentCreateManyInput[] = input.entries.map((entry) => ({
      legalVersionId: legalVersion.id,
      userId: this.normalizeValue(input.userId),
      tutorId: this.normalizeValue(input.tutorId),
      consentType: entry.consentType,
      occurredAt: now,
      ipAddress: this.normalizeValue(input.ipAddress),
      userAgent: this.normalizeValue(input.userAgent),
      documentUrl: this.normalizeValue(entry.documentUrl) || url,
      documentAnchor: this.normalizeValue(entry.documentAnchor),
      documentVersion: version,
      documentHash: hash,
      checkboxText: entry.checkboxText,
      granted: !!entry.granted,
      source: input.source,
      metadata: entry.metadata ?? undefined,
    }));

    if (rows.length > 0) {
      await this.prisma.legalConsent.createMany({ data: rows });
    }
  }

  private normalizeValue(value?: string | null) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
  }
}
