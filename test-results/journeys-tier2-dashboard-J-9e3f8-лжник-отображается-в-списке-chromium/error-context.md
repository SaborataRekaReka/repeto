# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-dashboard.spec.ts >> Journey 31: DebtList — задолженности и навигация >> 31.2 Должник отображается в списке
- Location: e2e\journeys-tier2-dashboard.spec.ts:225:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.card').filter({ hasText: 'Задолженности' }).getByText('Должник Тест')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.card').filter({ hasText: 'Задолженности' }).getByText('Должник Тест')

```

# Page snapshot

```yaml
- dialog "Unhandled Runtime Error" [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - navigation [ref=e8]:
          - button [disabled] [ref=e9]:
            - img [ref=e10]
          - button [ref=e12] [cursor=pointer]:
            - img [ref=e13]
          - generic [ref=e15]: 1 of 2 unhandled errors
        - button "Close" [ref=e16] [cursor=pointer]:
          - img [ref=e18]
      - heading "Unhandled Runtime Error" [level=1] [ref=e21]
      - paragraph [ref=e22]: "Error: Objects are not valid as a React child (found: object with keys {color}). If you meant to render a collection of children, use an array instead."
    - generic [ref=e23]:
      - heading "Call Stack" [level=5] [ref=e24]
      - generic [ref=e25]:
        - heading "throwOnInvalidObjectType" [level=6] [ref=e26]
        - generic [ref=e28]: node_modules\react-dom\cjs\react-dom.development.js (14887:0)
      - generic [ref=e29]:
        - heading "createChild" [level=6] [ref=e30]
        - generic [ref=e32]: node_modules\react-dom\cjs\react-dom.development.js (15139:0)
      - generic [ref=e33]:
        - heading "reconcileChildrenArray" [level=6] [ref=e34]
        - generic [ref=e36]: node_modules\react-dom\cjs\react-dom.development.js (15404:0)
      - generic [ref=e37]:
        - heading "reconcileChildFibers" [level=6] [ref=e38]
        - generic [ref=e40]: node_modules\react-dom\cjs\react-dom.development.js (15821:0)
      - generic [ref=e41]:
        - heading "reconcileChildren" [level=6] [ref=e42]
        - generic [ref=e44]: node_modules\react-dom\cjs\react-dom.development.js (19167:0)
      - generic [ref=e45]:
        - heading "updateHostComponent" [level=6] [ref=e46]
        - generic [ref=e48]: node_modules\react-dom\cjs\react-dom.development.js (19924:0)
      - generic [ref=e49]:
        - heading "beginWork" [level=6] [ref=e50]
        - generic [ref=e52]: node_modules\react-dom\cjs\react-dom.development.js (21618:0)
      - generic [ref=e53]:
        - heading "HTMLUnknownElement.callCallback" [level=6] [ref=e54]
        - generic [ref=e56]: node_modules\react-dom\cjs\react-dom.development.js (4164:0)
      - generic [ref=e57]:
        - heading "Object.invokeGuardedCallbackDev" [level=6] [ref=e58]
        - generic [ref=e60]: node_modules\react-dom\cjs\react-dom.development.js (4213:0)
      - generic [ref=e61]:
        - heading "invokeGuardedCallback" [level=6] [ref=e62]
        - generic [ref=e64]: node_modules\react-dom\cjs\react-dom.development.js (4277:0)
      - generic [ref=e65]:
        - heading "beginWork$1" [level=6] [ref=e66]
        - generic [ref=e68]: node_modules\react-dom\cjs\react-dom.development.js (27451:0)
      - generic [ref=e69]:
        - heading "performUnitOfWork" [level=6] [ref=e70]
        - generic [ref=e72]: node_modules\react-dom\cjs\react-dom.development.js (26557:0)
      - generic [ref=e73]:
        - heading "workLoopSync" [level=6] [ref=e74]
        - generic [ref=e76]: node_modules\react-dom\cjs\react-dom.development.js (26466:0)
      - generic [ref=e77]:
        - heading "renderRootSync" [level=6] [ref=e78]
        - generic [ref=e80]: node_modules\react-dom\cjs\react-dom.development.js (26434:0)
      - generic [ref=e81]:
        - heading "performConcurrentWorkOnRoot" [level=6] [ref=e82]
        - generic [ref=e84]: node_modules\react-dom\cjs\react-dom.development.js (25738:0)
      - generic [ref=e85]:
        - heading "workLoop" [level=6] [ref=e86]
        - generic [ref=e88]: node_modules\scheduler\cjs\scheduler.development.js (266:0)
      - generic [ref=e89]:
        - heading "flushWork" [level=6] [ref=e90]
        - generic [ref=e92]: node_modules\scheduler\cjs\scheduler.development.js (239:0)
      - generic [ref=e93]:
        - heading "MessagePort.performWorkUntilDeadline" [level=6] [ref=e94]
        - generic [ref=e96]: node_modules\scheduler\cjs\scheduler.development.js (533:0)
```

# Test source

```ts
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
> 227 |     await expect(debtCard.getByText('Должник Тест')).toBeVisible({ timeout: 5_000 });
      |                                                      ^ Error: expect(locator).toBeVisible() failed
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
  244 |   });
  245 | });
  246 | 
  247 | /* ═══════════════════════════════════════════════════════════════
  248 |    Journey 32 · Последние оплаты + график дохода + конверсия
  249 |    ═══════════════════════════════════════════════════════════════ */
  250 | test.describe('Journey 32: Последние оплаты, доход и конверсия', () => {
  251 |   let page: Page;
  252 |   let token: string;
  253 |   let email: string;
  254 |   const password = 'TestPass123!';
  255 | 
  256 |   test.beforeAll(async ({ browser }) => {
  257 |     page = await browser.newPage();
  258 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  259 |     token = reg.accessToken;
  260 |     email = reg.email;
  261 | 
  262 |     const student = await createStudentAPI(page, token, { name: 'Платящий Тест' });
  263 | 
  264 |     // Completed lesson
  265 |     const yesterday = new Date();
  266 |     yesterday.setDate(yesterday.getDate() - 1);
  267 |     yesterday.setHours(14, 0, 0, 0);
  268 |     const lesson = await createLessonAPI(page, token, student.id, {
  269 |       scheduledAt: yesterday.toISOString(),
  270 |     });
  271 |     await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
  272 |       headers: { Authorization: `Bearer ${token}` },
  273 |       data: { status: 'COMPLETED' },
  274 |     });
  275 | 
  276 |     // Payment
  277 |     await page.request.post(`${API}/payments`, {
  278 |       headers: { Authorization: `Bearer ${token}` },
  279 |       data: {
  280 |         studentId: student.id,
  281 |         amount: 3000,
  282 |         method: 'CASH',
  283 |         date: new Date().toISOString(),
  284 |       },
  285 |     });
  286 | 
  287 |     await loginAndGoto(page, '/dashboard', email, password);
  288 |     await page.waitForTimeout(2_000);
  289 |   });
  290 | 
  291 |   test.afterAll(async () => {
  292 |     await deleteAccount(page, token, password);
  293 |     await page.close();
  294 |   });
  295 | 
  296 |   test('32.1 Виджет «Последние оплаты» виден', async () => {
  297 |     const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
  298 |     await expect(card).toBeVisible();
  299 |   });
  300 | 
  301 |   test('32.2 Оплата отображается в таблице', async () => {
  302 |     const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
  303 |     await expect(card.getByText('Платящий Тест')).toBeVisible({ timeout: 5_000 });
  304 |   });
  305 | 
  306 |   test('32.3 Сумма оплаты видна', async () => {
  307 |     const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
  308 |     await expect(card.getByText(/3[\s\u00a0]?000/)).toBeVisible();
  309 |   });
  310 | 
  311 |   test('32.4 Статус оплаты — «Получен»', async () => {
  312 |     const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
  313 |     await expect(card.getByText('Получен')).toBeVisible();
  314 |   });
  315 | 
  316 |   test('32.5 Виджет «Доход» виден', async () => {
  317 |     const card = page.locator('.card').filter({ hasText: 'Итого за период' });
  318 |     await expect(card).toBeVisible();
  319 |   });
  320 | 
  321 |   test('32.6 Получено — сумма отображается', async () => {
  322 |     const card = page.locator('.card').filter({ hasText: 'Итого за период' });
  323 |     await expect(card.getByText(/Получено/).first()).toBeVisible({ timeout: 5_000 });
  324 |   });
  325 | 
  326 |   test('32.7 Итого за период — содержит ₽', async () => {
  327 |     const card = page.locator('.card').filter({ hasText: 'Итого за период' });
```