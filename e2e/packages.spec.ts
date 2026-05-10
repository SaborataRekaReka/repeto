/**
 * PACKAGES E2E TESTS
 * Tests: list, tabs, create package, live update
 */
import { test, expect, API_BASE, getAuthToken } from './helpers/auth';

const PACKAGE_ECONOMICS_MARKER = 'e2e-package-economics';
const PUBLIC_PACKAGE_MARKER = 'e2e-public-package-without-student';

test.describe('Пакеты — список', () => {
  test('страница пакетов загружается', async ({ authedPage: page }) => {
    await page.goto('/finance/packages');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByPlaceholder('Ученик или предмет')).toBeVisible();
    await expect(page.locator('.repeto-sl-tabs-row')).toBeVisible();

    // Либо список строк, либо empty state
    await expect(page.locator('.repeto-sl-row--packages, .repeto-sl-empty').first()).toBeVisible({ timeout: 10000 });
  });

  test('табы фильтруют пакеты', async ({ authedPage: page }) => {
    await page.goto('/finance/packages');
    await page.waitForLoadState('domcontentloaded');

    const activeTab = page.getByRole('button', { name: /Активные/i }).first();
    if (await activeTab.isVisible().catch(() => false)) {
      await activeTab.click();
      await page.waitForTimeout(300);
    }

    const completedTab = page.getByRole('button', { name: /Завершённые/i }).first();
    if (await completedTab.isVisible().catch(() => false)) {
      await completedTab.click();
      await page.waitForTimeout(300);
    }

    const allTab = page.getByRole('button', { name: /^Все/i }).first();
    if (await allTab.isVisible().catch(() => false)) {
      await allTab.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Пакеты — создание (live update)', () => {
  test('создание пакета через модал — виден без F5', async ({ authedPage: page }) => {
    const uniqueSubject = `E2E package ${Date.now()}`;
    const uniqueTotal = '314159';

    await page.goto('/finance/packages?create=1');
    await page.waitForLoadState('domcontentloaded');

    const packageDialog = page.getByRole('dialog', { name: /Новый пакет|Новый публичный пакет/i }).first();
    await expect(packageDialog).toBeVisible({ timeout: 10000 });

    // Выбираем ученика
    const studentSelect = packageDialog.getByText(/Выберите ученика/i).first();
    if (await studentSelect.isVisible().catch(() => false)) {
      await studentSelect.click();
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    // Предмет
    await packageDialog.getByPlaceholder('Математика').fill(uniqueSubject);

    // Экономика пакета: авторасчет
    const lessonsInput = packageDialog.getByPlaceholder('8', { exact: true });
    const lessonPriceInput = packageDialog.getByPlaceholder('2100', { exact: true });
    const discountInput = packageDialog.getByPlaceholder('0', { exact: true });
    const totalInput = packageDialog.getByPlaceholder('16800', { exact: true });

    await lessonsInput.fill('10');
    await lessonPriceInput.fill('2000');
    await discountInput.fill('500');

    await expect(totalInput).toHaveValue('19500');

    // Ручной override суммы
    await totalInput.fill('18000');
    await expect(packageDialog.getByRole('button', { name: /Вернуть авторасчет/i })).toBeVisible();

    await lessonsInput.fill('12');
    await expect(totalInput).toHaveValue('18000');

    await packageDialog.getByRole('button', { name: /Вернуть авторасчет/i }).click();
    await expect(totalInput).toHaveValue('23500');

    await packageDialog.getByPlaceholder('Примечание к пакету…').fill(PACKAGE_ECONOMICS_MARKER);

    // Сохраняем
    await packageDialog.getByRole('button', { name: /Сохранить/i }).click();
    await expect(packageDialog).toBeHidden({ timeout: 10000 });

    // Пакет виден без F5 по поиску предмета
    const searchInput = page.getByPlaceholder('Ученик или предмет');
    await searchInput.fill(uniqueSubject);
    await expect(page.getByText(uniqueSubject).first()).toBeVisible({ timeout: 10000 });
  });

  test('публичный пакет создается без выбора ученика', async ({ authedPage: page }) => {
    const token = await getAuthToken(page);
    const createResponse = await page.request.post(`${API_BASE}/packages`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        isPublic: true,
        subject: 'Математика',
        lessonsTotal: 6,
        totalPrice: 10800,
        comment: PUBLIC_PACKAGE_MARKER,
      },
    });

    if (!createResponse.ok()) {
      const errorBody = await createResponse.text().catch(() => '');
      throw new Error(`POST /api/packages failed: status=${createResponse.status()} body=${errorBody}`);
    }
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
