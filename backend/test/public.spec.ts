import * as request from 'supertest';
import {
  setupTestApp,
  teardownTestApp,
  cleanDatabase,
  registerUser,
} from './setup';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Public (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let token: string;
  let userId: string;
  const slug = 'test-public-tutor';

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
    userId = auth.user.id;

    // Публикуем профиль
    await request(server)
      .patch('/api/settings/account')
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug,
        published: true,
        subjects: ['Математика'],
        subjectDetails: [{ name: 'Математика', duration: 60, price: 2000 }],
      })
      .expect(200);
  });

  describe('GET /api/public/tutors/:slug', () => {
    it('возвращает публичный профиль', async () => {
      const res = await request(server)
        .get(`/api/public/tutors/${slug}`)
        .expect(200);

      expect(res.body.slug).toBe(slug);
      expect(res.body.name).toBeDefined();
      expect(res.body.subjects).toBeDefined();
      expect(res.body.subjects[0].name).toBe('Математика');
    });

    it('несуществующий slug → 404', async () => {
      await request(server)
        .get('/api/public/tutors/non-existent-slug')
        .expect(404);
    });

    it('неопубликованный профиль → 404', async () => {
      await request(server)
        .patch('/api/settings/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ published: false })
        .expect(200);

      await request(server)
        .get(`/api/public/tutors/${slug}`)
        .expect(404);
    });
  });

  describe('GET /api/public/tutors/:slug/slots', () => {
    it('возвращает слоты (пусто без расписания)', async () => {
      const res = await request(server)
        .get(`/api/public/tutors/${slug}/slots`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('возвращает слоты с расписанием', async () => {
      // Устанавливаем расписание
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayOfWeek = tomorrow.getDay() === 0 ? 6 : tomorrow.getDay() - 1;

      await request(server)
        .put('/api/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slots: [
            { dayOfWeek, startTime: '10:00', endTime: '10:30' },
            { dayOfWeek, startTime: '10:30', endTime: '11:00' },
          ],
        })
        .expect(200);

      const from = tomorrow.toISOString().split('T')[0];
      const to = new Date(tomorrow.getTime() + 86400000)
        .toISOString()
        .split('T')[0];

      const res = await request(server)
        .get(`/api/public/tutors/${slug}/slots?from=${from}&to=${to}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // Должны быть слоты, если расписание совпадает
    });
  });

  describe('POST /api/public/tutors/:slug/book', () => {
    it('создаёт заявку на бронирование', async () => {
      // Настраиваем доступный слот
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayOfWeek = tomorrow.getDay() === 0 ? 6 : tomorrow.getDay() - 1;

      await request(server)
        .put('/api/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slots: [
            { dayOfWeek, startTime: '14:00', endTime: '14:30' },
          ],
        })
        .expect(200);

      const date = tomorrow.toISOString().split('T')[0];

      const res = await request(server)
        .post(`/api/public/tutors/${slug}/book`)
        .send({
          subject: 'Математика',
          date,
          startTime: '14:00',
          clientName: 'Клиент Тест',
          clientPhone: '+79001111111',
          clientEmail: 'client@test.com',
          comment: 'Пробный урок',
        })
        .expect(201);

      expect(res.body.clientName).toBe('Клиент Тест');
      expect(res.body.status).toBe('PENDING');

      // Проверяем, что создалось уведомление
      const notifs = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(notifs.body.data.length).toBeGreaterThanOrEqual(1);
      expect(notifs.body.data.some((n: any) => n.type === 'BOOKING_NEW')).toBe(
        true,
      );
    });

    it('занятое время → 400', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const date = tomorrow.toISOString().split('T')[0];

      // Нет расписания на это время
      await request(server)
        .post(`/api/public/tutors/${slug}/book`)
        .send({
          subject: 'Математика',
          date,
          startTime: '09:00',
          clientName: 'Тест',
          clientPhone: '+79009999999',
        })
        .expect(400);
    });
  });
});
