# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> Journey 3: Полный цикл урока — от создания до оплаты >> 3.4 Переход на карточку ученика → баланс отрицательный (долг за урок)
- Location: e2e\journeys.spec.ts:339:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Ольга Петрова')
Expected: visible
Error: strict mode violation: getByText('Ольга Петрова') resolved to 2 elements:
    1) <span class="g-text g-text_variant_header-1">Ольга Петрова</span> aka locator('header').getByText('Ольга Петрова')
    2) <div class="g-text g-text_variant_subheader-2">Ольга Петрова</div> aka getByText('Ольга Петрова').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Ольга Петрова')

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
        - button "ТЦ Тест Цикл Урока" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТЦ
          - generic [ref=e71]: Тест Цикл Урока
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - button [ref=e83] [cursor=pointer]:
            - img [ref=e86]:
              - img [ref=e87]
          - generic [ref=e89]: Ольга Петрова
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
            - generic [ref=e115]: ОП
            - generic [ref=e116]: Ольга Петрова
            - generic [ref=e117]: Физика
            - generic [ref=e118]:
              - generic [ref=e121]: Активен
              - generic [ref=e122]: "-3 000 ₽"
            - generic [ref=e123]:
              - button "Написать" [ref=e124] [cursor=pointer]:
                - img [ref=e127]:
                  - img [ref=e128]
                - generic [ref=e130]: Написать
              - button "Портал" [ref=e131] [cursor=pointer]:
                - img [ref=e134]:
                  - img [ref=e135]
                - generic [ref=e137]: Портал
              - button "Напомнить" [ref=e138] [cursor=pointer]:
                - img [ref=e141]:
                  - img [ref=e142]
                - generic [ref=e144]: Напомнить
          - navigation [ref=e145]:
            - button "Занятия" [ref=e146] [cursor=pointer]:
              - img [ref=e147]:
                - img [ref=e148]
              - text: Занятия
            - button "Профиль" [ref=e150] [cursor=pointer]:
              - img [ref=e151]:
                - img [ref=e152]
              - text: Профиль
            - button "Контакты" [ref=e154] [cursor=pointer]:
              - img [ref=e155]:
                - img [ref=e156]
              - text: Контакты
            - button "Оплаты" [ref=e158] [cursor=pointer]:
              - img [ref=e159]:
                - img [ref=e160]
              - text: Оплаты
            - button "Заметки" [ref=e162] [cursor=pointer]:
              - img [ref=e163]:
                - img [ref=e164]
              - text: Заметки
            - button "Домашка" [ref=e166] [cursor=pointer]:
              - img [ref=e167]:
                - img [ref=e168]
              - text: Домашка
        - generic [ref=e171]:
          - generic [ref=e172]:
            - generic [ref=e173]: Занятия
            - button "Назначить" [ref=e174] [cursor=pointer]:
              - img [ref=e177]:
                - img [ref=e178]
              - generic [ref=e180]: Назначить
          - button "Дата 12.04.2026 Время 14:00 – 15:00 Предмет Физика Ставка 3 000 ₽ Проведено" [ref=e182] [cursor=pointer]:
            - generic [ref=e183]:
              - generic [ref=e184]:
                - generic [ref=e185]: Дата
                - text: 12.04.2026
              - generic [ref=e186]:
                - generic [ref=e187]: Время
                - generic [ref=e188]: 14:00 – 15:00
              - generic [ref=e189]:
                - generic [ref=e190]: Предмет
                - text: Физика
              - generic [ref=e191]:
                - generic [ref=e192]: Ставка
                - generic [ref=e193]: 3 000 ₽
              - generic [ref=e194]:
                - generic [ref=e197]: Проведено
                - img [ref=e198]:
                  - img [ref=e199]
  - alert [ref=e201]: /students/68551fcb-e13d-44f2-bcfe-6ca84e1b9d6c
```

# Test source

```ts
  243 |       headers: { Authorization: `Bearer ${tutorToken}` },
  244 |       data: { published: false },
  245 |     });
  246 |     expect(unpublishRes.ok()).toBe(true);
  247 | 
  248 |     // Проверяем: публичная страница теперь недоступна (анонимный запрос)
  249 |     const anonCtx = await page.context().browser()!.newContext();
  250 |     const anonPage = await anonCtx.newPage();
  251 |     const resp = await anonPage.goto(`http://127.0.0.1:3100/t/${slug}`);
  252 |     const body = await anonPage.locator('body').textContent({ timeout: 10_000 });
  253 |     // Любой из вариантов: 404 статус, редирект, или текст «не найден/не опубликован»
  254 |     const isHidden =
  255 |       resp?.status() === 404 ||
  256 |       !/Елена Тестова/.test(body ?? '') ||
  257 |       /не найден|не опубликован/i.test(body ?? '');
  258 |     expect(isHidden).toBe(true);
  259 |     await anonCtx.close();
  260 |   });
  261 | });
  262 | 
  263 | // ═══════════════════════════════════════════════════════════════
  264 | // Journey 3: Урок → проведение → оплата → баланс ученика
  265 | // ═══════════════════════════════════════════════════════════════
  266 | test.describe('Journey 3: Полный цикл урока — от создания до оплаты', () => {
  267 |   test.describe.configure({ mode: 'serial' });
  268 | 
  269 |   let email: string;
  270 |   let token: string;
  271 |   const password = 'Journey3Pass!';
  272 |   let studentId: string;
  273 |   let lessonId: string;
  274 |   let page: Page;
  275 | 
  276 |   test.beforeAll(async ({ browser }) => {
  277 |     page = await browser.newPage();
  278 |     email = uniqueEmail();
  279 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Цикл Урока' });
  280 |     token = auth.accessToken;
  281 | 
  282 |     // Создаём ученика
  283 |     const student = await createStudentAPI(page, token, {
  284 |       name: 'Ольга Петрова',
  285 |       rate: 3000,
  286 |       subject: 'Физика',
  287 |     });
  288 |     studentId = student.id;
  289 | 
  290 |     // Создаём урок на завтра
  291 |     const lesson = await createLessonAPI(page, token, studentId, {
  292 |       subject: 'Физика',
  293 |       rate: 3000,
  294 |     });
  295 |     lessonId = lesson.id;
  296 |   });
  297 | 
  298 |   test.afterAll(async () => {
  299 |     await page.close();
  300 |   });
  301 | 
  302 |   test('3.1 Расписание → урок виден в календаре', async () => {
  303 |     await loginAndGoto(page, '/schedule', email, password);
  304 |     await page.waitForTimeout(2_000);
  305 | 
  306 |     // В расписании видна Физика или Ольга
  307 |     await expect(page.locator('body')).toContainText(/Физика|Ольга/i, { timeout: 8_000 });
  308 |   });
  309 | 
  310 |   test('3.2 Кликаем на урок → открывается модалка с деталями', async () => {
  311 |     // Кликаем на элемент урока в календаре
  312 |     const lessonEl = page.getByText(/Физика/i).first();
  313 |     await lessonEl.click();
  314 |     await page.waitForTimeout(500);
  315 | 
  316 |     // Модалка деталей урока
  317 |     await expect(page.locator('body')).toContainText(/Ольга Петрова|Физика|3[\s,.]?000/i, {
  318 |       timeout: 5_000,
  319 |     });
  320 |   });
  321 | 
  322 |   test('3.3 Отмечаем урок как проведённый → статус меняется', async () => {
  323 |     // Ищем кнопку «Проведено» / «Завершить»
  324 |     const doneBtn = page.getByRole('button', { name: /Проведено|Завершить|Провести/i }).first();
  325 |     if (await doneBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  326 |       await doneBtn.click();
  327 |       await page.waitForTimeout(1_500);
  328 |     } else {
  329 |       // Обновляем статус через API
  330 |       await page.request.patch(`${API}/lessons/${lessonId}/status`, {
  331 |         headers: { Authorization: `Bearer ${token}` },
  332 |         data: { status: 'COMPLETED' },
  333 |       });
  334 |       await page.reload();
  335 |       await page.waitForTimeout(1_500);
  336 |     }
  337 |   });
  338 | 
  339 |   test('3.4 Переход на карточку ученика → баланс отрицательный (долг за урок)', async () => {
  340 |     await page.goto(`/students/${studentId}`);
  341 |     await page.waitForTimeout(2_000);
  342 | 
> 343 |     await expect(page.getByText('Ольга Петрова')).toBeVisible({ timeout: 5_000 });
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  344 |     // За проведённый урок должен быть долг ~3000
  345 |     const body = await page.locator('body').textContent() || '';
  346 |     // Наличие суммы в тексте (долг или баланс)
  347 |     expect(body).toMatch(/3[\s,.]?000|баланс|долг|₽/i);
  348 |   });
  349 | 
  350 |   test('3.5 Записываем оплату через модалку из карточки ученика', async () => {
  351 |     // Вкладка «Оплаты»
  352 |     const payTab = page.getByRole('button', { name: /Оплаты/i }).first();
  353 |     if (await payTab.isVisible().catch(() => false)) {
  354 |       await payTab.click();
  355 |       await page.waitForTimeout(500);
  356 |     }
  357 | 
  358 |     // Кнопка «Записать оплату»
  359 |     const payBtn = page.getByRole('button', { name: /Записать оплату|Новая оплата/i }).first();
  360 |     if (await payBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  361 |       await payBtn.click();
  362 |       await page.waitForTimeout(500);
  363 | 
  364 |       // Сумма
  365 |       const amountInput = page.getByPlaceholder(/Сумма|сумма|0/i).first();
  366 |       if (await amountInput.isVisible().catch(() => false)) {
  367 |         await amountInput.fill('3000');
  368 |       }
  369 | 
  370 |       // Сохраняем
  371 |       const saveBtn = page.getByRole('button', { name: /Сохранить|Записать/i }).first();
  372 |       if (await saveBtn.isVisible().catch(() => false)) {
  373 |         await saveBtn.click();
  374 |         await page.waitForTimeout(2_000);
  375 |        }
  376 |     } else {
  377 |       // Если нет кнопки на странице — записываем через API
  378 |       await page.request.post(`${API}/payments`, {
  379 |         headers: { Authorization: `Bearer ${token}` },
  380 |         data: { studentId, amount: 3000, method: 'CASH' },
  381 |       });
  382 |       await page.reload();
  383 |       await page.waitForTimeout(1_500);
  384 |     }
  385 |   });
  386 | 
  387 |   test('3.6 Баланс ученика обнулился → финансы отражают оплату', async () => {
  388 |     // Обновляем карточку ученика
  389 |     await page.goto(`/students/${studentId}`);
  390 |     await page.waitForTimeout(2_000);
  391 | 
  392 |     // Идём на финансы и проверяем
  393 |     await page.getByRole('link', { name: /Финансы/i }).click();
  394 |     await expect(page).toHaveURL(/\/finance/);
  395 |     await page.waitForTimeout(1_500);
  396 | 
  397 |     // Страница финансов загружена — видим суммы
  398 |     await expect(page.locator('body')).toContainText(/₽|руб|доход|Финансы/i);
  399 |   });
  400 | 
  401 |   test('3.7 Страница оплат → только что созданная оплата видна', async () => {
  402 |     await page.goto('/finance/payments');
  403 |     await page.waitForTimeout(1_500);
  404 | 
  405 |     // Оплата от Ольги Петровой на 3000
  406 |     await expect(page.locator('body')).toContainText(/Ольга|3[\s,.]?000/i, { timeout: 5_000 });
  407 |   });
  408 | });
  409 | 
  410 | // ═══════════════════════════════════════════════════════════════
  411 | // Journey 4: Портал ученика — от ссылки до отмены урока
  412 | // ═══════════════════════════════════════════════════════════════
  413 | test.describe('Journey 4: Портал ученика — просмотр, домашка, отмена', () => {
  414 |   test.describe.configure({ mode: 'serial' });
  415 | 
  416 |   let tutorEmail: string;
  417 |   let tutorToken: string;
  418 |   const tutorPassword = 'Journey4Pass!';
  419 |   let slug: string;
  420 |   let portalToken: string;
  421 |   let studentId: string;
  422 |   let lessonId: string;
  423 |   let page: Page;
  424 | 
  425 |   test.beforeAll(async ({ browser }) => {
  426 |     page = await browser.newPage();
  427 |     tutorEmail = uniqueEmail();
  428 |     slug = `j4-${Date.now()}`;
  429 | 
  430 |     const auth = await registerViaAPI(page, {
  431 |       email: tutorEmail,
  432 |       password: tutorPassword,
  433 |       name: 'Портал Тест',
  434 |     });
  435 |     tutorToken = auth.accessToken;
  436 | 
  437 |     // Публикуем профиль
  438 |     await page.request.patch(`${API}/settings/account`, {
  439 |       headers: { Authorization: `Bearer ${tutorToken}` },
  440 |       data: { slug, published: true, subjects: ['Английский'] },
  441 |     });
  442 | 
  443 |     // Создаём ученика
```