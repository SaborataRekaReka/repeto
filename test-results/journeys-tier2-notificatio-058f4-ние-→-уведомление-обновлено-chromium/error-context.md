# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-notifications.spec.ts >> Journey 35: Подтверждение и отклонение бронирования >> 35.6 Отклонение → уведомление обновлено
- Location: e2e\journeys-tier2-notifications.spec.ts:236:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('div.border-b').filter({ hasText: 'Клиент Отказ' }).first().getByRole('button', { name: /Отклонить/i })

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
        - generic [ref=e84]: Уведомления
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
        - radiogroup [ref=e109]:
          - generic [ref=e110]:
            - radio "Все" [checked] [ref=e111]
            - generic [ref=e112]: Все
          - generic [ref=e113] [cursor=pointer]:
            - radio "Непрочитанные" [ref=e114]
            - generic [ref=e115]: Непрочитанные
          - generic [ref=e116] [cursor=pointer]:
            - radio "Оплаты" [ref=e117]
            - generic [ref=e118]: Оплаты
          - generic [ref=e119] [cursor=pointer]:
            - radio "Расписание" [ref=e120]
            - generic [ref=e121]: Расписание
        - button "Прочитать все (2)" [ref=e122] [cursor=pointer]:
          - generic [ref=e123]: Прочитать все (2)
      - generic [ref=e124]:
        - generic [ref=e125] [cursor=pointer]:
          - img [ref=e127]:
            - img [ref=e128]
          - generic [ref=e130]:
            - generic [ref=e131]:
              - generic [ref=e132]: Новая заявка на занятие
              - generic [ref=e134]: Только что
            - generic [ref=e136]: Клиент Отказ · Математика · 14 апреля в 10:00
            - generic [ref=e137]:
              - button "Подтвердить" [ref=e138]:
                - generic [ref=e139]: Подтвердить
              - button "Отклонить" [ref=e140]:
                - generic [ref=e141]: Отклонить
        - generic [ref=e142] [cursor=pointer]:
          - img [ref=e144]:
            - img [ref=e145]
          - generic [ref=e147]:
            - generic [ref=e148]:
              - generic [ref=e149]: Новая заявка на занятие
              - generic [ref=e151]: Только что
            - generic [ref=e153]: Клиент Подтверд · Математика · 14 апреля в 08:00
            - generic [ref=e154]:
              - button "Подтвердить" [ref=e155]:
                - generic [ref=e156]: Подтвердить
              - button "Отклонить" [ref=e157]:
                - generic [ref=e158]: Отклонить
  - alert [ref=e159]
```

# Test source

```ts
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
  222 |     await page.waitForTimeout(2_000);
  223 |     // Confirm notification appears
  224 |     await expect(page.getByText(/подтвержден|Клиент Подтверд/i).first()).toBeVisible();
  225 |   });
  226 | 
  227 |   test('35.4 Уведомление об отклоняемом бронировании видно', async () => {
  228 |     await expect(page.getByText(/Клиент Отказ/i).first()).toBeVisible();
  229 |   });
  230 | 
  231 |   test('35.5 Кнопка «Отклонить» видна', async () => {
  232 |     const row = page.locator('div.border-b').filter({ hasText: 'Клиент Отказ' }).first();
  233 |     await expect(row.getByRole('button', { name: /Отклонить/i })).toBeVisible();
  234 |   });
  235 | 
  236 |   test('35.6 Отклонение → уведомление обновлено', async () => {
  237 |     const row = page.locator('div.border-b').filter({ hasText: 'Клиент Отказ' }).first();
> 238 |     await row.getByRole('button', { name: /Отклонить/i }).click();
      |                                                           ^ Error: locator.click: Target page, context or browser has been closed
  239 |     await page.waitForTimeout(1_000);
  240 |     await page.reload();
  241 |     await page.waitForTimeout(2_000);
  242 |     // After reject, buttons should disappear from that notification
  243 |     const rejectBtns = page.locator('div.border-b')
  244 |       .filter({ hasText: 'Клиент Отказ' })
  245 |       .getByRole('button', { name: /Отклонить/i });
  246 |     await expect(rejectBtns).toHaveCount(0);
  247 |   });
  248 | });
  249 | 
  250 | /* ═══════════════════════════════════════════════════════════════
  251 |    Journey 36 · Перенос из портала — подтвердить/отклонить + ссылки
  252 |    ═══════════════════════════════════════════════════════════════ */
  253 | test.describe('Journey 36: Перенос и entity-ссылки', () => {
  254 |   let page: Page;
  255 |   let token: string;
  256 |   let email: string;
  257 |   let studentId: string;
  258 |   let portalToken: string;
  259 |   let lessonId: string;
  260 |   const password = 'TestPass123!';
  261 |   const slug = `pw-resc-${Date.now()}`;
  262 | 
  263 |   test.beforeAll(async ({ browser }) => {
  264 |     page = await browser.newPage();
  265 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  266 |     token = reg.accessToken;
  267 |     email = reg.email;
  268 | 
  269 |     // Set slug + publish
  270 |     await page.request.patch(`${API}/settings/account`, {
  271 |       headers: { Authorization: `Bearer ${token}` },
  272 |       data: { slug, published: true },
  273 |     });
  274 | 
  275 |     const student = await createStudentAPI(page, token, { name: 'Перенос Ученик' });
  276 |     studentId = student.id;
  277 | 
  278 |     // Generate portal link
  279 |     const portalRes = await page.request.post(`${API}/students/${student.id}/portal-link`, {
  280 |       headers: { Authorization: `Bearer ${token}` },
  281 |     });
  282 |     const portalData = await portalRes.json();
  283 |     portalToken = portalData.token;
  284 | 
  285 |     // Create lesson in 5 days
  286 |     const futureDate = new Date();
  287 |     futureDate.setDate(futureDate.getDate() + 5);
  288 |     futureDate.setHours(14, 0, 0, 0);
  289 |     const lesson = await createLessonAPI(page, token, student.id, {
  290 |       scheduledAt: futureDate.toISOString(),
  291 |     });
  292 |     lessonId = lesson.id;
  293 | 
  294 |     // Request reschedule from portal
  295 |     const newDate = new Date();
  296 |     newDate.setDate(newDate.getDate() + 6);
  297 |     const newDateStr = newDate.toISOString().slice(0, 10);
  298 |     await page.request.post(`${API}/portal/${portalToken}/lessons/${lessonId}/reschedule`, {
  299 |       data: { newDate: newDateStr, newTime: '16:00' },
  300 |     });
  301 | 
  302 |     // Also create a payment for entity-link testing
  303 |     await page.request.post(`${API}/payments`, {
  304 |       headers: { Authorization: `Bearer ${token}` },
  305 |       data: {
  306 |         studentId: student.id,
  307 |         amount: 3000,
  308 |         method: 'CASH',
  309 |         date: new Date().toISOString(),
  310 |       },
  311 |     });
  312 | 
  313 |     await loginAndGoto(page, '/notifications', email, password);
  314 |     await page.waitForTimeout(2_000);
  315 |   });
  316 | 
  317 |   test.afterAll(async () => {
  318 |     await deleteAccount(page, token, password);
  319 |     await page.close();
  320 |   });
  321 | 
  322 |   test('36.1 Уведомление о переносе видно', async () => {
  323 |     await expect(page.getByText(/перенос|Перенос Ученик/i).first()).toBeVisible({ timeout: 5_000 });
  324 |   });
  325 | 
  326 |   test('36.2 Кнопка «Подтвердить перенос» видна', async () => {
  327 |     const row = page.locator('div, li, article').filter({ hasText: /перенос/i }).first();
  328 |     await expect(row.getByRole('button', { name: /Подтвердить перенос/i })).toBeVisible();
  329 |   });
  330 | 
  331 |   test('36.3 Подтверждение переноса → уведомление обновлено', async () => {
  332 |     const row = page.locator('div, li, article').filter({ hasText: /перенос/i }).first();
  333 |     await row.getByRole('button', { name: /Подтвердить перенос/i }).click();
  334 |     await page.waitForTimeout(1_000);
  335 | 
  336 |     await page.reload();
  337 |     await page.waitForTimeout(2_000);
  338 | 
```