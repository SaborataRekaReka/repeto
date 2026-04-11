# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-dashboard.spec.ts >> Journey 32: Последние оплаты, доход и конверсия >> 32.1 Виджет «Последние оплаты» виден
- Location: e2e\journeys-tier2-dashboard.spec.ts:296:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.card').filter({ hasText: 'Последние оплаты' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.card').filter({ hasText: 'Последние оплаты' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - link "Repeto" [ref=e4] [cursor=pointer]:
        - /url: /dashboard
        - generic [ref=e6]: Repeto
      - navigation [ref=e7]:
        - link "Дашборд" [ref=e8] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e10]:
            - img [ref=e11]
          - generic [ref=e13]: Дашборд
        - link "Ученики" [ref=e14] [cursor=pointer]:
          - /url: /students
          - img [ref=e16]:
            - img [ref=e17]
          - generic [ref=e19]: Ученики
        - link "Расписание" [ref=e20] [cursor=pointer]:
          - /url: /schedule
          - img [ref=e22]:
            - img [ref=e23]
          - generic [ref=e25]: Расписание
        - link "Финансы" [ref=e26] [cursor=pointer]:
          - /url: /finance
          - img [ref=e28]:
            - img [ref=e29]
          - generic [ref=e31]: Финансы
        - link "Оплаты" [ref=e32] [cursor=pointer]:
          - /url: /payments
          - img [ref=e34]:
            - img [ref=e35]
          - generic [ref=e37]: Оплаты
        - link "Пакеты" [ref=e38] [cursor=pointer]:
          - /url: /packages
          - img [ref=e40]:
            - img [ref=e41]
          - generic [ref=e43]: Пакеты
        - link "Материалы" [ref=e44] [cursor=pointer]:
          - /url: /files
          - img [ref=e46]:
            - img [ref=e47]
          - generic [ref=e49]: Материалы
      - generic [ref=e50]:
        - link "Уведомления" [ref=e51] [cursor=pointer]:
          - /url: /notifications
          - img [ref=e53]:
            - img [ref=e54]
          - generic [ref=e57]: Уведомления
        - link "Настройки" [ref=e58] [cursor=pointer]:
          - /url: /settings
          - img [ref=e60]:
            - img [ref=e61]
          - generic [ref=e63]: Настройки
        - link "Поддержка" [ref=e64] [cursor=pointer]:
          - /url: /support
          - img [ref=e66]:
            - img [ref=e67]
          - generic [ref=e69]: Поддержка
        - button "ТP Тест Playwright" [ref=e70] [cursor=pointer]:
          - generic [ref=e71]: ТP
          - generic [ref=e72]: Тест Playwright
      - button "Свернуть меню" [ref=e73] [cursor=pointer]
    - main [ref=e81]:
      - generic [ref=e82]:
        - generic [ref=e84]: Дашборд
        - generic [ref=e85]:
          - button [ref=e87] [cursor=pointer]:
            - img [ref=e90]:
              - img [ref=e91]
          - button [ref=e93] [cursor=pointer]:
            - img [ref=e96]:
              - img [ref=e97]
          - button "Добавить" [ref=e101] [cursor=pointer]:
            - img [ref=e104]:
              - img [ref=e105]
            - generic [ref=e107]: Добавить
      - generic [ref=e108]:
        - link "Активных учеников 1" [ref=e109] [cursor=pointer]:
          - /url: /students
          - generic [ref=e110]:
            - generic [ref=e111]:
              - generic [ref=e112]: Активных учеников
              - img [ref=e114]:
                - img [ref=e115]
            - generic [ref=e118]: "1"
        - link "Занятий в этом месяце 1" [ref=e119] [cursor=pointer]:
          - /url: /schedule
          - generic [ref=e120]:
            - generic [ref=e121]:
              - generic [ref=e122]: Занятий в этом месяце
              - img [ref=e124]:
                - img [ref=e125]
            - generic [ref=e128]: "1"
        - link "Доход за месяц 3 000 ₽" [ref=e129] [cursor=pointer]:
          - /url: /finance
          - generic [ref=e130]:
            - generic [ref=e131]:
              - generic [ref=e132]: Доход за месяц
              - img [ref=e134]:
                - img [ref=e135]
            - generic [ref=e138]: 3 000 ₽
        - link "К оплате учениками 0 ₽" [ref=e139] [cursor=pointer]:
          - /url: /payments
          - generic [ref=e140]:
            - generic [ref=e141]:
              - generic [ref=e142]: К оплате учениками
              - img [ref=e144]:
                - img [ref=e145]
            - generic [ref=e148]: 0 ₽
      - generic [ref=e149]:
        - generic [ref=e150]:
          - generic [ref=e151]:
            - generic [ref=e152]:
              - generic [ref=e153]: Доход
              - generic [ref=e154]:
                - button "Месяц" [ref=e155] [cursor=pointer]
                - button "Квартал" [ref=e156] [cursor=pointer]
                - button "Год" [ref=e157] [cursor=pointer]
            - generic [ref=e158]:
              - generic [ref=e159]:
                - generic [ref=e162]: Получено
                - generic [ref=e165]: Запланировано
              - generic [ref=e169]:
                - generic [ref=e170]: "Получено:"
                - generic [ref=e171]: 3 000 ₽
              - generic [ref=e172]:
                - generic [ref=e173]: Итого за период
                - generic [ref=e174]: 3 000 ₽
          - generic [ref=e175]:
            - generic [ref=e176]:
              - generic [ref=e177]:
                - generic [ref=e178]: Конверсия в оплату
                - button "Месяц" [ref=e180] [cursor=pointer]:
                  - img [ref=e183]:
                    - img [ref=e184]
                  - generic [ref=e186]: Месяц
              - generic [ref=e188]:
                - generic [ref=e189]:
                  - generic [ref=e190]: 100%
                  - generic [ref=e191]: +1 000 ₽
                - generic [ref=e195]:
                  - generic [ref=e196]: 0%
                  - generic [ref=e197]: 100%
                - generic [ref=e198]:
                  - generic [ref=e199]:
                    - generic [ref=e202]: Проведено
                    - generic [ref=e203]: 1 зан. · 2 000 ₽
                  - generic [ref=e204]:
                    - generic [ref=e207]: Оплачено
                    - generic [ref=e208]: 1 плат. · 3 000 ₽
            - generic [ref=e209]:
              - generic [ref=e210]:
                - generic [ref=e211]: Истекающие пакеты
                - link "Все →" [ref=e212] [cursor=pointer]:
                  - /url: /packages
              - generic [ref=e213]: Нет пакетов с истекающим сроком
          - generic [ref=e214]:
            - generic [ref=e215]:
              - generic [ref=e216]: Последние оплаты
              - link "Все →" [ref=e217] [cursor=pointer]:
                - /url: /payments
            - table [ref=e219]:
              - rowgroup [ref=e220]:
                - row "Дата Ученик Сумма Способ Статус" [ref=e221]:
                  - columnheader "Дата" [ref=e222]
                  - columnheader "Ученик" [ref=e223]
                  - columnheader "Сумма" [ref=e224]
                  - columnheader "Способ" [ref=e225]
                  - columnheader "Статус" [ref=e226]
              - rowgroup [ref=e227]:
                - row "11.04.2026 Платящий Тест +3 000 ₽ Наличные Получен" [ref=e228]:
                  - cell "11.04.2026" [ref=e229]
                  - cell "Платящий Тест" [ref=e230]
                  - cell "+3 000 ₽" [ref=e231]:
                    - generic [ref=e232]: +3 000 ₽
                  - cell "Наличные" [ref=e233]
                  - cell "Получен" [ref=e234]:
                    - generic [ref=e237]: Получен
        - generic [ref=e238]:
          - generic [ref=e239]:
            - generic [ref=e240]:
              - generic [ref=e241]: Сегодня, 11 апреля
              - link "Всё расписание →" [ref=e242] [cursor=pointer]:
                - /url: /schedule
            - generic [ref=e243]: Занятий на сегодня нет
          - generic [ref=e244]:
            - generic [ref=e245]:
              - generic [ref=e246]: Занятия на неделю
              - link "Расписание →" [ref=e247] [cursor=pointer]:
                - /url: /schedule
            - generic [ref=e248]: На ближайшую неделю занятий нет
          - generic [ref=e249]:
            - generic [ref=e250]:
              - generic [ref=e251]: Задолженности
              - link "Все →" [ref=e252] [cursor=pointer]:
                - /url: /payments
            - generic [ref=e253]: Задолженностей нет
  - alert [ref=e254]: Дашборд — Repeto
```

# Test source

```ts
  198 | 
  199 |     // Completed lesson without payment = debt
  200 |     const yesterday = new Date();
  201 |     yesterday.setDate(yesterday.getDate() - 1);
  202 |     yesterday.setHours(14, 0, 0, 0);
  203 |     const lesson = await createLessonAPI(page, token, student.id, {
  204 |       scheduledAt: yesterday.toISOString(),
  205 |     });
  206 |     await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
  207 |       headers: { Authorization: `Bearer ${token}` },
  208 |       data: { status: 'COMPLETED' },
  209 |     });
  210 | 
  211 |     await loginAndGoto(page, '/dashboard', email, password);
  212 |     await page.waitForTimeout(2_000);
  213 |   });
  214 | 
  215 |   test.afterAll(async () => {
  216 |     await deleteAccount(page, token, password);
  217 |     await page.close();
  218 |   });
  219 | 
  220 |   test('31.1 Виджет «Задолженности» виден', async () => {
  221 |     const debtCard = page.locator('.card').filter({ hasText: 'Задолженности' });
  222 |     await expect(debtCard).toBeVisible();
  223 |   });
  224 | 
  225 |   test('31.2 Должник отображается в списке', async () => {
  226 |     const debtCard = page.locator('.card').filter({ hasText: 'Задолженности' });
  227 |     await expect(debtCard.getByText('Должник Тест')).toBeVisible({ timeout: 5_000 });
  228 |   });
  229 | 
  230 |   test('31.3 Сумма долга отображается красным', async () => {
  231 |     const debtCard = page.locator('.card').filter({ hasText: 'Задолженности' });
  232 |     const debtAmount = debtCard.locator('.text-pink-1');
  233 |     await expect(debtAmount.first()).toBeVisible();
  234 |   });
  235 | 
  236 |   test('31.4 Клик по должнику → страница ученика', async () => {
  237 |     const debtCard = page.locator('.card').filter({ hasText: 'Задолженности' });
  238 |     const link = debtCard.locator(`a[href="/students/${studentId}"]`).first();
  239 |     await link.click();
  240 |     await page.waitForURL(`**/students/${studentId}`);
  241 |     expect(page.url()).toContain('/students/');
  242 |     await page.goto('/dashboard');
  243 |     await page.waitForTimeout(1_000);
  244 |   });
  245 | });
  246 | 
  247 | /* ═══════════════════════════════════════════════════════════════
  248 |    Journey 32 · Последние оплаты + график дохода + конверсия
  249 |    ═══════════════════════════════════════════════════════════════ */
  250 | test.describe('Journey 32: Последние оплаты, доход и конверсия', () => {
  251 |   let page: Page;
  252 |   let token: string;
  253 |   let email: string;
  254 |   const password = 'TestPass123!';
  255 | 
  256 |   test.beforeAll(async ({ browser }) => {
  257 |     page = await browser.newPage();
  258 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  259 |     token = reg.accessToken;
  260 |     email = reg.email;
  261 | 
  262 |     const student = await createStudentAPI(page, token, { name: 'Платящий Тест' });
  263 | 
  264 |     // Completed lesson
  265 |     const yesterday = new Date();
  266 |     yesterday.setDate(yesterday.getDate() - 1);
  267 |     yesterday.setHours(14, 0, 0, 0);
  268 |     const lesson = await createLessonAPI(page, token, student.id, {
  269 |       scheduledAt: yesterday.toISOString(),
  270 |     });
  271 |     await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
  272 |       headers: { Authorization: `Bearer ${token}` },
  273 |       data: { status: 'COMPLETED' },
  274 |     });
  275 | 
  276 |     // Payment
  277 |     await page.request.post(`${API}/payments`, {
  278 |       headers: { Authorization: `Bearer ${token}` },
  279 |       data: {
  280 |         studentId: student.id,
  281 |         amount: 3000,
  282 |         method: 'CASH',
  283 |         date: new Date().toISOString(),
  284 |       },
  285 |     });
  286 | 
  287 |     await loginAndGoto(page, '/dashboard', email, password);
  288 |     await page.waitForTimeout(2_000);
  289 |   });
  290 | 
  291 |   test.afterAll(async () => {
  292 |     await deleteAccount(page, token, password);
  293 |     await page.close();
  294 |   });
  295 | 
  296 |   test('32.1 Виджет «Последние оплаты» виден', async () => {
  297 |     const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
> 298 |     await expect(card).toBeVisible();
      |                        ^ Error: expect(locator).toBeVisible() failed
  299 |   });
  300 | 
  301 |   test('32.2 Оплата отображается в таблице', async () => {
  302 |     const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
  303 |     await expect(card.getByText('Платящий Тест')).toBeVisible({ timeout: 5_000 });
  304 |   });
  305 | 
  306 |   test('32.3 Сумма оплаты видна', async () => {
  307 |     const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
  308 |     await expect(card.getByText(/3[\s\u00a0]?000/)).toBeVisible();
  309 |   });
  310 | 
  311 |   test('32.4 Статус оплаты — «Получен»', async () => {
  312 |     const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
  313 |     await expect(card.getByText('Получен')).toBeVisible();
  314 |   });
  315 | 
  316 |   test('32.5 Виджет «Доход» виден', async () => {
  317 |     const card = page.locator('.card').filter({ hasText: 'Итого за период' });
  318 |     await expect(card).toBeVisible();
  319 |   });
  320 | 
  321 |   test('32.6 Получено — сумма отображается', async () => {
  322 |     const card = page.locator('.card').filter({ hasText: 'Итого за период' });
  323 |     await expect(card.getByText(/Получено/).first()).toBeVisible({ timeout: 5_000 });
  324 |   });
  325 | 
  326 |   test('32.7 Итого за период — содержит ₽', async () => {
  327 |     const card = page.locator('.card').filter({ hasText: 'Итого за период' });
  328 |     const total = card.locator('.text-h5');
  329 |     await expect(total).toBeVisible();
  330 |     const text = await total.textContent();
  331 |     expect(text).toMatch(/₽/);
  332 |     expect(text).not.toBe('0 ₽');
  333 |   });
  334 | 
  335 |   test('32.8 Конверсия в оплату — процент виден', async () => {
  336 |     const card = page.locator('.card').filter({ hasText: 'Конверсия в оплату' });
  337 |     await expect(card).toBeVisible();
  338 |     const pct = card.locator('.text-h1');
  339 |     await expect(pct).toBeVisible();
  340 |   });
  341 | });
  342 | 
  343 | /* ═══════════════════════════════════════════════════════════════
  344 |    Journey 33 · Занятия на неделю + Истекающие пакеты
  345 |    ═══════════════════════════════════════════════════════════════ */
  346 | test.describe('Journey 33: Занятия на неделю и истекающие пакеты', () => {
  347 |   let page: Page;
  348 |   let token: string;
  349 |   let email: string;
  350 |   const password = 'TestPass123!';
  351 | 
  352 |   test.beforeAll(async ({ browser }) => {
  353 |     page = await browser.newPage();
  354 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  355 |     token = reg.accessToken;
  356 |     email = reg.email;
  357 | 
  358 |     const student = await createStudentAPI(page, token, { name: 'Неделя Ученик' });
  359 | 
  360 |     // Lesson tomorrow (for WeekSchedule)
  361 |     await createLessonAPI(page, token, student.id, { subject: 'Английский' });
  362 | 
  363 |     await loginAndGoto(page, '/dashboard', email, password);
  364 |     await page.waitForTimeout(2_000);
  365 |   });
  366 | 
  367 |   test.afterAll(async () => {
  368 |     await deleteAccount(page, token, password);
  369 |     await page.close();
  370 |   });
  371 | 
  372 |   test('33.1 Виджет «Занятия на неделю» виден', async () => {
  373 |     const card = page.locator('.card').filter({ hasText: 'Занятия на неделю' });
  374 |     await expect(card).toBeVisible();
  375 |   });
  376 | 
  377 |   test('33.2 Урок на неделю отображается', async () => {
  378 |     const card = page.locator('.card').filter({ hasText: 'Занятия на неделю' });
  379 |     await expect(card.getByText(/Математика/)).toBeVisible({ timeout: 5_000 });
  380 |   });
  381 | 
  382 |   test('33.3 Клик по уроку → LessonDetailModal', async () => {
  383 |     const card = page.locator('.card').filter({ hasText: 'Занятия на неделю' });
  384 |     await card.locator('button').first().click();
  385 |     await page.waitForTimeout(500);
  386 | 
  387 |     const modal = page.locator('[role="dialog"]');
  388 |     await expect(modal.first()).toBeVisible({ timeout: 3_000 });
  389 | 
  390 |     await page.keyboard.press('Escape');
  391 |     await page.waitForTimeout(300);
  392 |   });
  393 | 
  394 |   test('33.4 Виджет «Истекающие пакеты» виден', async () => {
  395 |     const card = page.locator('.card').filter({ hasText: 'Истекающие пакеты' });
  396 |     await expect(card).toBeVisible();
  397 |   });
  398 | 
```