# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-booking.spec.ts >> Journey 49: Публичная страница — edge cases >> 49.3 Без availability → кнопка «Запись пока не ведется»
- Location: e2e\journeys-tier2-booking.spec.ts:331:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Запись пока не ведется')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Запись пока не ведется')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - text: Работает на платформе
      - link "Repeto" [ref=e5] [cursor=pointer]:
        - /url: /
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e8]: БС
        - generic [ref=e9]: Без Слотов
        - generic [ref=e10]: Предметы пока не указаны
        - generic [ref=e12]: Отзывов пока нет
      - generic [ref=e13]:
        - generic [ref=e14]: О репетиторе
        - generic [ref=e15]: Репетитор пока не добавил описание
      - generic [ref=e16]:
        - generic [ref=e17]: Предметы
        - generic [ref=e18]: Репетитор пока не добавил ни одного предмета
      - generic [ref=e19]:
        - generic [ref=e20]: Контакты
        - generic [ref=e21]: Контактные данные пока не указаны
      - button "Запись пока не ведётся" [disabled]:
        - generic: Запись пока не ведётся
      - generic [ref=e23]:
        - text: Работает на платформе
        - link "Repeto" [ref=e24] [cursor=pointer]:
          - /url: /
  - alert [ref=e25]: /t/noslots-1775928505558
```

# Test source

```ts
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
  256 |     await page.locator('button.card').filter({ hasText: 'Английский' }).click();
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
> 346 |     await expect(page.getByText('Запись пока не ведется')).toBeVisible();
      |                                                            ^ Error: expect(locator).toBeVisible() failed
  347 | 
  348 |     await deleteAccount(page, reg.accessToken, reg.password);
  349 |     await ctx.close();
  350 |   });
  351 | });
  352 | 
```