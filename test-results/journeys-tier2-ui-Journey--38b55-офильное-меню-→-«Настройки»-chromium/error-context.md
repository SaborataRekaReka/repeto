# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-ui.spec.ts >> Journey 51: Sidebar — навигация и профиль >> 51.2 Профильное меню → «Настройки»
- Location: e2e\journeys-tier2-ui.spec.ts:151:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.fixed.top-0.left-0 button').last()

```

# Test source

```ts
  55  |     // The search icon is a button in the header; clicking it reveals the input
  56  |     const searchInput = page.getByPlaceholder('Поиск учеников...');
  57  |     const isVisible = await searchInput.isVisible().catch(() => false);
  58  |     if (!isVisible) {
  59  |       await page.locator('header button').first().click();
  60  |       await expect(searchInput).toBeVisible({ timeout: 3_000 });
  61  |     }
  62  | 
  63  |     await searchInput.fill(studentName.slice(0, 12));
  64  |     // Wait for the dropdown results to appear
  65  |     await page.waitForTimeout(1000);
  66  |     await expect(page.getByText(studentName).first()).toBeVisible({ timeout: 5_000 });
  67  | 
  68  |     // Click on the search result (use first() to avoid strict mode if text appears in multiple places)
  69  |     await page.getByText(studentName).first().click();
  70  |     await expect(page).toHaveURL(/\/students\/[a-f0-9-]+/);
  71  |   });
  72  | 
  73  |   test('50.2 Меню «Создать» — три пункта', async ({ page }) => {
  74  |     await loginAndGoto(page, '/dashboard', email, password);
  75  | 
  76  |     await page.getByRole('button', { name: 'Создать' }).click();
  77  | 
  78  |     await expect(page.getByText('Новый ученик')).toBeVisible();
  79  |     await expect(page.getByText('Новое занятие')).toBeVisible();
  80  |     await expect(page.getByText('Записать оплату').first()).toBeVisible();
  81  |   });
  82  | 
  83  |   test('50.3 Меню «Создать» → «Новый ученик» → /students?create=1', async ({ page }) => {
  84  |     await loginAndGoto(page, '/dashboard', email, password);
  85  | 
  86  |     await page.getByRole('button', { name: 'Создать' }).click();
  87  |     await page.getByText('Новый ученик').click();
  88  |     await expect(page).toHaveURL(/\/students/);
  89  |   });
  90  | 
  91  |   test('50.4 Кнопка уведомлений → /notifications', async ({ page }) => {
  92  |     await loginAndGoto(page, '/dashboard', email, password);
  93  | 
  94  |     // The notification icon is a button that navigates to /notifications
  95  |     // It's the second button in the header area (after search)
  96  |     // Find it by the notification icon class pattern or by position
  97  |     await page.locator('header button').nth(1).click();
  98  |     await expect(page).toHaveURL(/\/notifications/);
  99  |   });
  100 | });
  101 | 
  102 | /* ═══════════════════════════════════════════════════
  103 |    Journey 51 · Sidebar навигация + профиль
  104 |    ═══════════════════════════════════════════════════ */
  105 | test.describe('Journey 51: Sidebar — навигация и профиль', () => {
  106 |   let email: string;
  107 |   let password: string;
  108 |   let token: string;
  109 | 
  110 |   test.beforeAll(async ({ browser }) => {
  111 |     const ctx = await browser.newContext();
  112 |     const page = await ctx.newPage();
  113 |     const reg = await registerViaAPI(page, { name: 'Навигатор' });
  114 |     email = reg.email;
  115 |     password = reg.password;
  116 |     token = reg.accessToken;
  117 | 
  118 |     await page.request.patch(`${API}/settings/account`, {
  119 |       headers: { Authorization: `Bearer ${token}` },
  120 |       data: { slug: `nav-${Date.now()}`, published: true },
  121 |     });
  122 | 
  123 |     await ctx.close();
  124 |   });
  125 | 
  126 |   test.afterAll(async ({ browser }) => {
  127 |     const ctx = await browser.newContext();
  128 |     const p = await ctx.newPage();
  129 |     await deleteAccount(p, token, password);
  130 |     await ctx.close();
  131 |   });
  132 | 
  133 |   test('51.1 Все ссылки сайдбара ведут на правильные страницы', async ({ page }) => {
  134 |     await loginAndGoto(page, '/dashboard', email, password);
  135 | 
  136 |     const links = [
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
> 155 |     await page.locator('.fixed.top-0.left-0 button').last().click();
      |                                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
```