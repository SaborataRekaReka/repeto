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

describe('Packages (e2e)', () => {
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

  async function createPackage(overrides?: Record<string, any>) {
    const res = await request(server)
      .post('/api/packages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        studentId,
        subject: 'Математика',
        lessonsTotal: 8,
        totalPrice: 16000,
        ...overrides,
      })
      .expect(201);
    return res.body;
  }

  describe('POST /api/packages', () => {
    it('создаёт пакет', async () => {
      const res = await request(server)
        .post('/api/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          subject: 'Математика',
          lessonsTotal: 8,
          totalPrice: 16000,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        studentId,
        subject: 'Математика',
        lessonsTotal: 8,
        totalPrice: 16000,
        lessonsUsed: 0,
        status: 'ACTIVE',
      });
    });

    it('с датой истечения', async () => {
      const validUntil = new Date(Date.now() + 30 * 86400000).toISOString();
      const res = await request(server)
        .post('/api/packages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          subject: 'Физика',
          lessonsTotal: 4,
          totalPrice: 8000,
          validUntil,
        })
        .expect(201);

      expect(res.body.validUntil).toBeDefined();
    });

    it('без JWT → 401', async () => {
      await request(server)
        .post('/api/packages')
        .send({
          studentId,
          subject: 'Тест',
          lessonsTotal: 4,
          totalPrice: 8000,
        })
        .expect(401);
    });
  });

  describe('GET /api/packages', () => {
    it('возвращает список пакетов', async () => {
      await createPackage();
      await createPackage({ subject: 'Физика' });

      const res = await request(server)
        .get('/api/packages')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('фильтрация по studentId', async () => {
      const student2 = await createStudent(server, token, {
        name: 'Другой',
        subject: 'Физика',
      });
      await createPackage();
      await createPackage({ studentId: student2.id, subject: 'Физика' });

      const res = await request(server)
        .get(`/api/packages?studentId=${studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/packages/:id', () => {
    it('возвращает детали пакета', async () => {
      const pkg = await createPackage();

      const res = await request(server)
        .get(`/api/packages/${pkg.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(pkg.id);
      expect(res.body.student).toBeDefined();
    });

    it('несуществующий → 404', async () => {
      await request(server)
        .get('/api/packages/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /api/packages/:id', () => {
    it('обновляет пакет', async () => {
      const pkg = await createPackage();

      const res = await request(server)
        .patch(`/api/packages/${pkg.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ totalPrice: 20000 })
        .expect(200);

      expect(res.body.totalPrice).toBe(20000);
    });
  });

  describe('DELETE /api/packages/:id', () => {
    it('удаляет пакет', async () => {
      const pkg = await createPackage();

      await request(server)
        .delete(`/api/packages/${pkg.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(server)
        .get(`/api/packages/${pkg.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
