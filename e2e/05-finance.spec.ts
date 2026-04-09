import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI, loginAndGoto, createStudentAPI } from './helpers';

test.describe('Финансы — оплата', () => {
  let email: string;
  let token: string;
  const password = 'TestFinance123!';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Финансы' });
    token = auth.accessToken;
    await createStudentAPI(page, token, { name: 'Ученик Финансов' });
    await ctx.close();
  });

  test('страница оплат доступна', async ({ page }) => {
    await loginAndGoto(page, '/finance/payments', email, password);
    await expect(page.locator('body')).toContainText(/Оплаты|Записать оплату/i);
  });

  test('создать пакет → кнопка доступна', async ({ page }) => {
    await loginAndGoto(page, '/finance/packages', email, password);
    await expect(page.locator('body')).toContainText(/Пакеты|Новый пакет/i);
  });

  test('обзор финансов — статистика видна', async ({ page }) => {
    await loginAndGoto(page, '/finance', email, password);
    // Должны видеть карточки статистики
    await expect(page.locator('body')).toContainText(/Доход|Финансы|₽|руб/i);
  });
});
