import { test, expect, type Page } from '@playwright/test';
import {
  uniqueEmail,
  registerViaAPI,
  loginAndGoto,
  createStudentAPI,
  createLessonAPI,
  deleteAccount,
} from './helpers';

const API = 'http://127.0.0.1:3200/api';

/**
 * ────────────────────────────────────────────────
 *  Этап 8 · Финансы — обзор, оплаты, пакеты
 * ────────────────────────────────────────────────
 * Journey 44: Финансовый обзор — виджеты и навигация
 * Journey 45: Оплаты — таблица, фильтры, детали
 * Journey 46: Пакеты — CRUD и фильтры
 */

/* ═══════════════════════════════════════════════════
   Journey 44 · Финансовый обзор
   ═══════════════════════════════════════════════════ */
test.describe('Journey 44: Финансовый обзор — виджеты и навигация', () => {
  let email: string;
  let password: string;
  let token: string;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const reg = await registerViaAPI(page, { name: 'Фин Обзор' });
    email = reg.email;
    password = reg.password;
    token = reg.accessToken;

    // Create student + lesson + payment to populate widgets
    const student = await createStudentAPI(page, token, { name: 'Фин Ученик', rate: 3000 });
    studentId = student.id;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    const lesson = await createLessonAPI(page, token, studentId, {
      scheduledAt: yesterday.toISOString(),
      rate: 3000,
    });

    // Mark lesson as completed
    const markRes = await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'COMPLETED' },
    });
    expect(markRes.ok()).toBe(true);

    // Create payment
    const payRes = await page.request.post(`${API}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { studentId, amount: 3000, method: 'SBP', date: new Date().toISOString().slice(0, 10) },
    });
    expect(payRes.ok()).toBe(true);

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await deleteAccount(p, token, password);
    await ctx.close();
  });

  let page: Page;
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAndGoto(page, '/finance', email, password);
  });
  test.afterEach(async () => { await page.close(); });

  test('44.1 Страница обзора загружена — заголовок «Финансы»', async () => {
    await expect(page.locator('.text-h3, .text-h4').filter({ hasText: 'Финансы' }).first()).toBeVisible();
  });

  test('44.2 StatCard «Доход за месяц» содержит сумму в ₽', async () => {
    const card = page.locator('a[href="/finance/payments"]').filter({ hasText: 'Доход за месяц' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('₽');
  });

  test('44.3 StatCard «Запланировано» виден', async () => {
    const card = page.locator('a[href="/schedule"]').filter({ hasText: 'Запланировано' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('₽');
  });

  test('44.4 StatCard «Задолженность» виден', async () => {
    const card = page.locator('a').filter({ hasText: 'Задолженность' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('₽');
  });

  test('44.5 IncomeChart — блок «Доход» с полосами', async () => {
    const chart = page.locator('.card').filter({ hasText: 'Доход' }).filter({ hasText: 'Получено' });
    await expect(chart).toBeVisible();
    await expect(chart).toContainText('₽');
  });

  test('44.6 IncomeChart — переключатель периода (dropdown) видим', async () => {
    const chart = page.locator('.card').filter({ hasText: 'Доход' }).filter({ hasText: 'Получено' });
    // Period selector is a dropdown showing current period + calendar icon
    await expect(chart.getByText('Месяц')).toBeVisible();
  });

  test('44.7 PeriodSummary — «Уроков проведено» виден', async () => {
    const summary = page.locator('.card').filter({ hasText: 'Сводка за период' });
    await expect(summary).toBeVisible();
    await expect(summary.getByText('Уроков проведено')).toBeVisible();
  });

  test('44.8 BalanceTable — ученик виден', async () => {
    const table = page.locator('.card').filter({ hasText: 'Баланс учеников' });
    await expect(table).toBeVisible();
    await expect(table).toContainText('Фин Ученик');
  });

  test('44.9 BalanceTable — кнопка «Все оплаты» ведёт на /finance/payments', async () => {
    const link = page.locator('a[href="/finance/payments"]').filter({ hasText: 'Все оплаты' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/finance\/payments/);
  });

  test('44.10 BalanceTable — клик по строке ученика → /students/', async () => {
    const table = page.locator('.card').filter({ hasText: 'Баланс учеников' });
    const row = table.locator('tr').filter({ hasText: 'Фин Ученик' });
    await row.click();
    await expect(page).toHaveURL(/\/students\//);
  });
});

/* ═══════════════════════════════════════════════════
   Journey 45 · Оплаты — таблица, фильтры, детали
   ═══════════════════════════════════════════════════ */
test.describe('Journey 45: Оплаты — таблица, фильтры, детали', () => {
  let email: string;
  let password: string;
  let token: string;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const reg = await registerViaAPI(page, { name: 'Опл Тест' });
    email = reg.email;
    password = reg.password;
    token = reg.accessToken;

    const student = await createStudentAPI(page, token, { name: 'Кассир Студент', rate: 2500 });
    studentId = student.id;

    // Create a payment
    const payRes = await page.request.post(`${API}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { studentId, amount: 5000, method: 'CASH', date: new Date().toISOString().slice(0, 10) },
    });
    expect(payRes.ok()).toBe(true);

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await deleteAccount(p, token, password);
    await ctx.close();
  });

  let page: Page;
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAndGoto(page, '/finance/payments', email, password);
  });
  test.afterEach(async () => { await page.close(); });

  test('45.1 Заголовок «Оплаты» виден', async () => {
    await expect(page.locator('.text-h3, .text-h4').filter({ hasText: 'Оплаты' }).first()).toBeVisible();
  });

  test('45.2 Таб «Все» активен по умолчанию', async () => {
    const tab = page.getByRole('button', { name: 'Все', exact: true });
    await expect(tab).toBeVisible();
  });

  test('45.3 Таб «Оплачено» переключается', async () => {
    await page.getByRole('button', { name: 'Оплачено' }).click();
    // Table should still show our payment (status is PAID)
    await expect(page.getByText('Кассир Студент')).toBeVisible({ timeout: 5_000 });
  });

  test('45.4 Оплата видна в таблице — сумма 5 000 ₽', async () => {
    await expect(page.getByText('5 000')).toBeVisible();
    await expect(page.getByText('Кассир Студент')).toBeVisible();
  });

  test('45.5 Способ оплаты «Наличные» виден', async () => {
    await expect(page.getByText('Наличные')).toBeVisible();
  });

  test('45.6 Клик по строке → модалка «Детали оплаты»', async () => {
    // Click the row with the payment
    const row = page.locator('tr').filter({ hasText: 'Кассир Студент' });
    await row.click();
    await expect(page.getByText('Детали оплаты')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.modal, [role="dialog"]').first()).toContainText('5 000');
    await expect(page.locator('.modal, [role="dialog"]').first()).toContainText('Наличные');
  });

  test('45.7 Кнопка «Записать оплату» открывает модалку создания', async () => {
    await page.getByRole('button', { name: 'Записать оплату' }).first().click();
    // Modal title may match the button text — look inside the modal body
    await expect(page.locator('[class*="modal"], [role="dialog"]').first().getByText('Сумма')).toBeVisible({ timeout: 5_000 });
  });

  test('45.8 Поиск фильтрует по имени ученика', async () => {
    await page.getByPlaceholder('Поиск...').fill('Кассир');
    await expect(page.getByText('Кассир Студент')).toBeVisible();
    await page.getByPlaceholder('Поиск...').fill('Несуществующий');
    await expect(page.getByText('Нет оплат')).toBeVisible({ timeout: 5_000 });
  });
});

/* ═══════════════════════════════════════════════════
   Journey 46 · Пакеты — CRUD и фильтры
   ═══════════════════════════════════════════════════ */
test.describe('Journey 46: Пакеты — CRUD и фильтры', () => {
  let email: string;
  let password: string;
  let token: string;
  let studentId: string;
  let packageId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const reg = await registerViaAPI(page, { name: 'Пакет Тест' });
    email = reg.email;
    password = reg.password;
    token = reg.accessToken;

    const student = await createStudentAPI(page, token, { name: 'Пакет Ученик', rate: 2000, subject: 'Физика' });
    studentId = student.id;

    // Create a package via API
    const pkgRes = await page.request.post(`${API}/packages`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { studentId, subject: 'Физика', lessonsTotal: 8, totalPrice: 16000 },
    });
    expect(pkgRes.ok()).toBe(true);
    const pkg = await pkgRes.json();
    packageId = pkg.id;

    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await deleteAccount(p, token, password);
    await ctx.close();
  });

  let page: Page;
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await loginAndGoto(page, '/finance/packages', email, password);
  });
  test.afterEach(async () => { await page.close(); });

  test('46.1 Заголовок «Пакеты занятий» виден', async () => {
    await expect(page.locator('.text-h3, .text-h4').filter({ hasText: 'Пакеты занятий' }).first()).toBeVisible();
  });

  test('46.2 Табы «Все», «Активные», «Завершённые» видны', async () => {
    await expect(page.getByRole('button', { name: 'Все', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Активные' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Завершённые' })).toBeVisible();
  });

  test('46.3 Пакет ученика виден в таблице', async () => {
    await expect(page.getByText('Пакет Ученик')).toBeVisible();
    await expect(page.getByText('Физика')).toBeVisible();
  });

  test('46.4 Прогресс пакета — 0/8', async () => {
    await expect(page.getByText('0/8')).toBeVisible();
  });

  test('46.5 Таб «Активные» — пакет виден', async () => {
    await page.getByRole('button', { name: 'Активные' }).click();
    await expect(page.getByText('Пакет Ученик')).toBeVisible({ timeout: 5_000 });
  });

  test('46.6 Таб «Завершённые» — пусто', async () => {
    await page.getByRole('button', { name: 'Завершённые' }).click();
    // Either shows empty state or no package rows
    await expect(page.getByText('Пакет Ученик')).not.toBeVisible({ timeout: 3_000 });
  });

  test('46.7 Кнопка «Новый пакет» → модалка создания', async () => {
    await page.getByRole('button', { name: 'Новый пакет' }).click();
    await expect(page.getByText('Новый пакет').nth(1)).toBeVisible({ timeout: 5_000 });
  });

  test('46.8 Статус пакета — «Активен»', async () => {
    await expect(page.getByText('Активен')).toBeVisible();
  });

  test('46.9 Сумма пакета — 16 000 ₽', async () => {
    await expect(page.getByText('16 000')).toBeVisible();
  });
});
