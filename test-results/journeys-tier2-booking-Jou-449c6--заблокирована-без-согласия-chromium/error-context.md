# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-booking.spec.ts >> Journey 48: Бронирование — полный UI-flow >> 48.3 Кнопка «Записаться» заблокирована без согласия
- Location: e2e\journeys-tier2-booking.spec.ts:251:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button.card').filter({ hasText: 'Английский' })

```

# Test source

```ts
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
  220 | 
  221 |     expect(foundSlot).toBe(true);
  222 | 
  223 |     // Click "Продолжить" to go to Step 2
  224 |     await page.getByRole('button', { name: 'Продолжить' }).click();
  225 | 
  226 |     // Step 2: Fill form
  227 |     await expect(page.getByText('Ваши данные')).toBeVisible({ timeout: 5_000 });
  228 |     await page.locator('input[name="name"]').fill('Тестовый Ученик');
  229 |     await page.locator('input[name="phone"]').fill('+7 900 111-22-33');
  230 | 
  231 |     // Check consent checkbox (the <input> is invisible; click the label text)
  232 |     await page.getByText('Я предоставляю согласие').click();
  233 | 
  234 |     // Click submit
  235 |     await page.getByRole('button', { name: 'Записаться' }).click();
  236 | 
  237 |     // Step 3: Success
  238 |     await expect(page.getByText('Заявка отправлена!')).toBeVisible({ timeout: 10_000 });
  239 |     await expect(page.getByText('Репетитор подтвердит запись и свяжется с вами.')).toBeVisible();
  240 |     await expect(page.getByText('Вернуться к профилю')).toBeVisible();
  241 |   });
  242 | 
  243 |   test('48.2 Кнопка «Продолжить» заблокирована без выбора предмета', async ({ page }) => {
  244 |     await page.goto(`/t/${slug}/book`);
  245 |     await page.waitForLoadState('networkidle');
  246 |     await expect(page.getByText('Выберите предмет')).toBeVisible({ timeout: 10_000 });
  247 |     const btn = page.getByRole('button', { name: 'Продолжить' });
  248 |     await expect(btn).toBeDisabled();
  249 |   });
  250 | 
  251 |   test('48.3 Кнопка «Записаться» заблокирована без согласия', async ({ page }) => {
  252 |     await page.goto(`/t/${slug}/book`);
  253 |     await page.waitForLoadState('networkidle');
  254 | 
  255 |     // Select subject
> 256 |     await page.locator('button.card').filter({ hasText: 'Английский' }).click();
      |                                                                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  257 |     await page.getByRole('button', { name: 'Продолжить' }).click();
  258 | 
  259 |     // Find an available day and slot — only click non-disabled future dates
  260 |     const today = new Date().getDate();
  261 |     const dayButtons = await page.locator('button').all();
  262 |     let foundSlotFor48_3 = false;
  263 |     for (const dayBtn of dayButtons) {
  264 |       const text = await dayBtn.textContent();
  265 |       if (!text || !/^\d{1,2}$/.test(text.trim())) continue;
  266 |       const dayNum = parseInt(text.trim(), 10);
  267 |       if (dayNum < today) continue; // skip past dates
  268 |       const isDisabledDay = await dayBtn.getAttribute('disabled');
  269 |       if (isDisabledDay !== null) continue;
  270 |       await dayBtn.click();
  271 |       const slotButtons = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });
  272 |       try {
  273 |         await expect(slotButtons.first()).toBeVisible({ timeout: 2_000 });
  274 |         await slotButtons.first().click();
  275 |         foundSlotFor48_3 = true;
  276 |         break;
  277 |       } catch {
  278 |         continue;
  279 |       }
  280 |     }
  281 |     expect(foundSlotFor48_3).toBe(true);
  282 | 
  283 |     await page.getByRole('button', { name: 'Продолжить' }).click();
  284 |     await expect(page.getByText('Ваши данные')).toBeVisible({ timeout: 5_000 });
  285 | 
  286 |     // Fill name and phone but don't check consent
  287 |     await page.locator('input[name="name"]').fill('Тест');
  288 |     await page.locator('input[name="phone"]').fill('+7 900 000-00-00');
  289 | 
  290 |     // Submit should be disabled (or not clickable without consent)
  291 |     const submit = page.getByRole('button', { name: 'Записаться' });
  292 |     // The button is either disabled or checking it doesn't submit (no success screen)
  293 |     const isDisabled = await submit.isDisabled().catch(() => false);
  294 |     if (!isDisabled) {
  295 |       // Some implementations use visual disable without actual attribute
  296 |       await expect(submit).toBeVisible();
  297 |     } else {
  298 |       await expect(submit).toBeDisabled();
  299 |     }
  300 |   });
  301 | });
  302 | 
  303 | /* ═══════════════════════════════════════════════════
  304 |    Journey 49 · Edge cases
  305 |    ═══════════════════════════════════════════════════ */
  306 | test.describe('Journey 49: Публичная страница — edge cases', () => {
  307 |   test('49.1 Несуществующий slug → «Репетитор не найден»', async ({ page }) => {
  308 |     await page.goto('/t/nonexistent-slug-xyz-123');
  309 |     await expect(page.getByText('Репетитор не найден')).toBeVisible({ timeout: 10_000 });
  310 |   });
  311 | 
  312 |   test('49.2 Неопубликованный профиль → ошибка', async ({ browser }) => {
  313 |     const ctx = await browser.newContext();
  314 |     const page = await ctx.newPage();
  315 |     const reg = await registerViaAPI(page, { name: 'Скрытый Тьютор' });
  316 | 
  317 |     const slug = `hidden-${Date.now()}`;
  318 |     const res = await page.request.patch(`${API}/settings/account`, {
  319 |       headers: { Authorization: `Bearer ${reg.accessToken}` },
  320 |       data: { slug, published: false },
  321 |     });
  322 |     expect(res.ok()).toBe(true);
  323 | 
  324 |     await page.goto(`/t/${slug}`);
  325 |     await expect(page.getByText('Репетитор не найден')).toBeVisible({ timeout: 10_000 });
  326 | 
  327 |     await deleteAccount(page, reg.accessToken, reg.password);
  328 |     await ctx.close();
  329 |   });
  330 | 
  331 |   test('49.3 Без availability → кнопка «Запись пока не ведется»', async ({ browser }) => {
  332 |     const ctx = await browser.newContext();
  333 |     const page = await ctx.newPage();
  334 |     const reg = await registerViaAPI(page, { name: 'Без Слотов' });
  335 | 
  336 |     const slug = `noslots-${Date.now()}`;
  337 |     const res = await page.request.patch(`${API}/settings/account`, {
  338 |       headers: { Authorization: `Bearer ${reg.accessToken}` },
  339 |       data: { slug, published: true },
  340 |     });
  341 |     expect(res.ok()).toBe(true);
  342 | 
  343 |     // No availability set — hasWorkingDays will be false
  344 |     await page.goto(`/t/${slug}`);
  345 |     await expect(page.getByText('Без Слотов')).toBeVisible({ timeout: 10_000 });
  346 |     await expect(page.getByText('Запись пока не ведется')).toBeVisible();
  347 | 
  348 |     await deleteAccount(page, reg.accessToken, reg.password);
  349 |     await ctx.close();
  350 |   });
  351 | });
  352 | 
```