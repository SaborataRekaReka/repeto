# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-ui.spec.ts >> Journey 53: Responsive — мобильный >> 53.1 Viewport 768px → сайдбар скрыт, нижняя навигация видна
- Location: e2e\journeys-tier2-ui.spec.ts:273:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.fixed.bottom-0').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.fixed.bottom-0').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]: Дашборд
      - generic [ref=e7]:
        - button [ref=e9] [cursor=pointer]:
          - img [ref=e12]:
            - img [ref=e13]
        - button [ref=e15] [cursor=pointer]:
          - img [ref=e18]:
            - img [ref=e19]
        - button "Добавить" [ref=e22] [cursor=pointer]:
          - img [ref=e25]:
            - img [ref=e26]
          - generic [ref=e28]: Добавить
    - generic [ref=e29]:
      - link "Активных учеников 0" [ref=e30] [cursor=pointer]:
        - /url: /students
        - generic [ref=e31]:
          - generic [ref=e32]:
            - generic [ref=e33]: Активных учеников
            - img [ref=e35]:
              - img [ref=e36]
          - generic [ref=e39]: "0"
      - link "Занятий в этом месяце 0" [ref=e40] [cursor=pointer]:
        - /url: /schedule
        - generic [ref=e41]:
          - generic [ref=e42]:
            - generic [ref=e43]: Занятий в этом месяце
            - img [ref=e45]:
              - img [ref=e46]
          - generic [ref=e49]: "0"
      - link "Доход за месяц 0 ₽" [ref=e50] [cursor=pointer]:
        - /url: /finance
        - generic [ref=e51]:
          - generic [ref=e52]:
            - generic [ref=e53]: Доход за месяц
            - img [ref=e55]:
              - img [ref=e56]
          - generic [ref=e59]: 0 ₽
      - link "К оплате учениками 0 ₽" [ref=e60] [cursor=pointer]:
        - /url: /payments
        - generic [ref=e61]:
          - generic [ref=e62]:
            - generic [ref=e63]: К оплате учениками
            - img [ref=e65]:
              - img [ref=e66]
          - generic [ref=e69]: 0 ₽
    - generic [ref=e70]:
      - generic [ref=e71]:
        - generic [ref=e72]:
          - generic [ref=e73]:
            - generic [ref=e74]: Доход
            - generic [ref=e75]:
              - button "Месяц" [ref=e76] [cursor=pointer]
              - button "Квартал" [ref=e77] [cursor=pointer]
              - button "Год" [ref=e78] [cursor=pointer]
          - generic [ref=e79]:
            - generic [ref=e80]:
              - generic [ref=e83]: Получено
              - generic [ref=e86]: Запланировано
            - generic [ref=e88]:
              - generic [ref=e89]: Итого за период
              - generic [ref=e90]: 0 ₽
        - generic [ref=e91]:
          - generic [ref=e92]:
            - generic [ref=e93]:
              - generic [ref=e94]: Конверсия в оплату
              - button "Месяц" [ref=e96] [cursor=pointer]:
                - img [ref=e99]:
                  - img [ref=e100]
                - generic [ref=e102]: Месяц
            - generic [ref=e104]:
              - generic [ref=e106]: 0%
              - generic [ref=e109]:
                - generic [ref=e110]: 0%
                - generic [ref=e111]: 100%
              - generic [ref=e112]:
                - generic [ref=e113]:
                  - generic [ref=e116]: Проведено
                  - generic [ref=e117]: 0 зан. · 0 ₽
                - generic [ref=e118]:
                  - generic [ref=e121]: Оплачено
                  - generic [ref=e122]: 0 плат. · 0 ₽
          - generic [ref=e123]:
            - generic [ref=e124]:
              - generic [ref=e125]: Истекающие пакеты
              - link "Все →" [ref=e126] [cursor=pointer]:
                - /url: /packages
            - generic [ref=e127]: Нет пакетов с истекающим сроком
        - generic [ref=e128]:
          - generic [ref=e129]:
            - generic [ref=e130]: Последние оплаты
            - link "Все →" [ref=e131] [cursor=pointer]:
              - /url: /payments
          - generic [ref=e132]: Пока оплат не было
      - generic [ref=e133]:
        - generic [ref=e134]:
          - generic [ref=e135]:
            - generic [ref=e136]: Сегодня, 11 апреля
            - link "Всё расписание →" [ref=e137] [cursor=pointer]:
              - /url: /schedule
          - generic [ref=e138]: Занятий на сегодня нет
        - generic [ref=e139]:
          - generic [ref=e140]:
            - generic [ref=e141]: Занятия на неделю
            - link "Расписание →" [ref=e142] [cursor=pointer]:
              - /url: /schedule
          - generic [ref=e143]: На ближайшую неделю занятий нет
        - generic [ref=e144]:
          - generic [ref=e145]:
            - generic [ref=e146]: Задолженности
            - link "Все →" [ref=e147] [cursor=pointer]:
              - /url: /payments
          - generic [ref=e148]: Задолженностей нет
  - alert [ref=e149]: Дашборд — Repeto
```

# Test source

```ts
  185 |     token = reg.accessToken;
  186 |     await ctx.close();
  187 |   });
  188 | 
  189 |   test.afterAll(async ({ browser }) => {
  190 |     const ctx = await browser.newContext();
  191 |     const p = await ctx.newPage();
  192 |     await deleteAccount(p, token, password);
  193 |     await ctx.close();
  194 |   });
  195 | 
  196 |   test('52.1 Переключение на тёмную тему', async ({ page }) => {
  197 |     await loginAndGoto(page, '/dashboard', email, password);
  198 | 
  199 |     // Set light mode via localStorage and reload
  200 |     await page.evaluate(() => localStorage.setItem('chakra-ui-color-mode', 'light'));
  201 |     await page.reload();
  202 |     await page.waitForLoadState('networkidle');
  203 | 
  204 |     const needsLogin = await page.getByPlaceholder('Введите email или телефон').isVisible().catch(() => false);
  205 |     if (needsLogin) {
  206 |       await loginAndGoto(page, '/dashboard', email, password);
  207 |     }
  208 | 
  209 |     // Click the moon button (second button in the toggle div.relative.flex.w-14)
  210 |     const toggle = page.locator('div.relative.flex.w-14');
  211 |     await toggle.locator('button').last().click();
  212 | 
  213 |     await page.waitForTimeout(500);
  214 |     // Check dark mode: Chakra sets data-theme or class on html
  215 |     const isDark = await page.evaluate(() => {
  216 |       const html = document.documentElement;
  217 |       return html.getAttribute('data-theme') === 'dark' || html.classList.contains('dark');
  218 |     });
  219 |     expect(isDark).toBe(true);
  220 |   });
  221 | 
  222 |   test('52.2 Переключение обратно на светлую тему', async ({ page }) => {
  223 |     await loginAndGoto(page, '/dashboard', email, password);
  224 | 
  225 |     // Set dark mode first
  226 |     await page.evaluate(() => localStorage.setItem('chakra-ui-color-mode', 'dark'));
  227 |     await page.reload();
  228 |     await page.waitForLoadState('networkidle');
  229 | 
  230 |     const needsLogin = await page.getByPlaceholder('Введите email или телефон').isVisible().catch(() => false);
  231 |     if (needsLogin) {
  232 |       await loginAndGoto(page, '/dashboard', email, password);
  233 |     }
  234 | 
  235 |     // Click the sun button (first in toggle)
  236 |     const toggle = page.locator('div.relative.flex.w-14');
  237 |     await toggle.locator('button').first().click();
  238 | 
  239 |     await page.waitForTimeout(500);
  240 |     const isDark = await page.evaluate(() => {
  241 |       const html = document.documentElement;
  242 |       return html.getAttribute('data-theme') === 'dark' || html.classList.contains('dark');
  243 |     });
  244 |     expect(isDark).toBe(false);
  245 |   });
  246 | });
  247 | 
  248 | /* ═══════════════════════════════════════════════════
  249 |    Journey 53 · Responsive
  250 |    ═══════════════════════════════════════════════════ */
  251 | test.describe('Journey 53: Responsive — мобильный', () => {
  252 |   let email: string;
  253 |   let password: string;
  254 |   let token: string;
  255 | 
  256 |   test.beforeAll(async ({ browser }) => {
  257 |     const ctx = await browser.newContext();
  258 |     const page = await ctx.newPage();
  259 |     const reg = await registerViaAPI(page, { name: 'Мобильный' });
  260 |     email = reg.email;
  261 |     password = reg.password;
  262 |     token = reg.accessToken;
  263 |     await ctx.close();
  264 |   });
  265 | 
  266 |   test.afterAll(async ({ browser }) => {
  267 |     const ctx = await browser.newContext();
  268 |     const p = await ctx.newPage();
  269 |     await deleteAccount(p, token, password);
  270 |     await ctx.close();
  271 |   });
  272 | 
  273 |   test('53.1 Viewport 768px → сайдбар скрыт, нижняя навигация видна', async ({ browser }) => {
  274 |     const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  275 |     const page = await ctx.newPage();
  276 |     await loginAndGoto(page, '/dashboard', email, password);
  277 | 
  278 |     // Sidebar (fixed left div) should be hidden at md breakpoint
  279 |     const sidebar = page.locator('.fixed.top-0.left-0.bottom-0').first();
  280 |     const sidebarVisible = await sidebar.isVisible().catch(() => false);
  281 |     expect(sidebarVisible).toBe(false);
  282 | 
  283 |     // Bottom nav should be visible
  284 |     const bottomNav = page.locator('.fixed.bottom-0').first();
> 285 |     await expect(bottomNav).toBeVisible();
      |                             ^ Error: expect(locator).toBeVisible() failed
  286 | 
  287 |     await ctx.close();
  288 |   });
  289 | 
  290 |   test('53.2 Viewport 768px → нижняя навигация содержит ссылки', async ({ browser }) => {
  291 |     const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  292 |     const page = await ctx.newPage();
  293 |     await loginAndGoto(page, '/dashboard', email, password);
  294 | 
  295 |     const bottomNav = page.locator('.fixed.bottom-0').first();
  296 |     await expect(bottomNav).toBeVisible();
  297 | 
  298 |     const links = await bottomNav.locator('a, button').count();
  299 |     expect(links).toBeGreaterThanOrEqual(4);
  300 | 
  301 |     await ctx.close();
  302 |   });
  303 | });
  304 | 
```