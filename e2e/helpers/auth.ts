import { test as base, expect, Page } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:3200/api';
const DEMO_EMAIL = 'demo@repeto.ru';
const DEMO_PASSWORD = 'demo1234';

/**
 * Rewrite localhost→127.0.0.1 for API calls in the browser context.
 * Playwright Chromium on Windows resolves localhost to ::1 (IPv6),
 * but the NestJS backend only binds IPv4.
 */
async function fixLocalhostRouting(page: Page) {
  await page.route((url) => url.hostname === 'localhost' && url.port === '3200', (route) => {
    const url = route.request().url().replace('//localhost:', '//127.0.0.1:');
    route.continue({ url });
  });
}

/** Login via API and inject refresh cookie into browser context */
async function loginViaAPI(page: Page) {
  await fixLocalhostRouting(page);

  // First navigate to set up the page context
  await page.goto('/registration');
  await page.waitForLoadState('networkidle');

  // Use in-page fetch to login (this sets the httpOnly refresh cookie on browser)
  const success = await page.evaluate(async (creds) => {
    try {
      const resp = await fetch('http://localhost:3200/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: creds.email, password: creds.password }),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      // Set token in the module's in-memory variable via global accessor
      (window as any).__REPETO_ACCESS_TOKEN__ = data.accessToken;
      return true;
    } catch {
      return false;
    }
  }, { email: DEMO_EMAIL, password: DEMO_PASSWORD });

  if (!success) {
    // Fall back to UI login
    await loginViaUI(page);
    return;
  }

  // Navigate to dashboard — AuthContext will use the refresh cookie
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // If still on registration, fall back to UI login
  if (page.url().includes('registration')) {
    await loginViaUI(page);
  }
}

/** Login through the UI form */
async function loginViaUI(page: Page) {
  await page.goto('/registration');
  await page.getByPlaceholder('email@example.com').fill(DEMO_EMAIL);
  await page.getByPlaceholder('Введите пароль').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

/** Extended test fixture with auth */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await loginViaUI(page);
    await use(page);
  },
});

export { expect, loginViaAPI, loginViaUI, fixLocalhostRouting, API_BASE, DEMO_EMAIL, DEMO_PASSWORD };

/** Get access token for API calls (uses refresh cookie) */
export async function getAuthToken(page: Page): Promise<string> {
  const resp = await page.request.post('http://localhost:3200/api/auth/refresh');
  const data = await resp.json();
  return data.accessToken;
}

/** Wait for API response to complete */
export async function waitForAPI(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (resp) =>
      (typeof urlPattern === 'string'
        ? resp.url().includes(urlPattern)
        : urlPattern.test(resp.url())) && resp.status() < 400,
    { timeout: 10000 },
  );
}

/** Navigate to a page using sidebar */
export async function navigateTo(page: Page, menuItemText: string) {
  await page.getByRole('link', { name: menuItemText }).first().click();
  await page.waitForLoadState('networkidle');
}

/** Open the "Добавить" dropdown in header and select an option */
export async function openCreateDropdown(page: Page, itemText: string) {
  await page.getByRole('button', { name: 'Добавить' }).click();
  await page.getByRole('menuitem', { name: itemText }).or(
    page.getByText(itemText)
  ).click();
}

/** Utility: count rows in a table */
export async function countTableRows(page: Page, tableSelector = 'table tbody tr') {
  return page.locator(tableSelector).count();
}
