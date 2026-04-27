import type { NextApiRequest, NextApiResponse } from 'next';
import { students as seedStudents } from '@/mocks/students';
import {
  financeChartData as seedFinanceChartData,
  paymentMethodsData as seedPaymentMethodsData,
  payments as seedPayments,
} from '@/mocks/finance-tutor';
import { notifications as seedNotifications } from '@/mocks/notifications';
import {
  studentHomeworks as seedStudentHomeworks,
  studentNotes as seedStudentNotes,
} from '@/mocks/student-details';
import type {
  CloudConnection,
  FileItem,
  FilesOverviewResponse,
  StudentFileAccess,
} from '@/types/files';

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

type JsonObject = Record<string, unknown>;

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const MOCK_ACCESS_TOKEN = 'mock-access-token';
const MOCK_STUDENT_ACCESS_TOKEN = 'mock-student-access-token';
const MOCK_STUDENT_REFRESH_TOKEN = 'mock-student-refresh-token';

type MockUser = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  slug: string;
  role: 'tutor';
  subjects: string[];
  avatarUrl?: string | null;
  aboutText?: string;
  platformAccessState: 'active' | 'expired' | 'missing';
  platformAccess: {
    status: 'active';
    planId: 'start' | 'profi' | 'center';
    billingCycle: 'month' | 'year';
    activatedAt: string;
    expiresAt: string;
    amountRub: number;
  };
};

type MockCertificate = {
  id: string;
  title: string;
  fileUrl: string;
  uploadedAt: string;
  verified: boolean;
  verificationLabel: string | null;
};

type MockSettings = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  aboutText: string;
  subjects: string[];
  subjectDetails: Array<{ name: string; rate?: number }>;
  format: 'online' | 'offline' | 'both';
  experience: string;
  hasYandexCalendar: boolean;
  hasGoogleCalendar: boolean;
  hasYandexDisk: boolean;
  hasGoogleDrive: boolean;
  yandexCalendarEmail: string;
  googleCalendarEmail: string;
  yandexDiskEmail: string;
  googleDriveEmail: string;
  yandexDiskRootPath: string;
  googleDriveRootPath: string;
  homeworkDefaultCloud: 'YANDEX_DISK' | 'GOOGLE_DRIVE';
  account: { slug: string };
  slug: string;
  published: boolean;
  showPublicPackages: boolean;
  tagline: string;
  vk: string;
  website: string;
  offlineAddress: string;
  notificationSettings: Record<string, unknown>;
  cancelPolicySettings: Record<string, unknown>;
  paymentRequisites: string;
  paymentCardNumber: string;
  paymentSbpPhone: string;
  paymentSettings: {
    studentPaymentDetails: {
      requisites: string;
      cardNumber: string;
      sbpPhone: string;
    };
  };
  certificates: MockCertificate[];
  education: Array<Record<string, unknown>>;
  qualificationVerified: boolean;
  [key: string]: unknown;
};

type MockStudent = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  age?: number | null;
  rate: number;
  balance: number;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentWhatsapp?: string | null;
  parentTelegram?: string | null;
  parentEmail?: string | null;
  telegramChatId?: string | null;
  maxChatId?: string | null;
  email?: string | null;
  accountId?: string | null;
  notes?: string | null;
  avatarUrl?: string | null;
};

type MockLesson = {
  id: string;
  studentId: string;
  subject: string;
  scheduledAt: string;
  duration: number;
  format: 'ONLINE' | 'OFFLINE';
  status:
    | 'PLANNED'
    | 'COMPLETED'
    | 'CANCELLED_STUDENT'
    | 'CANCELLED_TUTOR'
    | 'NO_SHOW'
    | 'RESCHEDULE_PENDING';
  rate: number;
  notes?: string;
};

type MockPayment = {
  id: string;
  studentId: string;
  lessonId?: string | null;
  amount: number;
  date: string;
  method: 'SBP' | 'CASH' | 'TRANSFER' | 'YUKASSA';
  status: 'PAID';
  comment?: string | null;
  externalPaymentId?: string | null;
};

type MockNote = {
  id: string;
  studentId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  lessonId?: string | null;
};

type MockHomework = {
  id: string;
  studentId: string;
  task: string;
  dueAt?: string | null;
  status: 'NOT_DONE' | 'DONE' | 'OVERDUE';
  createdAt: string;
  updatedAt: string;
  lessonId?: string | null;
  linkedFiles?: Array<{
    id: string;
    name: string;
    url: string;
    cloudUrl: string;
    cloudProvider?: 'yandex-disk' | 'google-drive';
    extension?: string;
    size?: string;
  }>;
  studentUploads?: Array<{
    id: string;
    name: string;
    size: string;
    uploadedAt: string;
    expiresAt: string;
    url: string;
  }>;
};

type MockPackage = {
  id: string;
  studentId?: string;
  subject: string;
  lessonsTotal: number;
  lessonsUsed: number;
  totalPrice: number;
  validUntil: string;
  createdAt: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  isPublic: boolean;
  comment?: string;
};

type MockNotification = {
  id: string;
  type:
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_OVERDUE'
    | 'LESSON_REMINDER'
    | 'LESSON_CANCELLED'
    | 'RESCHEDULE_REQUESTED'
    | 'HOMEWORK_SUBMITTED'
    | 'BOOKING_NEW'
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_REJECTED'
    | 'SYSTEM';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  bookingRequestId?: string;
  studentId?: string;
  lessonId?: string;
};

type MockAvailabilitySlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type MockAvailabilityOverride = {
  date: string;
  isBlocked: boolean;
  slots: Array<{ startTime: string; endTime: string }>;
};

type MockStudentAccount = {
  id: string;
  email: string;
  name: string;
  status: 'ACTIVE';
};

type MockState = {
  user: MockUser;
  settings: MockSettings;
  students: MockStudent[];
  lessons: MockLesson[];
  payments: MockPayment[];
  notesByStudent: Record<string, MockNote[]>;
  homeworkByStudent: Record<string, MockHomework[]>;
  packages: MockPackage[];
  notifications: MockNotification[];
  availabilitySlots: MockAvailabilitySlot[];
  availabilityOverrides: MockAvailabilityOverride[];
  filesOverview: FilesOverviewResponse;
  counters: {
    lesson: number;
    payment: number;
    note: number;
    homework: number;
    package: number;
    notification: number;
    certificate: number;
    file: number;
  };
  studentAccount: MockStudentAccount;
  studentPortalStudentId: string;
};

const globalForMock = globalThis as typeof globalThis & {
  __repetoMockState?: MockState;
};

const PLATFORM_PLAN_RANK = {
  start: 1,
  profi: 2,
  center: 3,
} as const;

const PLATFORM_PLAN_PRICES = {
  start: { month: 0, year: 0 },
  profi: { month: 300, year: 250 * 12 },
  center: { month: 1500, year: 1250 * 12 },
} as const;

function isPlatformPlanId(value: unknown): value is keyof typeof PLATFORM_PLAN_PRICES {
  return value === 'start' || value === 'profi' || value === 'center';
}

function isPlatformBillingCycle(value: unknown): value is 'month' | 'year' {
  return value === 'month' || value === 'year';
}

function resolvePlanPriceRub(planId: keyof typeof PLATFORM_PLAN_PRICES, billingCycle: 'month' | 'year') {
  return PLATFORM_PLAN_PRICES[planId][billingCycle];
}

function toMethod(value: string | undefined): HttpMethod {
  return (value || 'GET').toUpperCase() as HttpMethod;
}

function queryValue(req: NextApiRequest, key: string): string | undefined {
  const raw = req.query[key];
  if (Array.isArray(raw)) {
    return typeof raw[0] === 'string' ? raw[0] : undefined;
  }
  return typeof raw === 'string' ? raw : undefined;
}

function toNumber(value: string | undefined, fallback: number, min = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.floor(parsed));
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const ru = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (ru) {
    const year = Number(ru[3]);
    const month = Number(ru[2]) - 1;
    const day = Number(ru[1]);
    const date = new Date(year, month, day, 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;

  return null;
}

function toIsoDate(date: Date): string {
  const copy = new Date(date);
  const y = copy.getFullYear();
  const m = String(copy.getMonth() + 1).padStart(2, '0');
  const d = String(copy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_IN_DAY);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'demo-tutor';
}

function nextId(state: MockState, key: keyof MockState['counters']): string {
  const value = state.counters[key];
  state.counters[key] += 1;
  return `${key}_${value}`;
}

function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), pages);
  const start = (safePage - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    data,
    total,
    page: safePage,
    pages,
  };
}

async function readJsonBody(req: NextApiRequest): Promise<JsonObject> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return {};
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (contentType.includes('multipart/form-data')) {
    return {};
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as JsonObject) : {};
  } catch {
    return {};
  }
}

function normalizeStatus(
  value: unknown,
  fallback: MockStudent['status'] = 'ACTIVE',
): MockStudent['status'] {
  const raw = String(value || '').toUpperCase();
  if (raw === 'ACTIVE' || raw === 'PAUSED' || raw === 'ARCHIVED') {
    return raw;
  }
  return fallback;
}

function normalizeLessonStatus(value: unknown): MockLesson['status'] {
  const raw = String(value || '').toUpperCase();
  switch (raw) {
    case 'COMPLETED':
    case 'CANCELLED_STUDENT':
    case 'CANCELLED_TUTOR':
    case 'NO_SHOW':
    case 'RESCHEDULE_PENDING':
    case 'PLANNED':
      return raw;
    default:
      return 'PLANNED';
  }
}

function normalizeHomeworkStatus(value: unknown): MockHomework['status'] {
  const raw = String(value || '').toUpperCase();
  if (raw === 'DONE') return 'DONE';
  if (raw === 'OVERDUE') return 'OVERDUE';
  return 'NOT_DONE';
}

function normalizePaymentMethod(value: unknown): MockPayment['method'] {
  const raw = String(value || '').toUpperCase();
  if (raw === 'SBP' || raw === 'CASH' || raw === 'TRANSFER' || raw === 'YUKASSA') {
    return raw;
  }
  return 'TRANSFER';
}

function buildStudentAccessEntries(files: FileItem[], students: MockStudent[]): StudentFileAccess[] {
  const map = new Map<string, { filesCount: number; foldersCount: number }>();

  for (const file of files) {
    const shared = Array.isArray(file.sharedWith) ? file.sharedWith : [];
    for (const studentId of shared) {
      const existing = map.get(studentId) || { filesCount: 0, foldersCount: 0 };
      if (file.type === 'folder') {
        existing.foldersCount += 1;
      } else {
        existing.filesCount += 1;
      }
      map.set(studentId, existing);
    }
  }

  return students
    .map((student) => {
      const counts = map.get(student.id) || { filesCount: 0, foldersCount: 0 };
      return {
        studentId: student.id,
        studentName: student.name,
        subject: student.subject,
        filesCount: counts.filesCount,
        foldersCount: counts.foldersCount,
      };
    })
    .filter((entry) => entry.filesCount > 0 || entry.foldersCount > 0);
}

function buildSeedLessons(students: MockStudent[]): MockLesson[] {
  const lessons: MockLesson[] = [];
  const now = startOfDay(new Date());
  let index = 1;

  for (const [studentIndex, student] of students.entries()) {
    for (let dayOffset = -9; dayOffset <= 10; dayOffset += 3) {
      const start = addDays(now, dayOffset);
      const hour = 12 + ((studentIndex + dayOffset + 40) % 6);
      start.setHours(hour, 0, 0, 0);
      const past = dayOffset < 0;
      const status: MockLesson['status'] = past
        ? dayOffset % 4 === 0
          ? 'CANCELLED_STUDENT'
          : 'COMPLETED'
        : 'PLANNED';

      lessons.push({
        id: `ls_${index}`,
        studentId: student.id,
        subject: student.subject,
        scheduledAt: start.toISOString(),
        duration: 60,
        format: studentIndex % 3 === 0 ? 'OFFLINE' : 'ONLINE',
        status,
        rate: student.rate,
        notes: status === 'COMPLETED' ? 'Практика по теме занятия.' : '',
      });

      index += 1;
    }
  }

  lessons.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  return lessons;
}

function buildSeedFiles(students: MockStudent[]): FilesOverviewResponse {
  const cloudConnections: CloudConnection[] = [
    {
      provider: 'yandex-disk',
      connected: true,
      rootPath: '/Repeto',
      email: 'demo@yandex.ru',
      label: 'Yandex Disk',
      status: 'active',
      fileCount: 8,
      folderCount: 3,
      sizeGb: 0.3,
      lastSynced: new Date().toISOString(),
    },
    {
      provider: 'google-drive',
      connected: false,
      rootPath: '/Repeto',
      email: '',
      label: 'Google Drive',
      status: 'disconnected',
      fileCount: 0,
      folderCount: 0,
      sizeGb: 0,
      lastSynced: null,
    },
  ];

  const files: FileItem[] = [
    {
      id: 'file_root_1',
      name: 'Математика',
      type: 'folder',
      modifiedAt: new Date().toISOString(),
      cloudProvider: 'yandex-disk',
      cloudUrl: '#',
      parentId: null,
      sharedWith: [students[0]?.id || '1', students[4]?.id || '5'],
      childrenCount: 2,
    },
    {
      id: 'file_root_2',
      name: 'Английский',
      type: 'folder',
      modifiedAt: new Date().toISOString(),
      cloudProvider: 'yandex-disk',
      cloudUrl: '#',
      parentId: null,
      sharedWith: [students[1]?.id || '2', students[5]?.id || '6'],
      childrenCount: 2,
    },
    {
      id: 'file_1',
      name: 'Квадратные уравнения.pdf',
      type: 'file',
      extension: 'pdf',
      size: '2.4 MB',
      modifiedAt: addDays(new Date(), -2).toISOString(),
      cloudProvider: 'yandex-disk',
      cloudUrl: '#',
      parentId: 'file_root_1',
      sharedWith: [students[0]?.id || '1'],
    },
    {
      id: 'file_2',
      name: 'Параметры задача 12.jpg',
      type: 'file',
      extension: 'jpg',
      size: '1.1 MB',
      modifiedAt: addDays(new Date(), -5).toISOString(),
      cloudProvider: 'yandex-disk',
      cloudUrl: '#',
      parentId: 'file_root_1',
      sharedWith: [students[0]?.id || '1'],
    },
    {
      id: 'file_3',
      name: 'Conditionals worksheet.docx',
      type: 'file',
      extension: 'docx',
      size: '320 KB',
      modifiedAt: addDays(new Date(), -1).toISOString(),
      cloudProvider: 'yandex-disk',
      cloudUrl: '#',
      parentId: 'file_root_2',
      sharedWith: [students[1]?.id || '2'],
    },
  ];

  return {
    cloudConnections,
    files,
    studentAccess: buildStudentAccessEntries(files, students),
  };
}

function createInitialMockState(): MockState {
  const now = new Date();
  const nextMonth = addDays(now, 30).toISOString();
  const activatedAt = addDays(now, -20).toISOString();

  const user: MockUser = {
    id: 'u_demo',
    email: 'demo@repeto.local',
    name: 'Демо Репетитор',
    phone: '+7 999 000-00-00',
    whatsapp: '+7 999 000-00-00',
    slug: 'demo-tutor',
    role: 'tutor',
    subjects: ['Математика', 'Английский', 'Физика'],
    avatarUrl: null,
    aboutText: 'Демо-режим для разработки интерфейса без backend.',
    platformAccessState: 'active',
    platformAccess: {
      status: 'active',
      planId: 'profi',
      billingCycle: 'month',
      activatedAt,
      expiresAt: nextMonth,
      amountRub: 1490,
    },
  };

  const students: MockStudent[] = seedStudents.map((student, index) => ({
    id: student.id,
    name: student.name,
    subject: student.subject,
    grade: student.grade,
    age: student.grade === 'Взрослый' ? null : 14 + (index % 4),
    rate: student.rate,
    balance: student.balance,
    status: normalizeStatus(student.status),
    phone: student.phone || null,
    whatsapp: student.phone || null,
    telegram: student.telegram || null,
    parentName: student.parentName || null,
    parentPhone: student.parentPhone || null,
    parentWhatsapp: student.parentPhone || null,
    parentTelegram: student.parentTelegram || null,
    parentEmail:
      student.parentEmail ||
      (student.parentName ? `parent${index + 1}@mail.local` : null),
    telegramChatId: null,
    maxChatId: null,
    email: student.id === '1' ? 'petya@student.local' : null,
    accountId: index % 2 === 0 ? `acc_${student.id}` : null,
    notes: student.notes || null,
    avatarUrl: null,
  }));

  const lessons = buildSeedLessons(students);

  const payments: MockPayment[] = seedPayments.map((payment, index) => {
    const parsed = parseDate(payment.date);
    const lesson = lessons.find((item) => item.studentId === payment.studentId);
    return {
      id: payment.id,
      studentId: payment.studentId,
      lessonId: lesson?.id || null,
      amount: payment.amount,
      date: (parsed || addDays(now, -(index + 2))).toISOString(),
      method: normalizePaymentMethod(payment.method),
      status: 'PAID',
      comment: null,
      externalPaymentId: index % 3 === 0 ? `ext_${payment.id}` : null,
    };
  });

  const notesByStudent: Record<string, MockNote[]> = {};
  const homeworkByStudent: Record<string, MockHomework[]> = {};

  for (const student of students) {
    notesByStudent[student.id] = [];
    homeworkByStudent[student.id] = [];
  }

  seedStudentNotes.forEach((note, index) => {
    const studentExists = students.some((student) => student.id === note.studentId);
    if (!studentExists) return;

    const created = addDays(now, -(index + 1)).toISOString();
    const studentLessons = lessons.filter((lesson) => lesson.studentId === note.studentId);

    notesByStudent[note.studentId].push({
      id: note.id,
      studentId: note.studentId,
      content: note.text,
      createdAt: created,
      updatedAt: created,
      lessonId: studentLessons[0]?.id || null,
    });
  });

  seedStudentHomeworks.forEach((homework, index) => {
    const studentExists = students.some((student) => student.id === homework.studentId);
    if (!studentExists) return;

    const created = addDays(now, -(index + 2)).toISOString();
    const dueAt = addDays(now, index % 4 === 0 ? -1 : index + 2).toISOString();

    homeworkByStudent[homework.studentId].push({
      id: homework.id,
      studentId: homework.studentId,
      task: homework.task,
      dueAt,
      status: normalizeHomeworkStatus(homework.status),
      createdAt: created,
      updatedAt: created,
      lessonId:
        lessons.find((lesson) => lesson.studentId === homework.studentId)?.id ||
        null,
      linkedFiles: (homework.linkedFiles || []).map((file) => ({
        id: file.id,
        name: file.name,
        url: file.url,
        cloudUrl: file.url,
        cloudProvider: file.provider || 'yandex-disk',
        extension: file.extension,
        size: file.size,
      })),
      studentUploads: (homework.studentUploads || []).map((upload) => ({
        id: upload.id,
        name: upload.name,
        size: upload.size,
        uploadedAt: upload.uploadedAt,
        expiresAt: upload.expiresAt,
        url: upload.url,
      })),
    });
  });

  const packages: MockPackage[] = students.slice(0, 6).map((student, index) => {
    const lessonsTotal = 8 + (index % 3) * 4;
    const lessonsUsed = Math.min(lessonsTotal, 3 + index * 2);
    const status: MockPackage['status'] =
      lessonsUsed >= lessonsTotal
        ? 'COMPLETED'
        : index === 5
          ? 'EXPIRED'
          : 'ACTIVE';

    return {
      id: `pkg_${index + 1}`,
      studentId: student.id,
      subject: student.subject,
      lessonsTotal,
      lessonsUsed,
      totalPrice: lessonsTotal * student.rate,
      validUntil: addDays(now, status === 'EXPIRED' ? -5 : 7 + index * 4).toISOString(),
      createdAt: addDays(now, -(50 - index * 3)).toISOString(),
      status,
      isPublic: false,
      comment: '',
    };
  });

  const notifications: MockNotification[] = seedNotifications.map((item, index) => ({
    id: item.id,
    type: String(item.type || 'system').toUpperCase() as MockNotification['type'],
    title: item.title,
    message: item.description,
    createdAt: addDays(now, -Math.floor(index / 2)).toISOString(),
    read: item.read,
    actionLabel: item.actionLabel,
    actionUrl: undefined,
    studentId: students[index % students.length]?.id,
    lessonId: lessons[index % lessons.length]?.id,
  }));

  const availabilitySlots: MockAvailabilitySlot[] = [
    { id: 'av_1', dayOfWeek: 0, startTime: '15:00', endTime: '16:00' },
    { id: 'av_2', dayOfWeek: 0, startTime: '17:00', endTime: '18:00' },
    { id: 'av_3', dayOfWeek: 1, startTime: '15:00', endTime: '16:00' },
    { id: 'av_4', dayOfWeek: 2, startTime: '16:00', endTime: '17:00' },
    { id: 'av_5', dayOfWeek: 3, startTime: '16:00', endTime: '17:00' },
    { id: 'av_6', dayOfWeek: 4, startTime: '14:00', endTime: '15:00' },
  ];

  const filesOverview = buildSeedFiles(students);

  const settings: MockSettings = {
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    whatsapp: user.whatsapp || '',
    aboutText: user.aboutText || '',
    subjects: [...user.subjects],
    subjectDetails: user.subjects.map((name) => ({
      name,
      rate: students.find((student) => student.subject === name)?.rate,
    })),
    format: 'online',
    experience: '5 лет',
    hasYandexCalendar: false,
    hasGoogleCalendar: false,
    hasYandexDisk: true,
    hasGoogleDrive: false,
    yandexCalendarEmail: '',
    googleCalendarEmail: '',
    yandexDiskEmail: 'demo@yandex.ru',
    googleDriveEmail: '',
    yandexDiskRootPath: '/Repeto',
    googleDriveRootPath: '/Repeto',
    homeworkDefaultCloud: 'YANDEX_DISK',
    account: { slug: user.slug },
    slug: user.slug,
    published: false,
    showPublicPackages: true,
    tagline: 'Персональные занятия для школьников и взрослых',
    vk: '',
    website: '',
    offlineAddress: '',
    notificationSettings: {
      lessonReminders: true,
      debtReminders: true,
      homeworkReminders: true,
      systemEvents: true,
    },
    cancelPolicySettings: {
      freeHours: 24,
      lateCancelAction: '50%',
      noShowAction: '100%',
    },
    paymentRequisites: '',
    paymentCardNumber: '',
    paymentSbpPhone: '',
    paymentSettings: {
      studentPaymentDetails: {
        requisites: '',
        cardNumber: '',
        sbpPhone: '',
      },
    },
    certificates: [],
    education: [],
    qualificationVerified: true,
  };

  return {
    user,
    settings,
    students,
    lessons,
    payments,
    notesByStudent,
    homeworkByStudent,
    packages,
    notifications,
    availabilitySlots,
    availabilityOverrides: [],
    filesOverview,
    counters: {
      lesson: lessons.length + 1,
      payment: payments.length + 1,
      note: seedStudentNotes.length + 1,
      homework: seedStudentHomeworks.length + 1,
      package: packages.length + 1,
      notification: notifications.length + 1,
      certificate: 1,
      file: filesOverview.files.length + 1,
    },
    studentAccount: {
      id: 'student_account_1',
      email: 'student@example.com',
      name: students[0]?.name || 'Ученик',
      status: 'ACTIVE',
    },
    studentPortalStudentId: students[0]?.id || '1',
  };
}

function getState(): MockState {
  if (!globalForMock.__repetoMockState) {
    globalForMock.__repetoMockState = createInitialMockState();
  }
  return globalForMock.__repetoMockState;
}

function mapLessonForResponse(state: MockState, lesson: MockLesson): JsonObject {
  const student = state.students.find((item) => item.id === lesson.studentId);
  return {
    ...lesson,
    studentId: lesson.studentId,
    studentName: student?.name || '',
    studentAccountId: student?.accountId ?? null,
    subject: lesson.subject || student?.subject || '',
    student: student
      ? {
          id: student.id,
          name: student.name,
          subject: student.subject,
          accountId: student.accountId ?? null,
        }
      : undefined,
  };
}

function mapPaymentForResponse(state: MockState, payment: MockPayment): JsonObject {
  const student = state.students.find((item) => item.id === payment.studentId);
  const lesson = payment.lessonId
    ? state.lessons.find((item) => item.id === payment.lessonId)
    : undefined;

  return {
    ...payment,
    studentName: student?.name || '',
    studentAccountId: student?.accountId ?? null,
    student: student
      ? {
          id: student.id,
          name: student.name,
          accountId: student.accountId ?? null,
        }
      : undefined,
    lesson: lesson
      ? {
          id: lesson.id,
          subject: lesson.subject,
          scheduledAt: lesson.scheduledAt,
        }
      : undefined,
  };
}

function buildFinanceBalances(state: MockState) {
  return state.students.map((student) => {
    const lessons = state.lessons.filter(
      (lesson) =>
        lesson.studentId === student.id &&
        lesson.status !== 'CANCELLED_STUDENT' &&
        lesson.status !== 'CANCELLED_TUTOR',
    );

    const paymentsTotal = state.payments
      .filter((payment) => payment.studentId === student.id)
      .reduce((sum, payment) => sum + payment.amount, 0);

    const lessonsCount = lessons.length;
    const totalAmount = lessons.reduce((sum, lesson) => sum + (lesson.rate || student.rate), 0);
    const debt = totalAmount - paymentsTotal;

    return {
      studentId: student.id,
      studentName: student.name,
      studentAccountId: student.accountId ?? null,
      subject: student.subject,
      lessonsCount,
      totalAmount,
      paidAmount: paymentsTotal,
      debt,
      parentEmail: student.parentEmail ?? null,
    };
  });
}

function buildDashboardIncomeChart(state: MockState) {
  const now = new Date();
  const months: Array<{
    key: string;
    label: string;
    received: number;
    expected: number;
    isCurrent: boolean;
  }> = [];

  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;

    const monthPayments = state.payments.filter((payment) => {
      const d = new Date(payment.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });

    const monthLessons = state.lessons.filter((lesson) => {
      const d = new Date(lesson.scheduledAt);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });

    const received = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const lessonVolume = monthLessons.reduce((sum, lesson) => sum + lesson.rate, 0);
    const expected = Math.max(0, lessonVolume - received);

    const monthName = date.toLocaleDateString('ru-RU', { month: 'short' });
    months.push({
      key,
      label: monthName.replace('.', ''),
      received,
      expected,
      isCurrent: i === 0,
    });
  }

  const currentMonth = months[months.length - 1];
  const prevMonth = months[months.length - 2];

  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  const thisYear = months
    .filter((month) => Number(month.key.slice(0, 4)) === currentYear)
    .reduce(
      (acc, month) => {
        acc.received += month.received;
        acc.expected += month.expected;
        return acc;
      },
      { received: 0, expected: 0 },
    );

  const lastYearPayments = state.payments
    .filter((payment) => new Date(payment.date).getFullYear() === previousYear)
    .reduce((sum, payment) => sum + payment.amount, 0);

  const pct = (current: number, previous: number) => {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    months,
    current: {
      title: 'Текущий месяц',
      total: currentMonth.received + currentMonth.expected,
      received: currentMonth.received,
      expected: currentMonth.expected,
      vsPrevMonth: {
        pct: pct(currentMonth.received, prevMonth?.received || 0),
        rangeLabel: 'к прошлому месяцу',
      },
      vsPrevYear: {
        pct: pct(currentMonth.received, 0),
        rangeLabel: 'к прошлому году',
      },
    },
    ytd: {
      title: 'С начала года',
      total: thisYear.received + thisYear.expected,
      received: thisYear.received,
      expected: thisYear.expected,
      vsPrevYear: {
        pct: pct(thisYear.received, lastYearPayments),
        rangeLabel: 'к прошлому году',
      },
    },
  };
}

function resolvePortalData(state: MockState, studentId: string) {
  const student =
    state.students.find((item) => item.id === studentId) ||
    state.students[0];

  if (!student) {
    return null;
  }

  const lessons = state.lessons
    .filter((item) => item.studentId === student.id)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const upcoming = lessons
    .filter((lesson) => new Date(lesson.scheduledAt).getTime() >= Date.now())
    .slice(0, 6)
    .map((lesson) => {
      const date = new Date(lesson.scheduledAt);
      return {
        id: lesson.id,
        date: toIsoDate(date),
        dayOfWeek: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
        time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        subject: lesson.subject,
        modality: lesson.format === 'OFFLINE' ? 'offline' : 'online',
        price: lesson.rate,
        status:
          lesson.status === 'PLANNED'
            ? 'upcoming'
            : lesson.status === 'COMPLETED'
              ? 'completed'
              : 'cancelled',
        canCancelFree: true,
      };
    });

  const recentLessons = lessons
    .filter((lesson) => new Date(lesson.scheduledAt).getTime() < Date.now())
    .slice(-6)
    .reverse()
    .map((lesson) => {
      const date = new Date(lesson.scheduledAt);
      return {
        id: lesson.id,
        date: toIsoDate(date),
        time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        subject: lesson.subject,
        modality: lesson.format === 'OFFLINE' ? 'offline' : 'online',
        status: lesson.status.toLowerCase(),
        price: lesson.rate,
      };
    });

  const recentPayments = state.payments
    .filter((payment) => payment.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map((payment) => ({
      id: payment.id,
      date: new Date(payment.date).toLocaleDateString('ru-RU'),
      amount: payment.amount,
      method: payment.method,
      status: 'paid' as const,
    }));

  const homework = (state.homeworkByStudent[student.id] || []).map((item) => ({
    id: item.id,
    task: item.task,
    due: item.dueAt ? new Date(item.dueAt).toLocaleDateString('ru-RU') : '',
    done: item.status === 'DONE',
    linkedFiles: (item.linkedFiles || []).map((file) => ({
      id: file.id,
      name: file.name,
      type: 'file' as const,
      extension: file.extension,
      size: file.size,
      cloudUrl: file.cloudUrl,
      parentId: null,
    })),
    studentUploads: item.studentUploads || [],
  }));

  const files = state.filesOverview.files
    .filter((file) => file.sharedWith.includes(student.id))
    .map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      extension: file.extension,
      size: file.size,
      cloudUrl: file.cloudUrl,
      parentId: file.parentId,
      subject: student.subject,
    }));

  const pkg = state.packages.find(
    (item) => item.studentId === student.id && item.status === 'ACTIVE',
  );

  const firstTutorPhone = state.user.phone || '+7 999 000-00-00';

  return {
    studentName: student.name,
    studentPhone: student.phone || '',
    studentEmail: student.email || state.studentAccount.email,
    studentAvatarUrl: student.avatarUrl || null,
    tutorName: state.user.name,
    tutorSlug: state.user.slug,
    tutorPhone: firstTutorPhone,
    tutorWhatsapp: state.user.whatsapp || firstTutorPhone,
    tutorAvatarUrl: state.user.avatarUrl,
    tutorRating: 4.9,
    tutorReviewsCount: 24,
    balance: student.balance,
    ratePerLesson: student.rate,
    package: pkg
      ? {
          subject: pkg.subject,
          used: pkg.lessonsUsed,
          total: pkg.lessonsTotal,
          validUntil: new Date(pkg.validUntil).toLocaleDateString('ru-RU'),
        }
      : null,
    cancelPolicy: {
      freeHours: 24,
      lateCancelAction: '50%',
      noShowAction: '100%',
    },
    preferredPaymentMethod: 'SBP',
    paymentRequisites: state.settings.paymentRequisites,
    paymentRequisitesPreview: state.settings.paymentRequisites,
    paymentCardNumber: state.settings.paymentCardNumber,
    paymentSbpPhone: state.settings.paymentSbpPhone,
    upcomingLessons: upcoming,
    recentLessons,
    recentPayments,
    balanceOperations: recentPayments.map((payment) => ({
      id: `bo_${payment.id}`,
      kind: 'payment' as const,
      direction: 'credit' as const,
      amount: payment.amount,
      title: 'Оплата',
      subtitle: payment.method,
      occurredAt: payment.date,
    })),
    homework,
    files,
    pendingBookings: [],
    paymentUrl: '',
    notifications: {
      telegram: { connected: true },
      max: { connected: false },
    },
  };
}

function markNotificationAsRead(state: MockState, id: string) {
  const target = state.notifications.find((notification) => notification.id === id);
  if (target) {
    target.read = true;
  }
}

function handleAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  if (segments[0] !== 'auth') return false;

  const method = toMethod(req.method);
  const second = segments[1] || '';
  const third = segments[2] || '';

  if (second === 'refresh' && method === 'POST') {
    res.status(200).json({ accessToken: MOCK_ACCESS_TOKEN });
    return true;
  }

  if (second === 'me' && method === 'GET') {
    res.status(200).json({
      ...state.user,
      avatarUrl: state.user.avatarUrl || null,
      aboutText: state.settings.aboutText,
      phone: state.settings.phone,
      whatsapp: state.settings.whatsapp,
      subjects: state.settings.subjects,
    });
    return true;
  }

  if (second === 'login' && method === 'POST') {
    const email = typeof body.email === 'string' && body.email.trim()
      ? body.email.trim().toLowerCase()
      : state.user.email;
    state.user.email = email;
    state.settings.email = email;

    res.status(200).json({
      user: {
        ...state.user,
        avatarUrl: state.user.avatarUrl || null,
      },
      accessToken: MOCK_ACCESS_TOKEN,
    });
    return true;
  }

  if (second === 'logout' && method === 'POST') {
    res.status(200).json({ success: true });
    return true;
  }

  if (second === 'register' && method === 'POST' && !third) {
    const email =
      typeof body.email === 'string' && body.email.trim()
        ? body.email.trim().toLowerCase()
        : 'demo@repeto.local';
    res.status(200).json({
      message: 'Код отправлен',
      email,
      expiresInMinutes: 15,
    });
    return true;
  }

  if (second === 'register' && third === 'verify-code' && method === 'POST') {
    const email =
      typeof body.email === 'string' && body.email.trim()
        ? body.email.trim().toLowerCase()
        : 'demo@repeto.local';
    res.status(200).json({
      verificationToken: 'mock-verification-token',
      email,
      expiresInMinutes: 30,
    });
    return true;
  }

  if (second === 'platform-access' && third === 'start-payment' && method === 'POST') {
    const requestedPlanId = isPlatformPlanId(body.planId)
      ? body.planId
      : state.user.platformAccess.planId;
    const requestedBillingCycle = isPlatformBillingCycle(body.billingCycle)
      ? body.billingCycle
      : state.user.platformAccess.billingCycle;

    const baseAmountRub = resolvePlanPriceRub(requestedPlanId, requestedBillingCycle);

    const sourcePlanId = state.user.platformAccess.planId;
    const sourceBillingCycle = state.user.platformAccess.billingCycle;
    const sourceRank = PLATFORM_PLAN_RANK[sourcePlanId];
    const targetRank = PLATFORM_PLAN_RANK[requestedPlanId];

    const now = new Date();
    const expiresAt = parseDate(state.user.platformAccess.expiresAt);
    const activatedAt = parseDate(state.user.platformAccess.activatedAt);

    let creditAmountRub = 0;
    let remainingDays = 0;

    if (targetRank > sourceRank && expiresAt && expiresAt > now) {
      const remainingMs = expiresAt.getTime() - now.getTime();
      const fallbackPeriodMs =
        sourceBillingCycle === 'year'
          ? 365 * MS_IN_DAY
          : 30 * MS_IN_DAY;

      const fullPeriodMs =
        activatedAt && expiresAt.getTime() > activatedAt.getTime()
          ? expiresAt.getTime() - activatedAt.getTime()
          : fallbackPeriodMs;

      const ratio = Math.max(0, Math.min(1, remainingMs / fullPeriodMs));
      const sourceAmountRub = resolvePlanPriceRub(sourcePlanId, sourceBillingCycle);
      creditAmountRub = Math.max(0, Math.round(sourceAmountRub * ratio));
      remainingDays = Number((remainingMs / MS_IN_DAY).toFixed(1));
    }

    const amountRub = Math.max(0, baseAmountRub - creditAmountRub);

    if (amountRub <= 0) {
      const activatedDate = new Date();
      state.user.platformAccess = {
        status: 'active',
        planId: requestedPlanId,
        billingCycle: requestedBillingCycle,
        activatedAt: activatedDate.toISOString(),
        expiresAt: addDays(
          activatedDate,
          requestedBillingCycle === 'year' ? 365 : 30,
        ).toISOString(),
        amountRub: baseAmountRub,
      };
      state.user.platformAccessState = 'active';

      res.status(200).json({
        requiresPayment: false,
        amountRub,
        baseAmountRub,
        creditAmountRub,
        sourcePlanId,
        sourceBillingCycle,
        remainingDays,
        planId: requestedPlanId,
        billingCycle: requestedBillingCycle,
        user: state.user,
      });
      return true;
    }

    const paymentId = `mock_${requestedPlanId}_${requestedBillingCycle}_${amountRub}_${Date.now()}`;

    res.status(200).json({
      requiresPayment: true,
      amountRub,
      baseAmountRub,
      creditAmountRub,
      sourcePlanId,
      sourceBillingCycle,
      remainingDays,
      planId: requestedPlanId,
      billingCycle: requestedBillingCycle,
      paymentId,
      confirmationUrl: '/dashboard?renew=1',
    });
    return true;
  }

  if (second === 'platform-access' && third === 'complete' && method === 'POST') {
    const paymentId = typeof body.paymentId === 'string' ? body.paymentId : '';
    const matched = paymentId.match(/^mock_(start|profi|center)_(month|year)_(\d+)_/i);

    const planId = matched?.[1] && isPlatformPlanId(matched[1])
      ? matched[1]
      : state.user.platformAccess.planId;
    const billingCycle = matched?.[2] && isPlatformBillingCycle(matched[2])
      ? matched[2]
      : state.user.platformAccess.billingCycle;
    const chargedAmountRub = matched?.[3] ? Number(matched[3]) : resolvePlanPriceRub(planId, billingCycle);
    const baseAmountRub = resolvePlanPriceRub(planId, billingCycle);
    const creditAmountRub = Math.max(0, baseAmountRub - chargedAmountRub);

    const activatedDate = new Date();
    state.user.platformAccess = {
      status: 'active',
      planId,
      billingCycle,
      activatedAt: activatedDate.toISOString(),
      expiresAt: addDays(
        activatedDate,
        billingCycle === 'year' ? 365 : 30,
      ).toISOString(),
      amountRub: baseAmountRub,
    };
    state.user.platformAccessState = 'active';

    res.status(200).json({
      user: state.user,
      amountRub: chargedAmountRub,
      baseAmountRub,
      creditAmountRub,
      planId,
      billingCycle,
    });
    return true;
  }

  if ((second === 'forgot-password' || second === 'reset-password') && method === 'POST') {
    res.status(200).json({ ok: true });
    return true;
  }

  return false;
}

function handleSettingsAndProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  const method = toMethod(req.method);

  if (segments[0] === 'profile') {
    if (segments.length === 1 && method === 'GET') {
      res.status(200).json({
        name: state.user.name,
        email: state.user.email,
        phone: state.settings.phone,
        whatsapp: state.settings.whatsapp,
        aboutText: state.settings.aboutText,
        avatarUrl: state.user.avatarUrl || null,
        subjects: state.settings.subjects,
      });
      return true;
    }

    if (segments[1] === 'stats' && method === 'GET') {
      const activeStudents = state.students.filter((student) => student.status === 'ACTIVE').length;
      const lessonsCount = state.lessons.filter((lesson) => lesson.status === 'COMPLETED').length;
      const paymentsCount = state.payments.length;
      res.status(200).json({ activeStudents, lessonsCount, paymentsCount });
      return true;
    }
  }

  if (segments[0] !== 'settings') return false;

  const second = segments[1] || '';
  const third = segments[2] || '';
  const fourth = segments[3] || '';

  if (!second && method === 'GET') {
    res.status(200).json(state.settings);
    return true;
  }

  if (second === 'account' && method === 'PATCH') {
    const updates = { ...body };

    if (typeof updates.name === 'string') {
      const name = updates.name.trim();
      if (name) {
        state.user.name = name;
        state.settings.name = name;
      }
    }

    if (typeof updates.email === 'string') {
      const email = updates.email.trim().toLowerCase();
      if (email) {
        state.user.email = email;
        state.settings.email = email;
      }
    }

    if (typeof updates.phone === 'string') {
      state.settings.phone = updates.phone;
      state.user.phone = updates.phone;
    }

    if (typeof updates.whatsapp === 'string') {
      state.settings.whatsapp = updates.whatsapp;
      state.user.whatsapp = updates.whatsapp;
    }

    if (typeof updates.aboutText === 'string') {
      state.settings.aboutText = updates.aboutText;
      state.user.aboutText = updates.aboutText;
    }

    if (typeof updates.slug === 'string') {
      const nextSlug = slugify(updates.slug);
      state.settings.slug = nextSlug;
      state.settings.account.slug = nextSlug;
      state.user.slug = nextSlug;
    }

    if (Array.isArray(updates.subjects)) {
      const subjects = updates.subjects
        .map((item) => String(item || '').trim())
        .filter(Boolean);
      if (subjects.length > 0) {
        state.settings.subjects = subjects;
        state.user.subjects = subjects;
      }
    }

    Object.assign(state.settings, updates);
    res.status(200).json(state.settings);
    return true;
  }

  if (second === 'account' && method === 'DELETE') {
    res.status(200).json({ deleted: true });
    return true;
  }

  if (second === 'account' && third === 'slug' && method === 'GET') {
    const requested = slugify(
      queryValue(req, 'value') || queryValue(req, 'name') || state.settings.name,
    );
    const blocked = new Set(['auth', 'dashboard', 'settings', state.user.slug]);
    const isAvailable = !blocked.has(requested);

    res.status(200).json({
      requested,
      isAvailable,
      suggested: isAvailable ? requested : `${requested}-demo`,
    });
    return true;
  }

  if (second === 'avatar' && method === 'POST') {
    const avatarUrl = `/uploads/mock-avatar-${Date.now()}.png`;
    state.user.avatarUrl = avatarUrl;
    res.status(200).json({ avatarUrl });
    return true;
  }

  if (second === 'certificates' && method === 'POST') {
    const title = typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : 'Сертификат';
    const cert: MockCertificate = {
      id: nextId(state, 'certificate'),
      title,
      fileUrl: `/uploads/mock-cert-${Date.now()}.pdf`,
      uploadedAt: new Date().toISOString(),
      verified: false,
      verificationLabel: null,
    };
    state.settings.certificates = [...state.settings.certificates, cert];
    res.status(200).json(cert);
    return true;
  }

  if (second === 'certificates' && third && method === 'DELETE') {
    state.settings.certificates = state.settings.certificates.filter((cert) => cert.id !== third);
    res.status(200).json({ deleted: true });
    return true;
  }

  if (second === 'change-password' && method === 'POST') {
    res.status(200).json({ changed: true });
    return true;
  }

  if (second === 'notifications' && method === 'PATCH') {
    state.settings.notificationSettings = {
      ...state.settings.notificationSettings,
      ...body,
    };
    res.status(200).json(state.settings.notificationSettings);
    return true;
  }

  if (second === 'policies' && method === 'PATCH') {
    state.settings.cancelPolicySettings = {
      ...state.settings.cancelPolicySettings,
      ...body,
    };
    res.status(200).json(state.settings.cancelPolicySettings);
    return true;
  }

  if (second === 'integrations') {
    const integration = third;
    const action = fourth;

    if (integration === 'yukassa' && method === 'POST') {
      res.status(200).json({ connected: true });
      return true;
    }

    if (method === 'DELETE' && integration) {
      if (integration === 'yandex-disk') {
        state.settings.hasYandexDisk = false;
        state.settings.yandexDiskEmail = '';
      }
      if (integration === 'google-drive') {
        state.settings.hasGoogleDrive = false;
        state.settings.googleDriveEmail = '';
      }
      if (integration === 'yandex-calendar') {
        state.settings.hasYandexCalendar = false;
        state.settings.yandexCalendarEmail = '';
      }
      if (integration === 'google-calendar') {
        state.settings.hasGoogleCalendar = false;
        state.settings.googleCalendarEmail = '';
      }
      res.status(200).json({ disconnected: true, integration });
      return true;
    }

    if (method === 'POST' && action === 'start') {
      if (integration === 'yandex-disk') {
        res.status(200).json({ oauthConfigured: false });
        return true;
      }
      res.status(200).json({ oauthConfigured: false });
      return true;
    }

    if (method === 'POST' && (action === 'connect-token' || action === 'complete')) {
      if (integration === 'yandex-disk') {
        state.settings.hasYandexDisk = true;
        state.settings.yandexDiskEmail = 'demo@yandex.ru';
        res.status(200).json({
          connected: true,
          rootPath: state.settings.yandexDiskRootPath,
          email: state.settings.yandexDiskEmail,
          syncedItems: 5,
        });
        return true;
      }

      if (integration === 'google-drive') {
        state.settings.hasGoogleDrive = true;
        state.settings.googleDriveEmail = 'demo@gmail.com';
        res.status(200).json({
          connected: true,
          email: state.settings.googleDriveEmail,
          rootPath: state.settings.googleDriveRootPath,
          syncedItems: 3,
        });
        return true;
      }

      if (integration === 'yandex-calendar') {
        state.settings.hasYandexCalendar = true;
        state.settings.yandexCalendarEmail = 'demo@yandex.ru';
        res.status(200).json({ connected: true, email: state.settings.yandexCalendarEmail });
        return true;
      }

      if (integration === 'google-calendar') {
        state.settings.hasGoogleCalendar = true;
        state.settings.googleCalendarEmail = 'demo@gmail.com';
        res.status(200).json({ connected: true, email: state.settings.googleCalendarEmail });
        return true;
      }
    }

    if (method === 'POST' && action === 'sync') {
      if (integration === 'yandex-disk' || integration === 'google-drive') {
        res.status(200).json({
          connected: true,
          rootPath:
            integration === 'yandex-disk'
              ? state.settings.yandexDiskRootPath
              : state.settings.googleDriveRootPath,
          syncedItems: 4,
          syncedAt: new Date().toISOString(),
        });
        return true;
      }

      res.status(200).json({ synced: 0, errors: 0 });
      return true;
    }

    if (method === 'POST' && action === 'pull') {
      res.status(200).json({ created: 0, updated: 0, cancelled: 0 });
      return true;
    }
  }

  return false;
}

function handleStudents(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  if (segments[0] !== 'students') return false;

  const method = toMethod(req.method);
  const second = segments[1] || '';
  const third = segments[2] || '';
  const fourth = segments[3] || '';

  if (!second) {
    if (method === 'GET') {
      let result = [...state.students];
      const status = queryValue(req, 'status');
      const search = queryValue(req, 'search');
      const sort = queryValue(req, 'sort') || 'name';
      const order = (queryValue(req, 'order') || 'asc').toLowerCase();
      const page = toNumber(queryValue(req, 'page'), 1, 1);
      const limit = toNumber(queryValue(req, 'limit'), 50, 1);

      if (status) {
        const statusUpper = status.toUpperCase();
        result = result.filter((student) => student.status === statusUpper);
      }

      if (search) {
        const needle = search.toLowerCase();
        result = result.filter((student) => {
          const values = [
            student.name,
            student.subject,
            student.phone || '',
            student.email || '',
          ];
          return values.some((value) => value.toLowerCase().includes(needle));
        });
      }

      result.sort((a, b) => {
        const direction = order === 'desc' ? -1 : 1;
        if (sort === 'balance') return (a.balance - b.balance) * direction;
        if (sort === 'rate') return (a.rate - b.rate) * direction;
        return a.name.localeCompare(b.name, 'ru') * direction;
      });

      const payload = paginate(result, page, limit);
      res.status(200).json(payload);
      return true;
    }

    if (method === 'POST') {
      const name =
        typeof body.name === 'string' && body.name.trim()
          ? body.name.trim()
          : 'Новый ученик';
      const subject =
        typeof body.subject === 'string' && body.subject.trim()
          ? body.subject.trim()
          : state.settings.subjects[0] || 'Математика';

      const created: MockStudent = {
        id: `st_${Date.now()}`,
        name,
        subject,
        grade: typeof body.grade === 'string' ? body.grade : '10',
        age: typeof body.age === 'number' ? body.age : null,
        rate: typeof body.rate === 'number' ? body.rate : 2000,
        balance: typeof body.balance === 'number' ? body.balance : 0,
        status: normalizeStatus(body.status),
        phone: typeof body.phone === 'string' ? body.phone : null,
        whatsapp: typeof body.whatsapp === 'string' ? body.whatsapp : null,
        telegram: typeof body.telegram === 'string' ? body.telegram : null,
        parentName: typeof body.parentName === 'string' ? body.parentName : null,
        parentPhone: typeof body.parentPhone === 'string' ? body.parentPhone : null,
        parentWhatsapp:
          typeof body.parentWhatsapp === 'string' ? body.parentWhatsapp : null,
        parentTelegram:
          typeof body.parentTelegram === 'string' ? body.parentTelegram : null,
        parentEmail: typeof body.parentEmail === 'string' ? body.parentEmail : null,
        telegramChatId: null,
        maxChatId: null,
        email: typeof body.email === 'string' ? body.email : null,
        accountId: null,
        notes: typeof body.notes === 'string' ? body.notes : null,
        avatarUrl: null,
      };

      state.students.unshift(created);
      state.notesByStudent[created.id] = [];
      state.homeworkByStudent[created.id] = [];

      res.status(201).json(created);
      return true;
    }
  }

  if (second === 'check-email' && method === 'GET') {
    const email = (queryValue(req, 'email') || '').trim().toLowerCase();
    const existing = state.students.find(
      (student) => String(student.email || '').toLowerCase() === email,
    );

    res.status(200).json({
      exists: Boolean(existing),
      name: existing?.name,
    });
    return true;
  }

  const studentId = second;
  const student = state.students.find((item) => item.id === studentId);

  if (!student) {
    res.status(404).json({ message: 'Student not found' });
    return true;
  }

  if (!third) {
    if (method === 'GET') {
      res.status(200).json(student);
      return true;
    }

    if (method === 'PATCH') {
      if (typeof body.name === 'string') student.name = body.name;
      if (typeof body.subject === 'string') student.subject = body.subject;
      if (typeof body.grade === 'string') student.grade = body.grade;
      if (typeof body.age === 'number' || body.age === null) student.age = body.age as number | null;
      if (typeof body.rate === 'number') student.rate = body.rate;
      if (typeof body.balance === 'number') student.balance = body.balance;
      if (typeof body.status === 'string') student.status = normalizeStatus(body.status, student.status);
      if (typeof body.phone === 'string' || body.phone === null) student.phone = body.phone as string | null;
      if (typeof body.whatsapp === 'string' || body.whatsapp === null) student.whatsapp = body.whatsapp as string | null;
      if (typeof body.telegram === 'string' || body.telegram === null) student.telegram = body.telegram as string | null;
      if (typeof body.parentName === 'string' || body.parentName === null) student.parentName = body.parentName as string | null;
      if (typeof body.parentPhone === 'string' || body.parentPhone === null) student.parentPhone = body.parentPhone as string | null;
      if (typeof body.parentEmail === 'string' || body.parentEmail === null) student.parentEmail = body.parentEmail as string | null;
      if (typeof body.notes === 'string' || body.notes === null) student.notes = body.notes as string | null;
      if (typeof body.email === 'string' || body.email === null) student.email = body.email as string | null;

      res.status(200).json(student);
      return true;
    }

    if (method === 'DELETE') {
      state.students = state.students.filter((item) => item.id !== studentId);
      delete state.notesByStudent[studentId];
      delete state.homeworkByStudent[studentId];
      state.lessons = state.lessons.filter((lesson) => lesson.studentId !== studentId);
      state.payments = state.payments.filter((payment) => payment.studentId !== studentId);
      state.packages = state.packages.filter((pkg) => pkg.studentId !== studentId);
      res.status(200).json({ deleted: true });
      return true;
    }
  }

  if (third === 'activate-account' && method === 'POST') {
    const accountId = student.accountId || `acc_${student.id}`;
    student.accountId = accountId;
    student.email = student.email || `${student.id}@student.local`;
    res.status(200).json({
      accountId,
      email: student.email,
      status: 'ACTIVE',
      invited: true,
    });
    return true;
  }

  if (third === 'unlink-account' && method === 'POST') {
    student.accountId = null;
    res.status(200).json({
      id: student.id,
      accountId: null,
      email: student.email || null,
    });
    return true;
  }

  if (third === 'notes') {
    const notes = state.notesByStudent[studentId] || [];

    if (!fourth && method === 'GET') {
      const limit = toNumber(queryValue(req, 'limit'), 100, 1);
      const sorted = [...notes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const data = sorted.slice(0, limit);
      res.status(200).json({ data, total: sorted.length });
      return true;
    }

    if (!fourth && method === 'POST') {
      const content =
        typeof body.content === 'string' && body.content.trim()
          ? body.content.trim()
          : 'Новая заметка';
      const now = new Date().toISOString();
      const created: MockNote = {
        id: nextId(state, 'note'),
        studentId,
        content,
        createdAt: now,
        updatedAt: now,
        lessonId: typeof body.lessonId === 'string' ? body.lessonId : null,
      };
      notes.unshift(created);
      state.notesByStudent[studentId] = notes;
      res.status(201).json(created);
      return true;
    }

    if (fourth) {
      const note = notes.find((item) => item.id === fourth);
      if (!note) {
        res.status(404).json({ message: 'Note not found' });
        return true;
      }

      if (method === 'PATCH') {
        if (typeof body.content === 'string') {
          note.content = body.content;
          note.updatedAt = new Date().toISOString();
        }
        res.status(200).json(note);
        return true;
      }

      if (method === 'DELETE') {
        state.notesByStudent[studentId] = notes.filter((item) => item.id !== fourth);
        res.status(200).json({ deleted: true });
        return true;
      }
    }
  }

  if (third === 'homework') {
    const homework = state.homeworkByStudent[studentId] || [];

    if (!fourth && method === 'GET') {
      const limit = toNumber(queryValue(req, 'limit'), 100, 1);
      const sorted = [...homework].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const data = sorted.slice(0, limit);
      res.status(200).json({ data, total: sorted.length });
      return true;
    }

    if (!fourth && method === 'POST') {
      const now = new Date().toISOString();
      const fileIds = Array.isArray(body.fileIds)
        ? body.fileIds.map((value) => String(value))
        : [];
      const linkedFiles = state.filesOverview.files
        .filter((file) => fileIds.includes(file.id))
        .map((file) => ({
          id: file.id,
          name: file.name,
          url: file.cloudUrl,
          cloudUrl: file.cloudUrl,
          cloudProvider: file.cloudProvider,
          extension: file.extension,
          size: file.size,
        }));

      const created: MockHomework = {
        id: nextId(state, 'homework'),
        studentId,
        task:
          typeof body.task === 'string' && body.task.trim()
            ? body.task.trim()
            : 'Новая домашняя работа',
        dueAt: typeof body.dueAt === 'string' ? body.dueAt : null,
        status: normalizeHomeworkStatus(body.status),
        createdAt: now,
        updatedAt: now,
        lessonId: typeof body.lessonId === 'string' ? body.lessonId : null,
        linkedFiles,
        studentUploads: [],
      };

      homework.unshift(created);
      state.homeworkByStudent[studentId] = homework;
      res.status(201).json(created);
      return true;
    }

    if (fourth) {
      const current = homework.find((item) => item.id === fourth);
      if (!current) {
        res.status(404).json({ message: 'Homework not found' });
        return true;
      }

      if (method === 'PATCH') {
        if (typeof body.task === 'string') current.task = body.task;
        if (typeof body.dueAt === 'string' || body.dueAt === null) {
          current.dueAt = body.dueAt as string | null;
        }
        if (typeof body.status === 'string') {
          current.status = normalizeHomeworkStatus(body.status);
        }
        if (typeof body.lessonId === 'string' || body.lessonId === null) {
          current.lessonId = body.lessonId as string | null;
        }

        if (Array.isArray(body.fileIds)) {
          const fileIds = body.fileIds.map((value) => String(value));
          current.linkedFiles = state.filesOverview.files
            .filter((file) => fileIds.includes(file.id))
            .map((file) => ({
              id: file.id,
              name: file.name,
              url: file.cloudUrl,
              cloudUrl: file.cloudUrl,
              cloudProvider: file.cloudProvider,
              extension: file.extension,
              size: file.size,
            }));
        }

        current.updatedAt = new Date().toISOString();
        res.status(200).json(current);
        return true;
      }

      if (method === 'DELETE') {
        state.homeworkByStudent[studentId] = homework.filter((item) => item.id !== fourth);
        res.status(200).json({ deleted: true });
        return true;
      }
    }
  }

  return false;
}

function handleLessons(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  if (segments[0] !== 'lessons') return false;

  const method = toMethod(req.method);
  const second = segments[1] || '';
  const third = segments[2] || '';

  if (!second) {
    if (method === 'GET') {
      const from = parseDate(queryValue(req, 'from'));
      const to = parseDate(queryValue(req, 'to'));
      const studentId = queryValue(req, 'studentId');

      const result = state.lessons
        .filter((lesson) => {
          if (studentId && lesson.studentId !== studentId) return false;
          const lessonDate = new Date(lesson.scheduledAt);
          if (from && lessonDate < startOfDay(from)) return false;
          if (to && lessonDate > addDays(startOfDay(to), 1)) return false;
          return true;
        })
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .map((lesson) => mapLessonForResponse(state, lesson));

      res.status(200).json(result);
      return true;
    }

    if (method === 'POST') {
      const studentId = typeof body.studentId === 'string' ? body.studentId : '';
      const student = state.students.find((item) => item.id === studentId);
      if (!student) {
        res.status(400).json({ message: 'studentId is required' });
        return true;
      }

      const scheduledAt =
        typeof body.scheduledAt === 'string' && parseDate(body.scheduledAt)
          ? new Date(body.scheduledAt)
          : new Date();
      const duration = typeof body.duration === 'number' ? Math.max(15, body.duration) : 60;
      const format = String(body.format || 'ONLINE').toUpperCase() === 'OFFLINE'
        ? 'OFFLINE'
        : 'ONLINE';
      const rate = typeof body.rate === 'number' ? body.rate : student.rate;
      const subject =
        typeof body.subject === 'string' && body.subject.trim()
          ? body.subject.trim()
          : student.subject;

      const recurrence =
        body.recurrence && typeof body.recurrence === 'object'
          ? (body.recurrence as JsonObject)
          : null;

      const makeLesson = (date: Date): MockLesson => ({
        id: nextId(state, 'lesson'),
        studentId: student.id,
        subject,
        scheduledAt: date.toISOString(),
        duration,
        format,
        status: 'PLANNED',
        rate,
        notes: typeof body.notes === 'string' ? body.notes : '',
      });

      let created: MockLesson[] = [];
      if (recurrence && recurrence.enabled) {
        const untilRaw = typeof recurrence.until === 'string' ? recurrence.until : undefined;
        const until = parseDate(untilRaw) || addDays(scheduledAt, 21);
        const cursor = new Date(scheduledAt);

        while (cursor <= until && created.length < 16) {
          created.push(makeLesson(new Date(cursor)));
          cursor.setDate(cursor.getDate() + 7);
        }
      } else {
        created = [makeLesson(scheduledAt)];
      }

      state.lessons.push(...created);
      state.lessons.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      const response = created.map((item) => mapLessonForResponse(state, item));
      res.status(201).json(response.length === 1 ? response[0] : response);
      return true;
    }
  }

  const lessonId = second;
  const lesson = state.lessons.find((item) => item.id === lessonId);

  if (!lesson) {
    res.status(404).json({ message: 'Lesson not found' });
    return true;
  }

  if (!third) {
    if (method === 'GET') {
      res.status(200).json(mapLessonForResponse(state, lesson));
      return true;
    }

    if (method === 'PATCH') {
      if (typeof body.subject === 'string') lesson.subject = body.subject;
      if (typeof body.scheduledAt === 'string' && parseDate(body.scheduledAt)) {
        lesson.scheduledAt = new Date(body.scheduledAt).toISOString();
      }
      if (typeof body.duration === 'number') lesson.duration = Math.max(15, body.duration);
      if (typeof body.format === 'string') {
        lesson.format = body.format.toUpperCase() === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';
      }
      if (typeof body.rate === 'number') lesson.rate = body.rate;
      if (typeof body.notes === 'string') lesson.notes = body.notes;

      res.status(200).json(mapLessonForResponse(state, lesson));
      return true;
    }

    if (method === 'DELETE') {
      state.lessons = state.lessons.filter((item) => item.id !== lessonId);
      state.payments.forEach((payment) => {
        if (payment.lessonId === lessonId) {
          payment.lessonId = null;
        }
      });
      Object.keys(state.homeworkByStudent).forEach((studentKey) => {
        state.homeworkByStudent[studentKey] = (state.homeworkByStudent[studentKey] || []).map(
          (homework) =>
            homework.lessonId === lessonId
              ? {
                  ...homework,
                  lessonId: null,
                }
              : homework,
        );
      });
      res.status(200).json({ deleted: true });
      return true;
    }
  }

  if (third === 'status' && method === 'PATCH') {
    lesson.status = normalizeLessonStatus(body.status);
    res.status(200).json(mapLessonForResponse(state, lesson));
    return true;
  }

  return false;
}

function handlePayments(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  if (segments[0] !== 'payments') return false;

  const method = toMethod(req.method);
  const second = segments[1] || '';
  const third = segments[2] || '';

  if (second === 'manual' && third === 'all' && method === 'DELETE') {
    const before = state.payments.length;
    state.payments = state.payments.filter((payment) => Boolean(payment.externalPaymentId));
    const deleted = before - state.payments.length;
    res.status(200).json({ deleted });
    return true;
  }

  if (!second) {
    if (method === 'GET') {
      const status = queryValue(req, 'status');
      const studentId = queryValue(req, 'studentId');
      const methodFilter = queryValue(req, 'method');
      const from = parseDate(queryValue(req, 'from'));
      const to = parseDate(queryValue(req, 'to'));
      const page = toNumber(queryValue(req, 'page'), 1, 1);
      const limit = toNumber(queryValue(req, 'limit'), 50, 1);
      const sort = queryValue(req, 'sort') || 'date';
      const order = (queryValue(req, 'order') || 'desc').toLowerCase();

      let rows = [...state.payments];

      if (status) {
        rows = rows.filter((payment) => payment.status === status.toUpperCase());
      }

      if (studentId) {
        rows = rows.filter((payment) => payment.studentId === studentId);
      }

      if (methodFilter) {
        rows = rows.filter((payment) => payment.method === methodFilter.toUpperCase());
      }

      if (from) {
        rows = rows.filter((payment) => new Date(payment.date) >= startOfDay(from));
      }
      if (to) {
        rows = rows.filter((payment) => new Date(payment.date) <= addDays(startOfDay(to), 1));
      }

      rows.sort((a, b) => {
        const direction = order === 'asc' ? 1 : -1;
        if (sort === 'amount') {
          return (a.amount - b.amount) * direction;
        }
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction;
      });

      const pageData = paginate(rows, page, limit);
      res.status(200).json({
        ...pageData,
        data: pageData.data.map((payment) => mapPaymentForResponse(state, payment)),
      });
      return true;
    }

    if (method === 'POST') {
      const studentId = typeof body.studentId === 'string' ? body.studentId : '';
      if (!state.students.some((student) => student.id === studentId)) {
        res.status(400).json({ message: 'studentId is required' });
        return true;
      }

      const parsedDate = typeof body.date === 'string' ? parseDate(body.date) : null;
      const created: MockPayment = {
        id: nextId(state, 'payment'),
        studentId,
        lessonId: typeof body.lessonId === 'string' ? body.lessonId : null,
        amount: typeof body.amount === 'number' ? body.amount : 0,
        date: (parsedDate || new Date()).toISOString(),
        method: normalizePaymentMethod(body.method),
        status: 'PAID',
        comment: typeof body.comment === 'string' ? body.comment : null,
        externalPaymentId: null,
      };

      state.payments.unshift(created);
      res.status(201).json(mapPaymentForResponse(state, created));
      return true;
    }
  }

  const paymentId = second;
  const payment = state.payments.find((item) => item.id === paymentId);
  if (!payment) {
    res.status(404).json({ message: 'Payment not found' });
    return true;
  }

  if (method === 'PATCH') {
    if (typeof body.studentId === 'string') payment.studentId = body.studentId;
    if (typeof body.lessonId === 'string' || body.lessonId === null) {
      payment.lessonId = body.lessonId as string | null;
    }
    if (typeof body.amount === 'number') payment.amount = body.amount;
    if (typeof body.date === 'string' && parseDate(body.date)) {
      payment.date = new Date(body.date).toISOString();
    }
    if (typeof body.method === 'string') payment.method = normalizePaymentMethod(body.method);
    if (typeof body.comment === 'string' || body.comment === null) {
      payment.comment = body.comment as string | null;
    }

    res.status(200).json(mapPaymentForResponse(state, payment));
    return true;
  }

  if (method === 'DELETE') {
    state.payments = state.payments.filter((item) => item.id !== paymentId);
    res.status(200).json({ deleted: true });
    return true;
  }

  if (method === 'GET') {
    res.status(200).json(mapPaymentForResponse(state, payment));
    return true;
  }

  return false;
}

function handleFinance(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
): boolean {
  if (segments[0] !== 'finance') return false;

  const method = toMethod(req.method);
  if (method !== 'GET') return false;

  const second = segments[1] || '';
  const balances = buildFinanceBalances(state);

  if (second === 'stats') {
    const totalIncome = state.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalDebt = balances
      .filter((row) => row.debt > 0)
      .reduce((sum, row) => sum + row.debt, 0);

    const payload = {
      totalIncome,
      totalPending: totalDebt,
      totalDebt,
      incomeChangePercent: 0,
      pendingChangePercent: 0,
      debtChangePercent: 0,
      previous: {
        totalIncome,
        totalPending: totalDebt,
        totalDebt,
      },
      income: totalIncome,
      previousIncome: totalIncome,
      change: 0,
      lessonsCount: state.lessons.length,
      paymentsCount: state.payments.length,
    };

    res.status(200).json(payload);
    return true;
  }

  if (second === 'summary') {
    const completedLessons = state.lessons.filter((lesson) => lesson.status === 'COMPLETED').length;
    const cancelledLessons = state.lessons.filter(
      (lesson) => lesson.status === 'CANCELLED_STUDENT' || lesson.status === 'CANCELLED_TUTOR',
    ).length;
    const cancellationRate =
      completedLessons + cancelledLessons === 0
        ? 0
        : Math.round((cancelledLessons / (completedLessons + cancelledLessons)) * 100);

    const avgRate = state.lessons.length
      ? Math.round(
          state.lessons.reduce((sum, lesson) => sum + lesson.rate, 0) / state.lessons.length,
        )
      : 0;
    const paymentsCount = state.payments.length;
    const avgPayment = paymentsCount
      ? Math.round(
          state.payments.reduce((sum, payment) => sum + payment.amount, 0) / paymentsCount,
        )
      : 0;

    res.status(200).json({
      completedLessons,
      cancelledLessons,
      cancellationRate,
      avgRate,
      paymentsCount,
      avgPayment,
    });
    return true;
  }

  if (second === 'income-chart') {
    res.status(200).json(seedFinanceChartData);
    return true;
  }

  if (second === 'payment-methods') {
    const base = seedPaymentMethodsData.map((row) => ({ ...row, value: 0 }));
    for (const payment of state.payments) {
      const target = base.find((item) => {
        if (item.name === 'СБП') return payment.method === 'SBP';
        if (item.name === 'Наличные') return payment.method === 'CASH';
        if (item.name === 'Перевод') return payment.method === 'TRANSFER';
        return false;
      });
      if (target) {
        target.value += payment.amount;
      }
    }

    res.status(200).json(base);
    return true;
  }

  if (second === 'balances') {
    const page = toNumber(queryValue(req, 'page'), 1, 1);
    const limit = toNumber(queryValue(req, 'limit'), 50, 1);
    const sort = queryValue(req, 'sort') || 'debt';

    const rows = [...balances];
    rows.sort((a, b) => {
      if (sort === 'paidAmount') return b.paidAmount - a.paidAmount;
      if (sort === 'studentName') return a.studentName.localeCompare(b.studentName, 'ru');
      return b.debt - a.debt;
    });

    const payload = paginate(rows, page, limit);
    res.status(200).json(payload);
    return true;
  }

  if (second === 'income-by-students') {
    const rows = balances
      .map((row) => ({
        studentId: row.studentId,
        studentName: row.studentName,
        studentAccountId: row.studentAccountId,
        subject: row.subject,
        total: row.paidAmount,
      }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json(rows);
    return true;
  }

  return false;
}

function handleDashboard(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
): boolean {
  if (segments[0] !== 'dashboard') return false;

  const method = toMethod(req.method);
  if (method !== 'GET') return false;

  const second = segments[1] || '';
  const balances = buildFinanceBalances(state);

  if (second === 'stats') {
    const now = new Date();
    const activeStudents = state.students.filter((student) => student.status === 'ACTIVE').length;
    const lessonsThisMonth = state.lessons.filter((lesson) => {
      const d = new Date(lesson.scheduledAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    const incomeThisMonth = state.payments
      .filter((payment) => {
        const d = new Date(payment.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, payment) => sum + payment.amount, 0);
    const totalDebt = balances
      .filter((row) => row.debt > 0)
      .reduce((sum, row) => sum + row.debt, 0);

    res.status(200).json({
      activeStudents,
      lessonsThisMonth,
      incomeThisMonth,
      totalDebt,
    });
    return true;
  }

  if (second === 'today-lessons') {
    const today = toIsoDate(new Date());
    const rows = state.lessons
      .filter((lesson) => toIsoDate(new Date(lesson.scheduledAt)) === today)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .map((lesson) => mapLessonForResponse(state, lesson));

    res.status(200).json(rows);
    return true;
  }

  if (second === 'week-lessons') {
    const start = startOfDay(new Date());
    const end = addDays(start, 7);
    const rows = state.lessons
      .filter((lesson) => {
        const date = new Date(lesson.scheduledAt);
        return date >= start && date <= end;
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .map((lesson) => mapLessonForResponse(state, lesson));

    res.status(200).json(rows);
    return true;
  }

  if (second === 'debts') {
    const limit = toNumber(queryValue(req, 'limit'), 5, 1);
    const rows = balances
      .filter((row) => row.debt > 0)
      .sort((a, b) => b.debt - a.debt)
      .slice(0, limit)
      .map((row) => ({
        id: row.studentId,
        name: row.studentName,
        accountId: row.studentAccountId,
        subject: row.subject,
        balance: -Math.abs(row.debt),
        parentEmail: row.parentEmail,
      }));

    res.status(200).json(rows);
    return true;
  }

  if (second === 'recent-payments') {
    const limit = toNumber(queryValue(req, 'limit'), 5, 1);
    const rows = [...state.payments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map((payment) => mapPaymentForResponse(state, payment));

    res.status(200).json(rows);
    return true;
  }

  if (second === 'income-chart') {
    res.status(200).json(buildDashboardIncomeChart(state));
    return true;
  }

  if (second === 'conversion') {
    const now = new Date();
    const monthLessons = state.lessons.filter((lesson) => {
      const date = new Date(lesson.scheduledAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });

    const completedLessons = monthLessons.filter((lesson) => lesson.status === 'COMPLETED');
    const earned = completedLessons.reduce((sum, lesson) => sum + lesson.rate, 0);

    const payments = state.payments.filter((payment) => {
      const date = new Date(payment.date);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });

    const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const conversionPct = earned > 0 ? Math.round((paid / earned) * 100) : 100;

    res.status(200).json({
      completedLessons: completedLessons.length,
      earned,
      paymentsCount: payments.length,
      paid,
      conversionPct,
    });
    return true;
  }

  if (second === 'expiring-packages') {
    const now = Date.now();
    const near = now + 45 * MS_IN_DAY;

    const rows = state.packages
      .filter((pkg) => pkg.status === 'ACTIVE')
      .filter((pkg) => {
        const ts = new Date(pkg.validUntil).getTime();
        return ts >= now - 30 * MS_IN_DAY && ts <= near;
      })
      .sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime())
      .map((pkg) => {
        const student = state.students.find((item) => item.id === pkg.studentId);
        return {
          id: pkg.id,
          student: student
            ? {
                id: student.id,
                name: student.name,
                accountId: student.accountId ?? null,
              }
            : null,
          studentAccountId: student?.accountId ?? null,
          subject: pkg.subject,
          lessonsTotal: pkg.lessonsTotal,
          lessonsUsed: pkg.lessonsUsed,
          validUntil: pkg.validUntil,
        };
      });

    res.status(200).json(rows);
    return true;
  }

  return false;
}

function handleNotifications(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  if (segments[0] !== 'notifications') return false;

  const method = toMethod(req.method);
  const second = segments[1] || '';
  const third = segments[2] || '';

  if (!second && method === 'GET') {
    const page = toNumber(queryValue(req, 'page'), 1, 1);
    const limit = toNumber(queryValue(req, 'limit'), 50, 1);
    const type = queryValue(req, 'type');
    const readRaw = queryValue(req, 'read');

    let rows = [...state.notifications];

    if (type) {
      rows = rows.filter((notification) => notification.type === type.toUpperCase());
    }

    if (readRaw === 'true' || readRaw === 'false') {
      const readValue = readRaw === 'true';
      rows = rows.filter((notification) => notification.read === readValue);
    }

    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const payload = paginate(rows, page, limit);
    res.status(200).json(payload);
    return true;
  }

  if (second === 'unread-count' && method === 'GET') {
    const count = state.notifications.filter((notification) => !notification.read).length;
    res.status(200).json({ count });
    return true;
  }

  if (second === 'read-all' && (method === 'PATCH' || method === 'POST')) {
    state.notifications.forEach((notification) => {
      notification.read = true;
    });
    res.status(200).json({ success: true });
    return true;
  }

  if (second === 'push' && third === 'subscribe' && method === 'POST') {
    res.status(200).json({ ok: true });
    return true;
  }

  if (second === 'push' && third === 'unsubscribe' && method === 'POST') {
    res.status(200).json({ ok: true });
    return true;
  }

  if (second === 'send-debt-reminder' && third && method === 'POST') {
    const student = state.students.find((item) => item.id === third);
    const debt = Math.max(0, -(student?.balance || 0));
    const id = nextId(state, 'notification');
    state.notifications.unshift({
      id,
      type: 'PAYMENT_OVERDUE',
      title: 'Напоминание отправлено',
      message: `Отправлено напоминание ученику ${student?.name || ''}`.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      studentId: third,
      actionLabel: undefined,
      actionUrl: undefined,
      bookingRequestId: undefined,
      lessonId: undefined,
    });
    res.status(200).json({
      sent: true,
      telegram: true,
      max: false,
      debtAmount: debt,
    });
    return true;
  }

  if (second === 'send-reminder' && third && method === 'POST') {
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    const id = nextId(state, 'notification');
    state.notifications.unshift({
      id,
      type: 'SYSTEM',
      title: 'Напоминание отправлено',
      message: comment || 'Напоминание успешно отправлено',
      createdAt: new Date().toISOString(),
      read: false,
      studentId: third,
      actionLabel: undefined,
      actionUrl: undefined,
      bookingRequestId: undefined,
      lessonId: undefined,
    });

    res.status(200).json({
      sent: true,
      telegram: true,
      max: false,
      parentNotified: Boolean(body.notifyParent),
    });
    return true;
  }

  if (second && third === 'read' && (method === 'PATCH' || method === 'POST')) {
    markNotificationAsRead(state, second);
    res.status(200).json({ success: true });
    return true;
  }

  if (
    second &&
    ['confirm-booking', 'reject-booking', 'confirm-reschedule', 'reject-reschedule'].includes(third) &&
    method === 'POST'
  ) {
    markNotificationAsRead(state, second);
    res.status(200).json({ success: true });
    return true;
  }

  return false;
}

function handlePackages(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  if (segments[0] !== 'packages') return false;

  const method = toMethod(req.method);
  const second = segments[1] || '';

  if (!second) {
    if (method === 'GET') {
      const studentId = queryValue(req, 'studentId');
      const status = queryValue(req, 'status');
      const page = toNumber(queryValue(req, 'page'), 1, 1);
      const limit = toNumber(queryValue(req, 'limit'), 50, 1);

      let rows = [...state.packages];
      if (studentId) rows = rows.filter((pkg) => pkg.studentId === studentId);
      if (status) rows = rows.filter((pkg) => pkg.status === status.toUpperCase());

      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const payload = paginate(rows, page, limit);

      res.status(200).json({
        ...payload,
        data: payload.data.map((pkg) => {
          const student = pkg.studentId
            ? state.students.find((item) => item.id === pkg.studentId)
            : undefined;
          return {
            ...pkg,
            studentId: pkg.studentId,
            studentName: student?.name,
            studentAccountId: student?.accountId ?? null,
            student: student
              ? {
                  id: student.id,
                  name: student.name,
                  accountId: student.accountId ?? null,
                  subject: student.subject,
                }
              : undefined,
          };
        }),
      });
      return true;
    }

    if (method === 'POST') {
      const studentId = typeof body.studentId === 'string' ? body.studentId : undefined;
      const student = studentId
        ? state.students.find((item) => item.id === studentId)
        : undefined;
      const lessonsTotal = typeof body.lessonsTotal === 'number' ? Math.max(1, body.lessonsTotal) : 8;
      const totalPrice = typeof body.totalPrice === 'number' ? body.totalPrice : lessonsTotal * (student?.rate || 2000);

      const created: MockPackage = {
        id: nextId(state, 'package'),
        studentId,
        subject:
          typeof body.subject === 'string' && body.subject.trim()
            ? body.subject.trim()
            : student?.subject || 'Пакет занятий',
        lessonsTotal,
        lessonsUsed: 0,
        totalPrice,
        validUntil:
          typeof body.validUntil === 'string' && parseDate(body.validUntil)
            ? new Date(body.validUntil).toISOString()
            : addDays(new Date(), 30).toISOString(),
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
        isPublic: Boolean(body.isPublic),
        comment: typeof body.comment === 'string' ? body.comment : '',
      };

      state.packages.unshift(created);
      res.status(201).json(created);
      return true;
    }
  }

  const pkg = state.packages.find((item) => item.id === second);
  if (!pkg) {
    res.status(404).json({ message: 'Package not found' });
    return true;
  }

  if (method === 'PATCH') {
    if (typeof body.subject === 'string') pkg.subject = body.subject;
    if (typeof body.lessonsTotal === 'number') pkg.lessonsTotal = Math.max(1, body.lessonsTotal);
    if (typeof body.lessonsUsed === 'number') pkg.lessonsUsed = Math.max(0, body.lessonsUsed);
    if (typeof body.totalPrice === 'number') pkg.totalPrice = body.totalPrice;
    if (typeof body.validUntil === 'string' && parseDate(body.validUntil)) {
      pkg.validUntil = new Date(body.validUntil).toISOString();
    }
    if (typeof body.comment === 'string') pkg.comment = body.comment;
    if (typeof body.status === 'string') {
      const status = body.status.toUpperCase();
      if (status === 'ACTIVE' || status === 'COMPLETED' || status === 'EXPIRED') {
        pkg.status = status;
      }
    }
    if (typeof body.isPublic === 'boolean') pkg.isPublic = body.isPublic;

    res.status(200).json(pkg);
    return true;
  }

  if (method === 'DELETE') {
    state.packages = state.packages.filter((item) => item.id !== second);
    res.status(200).json({ deleted: true });
    return true;
  }

  if (method === 'GET') {
    res.status(200).json(pkg);
    return true;
  }

  return false;
}

function handleFiles(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  if (segments[0] !== 'files') return false;

  const method = toMethod(req.method);
  const second = segments[1] || '';
  const third = segments[2] || '';
  const fourth = segments[3] || '';

  if (!second && method === 'GET') {
    state.filesOverview.studentAccess = buildStudentAccessEntries(
      state.filesOverview.files,
      state.students,
    );
    res.status(200).json(state.filesOverview);
    return true;
  }

  if (second === 'yandex-disk' || second === 'google-drive') {
    if (third === 'sync' && method === 'POST') {
      const connectedKey = second === 'yandex-disk' ? 'hasYandexDisk' : 'hasGoogleDrive';
      const rootKey = second === 'yandex-disk' ? 'yandexDiskRootPath' : 'googleDriveRootPath';
      const emailKey = second === 'yandex-disk' ? 'yandexDiskEmail' : 'googleDriveEmail';

      res.status(200).json({
        connected: Boolean(state.settings[connectedKey]),
        rootPath: String(state.settings[rootKey] || '/Repeto'),
        syncedItems: 3,
        restoredShares: 0,
        removedItems: 0,
        scope: 'root',
        syncedAt: new Date().toISOString(),
        email: state.settings[emailKey],
      });
      return true;
    }

    if (third === 'sync-folder' && fourth && method === 'POST') {
      res.status(200).json({
        connected: true,
        rootPath: '/Repeto',
        syncedItems: 2,
        restoredShares: 0,
        removedItems: 0,
        scope: 'folder',
        folderId: fourth,
        syncedAt: new Date().toISOString(),
      });
      return true;
    }
  }

  const fileId = second;
  const file = state.filesOverview.files.find((item) => item.id === fileId);
  if (!file) {
    res.status(404).json({ message: 'File not found' });
    return true;
  }

  if (third === 'share' && method === 'PATCH') {
    const studentIds = Array.isArray(body.studentIds)
      ? body.studentIds.map((value) => String(value))
      : [];

    file.sharedWith = studentIds;

    if (body.applyToChildren && file.type === 'folder') {
      state.filesOverview.files.forEach((item) => {
        if (item.parentId === file.id) {
          item.sharedWith = studentIds;
        }
      });
    }

    state.filesOverview.studentAccess = buildStudentAccessEntries(
      state.filesOverview.files,
      state.students,
    );

    res.status(200).json({ success: true });
    return true;
  }

  return false;
}

function handleAvailability(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  if (segments[0] !== 'availability') return false;

  const method = toMethod(req.method);
  const second = segments[1] || '';
  const third = segments[2] || '';

  if (!second) {
    if (method === 'GET') {
      res.status(200).json(state.availabilitySlots);
      return true;
    }

    if (method === 'PUT') {
      const slotsRaw = Array.isArray(body.slots) ? body.slots : [];
      state.availabilitySlots = slotsRaw
        .map((slot) => {
          if (!slot || typeof slot !== 'object') return null;
          const entity = slot as JsonObject;
          const dayOfWeek = Number(entity.dayOfWeek);
          const startTime = typeof entity.startTime === 'string' ? entity.startTime : '';
          const endTime = typeof entity.endTime === 'string' ? entity.endTime : '';
          if (!Number.isFinite(dayOfWeek) || !startTime || !endTime) return null;
          return {
            id: nextId(state, 'lesson'),
            dayOfWeek,
            startTime,
            endTime,
          } as MockAvailabilitySlot;
        })
        .filter((item): item is MockAvailabilitySlot => Boolean(item));

      res.status(200).json(state.availabilitySlots);
      return true;
    }
  }

  if (second === 'overrides') {
    if (!third && method === 'GET') {
      const sorted = [...state.availabilityOverrides].sort((a, b) => a.date.localeCompare(b.date));
      res.status(200).json(sorted);
      return true;
    }

    if (third && method === 'PUT') {
      const date = third;
      const isBlocked = Boolean(body.isBlocked);
      const slotsRaw = Array.isArray(body.slots) ? body.slots : [];
      const slots = slotsRaw
        .map((slot) => {
          if (!slot || typeof slot !== 'object') return null;
          const entity = slot as JsonObject;
          const startTime = typeof entity.startTime === 'string' ? entity.startTime : '';
          const endTime = typeof entity.endTime === 'string' ? entity.endTime : '';
          if (!startTime || !endTime) return null;
          return { startTime, endTime };
        })
        .filter((item): item is { startTime: string; endTime: string } => Boolean(item));

      const existing = state.availabilityOverrides.find((item) => item.date === date);
      if (existing) {
        existing.isBlocked = isBlocked;
        existing.slots = slots;
      } else {
        state.availabilityOverrides.push({ date, isBlocked, slots });
      }

      res.status(200).json(state.availabilityOverrides);
      return true;
    }

    if (third && method === 'DELETE') {
      state.availabilityOverrides = state.availabilityOverrides.filter((item) => item.date !== third);
      res.status(200).json(state.availabilityOverrides);
      return true;
    }
  }

  return false;
}

function stripPhone(value: string | null | undefined): string {
  return String(value || '').replace(/\D/g, '');
}

function slotDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map((value) => Number(value));
  const [endHour, endMinute] = endTime.split(':').map((value) => Number(value));
  if (!Number.isFinite(startHour) || !Number.isFinite(startMinute)) return 60;
  if (!Number.isFinite(endHour) || !Number.isFinite(endMinute)) return 60;
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const diff = end - start;
  return diff > 0 ? diff : 60;
}

function buildPublicSlots(state: MockState): Array<{ date: string; time: string; duration: number }> {
  const overrideMap = new Map<string, MockAvailabilityOverride>();
  for (const override of state.availabilityOverrides) {
    overrideMap.set(override.date, override);
  }

  const result: Array<{ date: string; time: string; duration: number }> = [];
  const today = startOfDay(new Date());

  for (let offset = 0; offset < 21; offset += 1) {
    const date = addDays(today, offset);
    const dateKey = toIsoDate(date);
    const dayOfWeek = (date.getDay() + 6) % 7;

    let daySlots = state.availabilitySlots
      .filter((slot) => slot.dayOfWeek === dayOfWeek)
      .map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));

    const override = overrideMap.get(dateKey);
    if (override) {
      if (override.isBlocked) {
        const blocked = new Set(
          override.slots.map((slot) => `${slot.startTime}-${slot.endTime}`),
        );
        daySlots = daySlots.filter(
          (slot) => !blocked.has(`${slot.startTime}-${slot.endTime}`),
        );
      } else if (override.slots.length > 0) {
        daySlots = [...override.slots];
      }
    }

    for (const slot of daySlots) {
      result.push({
        date: dateKey,
        time: slot.startTime,
        duration: slotDurationMinutes(slot.startTime, slot.endTime),
      });
    }
  }

  return result;
}

function buildPublicTutorProfile(state: MockState, slug: string): JsonObject {
  const lessonsCount = state.lessons.filter((lesson) => lesson.status === 'COMPLETED').length;
  const reviews = state.lessons
    .filter((lesson) => lesson.status === 'COMPLETED')
    .slice(-6)
    .reverse()
    .map((lesson) => {
      const student = state.students.find((item) => item.id === lesson.studentId);
      return {
        studentName: student?.name || 'Ученик',
        rating: 5,
        feedback: 'Отличное занятие, материал понятен и структурирован.',
        date: lesson.scheduledAt,
      };
    });

  const subjects =
    state.settings.subjectDetails.length > 0
      ? state.settings.subjectDetails.map((item) => ({
          name: item.name,
          duration: 60,
          price:
            typeof item.rate === 'number'
              ? item.rate
              : state.students.find((student) => student.subject === item.name)?.rate || 2000,
        }))
      : state.settings.subjects.map((name) => ({
          name,
          duration: 60,
          price: state.students.find((student) => student.subject === name)?.rate || 2000,
        }));

  const publicPackages = state.packages
    .filter((pkg) => pkg.status === 'ACTIVE')
    .slice(0, 5)
    .map((pkg) => ({
      id: pkg.id,
      subject: pkg.subject,
      lessonsTotal: pkg.lessonsTotal,
      totalPrice: pkg.totalPrice,
      pricePerLesson: Math.round(pkg.totalPrice / Math.max(1, pkg.lessonsTotal)),
      validUntil: pkg.validUntil,
      comment: pkg.comment || null,
    }));

  return {
    name: state.user.name,
    slug,
    tagline: state.settings.tagline,
    subjects,
    aboutText: state.settings.aboutText || state.user.aboutText || null,
    avatarUrl: state.user.avatarUrl || null,
    lessonsCount,
    rating: 4.9,
    reviewsCount: reviews.length,
    reviews,
    contacts: {
      phone: state.user.phone || null,
      whatsapp: state.user.whatsapp || null,
      email: state.user.email,
      vk: state.settings.vk || null,
      telegram: '@repeto_demo',
      max: '@repeto_max',
      website: state.settings.website || null,
    },
    cancelPolicy: {
      freeHours: Number(state.settings.cancelPolicySettings.freeHours || 24),
      lateCancelAction: String(state.settings.cancelPolicySettings.lateCancelAction || '50%'),
      noShowAction: String(state.settings.cancelPolicySettings.noShowAction || '100%'),
    },
    preferredPaymentMethod: 'SBP',
    memberSince: addDays(new Date(), -460).toISOString(),
    hasWorkingDays: true,
    showPublicPackages: state.settings.showPublicPackages,
    publicPackages,
    education: state.settings.education,
    experience: state.settings.experience,
    experienceLines: [
      {
        id: 'exp_1',
        text: 'Подготовка к экзаменам и олимпиадам, индивидуальная стратегия обучения.',
        verified: true,
        verificationLabel: 'Подтверждено',
      },
    ],
    qualificationVerified: state.settings.qualificationVerified,
    qualificationLabel: state.settings.qualificationVerified ? 'Верифицирован' : null,
    certificates: state.settings.certificates,
  };
}

function handlePublicAndStudent(
  req: NextApiRequest,
  res: NextApiResponse,
  state: MockState,
  segments: string[],
  body: JsonObject,
): boolean {
  const method = toMethod(req.method);

  if (segments[0] === 'public' && segments[1] === 'bot-info' && method === 'GET') {
    res.status(200).json({
      telegram: {
        configured: true,
        username: 'repeto_demo_bot',
      },
      max: {
        configured: true,
        name: 'Repeto Max',
        username: 'repeto_max_bot',
      },
    });
    return true;
  }

  if (segments[0] === 'public' && segments[1] === 'tutors') {
    const slug = decodeURIComponent(segments[2] || state.user.slug);
    const fourth = segments[3] || '';

    if (!fourth && method === 'GET') {
      res.status(200).json(buildPublicTutorProfile(state, slug));
      return true;
    }

    if (fourth === 'slots' && method === 'GET') {
      res.status(200).json(buildPublicSlots(state));
      return true;
    }

    if (fourth === 'contact-status' && method === 'GET') {
      const phone = stripPhone(queryValue(req, 'phone'));
      const email = String(queryValue(req, 'email') || '').trim().toLowerCase();
      const matched = state.students.find((student) => {
        const phoneMatches =
          phone.length >= 10 &&
          [student.phone, student.parentPhone, student.whatsapp]
            .map((value) => stripPhone(value))
            .includes(phone);

        const emailMatches =
          email.includes('@') &&
          [student.email, student.parentEmail]
            .map((value) => String(value || '').trim().toLowerCase())
            .includes(email);

        return phoneMatches || emailMatches;
      });

      res.status(200).json({
        found: Boolean(matched),
        telegramConnected: Boolean(matched?.accountId || matched?.telegram),
        maxConnected: Boolean(matched?.accountId || matched?.maxChatId),
        emailKnown: Boolean(matched?.email || matched?.parentEmail),
        hasAccount: Boolean(matched?.accountId),
      });
      return true;
    }

    if (fourth === 'book' && method === 'POST') {
      const bookingId = `booking_${Date.now()}`;
      state.notifications.unshift({
        id: nextId(state, 'notification'),
        type: 'BOOKING_NEW',
        title: 'Новая заявка',
        message: 'Получена новая заявка с публичной страницы.',
        createdAt: new Date().toISOString(),
        read: false,
        bookingRequestId: bookingId,
      });
      res.status(200).json({
        id: bookingId,
        otpSent: true,
        bookingRequestId: bookingId,
      });
      return true;
    }

    if (fourth === 'verify-booking-email' && method === 'POST') {
      res.status(200).json({
        accessToken: MOCK_STUDENT_ACCESS_TOKEN,
        refreshToken: MOCK_STUDENT_REFRESH_TOKEN,
        account: state.studentAccount,
        studentId: state.studentPortalStudentId,
      });
      return true;
    }
  }

  if (segments[0] === 'student-auth') {
    const second = segments[1] || '';

    if (second === 'request-otp' && method === 'POST') {
      const email =
        typeof body.email === 'string' && body.email.trim()
          ? body.email.trim().toLowerCase()
          : state.studentAccount.email;
      state.studentAccount.email = email;
      res.status(200).json({ email, expiresInMinutes: 10, cooldown: false });
      return true;
    }

    if (second === 'verify-otp' && method === 'POST') {
      res.status(200).json({
        accessToken: MOCK_STUDENT_ACCESS_TOKEN,
        refreshToken: MOCK_STUDENT_REFRESH_TOKEN,
        account: state.studentAccount,
        needsSetup: false,
      });
      return true;
    }

    if (second === 'refresh' && method === 'POST') {
      res.status(200).json({ accessToken: MOCK_STUDENT_ACCESS_TOKEN });
      return true;
    }

    if (second === 'logout' && method === 'POST') {
      res.status(200).json({ success: true });
      return true;
    }
  }

  if (segments[0] === 'student-portal') {
    const second = segments[1] || '';
    const third = segments[2] || '';
    const fourth = segments[3] || '';
    const fifth = segments[4] || '';
    const sixth = segments[5] || '';

    if (second === 'setup' && method === 'GET') {
      const student = state.students.find((item) => item.id === state.studentPortalStudentId);
      res.status(200).json({
        name: student?.name || state.studentAccount.name,
        email: state.studentAccount.email,
        phone: student?.phone || '',
        age: student?.age || null,
        grade: student?.grade || '',
        parentName: student?.parentName || '',
        parentPhone: student?.parentPhone || '',
        parentEmail: student?.parentEmail || '',
      });
      return true;
    }

    if (second === 'profile' && method === 'PATCH') {
      const student = state.students.find((item) => item.id === state.studentPortalStudentId);
      if (student) {
        if (typeof body.name === 'string') student.name = body.name;
        if (typeof body.phone === 'string' || body.phone === null) {
          student.phone = body.phone as string | null;
        }
        if (typeof body.grade === 'string' || body.grade === null) {
          student.grade = (body.grade as string | null) || '';
        }
        if (typeof body.age === 'number' || body.age === null) {
          student.age = body.age as number | null;
        }
        if (typeof body.parentName === 'string' || body.parentName === null) {
          student.parentName = body.parentName as string | null;
        }
        if (typeof body.parentPhone === 'string' || body.parentPhone === null) {
          student.parentPhone = body.parentPhone as string | null;
        }
        if (typeof body.parentEmail === 'string' || body.parentEmail === null) {
          student.parentEmail = body.parentEmail as string | null;
        }
      }
      res.status(200).json({ saved: true });
      return true;
    }

    if (second === 'avatar' && method === 'POST') {
      const student = state.students.find((item) => item.id === state.studentPortalStudentId);
      const avatarUrl = `/uploads/student-avatar-${Date.now()}.png`;
      if (student) {
        student.avatarUrl = avatarUrl;
      }
      res.status(200).json({ avatarUrl });
      return true;
    }

    if (second === 'tutors' && method === 'GET') {
      const student = state.students.find((item) => item.id === state.studentPortalStudentId);
      res.status(200).json([
        {
          studentId: student?.id || state.studentPortalStudentId,
          tutorId: state.user.id,
          tutorName: state.user.name,
          tutorSlug: state.user.slug,
          tutorAvatarUrl: state.user.avatarUrl || null,
          subject: student?.subject || state.settings.subjects[0],
          status: 'active',
        },
      ]);
      return true;
    }

    if (second === 'students' && third && fourth === 'data' && method === 'GET') {
      const payload = resolvePortalData(state, third);
      if (!payload) {
        res.status(404).json({ message: 'Student not found' });
        return true;
      }
      res.status(200).json(payload);
      return true;
    }

    if (second === 'students' && third && fourth === 'profile' && method === 'PATCH') {
      const student = state.students.find((item) => item.id === third);
      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return true;
      }

      if (typeof body.name === 'string') student.name = body.name;
      if (typeof body.phone === 'string' || body.phone === null) {
        student.phone = body.phone as string | null;
      }
      if (typeof body.grade === 'string' || body.grade === null) {
        student.grade = (body.grade as string | null) || '';
      }
      if (typeof body.age === 'number' || body.age === null) {
        student.age = body.age as number | null;
      }
      if (typeof body.parentName === 'string' || body.parentName === null) {
        student.parentName = body.parentName as string | null;
      }
      if (typeof body.parentPhone === 'string' || body.parentPhone === null) {
        student.parentPhone = body.parentPhone as string | null;
      }
      if (typeof body.parentEmail === 'string' || body.parentEmail === null) {
        student.parentEmail = body.parentEmail as string | null;
      }

      res.status(200).json({ updated: true });
      return true;
    }

    if (second === 'students' && third && fourth === 'homework' && fifth) {
      const homeworkRows = state.homeworkByStudent[third] || [];
      const homework = homeworkRows.find((item) => item.id === fifth);
      if (!homework) {
        res.status(404).json({ message: 'Homework not found' });
        return true;
      }

      if (method === 'PATCH') {
        if (typeof body.done === 'boolean') {
          homework.status = body.done ? 'DONE' : 'NOT_DONE';
        }
        if (typeof body.status === 'string') {
          homework.status = normalizeHomeworkStatus(body.status);
        }
        homework.updatedAt = new Date().toISOString();
        res.status(200).json({ updated: true });
        return true;
      }

      if (sixth === 'upload' && method === 'POST') {
        const upload = {
          id: `upload_${Date.now()}`,
          name: 'student-upload.png',
          size: '0.8 MB',
          uploadedAt: new Date().toISOString(),
          expiresAt: addDays(new Date(), 30).toISOString(),
          url: '/uploads/student-upload.png',
        };
        homework.studentUploads = [...(homework.studentUploads || []), upload];
        res.status(200).json(upload);
        return true;
      }
    }

    if (second === 'students' && third && fourth === 'lessons' && fifth && sixth === 'cancel' && method === 'POST') {
      const lesson = state.lessons.find((item) => item.id === fifth && item.studentId === third);
      if (lesson) {
        lesson.status = 'CANCELLED_STUDENT';
      }
      res.status(200).json({ cancelled: true });
      return true;
    }

    if (
      second === 'students' &&
      third &&
      fourth === 'lessons' &&
      fifth &&
      sixth === 'reschedule' &&
      method === 'POST'
    ) {
      res.status(200).json({ requested: true });
      return true;
    }

    if (
      second === 'students' &&
      third &&
      fourth === 'lessons' &&
      fifth &&
      sixth === 'feedback' &&
      method === 'POST'
    ) {
      const lesson = state.lessons.find((item) => item.id === fifth && item.studentId === third);
      if (lesson && typeof body.feedback === 'string') {
        lesson.notes = body.feedback;
      }
      res.status(200).json({ saved: true });
      return true;
    }

    if (
      second === 'students' &&
      third &&
      fourth === 'pending-bookings' &&
      fifth &&
      sixth === 'cancel' &&
      method === 'POST'
    ) {
      res.status(200).json({ cancelled: true });
      return true;
    }

    if (
      second === 'students' &&
      third &&
      fourth === 'pending-bookings' &&
      fifth &&
      sixth === 'reschedule' &&
      method === 'POST'
    ) {
      res.status(200).json({ requested: true });
      return true;
    }
  }

  return false;
}

export async function handleMockApiRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  rawSegments: string[],
): Promise<void> {
  const state = getState();
  const segments = rawSegments.map((segment) => decodeURIComponent(String(segment || '')));
  const method = toMethod(req.method);

  if (method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const body = await readJsonBody(req);

  const handlers = [
    handleAuth,
    handleSettingsAndProfile,
    handleStudents,
    handleLessons,
    handlePayments,
    handleFinance,
    handleDashboard,
    handleNotifications,
    handlePackages,
    handleFiles,
    handleAvailability,
    handlePublicAndStudent,
  ];

  for (const handler of handlers) {
    const handled = handler(req, res, state, segments, body);
    if (handled) {
      return;
    }
  }

  const path = `/${segments.join('/')}`;
  if (method === 'GET') {
    res.status(200).json({});
    return;
  }

  res.status(200).json({ ok: true, mock: true, path, method });
}
