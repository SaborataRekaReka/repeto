import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed запрещён в production! Используйте миграции для начальных данных.');
  }

  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.bookingRequest.deleteMany();
  await prisma.availabilityOverride.deleteMany();
  await prisma.tutorAvailability.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.fileShare.deleteMany();
  await prisma.fileRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.lessonNote.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.package.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.student.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ── Create Demo Tutor ──
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const tutor = await prisma.user.create({
    data: {
      email: 'demo@repeto.ru',
      passwordHash,
      name: 'Демо Репетитор',
      phone: '+7 999 000-00-00',
      whatsapp: '+7 999 000-00-00',
      slug: 'demo-tutor',
      published: true,
      subjects: ['Математика', 'Английский', 'Физика', 'Русский язык'],
      subjectDetails: [
        { name: 'Математика', duration: 60, price: 2100 },
        { name: 'Английский', duration: 60, price: 1800 },
        { name: 'Физика', duration: 90, price: 2400 },
        { name: 'Русский язык', duration: 60, price: 1600 },
      ],
      aboutText:
        'Опытный репетитор по точным наукам и языкам. 10 лет опыта подготовки к ЕГЭ/ОГЭ. Индивидуальный подход, понятные объяснения, системная подготовка к экзаменам. Более 300 проведённых занятий.',
      tagline: 'Подготовка к ЕГЭ/ОГЭ по математике и физике',
      website: 'https://demo-tutor.ru',
      vk: 'https://vk.com/demo_tutor',
      format: 'both',
      offlineAddress: 'Москва, м. Тверская, ул. Тверская 12, офис 305',
      lessonsCount: 342,
      rating: 4.8,
      taxStatus: 'SOLE_TRADER',
      notificationSettings: {
        emailNotifications: true,
        lessonReminder: true,
        paymentReminder: true,
        homeworkSubmitted: true,
        bookingNew: true,
        reminderTime: 60,
      },
      cancelPolicySettings: {
        freeCancelHours: 24,
        lateCancelCharge: 50,
        noshowCharge: 100,
      },
    },
  });
  console.log(`  ✅ Tutor: ${tutor.email}`);

  // ── Create Students ──
  const studentsData = [
    {
      name: 'Иванов Пётр', subject: 'Математика', grade: '11', rate: 2100,
      status: 'ACTIVE' as const, phone: '+7 900 123-45-67', whatsapp: '+7 900 123-45-67',
      email: 'ivanov.petr@mail.ru',
      parentName: 'Иванова Мария', parentPhone: '+7 900 765-43-21', parentEmail: 'ivanova.m@mail.ru',
    },
    {
      name: 'Петрова Анна', subject: 'Английский', grade: '9', rate: 1800,
      status: 'ACTIVE' as const, phone: '+7 911 222-33-44', whatsapp: '+7 911 222-33-44',
      email: 'petrova.anna@gmail.com',
      parentName: 'Петров Алексей', parentPhone: '+7 911 555-66-77',
    },
    {
      name: 'Сидоров Максим', subject: 'Физика', grade: '10', rate: 2400,
      status: 'ACTIVE' as const, phone: '+7 925 111-22-33', whatsapp: '+7 925 111-22-33',
      email: 'sidorov.max@yandex.ru',
    },
    {
      name: 'Кузнецова Мария', subject: 'Русский язык', grade: '8', rate: 1600,
      status: 'ACTIVE' as const,
      parentName: 'Кузнецова Елена', parentPhone: '+7 903 444-55-66',
      parentEmail: 'kuznetsova.elena@mail.ru',
    },
    {
      name: 'Новиков Дмитрий', subject: 'Математика', grade: '11', rate: 2100,
      status: 'ACTIVE' as const, phone: '+7 916 333-44-55', whatsapp: '+7 916 333-44-55',
      parentName: 'Новикова Ольга', parentPhone: '+7 916 666-77-88',
    },
    {
      name: 'Козлова Дарья', subject: 'Английский', grade: 'Взрослый', rate: 2200,
      status: 'ACTIVE' as const, phone: '+7 926 999-00-11', whatsapp: '+7 926 999-00-11',
    },
    {
      name: 'Волков Артём', subject: 'Математика', grade: '9', rate: 2100,
      status: 'PAUSED' as const, phone: '+7 905 222-11-33',
      notes: 'На каникулах до мая',
    },
    {
      name: 'Лебедева Софья', subject: 'Физика', grade: '11', rate: 2400,
      status: 'ARCHIVED' as const, phone: '+7 917 888-77-66',
      notes: 'Поступила, занятия закончены',
    },
    {
      name: 'Морозов Егор', subject: 'Русский язык', grade: '7', rate: 1600,
      status: 'PAUSED' as const,
      parentName: 'Морозова Татьяна', parentPhone: '+7 903 111-99-88',
      notes: 'Перерыв по семейным обстоятельствам',
    },
  ];

  const students = await Promise.all(
    studentsData.map((s) =>
      prisma.student.create({
        data: {
          userId: tutor.id,
          ...s,
        },
      }),
    ),
  );
  console.log(`  ✅ Students: ${students.length}`);

  // Helper to get student by index
  const s = (idx: number) => students[idx];

  // ── Create Lessons ──
  const lessonsData = [
    { student: 0, subject: 'Математика', date: '31.03.2026T10:00', duration: 60, format: 'ONLINE' as const, status: 'COMPLETED' as const },
    { student: 1, subject: 'Английский', date: '31.03.2026T14:00', duration: 60, format: 'OFFLINE' as const, status: 'COMPLETED' as const },
    { student: 2, subject: 'Физика', date: '01.04.2026T09:00', duration: 90, format: 'ONLINE' as const, status: 'COMPLETED' as const },
    { student: 3, subject: 'Русский язык', date: '01.04.2026T15:00', duration: 60, format: 'OFFLINE' as const, status: 'COMPLETED' as const },
    { student: 0, subject: 'Математика', date: '02.04.2026T10:00', duration: 60, format: 'ONLINE' as const, status: 'COMPLETED' as const },
    { student: 4, subject: 'Математика', date: '02.04.2026T16:00', duration: 60, format: 'ONLINE' as const, status: 'COMPLETED' as const },
    { student: 1, subject: 'Английский', date: '03.04.2026T14:00', duration: 60, format: 'OFFLINE' as const, status: 'PLANNED' as const },
    { student: 0, subject: 'Математика', date: '03.04.2026T10:00', duration: 60, format: 'ONLINE' as const, status: 'PLANNED' as const },
    { student: 2, subject: 'Физика', date: '03.04.2026T16:00', duration: 90, format: 'ONLINE' as const, status: 'PLANNED' as const },
    { student: 3, subject: 'Русский язык', date: '04.04.2026T11:00', duration: 60, format: 'OFFLINE' as const, status: 'PLANNED' as const },
    { student: 0, subject: 'Математика', date: '07.04.2026T10:00', duration: 60, format: 'ONLINE' as const, status: 'PLANNED' as const },
    { student: 1, subject: 'Английский', date: '07.04.2026T14:00', duration: 60, format: 'OFFLINE' as const, status: 'PLANNED' as const },
    { student: 4, subject: 'Математика', date: '09.04.2026T16:00', duration: 60, format: 'ONLINE' as const, status: 'PLANNED' as const },
    { student: 2, subject: 'Физика', date: '10.04.2026T09:00', duration: 90, format: 'ONLINE' as const, status: 'PLANNED' as const },
    { student: 3, subject: 'Русский язык', date: '14.04.2026T15:00', duration: 60, format: 'OFFLINE' as const, status: 'PLANNED' as const },
    { student: 0, subject: 'Математика', date: '16.04.2026T10:00', duration: 60, format: 'ONLINE' as const, status: 'PLANNED' as const },
    { student: 1, subject: 'Английский', date: '17.04.2026T14:00', duration: 60, format: 'OFFLINE' as const, status: 'PLANNED' as const },
    { student: 4, subject: 'Математика', date: '23.04.2026T16:00', duration: 60, format: 'ONLINE' as const, status: 'PLANNED' as const },
    { student: 2, subject: 'Физика', date: '24.04.2026T09:00', duration: 90, format: 'ONLINE' as const, status: 'PLANNED' as const },
    { student: 3, subject: 'Русский язык', date: '25.04.2026T11:00', duration: 60, format: 'OFFLINE' as const, status: 'PLANNED' as const },
  ];

  const lessons = await Promise.all(
    lessonsData.map((l) =>
      prisma.lesson.create({
        data: {
          userId: tutor.id,
          studentId: s(l.student).id,
          subject: l.subject,
          scheduledAt: new Date(l.date),
          duration: l.duration,
          format: l.format,
          rate: s(l.student).rate,
          status: l.status,
        },
      }),
    ),
  );
  console.log(`  ✅ Lessons: ${lessons.length}`);

  // ── Create Payments ──
  const paymentsData = [
    { student: 2, amount: 4800, date: '02.04.2026', method: 'TRANSFER' as const, status: 'PAID' as const },
    { student: 1, amount: 3600, date: '01.04.2026', method: 'CASH' as const, status: 'PAID' as const },
    { student: 4, amount: 2100, date: '01.04.2026', method: 'TRANSFER' as const, status: 'PAID' as const },
    { student: 0, amount: 2100, date: '31.03.2026', method: 'TRANSFER' as const, status: 'PAID' as const },
    { student: 3, amount: 1600, date: '30.03.2026', method: 'CASH' as const, status: 'PAID' as const },
    { student: 0, amount: 4200, date: '28.03.2026', method: 'SBP' as const, status: 'PAID' as const },
    { student: 5, amount: 2200, date: '27.03.2026', method: 'TRANSFER' as const, status: 'PENDING' as const },
    { student: 1, amount: 3600, date: '25.03.2026', method: 'CASH' as const, status: 'PAID' as const },
    { student: 2, amount: 2400, date: '22.03.2026', method: 'SBP' as const, status: 'PAID' as const },
    { student: 3, amount: 3200, date: '20.03.2026', method: 'CASH' as const, status: 'OVERDUE' as const },
    { student: 4, amount: 4200, date: '18.03.2026', method: 'TRANSFER' as const, status: 'PAID' as const },
    { student: 5, amount: 2200, date: '15.03.2026', method: 'SBP' as const, status: 'OVERDUE' as const },
    { student: 0, amount: 2100, date: '14.03.2026', method: 'TRANSFER' as const, status: 'PAID' as const },
    { student: 2, amount: 4800, date: '10.03.2026', method: 'SBP' as const, status: 'PAID' as const },
    { student: 1, amount: 1800, date: '08.03.2026', method: 'CASH' as const, status: 'PAID' as const },
  ];

  const payments = await Promise.all(
    paymentsData.map((p) =>
      prisma.payment.create({
        data: {
          userId: tutor.id,
          studentId: s(p.student).id,
          amount: p.amount,
          date: new Date(p.date),
          method: p.method,
          status: p.status,
        },
      }),
    ),
  );
  console.log(`  ✅ Payments: ${payments.length}`);

  // ── Create Packages ──
  const packagesData = [
    { student: 0, subject: 'Математика', total: 8, used: 5, price: 16800, status: 'ACTIVE' as const, validUntil: '30.04.2026', created: '01.03.2026' },
    { student: 1, subject: 'Английский', total: 10, used: 10, price: 18000, status: 'COMPLETED' as const, validUntil: '15.03.2026', created: '15.01.2026' },
    { student: 2, subject: 'Физика', total: 8, used: 2, price: 19200, status: 'ACTIVE' as const, validUntil: '30.05.2026', created: '01.04.2026' },
    { student: 4, subject: 'Математика', total: 12, used: 7, price: 25200, status: 'ACTIVE' as const, validUntil: '15.05.2026', created: '15.02.2026' },
    { student: 3, subject: 'Русский язык', total: 8, used: 8, price: 12800, status: 'COMPLETED' as const, validUntil: '01.03.2026', created: '01.01.2026' },
    { student: 5, subject: 'Английский', total: 4, used: 1, price: 8800, status: 'ACTIVE' as const, validUntil: '15.06.2026', created: '15.04.2026' },
    { student: 6, subject: 'Математика', total: 8, used: 4, price: 16800, status: 'EXPIRED' as const, validUntil: '01.02.2026', created: '01.11.2025' },
  ];

  const packages = await Promise.all(
    packagesData.map((p) =>
      prisma.package.create({
        data: {
          userId: tutor.id,
          studentId: s(p.student).id,
          subject: p.subject,
          lessonsTotal: p.total,
          lessonsUsed: p.used,
          totalPrice: p.price,
          status: p.status,
          validUntil: p.validUntil ? new Date(p.validUntil) : null,
          createdAt: new Date(p.created),
        },
      }),
    ),
  );
  console.log(`  ✅ Packages: ${packages.length}`);

  // ── Create Notifications ──
  const notificationsData = [
    { type: 'PAYMENT_RECEIVED' as const, title: 'Оплата получена', description: 'Иванов Пётр оплатил 4 200 ₽ (СБП)', read: false, student: 0 },
    { type: 'LESSON_REMINDER' as const, title: 'Занятие через 1 час', description: 'Петрова Анна · Английский · 16:00', read: false, student: 1 },
    { type: 'PAYMENT_OVERDUE' as const, title: 'Просроченная оплата', description: 'Кузнецова Мария · Долг 3 200 ₽', read: false, student: 3 },
    { type: 'LESSON_CANCELLED' as const, title: 'Занятие отменено', description: 'Новиков Дмитрий отменил занятие 5 апреля', read: true, student: 4 },
    { type: 'PAYMENT_RECEIVED' as const, title: 'Оплата получена', description: 'Петрова Анна оплатила 3 600 ₽ (Наличные)', read: true, student: 1 },
    { type: 'HOMEWORK_SUBMITTED' as const, title: 'ДЗ сдано', description: 'Иванов Пётр сдал ДЗ по Математике', read: true, student: 0 },
    { type: 'LESSON_REMINDER' as const, title: 'Занятие завтра', description: 'Сидоров Максим · Физика · 10:00', read: true, student: 2 },
    { type: 'PAYMENT_OVERDUE' as const, title: 'Просроченная оплата', description: 'Козлова Дарья · Долг 2 200 ₽', read: true, student: 5 },
    { type: 'SYSTEM' as const, title: 'Обновление системы', description: 'Добавлен экспорт данных в CSV', read: true, student: null },
    { type: 'PAYMENT_RECEIVED' as const, title: 'Оплата получена', description: 'Сидоров Максим оплатил 4 800 ₽ (СБП)', read: true, student: 2 },
    { type: 'LESSON_CANCELLED' as const, title: 'Занятие отменено', description: 'Козлова Дарья отменила занятие 1 апреля', read: true, student: 5 },
    { type: 'PAYMENT_RECEIVED' as const, title: 'Оплата получена', description: 'Новиков Дмитрий оплатил 2 100 ₽ (Перевод)', read: true, student: 4 },
  ];

  const notifications = await Promise.all(
    notificationsData.map((n, i) =>
      prisma.notification.create({
        data: {
          userId: tutor.id,
          studentId: n.student !== null ? s(n.student).id : null,
          type: n.type,
          title: n.title,
          description: n.description,
          read: n.read,
          createdAt: new Date(Date.now() - i * 3600000), // stagger by 1 hour
        },
      }),
    ),
  );
  console.log(`  ✅ Notifications: ${notifications.length}`);

  // ── Create Lesson Notes ──
  const notesData = [
    { student: 0, content: 'Хорошо усвоил тему производных. Нужно повторить пределы.' },
    { student: 0, content: 'Решили 15 задач из сборника. Ошибки в тригонометрии.' },
    { student: 1, content: 'Прошли Present Perfect. Homework: exercises 5-10.' },
    { student: 2, content: 'Разбирали задачи на законы Ньютона. Нужна практика.' },
    { student: 3, content: 'Сочинение по "Войне и миру". Хорошая структура, работать над аргументацией.' },
  ];

  const notes = await Promise.all(
    notesData.map((n) =>
      prisma.lessonNote.create({
        data: {
          studentId: s(n.student).id,
          content: n.content,
        },
      }),
    ),
  );
  console.log(`  ✅ Notes: ${notes.length}`);

  // ── Create Homework ──
  const homeworkData = [
    { student: 0, task: 'Решить задачи №15-25 из сборника Ященко', status: 'PENDING' as const, dueAt: '07.04.2026' },
    { student: 0, task: 'Повторить формулы тригонометрии', status: 'COMPLETED' as const, dueAt: '03.04.2026' },
    { student: 1, task: 'Exercises 5-10, page 84', status: 'PENDING' as const, dueAt: '07.04.2026' },
    { student: 2, task: 'Задачи на законы Ньютона (файл в чате)', status: 'PENDING' as const, dueAt: '10.04.2026' },
    { student: 3, task: 'Сочинение: тема "Образ Наташи Ростовой"', status: 'OVERDUE' as const, dueAt: '01.04.2026' },
    { student: 4, task: 'Решить вариант ЕГЭ №12', status: 'COMPLETED' as const, dueAt: '02.04.2026' },
  ];

  const homework = await Promise.all(
    homeworkData.map((h) =>
      prisma.homework.create({
        data: {
          studentId: s(h.student).id,
          task: h.task,
          status: h.status,
          dueAt: h.dueAt ? new Date(h.dueAt) : null,
        },
      }),
    ),
  );
  console.log(`  ✅ Homework: ${homework.length}`);

  // ── Seed Tutor Availability (Mon–Fri, 09:00–12:00 & 14:00–18:00) ──
  const availabilitySlots: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
  for (let day = 0; day <= 4; day++) {
    // Morning block: 09:00–12:00 (6 half-hour slots)
    for (let h = 9; h < 12; h++) {
      availabilitySlots.push({ dayOfWeek: day, startTime: `${String(h).padStart(2, '0')}:00`, endTime: `${String(h).padStart(2, '0')}:30` });
      availabilitySlots.push({ dayOfWeek: day, startTime: `${String(h).padStart(2, '0')}:30`, endTime: `${String(h + 1 === 10 ? 10 : h + 1).toString().padStart(2, '0')}:00` });
    }
    // Afternoon block: 14:00–18:00 (8 half-hour slots)
    for (let h = 14; h < 18; h++) {
      availabilitySlots.push({ dayOfWeek: day, startTime: `${String(h).padStart(2, '0')}:00`, endTime: `${String(h).padStart(2, '0')}:30` });
      availabilitySlots.push({ dayOfWeek: day, startTime: `${String(h).padStart(2, '0')}:30`, endTime: `${String(h + 1).padStart(2, '0')}:00` });
    }
  }
  // Saturday: 10:00–14:00
  for (let h = 10; h < 14; h++) {
    availabilitySlots.push({ dayOfWeek: 5, startTime: `${String(h).padStart(2, '0')}:00`, endTime: `${String(h).padStart(2, '0')}:30` });
    availabilitySlots.push({ dayOfWeek: 5, startTime: `${String(h).padStart(2, '0')}:30`, endTime: `${String(h + 1).padStart(2, '0')}:00` });
  }

  await prisma.tutorAvailability.createMany({
    data: availabilitySlots.map((slot) => ({
      userId: tutor.id,
      ...slot,
    })),
  });
  console.log(`  ✅ Availability: ${availabilitySlots.length} slots (Mon-Fri 9-12 & 14-18, Sat 10-14)`);

  // ── Create Availability Overrides ──
  // Block full day April 9 (birthday) — block all normal slots
  const apr9Slots = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
  const apr9End   = ['09:30','10:00','10:30','11:00','11:30','12:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
  await prisma.availabilityOverride.createMany({
    data: apr9Slots.map((st, i) => ({
      userId: tutor.id,
      date: new Date('09.04.2026'),
      startTime: st,
      endTime: apr9End[i],
      isBlocked: true,
    })),
  });
  // Add Sunday April 12 — extra slots 10:00–14:00
  const apr12Slots = ['10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30'];
  const apr12End   = ['10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00'];
  await prisma.availabilityOverride.createMany({
    data: apr12Slots.map((st, i) => ({
      userId: tutor.id,
      date: new Date('12.04.2026'),
      startTime: st,
      endTime: apr12End[i],
      isBlocked: false,
    })),
  });
  console.log(`  ✅ Overrides: ${apr9Slots.length + apr12Slots.length} slots (Apr 9 blocked, Apr 12 added)`);

  // ── Create Booking Requests ──
  const bookingReq1 = await prisma.bookingRequest.create({
    data: {
      userId: tutor.id,
      subject: 'Математика',
      date: new Date('15.04.2026'),
      startTime: '10:00',
      duration: 60,
      clientName: 'Смирнова Екатерина',
      clientPhone: '+7 912 345-67-89',
      clientEmail: 'smirnova.ek@mail.ru',
      comment: 'Подготовка к ОГЭ, 9 класс',
      status: 'PENDING',
    },
  });
  const bookingReq2 = await prisma.bookingRequest.create({
    data: {
      userId: tutor.id,
      subject: 'Физика',
      date: new Date('18.04.2026'),
      startTime: '14:00',
      duration: 90,
      clientName: 'Григорьев Андрей',
      clientPhone: '+7 903 888-77-66',
      comment: 'Нужна помощь с механикой',
      status: 'PENDING',
    },
  });

  // Create BOOKING_NEW notifications for pending requests
  await prisma.notification.create({
    data: {
      userId: tutor.id,
      type: 'BOOKING_NEW',
      title: 'Новая заявка на занятие',
      description: 'Смирнова Екатерина · Математика · 15 апреля в 10:00 · Комментарий: Подготовка к ОГЭ, 9 класс',
      bookingRequestId: bookingReq1.id,
      read: false,
      createdAt: new Date(Date.now() - 1800000),
    },
  });
  await prisma.notification.create({
    data: {
      userId: tutor.id,
      type: 'BOOKING_NEW',
      title: 'Новая заявка на занятие',
      description: 'Григорьев Андрей · Физика · 18 апреля в 14:00 · Комментарий: Нужна помощь с механикой',
      bookingRequestId: bookingReq2.id,
      read: false,
      createdAt: new Date(Date.now() - 900000),
    },
  });
  console.log(`  ✅ Booking requests: 2 (PENDING) with notifications`);

  console.log('\n✅ Seed completed successfully!');
  console.log(`\n📧 Login credentials:`);
  console.log(`   Email: demo@repeto.ru`);
  console.log(`   Password: demo1234`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
