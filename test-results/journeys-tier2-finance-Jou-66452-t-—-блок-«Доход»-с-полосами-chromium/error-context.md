# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-finance.spec.ts >> Journey 44: Финансовый обзор — виджеты и навигация >> 44.5 IncomeChart — блок «Доход» с полосами
- Location: e2e\journeys-tier2-finance.spec.ts:104:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.card').filter({ hasText: 'Доход' }).filter({ hasText: 'Получено' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.card').filter({ hasText: 'Доход' }).filter({ hasText: 'Получено' })

```

# Test source

```ts
  6   |   createStudentAPI,
  7   |   createLessonAPI,
  8   |   deleteAccount,
  9   | } from './helpers';
  10  | 
  11  | const API = 'http://127.0.0.1:3200/api';
  12  | 
  13  | /**
  14  |  * ────────────────────────────────────────────────
  15  |  *  Этап 8 · Финансы — обзор, оплаты, пакеты
  16  |  * ────────────────────────────────────────────────
  17  |  * Journey 44: Финансовый обзор — виджеты и навигация
  18  |  * Journey 45: Оплаты — таблица, фильтры, детали
  19  |  * Journey 46: Пакеты — CRUD и фильтры
  20  |  */
  21  | 
  22  | /* ═══════════════════════════════════════════════════
  23  |    Journey 44 · Финансовый обзор
  24  |    ═══════════════════════════════════════════════════ */
  25  | test.describe('Journey 44: Финансовый обзор — виджеты и навигация', () => {
  26  |   let email: string;
  27  |   let password: string;
  28  |   let token: string;
  29  |   let studentId: string;
  30  | 
  31  |   test.beforeAll(async ({ browser }) => {
  32  |     const ctx = await browser.newContext();
  33  |     const page = await ctx.newPage();
  34  |     const reg = await registerViaAPI(page, { name: 'Фин Обзор' });
  35  |     email = reg.email;
  36  |     password = reg.password;
  37  |     token = reg.accessToken;
  38  | 
  39  |     // Create student + lesson + payment to populate widgets
  40  |     const student = await createStudentAPI(page, token, { name: 'Фин Ученик', rate: 3000 });
  41  |     studentId = student.id;
  42  | 
  43  |     const yesterday = new Date();
  44  |     yesterday.setDate(yesterday.getDate() - 1);
  45  |     yesterday.setHours(10, 0, 0, 0);
  46  |     const lesson = await createLessonAPI(page, token, studentId, {
  47  |       scheduledAt: yesterday.toISOString(),
  48  |       rate: 3000,
  49  |     });
  50  | 
  51  |     // Mark lesson as completed
  52  |     const markRes = await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
  53  |       headers: { Authorization: `Bearer ${token}` },
  54  |       data: { status: 'COMPLETED' },
  55  |     });
  56  |     expect(markRes.ok()).toBe(true);
  57  | 
  58  |     // Create payment
  59  |     const payRes = await page.request.post(`${API}/payments`, {
  60  |       headers: { Authorization: `Bearer ${token}` },
  61  |       data: { studentId, amount: 3000, method: 'SBP', date: new Date().toISOString().slice(0, 10) },
  62  |     });
  63  |     expect(payRes.ok()).toBe(true);
  64  | 
  65  |     await ctx.close();
  66  |   });
  67  | 
  68  |   test.afterAll(async ({ browser }) => {
  69  |     const ctx = await browser.newContext();
  70  |     const p = await ctx.newPage();
  71  |     await deleteAccount(p, token, password);
  72  |     await ctx.close();
  73  |   });
  74  | 
  75  |   let page: Page;
  76  |   test.beforeEach(async ({ browser }) => {
  77  |     page = await browser.newPage();
  78  |     await loginAndGoto(page, '/finance', email, password);
  79  |   });
  80  |   test.afterEach(async () => { await page.close(); });
  81  | 
  82  |   test('44.1 Страница обзора загружена — заголовок «Финансы»', async () => {
  83  |     await expect(page.locator('.text-h3, .text-h4').filter({ hasText: 'Финансы' }).first()).toBeVisible();
  84  |   });
  85  | 
  86  |   test('44.2 StatCard «Доход за месяц» содержит сумму в ₽', async () => {
  87  |     const card = page.locator('a[href="/finance/payments"]').filter({ hasText: 'Доход за месяц' });
  88  |     await expect(card).toBeVisible();
  89  |     await expect(card).toContainText('₽');
  90  |   });
  91  | 
  92  |   test('44.3 StatCard «Запланировано» виден', async () => {
  93  |     const card = page.locator('a[href="/schedule"]').filter({ hasText: 'Запланировано' });
  94  |     await expect(card).toBeVisible();
  95  |     await expect(card).toContainText('₽');
  96  |   });
  97  | 
  98  |   test('44.4 StatCard «Задолженность» виден', async () => {
  99  |     const card = page.locator('a').filter({ hasText: 'Задолженность' });
  100 |     await expect(card).toBeVisible();
  101 |     await expect(card).toContainText('₽');
  102 |   });
  103 | 
  104 |   test('44.5 IncomeChart — блок «Доход» с полосами', async () => {
  105 |     const chart = page.locator('.card').filter({ hasText: 'Доход' }).filter({ hasText: 'Получено' });
> 106 |     await expect(chart).toBeVisible();
      |                         ^ Error: expect(locator).toBeVisible() failed
  107 |     await expect(chart).toContainText('₽');
  108 |   });
  109 | 
  110 |   test('44.6 IncomeChart — переключатель периода (dropdown) видим', async () => {
  111 |     const chart = page.locator('.card').filter({ hasText: 'Доход' }).filter({ hasText: 'Получено' });
  112 |     // Period selector is a dropdown showing current period + calendar icon
  113 |     await expect(chart.getByText('Месяц')).toBeVisible();
  114 |   });
  115 | 
  116 |   test('44.7 PeriodSummary — «Уроков проведено» виден', async () => {
  117 |     const summary = page.locator('.card').filter({ hasText: 'Сводка за период' });
  118 |     await expect(summary).toBeVisible();
  119 |     await expect(summary.getByText('Уроков проведено')).toBeVisible();
  120 |   });
  121 | 
  122 |   test('44.8 BalanceTable — ученик виден', async () => {
  123 |     const table = page.locator('.card').filter({ hasText: 'Баланс учеников' });
  124 |     await expect(table).toBeVisible();
  125 |     await expect(table).toContainText('Фин Ученик');
  126 |   });
  127 | 
  128 |   test('44.9 BalanceTable — кнопка «Все оплаты» ведёт на /finance/payments', async () => {
  129 |     const link = page.locator('a[href="/finance/payments"]').filter({ hasText: 'Все оплаты' });
  130 |     await expect(link).toBeVisible();
  131 |     await link.click();
  132 |     await expect(page).toHaveURL(/\/finance\/payments/);
  133 |   });
  134 | 
  135 |   test('44.10 BalanceTable — клик по строке ученика → /students/', async () => {
  136 |     const table = page.locator('.card').filter({ hasText: 'Баланс учеников' });
  137 |     const row = table.locator('tr').filter({ hasText: 'Фин Ученик' });
  138 |     await row.click();
  139 |     await expect(page).toHaveURL(/\/students\//);
  140 |   });
  141 | });
  142 | 
  143 | /* ═══════════════════════════════════════════════════
  144 |    Journey 45 · Оплаты — таблица, фильтры, детали
  145 |    ═══════════════════════════════════════════════════ */
  146 | test.describe('Journey 45: Оплаты — таблица, фильтры, детали', () => {
  147 |   let email: string;
  148 |   let password: string;
  149 |   let token: string;
  150 |   let studentId: string;
  151 | 
  152 |   test.beforeAll(async ({ browser }) => {
  153 |     const ctx = await browser.newContext();
  154 |     const page = await ctx.newPage();
  155 |     const reg = await registerViaAPI(page, { name: 'Опл Тест' });
  156 |     email = reg.email;
  157 |     password = reg.password;
  158 |     token = reg.accessToken;
  159 | 
  160 |     const student = await createStudentAPI(page, token, { name: 'Кассир Студент', rate: 2500 });
  161 |     studentId = student.id;
  162 | 
  163 |     // Create a payment
  164 |     const payRes = await page.request.post(`${API}/payments`, {
  165 |       headers: { Authorization: `Bearer ${token}` },
  166 |       data: { studentId, amount: 5000, method: 'CASH', date: new Date().toISOString().slice(0, 10) },
  167 |     });
  168 |     expect(payRes.ok()).toBe(true);
  169 | 
  170 |     await ctx.close();
  171 |   });
  172 | 
  173 |   test.afterAll(async ({ browser }) => {
  174 |     const ctx = await browser.newContext();
  175 |     const p = await ctx.newPage();
  176 |     await deleteAccount(p, token, password);
  177 |     await ctx.close();
  178 |   });
  179 | 
  180 |   let page: Page;
  181 |   test.beforeEach(async ({ browser }) => {
  182 |     page = await browser.newPage();
  183 |     await loginAndGoto(page, '/finance/payments', email, password);
  184 |   });
  185 |   test.afterEach(async () => { await page.close(); });
  186 | 
  187 |   test('45.1 Заголовок «Оплаты» виден', async () => {
  188 |     await expect(page.locator('.text-h3, .text-h4').filter({ hasText: 'Оплаты' }).first()).toBeVisible();
  189 |   });
  190 | 
  191 |   test('45.2 Таб «Все» активен по умолчанию', async () => {
  192 |     const tab = page.getByRole('button', { name: 'Все', exact: true });
  193 |     await expect(tab).toBeVisible();
  194 |   });
  195 | 
  196 |   test('45.3 Таб «Оплачено» переключается', async () => {
  197 |     await page.getByRole('button', { name: 'Оплачено' }).click();
  198 |     // Table should still show our payment (status is PAID)
  199 |     await expect(page.getByText('Кассир Студент')).toBeVisible({ timeout: 5_000 });
  200 |   });
  201 | 
  202 |   test('45.4 Оплата видна в таблице — сумма 5 000 ₽', async () => {
  203 |     await expect(page.getByText('5 000')).toBeVisible();
  204 |     await expect(page.getByText('Кассир Студент')).toBeVisible();
  205 |   });
  206 | 
```