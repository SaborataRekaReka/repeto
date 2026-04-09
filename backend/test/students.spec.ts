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

describe('Students (e2e)', () => {
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

  // ── CRUD ──

  describe('POST /api/students', () => {
    it('создаёт ученика', async () => {
      const res = await request(server)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Алексей Иванов', subject: 'Математика', rate: 2000 })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Алексей Иванов',
        subject: 'Математика',
        rate: 2000,
        status: 'ACTIVE',
      });
      expect(res.body.id).toBeDefined();
    });

    it('создаёт ученика с полными данными', async () => {
      const res = await request(server)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Мария',
          subject: 'Английский',
          rate: 1500,
          grade: '10 класс',
          phone: '+79001112233',
          email: 'maria@test.com',
          parentName: 'Ольга',
          parentPhone: '+79009998877',
          notes: 'Готовится к ЕГЭ',
        })
        .expect(201);

      expect(res.body.parentName).toBe('Ольга');
      expect(res.body.grade).toBe('10 класс');
    });

    it('без JWT → 401', async () => {
      await request(server)
        .post('/api/students')
        .send({ name: 'Тест', subject: 'Физика', rate: 1000 })
        .expect(401);
    });

    it('без обязательного поля → 400', async () => {
      await request(server)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Тест' }) // нет subject и rate
        .expect(400);
    });
  });

  describe('GET /api/students', () => {
    it('возвращает список учеников', async () => {
      await createStudent(server, token, { name: 'Ученик 1' });
      await createStudent(server, token, { name: 'Ученик 2' });

      const res = await request(server)
        .get('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
    });

    it('фильтрация по статусу', async () => {
      const student = await createStudent(server, token);
      // Архивируем ученика
      await request(server)
        .patch(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'ARCHIVED' })
        .expect(200);

      const res = await request(server)
        .get('/api/students?status=ACTIVE')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    it('поиск по имени', async () => {
      await createStudent(server, token, { name: 'Алексей' });
      await createStudent(server, token, { name: 'Борис' });

      const res = await request(server)
        .get('/api/students?search=Алексей')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Алексей');
    });

    it('пагинация', async () => {
      for (let i = 0; i < 3; i++) {
        await createStudent(server, token, { name: `Ученик ${i}` });
      }

      const res = await request(server)
        .get('/api/students?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(3);
      expect(res.body.pages).toBe(2);
    });
  });

  describe('GET /api/students/:id', () => {
    it('возвращает детали ученика', async () => {
      const student = await createStudent(server, token);

      const res = await request(server)
        .get(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.name).toBe(student.name);
      expect(res.body.balance).toBeDefined();
    });

    it('несуществующий ученик → 404', async () => {
      await request(server)
        .get('/api/students/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('чужой ученик → 403', async () => {
      const student = await createStudent(server, token);
      const other = await registerUser(server, { email: 'other@test.com' });

      await request(server)
        .get(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${other.accessToken}`)
        .expect(403);
    });
  });

  describe('PATCH /api/students/:id', () => {
    it('обновляет ученика', async () => {
      const student = await createStudent(server, token);

      const res = await request(server)
        .patch(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Новое Имя', rate: 3000 })
        .expect(200);

      expect(res.body.name).toBe('Новое Имя');
      expect(res.body.rate).toBe(3000);
    });

    it('изменяет статус', async () => {
      const student = await createStudent(server, token);

      const res = await request(server)
        .patch(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'PAUSED' })
        .expect(200);

      expect(res.body.status).toBe('PAUSED');
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('удаляет ученика', async () => {
      const student = await createStudent(server, token);

      await request(server)
        .delete(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(server)
        .get(`/api/students/${student.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ── Notes ──

  describe('Notes CRUD', () => {
    let studentId: string;

    beforeEach(async () => {
      const student = await createStudent(server, token);
      studentId = student.id;
    });

    it('создаёт и читает заметку', async () => {
      await request(server)
        .post(`/api/students/${studentId}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Хороший прогресс' })
        .expect(201);

      const res = await request(server)
        .get(`/api/students/${studentId}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].content).toBe('Хороший прогресс');
    });

    it('обновляет заметку', async () => {
      const note = await request(server)
        .post(`/api/students/${studentId}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Старый текст' })
        .expect(201);

      const res = await request(server)
        .patch(`/api/students/${studentId}/notes/${note.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Новый текст' })
        .expect(200);

      expect(res.body.content).toBe('Новый текст');
    });

    it('удаляет заметку', async () => {
      const note = await request(server)
        .post(`/api/students/${studentId}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Удалить' })
        .expect(201);

      await request(server)
        .delete(`/api/students/${studentId}/notes/${note.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });
  });

  // ── Homework ──

  describe('Homework CRUD', () => {
    let studentId: string;

    beforeEach(async () => {
      const student = await createStudent(server, token);
      studentId = student.id;
    });

    it('создаёт и читает домашку', async () => {
      await request(server)
        .post(`/api/students/${studentId}/homework`)
        .set('Authorization', `Bearer ${token}`)
        .send({ task: 'Решить задачи 1-10' })
        .expect(201);

      const res = await request(server)
        .get(`/api/students/${studentId}/homework`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].task).toBe('Решить задачи 1-10');
      expect(res.body.data[0].status).toBe('PENDING');
    });

    it('обновляет статус домашки', async () => {
      const hw = await request(server)
        .post(`/api/students/${studentId}/homework`)
        .set('Authorization', `Bearer ${token}`)
        .send({ task: 'Задача' })
        .expect(201);

      const res = await request(server)
        .patch(`/api/students/${studentId}/homework/${hw.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
    });

    it('удаляет домашку', async () => {
      const hw = await request(server)
        .post(`/api/students/${studentId}/homework`)
        .set('Authorization', `Bearer ${token}`)
        .send({ task: 'Удалить' })
        .expect(201);

      await request(server)
        .delete(`/api/students/${studentId}/homework/${hw.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });
  });

  // ── Portal link ──

  describe('Portal link', () => {
    it('генерирует и отзывает ссылку портала', async () => {
      const student = await createStudent(server, token);

      const genRes = await request(server)
        .post(`/api/students/${student.id}/portal-link`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(genRes.body.token).toBeDefined();
      expect(genRes.body.portalUrl).toContain(genRes.body.token);

      const revokeRes = await request(server)
        .delete(`/api/students/${student.id}/portal-link`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(revokeRes.body.portalToken).toBeNull();
    });
  });
});
