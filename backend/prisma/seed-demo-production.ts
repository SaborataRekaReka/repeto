import {
  LessonFormat,
  LessonStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
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

interface TutorSeed {
  key: string;
  email: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  slug?: string | null;
  published: boolean;
  subjects: string[];
  subjectDetails?: Array<{ name: string; duration: number; price: number }> | null;
  aboutText?: string | null;
  tagline?: string | null;
  website?: string | null;
  vk?: string | null;
  format?: string | null;
  offlineAddress?: string | null;
  lessonsCount: number;
  rating: string | null;
  taxStatus: TaxStatus;
  notificationSettings?: Record<string, unknown> | null;
  cancelPolicySettings?: Record<string, unknown> | null;
}

interface StudentAccountSeed {
  key: string;
  email: string;
  name: string;
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
  rate: number;
  status: StudentStatus;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  notes?: string | null;
}

interface LessonSeed {
  tutorKey: string;
  studentKey: string;
  subject: string;
  scheduledAt: Date;
  duration: number;
  format: LessonFormat;
  status: LessonStatus;
  rate: number;
}

interface PaymentSeed {
  tutorKey: string;
  studentKey: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: Date;
  comment?: string | null;
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
    subjects: seed.subjects,
    subjectDetails: seed.subjectDetails ? toJsonValue(seed.subjectDetails) : Prisma.DbNull,
    aboutText: seed.aboutText ?? null,
    tagline: seed.tagline ?? null,
    website: seed.website ?? null,
    vk: seed.vk ?? null,
    format: seed.format ?? null,
    offlineAddress: seed.offlineAddress ?? null,
    lessonsCount: seed.lessonsCount,
    rating: ratingValue,
    taxStatus: seed.taxStatus,
    notificationSettings: seed.notificationSettings ? toJsonValue(seed.notificationSettings) : Prisma.DbNull,
    cancelPolicySettings: seed.cancelPolicySettings ? toJsonValue(seed.cancelPolicySettings) : Prisma.DbNull,
  };

  const updateData: Prisma.UserUpdateInput = {
    passwordHash,
    name: seed.name,
    phone: seed.phone ?? null,
    whatsapp: seed.whatsapp ?? null,
    slug: seed.slug ?? null,
    published: seed.published,
    subjects: seed.subjects,
    subjectDetails: seed.subjectDetails ? toJsonValue(seed.subjectDetails) : Prisma.DbNull,
    aboutText: seed.aboutText ?? null,
    tagline: seed.tagline ?? null,
    website: seed.website ?? null,
    vk: seed.vk ?? null,
    format: seed.format ?? null,
    offlineAddress: seed.offlineAddress ?? null,
    lessonsCount: seed.lessonsCount,
    rating: ratingValue,
    taxStatus: seed.taxStatus,
    notificationSettings: seed.notificationSettings ? toJsonValue(seed.notificationSettings) : Prisma.DbNull,
    cancelPolicySettings: seed.cancelPolicySettings ? toJsonValue(seed.cancelPolicySettings) : Prisma.DbNull,
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
      status: seed.status,
      emailVerifiedAt: seed.emailVerifiedAt ?? null,
      lastLoginAt: seed.lastLoginAt ?? null,
    },
    update: {
      name: seed.name,
      status: seed.status,
      emailVerifiedAt: seed.emailVerifiedAt ?? null,
      lastLoginAt: seed.lastLoginAt ?? null,
    },
  });
}

async function upsertStudent(seed: StudentSeed, tutorId: string, accountId: string | null): Promise<Student> {
  const existing = await prisma.student.findFirst({
    where: {
      userId: tutorId,
      name: seed.name,
      subject: seed.subject,
    },
    select: { id: true },
  });

  const createData: Prisma.StudentUncheckedCreateInput = {
    userId: tutorId,
    accountId,
    name: seed.name,
    subject: seed.subject,
    grade: seed.grade ?? null,
    rate: seed.rate,
    status: seed.status,
    phone: seed.phone ?? null,
    whatsapp: seed.whatsapp ?? null,
    email: seed.email ?? null,
    parentName: seed.parentName ?? null,
    parentPhone: seed.parentPhone ?? null,
    parentEmail: seed.parentEmail ?? null,
    notes: seed.notes ?? null,
  };

  const updateData: Prisma.StudentUncheckedUpdateInput = {
    accountId,
    grade: seed.grade ?? null,
    rate: seed.rate,
    status: seed.status,
    phone: seed.phone ?? null,
    whatsapp: seed.whatsapp ?? null,
    email: seed.email ?? null,
    parentName: seed.parentName ?? null,
    parentPhone: seed.parentPhone ?? null,
    parentEmail: seed.parentEmail ?? null,
    notes: seed.notes ?? null,
  };

  if (existing) {
    return prisma.student.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  return prisma.student.create({ data: createData });
}

async function upsertLesson(
  tutorId: string,
  studentId: string,
  seed: Omit<LessonSeed, 'tutorKey' | 'studentKey'>,
): Promise<void> {
  const existing = await prisma.lesson.findFirst({
    where: {
      userId: tutorId,
      studentId,
      subject: seed.subject,
      scheduledAt: seed.scheduledAt,
    },
    select: { id: true },
  });

  const createData: Prisma.LessonUncheckedCreateInput = {
    userId: tutorId,
    studentId,
    subject: seed.subject,
    scheduledAt: seed.scheduledAt,
    duration: seed.duration,
    format: seed.format,
    status: seed.status,
    rate: seed.rate,
  };

  const updateData: Prisma.LessonUncheckedUpdateInput = {
    duration: seed.duration,
    format: seed.format,
    status: seed.status,
    rate: seed.rate,
  };

  if (existing) {
    await prisma.lesson.update({
      where: { id: existing.id },
      data: updateData,
    });
    return;
  }

  await prisma.lesson.create({ data: createData });
}

async function upsertPayment(
  tutorId: string,
  studentId: string,
  seed: Omit<PaymentSeed, 'tutorKey' | 'studentKey'>,
): Promise<void> {
  const existing = await prisma.payment.findFirst({
    where: {
      userId: tutorId,
      studentId,
      amount: seed.amount,
      date: seed.date,
      method: seed.method,
    },
    select: { id: true },
  });

  const createData: Prisma.PaymentUncheckedCreateInput = {
    userId: tutorId,
    studentId,
    amount: seed.amount,
    method: seed.method,
    status: seed.status,
    date: seed.date,
    comment: seed.comment ?? null,
  };

  const updateData: Prisma.PaymentUncheckedUpdateInput = {
    status: seed.status,
    comment: seed.comment ?? null,
  };

  if (existing) {
    await prisma.payment.update({
      where: { id: existing.id },
      data: updateData,
    });
    return;
  }

  await prisma.payment.create({ data: createData });
}

async function main(): Promise<void> {
  ensureProductionSeedIsAllowed();

  console.log('Starting production-safe demo seed (upsert mode)...');

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
      subjects: ['Math', 'Physics', 'English'],
      subjectDetails: [
        { name: 'Math', duration: 60, price: 2300 },
        { name: 'Physics', duration: 90, price: 2500 },
        { name: 'English', duration: 60, price: 1900 },
      ],
      aboutText:
        'Structured prep for exams with clear progress tracking. 8+ years of tutoring and practical roadmap for each student.',
      tagline: 'Exam prep with measurable progress',
      website: 'https://demo-alpha.repeto.ru',
      vk: 'https://vk.com/demo_tutor_alpha',
      format: 'both',
      offlineAddress: 'Moscow, Tverskaya 12',
      lessonsCount: 186,
      rating: '4.9',
      taxStatus: TaxStatus.SOLE_TRADER,
      notificationSettings: {
        emailNotifications: true,
        lessonReminder: true,
        paymentReminder: true,
        reminderTime: 60,
      },
      cancelPolicySettings: {
        freeCancelHours: 12,
        lateCancelCharge: 50,
        noshowCharge: 100,
      },
    },
    {
      key: 'beta',
      email: 'demo.tutor.beta@repeto.ru',
      name: 'Demo Tutor Beta',
      phone: null,
      whatsapp: null,
      slug: 'demo-tutor-beta',
      published: true,
      subjects: ['English'],
      subjectDetails: [{ name: 'English', duration: 45, price: 1500 }],
      aboutText: null,
      tagline: null,
      website: null,
      vk: null,
      format: 'online',
      offlineAddress: null,
      lessonsCount: 38,
      rating: '4.4',
      taxStatus: TaxStatus.SELF_EMPLOYED,
      notificationSettings: {
        emailNotifications: false,
        lessonReminder: true,
        paymentReminder: false,
        reminderTime: 120,
      },
      cancelPolicySettings: null,
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
      status: StudentAccountStatus.ACTIVE,
      emailVerifiedAt: new Date('2026-04-20T09:00:00.000Z'),
      lastLoginAt: new Date('2026-04-21T18:30:00.000Z'),
    },
    {
      key: 'timur',
      email: 'demo.student.mironov@repeto.ru',
      name: 'Timur Mironov',
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

  const studentSeeds: StudentSeed[] = [
    {
      key: 'alina-alpha',
      tutorKey: 'alpha',
      accountKey: 'shared-alina',
      name: 'Alina Orlova',
      subject: 'Math',
      grade: '10',
      rate: 2300,
      status: StudentStatus.ACTIVE,
      phone: '+7 901 101-01-01',
      whatsapp: '+7 901 101-01-01',
      email: 'alina.orlova.family@mail.ru',
      parentName: 'Marina Orlova',
      parentPhone: '+7 901 101-01-02',
      parentEmail: 'marina.orlova@mail.ru',
      notes: 'Full profile. Preparing for final school exams.',
    },
    {
      key: 'artem-alpha',
      tutorKey: 'alpha',
      name: 'Artem Lee',
      subject: 'Physics',
      grade: '11',
      rate: 2500,
      status: StudentStatus.ACTIVE,
      phone: '+7 902 202-02-02',
      whatsapp: null,
      email: 'artem.lee@gmail.com',
      parentName: null,
      parentPhone: null,
      parentEmail: null,
      notes: 'Medium profile. Works without parent contacts.',
    },
    {
      key: 'pavel-alpha',
      tutorKey: 'alpha',
      name: 'Pavel Kim',
      subject: 'Math',
      grade: '8',
      rate: 1800,
      status: StudentStatus.PAUSED,
      phone: null,
      whatsapp: null,
      email: null,
      parentName: 'Olga Kim',
      parentPhone: '+7 903 303-03-03',
      parentEmail: null,
      notes: 'Minimal profile. Parent contact only.',
    },
    {
      key: 'sofia-alpha',
      tutorKey: 'alpha',
      name: 'Sofia Gorina',
      subject: 'English',
      grade: 'Adult',
      rate: 2000,
      status: StudentStatus.ARCHIVED,
      phone: null,
      whatsapp: null,
      email: 'sofia.gorina@outlook.com',
      parentName: null,
      parentPhone: null,
      parentEmail: null,
      notes: 'Archived profile with only email contact.',
    },
    {
      key: 'alina-beta',
      tutorKey: 'beta',
      accountKey: 'shared-alina',
      name: 'Alina Orlova',
      subject: 'English',
      grade: '10',
      rate: 1900,
      status: StudentStatus.ACTIVE,
      phone: null,
      whatsapp: '+7 901 101-01-01',
      email: null,
      parentName: 'Marina Orlova',
      parentPhone: '+7 901 101-01-02',
      parentEmail: null,
      notes: 'Shared account with alpha tutor (cross-tutor relation).',
    },
    {
      key: 'timur-beta',
      tutorKey: 'beta',
      accountKey: 'timur',
      name: 'Timur Mironov',
      subject: 'English',
      grade: '9',
      rate: 1700,
      status: StudentStatus.ACTIVE,
      phone: '+7 904 404-04-04',
      whatsapp: '+7 904 404-04-04',
      email: 'timur.mironov@student.mail',
      parentName: 'Nikita Mironov',
      parentPhone: '+7 904 404-04-05',
      parentEmail: 'nikita.mironov@mail.ru',
      notes: 'Near full profile + portal account invited.',
    },
    {
      key: 'eva-beta',
      tutorKey: 'beta',
      name: 'Eva Smirnova',
      subject: 'Speaking Club',
      grade: 'Adult',
      rate: 1400,
      status: StudentStatus.PAUSED,
      phone: null,
      whatsapp: '+7 905 505-05-05',
      email: null,
      parentName: null,
      parentPhone: null,
      parentEmail: null,
      notes: 'Paused profile with minimal contact data.',
    },
  ];

  const studentsByKey = new Map<string, Student>();
  for (const seed of studentSeeds) {
    const tutor = tutorsByKey.get(seed.tutorKey);
    if (!tutor) {
      throw new Error(`Tutor key not found: ${seed.tutorKey}`);
    }

    const accountId = seed.accountKey ? (accountsByKey.get(seed.accountKey)?.id ?? null) : null;
    const student = await upsertStudent(seed, tutor.id, accountId);
    studentsByKey.set(seed.key, student);
  }

  const lessonSeeds: LessonSeed[] = [
    {
      tutorKey: 'alpha',
      studentKey: 'alina-alpha',
      subject: 'Math',
      scheduledAt: new Date('2026-05-05T09:00:00.000Z'),
      duration: 60,
      format: LessonFormat.ONLINE,
      status: LessonStatus.COMPLETED,
      rate: 2300,
    },
    {
      tutorKey: 'alpha',
      studentKey: 'artem-alpha',
      subject: 'Physics',
      scheduledAt: new Date('2026-05-06T13:00:00.000Z'),
      duration: 90,
      format: LessonFormat.OFFLINE,
      status: LessonStatus.PLANNED,
      rate: 2500,
    },
    {
      tutorKey: 'alpha',
      studentKey: 'pavel-alpha',
      subject: 'Math',
      scheduledAt: new Date('2026-05-07T10:00:00.000Z'),
      duration: 60,
      format: LessonFormat.ONLINE,
      status: LessonStatus.CANCELLED_STUDENT,
      rate: 1800,
    },
    {
      tutorKey: 'beta',
      studentKey: 'alina-beta',
      subject: 'English',
      scheduledAt: new Date('2026-05-05T15:00:00.000Z'),
      duration: 60,
      format: LessonFormat.ONLINE,
      status: LessonStatus.COMPLETED,
      rate: 1900,
    },
    {
      tutorKey: 'beta',
      studentKey: 'timur-beta',
      subject: 'English',
      scheduledAt: new Date('2026-05-08T16:00:00.000Z'),
      duration: 45,
      format: LessonFormat.ONLINE,
      status: LessonStatus.PLANNED,
      rate: 1700,
    },
  ];

  for (const seed of lessonSeeds) {
    const tutor = tutorsByKey.get(seed.tutorKey);
    const student = studentsByKey.get(seed.studentKey);

    if (!tutor || !student) {
      throw new Error(`Lesson relation failed: tutor=${seed.tutorKey}, student=${seed.studentKey}`);
    }

    await upsertLesson(tutor.id, student.id, {
      subject: seed.subject,
      scheduledAt: seed.scheduledAt,
      duration: seed.duration,
      format: seed.format,
      status: seed.status,
      rate: seed.rate,
    });
  }

  const paymentSeeds: PaymentSeed[] = [
    {
      tutorKey: 'alpha',
      studentKey: 'alina-alpha',
      amount: 4600,
      method: PaymentMethod.TRANSFER,
      status: PaymentStatus.PAID,
      date: new Date('2026-05-02T10:00:00.000Z'),
      comment: 'Two lesson package paid.',
    },
    {
      tutorKey: 'alpha',
      studentKey: 'pavel-alpha',
      amount: 1800,
      method: PaymentMethod.SBP,
      status: PaymentStatus.OVERDUE,
      date: new Date('2026-05-01T10:00:00.000Z'),
      comment: 'Paused due to pending payment.',
    },
    {
      tutorKey: 'beta',
      studentKey: 'alina-beta',
      amount: 1900,
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
      date: new Date('2026-05-03T10:00:00.000Z'),
      comment: 'Single speaking lesson.',
    },
    {
      tutorKey: 'beta',
      studentKey: 'eva-beta',
      amount: 1400,
      method: PaymentMethod.TRANSFER,
      status: PaymentStatus.PENDING,
      date: new Date('2026-05-04T10:00:00.000Z'),
      comment: 'Awaiting transfer confirmation.',
    },
  ];

  for (const seed of paymentSeeds) {
    const tutor = tutorsByKey.get(seed.tutorKey);
    const student = studentsByKey.get(seed.studentKey);

    if (!tutor || !student) {
      throw new Error(`Payment relation failed: tutor=${seed.tutorKey}, student=${seed.studentKey}`);
    }

    await upsertPayment(tutor.id, student.id, {
      amount: seed.amount,
      method: seed.method,
      status: seed.status,
      date: seed.date,
      comment: seed.comment,
    });
  }

  console.log('Demo seed completed successfully.');
  console.log(`Tutors upserted: ${tutorSeeds.length}`);
  console.log(`Students upserted: ${studentSeeds.length}`);
  console.log(`Student accounts upserted: ${accountSeeds.length}`);
  console.log(`Lessons upserted: ${lessonSeeds.length}`);
  console.log(`Payments upserted: ${paymentSeeds.length}`);

  console.log('Tutor credentials:');
  for (const tutor of tutorSeeds) {
    console.log(`- ${tutor.email} / ${DEMO_PASSWORD}`);
  }

  console.log('Cross-tutor relation: demo.student.orlova@repeto.ru linked to two tutors.');
}

main()
  .catch((error) => {
    console.error('Demo production seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
