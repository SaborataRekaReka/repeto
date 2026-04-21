# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Авторизация >> сессия сохраняется при обновлении страницы (refresh token)
- Location: e2e\auth.spec.ts:29:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /dashboard/
Received string:  "http://localhost:3300/auth"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    13 × unexpected value "http://localhost:3300/auth"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - link "Repeto" [ref=e7] [cursor=pointer]:
      - /url: /
      - img "Repeto" [ref=e8]
    - generic [ref=e10]:
      - generic [ref=e11]: Вход в Repeto
      - generic [ref=e12]: Введите данные вашего аккаунта
      - generic [ref=e13]:
        - generic [ref=e14]: Email
        - textbox "email@example.com" [ref=e17]: demo@repeto.ru
      - generic [ref=e18]:
        - generic [ref=e19]: Пароль
        - generic [ref=e21]:
          - textbox "Введите пароль" [ref=e22]: demo1234
          - button "Показать пароль" [ref=e24] [cursor=pointer]:
            - img [ref=e25]:
              - img [ref=e26]
      - button "Забыли пароль?" [ref=e29] [cursor=pointer]
      - generic [ref=e30]: "Backend unavailable. Код ошибки: AUTHSIGNIN-SRV502-I4CU"
      - button "Войти" [ref=e31] [cursor=pointer]:
        - generic [ref=e32]: Войти
    - button "У меня есть репетитор" [ref=e34] [cursor=pointer]
    - paragraph [ref=e35]:
      - text: Нет аккаунта?
      - button "Зарегистрироваться" [ref=e36] [cursor=pointer]
  - alert [ref=e37]: Repeto — Вход
```

# Test source

```ts
  1  | /**
  2  |  * AUTH & LOGIN E2E TESTS
  3  |  * Tests: login form, auth redirect, session persistence
  4  |  */
  5  | import { test, expect, loginViaUI } from './helpers/auth';
  6  | 
  7  | test.describe('Авторизация', () => {
  8  |   test('редирект на /registration без авторизации', async ({ page }) => {
  9  |     await page.goto('/dashboard');
  10 |     await expect(page).toHaveURL(/(auth|registration)/);
  11 |   });
  12 | 
  13 |   test('логин через форму — переход на dashboard', async ({ page }) => {
  14 |     await loginViaUI(page);
  15 |     await expect(page).toHaveURL(/dashboard/);
  16 |     // Должен быть виден sidebar
  17 |     await expect(page.getByText('Дашборд').first()).toBeVisible();
  18 |   });
  19 | 
  20 |   test('неправильный пароль — ошибка', async ({ page }) => {
  21 |     await page.goto('/registration');
  22 |     await page.getByPlaceholder('email@example.com').fill('demo@repeto.ru');
  23 |     await page.getByPlaceholder('Введите пароль').fill('wrongpassword');
  24 |     await page.getByRole('button', { name: 'Войти' }).click();
  25 |     // Должна быть ошибка (может быть "Unauthorized", "Неверный email или пароль", etc.)
  26 |     await expect(page.getByText(/Неверный|ошибка|Unauthorized|подключиться|пароль/i).first()).toBeVisible({ timeout: 10000 });
  27 |   });
  28 | 
  29 |   test('сессия сохраняется при обновлении страницы (refresh token)', async ({ page }) => {
  30 |     await loginViaUI(page);
> 31 |     await expect(page).toHaveURL(/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  32 | 
  33 |     // Check that a refresh token cookie was set  
  34 |     const cookies = await page.context().cookies();
  35 |     const refreshCookie = cookies.find(c => c.name.includes('refresh') || c.name.includes('token'));
  36 |     
  37 |     if (refreshCookie) {
  38 |       // If refresh cookie exists, session should persist
  39 |       await page.reload();
  40 |       await page.waitForLoadState('networkidle');
  41 |       await page.waitForTimeout(2000); // Give refresh flow time
  42 |       await expect(page).toHaveURL(/dashboard/);
  43 |     } else {
  44 |       // No refresh cookie ⇒ this is a known limitation (in-memory token only)
  45 |       // After reload, user will be redirected to login — not a UI bug
  46 |       test.skip();
  47 |     }
  48 |   });
  49 | });
  50 | 
```