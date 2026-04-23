import {
  BookingStatus,
  CloudProvider,
  FileType,
  HomeworkStatus,
  LessonFormat,
  LessonStatus,
  NotificationType,
  PackageStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  ReceiptStatus,
  Student,
  StudentAccount,
  StudentAccountStatus,
  StudentStatus,
  TaxStatus,
  User,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'DemoPass123!';
const DAY_MS = 24 * 60 * 60 * 1000;

type JsonRecord = Record<string, unknown>;

interface TutorSeed {
  key: string;
  email: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  slug?: string | null;
  published: boolean;
  showPublicPackages: boolean;
  timezone: string;
  avatarUrl?: string | null;
  subjects: string[];
  subjectDetails?: Array<{ name: string; duration: number; price: number }> | null;
  aboutText?: string | null;
  tagline?: string | null;
  website?: string | null;
  vk?: string | null;
  format?: string | null;
  offlineAddress?: string | null;
  education?: unknown;
  experience?: string | null;
  qualificationVerified: boolean;
  qualificationLabel?: string | null;
  certificates?: unknown;
  lessonsCount: number;
  rating: string | null;
  taxStatus: TaxStatus;
  notificationSettings?: JsonRecord | null;
  cancelPolicySettings?: JsonRecord | null;
  paymentSettings?: JsonRecord | null;
  googleCalendarEmail?: string | null;
  yandexCalendarEmail?: string | null;
  yandexCalendarLogin?: string | null;
  yandexDiskEmail?: string | null;
  yandexDiskRootPath?: string | null;
  googleDriveEmail?: string | null;
  googleDriveRootPath?: string | null;
  homeworkDefaultCloud: CloudProvider;
}

interface StudentAccountSeed {
  key: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  status: StudentAccountStatus;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
}

interface StudentSeed {
  key: string;
  tutorKey: string;
  accountKey?: string;
  name: string;
  subject: string;
  grade?: string | null;
  age?: number | null;
  rate: number;
  status: StudentStatus;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  email?: string | null;
  telegramChatId?: string | null;
  maxChatId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentWhatsapp?: string | null;
  parentTelegram?: string | null;
  parentEmail?: string | null;
  notes?: string | null;
}

interface LessonPattern {
  tutorKey: string;
  studentKey: string;
  subject: string;
  duration: number;
  format: LessonFormat;
  intervalDays: number;
  startOffsetDays: number;
  endOffsetDays: number;
  hour: number;
  minute: number;
  location?: string | null;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isTruthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function ensureProductionSeedIsAllowed(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowed = isTruthy(process.env.ALLOW_PRODUCTION_DEMO_SEED);

  if (isProduction && !allowed) {
    throw new Error('Refusing to seed demo data in production without ALLOW_PRODUCTION_DEMO_SEED=true.');
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function setUtcTime(base: Date, hour: number, minute: number): Date {
  const next = new Date(base);
  next.setUTCHours(hour, minute, 0, 0);
  return next;
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(amount);
}

function fallbackMessage(value: string | null | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

async function upsertTutor(seed: TutorSeed, passwordHash: string): Promise<User> {
  const ratingValue = seed.rating ? new Prisma.Decimal(seed.rating) : null;

  const createData: Prisma.UserCreateInput = {
    email: seed.email,
    passwordHash,
    name: seed.name,
    phone: seed.phone ?? null,
    whatsapp: seed.whatsapp ?? null,
    slug: seed.slug ?? null,
    published: seed.published,
    showPublicPackages: seed.showPublicPackages,
    timezone: seed.timezone,
    avatarUrl: seed.avatarUrl ?? null,
    subjects: seed.subjects,
    subjectDetails: seed.subjectDetails ? toJsonValue(seed.subjectDetails) : Prisma.DbNull,
    aboutText: seed.aboutText ?? null,
    tagline: seed.tagline ?? null,
    website: seed.website ?? null,
    vk: seed.vk ?? null,
    format: seed.format ?? null,
    offlineAddress: seed.offlineAddress ?? null,
    education: seed.education ? toJsonValue(seed.education) : Prisma.DbNull,
    experience: null,
    qualificationVerified: seed.qualificationVerified,
    qualificationLabel: seed.qualificationLabel ?? null,
    certificates: seed.certificates ? toJsonValue(seed.certificates) : Prisma.DbNull,
    lessonsCount: seed.lessonsCount,
    rating: ratingValue,
    taxStatus: seed.taxStatus,
    notificationSettings: seed.notificationSettings ? toJsonValue(seed.notificationSettings) : Prisma.DbNull,
    cancelPolicySettings: seed.cancelPolicySettings ? toJsonValue(seed.cancelPolicySettings) : Prisma.DbNull,
    paymentSettings: seed.paymentSettings ? toJsonValue(seed.paymentSettings) : Prisma.DbNull,
    googleCalendarEmail: seed.googleCalendarEmail ?? null,
    yandexCalendarEmail: seed.yandexCalendarEmail ?? null,
    yandexCalendarLogin: seed.yandexCalendarLogin ?? null,
    yandexDiskEmail: seed.yandexDiskEmail ?? null,
    yandexDiskRootPath: seed.yandexDiskRootPath ?? null,
    googleDriveEmail: seed.googleDriveEmail ?? null,
    googleDriveRootPath: seed.googleDriveRootPath ?? null,
    homeworkDefaultCloud: seed.homeworkDefaultCloud,
  };

  const updateData: Prisma.UserUpdateInput = {
    passwordHash,
    name: seed.name,
    phone: seed.phone ?? null,
    whatsapp: seed.whatsapp ?? null,
    slug: seed.slug ?? null,
    published: seed.published,
    showPublicPackages: seed.showPublicPackages,
    timezone: seed.timezone,
    avatarUrl: seed.avatarUrl ?? null,
    subjects: seed.subjects,
    subjectDetails: seed.subjectDetails ? toJsonValue(seed.subjectDetails) : Prisma.DbNull,
    aboutText: seed.aboutText ?? null,
    tagline: seed.tagline ?? null,
    website: seed.website ?? null,
    vk: seed.vk ?? null,
    format: seed.format ?? null,
    offlineAddress: seed.offlineAddress ?? null,
    education: seed.education ? toJsonValue(seed.education) : Prisma.DbNull,
    experience: null,
    qualificationVerified: seed.qualificationVerified,
    qualificationLabel: seed.qualificationLabel ?? null,
    certificates: seed.certificates ? toJsonValue(seed.certificates) : Prisma.DbNull,
    lessonsCount: seed.lessonsCount,
    rating: ratingValue,
    taxStatus: seed.taxStatus,
    notificationSettings: seed.notificationSettings ? toJsonValue(seed.notificationSettings) : Prisma.DbNull,
    cancelPolicySettings: seed.cancelPolicySettings ? toJsonValue(seed.cancelPolicySettings) : Prisma.DbNull,
    paymentSettings: seed.paymentSettings ? toJsonValue(seed.paymentSettings) : Prisma.DbNull,
    googleCalendarEmail: seed.googleCalendarEmail ?? null,
    yandexCalendarEmail: seed.yandexCalendarEmail ?? null,
    yandexCalendarLogin: seed.yandexCalendarLogin ?? null,
    yandexDiskEmail: seed.yandexDiskEmail ?? null,
    yandexDiskRootPath: seed.yandexDiskRootPath ?? null,
    googleDriveEmail: seed.googleDriveEmail ?? null,
    googleDriveRootPath: seed.googleDriveRootPath ?? null,
    homeworkDefaultCloud: seed.homeworkDefaultCloud,
  };

  return prisma.user.upsert({
    where: { email: seed.email },
    create: createData,
    update: updateData,
  });
}

async function upsertStudentAccount(seed: StudentAccountSeed): Promise<StudentAccount> {
  return prisma.studentAccount.upsert({
    where: { email: seed.email },
    create: {
      email: seed.email,
      name: seed.name,
      avatarUrl: seed.avatarUrl ?? null,
      status: seed.status,
      emailVerifiedAt: seed.emailVerifiedAt ?? null,
      lastLoginAt: seed.lastLoginAt ?? null,
    },
    update: {
      name: seed.name,
      avatarUrl: seed.avatarUrl ?? null,
      status: seed.status,
      emailVerifiedAt: seed.emailVerifiedAt ?? null,
      lastLoginAt: seed.lastLoginAt ?? null,
    },
  });
}

async function resetDemoScope(tutorIds: string[], accountIds: string[]): Promise<void> {
  const existingStudents = await prisma.student.findMany({
    where: { userId: { in: tutorIds } },
    select: { id: true },
  });
  const studentIds = existingStudents.map((item) => item.id);

  const existingFiles = await prisma.fileRecord.findMany({
    where: { userId: { in: tutorIds } },
    select: { id: true },
  });
  const fileIds = existingFiles.map((item) => item.id);

  const existingHomework = studentIds.length
    ? await prisma.homework.findMany({
        where: { studentId: { in: studentIds } },
        select: { id: true },
      })
    : [];
  const homeworkIds = existingHomework.map((item) => item.id);

  await prisma.studentRefreshToken.deleteMany({ where: { accountId: { in: accountIds } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: tutorIds } } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: tutorIds } } });

  await prisma.notification.deleteMany({ where: { userId: { in: tutorIds } } });
  await prisma.bookingRequest.deleteMany({ where: { userId: { in: tutorIds } } });
  await prisma.availabilityOverride.deleteMany({ where: { userId: { in: tutorIds } } });
  await prisma.tutorAvailability.deleteMany({ where: { userId: { in: tutorIds } } });

  if (homeworkIds.length > 0) {
    await prisma.homeworkMaterial.deleteMany({ where: { homeworkId: { in: homeworkIds } } });
  }

  if (fileIds.length > 0) {
    await prisma.homeworkMaterial.deleteMany({ where: { fileId: { in: fileIds } } });
  }

  const fileShareOr: Prisma.FileShareWhereInput[] = [];
  if (studentIds.length > 0) {
    fileShareOr.push({ studentId: { in: studentIds } });
  }
  if (fileIds.length > 0) {
    fileShareOr.push({ fileId: { in: fileIds } });
  }
  if (fileShareOr.length > 0) {
    await prisma.fileShare.deleteMany({ where: { OR: fileShareOr } });
  }

  await prisma.payment.deleteMany({ where: { userId: { in: tutorIds } } });
  await prisma.package.deleteMany({ where: { userId: { in: tutorIds } } });
  await prisma.lesson.deleteMany({ where: { userId: { in: tutorIds } } });

  if (studentIds.length > 0) {
    await prisma.homework.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.lessonNote.deleteMany({ where: { studentId: { in: studentIds } } });
  }

  if (fileIds.length > 0) {
    await prisma.fileRecord.deleteMany({ where: { id: { in: fileIds } } });
  }

  await prisma.auditLog.deleteMany({ where: { userId: { in: tutorIds } } });
  await prisma.student.deleteMany({ where: { userId: { in: tutorIds } } });
}

async function createStudents(
  studentSeeds: StudentSeed[],
  tutorsByKey: Map<string, User>,
  accountsByKey: Map<string, StudentAccount>,
): Promise<Map<string, Student>> {
  const studentsByKey = new Map<string, Student>();

  for (const seed of studentSeeds) {
    const tutor = tutorsByKey.get(seed.tutorKey);
    if (!tutor) {
      throw new Error(`Tutor key not found: ${seed.tutorKey}`);
    }

    const accountId = seed.accountKey ? (accountsByKey.get(seed.accountKey)?.id ?? null) : null;

    const student = await prisma.student.create({
      data: {
        userId: tutor.id,
        accountId,
        name: seed.name,
        subject: seed.subject,
        grade: seed.grade ?? null,
        age: seed.age ?? null,
        rate: seed.rate,
        status: seed.status,
        phone: seed.phone ?? null,
        whatsapp: seed.whatsapp ?? null,
        telegram: seed.telegram ?? null,
        email: seed.email ?? null,
        telegramChatId: seed.telegramChatId ?? null,
        maxChatId: seed.maxChatId ?? null,
        parentName: seed.parentName ?? null,
        parentPhone: seed.parentPhone ?? null,
        parentWhatsapp: seed.parentWhatsapp ?? null,
        parentTelegram: seed.parentTelegram ?? null,
        parentEmail: seed.parentEmail ?? null,
        notes: seed.notes ?? null,
      },
    });

    studentsByKey.set(seed.key, student);
  }

  return studentsByKey;
}

function buildAvailabilitySlots(userId: string, dayOfWeek: number, startHour: number, endHour: number): Prisma.TutorAvailabilityUncheckedCreateInput[] {
  const slots: Prisma.TutorAvailabilityUncheckedCreateInput[] = [];

  for (let hour = startHour; hour < endHour; hour += 1) {
    slots.push({
      userId,
      dayOfWeek,
      startTime: `${String(hour).padStart(2, '0')}:00`,
      endTime: `${String(hour).padStart(2, '0')}:30`,
    });
    slots.push({
      userId,
      dayOfWeek,
      startTime: `${String(hour).padStart(2, '0')}:30`,
      endTime: `${String(hour + 1).padStart(2, '0')}:00`,
    });
  }

  return slots;
}

function buildLessonRows(
  pattern: LessonPattern,
  now: Date,
  tutor: User,
  student: Student,
): Prisma.LessonUncheckedCreateInput[] {
  const rows: Prisma.LessonUncheckedCreateInput[] = [];

  let cursor = setUtcTime(addDays(now, pattern.startOffsetDays), pattern.hour, pattern.minute);
  const end = setUtcTime(addDays(now, pattern.endOffsetDays), pattern.hour, pattern.minute);
  let index = 0;

  while (cursor <= end) {
    const scheduledAt = new Date(cursor);
    const isFuture = scheduledAt.getTime() > now.getTime();

    let status: LessonStatus;
    let cancelReason: string | null = null;
    let cancelledAt: Date | null = null;
    let lateCancelCharge: number | null = null;
    let rescheduleNewTime: Date | null = null;

    if (isFuture) {
      if (index % 17 === 0) {
        status = LessonStatus.RESCHEDULE_PENDING;
        rescheduleNewTime = addDays(scheduledAt, 2);
      } else {
        status = LessonStatus.PLANNED;
      }
    } else if (index > 0 && index % 29 === 0) {
      status = LessonStatus.CANCELLED_STUDENT;
      cancelReason = 'Ученик отменил поздно через мобильное приложение';
      cancelledAt = addHours(scheduledAt, -6);
      lateCancelCharge = Math.round(student.rate * 0.5);
    } else if (index > 0 && index % 37 === 0) {
      status = LessonStatus.NO_SHOW;
      cancelReason = 'Не вышел на связь в назначенное время';
      cancelledAt = addHours(scheduledAt, -1);
      lateCancelCharge = student.rate;
    } else if (index > 0 && index % 43 === 0) {
      status = LessonStatus.CANCELLED_TUTOR;
      cancelReason = 'Преподаватель перенес из-за форс-мажора';
      cancelledAt = addHours(scheduledAt, -8);
      lateCancelCharge = null;
    } else if (index % 61 === 0 && scheduledAt.getTime() > addDays(now, -90).getTime()) {
      status = LessonStatus.RESCHEDULE_PENDING;
      rescheduleNewTime = addDays(scheduledAt, 1);
    } else {
      status = LessonStatus.COMPLETED;
    }

    rows.push({
      userId: tutor.id,
      studentId: student.id,
      subject: pattern.subject,
      scheduledAt,
      duration: pattern.duration,
      format: pattern.format,
      location:
        pattern.format === LessonFormat.OFFLINE
          ? pattern.location ?? tutor.offlineAddress ?? 'Кабинет репетитора'
          : null,
      rate: student.rate,
      status,
      recurrenceGroupId: `${pattern.studentKey}-${Math.floor(index / 8)}`,
      cancelReason,
      cancelledAt,
      lateCancelCharge,
      rescheduleNewTime,
      googleCalendarEventId: index % 12 === 0 ? `demo-gcal-${pattern.studentKey}-${index}` : null,
      yandexCalendarEventUid: index % 15 === 0 ? `demo-yc-${pattern.studentKey}-${index}` : null,
    });

    cursor = addDays(cursor, pattern.intervalDays);
    index += 1;
  }

  return rows;
}

async function createTutorFileTree(
  tutor: User,
  provider: CloudProvider,
): Promise<{ allFileIds: string[]; bySubject: Map<string, string[]> }> {
  const allFileIds: string[] = [];
  const bySubject = new Map<string, string[]>();
  const slug = tutor.slug ?? tutor.id.slice(0, 8);

  const materialsRoot = await prisma.fileRecord.create({
    data: {
      userId: tutor.id,
      name: 'Материалы 2024-2026',
      type: FileType.FOLDER,
      extension: null,
      size: null,
      cloudProvider: provider,
      cloudUrl: `https://storage.repeto.demo/${slug}/materials`,
      parentId: null,
      createdAt: addDays(new Date(), -600),
    },
  });

  const homeworkRoot = await prisma.fileRecord.create({
    data: {
      userId: tutor.id,
      name: 'Домашние задания',
      type: FileType.FOLDER,
      extension: null,
      size: null,
      cloudProvider: provider,
      cloudUrl: `https://storage.repeto.demo/${slug}/homework`,
      parentId: null,
      createdAt: addDays(new Date(), -550),
    },
  });

  const examRoot = await prisma.fileRecord.create({
    data: {
      userId: tutor.id,
      name: 'Архив экзаменов',
      type: FileType.FOLDER,
      extension: null,
      size: null,
      cloudProvider: provider,
      cloudUrl: `https://storage.repeto.demo/${slug}/exams`,
      parentId: null,
      createdAt: addDays(new Date(), -520),
    },
  });

  const subjects = tutor.subjects.length > 0 ? tutor.subjects : ['General'];

  for (let i = 0; i < subjects.length; i += 1) {
    const subject = subjects[i];
    const subjectSlug = subject.toLowerCase().replace(/\s+/g, '-');

    const subjectFolder = await prisma.fileRecord.create({
      data: {
        userId: tutor.id,
        name: subject,
        type: FileType.FOLDER,
        extension: null,
        size: null,
        cloudProvider: provider,
        cloudUrl: `https://storage.repeto.demo/${slug}/materials/${subjectSlug}`,
        parentId: materialsRoot.id,
        createdAt: addDays(new Date(), -500 + i * 2),
      },
    });

    const worksheet = await prisma.fileRecord.create({
      data: {
        userId: tutor.id,
        name: `${subject} - worksheet set ${i + 1}.pdf`,
        type: FileType.FILE,
        extension: 'pdf',
        size: `${(1.1 + i * 0.2).toFixed(1)} MB`,
        cloudProvider: provider,
        cloudUrl: `https://storage.repeto.demo/${slug}/materials/${subjectSlug}/worksheet-${i + 1}.pdf`,
        parentId: subjectFolder.id,
        createdAt: addDays(new Date(), -480 + i * 3),
      },
    });

    const checklist = await prisma.fileRecord.create({
      data: {
        userId: tutor.id,
        name: `${subject} - progress checklist.docx`,
        type: FileType.FILE,
        extension: 'docx',
        size: `${(0.3 + i * 0.1).toFixed(1)} MB`,
        cloudProvider: provider,
        cloudUrl: `https://storage.repeto.demo/${slug}/materials/${subjectSlug}/progress-checklist.docx`,
        parentId: subjectFolder.id,
        createdAt: addDays(new Date(), -470 + i * 3),
      },
    });

    const recording = await prisma.fileRecord.create({
      data: {
        userId: tutor.id,
        name: `${subject} - lesson recap ${i + 1}.mp4`,
        type: FileType.FILE,
        extension: 'mp4',
        size: `${(45 + i * 5).toFixed(0)} MB`,
        cloudProvider: provider,
        cloudUrl: `https://storage.repeto.demo/${slug}/materials/${subjectSlug}/recap-${i + 1}.mp4`,
        parentId: subjectFolder.id,
        createdAt: addDays(new Date(), -460 + i * 3),
      },
    });

    bySubject.set(subject, [worksheet.id, checklist.id, recording.id]);
    allFileIds.push(worksheet.id, checklist.id, recording.id);
  }

  const examGuideline = await prisma.fileRecord.create({
    data: {
      userId: tutor.id,
      name: 'Exam strategy 2026.pdf',
      type: FileType.FILE,
      extension: 'pdf',
      size: '2.4 MB',
      cloudProvider: provider,
      cloudUrl: `https://storage.repeto.demo/${slug}/exams/exam-strategy-2026.pdf`,
      parentId: examRoot.id,
      createdAt: addDays(new Date(), -220),
    },
  });

  const homeworkTemplate = await prisma.fileRecord.create({
    data: {
      userId: tutor.id,
      name: 'Homework template.docx',
      type: FileType.FILE,
      extension: 'docx',
      size: '0.4 MB',
      cloudProvider: provider,
      cloudUrl: `https://storage.repeto.demo/${slug}/homework/template.docx`,
      parentId: homeworkRoot.id,
      createdAt: addDays(new Date(), -200),
    },
  });

  allFileIds.push(examGuideline.id, homeworkTemplate.id);
  return { allFileIds, bySubject };
}

async function main(): Promise<void> {
  ensureProductionSeedIsAllowed();

  const now = new Date();
  console.log('Starting extended production-safe demo seed (2-year dataset)...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const tutorSeeds: TutorSeed[] = [
    {
      key: 'alpha',
      email: 'demo.tutor.alpha@repeto.ru',
      name: 'Demo Tutor Alpha',
      phone: '+7 900 111-11-11',
      whatsapp: '+7 900 111-11-11',
      slug: 'demo-tutor-alpha',
      published: true,
      showPublicPackages: true,
      timezone: 'Europe/Moscow',
      avatarUrl: null,
      subjects: ['Math', 'Physics', 'English', 'Computer Science'],
      subjectDetails: [
        { name: 'Math', duration: 60, price: 2300 },
        { name: 'Physics', duration: 90, price: 2500 },
        { name: 'English', duration: 60, price: 1900 },
        { name: 'Computer Science', duration: 75, price: 2600 },
      ],
      aboutText:
        'Два года плотной работы в сервисе: регулярные уроки, пакетная система, отчеты родителям, контроль прогресса и интеграции с облаками.',
      tagline: 'Системная подготовка к экзаменам и олимпиадам',
      website: 'https://alpha-demo.repeto.ru',
      vk: 'https://vk.com/demo_tutor_alpha',
      format: 'both',
      offlineAddress: 'Москва, ул. Тверская, д. 12, кабинет 305',
      education: [
        {
          degree: 'MSc',
          university: 'МФТИ',
          specialty: 'Прикладная математика и физика',
          year: 2018,
        },
      ],
      experience:
        '9 лет преподавания: индивидуальные и мини-группы, подготовка к ЕГЭ/ОГЭ и поступлению в технические вузы.',
      qualificationVerified: true,
      qualificationLabel: 'Подтвержденный эксперт ЕГЭ',
      certificates: [
        {
          title: 'Эксперт ЕГЭ 2025',
          issuer: 'ФИПИ',
          year: 2025,
        },
        {
          title: 'Cambridge TKT Module 3',
          issuer: 'Cambridge',
          year: 2024,
        },
      ],
      lessonsCount: 420,
      rating: '4.9',
      taxStatus: TaxStatus.SOLE_TRADER,
      notificationSettings: {
        emailNotifications: true,
        lessonReminder: true,
        paymentReminder: true,
        homeworkSubmitted: true,
        bookingNew: true,
        reminderTime: 45,
      },
      cancelPolicySettings: {
        freeCancelHours: 12,
        lateCancelCharge: 50,
        noshowCharge: 100,
      },
      paymentSettings: {
        currency: 'RUB',
        preferredMethods: ['SBP', 'TRANSFER', 'YUKASSA'],
        invoicePrefix: 'ALPHA',
      },
      googleCalendarEmail: 'alpha.calendar@repeto-demo.ru',
      yandexCalendarEmail: 'alpha.yandex@repeto-demo.ru',
      yandexCalendarLogin: 'alpha_demo_calendar',
      yandexDiskEmail: 'alpha.disk@repeto-demo.ru',
      yandexDiskRootPath: '/Repeto/AlphaTutor',
      googleDriveEmail: 'alpha.drive@repeto-demo.ru',
      googleDriveRootPath: '/Repeto/AlphaTutor',
      homeworkDefaultCloud: CloudProvider.YANDEX_DISK,
    },
    {
      key: 'beta',
      email: 'demo.tutor.beta@repeto.ru',
      name: 'Demo Tutor Beta',
      phone: '+7 911 222-22-22',
      whatsapp: '+7 911 222-22-22',
      slug: 'demo-tutor-beta',
      published: true,
      showPublicPackages: true,
      timezone: 'Europe/Moscow',
      avatarUrl: null,
      subjects: ['English', 'Speaking Club'],
      subjectDetails: [
        { name: 'English', duration: 45, price: 1700 },
        { name: 'Speaking Club', duration: 60, price: 1500 },
      ],
      aboutText:
        'Профиль с акцентом на разговорный английский, устойчивые абонементы, домашние задания и прозрачный финансовый поток.',
      tagline: 'Английский для подростков и взрослых',
      website: 'https://beta-demo.repeto.ru',
      vk: null,
      format: 'online',
      offlineAddress: 'Санкт-Петербург, Невский проспект, 32',
      education: [
        {
          degree: 'BA',
          university: 'СПбГУ',
          specialty: 'Лингвистика',
          year: 2016,
        },
      ],
      experience: '7 лет в языковых школах и частной практике, упор на speaking и IELTS.',
      qualificationVerified: true,
      qualificationLabel: 'IELTS speaking mentor',
      certificates: [
        {
          title: 'IELTS 8.5',
          issuer: 'British Council',
          year: 2023,
        },
      ],
      lessonsCount: 260,
      rating: '4.7',
      taxStatus: TaxStatus.SELF_EMPLOYED,
      notificationSettings: {
        emailNotifications: false,
        lessonReminder: true,
        paymentReminder: true,
        homeworkSubmitted: true,
        bookingNew: true,
        reminderTime: 90,
      },
      cancelPolicySettings: {
        freeCancelHours: 6,
        lateCancelCharge: 40,
        noshowCharge: 100,
      },
      paymentSettings: {
        currency: 'RUB',
        preferredMethods: ['TRANSFER', 'CASH', 'SBP'],
        invoicePrefix: 'BETA',
      },
      googleCalendarEmail: 'beta.calendar@repeto-demo.ru',
      yandexCalendarEmail: null,
      yandexCalendarLogin: null,
      yandexDiskEmail: null,
      yandexDiskRootPath: null,
      googleDriveEmail: 'beta.drive@repeto-demo.ru',
      googleDriveRootPath: '/Repeto/BetaTutor',
      homeworkDefaultCloud: CloudProvider.GOOGLE_DRIVE,
    },
  ];

  const tutorsByKey = new Map<string, User>();
  for (const seed of tutorSeeds) {
    const tutor = await upsertTutor(seed, passwordHash);
    tutorsByKey.set(seed.key, tutor);
  }

  const accountSeeds: StudentAccountSeed[] = [
    {
      key: 'shared-alina',
      email: 'demo.student.orlova@repeto.ru',
      name: 'Alina Orlova',
      avatarUrl: null,
      status: StudentAccountStatus.ACTIVE,
      emailVerifiedAt: addDays(now, -390),
      lastLoginAt: addDays(now, -1),
    },
    {
      key: 'timur',
      email: 'demo.student.mironov@repeto.ru',
      name: 'Timur Mironov',
      avatarUrl: null,
      status: StudentAccountStatus.ACTIVE,
      emailVerifiedAt: addDays(now, -180),
      lastLoginAt: addDays(now, -4),
    },
    {
      key: 'sofia',
      email: 'demo.student.sofia@repeto.ru',
      name: 'Sofia Gorina',
      avatarUrl: null,
      status: StudentAccountStatus.PAUSED,
      emailVerifiedAt: addDays(now, -700),
      lastLoginAt: addDays(now, -120),
    },
    {
      key: 'eva',
      email: 'demo.student.eva@repeto.ru',
      name: 'Eva Smirnova',
      avatarUrl: null,
      status: StudentAccountStatus.INVITED,
      emailVerifiedAt: null,
      lastLoginAt: null,
    },
  ];

  const accountsByKey = new Map<string, StudentAccount>();
  for (const seed of accountSeeds) {
    const account = await upsertStudentAccount(seed);
    accountsByKey.set(seed.key, account);
  }

  const tutorIds = [...tutorsByKey.values()].map((item) => item.id);
  const accountIds = [...accountsByKey.values()].map((item) => item.id);

  await resetDemoScope(tutorIds, accountIds);

  const studentSeeds: StudentSeed[] = [
    {
      key: 'alina-alpha',
      tutorKey: 'alpha',
      accountKey: 'shared-alina',
      name: 'Alina Orlova',
      subject: 'Math',
      grade: '10',
      age: 16,
      rate: 2300,
      status: StudentStatus.ACTIVE,
      phone: '+7 901 101-01-01',
      whatsapp: '+7 901 101-01-01',
      telegram: '@alina_orlova',
      email: 'alina.orlova.family@mail.ru',
      telegramChatId: 'tg-alina-orlova',
      maxChatId: 'max-alina-orlova',
      parentName: 'Marina Orlova',
      parentPhone: '+7 901 101-01-02',
      parentWhatsapp: '+7 901 101-01-02',
      parentTelegram: '@marina_orlova_parent',
      parentEmail: 'marina.orlova@mail.ru',
      notes: 'Full profile: parent engagement, weekly reports, exam track since spring 2024.',
    },
    {
      key: 'artem-alpha',
      tutorKey: 'alpha',
      name: 'Artem Lee',
      subject: 'Physics',
      grade: '11',
      age: 17,
      rate: 2500,
      status: StudentStatus.ACTIVE,
      phone: '+7 902 202-02-02',
      whatsapp: '+7 902 202-02-02',
      telegram: '@artem_lee',
      email: 'artem.lee@gmail.com',
      telegramChatId: null,
      maxChatId: null,
      parentName: null,
      parentPhone: null,
      parentWhatsapp: null,
      parentTelegram: null,
      parentEmail: null,
      notes: 'STEM intensive profile, regular mock tests, no parent contacts by request.',
    },
    {
      key: 'pavel-alpha',
      tutorKey: 'alpha',
      name: 'Pavel Kim',
      subject: 'Math',
      grade: '8',
      age: 14,
      rate: 1900,
      status: StudentStatus.PAUSED,
      phone: null,
      whatsapp: null,
      telegram: null,
      email: null,
      telegramChatId: null,
      maxChatId: null,
      parentName: 'Olga Kim',
      parentPhone: '+7 903 303-03-03',
      parentWhatsapp: '+7 903 303-03-03',
      parentTelegram: null,
      parentEmail: null,
      notes: 'Paused since winter due to sports season; parent channel only.',
    },
    {
      key: 'sofia-alpha',
      tutorKey: 'alpha',
      accountKey: 'sofia',
      name: 'Sofia Gorina',
      subject: 'Computer Science',
      grade: 'Adult',
      age: 22,
      rate: 2600,
      status: StudentStatus.ARCHIVED,
      phone: '+7 904 454-54-54',
      whatsapp: '+7 904 454-54-54',
      telegram: '@sofia_gorina',
      email: 'sofia.gorina@outlook.com',
      telegramChatId: 'tg-sofia-gorina',
      maxChatId: null,
      parentName: null,
      parentPhone: null,
      parentWhatsapp: null,
      parentTelegram: null,
      parentEmail: null,
      notes: 'Archived after successful university admission. History preserved for analytics.',
    },
    {
      key: 'alina-beta',
      tutorKey: 'beta',
      accountKey: 'shared-alina',
      name: 'Alina Orlova',
      subject: 'English',
      grade: '10',
      age: 16,
      rate: 1900,
      status: StudentStatus.ACTIVE,
      phone: null,
      whatsapp: '+7 901 101-01-01',
      telegram: '@alina_orlova',
      email: null,
      telegramChatId: null,
      maxChatId: 'max-alina-orlova',
      parentName: 'Marina Orlova',
      parentPhone: '+7 901 101-01-02',
      parentWhatsapp: '+7 901 101-01-02',
      parentTelegram: null,
      parentEmail: null,
      notes: 'Cross-tutor account link with alpha tutor for combined exam program.',
    },
    {
      key: 'timur-beta',
      tutorKey: 'beta',
      accountKey: 'timur',
      name: 'Timur Mironov',
      subject: 'English',
      grade: '9',
      age: 15,
      rate: 1700,
      status: StudentStatus.ACTIVE,
      phone: '+7 904 404-04-04',
      whatsapp: '+7 904 404-04-04',
      telegram: '@timur_mironov',
      email: 'timur.mironov@student.mail',
      telegramChatId: 'tg-timur-mironov',
      maxChatId: null,
      parentName: 'Nikita Mironov',
      parentPhone: '+7 904 404-04-05',
      parentWhatsapp: '+7 904 404-04-05',
      parentTelegram: '@nikita_mironov_parent',
      parentEmail: 'nikita.mironov@mail.ru',
      notes: 'High-frequency speaking practice, weekly homework checks and monthly progress briefs.',
    },
    {
      key: 'eva-beta',
      tutorKey: 'beta',
      accountKey: 'eva',
      name: 'Eva Smirnova',
      subject: 'Speaking Club',
      grade: 'Adult',
      age: 28,
      rate: 1500,
      status: StudentStatus.PAUSED,
      phone: '+7 905 505-05-05',
      whatsapp: '+7 905 505-05-05',
      telegram: null,
      email: 'eva.smirnova@mail.ru',
      telegramChatId: null,
      maxChatId: null,
      parentName: null,
      parentPhone: null,
      parentWhatsapp: null,
      parentTelegram: null,
      parentEmail: null,
      notes: 'Paused corporate schedule; keeps access to materials and recordings.',
    },
  ];

  const studentsByKey = await createStudents(studentSeeds, tutorsByKey, accountsByKey);
  const students = [...studentsByKey.values()];
  const studentIds = students.map((item) => item.id);

  const studentsById = new Map(students.map((item) => [item.id, item]));
  const studentNameById = new Map(students.map((item) => [item.id, item.name]));

  const availabilityRows: Prisma.TutorAvailabilityUncheckedCreateInput[] = [];

  const alphaTutor = tutorsByKey.get('alpha');
  const betaTutor = tutorsByKey.get('beta');

  if (!alphaTutor || !betaTutor) {
    throw new Error('Missing demo tutors after upsert');
  }

  for (let day = 0; day <= 4; day += 1) {
    availabilityRows.push(...buildAvailabilitySlots(alphaTutor.id, day, 9, 13));
    availabilityRows.push(...buildAvailabilitySlots(alphaTutor.id, day, 15, 20));
  }
  availabilityRows.push(...buildAvailabilitySlots(alphaTutor.id, 5, 10, 14));

  for (let day = 1; day <= 5; day += 1) {
    availabilityRows.push(...buildAvailabilitySlots(betaTutor.id, day, 14, 19));
  }
  availabilityRows.push(...buildAvailabilitySlots(betaTutor.id, 6, 11, 16));

  await prisma.tutorAvailability.createMany({ data: availabilityRows });

  const overrideRows: Prisma.AvailabilityOverrideUncheckedCreateInput[] = [
    {
      userId: alphaTutor.id,
      date: addDays(now, -35),
      startTime: '09:00',
      endTime: '13:00',
      isBlocked: true,
    },
    {
      userId: alphaTutor.id,
      date: addDays(now, -14),
      startTime: '16:00',
      endTime: '18:00',
      isBlocked: true,
    },
    {
      userId: alphaTutor.id,
      date: addDays(now, 3),
      startTime: '10:00',
      endTime: '13:00',
      isBlocked: false,
    },
    {
      userId: alphaTutor.id,
      date: addDays(now, 10),
      startTime: '17:00',
      endTime: '20:00',
      isBlocked: false,
    },
    {
      userId: betaTutor.id,
      date: addDays(now, -20),
      startTime: '14:00',
      endTime: '16:00',
      isBlocked: true,
    },
    {
      userId: betaTutor.id,
      date: addDays(now, -5),
      startTime: '18:00',
      endTime: '19:00',
      isBlocked: true,
    },
    {
      userId: betaTutor.id,
      date: addDays(now, 2),
      startTime: '12:00',
      endTime: '14:00',
      isBlocked: false,
    },
    {
      userId: betaTutor.id,
      date: addDays(now, 8),
      startTime: '15:00',
      endTime: '17:00',
      isBlocked: false,
    },
  ];

  await prisma.availabilityOverride.createMany({ data: overrideRows });

  const lessonPatterns: LessonPattern[] = [
    {
      tutorKey: 'alpha',
      studentKey: 'alina-alpha',
      subject: 'Math',
      duration: 60,
      format: LessonFormat.ONLINE,
      intervalDays: 7,
      startOffsetDays: -720,
      endOffsetDays: 45,
      hour: 14,
      minute: 0,
    },
    {
      tutorKey: 'alpha',
      studentKey: 'artem-alpha',
      subject: 'Physics',
      duration: 90,
      format: LessonFormat.OFFLINE,
      intervalDays: 10,
      startOffsetDays: -710,
      endOffsetDays: 30,
      hour: 16,
      minute: 0,
      location: 'Москва, ул. Тверская, д. 12, кабинет 305',
    },
    {
      tutorKey: 'alpha',
      studentKey: 'pavel-alpha',
      subject: 'Math',
      duration: 60,
      format: LessonFormat.ONLINE,
      intervalDays: 14,
      startOffsetDays: -700,
      endOffsetDays: -40,
      hour: 10,
      minute: 0,
    },
    {
      tutorKey: 'alpha',
      studentKey: 'sofia-alpha',
      subject: 'Computer Science',
      duration: 75,
      format: LessonFormat.ONLINE,
      intervalDays: 21,
      startOffsetDays: -690,
      endOffsetDays: -120,
      hour: 18,
      minute: 0,
    },
    {
      tutorKey: 'beta',
      studentKey: 'alina-beta',
      subject: 'English',
      duration: 60,
      format: LessonFormat.ONLINE,
      intervalDays: 14,
      startOffsetDays: -680,
      endOffsetDays: 35,
      hour: 17,
      minute: 30,
    },
    {
      tutorKey: 'beta',
      studentKey: 'timur-beta',
      subject: 'English',
      duration: 45,
      format: LessonFormat.ONLINE,
      intervalDays: 9,
      startOffsetDays: -560,
      endOffsetDays: 40,
      hour: 15,
      minute: 30,
    },
    {
      tutorKey: 'beta',
      studentKey: 'eva-beta',
      subject: 'Speaking Club',
      duration: 60,
      format: LessonFormat.ONLINE,
      intervalDays: 21,
      startOffsetDays: -650,
      endOffsetDays: -60,
      hour: 19,
      minute: 0,
    },
  ];

  const lessonRows: Prisma.LessonUncheckedCreateInput[] = [];

  for (const pattern of lessonPatterns) {
    const tutor = tutorsByKey.get(pattern.tutorKey);
    const student = studentsByKey.get(pattern.studentKey);
    if (!tutor || !student) {
      throw new Error(`Cannot build lessons for tutor=${pattern.tutorKey}, student=${pattern.studentKey}`);
    }

    lessonRows.push(...buildLessonRows(pattern, now, tutor, student));
  }

  await prisma.lesson.createMany({ data: lessonRows });

  const lessonRecords = await prisma.lesson.findMany({
    where: { userId: { in: tutorIds }, studentId: { in: studentIds } },
    select: {
      id: true,
      userId: true,
      studentId: true,
      subject: true,
      scheduledAt: true,
      duration: true,
      format: true,
      location: true,
      rate: true,
      status: true,
      recurrenceGroupId: true,
      cancelReason: true,
      cancelledAt: true,
      lateCancelCharge: true,
      rescheduleNewTime: true,
    },
  });

  const lessonsByStudent = new Map<string, typeof lessonRecords>();
  for (const lesson of lessonRecords) {
    const bucket = lessonsByStudent.get(lesson.studentId) ?? [];
    bucket.push(lesson);
    lessonsByStudent.set(lesson.studentId, bucket);
  }

  for (const [studentId, bucket] of lessonsByStudent.entries()) {
    bucket.sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
    lessonsByStudent.set(studentId, bucket);
  }

  const tutorById = new Map([...tutorsByKey.values()].map((item) => [item.id, item]));

  const paymentRows: Prisma.PaymentUncheckedCreateInput[] = [];
  const paymentMethods = [
    PaymentMethod.TRANSFER,
    PaymentMethod.SBP,
    PaymentMethod.CASH,
    PaymentMethod.YUKASSA,
  ];

  for (const student of students) {
    const studentLessons = (lessonsByStudent.get(student.id) ?? [])
      .filter((item) => item.status === LessonStatus.COMPLETED)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    const chunkSize = student.status === StudentStatus.ACTIVE ? 4 : 5;
    const chunks = chunkArray(studentLessons, chunkSize).filter((chunk) => chunk.length >= 2);

    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const method = paymentMethods[i % paymentMethods.length];
      const amount = chunk.reduce((sum, lesson) => sum + lesson.rate, 0);
      const paymentDate = addDays(chunk[chunk.length - 1].scheduledAt, 1);

      let status: PaymentStatus = PaymentStatus.PAID;
      if (student.status !== StudentStatus.ACTIVE && i >= chunks.length - 2) {
        status = i % 2 === 0 ? PaymentStatus.OVERDUE : PaymentStatus.PENDING;
      }
      if (student.status === StudentStatus.ACTIVE && i === chunks.length - 1 && i % 6 === 0) {
        status = PaymentStatus.REFUNDED;
      }

      const tutor = tutorById.get(student.userId);
      const receiptStatus =
        method === PaymentMethod.YUKASSA
          ? ReceiptStatus.ATTACHED
          : tutor?.taxStatus === TaxStatus.SELF_EMPLOYED
            ? ReceiptStatus.NEEDED
            : ReceiptStatus.NOT_NEEDED;

      paymentRows.push({
        userId: student.userId,
        studentId: student.id,
        lessonId: null,
        amount,
        method,
        status,
        date: paymentDate,
        comment: `Платеж за ${chunk.length} урока(ов) (${student.subject})`,
        externalPaymentId:
          method === PaymentMethod.YUKASSA
            ? `demo-yk-${student.id.slice(0, 8)}-${i}`
            : null,
        receiptStatus,
      });
    }
  }

  await prisma.payment.createMany({ data: paymentRows });

  const packageRows: Prisma.PackageUncheckedCreateInput[] = [];

  for (const student of students) {
    const baseRate = student.rate;
    const oldCreatedAt = addDays(now, -620);
    const midCreatedAt = addDays(now, -320);
    const currentCreatedAt = addDays(now, -70);

    packageRows.push({
      userId: student.userId,
      studentId: student.id,
      isPublic: true,
      subject: student.subject,
      lessonsTotal: 16,
      lessonsUsed: 16,
      totalPrice: 16 * baseRate,
      comment: 'Исторический пакет, полностью отработан',
      status: PackageStatus.COMPLETED,
      validUntil: addDays(oldCreatedAt, 160),
      createdAt: oldCreatedAt,
    });

    packageRows.push({
      userId: student.userId,
      studentId: student.id,
      isPublic: student.status === StudentStatus.ACTIVE,
      subject: student.subject,
      lessonsTotal: 12,
      lessonsUsed: student.status === StudentStatus.ACTIVE ? 12 : 9,
      totalPrice: 12 * baseRate,
      comment: 'Среднесрочный пакет с промежуточной диагностикой',
      status: student.status === StudentStatus.ACTIVE ? PackageStatus.COMPLETED : PackageStatus.EXPIRED,
      validUntil: addDays(midCreatedAt, 170),
      createdAt: midCreatedAt,
    });

    packageRows.push({
      userId: student.userId,
      studentId: student.id,
      isPublic: student.status !== StudentStatus.ARCHIVED,
      subject: student.subject,
      lessonsTotal: 10,
      lessonsUsed:
        student.status === StudentStatus.ACTIVE
          ? 6
          : student.status === StudentStatus.PAUSED
            ? 2
            : 10,
      totalPrice: 10 * baseRate,
      comment: 'Текущий пакет (активный/на паузе/архивный в зависимости от статуса)',
      status:
        student.status === StudentStatus.ACTIVE
          ? PackageStatus.ACTIVE
          : student.status === StudentStatus.PAUSED
            ? PackageStatus.ACTIVE
            : PackageStatus.EXPIRED,
      validUntil: addDays(currentCreatedAt, 190),
      createdAt: currentCreatedAt,
    });
  }

  await prisma.package.createMany({ data: packageRows });

  const packageRecords = await prisma.package.findMany({
    where: { userId: { in: tutorIds }, studentId: { in: studentIds } },
    select: {
      id: true,
      userId: true,
      studentId: true,
      status: true,
      validUntil: true,
      subject: true,
      lessonsTotal: true,
      lessonsUsed: true,
      totalPrice: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const activePackageByStudent = new Map<string, (typeof packageRecords)[number]>();
  for (const item of packageRecords) {
    if (!item.studentId || item.status !== PackageStatus.ACTIVE) {
      continue;
    }
    if (!activePackageByStudent.has(item.studentId)) {
      activePackageByStudent.set(item.studentId, item);
    }
  }

  const bookingRows: Prisma.BookingRequestUncheckedCreateInput[] = [
    {
      userId: alphaTutor.id,
      packageId: activePackageByStudent.get(studentsByKey.get('alina-alpha')!.id)?.id ?? null,
      subject: 'Math',
      date: addDays(now, 2),
      startTime: '10:00',
      duration: 60,
      clientName: 'Ekaterina Smirnova',
      clientPhone: '+7 912 345-67-89',
      clientEmail: 'smirnova.ek@mail.ru',
      comment: 'Дополнительный интенсив перед диагностикой.',
      telegramChatId: 'tg-booking-ekaterina',
      maxChatId: null,
      status: BookingStatus.PENDING,
    },
    {
      userId: alphaTutor.id,
      packageId: activePackageByStudent.get(studentsByKey.get('artem-alpha')!.id)?.id ?? null,
      subject: 'Physics',
      date: addDays(now, 5),
      startTime: '16:30',
      duration: 90,
      clientName: 'Andrey Grigoriev',
      clientPhone: '+7 903 888-77-66',
      clientEmail: null,
      comment: 'Запрос на пробный офлайн-урок.',
      telegramChatId: null,
      maxChatId: 'max-booking-andrey',
      status: BookingStatus.CONFIRMED,
    },
    {
      userId: alphaTutor.id,
      packageId: null,
      subject: 'Computer Science',
      date: addDays(now, 7),
      startTime: '18:00',
      duration: 60,
      clientName: 'Nikita Velichko',
      clientPhone: '+7 915 222-90-10',
      clientEmail: 'nikita.velichko@mail.ru',
      comment: 'Нужна помощь по алгоритмам.',
      telegramChatId: null,
      maxChatId: null,
      status: BookingStatus.REJECTED,
    },
    {
      userId: betaTutor.id,
      packageId: activePackageByStudent.get(studentsByKey.get('timur-beta')!.id)?.id ?? null,
      subject: 'English',
      date: addDays(now, 1),
      startTime: '15:30',
      duration: 45,
      clientName: 'Olga Smolina',
      clientPhone: '+7 916 112-11-22',
      clientEmail: 'olga.smolina@mail.ru',
      comment: 'Подготовка к устной части.',
      telegramChatId: 'tg-booking-olga',
      maxChatId: null,
      status: BookingStatus.PENDING,
    },
    {
      userId: betaTutor.id,
      packageId: activePackageByStudent.get(studentsByKey.get('alina-beta')!.id)?.id ?? null,
      subject: 'English',
      date: addDays(now, 4),
      startTime: '17:30',
      duration: 60,
      clientName: 'Marina Orlova',
      clientPhone: '+7 901 101-01-02',
      clientEmail: 'marina.orlova@mail.ru',
      comment: 'Согласование дополнительного speaking-слота.',
      telegramChatId: null,
      maxChatId: 'max-booking-marina',
      status: BookingStatus.CONFIRMED,
    },
    {
      userId: betaTutor.id,
      packageId: null,
      subject: 'Speaking Club',
      date: addDays(now, -1),
      startTime: '19:00',
      duration: 60,
      clientName: 'Elena Vronskaya',
      clientPhone: '+7 930 700-11-88',
      clientEmail: null,
      comment: 'Отмена по личным обстоятельствам.',
      telegramChatId: null,
      maxChatId: null,
      status: BookingStatus.CANCELLED,
    },
  ];

  await prisma.bookingRequest.createMany({ data: bookingRows });

  const bookingRecords = await prisma.bookingRequest.findMany({
    where: { userId: { in: tutorIds } },
    select: {
      id: true,
      userId: true,
      subject: true,
      date: true,
      startTime: true,
      clientName: true,
      status: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const filePoolsByTutor = new Map<string, { allFileIds: string[]; bySubject: Map<string, string[]> }>();

  for (const seed of tutorSeeds) {
    const tutor = tutorsByKey.get(seed.key);
    if (!tutor) {
      continue;
    }

    const files = await createTutorFileTree(tutor, seed.homeworkDefaultCloud);
    filePoolsByTutor.set(seed.key, files);
  }

  const fileShareRows: Prisma.FileShareUncheckedCreateInput[] = [];
  const sharedFileIdsByStudent = new Map<string, string[]>();

  for (const studentSeed of studentSeeds) {
    const student = studentsByKey.get(studentSeed.key);
    const filePool = filePoolsByTutor.get(studentSeed.tutorKey);
    if (!student || !filePool) {
      continue;
    }

    const subjectPool = filePool.bySubject.get(student.subject) ?? filePool.allFileIds;
    const amountToShare =
      student.status === StudentStatus.ACTIVE ? 4 : student.status === StudentStatus.PAUSED ? 3 : 2;

    const selected = subjectPool.slice(0, Math.min(amountToShare, subjectPool.length));
    sharedFileIdsByStudent.set(student.id, selected);

    for (const fileId of selected) {
      fileShareRows.push({
        fileId,
        studentId: student.id,
      });
    }
  }

  if (fileShareRows.length > 0) {
    await prisma.fileShare.createMany({ data: fileShareRows, skipDuplicates: true });
  }

  const homeworkRows: Prisma.HomeworkUncheckedCreateInput[] = [];

  for (const student of students) {
    const timeline = lessonsByStudent.get(student.id) ?? [];
    const targetCount =
      student.status === StudentStatus.ACTIVE ? 18 : student.status === StudentStatus.PAUSED ? 10 : 8;

    for (let i = 0; i < Math.min(targetCount, timeline.length); i += 1) {
      const lesson = timeline[i];
      const dueAt = addDays(lesson.scheduledAt, 3);

      let status: HomeworkStatus = HomeworkStatus.PENDING;
      if (dueAt.getTime() < addDays(now, -2).getTime()) {
        status = i % 4 === 0 ? HomeworkStatus.OVERDUE : HomeworkStatus.COMPLETED;
      }

      homeworkRows.push({
        studentId: student.id,
        lessonId: i % 2 === 0 ? lesson.id : null,
        task: `${student.subject}: блок ${i + 1} — разбор ошибок, 12 задач, мини-тест`,
        dueAt,
        status,
        attachments:
          i % 2 === 0
            ? [
                `https://cdn.repeto.demo/homework/${student.id}/task-${i + 1}.pdf`,
                `https://cdn.repeto.demo/homework/${student.id}/brief-${i + 1}.txt`,
              ]
            : [],
      });
    }
  }

  await prisma.homework.createMany({ data: homeworkRows });

  const homeworkRecords = await prisma.homework.findMany({
    where: { studentId: { in: studentIds } },
    select: {
      id: true,
      studentId: true,
      lessonId: true,
      task: true,
      status: true,
      dueAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const homeworkMaterialRows: Prisma.HomeworkMaterialUncheckedCreateInput[] = [];
  const usedMaterialPairs = new Set<string>();

  for (let i = 0; i < homeworkRecords.length; i += 1) {
    const hw = homeworkRecords[i];
    const studentFiles = sharedFileIdsByStudent.get(hw.studentId) ?? [];
    if (studentFiles.length === 0) {
      continue;
    }

    const first = studentFiles[i % studentFiles.length];
    const pairA = `${hw.id}:${first}`;
    if (!usedMaterialPairs.has(pairA)) {
      usedMaterialPairs.add(pairA);
      homeworkMaterialRows.push({ homeworkId: hw.id, fileId: first });
    }

    if (i % 3 === 0 && studentFiles.length > 1) {
      const second = studentFiles[(i + 1) % studentFiles.length];
      const pairB = `${hw.id}:${second}`;
      if (!usedMaterialPairs.has(pairB)) {
        usedMaterialPairs.add(pairB);
        homeworkMaterialRows.push({ homeworkId: hw.id, fileId: second });
      }
    }
  }

  if (homeworkMaterialRows.length > 0) {
    await prisma.homeworkMaterial.createMany({ data: homeworkMaterialRows, skipDuplicates: true });
  }

  const lessonNoteRows: Prisma.LessonNoteUncheckedCreateInput[] = [];

  for (const student of students) {
    const completedLessons = (lessonsByStudent.get(student.id) ?? []).filter(
      (item) => item.status === LessonStatus.COMPLETED,
    );

    for (let i = 0; i < completedLessons.length; i += 9) {
      const lesson = completedLessons[i];
      if (!lesson) {
        continue;
      }

      lessonNoteRows.push({
        studentId: student.id,
        lessonId: lesson.id,
        content:
          `${student.subject}: разобрали блок ${Math.floor(i / 9) + 1}. ` +
          'Усилить работу над тайм-менеджментом и проверкой черновика.',
        createdAt: addHours(lesson.scheduledAt, 2),
      });
    }

    lessonNoteRows.push({
      studentId: student.id,
      lessonId: null,
      content:
        'Квартальный summary: стабильная посещаемость, рост точности по тестам, ' +
        'рекомендовано сохранить текущий темп и добавить 1 диагностический пробник в месяц.',
      createdAt: addDays(now, -7),
    });
  }

  if (lessonNoteRows.length > 0) {
    await prisma.lessonNote.createMany({ data: lessonNoteRows });
  }

  const paymentRecords = await prisma.payment.findMany({
    where: { userId: { in: tutorIds }, studentId: { in: studentIds } },
    select: {
      id: true,
      userId: true,
      studentId: true,
      amount: true,
      method: true,
      status: true,
      date: true,
      comment: true,
    },
    orderBy: { date: 'desc' },
  });

  const notificationRows: Prisma.NotificationUncheckedCreateInput[] = [];

  for (const payment of paymentRecords.slice(0, 40)) {
    const studentName = fallbackMessage(studentNameById.get(payment.studentId), 'Ученик');

    if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.REFUNDED) {
      notificationRows.push({
        userId: payment.userId,
        studentId: payment.studentId,
        lessonId: null,
        bookingRequestId: null,
        type: NotificationType.PAYMENT_RECEIVED,
        title: payment.status === PaymentStatus.REFUNDED ? 'Возврат зафиксирован' : 'Оплата получена',
        description: `${studentName} · ${formatMoney(payment.amount)} ₽ · ${payment.method}`,
        read: payment.date.getTime() < addDays(now, -20).getTime(),
        actionUrl: '/payments',
        channel: null,
        sentAt: null,
        createdAt: addHours(payment.date, 3),
      });
    }

    if (payment.status === PaymentStatus.OVERDUE || payment.status === PaymentStatus.PENDING) {
      notificationRows.push({
        userId: payment.userId,
        studentId: payment.studentId,
        lessonId: null,
        bookingRequestId: null,
        type: NotificationType.PAYMENT_OVERDUE,
        title: payment.status === PaymentStatus.OVERDUE ? 'Просроченная оплата' : 'Ожидается оплата',
        description: `${studentName} · ${formatMoney(payment.amount)} ₽`,
        read: false,
        actionUrl: '/payments?filter=overdue',
        channel: null,
        sentAt: null,
        createdAt: addHours(payment.date, 6),
      });
    }
  }

  for (const lesson of lessonRecords) {
    if (lesson.status === LessonStatus.PLANNED && lesson.scheduledAt.getTime() <= addDays(now, 3).getTime()) {
      notificationRows.push({
        userId: lesson.userId,
        studentId: lesson.studentId,
        lessonId: lesson.id,
        bookingRequestId: null,
        type: NotificationType.LESSON_REMINDER,
        title: 'Ближайший урок',
        description:
          `${fallbackMessage(studentNameById.get(lesson.studentId), 'Ученик')} · ${lesson.subject} · ` +
          `${lesson.scheduledAt.toISOString().slice(0, 16).replace('T', ' ')}`,
        read: false,
        actionUrl: '/schedule',
        channel: null,
        sentAt: null,
        createdAt: addHours(lesson.scheduledAt, -24),
      });
    }

    if (
      (lesson.status === LessonStatus.CANCELLED_STUDENT || lesson.status === LessonStatus.CANCELLED_TUTOR) &&
      lesson.scheduledAt.getTime() > addDays(now, -180).getTime()
    ) {
      notificationRows.push({
        userId: lesson.userId,
        studentId: lesson.studentId,
        lessonId: lesson.id,
        bookingRequestId: null,
        type: NotificationType.LESSON_CANCELLED,
        title: 'Урок отменен',
        description:
          `${fallbackMessage(studentNameById.get(lesson.studentId), 'Ученик')} · ` +
          `${fallbackMessage(lesson.cancelReason, 'Причина не указана')}`,
        read: lesson.scheduledAt.getTime() < addDays(now, -45).getTime(),
        actionUrl: '/schedule',
        channel: null,
        sentAt: null,
        createdAt: lesson.cancelledAt ?? addHours(lesson.scheduledAt, -5),
      });
    }

    if (lesson.status === LessonStatus.RESCHEDULE_PENDING) {
      notificationRows.push({
        userId: lesson.userId,
        studentId: lesson.studentId,
        lessonId: lesson.id,
        bookingRequestId: null,
        type: NotificationType.RESCHEDULE_REQUESTED,
        title: 'Запрос на перенос',
        description:
          `${fallbackMessage(studentNameById.get(lesson.studentId), 'Ученик')} · новое время: ` +
          `${lesson.rescheduleNewTime ? lesson.rescheduleNewTime.toISOString().slice(0, 16).replace('T', ' ') : 'не задано'}`,
        read: false,
        actionUrl: '/schedule',
        channel: null,
        sentAt: null,
        createdAt: addHours(lesson.scheduledAt, -2),
      });
    }
  }

  for (const hw of homeworkRecords.slice(0, 60)) {
    if (hw.status === HomeworkStatus.COMPLETED) {
      notificationRows.push({
        userId: studentsById.get(hw.studentId)!.userId,
        studentId: hw.studentId,
        lessonId: hw.lessonId,
        bookingRequestId: null,
        type: NotificationType.HOMEWORK_SUBMITTED,
        title: 'Домашнее задание сдано',
        description: `${fallbackMessage(studentNameById.get(hw.studentId), 'Ученик')} · ${hw.task}`,
        read: hw.createdAt.getTime() < addDays(now, -30).getTime(),
        actionUrl: '/students',
        channel: null,
        sentAt: null,
        createdAt: addHours(hw.createdAt, 1),
      });
    }
  }

  for (const pkg of packageRecords) {
    if (!pkg.studentId || !pkg.validUntil) {
      continue;
    }

    if (pkg.validUntil.getTime() <= addDays(now, 21).getTime()) {
      notificationRows.push({
        userId: pkg.userId,
        studentId: pkg.studentId,
        lessonId: null,
        bookingRequestId: null,
        type: NotificationType.PACKAGE_EXPIRING,
        title: 'Пакет скоро истекает',
        description:
          `${fallbackMessage(studentNameById.get(pkg.studentId), 'Ученик')} · ${pkg.subject} · ` +
          `${pkg.lessonsUsed}/${pkg.lessonsTotal} использовано`,
        read: false,
        actionUrl: '/packages',
        channel: null,
        sentAt: null,
        createdAt: addDays(pkg.validUntil, -14),
      });
    }
  }

  for (const booking of bookingRecords) {
    const mapType: Record<BookingStatus, NotificationType | null> = {
      PENDING: NotificationType.BOOKING_NEW,
      CONFIRMED: NotificationType.BOOKING_CONFIRMED,
      REJECTED: NotificationType.BOOKING_REJECTED,
      CANCELLED: null,
    };

    const type = mapType[booking.status];
    if (!type) {
      continue;
    }

    notificationRows.push({
      userId: booking.userId,
      studentId: null,
      lessonId: null,
      bookingRequestId: booking.id,
      type,
      title:
        type === NotificationType.BOOKING_NEW
          ? 'Новая заявка на урок'
          : type === NotificationType.BOOKING_CONFIRMED
            ? 'Заявка подтверждена'
            : 'Заявка отклонена',
      description: `${booking.clientName} · ${booking.subject} · ${booking.startTime}`,
      read: type !== NotificationType.BOOKING_NEW,
      actionUrl: '/schedule?tab=bookings',
      channel: null,
      sentAt: null,
      createdAt: addHours(booking.date, 8),
    });
  }

  notificationRows.push({
    userId: alphaTutor.id,
    studentId: null,
    lessonId: null,
    bookingRequestId: null,
    type: NotificationType.SYSTEM,
    title: 'Сводка за 2 года готова',
    description: 'В демо-аккаунте доступны полные данные по урокам, финансам, ДЗ и файлам.',
    read: false,
    actionUrl: '/dashboard',
    channel: null,
    sentAt: null,
    createdAt: addHours(now, -2),
  });

  notificationRows.push({
    userId: betaTutor.id,
    studentId: null,
    lessonId: null,
    bookingRequestId: null,
    type: NotificationType.SYSTEM,
    title: 'Обновлены метрики Speaking Club',
    description: 'Проверьте посещаемость, просрочки и рекомендации по абонементам.',
    read: false,
    actionUrl: '/dashboard',
    channel: null,
    sentAt: null,
    createdAt: addHours(now, -1),
  });

  await prisma.notification.createMany({ data: notificationRows });

  const auditRows: Prisma.AuditLogUncheckedCreateInput[] = [];

  for (const tutor of [alphaTutor, betaTutor]) {
    auditRows.push({
      userId: tutor.id,
      action: 'PROFILE_UPDATED',
      entity: 'users',
      entityId: tutor.id,
      details: toJsonValue({ source: 'demo-seed', scope: 'profile+integrations' }),
      ip: '127.0.0.1',
      createdAt: addDays(now, -180),
    });

    auditRows.push({
      userId: tutor.id,
      action: 'AVAILABILITY_SYNC',
      entity: 'tutor_availability',
      entityId: tutor.id,
      details: toJsonValue({ source: 'demo-seed', slots: availabilityRows.length }),
      ip: '127.0.0.1',
      createdAt: addDays(now, -30),
    });
  }

  for (const student of students) {
    auditRows.push({
      userId: student.userId,
      action: 'STUDENT_CREATED',
      entity: 'students',
      entityId: student.id,
      details: toJsonValue({
        source: 'demo-seed',
        subject: student.subject,
        status: student.status,
      }),
      ip: '127.0.0.1',
      createdAt: addDays(now, -550),
    });
  }

  await prisma.auditLog.createMany({ data: auditRows });

  for (const seed of tutorSeeds) {
    const tutor = tutorsByKey.get(seed.key);
    if (!tutor) {
      continue;
    }

    const completedCount = lessonRecords.filter(
      (item) => item.userId === tutor.id && item.status === LessonStatus.COMPLETED,
    ).length;

    await prisma.user.update({
      where: { id: tutor.id },
      data: {
        lessonsCount: completedCount,
        rating: seed.rating ? new Prisma.Decimal(seed.rating) : null,
      },
    });
  }

  console.log('Extended demo seed completed successfully.');
  console.log(`Tutors upserted: ${tutorSeeds.length}`);
  console.log(`Student accounts upserted: ${accountSeeds.length}`);
  console.log(`Students created: ${studentSeeds.length}`);
  console.log(`Availability slots created: ${availabilityRows.length}`);
  console.log(`Availability overrides created: ${overrideRows.length}`);
  console.log(`Lessons created: ${lessonRows.length}`);
  console.log(`Payments created: ${paymentRows.length}`);
  console.log(`Packages created: ${packageRows.length}`);
  console.log(`Booking requests created: ${bookingRows.length}`);
  console.log(`Homework created: ${homeworkRows.length}`);
  console.log(`Homework materials linked: ${homeworkMaterialRows.length}`);
  console.log(`Lesson notes created: ${lessonNoteRows.length}`);
  console.log(`Notifications created: ${notificationRows.length}`);
  console.log(`Audit logs created: ${auditRows.length}`);

  console.log('Tutor credentials:');
  for (const tutor of tutorSeeds) {
    console.log(`- ${tutor.email} / ${DEMO_PASSWORD}`);
  }

  console.log('Cross-tutor relation retained: demo.student.orlova@repeto.ru linked to alpha and beta.');
}

main()
  .catch((error) => {
    console.error('Extended demo production seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
