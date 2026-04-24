import { api } from '@/lib/api';
import { useApi } from './useApi';

export type AdminTutorItem = {
  id: string;
  email: string;
  name: string;
  qualificationVerified: boolean;
  qualificationLabel: string | null;
  updatedAt: string;
  educationTotal: number;
  educationVerifiedCount: number;
  experienceTotal: number;
  experienceVerifiedCount: number;
  certificatesTotal: number;
  certificatesVerifiedCount: number;
};

export type AdminTutorVerificationObjectType =
  | 'education'
  | 'experience'
  | 'certificates';

export type AdminTutorAtom = {
  id: string;
  verified: boolean;
  verificationLabel: string | null;
};

export type AdminTutorEducationItem = AdminTutorAtom & {
  institution: string;
  program: string;
  years: string;
};

export type AdminTutorExperienceLine = AdminTutorAtom & {
  text: string;
};

export type AdminTutorCertificateItem = AdminTutorAtom & {
  title: string;
  fileUrl: string;
  uploadedAt: string;
};

export type AdminTutorDetail = {
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
  education: AdminTutorEducationItem[];
  experience: string | null;
  experienceLines: AdminTutorExperienceLine[];
  certificates: AdminTutorCertificateItem[];
  qualificationVerified: boolean;
  qualificationLabel: string | null;
  updatedAt: string;
  totals: {
    education: number;
    educationVerified: number;
    experience: number;
    experienceVerified: number;
    certificates: number;
    certificatesVerified: number;
  };
};

export type AdminTutorsFilter = 'all' | 'verified' | 'pending';

export function useAdminTutors(params: { search?: string; verified?: AdminTutorsFilter } = {}) {
  const verifiedParam =
    params.verified === 'verified'
      ? true
      : params.verified === 'pending'
      ? false
      : undefined;

  return useApi<{ items: AdminTutorItem[]; total: number }>(
    '/admin/tutors',
    {
      search: params.search,
      verified: verifiedParam,
    },
  );
}

export function useAdminTutorDetail(tutorId: string | null) {
  return useApi<AdminTutorDetail>(
    tutorId ? `/admin/tutors/${encodeURIComponent(tutorId)}` : null,
    undefined,
    { skip: !tutorId },
  );
}

export async function updateTutorVerification(tutorId: string, verified: boolean) {
  return api<AdminTutorItem>(
    `/admin/tutors/${encodeURIComponent(tutorId)}/verification`,
    {
      method: 'PATCH',
      body: { verified },
    },
  );
}

export async function updateTutorObjectVerification(
  tutorId: string,
  params: {
    type: AdminTutorVerificationObjectType;
    objectId: string;
    verified: boolean;
  },
) {
  return api<AdminTutorDetail>(
    `/admin/tutors/${encodeURIComponent(tutorId)}/object-verification`,
    {
      method: 'PATCH',
      body: params,
    },
  );
}
