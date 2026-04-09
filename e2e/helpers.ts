import { type Page, expect } from '@playwright/test';

const API = 'http://127.0.0.1:3200/api';

/** Unique email for each test run to avoid collisions. */
export function uniqueEmail() {
  return `pw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.com`;
}

/** Register a new user via API and inject auth into page context. */
export async function registerViaAPI(page: Page, overrides?: { email?: string; password?: string; name?: string }) {
  const email = overrides?.email ?? uniqueEmail();
  const password = overrides?.password ?? 'TestPass123!';
  const name = overrides?.name ?? 'Тест Playwright';

  const res = await page.request.post(`${API}/auth/register`, {
    data: { email, password, name },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json();

  // Store tokens for further API use
  return {
    accessToken: body.accessToken as string,
    user: body.user,
    email,
    password,
  };
}

/** Log in via API, return tokens. */
export async function loginViaAPI(page: Page, email: string, password: string) {
  const res = await page.request.post(`${API}/auth/login`, {
    data: { email, password },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return { accessToken: body.accessToken as string, user: body.user };
}

/** Navigate to a page with injected auth (sets cookie + localStorage). */
export async function loginAndGoto(page: Page, path: string, email: string, password: string) {
  // Login via the UI
  await page.goto('/registration');
  await page.getByPlaceholder('Введите email или телефон').fill(email);
  await page.getByPlaceholder('Введите пароль').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
  if (path !== '/dashboard') {
    await page.goto(path);
  }
}

/** Create a student via API. */
export async function createStudentAPI(page: Page, token: string, data?: Record<string, any>) {
  const res = await page.request.post(`${API}/students`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: 'PW Ученик',
      subject: 'Математика',
      rate: 2000,
      ...data,
    },
  });
  expect(res.ok()).toBe(true);
  return res.json();
}

/** Create a lesson via API. */
export async function createLessonAPI(page: Page, token: string, studentId: string, data?: Record<string, any>) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const res = await page.request.post(`${API}/lessons`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      studentId,
      subject: 'Математика',
      scheduledAt: tomorrow.toISOString(),
      duration: 60,
      rate: 2000,
      format: 'ONLINE',
      ...data,
    },
  });
  expect(res.ok()).toBe(true);
  return res.json();
}

/** Clean up test user via delete account API. */
export async function deleteAccount(page: Page, token: string, password: string) {
  await page.request.delete(`${API}/settings/account`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { password },
  });
}
