# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-student-card.spec.ts >> Journey 21: Таб «Занятия» — LessonDetailModal >> 21.2 Клик по уроку → LessonDetailModal
- Location: e2e\journeys-tier2-student-card.spec.ts:402:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('table tbody tr').filter({ hasText: /Физика/ }).locator('button').last()

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
        - button "ТУ Тест Урок Карточка" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТУ
          - generic [ref=e71]: Тест Урок Карточка
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - button [ref=e83] [cursor=pointer]:
            - img [ref=e86]:
              - img [ref=e87]
          - generic [ref=e89]: Урокный Ученик
        - generic [ref=e90]:
          - button [ref=e92] [cursor=pointer]:
            - img [ref=e95]:
              - img [ref=e96]
          - button [ref=e98] [cursor=pointer]:
            - img [ref=e101]:
              - img [ref=e102]
          - button "Добавить" [ref=e105] [cursor=pointer]:
            - img [ref=e108]:
              - img [ref=e109]
            - generic [ref=e111]: Добавить
      - generic [ref=e112]:
        - complementary [ref=e113]:
          - generic [ref=e114]:
            - generic [ref=e115]: УУ
            - generic [ref=e116]: Урокный Ученик
            - generic [ref=e117]: Физика
            - generic [ref=e118]:
              - generic [ref=e121]: Активен
              - generic [ref=e122]: 0 ₽
            - generic [ref=e123]:
              - button "Написать" [ref=e124] [cursor=pointer]:
                - img [ref=e127]:
                  - img [ref=e128]
                - generic [ref=e130]: Написать
              - button "Портал" [ref=e131] [cursor=pointer]:
                - img [ref=e134]:
                  - img [ref=e135]
                - generic [ref=e137]: Портал
          - navigation [ref=e138]:
            - button "Занятия" [ref=e139] [cursor=pointer]:
              - img [ref=e140]:
                - img [ref=e141]
              - text: Занятия
            - button "Профиль" [ref=e143] [cursor=pointer]:
              - img [ref=e144]:
                - img [ref=e145]
              - text: Профиль
            - button "Контакты" [ref=e147] [cursor=pointer]:
              - img [ref=e148]:
                - img [ref=e149]
              - text: Контакты
            - button "Оплаты" [ref=e151] [cursor=pointer]:
              - img [ref=e152]:
                - img [ref=e153]
              - text: Оплаты
            - button "Заметки" [ref=e155] [cursor=pointer]:
              - img [ref=e156]:
                - img [ref=e157]
              - text: Заметки
            - button "Домашка" [ref=e159] [cursor=pointer]:
              - img [ref=e160]:
                - img [ref=e161]
              - text: Домашка
        - generic [ref=e164]:
          - generic [ref=e165]:
            - generic [ref=e166]: Занятия
            - button "Назначить" [ref=e167] [cursor=pointer]:
              - img [ref=e170]:
                - img [ref=e171]
              - generic [ref=e173]: Назначить
          - button "Дата 12.04.2026 Время 14:00 – 15:00 Предмет Физика Ставка 2 000 ₽ Запланировано" [ref=e175] [cursor=pointer]:
            - generic [ref=e176]:
              - generic [ref=e177]:
                - generic [ref=e178]: Дата
                - text: 12.04.2026
              - generic [ref=e179]:
                - generic [ref=e180]: Время
                - generic [ref=e181]: 14:00 – 15:00
              - generic [ref=e182]:
                - generic [ref=e183]: Предмет
                - text: Физика
              - generic [ref=e184]:
                - generic [ref=e185]: Ставка
                - generic [ref=e186]: 2 000 ₽
              - generic [ref=e187]:
                - generic [ref=e190]: Запланировано
                - img [ref=e191]:
                  - img [ref=e192]
  - alert [ref=e194]: /students/9cc866e4-af17-406e-86a7-f1510251b3b0
```

# Test source

```ts
  306 |   });
  307 | 
  308 |   test.afterAll(async () => {
  309 |     await page.close();
  310 |   });
  311 | 
  312 |   test('20.1 Карточка → таб «Оплаты» → «Записать оплату» → модалка', async () => {
  313 |     await loginAndGoto(page, `/students/${studentId}?tab=payments`, email, password);
  314 |     await page.waitForTimeout(1_000);
  315 | 
  316 |     const payBtn = page.getByRole('button', { name: /Записать оплату/i }).first();
  317 |     await expect(payBtn).toBeVisible({ timeout: 5_000 });
  318 |     await payBtn.click();
  319 | 
  320 |     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
  321 |     await expect(page.getByRole('dialog')).toContainText(/Новая оплата/i);
  322 |   });
  323 | 
  324 |   test('20.2 Ученик предзаполнен (не Select, а статичный div)', async () => {
  325 |     const modal = page.getByRole('dialog');
  326 | 
  327 |     // defaultStudent → рендерится не Select, а статичный div с именем
  328 |     await expect(modal.getByText('Платящий Ученик')).toBeVisible();
  329 | 
  330 |     // Нет кнопки-триггера Select для ученика
  331 |     const studentSelect = modal.locator('button').filter({ hasText: /Выберите ученика/ });
  332 |     await expect(studentSelect).toHaveCount(0);
  333 |   });
  334 | 
  335 |   test('20.3 Заполнить сумму → Сохранить → оплата в таблице', async () => {
  336 |     const modal = page.getByRole('dialog');
  337 | 
  338 |     await modal.getByPlaceholder('4200').fill('6000');
  339 | 
  340 |     await modal.getByRole('button', { name: 'Сохранить' }).click();
  341 |     await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });
  342 | 
  343 |     // Перезагрузка для обновления данных
  344 |     await page.reload();
  345 |     await page.waitForTimeout(2_000);
  346 | 
  347 |     // Нажимаем на таб Оплаты снова после reload
  348 |     await page.getByText('Оплаты').first().click();
  349 |     await page.waitForTimeout(1_000);
  350 | 
  351 |     // Оплата видна
  352 |     await expect(page.locator('body')).toContainText(/6[\s,.]?000|6000/, { timeout: 5_000 });
  353 |   });
  354 | });
  355 | 
  356 | // ═══════════════════════════════════════════════════════════════
  357 | // Journey 21: Таб «Занятия» — LessonDetailModal + статусы
  358 | // ═══════════════════════════════════════════════════════════════
  359 | test.describe('Journey 21: Таб «Занятия» — LessonDetailModal', () => {
  360 |   test.describe.configure({ mode: 'serial' });
  361 | 
  362 |   let email: string;
  363 |   let token: string;
  364 |   const password = 'Journey21Pass!';
  365 |   let page: Page;
  366 |   let studentId: string;
  367 | 
  368 |   test.beforeAll(async ({ browser }) => {
  369 |     page = await browser.newPage();
  370 |     email = uniqueEmail();
  371 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Урок Карточка' });
  372 |     token = auth.accessToken;
  373 | 
  374 |     const student = await createStudentAPI(page, token, {
  375 |       name: 'Урокный Ученик',
  376 |       subject: 'Физика',
  377 |       rate: 2000,
  378 |     });
  379 |     studentId = student.id;
  380 | 
  381 |     // Создаём урок на завтра
  382 |     await createLessonAPI(page, token, studentId, {
  383 |       subject: 'Физика',
  384 |       rate: 2000,
  385 |       duration: 60,
  386 |     });
  387 |   });
  388 | 
  389 |   test.afterAll(async () => {
  390 |     await page.close();
  391 |   });
  392 | 
  393 |   test('21.1 Карточка → таб «Занятия» → урок в таблице', async () => {
  394 |     await loginAndGoto(page, `/students/${studentId}`, email, password);
  395 |     await page.waitForTimeout(1_000);
  396 | 
  397 |     // Таб «Занятия» активен по умолчанию
  398 |     await expect(page.getByText('Физика').first()).toBeVisible({ timeout: 5_000 });
  399 |     await expect(page.getByText('Запланировано').first()).toBeVisible();
  400 |   });
  401 | 
  402 |   test('21.2 Клик по уроку → LessonDetailModal', async () => {
  403 |     // В каждой строке есть кнопка-шеврон (arrow-next) для открытия детали
  404 |     const arrowBtn = page.locator('table tbody tr').filter({ hasText: /Физика/ })
  405 |       .locator('button').last();
> 406 |     await arrowBtn.click();
      |                    ^ Error: locator.click: Target page, context or browser has been closed
  407 | 
  408 |     // Модалка детали урока
  409 |     const dialog = page.getByRole('dialog');
  410 |     await expect(dialog).toBeVisible({ timeout: 3_000 });
  411 |     await expect(dialog.getByText(/Запланировано/i)).toBeVisible();
  412 |     await expect(dialog).toContainText(/Физика/);
  413 |   });
  414 | 
  415 |   test('21.3 Кнопка «Проведено» → статус меняется', async () => {
  416 |     const dialog = page.getByRole('dialog');
  417 |     const completedBtn = dialog.getByRole('button', { name: /Проведено/i });
  418 |     await expect(completedBtn).toBeVisible();
  419 |     await completedBtn.click();
  420 | 
  421 |     // После клика модалка может закрыться автоматически
  422 |     await expect(dialog).toBeHidden({ timeout: 5_000 });
  423 |   });
  424 | 
  425 |   test('21.4 Закрыть модалку → статус обновился в таблице', async () => {
  426 |     // Перезагружаем страницу для получения актуальных данных
  427 |     await page.reload();
  428 |     await page.waitForTimeout(2_000);
  429 |     await expect(page.getByText(/Проведено/i).first()).toBeVisible({ timeout: 5_000 });
  430 |   });
  431 | });
  432 | 
  433 | // ═══════════════════════════════════════════════════════════════
  434 | // Journey 22: Генерация портал-ссылки
  435 | // ═══════════════════════════════════════════════════════════════
  436 | test.describe('Journey 22: Генерация портал-ссылки', () => {
  437 |   test.describe.configure({ mode: 'serial' });
  438 | 
  439 |   let email: string;
  440 |   let token: string;
  441 |   const password = 'Journey22Pass!';
  442 |   let page: Page;
  443 |   let studentId: string;
  444 | 
  445 |   test.beforeAll(async ({ browser }) => {
  446 |     page = await browser.newPage();
  447 |     email = uniqueEmail();
  448 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Портал Ссылка' });
  449 |     token = auth.accessToken;
  450 | 
  451 |     // Нужен slug для портала
  452 |     await page.request.patch(`${API}/settings/account`, {
  453 |       headers: { Authorization: `Bearer ${token}` },
  454 |       data: { slug: `test-portal-${Date.now()}` },
  455 |     });
  456 | 
  457 |     const student = await createStudentAPI(page, token, {
  458 |       name: 'Портальный Ученик',
  459 |       subject: 'Русский язык',
  460 |       rate: 1800,
  461 |     });
  462 |     studentId = student.id;
  463 |   });
  464 | 
  465 |   test.afterAll(async () => {
  466 |     await page.close();
  467 |   });
  468 | 
  469 |   test('22.1 Карточка → кнопка портальной ссылки → модалка', async () => {
  470 |     await loginAndGoto(page, `/students/${studentId}`, email, password);
  471 |     await page.waitForTimeout(1_000);
  472 | 
  473 |     // Кнопка с title="Ссылка для ученика"
  474 |     const portalBtn = page.locator('button[title="Ссылка для ученика"]').first();
  475 |     await portalBtn.click();
  476 | 
  477 |     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  478 |     await expect(page.getByRole('dialog')).toContainText(/Ссылка для ученика/i);
  479 |   });
  480 | 
  481 |   test('22.2 Ссылка сгенерирована и видна', async () => {
  482 |     const modal = page.getByRole('dialog');
  483 | 
  484 |     // Ждём загрузки ссылки (не «Генерация ссылки…»)
  485 |     await expect(modal.getByText('Генерация ссылки…')).toBeHidden({ timeout: 10_000 });
  486 | 
  487 |     // Ссылка содержит /s/ (portal token path)
  488 |     await expect(modal.locator('text=/\\/s\\//')).toBeVisible({ timeout: 5_000 });
  489 |   });
  490 | 
  491 |   test('22.3 Кнопка «Скопировать» работает', async () => {
  492 |     const modal = page.getByRole('dialog');
  493 | 
  494 |     const copyBtn = modal.getByRole('button', { name: /Скопировать/i });
  495 |     await expect(copyBtn).toBeVisible();
  496 |     await copyBtn.click();
  497 | 
  498 |     // В headless clipboard API может не сработать, проверяем мягко:
  499 |     // либо текст «Скопировано!», либо кнопка просто осталась
  500 |     const copied = modal.getByText('Скопировано!');
  501 |     const stillCopy = modal.getByRole('button', { name: /Скопировать/i });
  502 |     await expect(copied.or(stillCopy)).toBeVisible({ timeout: 3_000 });
  503 |   });
  504 | 
  505 |   test('22.4 Кнопка «WhatsApp» видна', async () => {
  506 |     const modal = page.getByRole('dialog');
```