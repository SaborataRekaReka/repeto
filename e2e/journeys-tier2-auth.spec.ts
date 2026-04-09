import { test, expect, type Page } from '@playwright/test';
import { uniqueEmail, registerViaAPI, deleteAccount } from './helpers';

const BASE = 'http://localhost:3100';

test.describe('Journey 54: Auth edge cases — забыли пароль, дубли, валидация', () => {
  test('54.1 «Забыли пароль» — форма → success-экран → назад ко входу', async ({ page }) => {
    await page.goto(`${BASE}/registration`);
    await expect(page.getByText('Вход')).toBeVisible();

    // Click "Забыли пароль?"
    await page.getByText('Забыли пароль?').click();
    await expect(page.getByText('Забыли пароль?', { exact: false }).first()).toBeVisible();
    await expect(page.getByPlaceholder('Введите email')).toBeVisible();

    // Fill email and submit
    await page.getByPlaceholder('Введите email').fill('test@example.com');
    await page.getByRole('button', { name: 'Восстановить пароль' }).click();

    // Success screen
    await expect(page.getByText('Письмо отправлено')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('инструкции по восстановлению')).toBeVisible();

    // Go back to login
    await page.getByRole('button', { name: 'Назад ко входу' }).click();
    await expect(page.getByPlaceholder('Введите email или телефон')).toBeVisible();
  });

  test('54.2 Дублирующий email → ошибка «уже существует»', async ({ page }) => {
    // Register a user via API
    const { email, password } = await registerViaAPI(page);

    // Open registration form in browser
    await page.goto(`${BASE}/registration`);
    await page.getByText('Создать аккаунт').click();
    await expect(page.getByText('Регистрация')).toBeVisible();

    // Fill a duplicate registration
    await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Дубль Тест');
    await page.getByPlaceholder('email@example.com').fill(email);
    await page.getByPlaceholder('Введите пароль').fill('StrongPass123!');
    await page.getByPlaceholder('Повторите пароль').fill('StrongPass123!');

    // Check the agreement checkbox
    const checkbox = page.getByText('Согласен с условиями');
    await checkbox.click();

    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    // Expect error about duplicate email
    await expect(page.getByText('уже существует')).toBeVisible({ timeout: 5_000 });

    // Clean up
    await deleteAccount(page, email, password);
  });

  test('54.3 Неверный логин → ошибка «Неверный email или пароль»', async ({ page }) => {
    await page.goto(`${BASE}/registration`);
    await page.getByPlaceholder('Введите email или телефон').fill('nonexistent@test.com');
    await page.getByPlaceholder('Введите пароль').fill('WrongPassword123');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page.getByText('Неверный email или пароль')).toBeVisible({ timeout: 5_000 });
  });

  test('54.4 Регистрация — пароли не совпадают', async ({ page }) => {
    await page.goto(`${BASE}/registration`);
    await page.getByText('Создать аккаунт').click();

    await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Тестовый Пользователь');
    await page.getByPlaceholder('email@example.com').fill(uniqueEmail());
    await page.getByPlaceholder('Введите пароль').fill('Password123!');
    await page.getByPlaceholder('Повторите пароль').fill('DifferentPassword!');

    const checkbox = page.getByText('Согласен с условиями');
    await checkbox.click();

    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    await expect(page.getByText('Пароли не совпадают')).toBeVisible({ timeout: 5_000 });
  });

  test('54.5 Регистрация — короткий пароль → ошибка валидации', async ({ page }) => {
    await page.goto(`${BASE}/registration`);
    await page.getByText('Создать аккаунт').click();

    await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Тестовый Пользователь');
    await page.getByPlaceholder('email@example.com').fill(uniqueEmail());
    await page.getByPlaceholder('Введите пароль').fill('short');
    await page.getByPlaceholder('Повторите пароль').fill('short');

    const checkbox = page.getByText('Согласен с условиями');
    await checkbox.click();

    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    await expect(page.getByText(/минимум 8 символов|Validation failed/i)).toBeVisible({ timeout: 5_000 });
  });

  test('54.6 Регистрация — чекбокс не отмечен → ошибка', async ({ page }) => {
    await page.goto(`${BASE}/registration`);
    await page.getByText('Создать аккаунт').click();

    await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Тестовый Пользователь');
    await page.getByPlaceholder('email@example.com').fill(uniqueEmail());
    await page.getByPlaceholder('Введите пароль').fill('StrongPass123!');
    await page.getByPlaceholder('Повторите пароль').fill('StrongPass123!');

    // Do NOT check the agreement checkbox
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    await expect(page.getByText('Примите условия использования')).toBeVisible({ timeout: 5_000 });
  });
});
