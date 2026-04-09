import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

let app: INestApplication;
let prisma: PrismaService;

export async function setupTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  prisma = app.get(PrismaService);

  return { app, prisma };
}

export async function teardownTestApp() {
  if (app) {
    await app.close();
  }
}

/** Удаляет все данные из всех таблиц (порядок учитывает FK) */
export async function cleanDatabase(prisma: PrismaService) {
  await prisma.$transaction([
    prisma.fileShare.deleteMany(),
    prisma.fileRecord.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.bookingRequest.deleteMany(),
    prisma.homework.deleteMany(),
    prisma.lessonNote.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.package.deleteMany(),
    prisma.student.deleteMany(),
    prisma.availabilityOverride.deleteMany(),
    prisma.tutorAvailability.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/** Регистрирует пользователя и возвращает accessToken + user */
export async function registerUser(
  server: any,
  data?: Partial<{
    name: string;
    email: string;
    password: string;
    phone: string;
  }>,
) {
  const payload = {
    name: data?.name ?? 'Test Tutor',
    email: data?.email ?? `test-${Date.now()}@repeto.test`,
    password: data?.password ?? 'password123',
    phone: data?.phone,
  };

  const res = await request(server)
    .post('/api/auth/register')
    .send(payload)
    .expect(201);

  return {
    accessToken: res.body.accessToken as string,
    user: res.body.user as { id: string; email: string; name: string },
    refreshCookie: extractRefreshCookie(res),
  };
}

/** Логин и возврат токенов */
export async function loginUser(
  server: any,
  email: string,
  password: string,
) {
  const res = await request(server)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: res.body.accessToken as string,
    user: res.body.user,
    refreshCookie: extractRefreshCookie(res),
  };
}

/** Создаёт ученика и возвращает его */
export async function createStudent(
  server: any,
  token: string,
  data?: Partial<{
    name: string;
    subject: string;
    rate: number;
    grade: string;
    phone: string;
    email: string;
  }>,
) {
  const payload = {
    name: data?.name ?? 'Алексей Иванов',
    subject: data?.subject ?? 'Математика',
    rate: data?.rate ?? 2000,
    grade: data?.grade,
    phone: data?.phone,
    email: data?.email,
  };

  const res = await request(server)
    .post('/api/students')
    .set('Authorization', `Bearer ${token}`)
    .send(payload)
    .expect(201);

  return res.body;
}

/** Создаёт урок и возвращает его */
export async function createLesson(
  server: any,
  token: string,
  studentId: string,
  data?: Partial<{
    subject: string;
    scheduledAt: string;
    duration: number;
    rate: number;
    format: string;
  }>,
) {
  const payload = {
    studentId,
    subject: data?.subject ?? 'Математика',
    scheduledAt:
      data?.scheduledAt ?? new Date(Date.now() + 86400000).toISOString(),
    duration: data?.duration ?? 60,
    rate: data?.rate ?? 2000,
    format: data?.format ?? 'ONLINE',
  };

  const res = await request(server)
    .post('/api/lessons')
    .set('Authorization', `Bearer ${token}`)
    .send(payload)
    .expect(201);

  return res.body;
}

/** Извлекает refresh_token из Set-Cookie */
function extractRefreshCookie(res: request.Response): string {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return '';
  const arr = Array.isArray(cookies) ? cookies : [cookies];
  const rt = arr.find((c: string) => c.startsWith('refresh_token='));
  if (!rt) return '';
  return rt;
}

/** Возвращает только значение refresh_token */
export function getRefreshTokenValue(cookie: string): string {
  const match = cookie.match(/refresh_token=([^;]+)/);
  return match ? match[1] : '';
}
