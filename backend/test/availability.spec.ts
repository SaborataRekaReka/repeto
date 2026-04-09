import * as request from 'supertest';
import {
  setupTestApp,
  teardownTestApp,
  cleanDatabase,
  registerUser,
} from './setup';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Availability (e2e)', () => {
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

  describe('GET /PUT /api/availability', () => {
    it('пустое расписание по умолчанию', async () => {
      const res = await request(server)
        .get('/api/availability')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('устанавливает недельное расписание', async () => {
      const slots = [
        { dayOfWeek: 0, startTime: '09:00', endTime: '09:30' },
        { dayOfWeek: 0, startTime: '09:30', endTime: '10:00' },
        { dayOfWeek: 2, startTime: '14:00', endTime: '14:30' },
      ];

      const res = await request(server)
        .put('/api/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({ slots })
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body[0].dayOfWeek).toBe(0);
    });

    it('PUT перезаписывает предыдущее расписание', async () => {
      await request(server)
        .put('/api/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slots: [
            { dayOfWeek: 0, startTime: '09:00', endTime: '10:00' },
            { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
          ],
        })
        .expect(200);

      const res = await request(server)
        .put('/api/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slots: [{ dayOfWeek: 4, startTime: '15:00', endTime: '16:00' }],
        })
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].dayOfWeek).toBe(4);
    });

    it('без JWT → 401', async () => {
      await request(server).get('/api/availability').expect(401);
    });
  });

  describe('Overrides', () => {
    it('блокирует конкретную дату', async () => {
      const date = '15.04.2026';

      await request(server)
        .put(`/api/availability/overrides/${date}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isBlocked: true })
        .expect(200);

      const res = await request(server)
        .get('/api/availability/overrides')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].date).toBe(date);
      expect(res.body[0].isBlocked).toBe(true);
    });

    it('устанавливает кастомные слоты на дату', async () => {
      const date = '16.04.2026';

      await request(server)
        .put(`/api/availability/overrides/${date}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          isBlocked: false,
          slots: [
            { startTime: '10:00', endTime: '12:00' },
            { startTime: '14:00', endTime: '16:00' },
          ],
        })
        .expect(200);

      const res = await request(server)
        .get('/api/availability/overrides')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].isBlocked).toBe(false);
      expect(res.body[0].slots).toHaveLength(2);
    });

    it('удаляет переопределение', async () => {
      const date = '17.04.2026';

      await request(server)
        .put(`/api/availability/overrides/${date}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isBlocked: true })
        .expect(200);

      await request(server)
        .delete(`/api/availability/overrides/${date}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const res = await request(server)
        .get('/api/availability/overrides')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });
});
