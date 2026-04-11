# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-portal.spec.ts >> Journey 42: Портал — отмена урока и отзыв >> 42.4 Отзыв через API → оценка видна
- Location: e2e\journeys-tier2-portal.spec.ts:191:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.bg-yellow-1').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.bg-yellow-1').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]: Repeto
      - generic [ref=e7]:
        - generic [ref=e8]: Ученик Отмена
        - generic [ref=e9]:
          - button [ref=e10] [cursor=pointer]:
            - img [ref=e11]
          - button [ref=e13] [cursor=pointer]:
            - img [ref=e14]
    - generic [ref=e16]:
      - generic [ref=e17]: Ваш репетитор
      - generic [ref=e19]:
        - generic [ref=e20]: РО
        - generic [ref=e21]:
          - generic [ref=e22]: Репетитор Отмена
          - generic [ref=e23]:
            - link:
              - /url: "tel:"
            - link "Профиль" [ref=e24] [cursor=pointer]:
              - /url: /t/pw-cancel-1775929447187
              - img [ref=e25]
              - text: Профиль
      - generic [ref=e28]:
        - button "Занятия" [ref=e29] [cursor=pointer]
        - button "Домашка" [ref=e30] [cursor=pointer]
        - button "Материалы" [ref=e31] [cursor=pointer]
        - button "Оплата" [ref=e32] [cursor=pointer]
      - generic [ref=e33]:
        - generic [ref=e35]: Ближайшие занятия
        - paragraph [ref=e37]: Нет запланированных занятий
      - generic [ref=e38]:
        - generic [ref=e40]: Прошедшие занятия
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]:
              - generic [ref=e46]: 10 апреля, Пт
              - generic [ref=e47]: Математика
            - generic [ref=e48]:
              - generic [ref=e49]: Проведено
              - generic [ref=e50]: 2 000 ₽
          - generic [ref=e51]:
            - generic [ref=e52]:
              - generic [ref=e53]: Оценка
              - generic [ref=e54]:
                - button [ref=e55]
                - button [ref=e56]
                - button [ref=e57]
                - button [ref=e58]
                - button [ref=e59]
            - generic [ref=e61]: Отлично!
      - generic [ref=e62]:
        - generic [ref=e64]: Политика отмен
        - paragraph [ref=e66]:
          - text: Бесплатная отмена за
          - generic [ref=e67]: 24 часа
          - text: до занятия. При поздней отмене — списание по правилам репетитора.
      - generic [ref=e68]:
        - text: Работает на
        - link "Repeto" [ref=e69] [cursor=pointer]:
          - /url: /
  - alert [ref=e70]: /t/pw-cancel-1775929447187/s/80185e24-ea62-432a-b12d-26a3950d14ef
```

# Test source

```ts
  100 |     await expect(page.getByText(/Нет материалов/i)).toBeVisible();
  101 |   });
  102 | 
  103 |   test('41.8 Вкладка «Оплата» — баланс и ставка видны', async () => {
  104 |     await page.getByRole('button', { name: /Оплата/i }).click();
  105 |     await page.waitForTimeout(500);
  106 |     await expect(page.getByText(/Текущий баланс/i)).toBeVisible();
  107 |     await expect(page.getByText(/Ставка/i)).toBeVisible();
  108 |   });
  109 | 
  110 |   test('41.9 История оплат — оплата видна', async () => {
  111 |     await expect(page.getByText(/5\s?000/)).toBeVisible();
  112 |   });
  113 | });
  114 | 
  115 | /* ═══════════════════════════════════════════════════════════════
  116 |    Journey 42 · Портал — отмена урока (двойной клик) + отзыв
  117 |    ═══════════════════════════════════════════════════════════════ */
  118 | test.describe('Journey 42: Портал — отмена урока и отзыв', () => {
  119 |   let page: Page;
  120 |   let token: string;
  121 |   let slug: string;
  122 |   let portalToken: string;
  123 |   let pastLessonId: string;
  124 |   const password = 'TestPass123!';
  125 | 
  126 |   test.beforeAll(async ({ browser }) => {
  127 |     page = await browser.newPage();
  128 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password, name: 'Репетитор Отмена' });
  129 |     token = reg.accessToken;
  130 |     slug = `pw-cancel-${Date.now()}`;
  131 | 
  132 |     await page.request.patch(`${API}/settings/account`, {
  133 |       headers: { Authorization: `Bearer ${token}` },
  134 |       data: { slug, published: true },
  135 |     });
  136 | 
  137 |     const student = await createStudentAPI(page, token, { name: 'Ученик Отмена', rate: 2000 });
  138 | 
  139 |     // Upcoming lesson for cancellation
  140 |     await createLessonAPI(page, token, student.id);
  141 | 
  142 |     // Past lesson for feedback
  143 |     const yesterday = new Date();
  144 |     yesterday.setDate(yesterday.getDate() - 1);
  145 |     yesterday.setHours(14, 0, 0, 0);
  146 |     const pastLesson = await createLessonAPI(page, token, student.id, {
  147 |       scheduledAt: yesterday.toISOString(),
  148 |     });
  149 |     pastLessonId = pastLesson.id;
  150 |     await page.request.patch(`${API}/lessons/${pastLesson.id}/status`, {
  151 |       headers: { Authorization: `Bearer ${token}` },
  152 |       data: { status: 'COMPLETED' },
  153 |     });
  154 | 
  155 |     const portalRes = await page.request.post(`${API}/students/${student.id}/portal-link`, {
  156 |       headers: { Authorization: `Bearer ${token}` },
  157 |     });
  158 |     const portalData = await portalRes.json();
  159 |     portalToken = portalData.token;
  160 | 
  161 |     await page.goto(`/t/${slug}/s/${portalToken}`);
  162 |     await page.waitForTimeout(2_000);
  163 |   });
  164 | 
  165 |   test.afterAll(async () => {
  166 |     await deleteAccount(page, token, password);
  167 |     await page.close();
  168 |   });
  169 | 
  170 |   test('42.1 Кнопка «Отменить» видна у ближайшего урока', async () => {
  171 |     await expect(page.getByRole('button', { name: /Отменить/i }).first()).toBeVisible();
  172 |   });
  173 | 
  174 |   test('42.2 Первый клик → confirmation box', async () => {
  175 |     await page.getByRole('button', { name: /Отменить/i }).first().click();
  176 |     await page.waitForTimeout(500);
  177 |     // Confirmation text should appear
  178 |     await expect(page.getByText(/Нажмите.*ещё раз|подтвержд/i).first()).toBeVisible({ timeout: 3_000 });
  179 |   });
  180 | 
  181 |   test('42.3 Второй клик → урок отменён', async () => {
  182 |     // Click the confirmation cancel button (now with pink border)
  183 |     await page.getByRole('button', { name: /Отменить/i }).first().click();
  184 |     await page.waitForTimeout(2_000);
  185 |     await page.reload();
  186 |     await page.waitForTimeout(2_000);
  187 |     // Upcoming section should now be empty (lesson removed)
  188 |     await expect(page.getByText(/Нет запланированных занятий/i)).toBeVisible({ timeout: 5_000 });
  189 |   });
  190 | 
  191 |   test('42.4 Отзыв через API → оценка видна', async () => {
  192 |     // Submit feedback via API (UI interaction with 5 circles is complex)
  193 |     await page.request.post(`${API}/portal/${portalToken}/lessons/${pastLessonId}/feedback`, {
  194 |       data: { rating: 5, feedback: 'Отлично!' },
  195 |     });
  196 |     await page.reload();
  197 |     await page.waitForTimeout(2_000);
  198 |     // Rating circles should show (5 filled)
  199 |     const filledCircles = page.locator('.bg-yellow-1');
> 200 |     await expect(filledCircles.first()).toBeVisible({ timeout: 5_000 });
      |                                         ^ Error: expect(locator).toBeVisible() failed
  201 |   });
  202 | });
  203 | 
  204 | /* ═══════════════════════════════════════════════════════════════
  205 |    Journey 43 · Портал — недействительная ссылка
  206 |    ═══════════════════════════════════════════════════════════════ */
  207 | test.describe('Journey 43: Портал — недействительная ссылка', () => {
  208 |   let page: Page;
  209 |   let token: string;
  210 |   let slug: string;
  211 |   const password = 'TestPass123!';
  212 | 
  213 |   test.beforeAll(async ({ browser }) => {
  214 |     page = await browser.newPage();
  215 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  216 |     token = reg.accessToken;
  217 |     slug = `pw-invalid-${Date.now()}`;
  218 |     await page.request.patch(`${API}/settings/account`, {
  219 |       headers: { Authorization: `Bearer ${token}` },
  220 |       data: { slug, published: true },
  221 |     });
  222 |   });
  223 | 
  224 |   test.afterAll(async () => {
  225 |     await deleteAccount(page, token, password);
  226 |     await page.close();
  227 |   });
  228 | 
  229 |   test('43.1 Невалидный токен → сообщение об ошибке', async () => {
  230 |     await page.goto(`/t/${slug}/s/invalid-token-abc123`);
  231 |     await page.waitForTimeout(2_000);
  232 |     await expect(page.getByText(/недействительна|не найден|Invalid/i).first()).toBeVisible({ timeout: 5_000 });
  233 |   });
  234 | 
  235 |   test('43.2 Сообщение предлагает обратиться к репетитору', async () => {
  236 |     await expect(page.getByText(/репетитор|актуальную ссылку/i).first()).toBeVisible();
  237 |   });
  238 | });
  239 | 
```