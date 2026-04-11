# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-dashboard.spec.ts >> Journey 29: StatCards — числа и навигация >> 29.4 К оплате учениками — карточка видна
- Location: e2e\journeys-tier2-dashboard.spec.ts:87:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a.card[href="/finance/payments"]').locator('.text-h4')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('a.card[href="/finance/payments"]').locator('.text-h4')

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
        - link "Доход за месяц 2 000 ₽" [ref=e129] [cursor=pointer]:
          - /url: /finance
          - generic [ref=e130]:
            - generic [ref=e131]:
              - generic [ref=e132]: Доход за месяц
              - img [ref=e134]:
                - img [ref=e135]
            - generic [ref=e138]: 2 000 ₽
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
                - generic [ref=e171]: 2 000 ₽
              - generic [ref=e172]:
                - generic [ref=e173]: Итого за период
                - generic [ref=e174]: 2 000 ₽
          - generic [ref=e175]:
            - generic [ref=e176]:
              - generic [ref=e177]:
                - generic [ref=e178]: Конверсия в оплату
                - button "Месяц" [ref=e180] [cursor=pointer]:
                  - img [ref=e183]:
                    - img [ref=e184]
                  - generic [ref=e186]: Месяц
              - generic [ref=e188]:
                - generic [ref=e190]: 100%
                - generic [ref=e194]:
                  - generic [ref=e195]: 0%
                  - generic [ref=e196]: 100%
                - generic [ref=e197]:
                  - generic [ref=e198]:
                    - generic [ref=e201]: Проведено
                    - generic [ref=e202]: 1 зан. · 2 000 ₽
                  - generic [ref=e203]:
                    - generic [ref=e206]: Оплачено
                    - generic [ref=e207]: 1 плат. · 2 000 ₽
            - generic [ref=e208]:
              - generic [ref=e209]:
                - generic [ref=e210]: Истекающие пакеты
                - link "Все →" [ref=e211] [cursor=pointer]:
                  - /url: /packages
              - generic [ref=e212]: Нет пакетов с истекающим сроком
          - generic [ref=e213]:
            - generic [ref=e214]:
              - generic [ref=e215]: Последние оплаты
              - link "Все →" [ref=e216] [cursor=pointer]:
                - /url: /payments
            - table [ref=e218]:
              - rowgroup [ref=e219]:
                - row "Дата Ученик Сумма Способ Статус" [ref=e220]:
                  - columnheader "Дата" [ref=e221]
                  - columnheader "Ученик" [ref=e222]
                  - columnheader "Сумма" [ref=e223]
                  - columnheader "Способ" [ref=e224]
                  - columnheader "Статус" [ref=e225]
              - rowgroup [ref=e226]:
                - row "11.04.2026 Стат Ученик +2 000 ₽ Наличные Получен" [ref=e227]:
                  - cell "11.04.2026" [ref=e228]
                  - cell "Стат Ученик" [ref=e229]
                  - cell "+2 000 ₽" [ref=e230]:
                    - generic [ref=e231]: +2 000 ₽
                  - cell "Наличные" [ref=e232]
                  - cell "Получен" [ref=e233]:
                    - generic [ref=e236]: Получен
        - generic [ref=e237]:
          - generic [ref=e238]:
            - generic [ref=e239]:
              - generic [ref=e240]: Сегодня, 11 апреля
              - link "Всё расписание →" [ref=e241] [cursor=pointer]:
                - /url: /schedule
            - generic [ref=e242]: Занятий на сегодня нет
          - generic [ref=e243]:
            - generic [ref=e244]:
              - generic [ref=e245]: Занятия на неделю
              - link "Расписание →" [ref=e246] [cursor=pointer]:
                - /url: /schedule
            - generic [ref=e247]: На ближайшую неделю занятий нет
          - generic [ref=e248]:
            - generic [ref=e249]:
              - generic [ref=e250]: Задолженности
              - link "Все →" [ref=e251] [cursor=pointer]:
                - /url: /payments
            - generic [ref=e252]: Задолженностей нет
  - alert [ref=e253]: Дашборд — Repeto
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import {
  3   |   uniqueEmail,
  4   |   registerViaAPI,
  5   |   loginAndGoto,
  6   |   createStudentAPI,
  7   |   createLessonAPI,
  8   |   deleteAccount,
  9   | } from './helpers';
  10  | 
  11  | const API = 'http://127.0.0.1:3200/api';
  12  | 
  13  | /* ═══════════════════════════════════════════════════════════════
  14  |    Journey 29 · StatCards — числа и навигация
  15  |    ═══════════════════════════════════════════════════════════════ */
  16  | test.describe('Journey 29: StatCards — числа и навигация', () => {
  17  |   let page: Page;
  18  |   let token: string;
  19  |   let email: string;
  20  |   const password = 'TestPass123!';
  21  | 
  22  |   test.beforeAll(async ({ browser }) => {
  23  |     page = await browser.newPage();
  24  |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  25  |     token = reg.accessToken;
  26  |     email = reg.email;
  27  | 
  28  |     const student = await createStudentAPI(page, token, { name: 'Стат Ученик' });
  29  | 
  30  |     // Completed lesson (for lessonsThisMonth > 0)
  31  |     const yesterday = new Date();
  32  |     yesterday.setDate(yesterday.getDate() - 1);
  33  |     yesterday.setHours(14, 0, 0, 0);
  34  |     const lesson = await createLessonAPI(page, token, student.id, {
  35  |       scheduledAt: yesterday.toISOString(),
  36  |     });
  37  |     await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
  38  |       headers: { Authorization: `Bearer ${token}` },
  39  |       data: { status: 'COMPLETED' },
  40  |     });
  41  | 
  42  |     // Payment (for incomeThisMonth > 0)
  43  |     await page.request.post(`${API}/payments`, {
  44  |       headers: { Authorization: `Bearer ${token}` },
  45  |       data: {
  46  |         studentId: student.id,
  47  |         amount: 2000,
  48  |         method: 'CASH',
  49  |         date: new Date().toISOString(),
  50  |       },
  51  |     });
  52  | 
  53  |     await loginAndGoto(page, '/dashboard', email, password);
  54  |     await page.waitForTimeout(2_000);
  55  |   });
  56  | 
  57  |   test.afterAll(async () => {
  58  |     await deleteAccount(page, token, password);
  59  |     await page.close();
  60  |   });
  61  | 
  62  |   test('29.1 Активных учеников > 0', async () => {
  63  |     const card = page.locator('a.card[href="/students"]');
  64  |     const value = card.locator('.text-h4');
  65  |     await expect(value).toBeVisible();
  66  |     const text = await value.textContent();
  67  |     expect(text).not.toBe('0');
  68  |     expect(text).not.toBe('—');
  69  |   });
  70  | 
  71  |   test('29.2 Занятий в этом месяце — значение отображается', async () => {
  72  |     const card = page.locator('a.card[href="/schedule"]');
  73  |     const value = card.locator('.text-h4');
  74  |     await expect(value).toBeVisible();
  75  |     const text = await value.textContent();
  76  |     expect(text).not.toBe('—');
  77  |   });
  78  | 
  79  |   test('29.3 Доход за месяц содержит ₽', async () => {
  80  |     const card = page.locator('a.card[href="/finance"]');
  81  |     const value = card.locator('.text-h4');
  82  |     await expect(value).toBeVisible();
  83  |     const text = await value.textContent();
  84  |     expect(text).toMatch(/₽/);
  85  |   });
  86  | 
  87  |   test('29.4 К оплате учениками — карточка видна', async () => {
  88  |     const card = page.locator('a.card[href="/finance/payments"]');
  89  |     const value = card.locator('.text-h4');
> 90  |     await expect(value).toBeVisible();
      |                         ^ Error: expect(locator).toBeVisible() failed
  91  |   });
  92  | 
  93  |   test('29.5 Клик по карточке «Ученики» → /students', async () => {
  94  |     await page.locator('a.card[href="/students"]').click();
  95  |     await page.waitForURL('**/students');
  96  |     await page.goto('/dashboard');
  97  |     await page.waitForTimeout(1_000);
  98  |   });
  99  | });
  100 | 
  101 | /* ═══════════════════════════════════════════════════════════════
  102 |    Journey 30 · TodaySchedule — виджет и LessonDetailModal
  103 |    ═══════════════════════════════════════════════════════════════ */
  104 | test.describe('Journey 30: TodaySchedule — виджет и LessonDetailModal', () => {
  105 |   let page: Page;
  106 |   let token: string;
  107 |   let email: string;
  108 |   const password = 'TestPass123!';
  109 | 
  110 |   test.beforeAll(async ({ browser }) => {
  111 |     page = await browser.newPage();
  112 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  113 |     token = reg.accessToken;
  114 |     email = reg.email;
  115 | 
  116 |     const student = await createStudentAPI(page, token, { name: 'Сегодня Ученик' });
  117 | 
  118 |     // Lesson today at 15:00
  119 |     const today = new Date();
  120 |     today.setHours(15, 0, 0, 0);
  121 |     await createLessonAPI(page, token, student.id, {
  122 |       scheduledAt: today.toISOString(),
  123 |       subject: 'Физика',
  124 |     });
  125 | 
  126 |     await loginAndGoto(page, '/dashboard', email, password);
  127 |     await page.waitForTimeout(2_000);
  128 |   });
  129 | 
  130 |   test.afterAll(async () => {
  131 |     await deleteAccount(page, token, password);
  132 |     await page.close();
  133 |   });
  134 | 
  135 |   test('30.1 Виджет «Сегодня» — заголовок с датой', async () => {
  136 |     const todayCard = page.locator('.card').filter({ hasText: 'Сегодня,' });
  137 |     await expect(todayCard).toBeVisible();
  138 |   });
  139 | 
  140 |   test('30.2 Урок отображается в виджете', async () => {
  141 |     const todayCard = page.locator('.card').filter({ hasText: 'Сегодня,' });
  142 |     const lessonBtn = todayCard.locator('button').first();
  143 |     await expect(lessonBtn).toBeVisible();
  144 |   });
  145 | 
  146 |   test('30.3 Клик по уроку → LessonDetailModal', async () => {
  147 |     const todayCard = page.locator('.card').filter({ hasText: 'Сегодня,' });
  148 |     await todayCard.locator('button').first().click();
  149 |     await page.waitForTimeout(500);
  150 | 
  151 |     const modal = page.locator('[role="dialog"]');
  152 |     await expect(modal.first()).toBeVisible({ timeout: 3_000 });
  153 |   });
  154 | 
  155 |   test('30.4 Модалка содержит предмет урока', async () => {
  156 |     await expect(page.getByText(/Математика/i).first()).toBeVisible();
  157 |   });
  158 | 
  159 |   test('30.5 Кнопка «Проведено» → статус меняется', async () => {
  160 |     // Modal should still be open from 30.3
  161 |     const completedBtn = page.getByRole('button', { name: /Проведено/i });
  162 |     await expect(completedBtn).toBeVisible({ timeout: 3_000 });
  163 |     await completedBtn.click();
  164 |     await page.waitForTimeout(1_000);
  165 | 
  166 |     // Close modal
  167 |     await page.keyboard.press('Escape');
  168 |     await page.waitForTimeout(300);
  169 | 
  170 |     // Reload to confirm status change
  171 |     await page.reload();
  172 |     await page.waitForTimeout(2_000);
  173 | 
  174 |     const todayCard = page.locator('.card').filter({ hasText: 'Сегодня,' });
  175 |     // Green badge = completed status
  176 |     await expect(todayCard.getByText(/Проведено/i)).toBeVisible({ timeout: 5_000 });
  177 |   });
  178 | });
  179 | 
  180 | /* ═══════════════════════════════════════════════════════════════
  181 |    Journey 31 · DebtList — задолженности и навигация
  182 |    ═══════════════════════════════════════════════════════════════ */
  183 | test.describe('Journey 31: DebtList — задолженности и навигация', () => {
  184 |   let page: Page;
  185 |   let token: string;
  186 |   let email: string;
  187 |   let studentId: string;
  188 |   const password = 'TestPass123!';
  189 | 
  190 |   test.beforeAll(async ({ browser }) => {
```