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

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let token: string;

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
  });

  describe('GET /api/dashboard/stats', () => {
    it('возвращает статистику', async () => {
      const res = await request(server)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        activeStudents: expect.any(Number),
        lessonsThisMonth: expect.any(Number),
        incomeThisMonth: expect.any(Number),
        totalDebt: expect.any(Number),
      });
    });

    it('без JWT → 401', async () => {
      await request(server).get('/api/dashboard/stats').expect(401);
    });
  });

  describe('GET /api/dashboard/today-lessons', () => {
    it('возвращает уроки на сегодня', async () => {
      const student = await createStudent(server, token);

      // Создаём урок на сегодня
      const today = new Date();
      today.setHours(today.getHours() + 2);
      await createLesson(server, token, student.id, {
        scheduledAt: today.toISOString(),
      });

      const res = await request(server)
        .get('/api/dashboard/today-lessons')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].student).toBeDefined();
    });
  });

  describe('GET /api/dashboard/debts', () => {
    it('возвращает должников', async () => {
      const student = await createStudent(server, token);

      // Создаём и завершаем урок (без оплаты = долг)
      const lesson = await createLesson(server, token, student.id);
      await request(server)
        .patch(`/api/lessons/${lesson.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      const res = await request(server)
        .get('/api/dashboard/debts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].balance).toBeLessThan(0);
    });
  });

  describe('GET /api/dashboard/recent-payments', () => {
    it('возвращает последние оплаты', async () => {
      const student = await createStudent(server, token);

      await request(server)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId: student.id, amount: 5000, method: 'SBP' })
        .expect(201);

      const res = await request(server)
        .get('/api/dashboard/recent-payments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/dashboard/income-chart', () => {
    it('возвращает данные графика', async () => {
      const res = await request(server)
        .get('/api/dashboard/income-chart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('фильтр по периоду', async () => {
      const res = await request(server)
        .get('/api/dashboard/income-chart?period=quarter')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
