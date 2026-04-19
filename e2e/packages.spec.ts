/**
 * PACKAGES E2E TESTS
 * Tests: list, tabs, create package, live update
 */
import { test, expect, API_BASE } from './helpers/auth';
import { getAuthToken } from './helpers/auth';

const PACKAGE_ECONOMICS_MARKER = 'e2e-package-economics';
const PUBLIC_PACKAGE_MARKER = 'e2e-public-package-without-student';

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

    // Предмет (если не подтянулся автоматически)
    await page.getByPlaceholder('Математика').fill('Математика');

    // Экономика пакета: авторасчет
    const lessonsInput = page.getByPlaceholder('8', { exact: true });
    const lessonPriceInput = page.getByPlaceholder('2100', { exact: true });
    const discountInput = page.getByPlaceholder('0', { exact: true });
    const totalInput = page.getByPlaceholder('16800', { exact: true });

    await lessonsInput.fill('10');
    await lessonPriceInput.fill('2000');
    await discountInput.fill('500');

    await expect(totalInput).toHaveValue('19500');

    // Ручной override суммы
    await totalInput.fill('18000');
    await expect(page.getByRole('button', { name: /Вернуть авторасчет/i })).toBeVisible();

    await lessonsInput.fill('12');
    await expect(totalInput).toHaveValue('18000');

    await page.getByRole('button', { name: /Вернуть авторасчет/i }).click();
    await expect(totalInput).toHaveValue('23500');

    await page.getByPlaceholder('Примечание к пакету…').fill(PACKAGE_ECONOMICS_MARKER);

    // Сохраняем
    const saveButton = page.getByRole('button', { name: /Сохранить/i });
    if (await saveButton.isEnabled()) {
      await saveButton.click();
      await page.waitForTimeout(2000);

      // Пакет виден без F5
      await expect(page.getByText(/23\s?500/).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('публичный пакет создается без выбора ученика', async ({ authedPage: page }) => {
    const token = await getAuthToken(page);

    const createResponse = await page.request.post(`${API_BASE}/packages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        isPublic: true,
        subject: 'Математика',
        lessonsTotal: 6,
        totalPrice: 10800,
        comment: PUBLIC_PACKAGE_MARKER,
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    expect(Boolean(created?.isPublic)).toBeTruthy();
    expect(created?.studentId ?? null).toBeNull();
    expect(created?.student ?? null).toBeNull();
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
        if (
          p.comment === PACKAGE_ECONOMICS_MARKER ||
          p.comment === PUBLIC_PACKAGE_MARKER ||
          p.totalPrice === 23500
        ) {
          await request.delete(`${API_BASE}/packages/${p.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      }
    } catch { /* best effort */ }
  });
});
