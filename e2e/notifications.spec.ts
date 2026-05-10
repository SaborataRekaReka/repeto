/**
 * NOTIFICATIONS E2E TESTS
 * Tests: list, tabs, mark as read, mark all read
 */
import { test, expect } from './helpers/auth';
import { getAuthToken, API_BASE } from './helpers/auth';

async function getAuthHeaders(page: any) {
  const token = await getAuthToken(page);
  return { Authorization: `Bearer ${token}` };
}

test.describe('Уведомления', () => {
  test('страница загружается с табами', async ({ authedPage: page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const pageMain = page.locator('main');

    // Табы
    const tabNames = ['Все', 'Непрочитанные', 'Оплаты', 'Расписание'];
    for (const name of tabNames) {
      await expect(pageMain.getByRole('tab', { name }).first()).toBeVisible();
    }
  });

  test('переключение табов работает', async ({ authedPage: page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const pageMain = page.locator('main');

    // Непрочитанные
    await pageMain.getByRole('tab', { name: 'Непрочитанные' }).first().click();
    await page.waitForTimeout(500);

    // Оплаты
    await pageMain.getByRole('tab', { name: 'Оплаты' }).first().click();
    await page.waitForTimeout(500);

    // Расписание
    await pageMain.getByRole('tab', { name: 'Расписание' }).first().click();
    await page.waitForTimeout(500);

    // Все
    await pageMain.getByRole('tab', { name: 'Все' }).first().click();
    await page.waitForTimeout(500);
  });

  test('пустой state отображается корректно', async ({ authedPage: page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const headers = await getAuthHeaders(page);
    const listResp = await page.request.get(`${API_BASE}/notifications?limit=1`, { headers });
    expect(listResp.ok()).toBeTruthy();
    const payload = await listResp.json().catch(() => ({ data: [] }));
    const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

    if (items.length === 0) {
      await expect(page.getByText('Нет уведомлений').first()).toBeVisible();
    } else {
      await expect(page.getByText('Нет уведомлений').first()).toBeHidden();
    }
  });

  test('кнопка "Прочитать все" видна при непрочитанных', async ({ authedPage: page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const headers = await getAuthHeaders(page);
    const unreadResp = await page.request.get(`${API_BASE}/notifications?read=false&limit=1`, { headers });
    expect(unreadResp.ok()).toBeTruthy();
    const unreadPayload = await unreadResp.json().catch(() => ({ data: [] }));
    const unreadItems = Array.isArray(unreadPayload?.data)
      ? unreadPayload.data
      : Array.isArray(unreadPayload)
        ? unreadPayload
        : [];

    const markAllButton = page.getByRole('button', { name: /Прочитать все/i }).first();
    if (unreadItems.length > 0) {
      await expect(markAllButton).toBeVisible();
    } else {
      await expect(markAllButton).toHaveCount(0);
    }
  });

  test('клик по уведомлению помечает как прочитанное', async ({ authedPage: page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const headers = await getAuthHeaders(page);
    const unreadResp = await page.request.get(`${API_BASE}/notifications?read=false&limit=1`, { headers });
    expect(unreadResp.ok()).toBeTruthy();
    const unreadPayload = await unreadResp.json().catch(() => ({ data: [] }));
    const unreadItems = Array.isArray(unreadPayload?.data)
      ? unreadPayload.data
      : Array.isArray(unreadPayload)
        ? unreadPayload
        : [];

    if (unreadItems.length === 0) return;

    const target = unreadItems[0];
    await page.getByRole('tab', { name: 'Непрочитанные' }).first().click();
    await page.locator('main').getByText(String(target.title)).first().click();

    await expect
      .poll(async () => {
        const pollResp = await page.request.get(`${API_BASE}/notifications?read=false&limit=50`, { headers });
        if (!pollResp.ok()) return true;
        const pollPayload = await pollResp.json().catch(() => ({ data: [] }));
        const pollItems = Array.isArray(pollPayload?.data)
          ? pollPayload.data
          : Array.isArray(pollPayload)
            ? pollPayload
            : [];
        return pollItems.some((n: any) => n.id === target.id);
      })
      .toBeFalsy();
  });
});
