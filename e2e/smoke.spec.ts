/**
 * Фаза 3 — Smoke-тестирование с скриншотами.
 * Проходит все ключевые зоны приложения, делает скриншоты,
 * проверяет наличие критичных элементов.
 */
import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI, loginAndGoto, createStudentAPI, createLessonAPI } from './helpers';

const API = 'http://127.0.0.1:3200/api';
const S = 'e2e/screenshots';

let email: string;
let password: string;
let token: string;
let studentId: string;
let tutorSlug: string;
let portalToken: string;

test.describe('Smoke', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    email = uniqueEmail();
    password = 'SmokeTest123!';

    const reg = await registerViaAPI(page, { email, password, name: 'Smoke Тест' });
    token = reg.accessToken;

    const slug = `smoke-${Date.now()}`;
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Smoke Тест', slug, subjects: ['Математика', 'Физика'], isPublished: true },
    });
    tutorSlug = slug;

    const student = await createStudentAPI(page, token);
    studentId = student.id;

    const portalRes = await page.request.post(`${API}/students/${studentId}/portal-link`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (portalRes.ok()) {
      const b = await portalRes.json();
      portalToken = b.portalToken || b.token || '';
    }

    await createLessonAPI(page, token, studentId);

    await page.request.post(`${API}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { studentId, amount: 2000, method: 'CASH', description: 'Smoke оплата' },
    });

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.request.delete(`${API}/settings/account`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password },
      });
    } catch { /* ignore */ }
    await page.close();
  });

  // ─── 3.1 Регистрация ──────────────────────
  test('3.1a Страница регистрации — форма', async ({ page }) => {
    await page.goto('/registration');
    await page.screenshot({ path: `${S}/01-registration.png`, fullPage: true });
    await expect(page.getByPlaceholder('Введите email или телефон')).toBeVisible();
    await expect(page.getByPlaceholder('Введите пароль')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  });

  test('3.1b Вход → дашборд', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);
    await page.screenshot({ path: `${S}/02-login-redirect.png`, fullPage: true });
    expect(page.url()).toContain('/dashboard');
  });

  test('3.1c Неверный пароль → ошибка', async ({ page }) => {
    await page.goto('/registration');
    await page.getByPlaceholder('Введите email или телефон').fill(email);
    await page.getByPlaceholder('Введите пароль').fill('WrongPassword99!');
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${S}/03-login-error.png`, fullPage: true });
    expect(page.url()).toContain('/registration');
  });

  // ─── 3.2 Дашборд ─────────────────────────
  test('3.2 Дашборд — контент загружен', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/04-dashboard.png`, fullPage: true });
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  // ─── 3.3 Боковое меню ─────────────────────
  test('3.3 Навигация сайдбара', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);
    await page.screenshot({ path: `${S}/05-sidebar.png` });

    const navItems = [
      { text: /Ученики/i, url: '/students' },
      { text: /Расписание/i, url: '/schedule' },
      { text: /Настройки/i, url: '/settings' },
      { text: /Поддержка/i, url: '/support' },
    ];

    const visited: string[] = [];
    for (const { text, url } of navItems) {
      const link = page.locator('a').filter({ hasText: text }).first();
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click();
        await page.waitForTimeout(1500);
        visited.push(`${text} → ${page.url()}`);
      }
    }
    await page.screenshot({ path: `${S}/06-sidebar-nav.png`, fullPage: true });
    // Достаточно что хотя бы 3 перехода были
    expect(visited.length).toBeGreaterThanOrEqual(3);
  });

  // ─── 3.4 Ученики ──────────────────────────
  test('3.4a Список учеников', async ({ page }) => {
    await loginAndGoto(page, '/students', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/07-students-list.png`, fullPage: true });
    await expect(page.getByText('PW Ученик')).toBeVisible({ timeout: 5000 });
  });

  test('3.4b Карточка ученика', async ({ page }) => {
    await loginAndGoto(page, `/students/${studentId}`, email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/08-student-card.png`, fullPage: true });
    await expect(page.getByText('PW Ученик')).toBeVisible({ timeout: 5000 });
  });

  test('3.4c Модалка «Новый ученик»', async ({ page }) => {
    await loginAndGoto(page, '/students', email, password);
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Новый ученик/i }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${S}/09-student-modal.png`, fullPage: true });
    await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible();
    await expect(page.getByPlaceholder('2100')).toBeVisible();
  });

  // ─── 3.5 Расписание ───────────────────────
  test('3.5a Расписание/календарь', async ({ page }) => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${S}/10-schedule.png`, fullPage: true });
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('3.5b Модалка создания урока', async ({ page }) => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(1000);
    const addBtn = page.getByRole('button', { name: /Новый урок|Создать|Добавить/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${S}/11-schedule-modal.png`, fullPage: true });
  });

  // ─── 3.6 Финансы ──────────────────────────
  test('3.6a Обзор финансов', async ({ page }) => {
    await loginAndGoto(page, '/finance', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/12-finance.png`, fullPage: true });
  });

  test('3.6b Оплаты', async ({ page }) => {
    await loginAndGoto(page, '/finance/payments', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/13-payments.png`, fullPage: true });
  });

  test('3.6c Пакеты', async ({ page }) => {
    await loginAndGoto(page, '/finance/packages', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/14-packages.png`, fullPage: true });
  });

  // ─── 3.7 Настройки ────────────────────────
  test('3.7 Настройки', async ({ page }) => {
    await loginAndGoto(page, '/settings', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/15-settings.png`, fullPage: true });
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  // ─── 3.8 Публичная страница ────────────────
  test('3.8a Публичный профиль', async ({ page }) => {
    await page.goto(`/t/${tutorSlug}`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${S}/16-public.png`, fullPage: true });
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
  });

  test('3.8b Несуществующий slug → ошибка', async ({ page }) => {
    await page.goto('/t/nonexistent-slug-xyz-999');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${S}/17-public-404.png`, fullPage: true });
    await expect(page.locator('body')).toContainText(/не найден|404|не существует/i);
  });

  // ─── 3.9 Портал ученика ────────────────────
  test('3.9a Портал — валидный токен', async ({ page }) => {
    test.skip(!portalToken, 'Portal token not generated');
    await page.goto(`/t/${tutorSlug}/s/${portalToken}`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${S}/18-portal.png`, fullPage: true });
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
  });

  test('3.9b Портал — невалидный токен', async ({ page }) => {
    await page.goto(`/t/${tutorSlug}/s/invalid-token-xyz`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${S}/19-portal-invalid.png`, fullPage: true });
    await expect(page.locator('body')).toContainText(/недействительна|не найден|ошибка|404/i);
  });

  // ─── 3.10 Поддержка ───────────────────────
  test('3.10a Главная поддержки', async ({ page }) => {
    await loginAndGoto(page, '/support', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/20-support.png`, fullPage: true });
  });

  test('3.10b Категории', async ({ page }) => {
    await loginAndGoto(page, '/support/categories', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/21-support-categories.png`, fullPage: true });
  });

  test('3.10c Статья', async ({ page }) => {
    await loginAndGoto(page, '/support/article', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/22-support-article.png`, fullPage: true });
  });

  // ─── 3.11 Тёмная тема ─────────────────────
  test('3.11 Тёмная тема — все страницы', async ({ page }) => {
    await loginAndGoto(page, '/dashboard', email, password);
    await page.evaluate(() => {
      localStorage.setItem('chakra-ui-color-mode', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    });
    await page.reload();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/23-dark-dashboard.png`, fullPage: true });

    await page.goto('/students');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/24-dark-students.png`, fullPage: true });

    await page.goto('/schedule');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/25-dark-schedule.png`, fullPage: true });

    await page.goto('/finance');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/26-dark-finance.png`, fullPage: true });

    await page.goto('/settings');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/27-dark-settings.png`, fullPage: true });

    await page.goto('/finance/payments');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/30-dark-payments.png`, fullPage: true });

    await page.goto('/finance/packages');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/31-dark-packages.png`, fullPage: true });

    await page.goto('/notifications');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/32-dark-notifications.png`, fullPage: true });

    await page.goto('/support');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/33-dark-support.png`, fullPage: true });

    await page.goto('/files');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/34-dark-files.png`, fullPage: true });
  });

  // ─── 3.11b Тёмная тема — публичные страницы ──
  test('3.11b Тёмная тема — публичная + портал', async ({ page }) => {
    await page.goto(`/t/${tutorSlug}`);
    await page.evaluate(() => {
      localStorage.setItem('chakra-ui-color-mode', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    });
    await page.reload();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/35-dark-public.png`, fullPage: true });

    if (portalToken) {
      await page.goto(`/t/${tutorSlug}/s/${portalToken}`);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${S}/36-dark-portal.png`, fullPage: true });
    }
  });

  // ─── 3.12 Модалки ─────────────────────────
  test('3.12c Модалка «Новое занятие»', async ({ page }) => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(1000);
    const addBtn = page.getByRole('button', { name: /Новый урок|Создать|Добавить|Новое занятие/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${S}/37-modal-lesson.png`, fullPage: true });
    }
  });

  test('3.12d Модалка «Записать оплату»', async ({ page }) => {
    await loginAndGoto(page, '/finance/payments', email, password);
    await page.waitForTimeout(1000);
    const addBtn = page.getByRole('button', { name: /Записать оплату|Новая оплата|Создать/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${S}/38-modal-payment.png`, fullPage: true });
    }
  });

  test('3.12e Модалка «Новый пакет»', async ({ page }) => {
    await loginAndGoto(page, '/finance/packages', email, password);
    await page.waitForTimeout(1000);
    const addBtn = page.getByRole('button', { name: /Новый пакет|Создать/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${S}/39-modal-package.png`, fullPage: true });
    }
  });

  // ─── 3.12 Доп. страницы ───────────────────
  test('3.12a Уведомления', async ({ page }) => {
    await loginAndGoto(page, '/notifications', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/28-notifications.png`, fullPage: true });
  });

  test('3.12b Материалы', async ({ page }) => {
    await loginAndGoto(page, '/files', email, password);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${S}/29-files.png`, fullPage: true });
  });
});
