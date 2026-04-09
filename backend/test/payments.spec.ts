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

describe('Payments (e2e)', () => {
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

  async function createPayment(overrides?: Record<string, any>) {
    const res = await request(server)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId,
        amount: 5000,
        method: 'SBP',
        ...overrides,
      })
      .expect(201);
    return res.body;
  }

  describe('POST /api/payments', () => {
    it('создаёт платёж', async () => {
      const res = await request(server)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, amount: 5000, method: 'SBP' })
        .expect(201);

      expect(res.body).toMatchObject({
        studentId,
        amount: 5000,
        method: 'SBP',
        status: 'PAID',
      });
    });

    it('с комментарием и датой', async () => {
      const res = await request(server)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          amount: 3000,
          method: 'CASH',
          comment: 'За март',
          date: '2026-03-15T00:00:00.000Z',
        })
        .expect(201);

      expect(res.body.comment).toBe('За март');
      expect(res.body.method).toBe('CASH');
    });

    it('без JWT → 401', async () => {
      await request(server)
        .post('/api/payments')
        .send({ studentId, amount: 1000, method: 'SBP' })
        .expect(401);
    });

    it('невалидные данные → 400', async () => {
      await request(server)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1000 }) // нет studentId, method
        .expect(400);
    });
  });

  describe('GET /api/payments', () => {
    it('возвращает список платежей', async () => {
      await createPayment();
      await createPayment({ amount: 3000 });

      const res = await request(server)
        .get('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('фильтрация по методу', async () => {
      await createPayment({ method: 'CASH' });
      await createPayment({ method: 'SBP' });

      const res = await request(server)
        .get('/api/payments?method=CASH')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].method).toBe('CASH');
    });

    it('пагинация', async () => {
      await createPayment();
      await createPayment();
      await createPayment();

      const res = await request(server)
        .get('/api/payments?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(3);
      expect(res.body.pages).toBe(2);
    });
  });

  describe('GET /api/payments/:id', () => {
    it('возвращает детали платежа', async () => {
      const payment = await createPayment();

      const res = await request(server)
        .get(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(payment.id);
      expect(res.body.student).toBeDefined();
    });

    it('несуществующий → 404', async () => {
      await request(server)
        .get('/api/payments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /api/payments/:id', () => {
    it('обновляет платёж', async () => {
      const payment = await createPayment();

      const res = await request(server)
        .patch(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 7000, comment: 'Обновлён' })
        .expect(200);

      expect(res.body.amount).toBe(7000);
      expect(res.body.comment).toBe('Обновлён');
    });
  });

  describe('DELETE /api/payments/:id', () => {
    it('удаляет платёж', async () => {
      const payment = await createPayment();

      await request(server)
        .delete(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(server)
        .get(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('GET /api/payments/export', () => {
    it('экспортирует CSV', async () => {
      await createPayment({ comment: 'Тест экспорт' });

      const res = await request(server)
        .get('/api/payments/export')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Дата,Ученик,Сумма');
      expect(res.text).toContain('5000');
    });
  });
});
