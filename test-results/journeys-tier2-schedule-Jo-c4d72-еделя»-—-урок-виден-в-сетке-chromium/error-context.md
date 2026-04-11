# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-schedule.spec.ts >> Journey 27: Уроки во всех видах расписания >> 27.2 Вид «Неделя» — урок виден в сетке
- Location: e2e\journeys-tier2-schedule.spec.ts:287:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByRole('button', { name: 'Неделя' })

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
        - button "ВТ Виды Тест" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ВТ
          - generic [ref=e71]: Виды Тест
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e83]: Расписание
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
      - generic [ref=e107] [cursor=pointer]:
        - generic [ref=e108]:
          - img [ref=e110]:
            - img [ref=e111]
          - generic [ref=e113]: Рабочие часы
        - img [ref=e114]:
          - img [ref=e115]
      - generic [ref=e117]:
        - group [ref=e120] [cursor=pointer]:
          - combobox [ref=e121]:
            - generic [ref=e122]: Запланированные, Проведённые, Отменённые учеником, Отменённые мной, Неявки, Переносы
          - generic [ref=e124]: "6"
          - button "Очистить" [ref=e125]:
            - img [ref=e126]:
              - img [ref=e127]
          - img [ref=e129]:
            - img [ref=e130]
        - generic [ref=e132]:
          - button [ref=e133] [cursor=pointer]:
            - img [ref=e136]:
              - img [ref=e137]
          - button [ref=e139] [cursor=pointer]:
            - img [ref=e142]:
              - img [ref=e143]
        - generic [ref=e145]: 6 – 12 апр 2026
        - radiogroup [ref=e146]:
          - generic [ref=e147] [cursor=pointer]:
            - radio "Месяц" [ref=e148]
            - generic [ref=e149]: Месяц
          - generic [ref=e150]:
            - radio "Неделя" [checked] [ref=e151]
            - generic [ref=e152]: Неделя
          - generic [ref=e153] [cursor=pointer]:
            - radio "День" [ref=e154]
            - generic [ref=e155]: День
        - button "Подключить Яндекс.Календарь" [ref=e156] [cursor=pointer]:
          - img [ref=e159]:
            - img [ref=e160]
          - generic [ref=e162]: Подключить Яндекс.Календарь
        - button "Новое занятие" [ref=e163] [cursor=pointer]:
          - img [ref=e166]:
            - img [ref=e167]
          - generic [ref=e169]: Новое занятие
      - generic [ref=e171]:
        - generic [ref=e172]:
          - generic [ref=e174]:
            - generic [ref=e175]: Пн
            - generic [ref=e177]: "6"
          - generic [ref=e178]:
            - generic [ref=e179]: Вт
            - generic [ref=e181]: "7"
          - generic [ref=e182]:
            - generic [ref=e183]: Ср
            - generic [ref=e185]: "8"
          - generic [ref=e186]:
            - generic [ref=e187]: Чт
            - generic [ref=e189]: "9"
          - generic [ref=e190]:
            - generic [ref=e191]: Пт
            - generic [ref=e193]: "10"
          - generic [ref=e194]:
            - generic [ref=e195]: Сб
            - generic [ref=e197]: "11"
          - generic [ref=e198]:
            - generic [ref=e199]: Вс
            - generic [ref=e201]: "12"
        - generic [ref=e202]:
          - generic [ref=e203]:
            - generic [ref=e205]: 01:00
            - generic [ref=e207]: 02:00
            - generic [ref=e209]: 03:00
            - generic [ref=e211]: 04:00
            - generic [ref=e213]: 05:00
            - generic [ref=e215]: 06:00
            - generic [ref=e217]: 07:00
            - generic [ref=e219]: 08:00
            - generic [ref=e221]: 09:00
            - generic [ref=e223]: 10:00
            - generic [ref=e225]: 11:00
            - generic [ref=e227]: 12:00
            - generic [ref=e229]: 13:00
            - generic [ref=e231]: 14:00
            - generic [ref=e233]: 15:00
            - generic [ref=e235]: 16:00
            - generic [ref=e237]: 17:00
            - generic [ref=e239]: 18:00
            - generic [ref=e241]: 19:00
            - generic [ref=e243]: 20:00
            - generic [ref=e245]: 21:00
            - generic [ref=e247]: 22:00
            - generic [ref=e249]: 23:00
          - button "14:00 – 15:00 Химия Видовой У." [ref=e258] [cursor=pointer]:
            - generic [ref=e259]: 14:00 – 15:00
            - generic [ref=e260]: Химия
            - generic [ref=e261]: Видовой У.
  - alert [ref=e262]
```

# Test source

```ts
  188 |   });
  189 | });
  190 | 
  191 | // ═══════════════════════════════════════════════════════════════
  192 | // Journey 26: Кнопка «Новое занятие» из расписания
  193 | // ═══════════════════════════════════════════════════════════════
  194 | test.describe('Journey 26: Кнопка «Новое занятие» из расписания', () => {
  195 |   test.describe.configure({ mode: 'serial' });
  196 | 
  197 |   let email: string;
  198 |   let token: string;
  199 |   const password = 'Journey26Pass!';
  200 |   let page: Page;
  201 | 
  202 |   test.beforeAll(async ({ browser }) => {
  203 |     page = await browser.newPage();
  204 |     email = uniqueEmail();
  205 |     const auth = await registerViaAPI(page, { email, password, name: 'Новое Занятие Тест' });
  206 |     token = auth.accessToken;
  207 | 
  208 |     await createStudentAPI(page, token, {
  209 |       name: 'Расписанный Ученик',
  210 |       subject: 'Английский',
  211 |       rate: 2500,
  212 |     });
  213 |   });
  214 | 
  215 |   test.afterAll(async () => {
  216 |     await page.close();
  217 |   });
  218 | 
  219 |   test('26.1 Кнопка «Новое занятие» видна на странице', async () => {
  220 |     await loginAndGoto(page, '/schedule', email, password);
  221 |     await page.waitForTimeout(1_000);
  222 | 
  223 |     await expect(
  224 |       page.getByRole('button', { name: /Новое занятие/i }),
  225 |     ).toBeVisible({ timeout: 5_000 });
  226 |   });
  227 | 
  228 |   test('26.2 Клик → модалка создания урока', async () => {
  229 |     await page.getByRole('button', { name: /Новое занятие/i }).click();
  230 | 
  231 |     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
  232 |     await expect(page.getByRole('dialog')).toContainText(/Новое занятие/i);
  233 |   });
  234 | 
  235 |   test('26.3 Закрыть модалку → расписание на месте', async () => {
  236 |     await page.keyboard.press('Escape');
  237 |     await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3_000 });
  238 | 
  239 |     await expect(page.getByText('Пн').first()).toBeVisible();
  240 |   });
  241 | });
  242 | 
  243 | // ═══════════════════════════════════════════════════════════════
  244 | // Journey 27: Уроки отображаются во всех видах
  245 | // ═══════════════════════════════════════════════════════════════
  246 | test.describe('Journey 27: Уроки во всех видах расписания', () => {
  247 |   test.describe.configure({ mode: 'serial' });
  248 | 
  249 |   let email: string;
  250 |   let token: string;
  251 |   const password = 'Journey27Pass!';
  252 |   let page: Page;
  253 |   let studentId: string;
  254 | 
  255 |   test.beforeAll(async ({ browser }) => {
  256 |     page = await browser.newPage();
  257 |     email = uniqueEmail();
  258 |     const auth = await registerViaAPI(page, { email, password, name: 'Виды Тест' });
  259 |     token = auth.accessToken;
  260 | 
  261 |     const student = await createStudentAPI(page, token, {
  262 |       name: 'Видовой Ученик',
  263 |       subject: 'Химия',
  264 |       rate: 1800,
  265 |     });
  266 |     studentId = student.id;
  267 | 
  268 |     // Урок на завтра в 14:00 (по умолчанию из createLessonAPI)
  269 |     await createLessonAPI(page, token, studentId, {
  270 |       subject: 'Химия',
  271 |       rate: 1800,
  272 |     });
  273 |   });
  274 | 
  275 |   test.afterAll(async () => {
  276 |     await page.close();
  277 |   });
  278 | 
  279 |   test('27.1 Вид «Месяц» — урок виден как LessonDot', async () => {
  280 |     await loginAndGoto(page, '/schedule', email, password);
  281 |     await page.waitForTimeout(1_000);
  282 | 
  283 |     // Урок отображается с именем ученика и предметом
  284 |     await expect(page.locator('button').filter({ hasText: /Химия/ }).first()).toBeVisible({ timeout: 5_000 });
  285 |   });
  286 | 
  287 |   test('27.2 Вид «Неделя» — урок виден в сетке', async () => {
> 288 |     await page.getByRole('button', { name: 'Неделя' }).click();
      |                                                        ^ Error: locator.click: Target page, context or browser has been closed
  289 |     await page.waitForTimeout(500);
  290 | 
  291 |     await expect(page.locator('button').filter({ hasText: /Химия/ }).first()).toBeVisible({ timeout: 5_000 });
  292 |   });
  293 | 
  294 |   test('27.3 Вид «День» — урок виден в тайм-слоте', async () => {
  295 |     // Переключаемся на день
  296 |     await page.getByRole('button', { name: 'День' }).click();
  297 |     await page.waitForTimeout(500);
  298 | 
  299 |     // Переходим на завтра (урок на завтра)
  300 |     const nextBtn = page.locator('button.btn-stroke.btn-square').nth(1);
  301 |     await nextBtn.click();
  302 |     await page.waitForTimeout(500);
  303 | 
  304 |     // Урок с предметом «Химия» виден
  305 |     await expect(page.locator('button').filter({ hasText: /Химия/ }).first()).toBeVisible({ timeout: 5_000 });
  306 |   });
  307 | 
  308 |   test('27.4 Время урока отображается в Day view', async () => {
  309 |     // В Day view рядом с уроком показано время 14:00
  310 |     await expect(page.getByText('14:00').first()).toBeVisible();
  311 |   });
  312 | });
  313 | 
  314 | // ═══════════════════════════════════════════════════════════════
  315 | // Journey 28: LessonDetailModal из расписания + действия
  316 | // ═══════════════════════════════════════════════════════════════
  317 | test.describe('Journey 28: LessonDetailModal из расписания', () => {
  318 |   test.describe.configure({ mode: 'serial' });
  319 | 
  320 |   let email: string;
  321 |   let token: string;
  322 |   const password = 'Journey28Pass!';
  323 |   let page: Page;
  324 |   let studentId: string;
  325 | 
  326 |   test.beforeAll(async ({ browser }) => {
  327 |     page = await browser.newPage();
  328 |     email = uniqueEmail();
  329 |     const auth = await registerViaAPI(page, { email, password, name: 'Модалка Расписание' });
  330 |     token = auth.accessToken;
  331 | 
  332 |     const student = await createStudentAPI(page, token, {
  333 |       name: 'Модальный Ученик',
  334 |       subject: 'Физика',
  335 |       rate: 2200,
  336 |     });
  337 |     studentId = student.id;
  338 | 
  339 |     await createLessonAPI(page, token, studentId, {
  340 |       subject: 'Физика',
  341 |       rate: 2200,
  342 |     });
  343 |   });
  344 | 
  345 |   test.afterAll(async () => {
  346 |     await page.close();
  347 |   });
  348 | 
  349 |   test('28.1 Клик по уроку в Month → LessonDetailModal', async () => {
  350 |     await loginAndGoto(page, '/schedule', email, password);
  351 |     await page.waitForTimeout(1_000);
  352 | 
  353 |     // Кликаем по LessonDot с предметом «Физика»
  354 |     const lessonDot = page.locator('button').filter({ hasText: /Физика/ }).first();
  355 |     await lessonDot.click();
  356 | 
  357 |     const dialog = page.getByRole('dialog');
  358 |     await expect(dialog).toBeVisible({ timeout: 3_000 });
  359 |     await expect(dialog).toContainText('Физика');
  360 |     await expect(dialog).toContainText('Модальный Ученик');
  361 |   });
  362 | 
  363 |   test('28.2 Модалка содержит данные урока', async () => {
  364 |     const dialog = page.getByRole('dialog');
  365 | 
  366 |     // Статус
  367 |     await expect(dialog.getByText(/Запланировано/i)).toBeVisible();
  368 | 
  369 |     // Детали: дата, время, длительность, ставка
  370 |     await expect(dialog.getByText(/Дата/)).toBeVisible();
  371 |     await expect(dialog.getByText(/Время/)).toBeVisible();
  372 |     await expect(dialog.getByText(/60 мин/)).toBeVisible();
  373 |     await expect(dialog).toContainText(/2[\s,.]?200|2200/);
  374 |   });
  375 | 
  376 |   test('28.3 Кнопка «Проведено» → статус меняется', async () => {
  377 |     const dialog = page.getByRole('dialog');
  378 |     const completedBtn = dialog.getByRole('button', { name: /Проведено/i });
  379 |     await expect(completedBtn).toBeVisible();
  380 |     await completedBtn.click();
  381 | 
  382 |     // Модалка может обновиться или закрыться
  383 |     await expect(dialog).toBeHidden({ timeout: 5_000 });
  384 |   });
  385 | 
  386 |   test('28.4 После «Проведено» — урок обновился в расписании', async () => {
  387 |     // Перезагрузка для получения актуального статуса
  388 |     await page.reload();
```