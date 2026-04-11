# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-ui.spec.ts >> Journey 50: Header — поиск, создать, уведомления >> 50.2 Меню «Создать» — три пункта
- Location: e2e\journeys-tier2-ui.spec.ts:73:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Создать' })
    - locator resolved to <button class="ml-1.5 font-bold transition-colors hover:text-purple-1">Создать аккаунт</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import {
  3   |   uniqueEmail,
  4   |   registerViaAPI,
  5   |   loginAndGoto,
  6   |   createStudentAPI,
  7   |   deleteAccount,
  8   | } from './helpers';
  9   | 
  10  | const API = 'http://127.0.0.1:3200/api';
  11  | 
  12  | /**
  13  |  * ────────────────────────────────────────────────
  14  |  *  Этап 10 · Глобальные UI-элементы
  15  |  * ────────────────────────────────────────────────
  16  |  * Journey 50: Header — поиск, меню «Создать», уведомления
  17  |  * Journey 51: Sidebar — навигация и профиль
  18  |  * Journey 52: Тёмная тема
  19  |  * Journey 53: Responsive — планшет/мобильный
  20  |  */
  21  | 
  22  | /* ═══════════════════════════════════════════════════
  23  |    Journey 50 · Header
  24  |    ═══════════════════════════════════════════════════ */
  25  | test.describe('Journey 50: Header — поиск, создать, уведомления', () => {
  26  |   let email: string;
  27  |   let password: string;
  28  |   let token: string;
  29  |   let studentName: string;
  30  | 
  31  |   test.beforeAll(async ({ browser }) => {
  32  |     const ctx = await browser.newContext();
  33  |     const page = await ctx.newPage();
  34  |     const reg = await registerViaAPI(page, { name: 'UI Тестер' });
  35  |     email = reg.email;
  36  |     password = reg.password;
  37  |     token = reg.accessToken;
  38  | 
  39  |     studentName = `ПоискУченик ${Date.now()}`;
  40  |     await createStudentAPI(page, token, { name: studentName, subject: 'Химия' });
  41  | 
  42  |     await ctx.close();
  43  |   });
  44  | 
  45  |   test.afterAll(async ({ browser }) => {
  46  |     const ctx = await browser.newContext();
  47  |     const p = await ctx.newPage();
  48  |     await deleteAccount(p, token, password);
  49  |     await ctx.close();
  50  |   });
  51  | 
  52  |   test('50.1 Поиск ученика — dropdown с результатами → клик → карточка', async ({ page }) => {
  53  |     await loginAndGoto(page, '/dashboard', email, password);
  54  | 
  55  |     // The search icon is a button in the header; clicking it reveals the input
  56  |     const searchInput = page.getByPlaceholder('Поиск учеников...');
  57  |     const isVisible = await searchInput.isVisible().catch(() => false);
  58  |     if (!isVisible) {
  59  |       await page.locator('header button').first().click();
  60  |       await expect(searchInput).toBeVisible({ timeout: 3_000 });
  61  |     }
  62  | 
  63  |     await searchInput.fill(studentName.slice(0, 12));
  64  |     // Wait for the dropdown results to appear
  65  |     await page.waitForTimeout(1000);
  66  |     await expect(page.getByText(studentName).first()).toBeVisible({ timeout: 5_000 });
  67  | 
  68  |     // Click on the search result (use first() to avoid strict mode if text appears in multiple places)
  69  |     await page.getByText(studentName).first().click();
  70  |     await expect(page).toHaveURL(/\/students\/[a-f0-9-]+/);
  71  |   });
  72  | 
  73  |   test('50.2 Меню «Создать» — три пункта', async ({ page }) => {
  74  |     await loginAndGoto(page, '/dashboard', email, password);
  75  | 
> 76  |     await page.getByRole('button', { name: 'Создать' }).click();
      |                                                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  77  | 
  78  |     await expect(page.getByText('Новый ученик')).toBeVisible();
  79  |     await expect(page.getByText('Новое занятие')).toBeVisible();
  80  |     await expect(page.getByText('Записать оплату').first()).toBeVisible();
  81  |   });
  82  | 
  83  |   test('50.3 Меню «Создать» → «Новый ученик» → /students?create=1', async ({ page }) => {
  84  |     await loginAndGoto(page, '/dashboard', email, password);
  85  | 
  86  |     await page.getByRole('button', { name: 'Создать' }).click();
  87  |     await page.getByText('Новый ученик').click();
  88  |     await expect(page).toHaveURL(/\/students/);
  89  |   });
  90  | 
  91  |   test('50.4 Кнопка уведомлений → /notifications', async ({ page }) => {
  92  |     await loginAndGoto(page, '/dashboard', email, password);
  93  | 
  94  |     // The notification icon is a button that navigates to /notifications
  95  |     // It's the second button in the header area (after search)
  96  |     // Find it by the notification icon class pattern or by position
  97  |     await page.locator('header button').nth(1).click();
  98  |     await expect(page).toHaveURL(/\/notifications/);
  99  |   });
  100 | });
  101 | 
  102 | /* ═══════════════════════════════════════════════════
  103 |    Journey 51 · Sidebar навигация + профиль
  104 |    ═══════════════════════════════════════════════════ */
  105 | test.describe('Journey 51: Sidebar — навигация и профиль', () => {
  106 |   let email: string;
  107 |   let password: string;
  108 |   let token: string;
  109 | 
  110 |   test.beforeAll(async ({ browser }) => {
  111 |     const ctx = await browser.newContext();
  112 |     const page = await ctx.newPage();
  113 |     const reg = await registerViaAPI(page, { name: 'Навигатор' });
  114 |     email = reg.email;
  115 |     password = reg.password;
  116 |     token = reg.accessToken;
  117 | 
  118 |     await page.request.patch(`${API}/settings/account`, {
  119 |       headers: { Authorization: `Bearer ${token}` },
  120 |       data: { slug: `nav-${Date.now()}`, published: true },
  121 |     });
  122 | 
  123 |     await ctx.close();
  124 |   });
  125 | 
  126 |   test.afterAll(async ({ browser }) => {
  127 |     const ctx = await browser.newContext();
  128 |     const p = await ctx.newPage();
  129 |     await deleteAccount(p, token, password);
  130 |     await ctx.close();
  131 |   });
  132 | 
  133 |   test('51.1 Все ссылки сайдбара ведут на правильные страницы', async ({ page }) => {
  134 |     await loginAndGoto(page, '/dashboard', email, password);
  135 | 
  136 |     const links = [
  137 |       { label: 'Ученики', url: '/students' },
  138 |       { label: 'Расписание', url: '/schedule' },
  139 |       { label: 'Финансы', url: '/finance' },
  140 |       { label: 'Уведомления', url: '/notifications' },
  141 |       { label: 'Настройки', url: '/settings' },
  142 |       { label: 'Дашборд', url: '/dashboard' },
  143 |     ];
  144 | 
  145 |     for (const { label, url } of links) {
  146 |       await page.getByText(label, { exact: true }).first().click();
  147 |       await expect(page).toHaveURL(new RegExp(url));
  148 |     }
  149 |   });
  150 | 
  151 |   test('51.2 Профильное меню → «Настройки»', async ({ page }) => {
  152 |     await loginAndGoto(page, '/dashboard', email, password);
  153 | 
  154 |     // The "..." dots button is in the fixed sidebar, last button
  155 |     await page.locator('.fixed.top-0.left-0 button').last().click();
  156 | 
  157 |     // Click "Настройки" in the dropdown menu (last one to avoid sidebar nav conflict)
  158 |     await page.locator('.absolute.bottom-full').getByText('Настройки').click();
  159 |     await expect(page).toHaveURL(/\/settings/);
  160 |   });
  161 | 
  162 |   test('51.3 Профильное меню → «Выйти»', async ({ page }) => {
  163 |     await loginAndGoto(page, '/dashboard', email, password);
  164 | 
  165 |     await page.locator('.fixed.top-0.left-0 button').last().click();
  166 |     await page.getByText('Выйти').click();
  167 |     await expect(page).toHaveURL(/\/registration/);
  168 |   });
  169 | });
  170 | 
  171 | /* ═══════════════════════════════════════════════════
  172 |    Journey 52 · Тёмная тема
  173 |    ═══════════════════════════════════════════════════ */
  174 | test.describe('Journey 52: Тёмная тема', () => {
  175 |   let email: string;
  176 |   let password: string;
```