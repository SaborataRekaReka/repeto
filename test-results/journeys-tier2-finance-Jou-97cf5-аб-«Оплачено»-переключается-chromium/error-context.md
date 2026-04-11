# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-finance.spec.ts >> Journey 45: Оплаты — таблица, фильтры, детали >> 45.3 Таб «Оплачено» переключается
- Location: e2e\journeys-tier2-finance.spec.ts:196:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByRole('button', { name: 'Оплачено' })

```

# Test source

```ts
  97  | 
  98  |   test('44.4 StatCard «Задолженность» виден', async () => {
  99  |     const card = page.locator('a').filter({ hasText: 'Задолженность' });
  100 |     await expect(card).toBeVisible();
  101 |     await expect(card).toContainText('₽');
  102 |   });
  103 | 
  104 |   test('44.5 IncomeChart — блок «Доход» с полосами', async () => {
  105 |     const chart = page.locator('.card').filter({ hasText: 'Доход' }).filter({ hasText: 'Получено' });
  106 |     await expect(chart).toBeVisible();
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
> 197 |     await page.getByRole('button', { name: 'Оплачено' }).click();
      |                                                          ^ Error: locator.click: Target page, context or browser has been closed
  198 |     // Table should still show our payment (status is PAID)
  199 |     await expect(page.getByText('Кассир Студент')).toBeVisible({ timeout: 5_000 });
  200 |   });
  201 | 
  202 |   test('45.4 Оплата видна в таблице — сумма 5 000 ₽', async () => {
  203 |     await expect(page.getByText('5 000')).toBeVisible();
  204 |     await expect(page.getByText('Кассир Студент')).toBeVisible();
  205 |   });
  206 | 
  207 |   test('45.5 Способ оплаты «Наличные» виден', async () => {
  208 |     await expect(page.getByText('Наличные')).toBeVisible();
  209 |   });
  210 | 
  211 |   test('45.6 Клик по строке → модалка «Детали оплаты»', async () => {
  212 |     // Click the row with the payment
  213 |     const row = page.locator('tr').filter({ hasText: 'Кассир Студент' });
  214 |     await row.click();
  215 |     await expect(page.getByText('Детали оплаты')).toBeVisible({ timeout: 5_000 });
  216 |     await expect(page.locator('.modal, [role="dialog"]').first()).toContainText('5 000');
  217 |     await expect(page.locator('.modal, [role="dialog"]').first()).toContainText('Наличные');
  218 |   });
  219 | 
  220 |   test('45.7 Кнопка «Записать оплату» открывает модалку создания', async () => {
  221 |     await page.getByRole('button', { name: 'Записать оплату' }).first().click();
  222 |     // Modal title may match the button text — look inside the modal body
  223 |     await expect(page.locator('[class*="modal"], [role="dialog"]').first().getByText('Сумма')).toBeVisible({ timeout: 5_000 });
  224 |   });
  225 | 
  226 |   test('45.8 Поиск фильтрует по имени ученика', async () => {
  227 |     await page.getByPlaceholder('Поиск...').fill('Кассир');
  228 |     await expect(page.getByText('Кассир Студент')).toBeVisible();
  229 |     await page.getByPlaceholder('Поиск...').fill('Несуществующий');
  230 |     await expect(page.getByText('Нет оплат')).toBeVisible({ timeout: 5_000 });
  231 |   });
  232 | });
  233 | 
  234 | /* ═══════════════════════════════════════════════════
  235 |    Journey 46 · Пакеты — CRUD и фильтры
  236 |    ═══════════════════════════════════════════════════ */
  237 | test.describe('Journey 46: Пакеты — CRUD и фильтры', () => {
  238 |   let email: string;
  239 |   let password: string;
  240 |   let token: string;
  241 |   let studentId: string;
  242 |   let packageId: string;
  243 | 
  244 |   test.beforeAll(async ({ browser }) => {
  245 |     const ctx = await browser.newContext();
  246 |     const page = await ctx.newPage();
  247 |     const reg = await registerViaAPI(page, { name: 'Пакет Тест' });
  248 |     email = reg.email;
  249 |     password = reg.password;
  250 |     token = reg.accessToken;
  251 | 
  252 |     const student = await createStudentAPI(page, token, { name: 'Пакет Ученик', rate: 2000, subject: 'Физика' });
  253 |     studentId = student.id;
  254 | 
  255 |     // Create a package via API
  256 |     const pkgRes = await page.request.post(`${API}/packages`, {
  257 |       headers: { Authorization: `Bearer ${token}` },
  258 |       data: { studentId, subject: 'Физика', lessonsTotal: 8, totalPrice: 16000 },
  259 |     });
  260 |     expect(pkgRes.ok()).toBe(true);
  261 |     const pkg = await pkgRes.json();
  262 |     packageId = pkg.id;
  263 | 
  264 |     await ctx.close();
  265 |   });
  266 | 
  267 |   test.afterAll(async ({ browser }) => {
  268 |     const ctx = await browser.newContext();
  269 |     const p = await ctx.newPage();
  270 |     await deleteAccount(p, token, password);
  271 |     await ctx.close();
  272 |   });
  273 | 
  274 |   let page: Page;
  275 |   test.beforeEach(async ({ browser }) => {
  276 |     page = await browser.newPage();
  277 |     await loginAndGoto(page, '/finance/packages', email, password);
  278 |   });
  279 |   test.afterEach(async () => { await page.close(); });
  280 | 
  281 |   test('46.1 Заголовок «Пакеты занятий» виден', async () => {
  282 |     await expect(page.locator('.text-h3, .text-h4').filter({ hasText: 'Пакеты занятий' }).first()).toBeVisible();
  283 |   });
  284 | 
  285 |   test('46.2 Табы «Все», «Активные», «Завершённые» видны', async () => {
  286 |     await expect(page.getByRole('button', { name: 'Все', exact: true })).toBeVisible();
  287 |     await expect(page.getByRole('button', { name: 'Активные' })).toBeVisible();
  288 |     await expect(page.getByRole('button', { name: 'Завершённые' })).toBeVisible();
  289 |   });
  290 | 
  291 |   test('46.3 Пакет ученика виден в таблице', async () => {
  292 |     await expect(page.getByText('Пакет Ученик')).toBeVisible();
  293 |     await expect(page.getByText('Физика')).toBeVisible();
  294 |   });
  295 | 
  296 |   test('46.4 Прогресс пакета — 0/8', async () => {
  297 |     await expect(page.getByText('0/8')).toBeVisible();
```