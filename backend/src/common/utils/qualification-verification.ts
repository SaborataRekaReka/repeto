import * as crypto from 'crypto';

export const QUALIFICATION_OBJECT_TYPES = [
  'education',
  'experience',
  'certificates',
] as const;

export type QualificationObjectType = (typeof QUALIFICATION_OBJECT_TYPES)[number];

export type QualificationVerificationSets = {
  education: Set<string>;
  experience: Set<string>;
  certificates: Set<string>;
};

export type NormalizedEducationEntry = {
  id: string;
  institution: string;
  program: string;
  years: string;
  legacyVerified: boolean;
};

export type NormalizedCertificateEntry = {
  id: string;
  title: string;
  fileUrl: string;
  uploadedAt: string;
  legacyVerified: boolean;
};

export type ExperienceLineEntry = {
  id: string;
  text: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function extractStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0);

  return Array.from(new Set(normalized));
}

function createStableId(prefix: string, source: string): string {
  const digest = crypto.createHash('sha1').update(source).digest('hex').slice(0, 12);
  return `${prefix}_${digest}`;
}

export function splitExperienceLines(value: unknown): ExperienceLineEntry[] {
  if (typeof value !== 'string') {
    return [];
  }

  const rows = value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((row) => row.trim())
    .filter((row) => row.length > 0);

  const rowCounters = new Map<string, number>();

  return rows.map((text) => {
    const nextIndex = rowCounters.get(text) || 0;
    rowCounters.set(text, nextIndex + 1);

    return {
      id: createStableId('exp', `${text}|${nextIndex}`),
      text,
    };
  });
}

export function normalizeEducationEntries(value: unknown): NormalizedEducationEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const fallbackCounters = new Map<string, number>();
  const entries: NormalizedEducationEntry[] = [];

  for (const rawEntry of value) {
    const entry = asRecord(rawEntry);
    if (!entry) {
      continue;
    }

    const institution = normalizeText(entry.institution);
    if (!institution) {
      continue;
    }

    const program = normalizeText(entry.program);
    const years = normalizeText(entry.years);
    const rawId = normalizeText(entry.id);
    const legacyVerified = entry.verified === true;

    let id = rawId;
    if (!id) {
      const signature = `${institution}|${program}|${years}`;
      const nextIndex = fallbackCounters.get(signature) || 0;
      fallbackCounters.set(signature, nextIndex + 1);
      id = createStableId('edu', `${signature}|${nextIndex}`);
    }

    entries.push({
      id,
      institution,
      program,
      years,
      legacyVerified,
    });
  }

  return entries;
}

export function normalizeCertificateEntries(value: unknown): NormalizedCertificateEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const fallbackCounters = new Map<string, number>();
  const entries: NormalizedCertificateEntry[] = [];

  for (const rawEntry of value) {
    const entry = asRecord(rawEntry);
    if (!entry) {
      continue;
    }

    const title = normalizeText(entry.title);
    const fileUrl = normalizeText(entry.fileUrl);
    if (!title && !fileUrl) {
      continue;
    }

    const uploadedAt = normalizeText(entry.uploadedAt);
    const rawId = normalizeText(entry.id);
    const legacyVerified = entry.verified === true;

    let id = rawId;
    if (!id) {
      const signature = `${title}|${fileUrl}`;
      const nextIndex = fallbackCounters.get(signature) || 0;
      fallbackCounters.set(signature, nextIndex + 1);
      id = createStableId('cert', `${signature}|${nextIndex}`);
    }

    entries.push({
      id,
      title: title || fileUrl || 'Документ',
      fileUrl,
      uploadedAt,
      legacyVerified,
    });
  }

  return entries;
}

export function extractQualificationVerificationSets(
  paymentSettings: unknown,
): QualificationVerificationSets {
  const settings = asRecord(paymentSettings);
  const verification = asRecord(settings?.qualificationVerification);

  return {
    education: new Set(extractStringArray(verification?.education)),
    experience: new Set(extractStringArray(verification?.experience)),
    certificates: new Set(extractStringArray(verification?.certificates)),
  };
}

function normalizeVerificationSet(value: Set<string>): string[] {
  return Array.from(value)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .sort((a, b) => a.localeCompare(b));
}

export function mergeQualificationVerificationSets(
  paymentSettings: unknown,
  sets: QualificationVerificationSets,
) {
  const currentSettings = asRecord(paymentSettings)
    ? { ...(paymentSettings as Record<string, unknown>) }
    : {};

  const currentVerification = asRecord(currentSettings.qualificationVerification)
    ? { ...(currentSettings.qualificationVerification as Record<string, unknown>) }
    : {};

  const education = normalizeVerificationSet(sets.education);
  const experience = normalizeVerificationSet(sets.experience);
  const certificates = normalizeVerificationSet(sets.certificates);

  if (education.length > 0) {
    currentVerification.education = education;
  } else {
    delete currentVerification.education;
  }

  if (experience.length > 0) {
    currentVerification.experience = experience;
  } else {
    delete currentVerification.experience;
  }

  if (certificates.length > 0) {
    currentVerification.certificates = certificates;
  } else {
    delete currentVerification.certificates;
  }

  const hasVerificationContent = Object.keys(currentVerification).some(
    (key) => key !== 'updatedAt',
  );

  if (hasVerificationContent) {
    currentVerification.updatedAt = new Date().toISOString();
    currentSettings.qualificationVerification = currentVerification;
  } else {
    delete currentSettings.qualificationVerification;
  }

  return Object.keys(currentSettings).length > 0 ? currentSettings : null;
}

export function resolveQualificationVerificationLabel(verified: boolean): string | null {
  return verified ? 'Верифицирован' : null;
}
