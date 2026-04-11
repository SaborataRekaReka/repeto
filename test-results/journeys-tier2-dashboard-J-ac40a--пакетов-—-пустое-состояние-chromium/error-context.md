# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-dashboard.spec.ts >> Journey 33: Занятия на неделю и истекающие пакеты >> 33.5 Без пакетов — пустое состояние
- Location: e2e\journeys-tier2-dashboard.spec.ts:399:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.card').filter({ hasText: 'Истекающие пакеты' }).getByText(/нет пакетов|истекающим/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.card').filter({ hasText: 'Истекающие пакеты' }).getByText(/нет пакетов|истекающим/i)

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
          - generic [ref=e56]: Уведомления
        - link "Настройки" [ref=e57] [cursor=pointer]:
          - /url: /settings
          - img [ref=e59]:
            - img [ref=e60]
          - generic [ref=e62]: Настройки
        - link "Поддержка" [ref=e63] [cursor=pointer]:
          - /url: /support
          - img [ref=e65]:
            - img [ref=e66]
          - generic [ref=e68]: Поддержка
        - button "ТP Тест Playwright" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТP
          - generic [ref=e71]: Тест Playwright
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e83]: Дашборд
        - generic [ref=e84]:
          - button [ref=e86] [cursor=pointer]:
            - img [ref=e89]:
              - img [ref=e90]
          - button [ref=e92] [cursor=pointer]:
            - img [ref=e95]:
              - img [ref=e96]
          - button "Добавить" [ref=e99] [cursor=pointer]:
            - img [ref=e102]:
              - img [ref=e103]
            - generic [ref=e105]: Добавить
      - generic [ref=e106]:
        - link "Активных учеников 1" [ref=e107] [cursor=pointer]:
          - /url: /students
          - generic [ref=e108]:
            - generic [ref=e109]:
              - generic [ref=e110]: Активных учеников
              - img [ref=e112]:
                - img [ref=e113]
            - generic [ref=e116]: "1"
        - link "Занятий в этом месяце 0" [ref=e117] [cursor=pointer]:
          - /url: /schedule
          - generic [ref=e118]:
            - generic [ref=e119]:
              - generic [ref=e120]: Занятий в этом месяце
              - img [ref=e122]:
                - img [ref=e123]
            - generic [ref=e126]: "0"
        - link "Доход за месяц 0 ₽" [ref=e127] [cursor=pointer]:
          - /url: /finance
          - generic [ref=e128]:
            - generic [ref=e129]:
              - generic [ref=e130]: Доход за месяц
              - img [ref=e132]:
                - img [ref=e133]
            - generic [ref=e136]: 0 ₽
        - link "К оплате учениками 0 ₽" [ref=e137] [cursor=pointer]:
          - /url: /payments
          - generic [ref=e138]:
            - generic [ref=e139]:
              - generic [ref=e140]: К оплате учениками
              - img [ref=e142]:
                - img [ref=e143]
            - generic [ref=e146]: 0 ₽
      - generic [ref=e147]:
        - generic [ref=e148]:
          - generic [ref=e149]:
            - generic [ref=e150]:
              - generic [ref=e151]: Доход
              - generic [ref=e152]:
                - button "Месяц" [ref=e153] [cursor=pointer]
                - button "Квартал" [ref=e154] [cursor=pointer]
                - button "Год" [ref=e155] [cursor=pointer]
            - generic [ref=e156]:
              - generic [ref=e157]:
                - generic [ref=e160]: Получено
                - generic [ref=e163]: Запланировано
              - generic [ref=e167]:
                - generic [ref=e168]: "Запланировано:"
                - generic [ref=e169]: 2 000 ₽
              - generic [ref=e170]:
                - generic [ref=e171]: Итого за период
                - generic [ref=e172]: 2 000 ₽
          - generic [ref=e173]:
            - generic [ref=e174]:
              - generic [ref=e175]:
                - generic [ref=e176]: Конверсия в оплату
                - button "Месяц" [ref=e178] [cursor=pointer]:
                  - img [ref=e181]:
                    - img [ref=e182]
                  - generic [ref=e184]: Месяц
              - generic [ref=e186]:
                - generic [ref=e188]: 0%
                - generic [ref=e191]:
                  - generic [ref=e192]: 0%
                  - generic [ref=e193]: 100%
                - generic [ref=e194]:
                  - generic [ref=e195]:
                    - generic [ref=e198]: Проведено
                    - generic [ref=e199]: 0 зан. · 0 ₽
                  - generic [ref=e200]:
                    - generic [ref=e203]: Оплачено
                    - generic [ref=e204]: 0 плат. · 0 ₽
            - generic [ref=e205]:
              - generic [ref=e206]:
                - generic [ref=e207]: Истекающие пакеты
                - link "Все →" [ref=e208] [cursor=pointer]:
                  - /url: /packages
              - generic [ref=e209]: Нет пакетов с истекающим сроком
          - generic [ref=e210]:
            - generic [ref=e211]:
              - generic [ref=e212]: Последние оплаты
              - link "Все →" [ref=e213] [cursor=pointer]:
                - /url: /payments
            - generic [ref=e214]: Пока оплат не было
        - generic [ref=e215]:
          - generic [ref=e216]:
            - generic [ref=e217]:
              - generic [ref=e218]: Сегодня, 11 апреля
              - link "Всё расписание →" [ref=e219] [cursor=pointer]:
                - /url: /schedule
            - generic [ref=e220]: Занятий на сегодня нет
          - generic [ref=e221]:
            - generic [ref=e222]:
              - generic [ref=e223]: Занятия на неделю
              - link "Расписание →" [ref=e224] [cursor=pointer]:
                - /url: /schedule
            - generic [ref=e226]:
              - generic [ref=e228]: Вс, 12 апр.
              - button "Неделя У. 14:00 – 15:00 Математика" [ref=e229] [cursor=pointer]:
                - generic [ref=e231]:
                  - generic [ref=e232]:
                    - generic [ref=e233]: Неделя У.
                    - generic [ref=e234]: 14:00 – 15:00
                  - generic [ref=e237]: Математика
          - generic [ref=e238]:
            - generic [ref=e239]:
              - generic [ref=e240]: Задолженности
              - link "Все →" [ref=e241] [cursor=pointer]:
                - /url: /payments
            - generic [ref=e242]: Задолженностей нет
  - alert [ref=e243]: Дашборд — Repeto
```

# Test source

```ts
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
  399 |   test('33.5 Без пакетов — пустое состояние', async () => {
  400 |     const card = page.locator('.card').filter({ hasText: 'Истекающие пакеты' });
  401 |     const emptyText = card.getByText(/нет пакетов|истекающим/i);
> 402 |     await expect(emptyText).toBeVisible();
      |                             ^ Error: expect(locator).toBeVisible() failed
  403 |   });
  404 | });
  405 | 
```