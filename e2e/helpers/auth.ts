import { test as base, expect, Page } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:3200/api';
const DEMO_EMAIL =
  String(process.env.E2E_TUTOR_EMAIL || process.env.E2E_EMAIL || 'demo@repeto.ru').trim() ||
  'demo@repeto.ru';
const DEMO_PASSWORD =
  String(process.env.E2E_TUTOR_PASSWORD || process.env.E2E_PASSWORD || 'demo1234').trim() ||
  'demo1234';
let cachedAuthCookies: any[] | null = null;

function parseRetryAfterMs(headers: Record<string, string>, attempt: number): number {
  const retryAfterRaw = headers['retry-after'];
  const retryAfterSeconds = Number.parseFloat(retryAfterRaw || '');
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.max(1200, Math.ceil(retryAfterSeconds * 1000));
  }

  return Math.min(20_000, 1_500 * (attempt + 1));
}

async function isLoginScreen(page: Page): Promise<boolean> {
  if (/\/(auth|registration)(?:\?|#|$)/.test(page.url())) {
    return true;
  }

  const hasEmail = await page.getByPlaceholder('email@example.com').first().isVisible().catch(() => false);
  const hasPassword = await page.getByPlaceholder('Введите пароль').first().isVisible().catch(() => false);
  if (hasEmail && hasPassword) {
    return true;
  }

  return page
    .getByRole('heading', { name: /Вход в Repeto/i })
    .first()
    .isVisible()
    .catch(() => false);
}

async function hasActiveSession(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const refreshResp = await page.request.post('/api/auth/refresh', {
        timeout: 5000,
      });
      if (refreshResp.ok()) {
        const payload = await refreshResp.json().catch(() => null);
        const accessToken = String(payload?.accessToken || '').trim();
        if (!accessToken) {
          return false;
        }

        const meResp = await page.request.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 5000,
        });

        if (!meResp.ok()) {
          return false;
        }

        const mePayload = await meResp.json().catch(() => null);
        const meEmail = String(mePayload?.email || '').trim().toLowerCase();
        return meEmail.length > 0 && meEmail === DEMO_EMAIL.toLowerCase();
      }

      if (refreshResp.status() === 429) {
        const delayMs = parseRetryAfterMs(refreshResp.headers(), attempt);
        await page.waitForTimeout(delayMs);
        continue;
      }

      return false;
    } catch {
      if (attempt < 3) {
        await page.waitForTimeout(250 * (attempt + 1));
        continue;
      }
      return false;
    }
  }

  return false;
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

async function acceptCookieBanner(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('repeto:cookie-consent-v1', 'accepted');
    } catch {
      // no-op: storage may be unavailable in special contexts
    }
  });
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
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const loginResp = await page.request.post('/api/auth/login', {
        data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
        timeout: 7000,
      });

      if (loginResp.ok()) {
        return true;
      }

      if (loginResp.status() === 429) {
        const delayMs = parseRetryAfterMs(loginResp.headers(), attempt);
        await page.waitForTimeout(delayMs);
        continue;
      }
    } catch {
      if (attempt < 5) {
        await page.waitForTimeout(300 * (attempt + 1));
        continue;
      }
      return false;
    }

    // Fallback in fixture.
    return false;
  }

  return false;
}

/** Login through the UI form */
async function loginViaUI(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
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
      page.getByRole('link', { name: 'Ученики' }).first().waitFor({
        state: 'visible',
        timeout: 15000,
      }),
    ]).catch(() => null);

    if (!(await isLoginScreen(page))) {
      return;
    }

    await page.waitForTimeout(600 * (attempt + 1));
  }

  throw new Error('UI login did not leave auth screen after retries');
}

/** Extended test fixture with auth */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await acceptCookieBanner(page);

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

    // Guard against stale/missing UI auth state: ensure protected route is reachable.
    try {
      await page.goto('/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      if (await isLoginScreen(page)) {
        await loginViaUI(page);
        await page.goto('/dashboard', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
      }
    } catch {
      await loginViaUI(page);
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
  let lastStatus = -1;
  let reloginDone = false;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const resp = await page.request.post('/api/auth/refresh');
    lastStatus = resp.status();

    if (resp.ok()) {
      const data = await resp.json();
      if (!data?.accessToken) {
        throw new Error('Refresh response does not contain accessToken');
      }
      return data.accessToken;
    }

    if (resp.status() === 429) {
      const delayMs = parseRetryAfterMs(resp.headers(), attempt);
      await page.waitForTimeout(delayMs);
      continue;
    }

    if (resp.status() === 401 || resp.status() === 403) {
      if (!reloginDone && attempt >= 2) {
        const relogged = await loginViaAPI(page);
        if (!relogged) {
          await loginViaUI(page).catch(() => null);
        }
        reloginDone = true;
      }
      await page.waitForTimeout(250 * (attempt + 1));
      continue;
    }

    throw new Error(`Unable to refresh auth token: ${resp.status()} ${resp.statusText()}`);
  }

  throw new Error(`Unable to refresh auth token after retries: ${lastStatus}`);
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
