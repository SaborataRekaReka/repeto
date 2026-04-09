import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI, loginAndGoto } from './helpers';

test.describe('Логин и навигация', () => {
  let email: string;
  let password: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    email = uniqueEmail();
    password = 'TestLogin123!';
    await registerViaAPI(page, { email, password });
    await ctx.close();
  });

  test('логин → редирект в дашборд', async ({ page }) => {
    await page.goto('/registration');
    await page.getByPlaceholder('Введите email или телефон').fill(email);
    await page.getByPlaceholder('Введите пароль').fill(password);
    await page.getByRole('button', { name: 'Войти' }).click();

    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('неверный пароль → ошибка', async ({ page }) => {
    await page.goto('/registration');
    await page.getByPlaceholder('Введите email или телефон').fill(email);
    await page.getByPlaceholder('Введите пароль').fill('wrong-password');
    await page.getByRole('button', { name: 'Войти' }).click();

    // Ждём ошибку
    await expect(page.locator('.text-pink-1, [class*="error"], [role="alert"]').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('навигация по боковому меню', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    // Переход на «Ученики»
    await page.getByRole('link', { name: /Ученики/i }).click();
    await expect(page).toHaveURL(/\/students/);

    // Переход на «Расписание»
    await page.getByRole('link', { name: /Расписание/i }).click();
    await expect(page).toHaveURL(/\/schedule/);

    // Переход на «Финансы»
    await page.getByRole('link', { name: /Финансы/i }).click();
    await expect(page).toHaveURL(/\/finance/);

    // Переход на «Настройки»
    await page.getByRole('link', { name: /Настройки/i }).click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('неавторизованный → редирект на /registration', async ({ page }) => {
    await page.goto('/dashboard');
    // Должно перебросить на регистрацию
    await page.waitForURL('**/registration', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/registration/);
  });
});
