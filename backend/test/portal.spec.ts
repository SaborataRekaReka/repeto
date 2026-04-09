import * as request from 'supertest';
import {
  setupTestApp,
  teardownTestApp,
  cleanDatabase,
  registerUser,
  createStudent,
  createLesson,
} from './setup';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Portal (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let token: string;
  let studentId: string;
  let portalToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await setupTestApp());
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await teardownTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    const auth = await registerUser(server);
    token = auth.accessToken;
    const student = await createStudent(server, token);
    studentId = student.id;

    // Генерируем портальную ссылку
    const res = await request(server)
      .post(`/api/students/${studentId}/portal-link`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    portalToken = res.body.token;
  });

  describe('GET /api/portal/:token', () => {
    it('возвращает данные портала', async () => {
      const res = await request(server)
        .get(`/api/portal/${portalToken}`)
        .expect(200);

      expect(res.body.studentName).toBeDefined();
      expect(res.body.tutorName).toBeDefined();
      expect(res.body.balance).toBeDefined();
      expect(res.body.upcomingLessons).toBeDefined();
      expect(res.body.homework).toBeDefined();
    });

    it('невалидный токен → 404', async () => {
      await request(server)
        .get('/api/portal/invalid-token-value')
        .expect(404);
    });
  });

  describe('POST /api/portal/:token/lessons/:lessonId/cancel', () => {
    it('отменяет урок через портал', async () => {
      const lesson = await createLesson(server, token, studentId);

      const res = await request(server)
        .post(`/api/portal/${portalToken}/lessons/${lesson.id}/cancel`)
        .expect(201);

      expect(res.body.status).toBe('CANCELLED_STUDENT');
      expect(res.body.cancelledAt).toBeDefined();
    });

    it('невалидный токен → 404', async () => {
      const lesson = await createLesson(server, token, studentId);

      await request(server)
        .post(`/api/portal/bad-token/lessons/${lesson.id}/cancel`)
        .expect(404);
    });

    it('чужой урок → 403', async () => {
      // Создаём другого ученика и его урок
      const other = await createStudent(server, token, {
        name: 'Другой',
        subject: 'Физика',
      });
      const lesson = await createLesson(server, token, other.id, {
        subject: 'Физика',
      });

      await request(server)
        .post(`/api/portal/${portalToken}/lessons/${lesson.id}/cancel`)
        .expect(403);
    });
  });

  describe('PATCH /api/portal/:token/homework/:homeworkId', () => {
    it('отмечает домашку выполненной/невыполненной', async () => {
      // Создаём домашку
      const hw = await request(server)
        .post(`/api/students/${studentId}/homework`)
        .set('Authorization', `Bearer ${token}`)
        .send({ task: 'Портальная задача' })
        .expect(201);

      // Отмечаем выполненной
      const doneRes = await request(server)
        .patch(`/api/portal/${portalToken}/homework/${hw.body.id}`)
        .send({ done: true })
        .expect(200);

      expect(doneRes.body.status).toBe('COMPLETED');

      // Снимаем отметку
      const undoneRes = await request(server)
        .patch(`/api/portal/${portalToken}/homework/${hw.body.id}`)
        .send({ done: false })
        .expect(200);

      expect(undoneRes.body.status).toBe('PENDING');
    });
  });
});
