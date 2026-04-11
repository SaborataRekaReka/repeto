# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-student-card.spec.ts >> Journey 17: Редактирование ученика через UI >> 17.1 Карточка ученика → кнопка редактирования → модалка
- Location: e2e\journeys-tier2-student-card.spec.ts:53:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Редактируемый Ученик')
Expected: visible
Error: strict mode violation: getByText('Редактируемый Ученик') resolved to 2 elements:
    1) <span class="g-text g-text_variant_header-1">Редактируемый Ученик</span> aka locator('header').getByText('Редактируемый Ученик')
    2) <div class="g-text g-text_variant_subheader-2">Редактируемый Ученик</div> aka getByText('Редактируемый Ученик').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Редактируемый Ученик')

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
        - button "ТР Тест Редакт" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТР
          - generic [ref=e71]: Тест Редакт
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - button [ref=e83] [cursor=pointer]:
            - img [ref=e86]:
              - img [ref=e87]
          - generic [ref=e89]: Редактируемый Ученик
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
            - generic [ref=e115]: РУ
            - generic [ref=e116]: Редактируемый Ученик
            - generic [ref=e117]: Математика
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
  - alert [ref=e175]: /students/274f1cfe-7f91-4e3e-9da2-418205dc1151
```

# Test source

```ts
  1   | /**
  2   |  * Этап 2 · Карточка ученика — все табы
  3   |  *
  4   |  * Journey 17: Редактирование ученика через UI
  5   |  * Journey 18: Таб «Заметки» — CRUD
  6   |  * Journey 19: Таб «Домашка» — CRUD
  7   |  * Journey 20: Таб «Оплаты» — запись из карточки
  8   |  * Journey 21: Таб «Занятия» — LessonDetailModal + статусы
  9   |  * Journey 22: Генерация портал-ссылки (UI)
  10  |  * Journey 23: URL-синхронизация табов
  11  |  */
  12  | import { test, expect, type Page } from '@playwright/test';
  13  | import {
  14  |   uniqueEmail,
  15  |   registerViaAPI,
  16  |   loginAndGoto,
  17  |   createStudentAPI,
  18  |   createLessonAPI,
  19  | } from './helpers';
  20  | 
  21  | const API = 'http://127.0.0.1:3200/api';
  22  | 
  23  | // ═══════════════════════════════════════════════════════════════
  24  | // Journey 17: Редактирование ученика через UI-модалку
  25  | // ═══════════════════════════════════════════════════════════════
  26  | test.describe('Journey 17: Редактирование ученика через UI', () => {
  27  |   test.describe.configure({ mode: 'serial' });
  28  | 
  29  |   let email: string;
  30  |   let token: string;
  31  |   const password = 'Journey17Pass!';
  32  |   let page: Page;
  33  |   let studentId: string;
  34  | 
  35  |   test.beforeAll(async ({ browser }) => {
  36  |     page = await browser.newPage();
  37  |     email = uniqueEmail();
  38  |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Редакт' });
  39  |     token = auth.accessToken;
  40  | 
  41  |     const student = await createStudentAPI(page, token, {
  42  |       name: 'Редактируемый Ученик',
  43  |       subject: 'Математика',
  44  |       rate: 2000,
  45  |     });
  46  |     studentId = student.id;
  47  |   });
  48  | 
  49  |   test.afterAll(async () => {
  50  |     await page.close();
  51  |   });
  52  | 
  53  |   test('17.1 Карточка ученика → кнопка редактирования → модалка', async () => {
  54  |     await loginAndGoto(page, `/students/${studentId}`, email, password);
  55  |     await page.waitForTimeout(1_000);
  56  | 
  57  |     // Имя ученика видно
> 58  |     await expect(page.getByText('Редактируемый Ученик')).toBeVisible({ timeout: 5_000 });
      |                                                          ^ Error: expect(locator).toBeVisible() failed
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
  151 |     await expect(page.getByPlaceholder('Напишите заметку...')).toBeVisible({ timeout: 3_000 });
  152 |     await expect(page.getByRole('button', { name: 'Сохранить' })).toBeVisible();
  153 |     await expect(page.getByRole('button', { name: 'Отмена' })).toBeVisible();
  154 |   });
  155 | 
  156 |   test('18.3 Написать заметку → Сохранить → заметка в списке', async () => {
  157 |     await page.getByPlaceholder('Напишите заметку...').fill('Первая тестовая заметка E2E');
  158 |     await page.getByRole('button', { name: 'Сохранить' }).click();
```