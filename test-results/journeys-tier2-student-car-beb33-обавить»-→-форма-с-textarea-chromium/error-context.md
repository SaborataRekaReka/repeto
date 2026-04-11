# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-student-card.spec.ts >> Journey 18: Таб «Заметки» — CRUD >> 18.2 Кнопка «Добавить» → форма с textarea
- Location: e2e\journeys-tier2-student-card.spec.ts:147:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByPlaceholder('Напишите заметку...')
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for getByPlaceholder('Напишите заметку...')

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
        - button "ТЗ Тест Заметки" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТЗ
          - generic [ref=e71]: Тест Заметки
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - button [ref=e83] [cursor=pointer]:
            - img [ref=e86]:
              - img [ref=e87]
          - generic [ref=e89]: Заметочный Ученик
        - generic [ref=e90]:
          - button [ref=e92] [cursor=pointer]:
            - img [ref=e95]:
              - img [ref=e96]
          - button [ref=e98] [cursor=pointer]:
            - img [ref=e101]:
              - img [ref=e102]
          - button "Добавить" [active] [ref=e105] [cursor=pointer]:
            - img [ref=e108]:
              - img [ref=e109]
            - generic [ref=e111]: Добавить
          - menu [ref=e118]:
            - menuitem "Новый ученик" [ref=e119] [cursor=pointer]:
              - generic [ref=e120]: Новый ученик
            - menuitem "Новое занятие" [ref=e121] [cursor=pointer]:
              - generic [ref=e122]: Новое занятие
            - menuitem "Записать оплату" [ref=e123] [cursor=pointer]:
              - generic [ref=e124]: Записать оплату
      - generic [ref=e127]:
        - complementary [ref=e128]:
          - generic [ref=e129]:
            - generic [ref=e130]: ЗУ
            - generic [ref=e131]: Заметочный Ученик
            - generic [ref=e132]: Физика
            - generic [ref=e133]:
              - generic [ref=e136]: Активен
              - generic [ref=e137]: 0 ₽
            - generic [ref=e138]:
              - button "Написать" [ref=e139] [cursor=pointer]:
                - img [ref=e142]:
                  - img [ref=e143]
                - generic [ref=e145]: Написать
              - button "Портал" [ref=e146] [cursor=pointer]:
                - img [ref=e149]:
                  - img [ref=e150]
                - generic [ref=e152]: Портал
          - navigation [ref=e153]:
            - button "Занятия" [ref=e154] [cursor=pointer]:
              - img [ref=e155]:
                - img [ref=e156]
              - text: Занятия
            - button "Профиль" [ref=e158] [cursor=pointer]:
              - img [ref=e159]:
                - img [ref=e160]
              - text: Профиль
            - button "Контакты" [ref=e162] [cursor=pointer]:
              - img [ref=e163]:
                - img [ref=e164]
              - text: Контакты
            - button "Оплаты" [ref=e166] [cursor=pointer]:
              - img [ref=e167]:
                - img [ref=e168]
              - text: Оплаты
            - button "Заметки" [ref=e170] [cursor=pointer]:
              - img [ref=e171]:
                - img [ref=e172]
              - text: Заметки
            - button "Домашка" [ref=e174] [cursor=pointer]:
              - img [ref=e175]:
                - img [ref=e176]
              - text: Домашка
        - generic [ref=e179]:
          - generic [ref=e180]:
            - generic [ref=e181]: Заметки
            - button "Добавить" [ref=e182] [cursor=pointer]:
              - img [ref=e185]:
                - img [ref=e186]
              - generic [ref=e188]: Добавить
          - generic [ref=e189]: Заметок пока нет
  - alert [ref=e190]: /students/7f412b76-e4a4-4de1-a2f4-ab497ed4ada3?tab=notes
```

# Test source

```ts
  51  |   });
  52  | 
  53  |   test('17.1 Карточка ученика → кнопка редактирования → модалка', async () => {
  54  |     await loginAndGoto(page, `/students/${studentId}`, email, password);
  55  |     await page.waitForTimeout(1_000);
  56  | 
  57  |     // Имя ученика видно
  58  |     await expect(page.getByText('Редактируемый Ученик')).toBeVisible({ timeout: 5_000 });
  59  | 
  60  |     // Кнопка edit с title="Редактировать"
  61  |     const profileEditBtn = page.locator('button[title="Редактировать"]').first();
  62  |     await profileEditBtn.click();
  63  | 
  64  |     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
  65  |     await expect(page.getByRole('dialog')).toContainText(/Редактировать ученика/i);
  66  |   });
  67  | 
  68  |   test('17.2 Модалка предзаполнена текущими данными', async () => {
  69  |     const modal = page.getByRole('dialog');
  70  | 
  71  |     const nameInput = modal.getByPlaceholder('Иванов Пётр Сергеевич');
  72  |     const nameValue = await nameInput.inputValue();
  73  |     expect(nameValue).toBe('Редактируемый Ученик');
  74  | 
  75  |     const rateInput = modal.getByPlaceholder('2100');
  76  |     const rateValue = await rateInput.inputValue();
  77  |     expect(rateValue).toBe('2000');
  78  |   });
  79  | 
  80  |   test('17.3 Изменить имя и ставку → Сохранить', async () => {
  81  |     const modal = page.getByRole('dialog');
  82  | 
  83  |     // Меняем имя
  84  |     const nameInput = modal.getByPlaceholder('Иванов Пётр Сергеевич');
  85  |     await nameInput.clear();
  86  |     await nameInput.fill('Обновлённый Ученик');
  87  | 
  88  |     // Меняем ставку
  89  |     const rateInput = modal.getByPlaceholder('2100');
  90  |     await rateInput.clear();
  91  |     await rateInput.fill('3500');
  92  | 
  93  |     await modal.getByRole('button', { name: 'Сохранить' }).click();
  94  |     await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });
  95  |   });
  96  | 
  97  |   test('17.4 Данные обновились на странице', async () => {
  98  |     await page.reload();
  99  |     await page.waitForTimeout(2_000);
  100 | 
  101 |     await expect(page.getByText('Обновлённый Ученик')).toBeVisible({ timeout: 5_000 });
  102 |     await expect(page.locator('body')).toContainText(/3[\s,.]?500|3500/);
  103 |   });
  104 | });
  105 | 
  106 | // ═══════════════════════════════════════════════════════════════
  107 | // Journey 18: Таб «Заметки» — CRUD
  108 | // ═══════════════════════════════════════════════════════════════
  109 | test.describe('Journey 18: Таб «Заметки» — CRUD', () => {
  110 |   test.describe.configure({ mode: 'serial' });
  111 | 
  112 |   let email: string;
  113 |   let token: string;
  114 |   const password = 'Journey18Pass!';
  115 |   let page: Page;
  116 |   let studentId: string;
  117 | 
  118 |   test.beforeAll(async ({ browser }) => {
  119 |     page = await browser.newPage();
  120 |     email = uniqueEmail();
  121 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Заметки' });
  122 |     token = auth.accessToken;
  123 | 
  124 |     const student = await createStudentAPI(page, token, {
  125 |       name: 'Заметочный Ученик',
  126 |       subject: 'Физика',
  127 |       rate: 1500,
  128 |     });
  129 |     studentId = student.id;
  130 |   });
  131 | 
  132 |   test.afterAll(async () => {
  133 |     await page.close();
  134 |   });
  135 | 
  136 |   test('18.1 Карточка → таб «Заметки» → пустое состояние', async () => {
  137 |     await loginAndGoto(page, `/students/${studentId}?tab=notes`, email, password);
  138 |     await page.waitForTimeout(1_000);
  139 | 
  140 |     // Таб «Заметки» активен
  141 |     await expect(page.getByText('Заметки').first()).toBeVisible({ timeout: 5_000 });
  142 | 
  143 |     // Пустое состояние
  144 |     await expect(page.getByText('Заметок пока нет')).toBeVisible({ timeout: 5_000 });
  145 |   });
  146 | 
  147 |   test('18.2 Кнопка «Добавить» → форма с textarea', async () => {
  148 |     const addBtn = page.getByRole('button', { name: /Добавить/i }).first();
  149 |     await addBtn.click();
  150 | 
> 151 |     await expect(page.getByPlaceholder('Напишите заметку...')).toBeVisible({ timeout: 3_000 });
      |                                                                ^ Error: expect(locator).toBeVisible() failed
  152 |     await expect(page.getByRole('button', { name: 'Сохранить' })).toBeVisible();
  153 |     await expect(page.getByRole('button', { name: 'Отмена' })).toBeVisible();
  154 |   });
  155 | 
  156 |   test('18.3 Написать заметку → Сохранить → заметка в списке', async () => {
  157 |     await page.getByPlaceholder('Напишите заметку...').fill('Первая тестовая заметка E2E');
  158 |     await page.getByRole('button', { name: 'Сохранить' }).click();
  159 | 
  160 |     // Форма скрылась
  161 |     await expect(page.getByPlaceholder('Напишите заметку...')).toBeHidden({ timeout: 3_000 });
  162 | 
  163 |     // Заметка видна
  164 |     await expect(page.getByText('Первая тестовая заметка E2E')).toBeVisible({ timeout: 5_000 });
  165 |   });
  166 | 
  167 |   test('18.4 Добавить вторую заметку', async () => {
  168 |     const addBtn = page.getByRole('button', { name: /Добавить/i }).first();
  169 |     await addBtn.click();
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
```