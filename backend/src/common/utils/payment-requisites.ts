function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function normalizeTutorPaymentRequisites(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\r\n/g, '\n').trim();
  return normalized.length > 0 ? normalized : null;
}

function formatCardNumber(value: string): string {
  const chunks = value.match(/.{1,4}/g);
  return chunks ? chunks.join(' ') : value;
}

function formatRussianPhone(value: string): string {
  if (value.length !== 11 || !value.startsWith('7')) {
    return `+${value}`;
  }

  return `+7 ${value.slice(1, 4)} ${value.slice(4, 7)}-${value.slice(7, 9)}-${value.slice(9, 11)}`;
}

export function normalizeTutorPaymentCardNumber(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const compactDigits = value.match(/\d/g)?.join('') || '';
  if (compactDigits.length >= 16 && compactDigits.length <= 20) {
    return formatCardNumber(compactDigits);
  }

  const matches = value.match(/(?:\d[\s-]*){16,20}/g) || [];
  for (const match of matches) {
    const digits = match.match(/\d/g)?.join('') || '';
    if (digits.length >= 16 && digits.length <= 20) {
      return formatCardNumber(digits);
    }
  }

  return null;
}

export function normalizeTutorPaymentSbpPhone(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const digits = trimmed.match(/\d/g)?.join('') || '';

  if (digits.length === 10) {
    return formatRussianPhone(`7${digits}`);
  }

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return formatRussianPhone(`7${digits.slice(1)}`);
  }

  if (trimmed.startsWith('+') && digits.length >= 10) {
    return `+${digits}`;
  }

  return trimmed;
}

function extractCardNumberFromRequisites(requisites: string | null): string | null {
  if (!requisites) {
    return null;
  }

  const matches = requisites.match(/(?:\d[\s-]*){16,20}/g) || [];
  for (const match of matches) {
    const normalized = normalizeTutorPaymentCardNumber(match);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function extractSbpPhoneFromRequisites(requisites: string | null): string | null {
  if (!requisites) {
    return null;
  }

  const explicitSbpLine = requisites
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /сбп/i.test(line));

  if (explicitSbpLine) {
    const normalized = normalizeTutorPaymentSbpPhone(explicitSbpLine);
    if (normalized) {
      return normalized;
    }
  }

  const phoneCandidates = requisites.match(/(?:\+7|8)[\d\s().-]{9,20}\d/g) || [];
  for (const candidate of phoneCandidates) {
    const normalized = normalizeTutorPaymentSbpPhone(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function extractTutorPaymentRequisites(paymentSettings: unknown): string | null {
  const settings = asRecord(paymentSettings);
  if (!settings) {
    return null;
  }

  const studentPaymentDetails = asRecord(settings.studentPaymentDetails);
  return normalizeTutorPaymentRequisites(studentPaymentDetails?.requisites);
}

export function extractTutorPaymentCardNumber(paymentSettings: unknown): string | null {
  const settings = asRecord(paymentSettings);
  const studentPaymentDetails = asRecord(settings?.studentPaymentDetails);
  const direct =
    normalizeTutorPaymentCardNumber(studentPaymentDetails?.cardNumber) ||
    normalizeTutorPaymentCardNumber(studentPaymentDetails?.card);

  if (direct) {
    return direct;
  }

  return extractCardNumberFromRequisites(
    normalizeTutorPaymentRequisites(studentPaymentDetails?.requisites),
  );
}

export function extractTutorPaymentSbpPhone(paymentSettings: unknown): string | null {
  const settings = asRecord(paymentSettings);
  const studentPaymentDetails = asRecord(settings?.studentPaymentDetails);
  const direct =
    normalizeTutorPaymentSbpPhone(studentPaymentDetails?.sbpPhone) ||
    normalizeTutorPaymentSbpPhone(studentPaymentDetails?.sbp);

  if (direct) {
    return direct;
  }

  return extractSbpPhoneFromRequisites(
    normalizeTutorPaymentRequisites(studentPaymentDetails?.requisites),
  );
}

export function mergeTutorPaymentRequisites(
  paymentSettings: unknown,
  updates: {
    requisites?: string | null;
    cardNumber?: string | null;
    sbpPhone?: string | null;
  },
) {
  const currentSettings = asRecord(paymentSettings)
    ? { ...(paymentSettings as Record<string, unknown>) }
    : {};

  const currentStudentPaymentDetails = asRecord(currentSettings.studentPaymentDetails)
    ? { ...(currentSettings.studentPaymentDetails as Record<string, unknown>) }
    : {};

  if (updates.requisites !== undefined) {
    if (updates.requisites) {
      currentStudentPaymentDetails.requisites = updates.requisites;
    } else {
      delete currentStudentPaymentDetails.requisites;
    }
  }

  if (updates.cardNumber !== undefined) {
    if (updates.cardNumber) {
      currentStudentPaymentDetails.cardNumber = updates.cardNumber;
    } else {
      delete currentStudentPaymentDetails.cardNumber;
    }
  }

  if (updates.sbpPhone !== undefined) {
    if (updates.sbpPhone) {
      currentStudentPaymentDetails.sbpPhone = updates.sbpPhone;
    } else {
      delete currentStudentPaymentDetails.sbpPhone;
    }
  }

  if (Object.keys(currentStudentPaymentDetails).length > 0) {
    currentSettings.studentPaymentDetails = currentStudentPaymentDetails;
  } else {
    delete currentSettings.studentPaymentDetails;
  }

  return Object.keys(currentSettings).length > 0 ? currentSettings : null;
}

export function buildTutorPaymentRequisitesPreview(
  requisites: string | null,
  cardNumber?: string | null,
  sbpPhone?: string | null,
) {
  const cardDigits = (cardNumber || '').match(/\d/g)?.join('') || '';
  if (cardDigits.length >= 4) {
    return `*${cardDigits.slice(-4)}`;
  }

  if (sbpPhone) {
    return sbpPhone;
  }

  if (!requisites) {
    return null;
  }

  const digits = requisites.match(/\d/g)?.join('') || '';
  if (digits.length >= 4) {
    return `*${digits.slice(-4)}`;
  }

  const firstLine = requisites
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return null;
  }

  return firstLine.length > 18 ? `${firstLine.slice(0, 18).trimEnd()}…` : firstLine;
}