import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI, loginAndGoto } from './helpers';

test.describe('Настройки профиля', () => {
  let email: string;
  const password = 'TestSettings123!';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    email = uniqueEmail();
    await registerViaAPI(page, { email, password, name: 'Тест Настройки' });
    await ctx.close();
  });

  test('открытие страницы настроек', async ({ page }) => {
    await loginAndGoto(page, '/settings', email, password);

    // Должны видеть табы настроек
    await expect(page.locator('body')).toContainText(/Аккаунт|Настройки/i);
  });

  test('редактирование имени', async ({ page }) => {
    await loginAndGoto(page, '/settings', email, password);

    // Ищем поле имени
    const nameInput = page.getByPlaceholder(/имя|Иванов/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.clear();
      await nameInput.fill('Обновлённое Имя');

      const saveBtn = page.getByRole('button', { name: /Сохранить/i }).first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(1_000);
      }
    }
  });

  test('переключение табов настроек', async ({ page }) => {
    await loginAndGoto(page, '/settings', email, password);

    // Таб «Безопасность» или «Уведомления»
    const secTab = page.getByRole('button', { name: /Безопасность|Уведомления/i }).first();
    if (await secTab.isVisible()) {
      await secTab.click();
      await page.waitForTimeout(500);
    }
  });
});
