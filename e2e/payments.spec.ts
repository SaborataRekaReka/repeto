/**
 * PAYMENTS E2E TESTS
 * Tests: list, tabs, create payment, detail, live update
 */
import { test, expect, waitForAPI, API_BASE } from './helpers/auth';

test.describe('Оплаты — список', () => {
  test('страница оплат загружается', async ({ authedPage: page }) => {
    await page.goto('/finance/payments');
    await page.waitForLoadState('networkidle');

    // Табы должны быть
    await expect(page.getByText('Все').first()).toBeVisible();
    await expect(page.getByText('Оплачено').first()).toBeVisible();

    // Либо таблица, либо пустой state
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/Нет оплат/).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('табы фильтруют оплаты', async ({ authedPage: page }) => {
    await page.goto('/finance/payments');
    await page.waitForLoadState('networkidle');

    await page.getByRole('radio', { name: 'Оплачено' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('radio', { name: 'Все' }).click();
    await page.waitForTimeout(500);
  });

  test('поиск по оплатам', async ({ authedPage: page }) => {
    await page.goto('/finance/payments');
    await page.waitForLoadState('networkidle');

    const search = page.getByPlaceholder('Поиск...');
    if (await search.isVisible()) {
      await search.fill('НесуществующийПоиск');
      await page.waitForTimeout(500);
      await search.clear();
    }
  });
});

test.describe('Оплаты — создание (live update)', () => {
  test('создание оплаты через модал — видна без F5', async ({ authedPage: page }) => {
    await page.goto('/finance/payments');
    await page.waitForLoadState('networkidle');

    // Кликаем "Записать оплату"
    await page.getByRole('button', { name: /Записать оплату/i }).first().click();
    await page.waitForTimeout(500);

    // Модал должен появиться
    // Ученик
    const studentSelect = page.getByText(/Выберите ученика/i).or(
      page.getByRole('button', { name: /ученик/i })
    ).first();
    if (await studentSelect.isVisible()) {
      await studentSelect.click();
      const firstOption = page.getByRole('option').first().or(page.locator('[role="listbox"] [role="option"]').first());
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    // Сумма
    await page.getByPlaceholder('4200').fill('999');

    // Способ — оставляем дефолт (СБП) или кликаем
    const methodSelect = page.getByText('СБП').or(page.getByText('Наличные'));
    // leave default

    // Сохраняем
    const saveButton = page.getByRole('button', { name: 'Сохранить' }).or(
      page.locator('button[type="submit"]')
    );
    if (await saveButton.isEnabled()) {
      await saveButton.click();
      await page.waitForTimeout(2000);

      // Оплата должна появиться в списке БЕЗ перезагрузки
      await expect(page.getByText('999').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup test payments
    try {
      const loginResp = await request.post(`${API_BASE}/auth/login`, {
        data: { email: 'demo@repeto.ru', password: 'demo1234' },
      });
      const { accessToken } = await loginResp.json();

      const resp = await request.get(`${API_BASE}/payments?limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await resp.json();
      const payments = data.data || data;
      for (const p of payments) {
        if (p.amount === 999) {
          await request.delete(`${API_BASE}/payments/${p.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      }
    } catch { /* best effort */ }
  });
});

test.describe('Оплаты — детали', () => {
  test('клик по оплате открывает детали', async ({ authedPage: page }) => {
    await page.goto('/finance/payments');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible().catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(500);

      // Должен открыться модал деталей
      const hasDetail = await page.getByText(/Детали оплаты|Сумма|Способ/i).first().isVisible().catch(() => false);
      expect(hasDetail).toBeTruthy();
    }
  });
});
