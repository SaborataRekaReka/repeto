# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-dashboard.spec.ts >> Journey 30: TodaySchedule — виджет и LessonDetailModal >> 30.2 Урок отображается в виджете
- Location: e2e\journeys-tier2-dashboard.spec.ts:140:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.card').filter({ hasText: 'Сегодня,' }).locator('button').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.card').filter({ hasText: 'Сегодня,' }).locator('button').first()

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
            - button "Сегодня У. 15:00 – 16:00 Математика Запланировано" [ref=e221] [cursor=pointer]:
              - generic [ref=e223]:
                - generic [ref=e224]:
                  - generic [ref=e225]: Сегодня У.
                  - generic [ref=e226]: 15:00 – 16:00
                - generic [ref=e227]:
                  - generic [ref=e228]: Математика
                  - generic [ref=e231]: Запланировано
          - generic [ref=e232]:
            - generic [ref=e233]:
              - generic [ref=e234]: Занятия на неделю
              - link "Расписание →" [ref=e235] [cursor=pointer]:
                - /url: /schedule
            - generic [ref=e237]:
              - generic [ref=e239]: Сегодня
              - button "Сегодня У. 15:00 – 16:00 Математика" [ref=e241] [cursor=pointer]:
                - generic [ref=e243]:
                  - generic [ref=e244]:
                    - generic [ref=e245]: Сегодня У.
                    - generic [ref=e246]: 15:00 – 16:00
                  - generic [ref=e249]: Математика
          - generic [ref=e250]:
            - generic [ref=e251]:
              - generic [ref=e252]: Задолженности
              - link "Все →" [ref=e253] [cursor=pointer]:
                - /url: /payments
            - generic [ref=e254]: Задолженностей нет
  - alert [ref=e255]: Дашборд — Repeto
```

# Test source

```ts
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
  90  |     await expect(value).toBeVisible();
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
> 143 |     await expect(lessonBtn).toBeVisible();
      |                             ^ Error: expect(locator).toBeVisible() failed
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
  191 |     page = await browser.newPage();
  192 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  193 |     token = reg.accessToken;
  194 |     email = reg.email;
  195 | 
  196 |     const student = await createStudentAPI(page, token, { name: 'Должник Тест' });
  197 |     studentId = student.id;
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
```