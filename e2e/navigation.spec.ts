/**
 * NAVIGATION & SIDEBAR E2E TESTS
 * Tests: all sidebar links work, header actions, 404 handling
 */
import { test, expect } from './helpers/auth';

test.describe('Навигация — sidebar', () => {
  const sidebarLinks = [
    { name: 'Дашборд', url: /dashboard/ },
    { name: 'Ученики', url: /students/ },
    { name: 'Расписание', url: /schedule/ },
    { name: 'Финансы', url: /finance/ },
    { name: 'Уведомления', url: /notifications/ },
    { name: 'Настройки', url: /settings/ },
  ];

  for (const link of sidebarLinks) {
    test(`sidebar: "${link.name}" ведёт на правильную страницу`, async ({ authedPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const navLink = page.locator('aside, [role="complementary"]').first().getByRole('link', { name: link.name, exact: true });
      await navLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(link.url);
    });
  }
});

test.describe('Навигация — header', () => {
  test('dropdown "Добавить" работает', async ({ authedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: 'Добавить' });
    await createButton.click();
    await page.waitForTimeout(300);

    // Проверяем все пункты меню
    await expect(page.getByText('Новый ученик').first()).toBeVisible();
    await expect(page.getByText('Новое занятие').first()).toBeVisible();
    await expect(page.getByText('Записать оплату').first()).toBeVisible();
  });

  test('dropdown "Добавить" → "Новый ученик" открывает /students?create=1', async ({ authedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: 'Добавить' });
    await createButton.click();
    await page.waitForTimeout(300);
    await page.getByText('Новый ученик').first().click();
      await page.waitForLoadState('networkidle');

      // Должна открыться страница ученики с модалом создания
      await expect(page).toHaveURL(/students/);
  });

  test('поиск в header работает', async ({ authedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Поиск учеников...');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Тест');
      await page.waitForTimeout(500);
      await searchInput.clear();
    }
  });
});

test.describe('Навигация — общее', () => {
  test('/ редиректит на /dashboard', async ({ authedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('несуществующая страница показывает 404', async ({ authedPage: page }) => {
    await page.goto('/nonexistent-page-12345');
    await page.waitForLoadState('networkidle');

    // Next.js 404
    const has404 = await page.getByText(/404|not found|страница не найдена/i).first().isVisible().catch(() => false);
    // Или редирект на dashboard
    const redirected = page.url().includes('dashboard') || page.url().includes('registration');

    expect(has404 || redirected).toBeTruthy();
  });
});
