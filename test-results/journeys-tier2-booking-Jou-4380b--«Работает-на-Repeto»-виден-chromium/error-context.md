# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-booking.spec.ts >> Journey 47: Публичная страница — все секции >> 47.6 Хедер «Работает на Repeto» виден
- Location: e2e\journeys-tier2-booking.spec.ts:118:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Работает на Repeto').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Работает на Repeto').first()

```

# Test source

```ts
  19  |  */
  20  | 
  21  | /* ═══════════════════════════════════════════════════
  22  |    Journey 47 · Публичная страница
  23  |    ═══════════════════════════════════════════════════ */
  24  | test.describe('Journey 47: Публичная страница — все секции', () => {
  25  |   let email: string;
  26  |   let password: string;
  27  |   let token: string;
  28  |   let slug: string;
  29  | 
  30  |   test.beforeAll(async ({ browser }) => {
  31  |     const ctx = await browser.newContext();
  32  |     const page = await ctx.newPage();
  33  |     const reg = await registerViaAPI(page, { name: 'Публичный Репетитор' });
  34  |     email = reg.email;
  35  |     password = reg.password;
  36  |     token = reg.accessToken;
  37  | 
  38  |     slug = `pub-${Date.now()}`;
  39  | 
  40  |     // Set slug, publish, aboutText, subjects
  41  |     const settingsRes = await page.request.patch(`${API}/settings/account`, {
  42  |       headers: { Authorization: `Bearer ${token}` },
  43  |       data: {
  44  |         slug,
  45  |         published: true,
  46  |         aboutText: 'Опытный преподаватель с 10-летним стажем.',
  47  |         subjects: ['Математика', 'Физика'],
  48  |         subjectDetails: [
  49  |           { name: 'Математика', duration: 60, price: 2000 },
  50  |           { name: 'Физика', duration: 90, price: 2500 },
  51  |         ],
  52  |       },
  53  |     });
  54  |     expect(settingsRes.ok()).toBe(true);
  55  | 
  56  |     // Create availability so hasWorkingDays = true
  57  |     // dayOfWeek: 0=Mon, 1=Tue, ..., 6=Sun
  58  |     const jsDay = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
  59  |     const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // convert to 0=Mon,...,6=Sun
  60  |     const availRes = await page.request.put(`${API}/availability`, {
  61  |       headers: { Authorization: `Bearer ${token}` },
  62  |       data: {
  63  |         slots: [
  64  |           { dayOfWeek, startTime: '08:00', endTime: '09:00' },
  65  |           { dayOfWeek, startTime: '10:00', endTime: '11:00' },
  66  |         ],
  67  |       },
  68  |     });
  69  |     expect(availRes.ok()).toBe(true);
  70  | 
  71  |     await ctx.close();
  72  |   });
  73  | 
  74  |   test.afterAll(async ({ browser }) => {
  75  |     const ctx = await browser.newContext();
  76  |     const p = await ctx.newPage();
  77  |     await deleteAccount(p, token, password);
  78  |     await ctx.close();
  79  |   });
  80  | 
  81  |   let page: Page;
  82  |   test.beforeEach(async ({ browser }) => {
  83  |     page = await browser.newPage();
  84  |     await page.goto(`/t/${slug}`);
  85  |     // Wait for the public page to fully load (API-driven SPA)
  86  |     await expect(page.getByText('Публичный Репетитор')).toBeVisible({ timeout: 15_000 });
  87  |   });
  88  |   test.afterEach(async () => { await page.close(); });
  89  | 
  90  |   test('47.1 Имя репетитора видно', async () => {
  91  |     await expect(page.getByText('Публичный Репетитор')).toBeVisible();
  92  |   });
  93  | 
  94  |   test('47.2 Секция «О репетиторе» с текстом', async () => {
  95  |     await expect(page.getByText('О репетиторе')).toBeVisible();
  96  |     await expect(page.getByText('Опытный преподаватель с 10-летним стажем.')).toBeVisible();
  97  |   });
  98  | 
  99  |   test('47.3 Секция «Предметы» — Математика и Физика', async () => {
  100 |     await expect(page.getByText('Предметы')).toBeVisible();
  101 |     // Hero also contains "Математика, Физика" so use .first() to avoid strict mode
  102 |     await expect(page.getByText('Математика').first()).toBeVisible();
  103 |     await expect(page.getByText('Физика').first()).toBeVisible();
  104 |   });
  105 | 
  106 |   test('47.4 Цены предметов видны', async () => {
  107 |     await expect(page.getByText(/2\s?000\s*₽/)).toBeVisible();
  108 |     await expect(page.getByText(/2\s?500\s*₽/)).toBeVisible();
  109 |   });
  110 | 
  111 |   test('47.5 Кнопка «Записаться на занятие» видна и ведёт на /book', async () => {
  112 |     const cta = page.getByText('Записаться на занятие');
  113 |     await expect(cta).toBeVisible();
  114 |     await cta.click();
  115 |     await expect(page).toHaveURL(new RegExp(`/t/${slug}/book`));
  116 |   });
  117 | 
  118 |   test('47.6 Хедер «Работает на Repeto» виден', async () => {
> 119 |     await expect(page.getByText('Работает на Repeto').first()).toBeVisible();
      |                                                                ^ Error: expect(locator).toBeVisible() failed
  120 |   });
  121 | });
  122 | 
  123 | /* ═══════════════════════════════════════════════════
  124 |    Journey 48 · Бронирование — полный UI-flow
  125 |    ═══════════════════════════════════════════════════ */
  126 | test.describe('Journey 48: Бронирование — полный UI-flow', () => {
  127 |   let email: string;
  128 |   let password: string;
  129 |   let token: string;
  130 |   let slug: string;
  131 | 
  132 |   test.beforeAll(async ({ browser }) => {
  133 |     const ctx = await browser.newContext();
  134 |     const page = await ctx.newPage();
  135 |     const reg = await registerViaAPI(page, { name: 'Букинг Тьютор' });
  136 |     email = reg.email;
  137 |     password = reg.password;
  138 |     token = reg.accessToken;
  139 | 
  140 |     slug = `book-${Date.now()}`;
  141 | 
  142 |     const settingsRes = await page.request.patch(`${API}/settings/account`, {
  143 |       headers: { Authorization: `Bearer ${token}` },
  144 |       data: {
  145 |         slug,
  146 |         published: true,
  147 |         subjects: ['Английский'],
  148 |         subjectDetails: [
  149 |           { name: 'Английский', duration: 60, price: 1500 },
  150 |         ],
  151 |       },
  152 |     });
  153 |     expect(settingsRes.ok()).toBe(true);
  154 | 
  155 |     // Set availability for all 7 days to ensure we always have slots
  156 |     // dayOfWeek: 0=Mon, 1=Tue, ..., 6=Sun
  157 |     const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
  158 |     for (let d = 0; d <= 6; d++) {
  159 |       slots.push({ dayOfWeek: d, startTime: '08:00', endTime: '09:00' });
  160 |       slots.push({ dayOfWeek: d, startTime: '10:00', endTime: '11:00' });
  161 |     }
  162 |     const availRes = await page.request.put(`${API}/availability`, {
  163 |       headers: { Authorization: `Bearer ${token}` },
  164 |       data: { slots },
  165 |     });
  166 |     expect(availRes.ok()).toBe(true);
  167 | 
  168 |     await ctx.close();
  169 |   });
  170 | 
  171 |   test.afterAll(async ({ browser }) => {
  172 |     const ctx = await browser.newContext();
  173 |     const p = await ctx.newPage();
  174 |     await deleteAccount(p, token, password);
  175 |     await ctx.close();
  176 |   });
  177 | 
  178 |   test('48.1 Полный flow: предмет → дата → время → форма → успех', async ({ page }) => {
  179 |     test.slow(); // This is a multi-step flow
  180 | 
  181 |     await page.goto(`/t/${slug}/book`);
  182 |     await page.waitForLoadState('networkidle');
  183 | 
  184 |     // Step 0: Select subject
  185 |     await expect(page.getByText('Выберите предмет')).toBeVisible({ timeout: 10_000 });
  186 |     await page.locator('button.card').filter({ hasText: 'Английский' }).click();
  187 |     await page.getByRole('button', { name: 'Продолжить' }).click();
  188 | 
  189 |     // Step 1: Find an available date and select it
  190 |     // Wait for the calendar to appear
  191 |     const calendar = page.locator('.grid-cols-7, [class*="grid"]').first();
  192 |     await expect(calendar).toBeVisible({ timeout: 10_000 });
  193 | 
  194 |     // Find a day button that is NOT disabled (has font-bold, not grayed out)
  195 |     // We need to click on an available future date
  196 |     const availableDays = page.locator('button')
  197 |       .filter({ hasNotText: /Пн|Вт|Ср|Чт|Пт|Сб|Вс|Продолжить/ })
  198 |       .filter({ has: page.locator(':scope:not([disabled])') });
  199 | 
  200 |     // Try clicking on available day buttons until we find one with time slots
  201 |     let foundSlot = false;
  202 |     const dayButtons = await availableDays.all();
  203 |     for (const dayBtn of dayButtons) {
  204 |       const text = await dayBtn.textContent();
  205 |       if (!text || !/^\d{1,2}$/.test(text.trim())) continue;
  206 |       await dayBtn.click();
  207 |       // Check if time slots appeared
  208 |       const slotButtons = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });
  209 |       try {
  210 |         await expect(slotButtons.first()).toBeVisible({ timeout: 2_000 });
  211 |         foundSlot = true;
  212 |         // Click the first available time slot
  213 |         await slotButtons.first().click();
  214 |         break;
  215 |       } catch {
  216 |         // No slots for this day, try next
  217 |         continue;
  218 |       }
  219 |     }
```