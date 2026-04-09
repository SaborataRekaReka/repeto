import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI, createStudentAPI } from './helpers';

const API = 'http://127.0.0.1:3200/api';

test.describe('Портал ученика', () => {
  let portalToken: string;
  let tutorSlug: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const email = uniqueEmail();
    tutorSlug = `pw-portal-${Date.now()}`;
    const auth = await registerViaAPI(page, { email, password: 'TestPortal123!', name: 'Тест Портал' });

    // Публикуем профиль со slug
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      data: {
        slug: tutorSlug,
        published: true,
        subjects: ['Математика'],
        subjectDetails: [{ name: 'Математика', duration: 60, price: 2000 }],
      },
    });

    const student = await createStudentAPI(page, auth.accessToken, { name: 'Портальный Ученик' });

    // Генерируем портальную ссылку
    const res = await page.request.post(`${API}/students/${student.id}/portal-link`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    const body = await res.json();
    portalToken = body.token;

    // Создаём урок для контента
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);
    await page.request.post(`${API}/lessons`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      data: {
        studentId: student.id,
        subject: 'Математика',
        scheduledAt: tomorrow.toISOString(),
        duration: 60,
        rate: 2000,
        format: 'ONLINE',
      },
    });

    await ctx.close();
  });

  test('портал отображает данные ученика', async ({ page }) => {
    await page.goto(`/t/${tutorSlug}/s/${portalToken}`);

    // Ждём загрузки — портал показывает вкладки: Занятия, Домашка, Материалы, Оплата
    await expect(page.locator('body')).toContainText(/Занятия|Домашка|Расписание|Портальный Ученик/i, {
      timeout: 10_000,
    });
  });

  test('невалидный токен → ошибка', async ({ page }) => {
    await page.goto(`/t/${tutorSlug}/s/invalid-token-${Date.now()}`);
    // Портал показывает "Ссылка недействительна"
    await expect(page.locator('body')).toContainText(/Ссылка недействительна|не найден|404/i, {
      timeout: 10_000,
    });
  });
});
