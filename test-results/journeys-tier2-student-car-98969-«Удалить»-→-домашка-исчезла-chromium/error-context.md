# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-student-card.spec.ts >> Journey 19: Таб «Домашка» — CRUD >> 19.5 Dropdown → «Удалить» → домашка исчезла
- Location: e2e\journeys-tier2-student-card.spec.ts:267:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('td button.btn-square').first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - button "ТД Тест Домашка" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТД
          - generic [ref=e71]: Тест Домашка
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - button [ref=e83] [cursor=pointer]:
            - img [ref=e86]:
              - img [ref=e87]
          - generic [ref=e89]: Домашник Ученик
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
            - generic [ref=e115]: ДУ
            - generic [ref=e116]: Домашник Ученик
            - generic [ref=e117]: Английский
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
            - generic [ref=e166]: Домашние задания
            - button "Дать задание" [active] [ref=e167] [cursor=pointer]:
              - img [ref=e170]:
                - img [ref=e171]
              - generic [ref=e173]: Дать задание
          - table [ref=e175]:
            - rowgroup [ref=e176]:
              - row "Дата Задание Срок Файлы Статус" [ref=e177]:
                - columnheader "Дата" [ref=e178]
                - columnheader "Задание" [ref=e179]
                - columnheader "Срок" [ref=e180]
                - columnheader "Файлы" [ref=e181]
                - columnheader "Статус" [ref=e182]
                - columnheader [ref=e183]
            - rowgroup [ref=e184]:
              - row "11 апр. 2026 г. Решить задачи 1-10 из учебника 18.04.2026 —" [ref=e185] [cursor=pointer]:
                - cell "11 апр. 2026 г." [ref=e186]
                - cell "Решить задачи 1-10 из учебника" [ref=e187]
                - cell "18.04.2026" [ref=e188]
                - cell "—" [ref=e189]
                - cell [ref=e190]
                - cell [ref=e191]
  - alert [ref=e192]: /students/ea6e1a85-b885-43f5-918b-597d3843b9d1?tab=homework
```

# Test source

```ts
  170 | 
  171 |     await page.getByPlaceholder('Напишите заметку...').fill('Вторая заметка');
  172 |     await page.getByRole('button', { name: 'Сохранить' }).click();
  173 | 
  174 |     await expect(page.getByText('Вторая заметка')).toBeVisible({ timeout: 5_000 });
  175 |     // Обе заметки видны
  176 |     await expect(page.getByText('Первая тестовая заметка E2E')).toBeVisible();
  177 |   });
  178 | 
  179 |   test('18.5 Удалить первую заметку → осталась только вторая', async () => {
  180 |     // Находим контейнер .border-t содержащий текст первой заметки
  181 |     const noteText = page.getByText('Первая тестовая заметка E2E');
  182 |     const noteContainer = page.locator('.border-t').filter({ has: noteText }).first();
  183 |     await noteContainer.locator('button.group').click();
  184 |     await page.waitForTimeout(1_000);
  185 | 
  186 |     // Первая заметка удалена
  187 |     await expect(page.getByText('Первая тестовая заметка E2E')).toBeHidden({ timeout: 5_000 });
  188 |     // Вторая осталась
  189 |     await expect(page.getByText('Вторая заметка')).toBeVisible();
  190 |   });
  191 | });
  192 | 
  193 | // ═══════════════════════════════════════════════════════════════
  194 | // Journey 19: Таб «Домашка» — CRUD
  195 | // ═══════════════════════════════════════════════════════════════
  196 | test.describe('Journey 19: Таб «Домашка» — CRUD', () => {
  197 |   test.describe.configure({ mode: 'serial' });
  198 | 
  199 |   let email: string;
  200 |   let token: string;
  201 |   const password = 'Journey19Pass!';
  202 |   let page: Page;
  203 |   let studentId: string;
  204 | 
  205 |   test.beforeAll(async ({ browser }) => {
  206 |     page = await browser.newPage();
  207 |     email = uniqueEmail();
  208 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Домашка' });
  209 |     token = auth.accessToken;
  210 | 
  211 |     const student = await createStudentAPI(page, token, {
  212 |       name: 'Домашник Ученик',
  213 |       subject: 'Английский',
  214 |       rate: 2500,
  215 |     });
  216 |     studentId = student.id;
  217 |   });
  218 | 
  219 |   test.afterAll(async () => {
  220 |     await page.close();
  221 |   });
  222 | 
  223 |   test('19.1 Карточка → таб «Домашка» → пустое состояние', async () => {
  224 |     await loginAndGoto(page, `/students/${studentId}?tab=homework`, email, password);
  225 |     await page.waitForTimeout(1_000);
  226 | 
  227 |     await expect(page.getByText('Домашних заданий пока нет')).toBeVisible({ timeout: 5_000 });
  228 |   });
  229 | 
  230 |   test('19.2 «Дать задание» → модалка «Новое задание»', async () => {
  231 |     const addBtn = page.getByRole('button', { name: /Дать задание/i }).first();
  232 |     await addBtn.click();
  233 | 
  234 |     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
  235 |     await expect(page.getByRole('dialog')).toContainText(/Новое задание/i);
  236 |   });
  237 | 
  238 |   test('19.3 Заполнить задание → Сохранить → домашка в списке', async () => {
  239 |     const modal = page.getByRole('dialog');
  240 | 
  241 |     // Задание
  242 |     await modal.getByPlaceholder('Опишите задание...').fill('Решить задачи 1-10 из учебника');
  243 | 
  244 |     // Срок сдачи — через неделю
  245 |     const dueDate = new Date();
  246 |     dueDate.setDate(dueDate.getDate() + 7);
  247 |     const dueDateStr = dueDate.toISOString().slice(0, 10);
  248 |     await modal.locator('input[type="date"]').fill(dueDateStr);
  249 | 
  250 |     await modal.getByRole('button', { name: 'Дать задание' }).click();
  251 |     await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });
  252 | 
  253 |     // Домашка видна в списке
  254 |     await expect(page.getByText('Решить задачи 1-10 из учебника')).toBeVisible({ timeout: 5_000 });
  255 |   });
  256 | 
  257 |   test('19.4 Домашка видна в таблице со сроком', async () => {
  258 |     // В таблице видны: задание, срок, кнопка «...»
  259 |     await expect(page.getByText('Решить задачи 1-10 из учебника')).toBeVisible();
  260 |     // Срок сдачи отображается
  261 |     const dueDate = new Date();
  262 |     dueDate.setDate(dueDate.getDate() + 7);
  263 |     const formatted = dueDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  264 |     await expect(page.locator('table')).toContainText(formatted);
  265 |   });
  266 | 
  267 |   test('19.5 Dropdown → «Удалить» → домашка исчезла', async () => {
  268 |     // Открываем dropdown (DropdownMenu — кнопка с Icon "dots" внутри таблицы)
  269 |     const dotsBtn = page.locator('td button.btn-square').first();
> 270 |     await dotsBtn.click();
      |                   ^ Error: locator.click: Target page, context or browser has been closed
  271 |     await page.waitForTimeout(500);
  272 | 
  273 |     // Клик «Удалить» в кастомном dropdown
  274 |     await page.locator('button').filter({ hasText: 'Удалить' }).click();
  275 |     await page.waitForTimeout(1_000);
  276 | 
  277 |     // Домашка исчезла
  278 |     await expect(page.getByText('Решить задачи 1-10 из учебника')).toBeHidden({ timeout: 5_000 });
  279 |   });
  280 | });
  281 | 
  282 | // ═══════════════════════════════════════════════════════════════
  283 | // Journey 20: Таб «Оплаты» — запись из карточки
  284 | // ═══════════════════════════════════════════════════════════════
  285 | test.describe('Journey 20: Таб «Оплаты» — запись из карточки', () => {
  286 |   test.describe.configure({ mode: 'serial' });
  287 | 
  288 |   let email: string;
  289 |   let token: string;
  290 |   const password = 'Journey20Pass!';
  291 |   let page: Page;
  292 |   let studentId: string;
  293 | 
  294 |   test.beforeAll(async ({ browser }) => {
  295 |     page = await browser.newPage();
  296 |     email = uniqueEmail();
  297 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Оплата Карточка' });
  298 |     token = auth.accessToken;
  299 | 
  300 |     const student = await createStudentAPI(page, token, {
  301 |       name: 'Платящий Ученик',
  302 |       subject: 'Химия',
  303 |       rate: 3000,
  304 |     });
  305 |     studentId = student.id;
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
```