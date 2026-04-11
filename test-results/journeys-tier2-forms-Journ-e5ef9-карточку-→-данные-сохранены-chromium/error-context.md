# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-forms.spec.ts >> Journey 12: Создание ученика через UI-форму >> 12.5 Открываем карточку → данные сохранены
- Location: e2e\journeys-tier2-forms.spec.ts:126:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Тестовый Ученик Формы')
Expected: visible
Error: strict mode violation: getByText('Тестовый Ученик Формы') resolved to 2 elements:
    1) <span class="g-text g-text_variant_header-1">Тестовый Ученик Формы</span> aka locator('header').getByText('Тестовый Ученик Формы')
    2) <div class="g-text g-text_variant_subheader-2">Тестовый Ученик Формы</div> aka getByText('Тестовый Ученик Формы').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Тестовый Ученик Формы')

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
        - button "ТФ Тест Формы" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТФ
          - generic [ref=e71]: Тест Формы
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - button [ref=e83] [cursor=pointer]:
            - img [ref=e86]:
              - img [ref=e87]
          - generic [ref=e89]: Тестовый Ученик Формы
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
            - generic [ref=e115]: ТУ
            - generic [ref=e116]: Тестовый Ученик Формы
            - generic [ref=e117]: Физика · 10 класс кл.
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
          - generic [ref=e174]: Занятий пока нет
  - alert [ref=e175]: /students/94af1aec-beb7-407d-8589-aaefa6ac18ce
```

# Test source

```ts
  31  |   await page.waitForTimeout(300);
  32  |   await page.getByRole('option', { name: optionText }).click();
  33  | }
  34  | 
  35  | // Утилита: заполнить SearchableSelect (Combobox)
  36  | async function fillSearchableSelect(page: Page, label: string, query: string, optionText?: string) {
  37  |   const field = page.locator('div').filter({ hasText: new RegExp(`^${label}`) }).first();
  38  |   const input = field.locator('input[role="combobox"]').first();
  39  |   await input.click();
  40  |   await input.fill(query);
  41  |   await page.waitForTimeout(500);
  42  |   await page.getByRole('option', { name: optionText ?? query }).click();
  43  | }
  44  | 
  45  | // ═══════════════════════════════════════════════════════════════
  46  | // Journey 12: Создание ученика через полный UI-flow
  47  | // ═══════════════════════════════════════════════════════════════
  48  | test.describe('Journey 12: Создание ученика через UI-форму', () => {
  49  |   test.describe.configure({ mode: 'serial' });
  50  | 
  51  |   let email: string;
  52  |   let token: string;
  53  |   const password = 'Journey12Pass!';
  54  |   let page: Page;
  55  | 
  56  |   test.beforeAll(async ({ browser }) => {
  57  |     page = await browser.newPage();
  58  |     email = uniqueEmail();
  59  |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Формы' });
  60  |     token = auth.accessToken;
  61  |   });
  62  | 
  63  |   test.afterAll(async () => {
  64  |     await page.close();
  65  |   });
  66  | 
  67  |   test('12.1 Открываем /students → пустой список → клик «Новый ученик»', async () => {
  68  |     await loginAndGoto(page, '/students', email, password);
  69  |     await page.waitForTimeout(1_000);
  70  | 
  71  |     // Кнопка «Новый ученик»
  72  |     const btn = page.getByRole('button', { name: /Новый ученик/i }).first();
  73  |     await expect(btn).toBeVisible({ timeout: 5_000 });
  74  |     await btn.click();
  75  | 
  76  |     // Модалка открылась
  77  |     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
  78  |     await expect(page.getByRole('dialog')).toContainText(/Новый ученик/i);
  79  |   });
  80  | 
  81  |   test('12.2 Заполняем обязательные поля → ФИО + Предмет (Select) + Ставка', async () => {
  82  |     const modal = page.getByRole('dialog');
  83  | 
  84  |     // ФИО
  85  |     await modal.getByPlaceholder('Иванов Пётр Сергеевич').fill('Тестовый Ученик Формы');
  86  | 
  87  |     // Предмет — Headless UI Listbox (Select)
  88  |     // Ищем кнопку-триггер с плейсхолдером «Выберите предмет»
  89  |     const subjectTrigger = modal.locator('button').filter({ hasText: /Выберите предмет|Математика|Английский/ }).first();
  90  |     await subjectTrigger.click();
  91  |     await page.waitForTimeout(300);
  92  |     await page.getByRole('option', { name: 'Физика' }).click();
  93  | 
  94  |     // Ставка
  95  |     await modal.getByPlaceholder('2100').fill('2500');
  96  |   });
  97  | 
  98  |   test('12.3 Заполняем необязательные поля', async () => {
  99  |     const modal = page.getByRole('dialog');
  100 | 
  101 |     // Класс / возраст
  102 |     await modal.getByPlaceholder('11 или Взрослый').fill('10 класс');
  103 | 
  104 |     // Телефон ученика
  105 |     await modal.getByPlaceholder('+7 900 123-45-67').fill('+79001111111');
  106 | 
  107 |     // Заметки
  108 |     await modal.getByPlaceholder('Любые заметки…').fill('Тестовая заметка из E2E');
  109 |   });
  110 | 
  111 |   test('12.4 Сохранить → модалка закрылась → ученик в списке', async () => {
  112 |     const modal = page.getByRole('dialog');
  113 |     await modal.getByRole('button', { name: 'Сохранить' }).click();
  114 | 
  115 |     // Ждём закрытия модалки
  116 |     await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });
  117 | 
  118 |     // useApi не рефетчит автоматически — перезагружаем страницу
  119 |     await page.reload();
  120 |     await page.waitForTimeout(2_000);
  121 | 
  122 |     // Ученик появился в списке
  123 |     await expect(page.getByText('Тестовый Ученик Формы')).toBeVisible({ timeout: 8_000 });
  124 |   });
  125 | 
  126 |   test('12.5 Открываем карточку → данные сохранены', async () => {
  127 |     await page.getByText('Тестовый Ученик Формы').first().click();
  128 |     await page.waitForURL(/\/students\/.+/, { timeout: 5_000 });
  129 | 
  130 |     // Имя
> 131 |     await expect(page.getByText('Тестовый Ученик Формы')).toBeVisible();
      |                                                           ^ Error: expect(locator).toBeVisible() failed
  132 |     // Предмет
  133 |     await expect(page.locator('body')).toContainText(/Физика/);
  134 |     // Ставка
  135 |     await expect(page.locator('body')).toContainText(/2[\s,.]?500|2500/);
  136 |   });
  137 | });
  138 | 
  139 | // ═══════════════════════════════════════════════════════════════
  140 | // Journey 13: Создание урока через полный UI-flow
  141 | // ═══════════════════════════════════════════════════════════════
  142 | test.describe('Journey 13: Создание урока через UI-форму', () => {
  143 |   test.describe.configure({ mode: 'serial' });
  144 | 
  145 |   let email: string;
  146 |   let token: string;
  147 |   const password = 'Journey13Pass!';
  148 |   let page: Page;
  149 |   let studentName: string;
  150 |   let studentId: string;
  151 | 
  152 |   test.beforeAll(async ({ browser }) => {
  153 |     page = await browser.newPage();
  154 |     email = uniqueEmail();
  155 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Урок UI' });
  156 |     token = auth.accessToken;
  157 |     studentName = 'Алиса Урокова';
  158 | 
  159 |     const student = await createStudentAPI(page, token, {
  160 |       name: studentName,
  161 |       subject: 'Математика',
  162 |       rate: 3000,
  163 |     });
  164 |     studentId = student.id;
  165 |   });
  166 | 
  167 |   test.afterAll(async () => {
  168 |     await page.close();
  169 |   });
  170 | 
  171 |   test('13.1 Расписание → ?create=1 → модалка «Новое занятие»', async () => {
  172 |     await loginAndGoto(page, '/schedule?create=1', email, password);
  173 | 
  174 |     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  175 |     await expect(page.getByRole('dialog')).toContainText(/Новое занятие/i);
  176 |   });
  177 | 
  178 |   test('13.2 Выбор ученика (Select) → автозаполнение предмета и ставки', async () => {
  179 |     const modal = page.getByRole('dialog');
  180 | 
  181 |     // Ученик — Headless UI Listbox
  182 |     const studentTrigger = modal.locator('button').filter({ hasText: /Выберите ученика/ }).first();
  183 |     await studentTrigger.click();
  184 |     await page.waitForTimeout(300);
  185 |     await page.getByRole('option', { name: studentName }).click();
  186 |     await page.waitForTimeout(500);
  187 | 
  188 |     // Предмет должен автозаполниться значением «Математика»
  189 |     const subjectTrigger = modal
  190 |       .locator('button')
  191 |       .filter({ hasText: /Выберите предмет|Математика|Английский|Физика|Русский язык|Химия|Другой/ })
  192 |       .first();
  193 |     const subjectText = ((await subjectTrigger.textContent()) || '').trim();
  194 | 
  195 |     // Если автозаполнение не сработало — выбираем вручную
  196 |     if (!/Математика/i.test(subjectText)) {
  197 |       await subjectTrigger.click();
  198 |       await page.waitForTimeout(300);
  199 |       await page.getByRole('option', { name: 'Математика' }).click();
  200 |     }
  201 | 
  202 |     // Ставка должна автозаполниться (3000)
  203 |     const rateInput = modal.getByPlaceholder('2100');
  204 |     const rateValue = await rateInput.inputValue();
  205 |     expect(rateValue === '3000' || rateValue === '').toBeTruthy();
  206 |   });
  207 | 
  208 |   test('13.3 Заполняем дату и время', async () => {
  209 |     const modal = page.getByRole('dialog');
  210 | 
  211 |     // Дата выбирается через popover-календарь
  212 |     const dateTrigger = modal.locator('button.repeto-native-input').first();
  213 |     await dateTrigger.click();
  214 |     await page.locator('button').filter({ hasText: /^(?:[1-9]|[12][0-9]|3[01])$/ }).first().click();
  215 | 
  216 |     // Время
  217 |     await modal.locator('input[type="time"]').fill('15:00');
  218 |   });
  219 | 
  220 |   test('13.4 Длительность, Формат уже имеют дефолты (60 мин, Онлайн)', async () => {
  221 |     const modal = page.getByRole('dialog');
  222 | 
  223 |     // Длительность — дефолт «60 минут»
  224 |     await expect(modal.locator('body, div').filter({ hasText: '60 минут' }).first()).toBeTruthy();
  225 | 
  226 |     // Формат — дефолт «Онлайн»
  227 |     await expect(modal.locator('body, div').filter({ hasText: 'Онлайн' }).first()).toBeTruthy();
  228 |   });
  229 | 
  230 |   test('13.5 Сохранить → модалка закрылась → урок виден в расписании', async () => {
  231 |     const lessonDialog = page
```