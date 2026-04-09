import * as request from 'supertest';
import {
  setupTestApp,
  teardownTestApp,
  cleanDatabase,
  registerUser,
  createStudent,
} from './setup';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Finance (e2e)', () => {
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

  describe('GET /api/finance/stats', () => {
    it('возвращает финансовую статистику', async () => {
      const res = await request(server)
        .get('/api/finance/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        income: expect.any(Number),
        previousIncome: expect.any(Number),
        change: expect.any(Number),
        lessonsCount: expect.any(Number),
        paymentsCount: expect.any(Number),
      });
    });

    it('с периодом quarter', async () => {
      const res = await request(server)
        .get('/api/finance/stats?period=quarter')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.income).toBeDefined();
    });

    it('без JWT → 401', async () => {
      await request(server).get('/api/finance/stats').expect(401);
    });
  });

  describe('GET /api/finance/income-chart', () => {
    it('возвращает данные графика', async () => {
      const res = await request(server)
        .get('/api/finance/income-chart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/finance/payment-methods', () => {
    it('возвращает распределение по методам', async () => {
      const student = await createStudent(server, token);

      // Создаём оплаты разными методами
      await request(server)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId: student.id, amount: 5000, method: 'SBP' })
        .expect(201);
      await request(server)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId: student.id, amount: 3000, method: 'CASH' })
        .expect(201);

      const res = await request(server)
        .get('/api/finance/payment-methods')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/finance/balances', () => {
    it('возвращает балансы учеников', async () => {
      await createStudent(server, token);

      const res = await request(server)
        .get('/api/finance/balances')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeDefined();
    });
  });
});
