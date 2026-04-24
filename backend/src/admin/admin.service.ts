import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  type QualificationObjectType,
  extractQualificationVerificationSets,
  mergeQualificationVerificationSets,
  normalizeCertificateEntries,
  normalizeEducationEntries,
  resolveQualificationVerificationLabel,
  splitExperienceLines,
} from '../common/utils/qualification-verification';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private mapTutorListItem(item: {
    id: string;
    email: string;
    name: string;
    qualificationVerified: boolean;
    updatedAt: Date;
    education: unknown;
    experience: string | null;
    certificates: unknown;
    paymentSettings: unknown;
  }) {
    const verificationSets = extractQualificationVerificationSets(item.paymentSettings);
    const education = normalizeEducationEntries(item.education);
    const experienceLines = splitExperienceLines(item.experience);
    const certificates = normalizeCertificateEntries(item.certificates);

    return {
      id: item.id,
      email: item.email,
      name: item.name,
      qualificationVerified: item.qualificationVerified,
      qualificationLabel: item.qualificationVerified ? 'Верифицирован' : null,
      updatedAt: item.updatedAt,
      educationTotal: education.length,
      educationVerifiedCount: education.filter((entry) =>
        verificationSets.education.has(entry.id) || entry.legacyVerified,
      ).length,
      experienceTotal: experienceLines.length,
      experienceVerifiedCount: experienceLines.filter((entry) =>
        verificationSets.experience.has(entry.id),
      ).length,
      certificatesTotal: certificates.length,
      certificatesVerifiedCount: certificates.filter((entry) =>
        verificationSets.certificates.has(entry.id) || entry.legacyVerified,
      ).length,
    };
  }

  private mapTutorDetails(user: {
    id: string;
    email: string;
    name: string;
    slug: string | null;
    published: boolean;
    avatarUrl: string | null;
    subjects: string[];
    subjectDetails: unknown;
    tagline: string | null;
    aboutText: string | null;
    format: string | null;
    offlineAddress: string | null;
    phone: string | null;
    whatsapp: string | null;
    vk: string | null;
    website: string | null;
    education: unknown;
    experience: string | null;
    certificates: unknown;
    paymentSettings: unknown;
    qualificationVerified: boolean;
    updatedAt: Date;
  }) {
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
      id: user.id,
      email: user.email,
      name: user.name,
      slug: user.slug,
      published: user.published,
      avatarUrl: user.avatarUrl,
      subjects: user.subjects,
      subjectDetails: user.subjectDetails,
      tagline: user.tagline,
      aboutText: user.aboutText,
      format: user.format,
      offlineAddress: user.offlineAddress,
      phone: user.phone,
      whatsapp: user.whatsapp,
      vk: user.vk,
      website: user.website,
      education,
      experience: user.experience,
      experienceLines,
      certificates,
      qualificationVerified: user.qualificationVerified,
      qualificationLabel: user.qualificationVerified ? 'Верифицирован' : null,
      updatedAt: user.updatedAt,
      totals: {
        education: education.length,
        educationVerified: education.filter((entry) => entry.verified).length,
        experience: experienceLines.length,
        experienceVerified: experienceLines.filter((entry) => entry.verified).length,
        certificates: certificates.length,
        certificatesVerified: certificates.filter((entry) => entry.verified).length,
      },
    };
  }

  private async getTutorByIdOrThrow(tutorId: string) {
    const tutor = await this.prisma.user.findUnique({
      where: { id: tutorId },
      select: {
        id: true,
        email: true,
        name: true,
        slug: true,
        published: true,
        avatarUrl: true,
        subjects: true,
        subjectDetails: true,
        tagline: true,
        aboutText: true,
        format: true,
        offlineAddress: true,
        phone: true,
        whatsapp: true,
        vk: true,
        website: true,
        education: true,
        experience: true,
        certificates: true,
        paymentSettings: true,
        qualificationVerified: true,
        updatedAt: true,
      },
    });

    if (!tutor) {
      throw new NotFoundException('Репетитор не найден');
    }

    return tutor;
  }

  async listTutors(params: { search?: string; verified?: boolean }) {
    const where: Prisma.UserWhereInput = {};
    const normalizedSearch = (params.search || '').trim();

    if (normalizedSearch) {
      where.OR = [
        { name: { contains: normalizedSearch, mode: 'insensitive' } },
        { email: { contains: normalizedSearch, mode: 'insensitive' } },
      ];
    }

    if (typeof params.verified === 'boolean') {
      where.qualificationVerified = params.verified;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          qualificationVerified: true,
          education: true,
          experience: true,
          certificates: true,
          paymentSettings: true,
          updatedAt: true,
        },
        orderBy: [{ qualificationVerified: 'desc' }, { updatedAt: 'desc' }],
        take: 200,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapTutorListItem(item)),
      total,
    };
  }

  async getTutorDetails(tutorId: string) {
    const tutor = await this.getTutorByIdOrThrow(tutorId);
    return this.mapTutorDetails(tutor);
  }

  async updateTutorObjectVerification(
    tutorId: string,
    type: QualificationObjectType,
    objectId: string,
    verified: boolean,
  ) {
    const normalizedObjectId = objectId.trim();
    if (!normalizedObjectId) {
      throw new BadRequestException('ID объекта верификации обязателен');
    }

    const tutor = await this.getTutorByIdOrThrow(tutorId);

    const availableIdsByType: Record<QualificationObjectType, Set<string>> = {
      education: new Set(normalizeEducationEntries(tutor.education).map((entry) => entry.id)),
      experience: new Set(splitExperienceLines(tutor.experience).map((entry) => entry.id)),
      certificates: new Set(
        normalizeCertificateEntries(tutor.certificates).map((entry) => entry.id),
      ),
    };

    if (!availableIdsByType[type].has(normalizedObjectId)) {
      throw new BadRequestException('Объект для верификации не найден');
    }

    const verificationSets = extractQualificationVerificationSets(tutor.paymentSettings);

    if (verified) {
      verificationSets[type].add(normalizedObjectId);
    } else {
      verificationSets[type].delete(normalizedObjectId);
    }

    const nextPaymentSettings = mergeQualificationVerificationSets(
      tutor.paymentSettings,
      verificationSets,
    );

    await this.prisma.user.update({
      where: { id: tutorId },
      data: {
        paymentSettings:
          nextPaymentSettings !== null
            ? (nextPaymentSettings as Prisma.InputJsonValue)
            : Prisma.DbNull,
      },
    });

    const updated = await this.getTutorByIdOrThrow(tutorId);
    return this.mapTutorDetails(updated);
  }

  async updateTutorVerification(tutorId: string, verified: boolean) {
    try {
      const updated = await this.prisma.user.update({
        where: { id: tutorId },
        data: {
          qualificationVerified: verified,
          qualificationLabel: verified ? 'Верифицирован' : null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          qualificationVerified: true,
          education: true,
          experience: true,
          certificates: true,
          paymentSettings: true,
          updatedAt: true,
        },
      });

      return this.mapTutorListItem(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Репетитор не найден');
      }
      throw error;
    }
  }
}
