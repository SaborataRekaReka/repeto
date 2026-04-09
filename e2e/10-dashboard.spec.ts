import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI, loginAndGoto } from './helpers';

test.describe('Дашборд и уведомления', () => {
  let email: string;
  const password = 'TestDash123!';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    email = uniqueEmail();
    await registerViaAPI(page, { email, password, name: 'Тест Дашборд' });
    await ctx.close();
  });

  test('дашборд — карточки статистики видны', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    // Карточки: Активные ученики, Уроки, Доход, Долг
    await expect(page.locator('body')).toContainText(/Ученики|уроков|доход|Дашборд/i, {
      timeout: 10_000,
    });
  });

  test('уведомления — страница открывается', async ({ page }) => {
    await loginAndGoto(page, '/notifications', email, password);

    await expect(page.locator('body')).toContainText(/Уведомления|уведомлений/i, {
      timeout: 10_000,
    });
  });

  test('профиль — страница доступна', async ({ page }) => {
    await loginAndGoto(page, '/profile', email, password);

    await expect(page.locator('body')).toContainText(/Профиль|профиль|Тест Дашборд/i, {
      timeout: 10_000,
    });
  });
});
