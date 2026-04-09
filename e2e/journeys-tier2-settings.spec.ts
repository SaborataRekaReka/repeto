import { test, expect, Page } from '@playwright/test';
import { uniqueEmail, registerViaAPI, loginAndGoto, deleteAccount } from './helpers';

const API = 'http://127.0.0.1:3200/api';

/* ═══════════════════════════════════════════════════════════════
   Journey 37 · Аккаунт — редактирование, slug, публикация
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 37: Аккаунт — редактирование, slug, публикация', () => {
  let page: Page;
  let token: string;
  const password = 'TestPass123!';
  const slug = `pw-s-${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    token = reg.accessToken;
    await loginAndGoto(page, '/settings', reg.email, password);
    await page.waitForTimeout(1_000);
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('37.1 Страница настроек загружена', async () => {
    await expect(page.getByText('Настройки').first()).toBeVisible();
  });

  test('37.2 Таб «Аккаунт» активен по умолчанию', async () => {
    await expect(page.getByRole('button', { name: 'Аккаунт', exact: true })).toBeVisible();
  });

  test('37.3 Карточка «Данные аккаунта» видна', async () => {
    await expect(page.getByText('Данные аккаунта')).toBeVisible();
  });

  test('37.4 Изменить имя → Сохранить → reload → имя сохранилось', async () => {
    const nameField = page.getByPlaceholder('Смирнов Алексей Иванович');
    await nameField.fill('Тест Настроек');
    await page.getByRole('button', { name: /Сохранить изменения/i }).click();
    await page.waitForTimeout(2_000);
    await page.reload();
    await page.waitForTimeout(2_000);
    await expect(nameField).toHaveValue('Тест Настроек');
  });

  test('37.5 Задать slug + включить публикацию → /t/slug доступна', async () => {
    // Set slug via API (UI auto-save on blur can be unreliable in tests)
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { slug, published: true },
    });
    await page.reload();
    await page.waitForTimeout(2_000);
    // Public page should be accessible via HTTP
    const resp = await page.request.get(`http://localhost:3100/t/${slug}`);
    expect(resp.status()).toBeLessThan(400);
  });
});

/* ═══════════════════════════════════════════════════════════════
   Journey 38 · Настройки — все вкладки отображаются
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 38: Настройки — рендеринг всех вкладок', () => {
  let page: Page;
  let token: string;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    token = reg.accessToken;
    await loginAndGoto(page, '/settings', reg.email, password);
    await page.waitForTimeout(1_000);
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('38.1 Безопасность — форма смены пароля видна', async () => {
    await page.getByRole('button', { name: /Безопасность/i }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.card-title').filter({ hasText: 'Сменить пароль' })).toBeVisible();
    await expect(page.getByPlaceholder('Введите текущий пароль')).toBeVisible();
  });

  test('38.2 Безопасность — «Удалить аккаунт» видна', async () => {
    const deleteBtn = page.getByRole('button', { name: /Удалить аккаунт/i });
    await deleteBtn.scrollIntoViewIfNeeded();
    await expect(deleteBtn).toBeVisible();
  });

  test('38.3 Уведомления — настройки видны', async () => {
    await page.getByRole('button', { name: /Уведомления/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Настройки уведомлений')).toBeVisible();
  });

  test('38.4 Политики — настройки видны', async () => {
    await page.getByRole('button', { name: /Политики/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Политика отмен')).toBeVisible();
  });

  test('38.5 Интеграции — ЮKassa видна', async () => {
    await page.getByRole('button', { name: /Интеграции/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('ЮKassa')).toBeVisible();
  });
});

/* ═══════════════════════════════════════════════════════════════
   Journey 39 · Безопасность — смена пароля через UI
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 39: Безопасность — смена пароля', () => {
  let page: Page;
  let token: string;
  let email: string;
  const password = 'TestPass123!';
  const newPassword = 'NewPass456!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    token = reg.accessToken;
    email = reg.email;
    await loginAndGoto(page, '/settings', email, password);
    await page.waitForTimeout(1_000);
    await page.getByRole('button', { name: /Безопасность/i }).click();
    await page.waitForTimeout(500);
  });

  test.afterAll(async () => {
    // Clean up with the NEW password (access token still valid as JWT)
    await page.request.delete(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { password: newPassword },
    });
    await page.close();
  });

  test('39.1 Заполнить и отправить форму смены пароля', async () => {
    await page.getByPlaceholder('Введите текущий пароль').fill(password);
    await page.getByPlaceholder('Введите новый пароль').fill(newPassword);
    await page.getByPlaceholder('Повторите новый пароль').fill(newPassword);
    await page.getByRole('button', { name: /Сменить пароль/i }).click();
    await page.waitForTimeout(3_000);
  });

  test('39.2 Редирект на страницу входа', async () => {
    await expect(page).toHaveURL(/registration|sign-in/i, { timeout: 10_000 });
  });

  test('39.3 Логин с новым паролем работает', async () => {
    await page.getByPlaceholder('Введите email или телефон').fill(email);
    await page.getByPlaceholder('Введите пароль').fill(newPassword);
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });
});

/* ═══════════════════════════════════════════════════════════════
   Journey 40 · Удаление аккаунта через UI
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 40: Удаление аккаунта через UI', () => {
  let page: Page;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    await loginAndGoto(page, '/settings', reg.email, password);
    await page.waitForTimeout(1_000);
    await page.getByRole('button', { name: /Безопасность/i }).click();
    await page.waitForTimeout(500);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('40.1 Кнопка «Удалить аккаунт» видна', async () => {
    await expect(page.getByRole('button', { name: /Удалить аккаунт/i })).toBeVisible();
  });

  test('40.2 Клик → форма подтверждения с паролем', async () => {
    await page.getByRole('button', { name: /Удалить аккаунт/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByPlaceholder('Ваш пароль')).toBeVisible();
    await expect(page.getByRole('button', { name: /Подтвердить удаление/i })).toBeVisible();
  });

  test('40.3 Ввод пароля → подтверждение → redirect на /registration', async () => {
    await page.getByPlaceholder('Ваш пароль').fill(password);
    await page.getByRole('button', { name: /Подтвердить удаление/i }).click();
    await expect(page).toHaveURL(/registration/i, { timeout: 10_000 });
  });
});
