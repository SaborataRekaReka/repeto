import * as request from 'supertest';
import {
  setupTestApp,
  teardownTestApp,
  cleanDatabase,
  registerUser,
  loginUser,
  getRefreshTokenValue,
} from './setup';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;

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
  });

  // ── Register ──

  describe('POST /api/auth/register', () => {
    it('регистрирует нового пользователя', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Иван Петров',
          email: 'ivan@test.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user).toMatchObject({
        email: 'ivan@test.com',
        name: 'Иван Петров',
      });
      expect(res.body.user.passwordHash).toBeUndefined();
      // refresh cookie
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('регистрация с телефоном', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Мария',
          email: 'maria@test.com',
          password: 'password123',
          phone: '+79001234567',
        })
        .expect(201);

      expect(res.body.user.phone).toBe('+79001234567');
    });

    it('отклоняет дублирующий email', async () => {
      await registerUser(server, { email: 'dup@test.com' });

      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Кто-то',
          email: 'dup@test.com',
          password: 'password123',
        })
        .expect(409);
    });

    it('отклоняет короткий пароль', async () => {
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Тест',
          email: 'short@test.com',
          password: '123',
        })
        .expect(400);
    });

    it('отклоняет невалидный email', async () => {
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Тест',
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('отклоняет лишние поля (forbidNonWhitelisted)', async () => {
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Тест',
          email: 'extra@test.com',
          password: 'password123',
          isAdmin: true,
        })
        .expect(400);
    });
  });

  // ── Login ──

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await registerUser(server, {
        email: 'login@test.com',
        password: 'password123',
      });
    });

    it('логин с верным паролем', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'password123' })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('login@test.com');
    });

    it('логин с неверным паролем → 401', async () => {
      await request(server)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'wrongpass123' })
        .expect(401);
    });

    it('логин с несуществующим email → 401', async () => {
      await request(server)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' })
        .expect(401);
    });

    it('email нечувствителен к регистру', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'LOGIN@TEST.COM', password: 'password123' })
        .expect(200);

      expect(res.body.user.email).toBe('login@test.com');
    });
  });

  // ── Refresh ──

  describe('POST /api/auth/refresh', () => {
    it('обновляет access token по refresh cookie', async () => {
      const { refreshCookie } = await registerUser(server);

      const res = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie)
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
    });

    it('отклоняет запрос без refresh cookie → 401', async () => {
      await request(server).post('/api/auth/refresh').expect(401);
    });

    it('отклоняет невалидный refresh token → 401', async () => {
      await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', 'refresh_token=invalid-token-value')
        .expect(401);
    });
  });

  // ── Logout ──

  describe('POST /api/auth/logout', () => {
    it('выход с очисткой refresh cookie', async () => {
      const { accessToken, refreshCookie } = await registerUser(server);

      const res = await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshCookie)
        .expect(204);

      // Cookie должен быть очищен
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
    });

    it('logout без JWT → 401', async () => {
      await request(server).post('/api/auth/logout').expect(401);
    });
  });

  // ── Me ──

  describe('GET /api/auth/me', () => {
    it('возвращает текущего пользователя', async () => {
      const { accessToken, user } = await registerUser(server, {
        name: 'Me Test',
        email: 'me@test.com',
      });

      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(user.id);
      expect(res.body.email).toBe('me@test.com');
      expect(res.body.name).toBe('Me Test');
    });

    it('без JWT → 401', async () => {
      await request(server).get('/api/auth/me').expect(401);
    });

    it('с невалидным JWT → 401', async () => {
      await request(server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });
  });

  // ── Forgot / Reset password ──

  describe('POST /api/auth/forgot-password', () => {
    it('возвращает 200 даже для несуществующего email', async () => {
      await request(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'noone@test.com' })
        .expect(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('возвращает 400 (функция не реализована)', async () => {
      await request(server)
        .post('/api/auth/reset-password')
        .send({ token: 'some-token', password: 'newpassword1' })
        .expect(400);
    });
  });
});
