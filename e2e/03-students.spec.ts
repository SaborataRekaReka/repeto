import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI, loginAndGoto, createStudentAPI } from './helpers';

test.describe('CRUD ученика', () => {
  let email: string;
  const password = 'TestStudents123!';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Ученики' });
    // Создаём ученика через API
    await createStudentAPI(page, auth.accessToken, { name: 'Иванов Алексей' });
    await ctx.close();
  });

  test('модалка добавления ученика открывается', async ({ page }) => {
    await loginAndGoto(page, '/students', email, password);

    // Ученик виден в списке
    await expect(page.locator('body')).toContainText('Иванов Алексей', { timeout: 5_000 });

    // Открываем модалку
    await page.getByRole('button', { name: /Новый ученик/i }).click();

    // Модалка с формой видна
    await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByPlaceholder('2100')).toBeVisible();
  });

  test('открыть карточку ученика', async ({ page }) => {
    await loginAndGoto(page, '/students', email, password);

    // Кликаем на созданного ученика
    await page.getByText('Иванов Алексей').first().click();

    // Должны попасть на страницу ученика
    await expect(page).toHaveURL(/\/students\//);
    await expect(page.locator('body')).toContainText('Иванов Алексей');
  });
});
