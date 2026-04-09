import * as request from 'supertest';
import {
  setupTestApp,
  teardownTestApp,
  cleanDatabase,
  registerUser,
} from './setup';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Settings (e2e)', () => {
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

  describe('GET /api/settings', () => {
    it('возвращает настройки', async () => {
      const res = await request(server)
        .get('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBeDefined();
      expect(res.body.hasYukassa).toBe(false);
      expect(res.body.yukassaShopId).toBeUndefined();
    });

    it('без JWT → 401', async () => {
      await request(server).get('/api/settings').expect(401);
    });
  });

  describe('PATCH /api/settings/account', () => {
    it('обновляет профиль', async () => {
      const res = await request(server)
        .patch('/api/settings/account')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Новое Имя',
          phone: '+79991234567',
          slug: 'my-slug',
          timezone: 'Asia/Novosibirsk',
        })
        .expect(200);

      expect(res.body.name).toBe('Новое Имя');
      expect(res.body.phone).toBe('+79991234567');
      expect(res.body.slug).toBe('my-slug');
      expect(res.body.timezone).toBe('Asia/Novosibirsk');
    });

    it('дублирующий slug → 400', async () => {
      // Второй пользователь занимает slug
      const auth2 = await registerUser(server, {
        email: 'other@test.com',
        password: 'password123',
        name: 'Другой',
      });

      await request(server)
        .patch('/api/settings/account')
        .set('Authorization', `Bearer ${auth2.accessToken}`)
        .send({ slug: 'taken-slug' })
        .expect(200);

      // Первый пользователь пытается взять тот же slug
      await request(server)
        .patch('/api/settings/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ slug: 'taken-slug' })
        .expect(400);
    });
  });

  describe('POST /api/settings/change-password', () => {
    it('успешная смена пароля', async () => {
      const res = await request(server)
        .post('/api/settings/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
        })
        .expect(201);

      expect(res.body.message).toBe('Password changed successfully');
    });

    it('неверный текущий пароль → 400', async () => {
      await request(server)
        .post('/api/settings/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrong-password',
          newPassword: 'newpassword456',
        })
        .expect(400);
    });
  });

  describe('PATCH /api/settings/notifications', () => {
    it('обновляет настройки уведомлений', async () => {
      const res = await request(server)
        .patch('/api/settings/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          channel: 'email',
          studentReminder: true,
          studentReminderHours: '2',
          selfReminder: true,
          selfReminderMins: '30',
          weeklyReport: true,
          reportDay: 'mon',
        })
        .expect(200);

      expect(res.body.notificationSettings).toBeDefined();
      expect(res.body.notificationSettings.channel).toBe('email');
    });
  });

  describe('PATCH /api/settings/policies', () => {
    it('обновляет политики', async () => {
      const res = await request(server)
        .patch('/api/settings/policies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cancelTimeHours: '12',
          lateCancelAction: 'full',
          noShowAction: 'full',
          defaultPaymentMethod: 'sbp',
          isSelfEmployed: true,
        })
        .expect(200);

      expect(res.body.cancelPolicySettings).toBeDefined();
      expect(res.body.cancelPolicySettings.cancelTimeHours).toBe('12');
    });
  });

  describe('Integrations', () => {
    it('подключает ЮKassa', async () => {
      const res = await request(server)
        .post('/api/settings/integrations/yukassa')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shopId: '123456',
          secretKey: 'test_secret_key',
        })
        .expect(201);

      expect(res.body.yukassaShopId).toBe('123456');

      // Проверяем в настройках
      const settings = await request(server)
        .get('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(settings.body.hasYukassa).toBe(true);
    });

    it('отключает ЮKassa', async () => {
      // Подключаем
      await request(server)
        .post('/api/settings/integrations/yukassa')
        .set('Authorization', `Bearer ${token}`)
        .send({ shopId: '123456', secretKey: 'test_secret_key' })
        .expect(201);

      // Отключаем
      await request(server)
        .delete('/api/settings/integrations/yukassa')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const settings = await request(server)
        .get('/api/settings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(settings.body.hasYukassa).toBe(false);
    });

    it('неизвестная интеграция → 400', async () => {
      await request(server)
        .delete('/api/settings/integrations/unknown-service')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('DELETE /api/settings/account', () => {
    it('удаляет аккаунт', async () => {
      await request(server)
        .delete('/api/settings/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'password123' })
        .expect(200);

      // Логин больше не работает
      await request(server)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' })
        .expect(401);
    });

    it('неверный пароль → 400', async () => {
      await request(server)
        .delete('/api/settings/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'wrong-password' })
        .expect(400);
    });
  });
});
