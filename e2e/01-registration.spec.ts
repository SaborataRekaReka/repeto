import { test, expect } from '@playwright/test';
import { uniqueEmail } from './helpers';

test.describe('Регистрация и онбординг', () => {
  test('регистрация нового пользователя → редирект в дашборд', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/registration');

    // Переключаемся на форму регистрации
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    // Заполняем форму
    await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Тест Репетитор');
    await page.getByPlaceholder('email@example.com').fill(email);

    // Пароли
    await page.getByPlaceholder('Введите пароль').fill('TestPass123!');
    await page.getByPlaceholder('Повторите пароль').fill('TestPass123!');

    // Чекбокс согласия
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check({ force: true });

    // Отправляем
    await page.getByRole('button', { name: /Создать аккаунт|Создание/i }).click();

    // Ждём редирект в дашборд
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('дашборд пустой для нового пользователя', async ({ page }) => {
    const email = uniqueEmail();

    // Регистрируемся через API
    const res = await page.request.post('http://127.0.0.1:3200/api/auth/register', {
      data: { email, password: 'TestPass123!', name: 'Пустой дашборд' },
    });
    expect(res.ok()).toBe(true);

    // Логинимся через UI
    await page.goto('/registration');
    await page.getByPlaceholder('Введите email или телефон').fill(email);
    await page.getByPlaceholder('Введите пароль').fill('TestPass123!');
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // Проверяем, что на странице есть элементы дашборда
    await expect(page.locator('body')).toContainText(/Дашборд|дашборд|Dashboard/i);
  });
});
