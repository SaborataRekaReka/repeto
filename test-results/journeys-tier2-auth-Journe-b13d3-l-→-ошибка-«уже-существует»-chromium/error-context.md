# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-auth.spec.ts >> Journey 54: Auth edge cases — забыли пароль, дубли, валидация >> 54.2 Дублирующий email → ошибка «уже существует»
- Location: e2e\journeys-tier2-auth.spec.ts:29:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3100/registration
Call log:
  - navigating to "http://localhost:3100/registration", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { uniqueEmail, registerViaAPI, deleteAccount } from './helpers';
  3   | 
  4   | const BASE = 'http://localhost:3100';
  5   | 
  6   | test.describe('Journey 54: Auth edge cases — забыли пароль, дубли, валидация', () => {
  7   |   test('54.1 «Забыли пароль» — форма → success-экран → назад ко входу', async ({ page }) => {
  8   |     await page.goto(`${BASE}/registration`);
  9   |     await expect(page.getByText('Вход')).toBeVisible();
  10  | 
  11  |     // Click "Забыли пароль?"
  12  |     await page.getByText('Забыли пароль?').click();
  13  |     await expect(page.getByText('Забыли пароль?', { exact: false }).first()).toBeVisible();
  14  |     await expect(page.getByPlaceholder('Введите email')).toBeVisible();
  15  | 
  16  |     // Fill email and submit
  17  |     await page.getByPlaceholder('Введите email').fill('test@example.com');
  18  |     await page.getByRole('button', { name: 'Восстановить пароль' }).click();
  19  | 
  20  |     // Success screen
  21  |     await expect(page.getByText('Письмо отправлено')).toBeVisible({ timeout: 5_000 });
  22  |     await expect(page.getByText('инструкции по восстановлению')).toBeVisible();
  23  | 
  24  |     // Go back to login
  25  |     await page.getByRole('button', { name: 'Назад ко входу' }).click();
  26  |     await expect(page.getByPlaceholder('Введите email или телефон')).toBeVisible();
  27  |   });
  28  | 
  29  |   test('54.2 Дублирующий email → ошибка «уже существует»', async ({ page }) => {
  30  |     // Register a user via API
  31  |     const { email, password } = await registerViaAPI(page);
  32  | 
  33  |     // Open registration form in browser
> 34  |     await page.goto(`${BASE}/registration`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3100/registration
  35  |     await page.getByText('Создать аккаунт').click();
  36  |     await expect(page.getByText('Регистрация')).toBeVisible();
  37  | 
  38  |     // Fill a duplicate registration
  39  |     await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Дубль Тест');
  40  |     await page.getByPlaceholder('email@example.com').fill(email);
  41  |     await page.getByPlaceholder('Введите пароль').fill('StrongPass123!');
  42  |     await page.getByPlaceholder('Повторите пароль').fill('StrongPass123!');
  43  | 
  44  |     // Check the agreement checkbox
  45  |     const checkbox = page.getByText('Согласен с условиями');
  46  |     await checkbox.click();
  47  | 
  48  |     await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  49  | 
  50  |     // Expect error about duplicate email
  51  |     await expect(page.getByText('уже существует')).toBeVisible({ timeout: 5_000 });
  52  | 
  53  |     // Clean up
  54  |     await deleteAccount(page, email, password);
  55  |   });
  56  | 
  57  |   test('54.3 Неверный логин → ошибка «Неверный email или пароль»', async ({ page }) => {
  58  |     await page.goto(`${BASE}/registration`);
  59  |     await page.getByPlaceholder('Введите email или телефон').fill('nonexistent@test.com');
  60  |     await page.getByPlaceholder('Введите пароль').fill('WrongPassword123');
  61  |     await page.getByRole('button', { name: 'Войти' }).click();
  62  | 
  63  |     await expect(page.getByText('Неверный email или пароль')).toBeVisible({ timeout: 5_000 });
  64  |   });
  65  | 
  66  |   test('54.4 Регистрация — пароли не совпадают', async ({ page }) => {
  67  |     await page.goto(`${BASE}/registration`);
  68  |     await page.getByText('Создать аккаунт').click();
  69  | 
  70  |     await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Тестовый Пользователь');
  71  |     await page.getByPlaceholder('email@example.com').fill(uniqueEmail());
  72  |     await page.getByPlaceholder('Введите пароль').fill('Password123!');
  73  |     await page.getByPlaceholder('Повторите пароль').fill('DifferentPassword!');
  74  | 
  75  |     const checkbox = page.getByText('Согласен с условиями');
  76  |     await checkbox.click();
  77  | 
  78  |     await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  79  | 
  80  |     await expect(page.getByText('Пароли не совпадают')).toBeVisible({ timeout: 5_000 });
  81  |   });
  82  | 
  83  |   test('54.5 Регистрация — короткий пароль → ошибка валидации', async ({ page }) => {
  84  |     await page.goto(`${BASE}/registration`);
  85  |     await page.getByText('Создать аккаунт').click();
  86  | 
  87  |     await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Тестовый Пользователь');
  88  |     await page.getByPlaceholder('email@example.com').fill(uniqueEmail());
  89  |     await page.getByPlaceholder('Введите пароль').fill('short');
  90  |     await page.getByPlaceholder('Повторите пароль').fill('short');
  91  | 
  92  |     const checkbox = page.getByText('Согласен с условиями');
  93  |     await checkbox.click();
  94  | 
  95  |     await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  96  | 
  97  |     await expect(page.getByText(/минимум 8 символов|Validation failed/i)).toBeVisible({ timeout: 5_000 });
  98  |   });
  99  | 
  100 |   test('54.6 Регистрация — чекбокс не отмечен → ошибка', async ({ page }) => {
  101 |     await page.goto(`${BASE}/registration`);
  102 |     await page.getByText('Создать аккаунт').click();
  103 | 
  104 |     await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Тестовый Пользователь');
  105 |     await page.getByPlaceholder('email@example.com').fill(uniqueEmail());
  106 |     await page.getByPlaceholder('Введите пароль').fill('StrongPass123!');
  107 |     await page.getByPlaceholder('Повторите пароль').fill('StrongPass123!');
  108 | 
  109 |     // Do NOT check the agreement checkbox
  110 |     await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  111 | 
  112 |     await expect(page.getByText('Примите условия использования')).toBeVisible({ timeout: 5_000 });
  113 |   });
  114 | });
  115 | 
```