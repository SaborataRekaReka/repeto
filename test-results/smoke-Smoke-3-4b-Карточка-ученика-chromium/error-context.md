# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Smoke >> 3.4b Карточка ученика
- Location: e2e\smoke.spec.ts:137:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('PW Ученик')
Expected: visible
Error: strict mode violation: getByText('PW Ученик') resolved to 2 elements:
    1) <span class="g-text g-text_variant_header-1">PW Ученик</span> aka locator('header').getByText('PW Ученик')
    2) <div class="g-text g-text_variant_subheader-2">PW Ученик</div> aka getByText('PW Ученик').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('PW Ученик')

```

# Test source

```ts
  41  |       headers: { Authorization: `Bearer ${token}` },
  42  |     });
  43  |     if (portalRes.ok()) {
  44  |       const b = await portalRes.json();
  45  |       portalToken = b.portalToken || b.token || '';
  46  |     }
  47  | 
  48  |     await createLessonAPI(page, token, studentId);
  49  | 
  50  |     await page.request.post(`${API}/payments`, {
  51  |       headers: { Authorization: `Bearer ${token}` },
  52  |       data: { studentId, amount: 2000, method: 'CASH', description: 'Smoke оплата' },
  53  |     });
  54  | 
  55  |     await page.close();
  56  |   });
  57  | 
  58  |   test.afterAll(async ({ browser }) => {
  59  |     const page = await browser.newPage();
  60  |     try {
  61  |       await page.request.delete(`${API}/settings/account`, {
  62  |         headers: { Authorization: `Bearer ${token}` },
  63  |         data: { password },
  64  |       });
  65  |     } catch { /* ignore */ }
  66  |     await page.close();
  67  |   });
  68  | 
  69  |   // ─── 3.1 Регистрация ──────────────────────
  70  |   test('3.1a Страница регистрации — форма', async ({ page }) => {
  71  |     await page.goto('/registration');
  72  |     await page.screenshot({ path: `${S}/01-registration.png`, fullPage: true });
  73  |     await expect(page.getByPlaceholder('Введите email или телефон')).toBeVisible();
  74  |     await expect(page.getByPlaceholder('Введите пароль')).toBeVisible();
  75  |     await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  76  |   });
  77  | 
  78  |   test('3.1b Вход → дашборд', async ({ page }) => {
  79  |     await loginAndGoto(page, '/dashboard', email, password);
  80  |     await page.screenshot({ path: `${S}/02-login-redirect.png`, fullPage: true });
  81  |     expect(page.url()).toContain('/dashboard');
  82  |   });
  83  | 
  84  |   test('3.1c Неверный пароль → ошибка', async ({ page }) => {
  85  |     await page.goto('/registration');
  86  |     await page.getByPlaceholder('Введите email или телефон').fill(email);
  87  |     await page.getByPlaceholder('Введите пароль').fill('WrongPassword99!');
  88  |     await page.getByRole('button', { name: 'Войти' }).click();
  89  |     await page.waitForTimeout(2000);
  90  |     await page.screenshot({ path: `${S}/03-login-error.png`, fullPage: true });
  91  |     expect(page.url()).toContain('/registration');
  92  |   });
  93  | 
  94  |   // ─── 3.2 Дашборд ─────────────────────────
  95  |   test('3.2 Дашборд — контент загружен', async ({ page }) => {
  96  |     await loginAndGoto(page, '/dashboard', email, password);
  97  |     await page.waitForTimeout(1500);
  98  |     await page.screenshot({ path: `${S}/04-dashboard.png`, fullPage: true });
  99  |     const body = await page.textContent('body');
  100 |     expect(body!.length).toBeGreaterThan(100);
  101 |   });
  102 | 
  103 |   // ─── 3.3 Боковое меню ─────────────────────
  104 |   test('3.3 Навигация сайдбара', async ({ page }) => {
  105 |     await loginAndGoto(page, '/dashboard', email, password);
  106 |     await page.screenshot({ path: `${S}/05-sidebar.png` });
  107 | 
  108 |     const navItems = [
  109 |       { text: /Ученики/i, url: '/students' },
  110 |       { text: /Расписание/i, url: '/schedule' },
  111 |       { text: /Настройки/i, url: '/settings' },
  112 |       { text: /Поддержка/i, url: '/support' },
  113 |     ];
  114 | 
  115 |     const visited: string[] = [];
  116 |     for (const { text, url } of navItems) {
  117 |       const link = page.locator('a').filter({ hasText: text }).first();
  118 |       if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
  119 |         await link.click();
  120 |         await page.waitForTimeout(1500);
  121 |         visited.push(`${text} → ${page.url()}`);
  122 |       }
  123 |     }
  124 |     await page.screenshot({ path: `${S}/06-sidebar-nav.png`, fullPage: true });
  125 |     // Достаточно что хотя бы 3 перехода были
  126 |     expect(visited.length).toBeGreaterThanOrEqual(3);
  127 |   });
  128 | 
  129 |   // ─── 3.4 Ученики ──────────────────────────
  130 |   test('3.4a Список учеников', async ({ page }) => {
  131 |     await loginAndGoto(page, '/students', email, password);
  132 |     await page.waitForTimeout(1500);
  133 |     await page.screenshot({ path: `${S}/07-students-list.png`, fullPage: true });
  134 |     await expect(page.getByText('PW Ученик')).toBeVisible({ timeout: 5000 });
  135 |   });
  136 | 
  137 |   test('3.4b Карточка ученика', async ({ page }) => {
  138 |     await loginAndGoto(page, `/students/${studentId}`, email, password);
  139 |     await page.waitForTimeout(1500);
  140 |     await page.screenshot({ path: `${S}/08-student-card.png`, fullPage: true });
> 141 |     await expect(page.getByText('PW Ученик')).toBeVisible({ timeout: 5000 });
      |                                               ^ Error: expect(locator).toBeVisible() failed
  142 |   });
  143 | 
  144 |   test('3.4c Модалка «Новый ученик»', async ({ page }) => {
  145 |     await loginAndGoto(page, '/students', email, password);
  146 |     await page.waitForTimeout(1000);
  147 |     await page.getByRole('button', { name: /Новый ученик/i }).first().click();
  148 |     await page.waitForTimeout(500);
  149 |     await page.screenshot({ path: `${S}/09-student-modal.png`, fullPage: true });
  150 |     await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible();
  151 |     await expect(page.getByPlaceholder('2100')).toBeVisible();
  152 |   });
  153 | 
  154 |   // ─── 3.5 Расписание ───────────────────────
  155 |   test('3.5a Расписание/календарь', async ({ page }) => {
  156 |     await loginAndGoto(page, '/schedule', email, password);
  157 |     await page.waitForTimeout(2000);
  158 |     await page.screenshot({ path: `${S}/10-schedule.png`, fullPage: true });
  159 |     const body = await page.textContent('body');
  160 |     expect(body!.length).toBeGreaterThan(100);
  161 |   });
  162 | 
  163 |   test('3.5b Модалка создания урока', async ({ page }) => {
  164 |     await loginAndGoto(page, '/schedule', email, password);
  165 |     await page.waitForTimeout(1000);
  166 |     const addBtn = page.getByRole('button', { name: /Новый урок|Создать|Добавить/i }).first();
  167 |     if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  168 |       await addBtn.click();
  169 |       await page.waitForTimeout(500);
  170 |     }
  171 |     await page.screenshot({ path: `${S}/11-schedule-modal.png`, fullPage: true });
  172 |   });
  173 | 
  174 |   // ─── 3.6 Финансы ──────────────────────────
  175 |   test('3.6a Обзор финансов', async ({ page }) => {
  176 |     await loginAndGoto(page, '/finance', email, password);
  177 |     await page.waitForTimeout(1500);
  178 |     await page.screenshot({ path: `${S}/12-finance.png`, fullPage: true });
  179 |   });
  180 | 
  181 |   test('3.6b Оплаты', async ({ page }) => {
  182 |     await loginAndGoto(page, '/finance/payments', email, password);
  183 |     await page.waitForTimeout(1500);
  184 |     await page.screenshot({ path: `${S}/13-payments.png`, fullPage: true });
  185 |   });
  186 | 
  187 |   test('3.6c Пакеты', async ({ page }) => {
  188 |     await loginAndGoto(page, '/finance/packages', email, password);
  189 |     await page.waitForTimeout(1500);
  190 |     await page.screenshot({ path: `${S}/14-packages.png`, fullPage: true });
  191 |   });
  192 | 
  193 |   // ─── 3.7 Настройки ────────────────────────
  194 |   test('3.7 Настройки', async ({ page }) => {
  195 |     await loginAndGoto(page, '/settings', email, password);
  196 |     await page.waitForTimeout(1500);
  197 |     await page.screenshot({ path: `${S}/15-settings.png`, fullPage: true });
  198 |     const body = await page.textContent('body');
  199 |     expect(body).toBeTruthy();
  200 |   });
  201 | 
  202 |   // ─── 3.8 Публичная страница ────────────────
  203 |   test('3.8a Публичный профиль', async ({ page }) => {
  204 |     await page.goto(`/t/${tutorSlug}`);
  205 |     await page.waitForTimeout(2000);
  206 |     await page.screenshot({ path: `${S}/16-public.png`, fullPage: true });
  207 |     const body = await page.textContent('body');
  208 |     expect(body!.length).toBeGreaterThan(50);
  209 |   });
  210 | 
  211 |   test('3.8b Несуществующий slug → ошибка', async ({ page }) => {
  212 |     await page.goto('/t/nonexistent-slug-xyz-999');
  213 |     await page.waitForTimeout(2000);
  214 |     await page.screenshot({ path: `${S}/17-public-404.png`, fullPage: true });
  215 |     await expect(page.locator('body')).toContainText(/не найден|404|не существует/i);
  216 |   });
  217 | 
  218 |   // ─── 3.9 Портал ученика ────────────────────
  219 |   test('3.9a Портал — валидный токен', async ({ page }) => {
  220 |     test.skip(!portalToken, 'Portal token not generated');
  221 |     await page.goto(`/t/${tutorSlug}/s/${portalToken}`);
  222 |     await page.waitForTimeout(2000);
  223 |     await page.screenshot({ path: `${S}/18-portal.png`, fullPage: true });
  224 |     const body = await page.textContent('body');
  225 |     expect(body!.length).toBeGreaterThan(50);
  226 |   });
  227 | 
  228 |   test('3.9b Портал — невалидный токен', async ({ page }) => {
  229 |     await page.goto(`/t/${tutorSlug}/s/invalid-token-xyz`);
  230 |     await page.waitForTimeout(2000);
  231 |     await page.screenshot({ path: `${S}/19-portal-invalid.png`, fullPage: true });
  232 |     await expect(page.locator('body')).toContainText(/недействительна|не найден|ошибка|404/i);
  233 |   });
  234 | 
  235 |   // ─── 3.10 Поддержка ───────────────────────
  236 |   test('3.10a Главная поддержки', async ({ page }) => {
  237 |     await loginAndGoto(page, '/support', email, password);
  238 |     await page.waitForTimeout(1500);
  239 |     await page.screenshot({ path: `${S}/20-support.png`, fullPage: true });
  240 |   });
  241 | 
```