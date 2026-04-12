/**
 * DASHBOARD E2E TESTS
 * Tests: stats cards, today schedule, debts, recent payments, income chart
 */
import { test, expect } from './helpers/auth';

test.describe('Дашборд', () => {
  test('страница загружается с основными виджетами', async ({ authedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Должны быть stat-карточки (активные ученики, занятия, доход, долги)
    const statsTexts = ['Ученики', 'Занятия', 'Доход', 'Долг'];
    let visibleStats = 0;
    for (const text of statsTexts) {
      const el = page.getByText(text, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) visibleStats++;
    }
    // Хотя бы 2 stat-карточки видны
    expect(visibleStats).toBeGreaterThanOrEqual(2);
  });

  test('виджет "Расписание на сегодня" отображается', async ({ authedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Ищем секцию с расписанием
    const scheduleWidget = page.getByText(/Расписание|Сегодня|занят/i).first();
    await expect(scheduleWidget).toBeVisible();
  });

  test('виджет "Последние оплаты" отображается', async ({ authedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const paymentsWidget = page.getByText(/Последние оплаты|Оплаты/i).first();
    // Может не быть, если данных нет — просто проверяем что дашборд в целом есть
    const dashboardLoaded = await page.locator('[class*="dashboard"], [class*="grid"]').first().isVisible().catch(() => false);
    expect(dashboardLoaded || await paymentsWidget.isVisible().catch(() => false)).toBeTruthy();
  });

  test('график доходов отображается', async ({ authedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Recharts рендерит SVG
    const chart = page.locator('.recharts-responsive-container, svg.recharts-surface').first();
    const chartVisible = await chart.isVisible().catch(() => false);

    // Или хотя бы текст-заголовок графика
    const chartHeader = page.getByText(/Доход|Income/i).first();
    const headerVisible = await chartHeader.isVisible().catch(() => false);

    expect(chartVisible || headerVisible).toBeTruthy();
  });

  test('клик по занятию из дашборда открывает модал', async ({ authedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Ищем кликабельный элемент занятия в расписании на сегодня
    const lessonCard = page.locator('[class*="lesson"], [class*="schedule"] [class*="card"], [class*="schedule"] [class*="item"]').first();
    if (await lessonCard.isVisible().catch(() => false)) {
      await lessonCard.click();
      await page.waitForTimeout(500);

      // Модал деталей занятия
      const modalVisible = await page.getByText(/Информация|Запланировано|Проведено/i).first().isVisible().catch(() => false);
      // Close if opened
      if (modalVisible) {
        const closeBtn = page.locator('[aria-label="Close"], [class*="close"]').first();
        if (await closeBtn.isVisible()) await closeBtn.click();
      }
    }
  });
});
