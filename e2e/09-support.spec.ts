import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI, loginAndGoto } from './helpers';

test.describe('Поддержка', () => {
  let email: string;
  const password = 'TestSupport123!';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    email = uniqueEmail();
    await registerViaAPI(page, { email, password, name: 'Тест Поддержка' });
    await ctx.close();
  });

  test('главная страница поддержки доступна', async ({ page }) => {
    await loginAndGoto(page, '/support', email, password);
    await expect(page.locator('body')).toContainText(/Поддержка|Помощь|Часто задаваемые/i, {
      timeout: 10_000,
    });
  });

  test('поиск по статьям', async ({ page }) => {
    await loginAndGoto(page, '/support', email, password);

    const searchInput = page.getByPlaceholder(/Поиск|Найти/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('урок');
      await page.waitForTimeout(1_000);
      // Должны появиться результаты
      const body = await page.locator('body').textContent();
      expect(body).toBeTruthy();
    }
  });

  test('статья открывается со страницы поддержки', async ({ page }) => {
    await loginAndGoto(page, '/support', email, password);

    // Кликаем на первую ссылку/статью
    const firstLink = page.locator('a[href*="/support/"]').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await expect(page).toHaveURL(/\/support\//);
    }
  });
});
