# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-ui.spec.ts >> Journey 52: Тёмная тема >> 52.2 Переключение обратно на светлую тему
- Location: e2e\journeys-tier2-ui.spec.ts:222:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('div.relative.flex.w-14').locator('button').first()

```

# Test source

```ts
  137 |       { label: 'Ученики', url: '/students' },
  138 |       { label: 'Расписание', url: '/schedule' },
  139 |       { label: 'Финансы', url: '/finance' },
  140 |       { label: 'Уведомления', url: '/notifications' },
  141 |       { label: 'Настройки', url: '/settings' },
  142 |       { label: 'Дашборд', url: '/dashboard' },
  143 |     ];
  144 | 
  145 |     for (const { label, url } of links) {
  146 |       await page.getByText(label, { exact: true }).first().click();
  147 |       await expect(page).toHaveURL(new RegExp(url));
  148 |     }
  149 |   });
  150 | 
  151 |   test('51.2 Профильное меню → «Настройки»', async ({ page }) => {
  152 |     await loginAndGoto(page, '/dashboard', email, password);
  153 | 
  154 |     // The "..." dots button is in the fixed sidebar, last button
  155 |     await page.locator('.fixed.top-0.left-0 button').last().click();
  156 | 
  157 |     // Click "Настройки" in the dropdown menu (last one to avoid sidebar nav conflict)
  158 |     await page.locator('.absolute.bottom-full').getByText('Настройки').click();
  159 |     await expect(page).toHaveURL(/\/settings/);
  160 |   });
  161 | 
  162 |   test('51.3 Профильное меню → «Выйти»', async ({ page }) => {
  163 |     await loginAndGoto(page, '/dashboard', email, password);
  164 | 
  165 |     await page.locator('.fixed.top-0.left-0 button').last().click();
  166 |     await page.getByText('Выйти').click();
  167 |     await expect(page).toHaveURL(/\/registration/);
  168 |   });
  169 | });
  170 | 
  171 | /* ═══════════════════════════════════════════════════
  172 |    Journey 52 · Тёмная тема
  173 |    ═══════════════════════════════════════════════════ */
  174 | test.describe('Journey 52: Тёмная тема', () => {
  175 |   let email: string;
  176 |   let password: string;
  177 |   let token: string;
  178 | 
  179 |   test.beforeAll(async ({ browser }) => {
  180 |     const ctx = await browser.newContext();
  181 |     const page = await ctx.newPage();
  182 |     const reg = await registerViaAPI(page, { name: 'ТемаТест' });
  183 |     email = reg.email;
  184 |     password = reg.password;
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
> 237 |     await toggle.locator('button').first().click();
      |                                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  285 |     await expect(bottomNav).toBeVisible();
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