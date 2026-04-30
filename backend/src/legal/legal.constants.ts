export const DEFAULT_LEGAL_VERSION = 'legal_v1_2026-04-29';
export const DEFAULT_LEGAL_TITLE = 'Юридическая информация Repeto';
export const DEFAULT_LEGAL_URL = 'https://repeto.ru/legal';
export const DEFAULT_LEGAL_HASH = 'repeto_legal_v1_2026-04-29';
export const DEFAULT_LEGAL_PUBLISHED_AT = new Date('2026-04-29T00:00:00.000Z');

export const LEGAL_CONSENT_TYPE = {
  USER_OFFER: 'user_offer_acceptance',
  USER_PERSONAL_DATA: 'user_personal_data_consent',
  CHILD_PERSONAL_DATA: 'child_personal_data_consent',
  CHILD_LEGAL_REPRESENTATIVE_CONFIRMED: 'child_legal_representative_confirmed',
  CONTACT_TRANSFER: 'contact_transfer_consent',
  BOOKING_TERMS: 'booking_terms_confirmation',
  BOOKING_TERMS_CONFIRMED: 'booking_terms_confirmed',
  TUTOR_OFFER: 'tutor_offer_acceptance',
  TUTOR_PERSONAL_DATA: 'tutor_personal_data_consent',
  TUTOR_PUBLICATION: 'tutor_publication_consent',
  MARKETING: 'marketing_consent',
  TUTOR_PAYMENT_STATUS: 'tutor_payment_status_confirmation',
  TUTOR_PAYMENT_TERMS: 'tutor_payment_terms_acceptance',
} as const;

export type LegalConsentType = (typeof LEGAL_CONSENT_TYPE)[keyof typeof LEGAL_CONSENT_TYPE];
