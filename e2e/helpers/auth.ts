import { test as base, expect, Page } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:3200/api';
const DEMO_EMAIL =
  String(process.env.E2E_TUTOR_EMAIL || process.env.E2E_EMAIL || 'demo@repeto.ru').trim() ||
  'demo@repeto.ru';
const DEMO_PASSWORD =
  String(process.env.E2E_TUTOR_PASSWORD || process.env.E2E_PASSWORD || 'demo1234').trim() ||
  'demo1234';
let cachedAuthCookies: any[] | null = null;

async function hasActiveSession(page: Page): Promise<boolean> {
  try {
    const refreshResp = await page.request.post('/api/auth/refresh', {
      timeout: 5000,
    });
    if (!refreshResp.ok()) return false;
    const payload = await refreshResp.json().catch(() => null);
    return Boolean(payload?.accessToken);
  } catch {
    return false;
  }
}

async function hydrateCachedSession(page: Page): Promise<boolean> {
  if (!cachedAuthCookies || cachedAuthCookies.length === 0) {
    return false;
  }

  try {
    await page.context().addCookies(cachedAuthCookies);
    return hasActiveSession(page);
  } catch {
    return false;
  }
}

async function rememberSession(page: Page) {
  try {
    cachedAuthCookies = await page.context().cookies();
  } catch {
    // ignore cookie read issues
  }
}

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
async function loginViaAPI(page: Page): Promise<boolean> {
  try {
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      timeout: 7000,
    });

    if (loginResp.ok()) {
      return true;
    }
  } catch {
    // Fallback in fixture.
  }
  return false;
}

/** Login through the UI form */
async function loginViaUI(page: Page) {
  await page.goto('/registration', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  const signInForm = page.locator('form').filter({
    has: page.getByPlaceholder('Введите пароль'),
  }).first();

  await expect(signInForm).toBeVisible({ timeout: 10000 });
  await signInForm.getByPlaceholder('email@example.com').fill(DEMO_EMAIL);
  await signInForm.getByPlaceholder('Введите пароль').fill(DEMO_PASSWORD);
  await signInForm.getByRole('button', { name: 'Войти' }).click();

  await Promise.race([
    page.waitForURL((url) => !url.pathname.includes('/registration'), {
      timeout: 15000,
    }),
    page.getByRole('link', { name: 'Дашборд' }).first().waitFor({
      state: 'visible',
      timeout: 15000,
    }),
  ]);
}

/** Extended test fixture with auth */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    let alreadyAuthed = await hydrateCachedSession(page);

    if (!alreadyAuthed) {
      alreadyAuthed = await hasActiveSession(page);
    }

    if (!alreadyAuthed) {
      const loggedInViaApi = await loginViaAPI(page);
      if (!loggedInViaApi) {
        await loginViaUI(page);
      }

      await rememberSession(page);
    }

    await use(page);

    if (await hasActiveSession(page)) {
      await rememberSession(page);
    }
  },
});

export { expect, loginViaAPI, loginViaUI, fixLocalhostRouting, API_BASE, DEMO_EMAIL, DEMO_PASSWORD };

/** Get access token for API calls (uses refresh cookie) */
export async function getAuthToken(page: Page): Promise<string> {
  const resp = await page.request.post('/api/auth/refresh');
  if (!resp.ok()) {
    throw new Error(`Unable to refresh auth token: ${resp.status()} ${resp.statusText()}`);
  }
  const data = await resp.json();
  if (!data?.accessToken) {
    throw new Error('Refresh response does not contain accessToken');
  }
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
