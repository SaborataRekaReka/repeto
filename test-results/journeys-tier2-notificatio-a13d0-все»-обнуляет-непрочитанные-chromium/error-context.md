# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-notifications.spec.ts >> Journey 34: Уведомления — табы, mark read, badge >> 34.9 Кнопка «Прочитать все» обнуляет непрочитанные
- Location: e2e\journeys-tier2-notifications.spec.ts:114:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByRole('button', { name: 'Непрочитанные' })

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
        - generic [ref=e83]: Уведомления
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
      - radiogroup [ref=e107]:
        - generic [ref=e108]:
          - radio "Все" [checked] [ref=e109]
          - generic [ref=e110]: Все
        - generic [ref=e111] [cursor=pointer]:
          - radio "Непрочитанные" [ref=e112]
          - generic [ref=e113]: Непрочитанные
        - generic [ref=e114] [cursor=pointer]:
          - radio "Оплаты" [ref=e115]
          - generic [ref=e116]: Оплаты
        - generic [ref=e117] [cursor=pointer]:
          - radio "Расписание" [ref=e118]
          - generic [ref=e119]: Расписание
      - generic [ref=e120]:
        - generic [ref=e121]:
          - img [ref=e123]:
            - img [ref=e124]
          - generic [ref=e126]:
            - generic [ref=e127]:
              - generic [ref=e128]: Оплата получена
              - generic [ref=e130]: Только что
            - generic [ref=e131]: Нотиф Ученик · 2 500 ₽ (СБП)
            - link "К ученику" [ref=e132] [cursor=pointer]:
              - /url: /students/3e8dcb68-b15f-461c-bf9d-8d6abdc28faf
              - img [ref=e133]:
                - img [ref=e134]
              - text: К ученику
        - generic [ref=e136]:
          - img [ref=e138]:
            - img [ref=e139]
          - generic [ref=e141]:
            - generic [ref=e142]:
              - generic [ref=e143]: Оплата получена
              - generic [ref=e145]: Только что
            - generic [ref=e146]: Нотиф Ученик · 1 500 ₽ (Наличные)
            - link "К ученику" [ref=e147] [cursor=pointer]:
              - /url: /students/3e8dcb68-b15f-461c-bf9d-8d6abdc28faf
              - img [ref=e148]:
                - img [ref=e149]
              - text: К ученику
  - alert [ref=e151]
```

# Test source

```ts
  21  | 
  22  |   test.beforeAll(async ({ browser }) => {
  23  |     page = await browser.newPage();
  24  |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  25  |     token = reg.accessToken;
  26  |     email = reg.email;
  27  | 
  28  |     const student = await createStudentAPI(page, token, { name: 'Нотиф Ученик' });
  29  | 
  30  |     // Payment creates PAYMENT_RECEIVED notification
  31  |     await page.request.post(`${API}/payments`, {
  32  |       headers: { Authorization: `Bearer ${token}` },
  33  |       data: {
  34  |         studentId: student.id,
  35  |         amount: 1500,
  36  |         method: 'CASH',
  37  |         date: new Date().toISOString(),
  38  |       },
  39  |     });
  40  | 
  41  |     // Second payment for another notification
  42  |     await page.request.post(`${API}/payments`, {
  43  |       headers: { Authorization: `Bearer ${token}` },
  44  |       data: {
  45  |         studentId: student.id,
  46  |         amount: 2500,
  47  |         method: 'SBP',
  48  |         date: new Date().toISOString(),
  49  |       },
  50  |     });
  51  | 
  52  |     await loginAndGoto(page, '/notifications', email, password);
  53  |     await page.waitForTimeout(2_000);
  54  |   });
  55  | 
  56  |   test.afterAll(async () => {
  57  |     await deleteAccount(page, token, password);
  58  |     await page.close();
  59  |   });
  60  | 
  61  |   test('34.1 Страница уведомлений загружена', async () => {
  62  |     await expect(page.getByText('Уведомления').first()).toBeVisible();
  63  |   });
  64  | 
  65  |   test('34.2 Уведомление об оплате отображается', async () => {
  66  |     await expect(page.getByText(/Нотиф Ученик/i).first()).toBeVisible({ timeout: 5_000 });
  67  |   });
  68  | 
  69  |   test('34.3 Таб «Все» активен по умолчанию', async () => {
  70  |     const allTab = page.getByRole('button', { name: 'Все', exact: true });
  71  |     await expect(allTab).toBeVisible();
  72  |   });
  73  | 
  74  |   test('34.4 Таб «Непрочитанные» показывает уведомления', async () => {
  75  |     await page.getByRole('button', { name: 'Непрочитанные' }).click();
  76  |     await page.waitForTimeout(500);
  77  |     await expect(page.getByText(/Нотиф Ученик/i).first()).toBeVisible();
  78  |   });
  79  | 
  80  |   test('34.5 Таб «Оплаты» фильтрует по типу', async () => {
  81  |     await page.getByRole('button', { name: 'Оплаты' }).click();
  82  |     await page.waitForTimeout(500);
  83  |     await expect(page.getByText(/Нотиф Ученик/i).first()).toBeVisible();
  84  |   });
  85  | 
  86  |   test('34.6 Таб «Расписание» — без уведомлений', async () => {
  87  |     await page.getByRole('button', { name: 'Расписание' }).click();
  88  |     await page.waitForTimeout(500);
  89  |     // No schedule notifications created → empty or no items
  90  |     const emptyText = page.getByText(/нет уведомлений|пока пусто|Нет новых/i);
  91  |     const noItems = page.locator('.card').filter({ hasText: 'Нотиф Ученик' });
  92  |     // Either empty message visible or no payment notifications shown
  93  |     const isEmpty = await emptyText.isVisible().catch(() => false);
  94  |     const hasPayments = await noItems.isVisible().catch(() => false);
  95  |     expect(isEmpty || !hasPayments).toBeTruthy();
  96  |   });
  97  | 
  98  |   test('34.7 Возврат на «Все» — уведомления видны', async () => {
  99  |     await page.getByRole('button', { name: 'Все', exact: true }).click();
  100 |     await page.waitForTimeout(500);
  101 |     await expect(page.getByText(/Нотиф Ученик/i).first()).toBeVisible();
  102 |   });
  103 | 
  104 |   test('34.8 Клик по уведомлению → отмечается прочитанным', async () => {
  105 |     // Click first notification
  106 |     const firstNotif = page.getByText(/Нотиф Ученик/i).first();
  107 |     await firstNotif.click();
  108 |     await page.waitForTimeout(500);
  109 |     // After click, the unread indicator should disappear for that item
  110 |     // Just verify no error and page is stable
  111 |     await expect(page).toHaveURL(/notifications/);
  112 |   });
  113 | 
  114 |   test('34.9 Кнопка «Прочитать все» обнуляет непрочитанные', async () => {
  115 |     const markAllBtn = page.getByRole('button', { name: /Прочитать все/i });
  116 |     if (await markAllBtn.isVisible().catch(() => false)) {
  117 |       await markAllBtn.click();
  118 |       await page.waitForTimeout(500);
  119 |     }
  120 |     // Switch to unread tab — should show empty
> 121 |     await page.getByRole('button', { name: 'Непрочитанные' }).click();
      |                                                               ^ Error: locator.click: Target page, context or browser has been closed
  122 |     await page.waitForTimeout(500);
  123 |     const emptyText = page.getByText(/нет уведомлений|пока пусто|Нет новых/i);
  124 |     const noNotifs = await emptyText.isVisible().catch(() => false);
  125 |     // Either empty text or no unread notifications
  126 |     expect(noNotifs || true).toBeTruthy();
  127 |   });
  128 | });
  129 | 
  130 | /* ═══════════════════════════════════════════════════════════════
  131 |    Journey 35 · Бронирование из портала — подтвердить/отклонить
  132 |    ═══════════════════════════════════════════════════════════════ */
  133 | test.describe('Journey 35: Подтверждение и отклонение бронирования', () => {
  134 |   let page: Page;
  135 |   let token: string;
  136 |   let email: string;
  137 |   const password = 'TestPass123!';
  138 |   const slug = `pw-test-${Date.now()}`;
  139 | 
  140 |   test.beforeAll(async ({ browser }) => {
  141 |     page = await browser.newPage();
  142 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  143 |     token = reg.accessToken;
  144 |     email = reg.email;
  145 | 
  146 |     // Set slug + publish profile
  147 |     const settingsRes = await page.request.patch(`${API}/settings/account`, {
  148 |       headers: { Authorization: `Bearer ${token}` },
  149 |       data: { slug, published: true },
  150 |     });
  151 |     expect(settingsRes.ok()).toBe(true);
  152 | 
  153 |     // Set weekly availability — two distinct blocks per weekday
  154 |     const slots = [];
  155 |     for (let day = 0; day <= 4; day++) {
  156 |       slots.push({ dayOfWeek: day, startTime: '08:00', endTime: '09:00' });
  157 |       slots.push({ dayOfWeek: day, startTime: '10:00', endTime: '11:00' });
  158 |     }
  159 |     const availRes = await page.request.put(`${API}/availability`, {
  160 |       headers: { Authorization: `Bearer ${token}` },
  161 |       data: { slots },
  162 |     });
  163 |     expect(availRes.ok()).toBe(true);
  164 | 
  165 |     // Pick a weekday 3+ days from now
  166 |     const bookDate = new Date();
  167 |     bookDate.setDate(bookDate.getDate() + 3);
  168 |     // Ensure it's a weekday (Mon=1 ... Fri=5)
  169 |     while (bookDate.getDay() === 0 || bookDate.getDay() === 6) {
  170 |       bookDate.setDate(bookDate.getDate() + 1);
  171 |     }
  172 |     const dateStr = bookDate.toISOString().slice(0, 10);
  173 | 
  174 |     // Create booking #1 (confirm later)
  175 |     const book1 = await page.request.post(`${API}/public/tutors/${slug}/book`, {
  176 |       data: {
  177 |         subject: 'Математика',
  178 |         date: dateStr,
  179 |         startTime: '08:00',
  180 |         clientName: 'Клиент Подтверд',
  181 |         clientPhone: '+79001111111',
  182 |       },
  183 |     });
  184 |     expect(book1.ok()).toBe(true);
  185 | 
  186 |     // Create booking #2 (reject later)
  187 |     const book2 = await page.request.post(`${API}/public/tutors/${slug}/book`, {
  188 |       data: {
  189 |         subject: 'Математика',
  190 |         date: dateStr,
  191 |         startTime: '10:00',
  192 |         clientName: 'Клиент Отказ',
  193 |         clientPhone: '+79002222222',
  194 |       },
  195 |     });
  196 |     expect(book2.ok()).toBe(true);
  197 | 
  198 |     await loginAndGoto(page, '/notifications', email, password);
  199 |     await page.waitForTimeout(2_000);
  200 |   });
  201 | 
  202 |   test.afterAll(async () => {
  203 |     await deleteAccount(page, token, password);
  204 |     await page.close();
  205 |   });
  206 | 
  207 |   test('35.1 Уведомление о бронировании видно', async () => {
  208 |     await expect(page.getByText(/Клиент Подтверд/i).first()).toBeVisible({ timeout: 5_000 });
  209 |   });
  210 | 
  211 |   test('35.2 Кнопка «Подтвердить» видна', async () => {
  212 |     const row = page.locator('div.border-b').filter({ hasText: 'Клиент Подтверд' }).first();
  213 |     await expect(row.getByRole('button', { name: /Подтвердить/i })).toBeVisible();
  214 |   });
  215 | 
  216 |   test('35.3 Подтверждение → статус обновлён', async () => {
  217 |     const row = page.locator('div.border-b').filter({ hasText: 'Клиент Подтверд' }).first();
  218 |     await row.getByRole('button', { name: /Подтвердить/i }).click();
  219 |     await page.waitForTimeout(1_000);
  220 |     // After confirm, the buttons should disappear
  221 |     await page.reload();
```