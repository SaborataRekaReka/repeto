import { test, expect, type Page } from '@playwright/test';
import {
  uniqueEmail,
  registerViaAPI,
  loginAndGoto,
  createStudentAPI,
  deleteAccount,
} from './helpers';

const API = 'http://127.0.0.1:3200/api';

/**
 * ────────────────────────────────────────────────
 *  Этап 10 · Глобальные UI-элементы
 * ────────────────────────────────────────────────
 * Journey 50: Header — поиск, меню «Создать», уведомления
 * Journey 51: Sidebar — навигация и профиль
 * Journey 52: Тёмная тема
 * Journey 53: Responsive — планшет/мобильный
 */

/* ═══════════════════════════════════════════════════
   Journey 50 · Header
   ═══════════════════════════════════════════════════ */
test.describe('Journey 50: Header — поиск, создать, уведомления', () => {
  let email: string;
  let password: string;
  let token: string;
  let studentName: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const reg = await registerViaAPI(page, { name: 'UI Тестер' });
    email = reg.email;
    password = reg.password;
    token = reg.accessToken;

    studentName = `ПоискУченик ${Date.now()}`;
    await createStudentAPI(page, token, { name: studentName, subject: 'Химия' });

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await deleteAccount(p, token, password);
    await ctx.close();
  });

  test('50.1 Поиск ученика — dropdown с результатами → клик → карточка', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    // The search icon is a button in the header; clicking it reveals the input
    const searchInput = page.getByPlaceholder('Поиск учеников...');
    const isVisible = await searchInput.isVisible().catch(() => false);
    if (!isVisible) {
      await page.locator('header button').first().click();
      await expect(searchInput).toBeVisible({ timeout: 3_000 });
    }

    await searchInput.fill(studentName.slice(0, 12));
    // Wait for the dropdown results to appear
    await page.waitForTimeout(1000);
    await expect(page.getByText(studentName).first()).toBeVisible({ timeout: 5_000 });

    // Click on the search result (use first() to avoid strict mode if text appears in multiple places)
    await page.getByText(studentName).first().click();
    await expect(page).toHaveURL(/\/students\/[a-f0-9-]+/);
  });

  test('50.2 Меню «Создать» — три пункта', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    await page.getByRole('button', { name: 'Создать' }).click();

    await expect(page.getByText('Новый ученик')).toBeVisible();
    await expect(page.getByText('Новое занятие')).toBeVisible();
    await expect(page.getByText('Записать оплату').first()).toBeVisible();
  });

  test('50.3 Меню «Создать» → «Новый ученик» → /students?create=1', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    await page.getByRole('button', { name: 'Создать' }).click();
    await page.getByText('Новый ученик').click();
    await expect(page).toHaveURL(/\/students/);
  });

  test('50.4 Кнопка уведомлений → /notifications', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    // The notification icon is a button that navigates to /notifications
    // It's the second button in the header area (after search)
    // Find it by the notification icon class pattern or by position
    await page.locator('header button').nth(1).click();
    await expect(page).toHaveURL(/\/notifications/);
  });
});

/* ═══════════════════════════════════════════════════
   Journey 51 · Sidebar навигация + профиль
   ═══════════════════════════════════════════════════ */
test.describe('Journey 51: Sidebar — навигация и профиль', () => {
  let email: string;
  let password: string;
  let token: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const reg = await registerViaAPI(page, { name: 'Навигатор' });
    email = reg.email;
    password = reg.password;
    token = reg.accessToken;

    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { slug: `nav-${Date.now()}`, published: true },
    });

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await deleteAccount(p, token, password);
    await ctx.close();
  });

  test('51.1 Все ссылки сайдбара ведут на правильные страницы', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    const links = [
      { label: 'Ученики', url: '/students' },
      { label: 'Расписание', url: '/schedule' },
      { label: 'Финансы', url: '/finance' },
      { label: 'Уведомления', url: '/notifications' },
      { label: 'Настройки', url: '/settings' },
      { label: 'Дашборд', url: '/dashboard' },
    ];

    for (const { label, url } of links) {
      await page.getByText(label, { exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(url));
    }
  });

  test('51.2 Профильное меню → «Настройки»', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    // The "..." dots button is in the fixed sidebar, last button
    await page.locator('.fixed.top-0.left-0 button').last().click();

    // Click "Настройки" in the dropdown menu (last one to avoid sidebar nav conflict)
    await page.locator('.absolute.bottom-full').getByText('Настройки').click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('51.3 Профильное меню → «Выйти»', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    await page.locator('.fixed.top-0.left-0 button').last().click();
    await page.getByText('Выйти').click();
    await expect(page).toHaveURL(/\/registration/);
  });
});

/* ═══════════════════════════════════════════════════
   Journey 52 · Тёмная тема
   ═══════════════════════════════════════════════════ */
test.describe('Journey 52: Тёмная тема', () => {
  let email: string;
  let password: string;
  let token: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const reg = await registerViaAPI(page, { name: 'ТемаТест' });
    email = reg.email;
    password = reg.password;
    token = reg.accessToken;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await deleteAccount(p, token, password);
    await ctx.close();
  });

  test('52.1 Переключение на тёмную тему', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    // Set light mode via localStorage and reload
    await page.evaluate(() => localStorage.setItem('chakra-ui-color-mode', 'light'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const needsLogin = await page.getByPlaceholder('Введите email или телефон').isVisible().catch(() => false);
    if (needsLogin) {
      await loginAndGoto(page, '/dashboard', email, password);
    }

    // Click the moon button (second button in the toggle div.relative.flex.w-14)
    const toggle = page.locator('div.relative.flex.w-14');
    await toggle.locator('button').last().click();

    await page.waitForTimeout(500);
    // Check dark mode: Chakra sets data-theme or class on html
    const isDark = await page.evaluate(() => {
      const html = document.documentElement;
      return html.getAttribute('data-theme') === 'dark' || html.classList.contains('dark');
    });
    expect(isDark).toBe(true);
  });

  test('52.2 Переключение обратно на светлую тему', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);

    // Set dark mode first
    await page.evaluate(() => localStorage.setItem('chakra-ui-color-mode', 'dark'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const needsLogin = await page.getByPlaceholder('Введите email или телефон').isVisible().catch(() => false);
    if (needsLogin) {
      await loginAndGoto(page, '/dashboard', email, password);
    }

    // Click the sun button (first in toggle)
    const toggle = page.locator('div.relative.flex.w-14');
    await toggle.locator('button').first().click();

    await page.waitForTimeout(500);
    const isDark = await page.evaluate(() => {
      const html = document.documentElement;
      return html.getAttribute('data-theme') === 'dark' || html.classList.contains('dark');
    });
    expect(isDark).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════
   Journey 53 · Responsive
   ═══════════════════════════════════════════════════ */
test.describe('Journey 53: Responsive — мобильный', () => {
  let email: string;
  let password: string;
  let token: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const reg = await registerViaAPI(page, { name: 'Мобильный' });
    email = reg.email;
    password = reg.password;
    token = reg.accessToken;
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await deleteAccount(p, token, password);
    await ctx.close();
  });

  test('53.1 Viewport 768px → сайдбар скрыт, нижняя навигация видна', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page = await ctx.newPage();
    await loginAndGoto(page, '/dashboard', email, password);

    // Sidebar (fixed left div) should be hidden at md breakpoint
    const sidebar = page.locator('.fixed.top-0.left-0.bottom-0').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    expect(sidebarVisible).toBe(false);

    // Bottom nav should be visible
    const bottomNav = page.locator('.fixed.bottom-0').first();
    await expect(bottomNav).toBeVisible();

    await ctx.close();
  });

  test('53.2 Viewport 768px → нижняя навигация содержит ссылки', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page = await ctx.newPage();
    await loginAndGoto(page, '/dashboard', email, password);

    const bottomNav = page.locator('.fixed.bottom-0').first();
    await expect(bottomNav).toBeVisible();

    const links = await bottomNav.locator('a, button').count();
    expect(links).toBeGreaterThanOrEqual(4);

    await ctx.close();
  });
});
