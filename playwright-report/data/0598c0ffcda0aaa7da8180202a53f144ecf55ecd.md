# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payments.spec.ts >> Оплаты — создание (live update) >> создание оплаты через модал — видна без F5
- Location: e2e\payments.spec.ts:47:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard**" until "load"
============================================================
```

# Test source

```ts
  1   | import { test as base, expect, Page } from '@playwright/test';
  2   | 
  3   | const API_BASE = 'http://127.0.0.1:3200/api';
  4   | const DEMO_EMAIL = 'demo@repeto.ru';
  5   | const DEMO_PASSWORD = 'demo1234';
  6   | 
  7   | /**
  8   |  * Rewrite localhost→127.0.0.1 for API calls in the browser context.
  9   |  * Playwright Chromium on Windows resolves localhost to ::1 (IPv6),
  10  |  * but the NestJS backend only binds IPv4.
  11  |  */
  12  | async function fixLocalhostRouting(page: Page) {
  13  |   await page.route((url) => url.hostname === 'localhost' && url.port === '3200', (route) => {
  14  |     const url = route.request().url().replace('//localhost:', '//127.0.0.1:');
  15  |     route.continue({ url });
  16  |   });
  17  | }
  18  | 
  19  | /** Login via API and inject refresh cookie into browser context */
  20  | async function loginViaAPI(page: Page) {
  21  |   await fixLocalhostRouting(page);
  22  | 
  23  |   // First navigate to set up the page context
  24  |   await page.goto('/registration');
  25  |   await page.waitForLoadState('networkidle');
  26  | 
  27  |   // Use in-page fetch to login (this sets the httpOnly refresh cookie on browser)
  28  |   const success = await page.evaluate(async (creds) => {
  29  |     try {
  30  |       const resp = await fetch('http://localhost:3200/api/auth/login', {
  31  |         method: 'POST',
  32  |         headers: { 'Content-Type': 'application/json' },
  33  |         credentials: 'include',
  34  |         body: JSON.stringify({ email: creds.email, password: creds.password }),
  35  |       });
  36  |       if (!resp.ok) return false;
  37  |       const data = await resp.json();
  38  |       // Set token in the module's in-memory variable via global accessor
  39  |       (window as any).__REPETO_ACCESS_TOKEN__ = data.accessToken;
  40  |       return true;
  41  |     } catch {
  42  |       return false;
  43  |     }
  44  |   }, { email: DEMO_EMAIL, password: DEMO_PASSWORD });
  45  | 
  46  |   if (!success) {
  47  |     // Fall back to UI login
  48  |     await loginViaUI(page);
  49  |     return;
  50  |   }
  51  | 
  52  |   // Navigate to dashboard — AuthContext will use the refresh cookie
  53  |   await page.goto('/dashboard');
  54  |   await page.waitForLoadState('networkidle');
  55  |   await page.waitForTimeout(1500);
  56  | 
  57  |   // If still on registration, fall back to UI login
  58  |   if (page.url().includes('registration')) {
  59  |     await loginViaUI(page);
  60  |   }
  61  | }
  62  | 
  63  | /** Login through the UI form */
  64  | async function loginViaUI(page: Page) {
  65  |   await page.goto('/registration');
  66  |   await page.getByPlaceholder('email@example.com').fill(DEMO_EMAIL);
  67  |   await page.getByPlaceholder('Введите пароль').fill(DEMO_PASSWORD);
  68  |   await page.getByRole('button', { name: 'Войти' }).click();
> 69  |   await page.waitForURL('**/dashboard**', { timeout: 15000 });
      |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  70  | }
  71  | 
  72  | /** Extended test fixture with auth */
  73  | export const test = base.extend<{ authedPage: Page }>({
  74  |   authedPage: async ({ page }, use) => {
  75  |     await loginViaUI(page);
  76  |     await use(page);
  77  |   },
  78  | });
  79  | 
  80  | export { expect, loginViaAPI, loginViaUI, fixLocalhostRouting, API_BASE, DEMO_EMAIL, DEMO_PASSWORD };
  81  | 
  82  | /** Get access token for API calls (uses refresh cookie) */
  83  | export async function getAuthToken(page: Page): Promise<string> {
  84  |   const resp = await page.request.post('http://localhost:3200/api/auth/refresh');
  85  |   const data = await resp.json();
  86  |   return data.accessToken;
  87  | }
  88  | 
  89  | /** Wait for API response to complete */
  90  | export async function waitForAPI(page: Page, urlPattern: string | RegExp) {
  91  |   return page.waitForResponse(
  92  |     (resp) =>
  93  |       (typeof urlPattern === 'string'
  94  |         ? resp.url().includes(urlPattern)
  95  |         : urlPattern.test(resp.url())) && resp.status() < 400,
  96  |     { timeout: 10000 },
  97  |   );
  98  | }
  99  | 
  100 | /** Navigate to a page using sidebar */
  101 | export async function navigateTo(page: Page, menuItemText: string) {
  102 |   await page.getByRole('link', { name: menuItemText }).first().click();
  103 |   await page.waitForLoadState('networkidle');
  104 | }
  105 | 
  106 | /** Open the "Добавить" dropdown in header and select an option */
  107 | export async function openCreateDropdown(page: Page, itemText: string) {
  108 |   await page.getByRole('button', { name: 'Добавить' }).click();
  109 |   await page.getByRole('menuitem', { name: itemText }).or(
  110 |     page.getByText(itemText)
  111 |   ).click();
  112 | }
  113 | 
  114 | /** Utility: count rows in a table */
  115 | export async function countTableRows(page: Page, tableSelector = 'table tbody tr') {
  116 |   return page.locator(tableSelector).count();
  117 | }
  118 | 
```