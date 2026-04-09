import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI } from './helpers';

const API = 'http://127.0.0.1:3200/api';

test.describe('Публичная страница + бронирование', () => {
  let slug: string;
  let token: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const email = uniqueEmail();
    slug = `pw-tutor-${Date.now()}`;
    const auth = await registerViaAPI(page, { email, password: 'TestPublic123!', name: 'Павел Публик' });
    token = auth.accessToken;

    // Публикуем профиль
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        slug,
        published: true,
        subjects: ['Математика'],
        subjectDetails: [{ name: 'Математика', duration: 60, price: 2000 }],
        tagline: 'Опытный тестовый репетитор',
      },
    });
    await ctx.close();
  });

  test('публичный профиль доступен без авторизации', async ({ page }) => {
    await page.goto(`/t/${slug}`);

    await expect(page.locator('body')).toContainText('Павел Публик', { timeout: 10_000 });
    await expect(page.locator('body')).toContainText('Математика');
  });

  test('несуществующий slug → 404 или пустая страница', async ({ page }) => {
    await page.goto(`/t/nonexistent-slug-${Date.now()}`);
    // Фронтенд рендерит "Репетитор не найден" для несуществующего slug
    await expect(page.locator('body')).toContainText(/Репетитор не найден|не найден|404|Not Found/i, {
      timeout: 10_000,
    });
  });
});
