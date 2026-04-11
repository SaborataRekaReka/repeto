# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-finance.spec.ts >> Journey 46: Пакеты — CRUD и фильтры >> 46.2 Табы «Все», «Активные», «Завершённые» видны
- Location: e2e\journeys-tier2-finance.spec.ts:285:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Все', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Все', exact: true })

```

# Test source

```ts
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
> 286 |     await expect(page.getByRole('button', { name: 'Все', exact: true })).toBeVisible();
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
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
  298 |   });
  299 | 
  300 |   test('46.5 Таб «Активные» — пакет виден', async () => {
  301 |     await page.getByRole('button', { name: 'Активные' }).click();
  302 |     await expect(page.getByText('Пакет Ученик')).toBeVisible({ timeout: 5_000 });
  303 |   });
  304 | 
  305 |   test('46.6 Таб «Завершённые» — пусто', async () => {
  306 |     await page.getByRole('button', { name: 'Завершённые' }).click();
  307 |     // Either shows empty state or no package rows
  308 |     await expect(page.getByText('Пакет Ученик')).not.toBeVisible({ timeout: 3_000 });
  309 |   });
  310 | 
  311 |   test('46.7 Кнопка «Новый пакет» → модалка создания', async () => {
  312 |     await page.getByRole('button', { name: 'Новый пакет' }).click();
  313 |     await expect(page.getByText('Новый пакет').nth(1)).toBeVisible({ timeout: 5_000 });
  314 |   });
  315 | 
  316 |   test('46.8 Статус пакета — «Активен»', async () => {
  317 |     await expect(page.getByText('Активен')).toBeVisible();
  318 |   });
  319 | 
  320 |   test('46.9 Сумма пакета — 16 000 ₽', async () => {
  321 |     await expect(page.getByText('16 000')).toBeVisible();
  322 |   });
  323 | });
  324 | 
```