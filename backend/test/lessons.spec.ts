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

describe('Lessons (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let token: string;
  let studentId: string;

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
  });

  // ── CRUD ──

  describe('POST /api/lessons', () => {
    it('создаёт урок', async () => {
      const scheduledAt = new Date(Date.now() + 86400000).toISOString();
      const res = await request(server)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          subject: 'Математика',
          scheduledAt,
          duration: 60,
          rate: 2000,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        studentId,
        subject: 'Математика',
        duration: 60,
        rate: 2000,
        status: 'PLANNED',
        format: 'ONLINE',
      });
    });

    it('создаёт серию уроков с recurrence', async () => {
      const from = new Date();
      from.setDate(from.getDate() + 1);
      const until = new Date();
      until.setDate(until.getDate() + 15);

      const res = await request(server)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          subject: 'Физика',
          scheduledAt: from.toISOString(),
          duration: 45,
          rate: 1500,
          recurrence: {
            enabled: true,
            until: until.toISOString(),
            weekdays: [1, 3, 5],
          },
        })
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      // Все уроки в одной группе
      const groupId = res.body[0].recurrenceGroupId;
      expect(groupId).toBeDefined();
      res.body.forEach((l: any) =>
        expect(l.recurrenceGroupId).toBe(groupId),
      );
    });

    it('без JWT → 401', async () => {
      await request(server)
        .post('/api/lessons')
        .send({
          studentId,
          subject: 'Тест',
          scheduledAt: new Date().toISOString(),
          duration: 60,
          rate: 1000,
        })
        .expect(401);
    });

    it('невалидные данные → 400', async () => {
      await request(server)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send({ subject: 'Тест' }) // нет studentId, scheduledAt, duration, rate
        .expect(400);
    });
  });

  describe('GET /api/lessons', () => {
    it('возвращает список уроков', async () => {
      await createLesson(server, token, studentId);
      await createLesson(server, token, studentId);

      const res = await request(server)
        .get('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    it('фильтр по studentId', async () => {
      const student2 = await createStudent(server, token, {
        name: 'Студент 2',
        subject: 'Физика',
      });
      await createLesson(server, token, studentId);
      await createLesson(server, token, student2.id, { subject: 'Физика' });

      const res = await request(server)
        .get(`/api/lessons?studentId=${studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].studentId).toBe(studentId);
    });

    it('фильтр по дате', async () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const nextWeek = new Date(Date.now() + 7 * 86400000);

      await createLesson(server, token, studentId, {
        scheduledAt: tomorrow.toISOString(),
      });
      await createLesson(server, token, studentId, {
        scheduledAt: nextWeek.toISOString(),
      });

      const from = new Date(Date.now());
      const to = new Date(Date.now() + 2 * 86400000);

      const res = await request(server)
        .get(
          `/api/lessons?from=${from.toISOString()}&to=${to.toISOString()}`,
        )
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/lessons/:id', () => {
    it('возвращает детали урока', async () => {
      const lesson = await createLesson(server, token, studentId);

      const res = await request(server)
        .get(`/api/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(lesson.id);
      expect(res.body.student).toBeDefined();
    });

    it('несуществующий → 404', async () => {
      await request(server)
        .get('/api/lessons/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /api/lessons/:id', () => {
    it('обновляет урок', async () => {
      const lesson = await createLesson(server, token, studentId);

      const res = await request(server)
        .patch(`/api/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ duration: 90, rate: 3000 })
        .expect(200);

      expect(res.body.duration).toBe(90);
      expect(res.body.rate).toBe(3000);
    });
  });

  describe('PATCH /api/lessons/:id/status', () => {
    it('меняет статус на COMPLETED', async () => {
      const lesson = await createLesson(server, token, studentId);

      const res = await request(server)
        .patch(`/api/lessons/${lesson.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
    });

    it('отмена учеником с причиной', async () => {
      const lesson = await createLesson(server, token, studentId);

      const res = await request(server)
        .patch(`/api/lessons/${lesson.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'CANCELLED_STUDENT',
          cancelReason: 'Болен',
        })
        .expect(200);

      expect(res.body.status).toBe('CANCELLED_STUDENT');
      expect(res.body.cancelReason).toBe('Болен');
      expect(res.body.cancelledAt).toBeDefined();
    });
  });

  describe('DELETE /api/lessons/:id', () => {
    it('удаляет одиночный урок', async () => {
      const lesson = await createLesson(server, token, studentId);

      await request(server)
        .delete(`/api/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(server)
        .get(`/api/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('удаление серии (deleteRecurrence)', async () => {
      const from = new Date();
      from.setDate(from.getDate() + 1);
      const until = new Date();
      until.setDate(until.getDate() + 15);

      const lessons = await request(server)
        .post('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          subject: 'Серия',
          scheduledAt: from.toISOString(),
          duration: 60,
          rate: 1000,
          recurrence: {
            enabled: true,
            until: until.toISOString(),
            weekdays: [1, 2, 3, 4, 5],
          },
        })
        .expect(201);

      const firstId = lessons.body[0].id;
      const totalBefore = lessons.body.length;

      await request(server)
        .delete(`/api/lessons/${firstId}?deleteRecurrence=true`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const remaining = await request(server)
        .get('/api/lessons')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(remaining.body.length).toBeLessThan(totalBefore);
    });
  });
});
