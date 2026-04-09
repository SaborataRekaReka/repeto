import * as request from 'supertest';
import {
  setupTestApp,
  teardownTestApp,
  cleanDatabase,
  registerUser,
} from './setup';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let token: string;
  let userId: string;

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
  });

  async function createNotification(overrides?: Record<string, any>) {
    return prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Тестовое уведомление',
        description: 'Описание',
        ...overrides,
      },
    });
  }

  describe('GET /api/notifications', () => {
    it('возвращает список уведомлений', async () => {
      await createNotification();
      await createNotification({ title: 'Второе' });

      const res = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('фильтрация по типу', async () => {
      await createNotification({ type: 'SYSTEM' });
      await createNotification({ type: 'PAYMENT_RECEIVED' });

      const res = await request(server)
        .get('/api/notifications?type=SYSTEM')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('без JWT → 401', async () => {
      await request(server).get('/api/notifications').expect(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('возвращает количество непрочитанных', async () => {
      await createNotification();
      await createNotification({ read: true });
      await createNotification();

      const res = await request(server)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.count).toBe(2);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('помечает уведомление прочитанным', async () => {
      const notif = await createNotification();

      const res = await request(server)
        .patch(`/api/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.read).toBe(true);
    });

    it('несуществующее → 404', async () => {
      await request(server)
        .patch(
          '/api/notifications/00000000-0000-0000-0000-000000000000/read',
        )
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('помечает все непрочитанные прочитанными', async () => {
      await createNotification();
      await createNotification();

      await request(server)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const res = await request(server)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.count).toBe(0);
    });
  });

  describe('Booking confirm/reject', () => {
    let bookingNotifId: string;

    beforeEach(async () => {
      // Настраиваем slug и subjectDetails для confirmBooking
      await prisma.user.update({
        where: { id: userId },
        data: {
          slug: 'test-tutor',
          subjectDetails: [
            { name: 'Математика', price: 2000 },
          ],
        },
      });

      // Создаём BookingRequest
      const booking = await prisma.bookingRequest.create({
        data: {
          userId,
          subject: 'Математика',
          date: new Date('10.04.2026'),
          startTime: '14:00',
          duration: 60,
          clientName: 'Новый Клиент',
          clientPhone: '+79001234567',
          clientEmail: 'client@test.com',
          status: 'PENDING',
        },
      });

      // Создаём уведомление с bookingRequestId
      const notif = await prisma.notification.create({
        data: {
          userId,
          type: 'BOOKING_NEW',
          title: 'Новая заявка',
          description: 'Тест',
          bookingRequestId: booking.id,
        },
      });

      bookingNotifId = notif.id;
    });

    it('подтверждает заявку → создаёт ученика и урок', async () => {
      const res = await request(server)
        .post(`/api/notifications/${bookingNotifId}/confirm-booking`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body.status).toBe('CONFIRMED');
      expect(res.body.studentId).toBeDefined();
      expect(res.body.lessonId).toBeDefined();

      // Проверяем, что ученик создан
      const studentRes = await request(server)
        .get(`/api/students/${res.body.studentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(studentRes.body.name).toBe('Новый Клиент');

      // Проверяем, что урок создан
      const lessonRes = await request(server)
        .get(`/api/lessons/${res.body.lessonId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(lessonRes.body.subject).toBe('Математика');
    });

    it('отклоняет заявку', async () => {
      const res = await request(server)
        .post(`/api/notifications/${bookingNotifId}/reject-booking`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body.status).toBe('REJECTED');
    });

    it('повторное подтверждение → 400', async () => {
      await request(server)
        .post(`/api/notifications/${bookingNotifId}/confirm-booking`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      await request(server)
        .post(`/api/notifications/${bookingNotifId}/confirm-booking`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});
