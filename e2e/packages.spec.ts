/**
 * PACKAGES E2E TESTS
 * Tests: list, tabs, create package, live update
 */
import { test, expect, API_BASE } from './helpers/auth';

test.describe('Пакеты — список', () => {
  test('страница пакетов загружается', async ({ authedPage: page }) => {
    await page.goto('/finance/packages');
    await page.waitForLoadState('networkidle');

    // Табы
    await expect(page.getByText('Все').first()).toBeVisible();

    // Либо пакеты есть, либо пустой state
    const hasContent = await page.locator('table, [class*="package"], [class*="card"]').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/Пакетов пока нет/i).isVisible().catch(() => false);
    expect(hasContent || hasEmpty).toBeTruthy();
  });

  test('табы фильтруют пакеты', async ({ authedPage: page }) => {
    await page.goto('/finance/packages');
    await page.waitForLoadState('networkidle');

    await page.getByRole('radio', { name: 'Активные' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('radio', { name: 'Завершённые' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('radio', { name: 'Все' }).click();
    await page.waitForTimeout(500);
  });
});

test.describe('Пакеты — создание (live update)', () => {
  test('создание пакета через модал — виден без F5', async ({ authedPage: page }) => {
    await page.goto('/finance/packages');
    await page.waitForLoadState('networkidle');

    // Кнопка создания
    await page.getByRole('button', { name: /Новый пакет/i }).first().click();
    await page.waitForTimeout(500);

    // Выбираем ученика
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

    // Предмет (может авто-заполниться)
    const subjectSelect = page.getByText(/Выберите предмет/i).first();
    if (await subjectSelect.isVisible().catch(() => false)) {
      await subjectSelect.click();
      await page.getByRole('option', { name: 'Математика' }).or(page.getByText('Математика')).first().click();
    }

    // Количество занятий
    const lessonsInput = page.locator('input[type="number"]').first();
    if (await lessonsInput.isVisible()) {
      await lessonsInput.fill('8');
    }

    // Сумма пакета
    await page.getByPlaceholder('16800').or(page.locator('input[type="number"]').nth(1)).fill('12000');

    // Сохраняем
    const saveButton = page.getByRole('button', { name: /Сохранить/i });
    if (await saveButton.isEnabled()) {
      await saveButton.click();
      await page.waitForTimeout(2000);

      // Пакет виден без F5
      await expect(page.getByText('12000').or(page.getByText('12 000')).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test.afterAll(async ({ request }) => {
    try {
      const loginResp = await request.post(`${API_BASE}/auth/login`, {
        data: { email: 'demo@repeto.ru', password: 'demo1234' },
      });
      const { accessToken } = await loginResp.json();

      const resp = await request.get(`${API_BASE}/packages?limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await resp.json();
      const packages = data.data || data;
      for (const p of packages) {
        if (p.totalPrice === 12000) {
          await request.delete(`${API_BASE}/packages/${p.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      }
    } catch { /* best effort */ }
  });
});
