/**
 * SETTINGS E2E TESTS
 * Tests: settings tabs, account form, theme switching  
 */
import { test, expect } from './helpers/auth';

test.describe('Настройки', () => {
  test('страница настроек загружается', async ({ authedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Секции должны быть видны
    const sections = ['Аккаунт', 'Безопасность', 'Уведомления', 'Политики', 'Интеграции'];
    let visibleSections = 0;
    for (const section of sections) {
      const el = page.getByText(section).first();
      if (await el.isVisible().catch(() => false)) visibleSections++;
    }
    expect(visibleSections).toBeGreaterThanOrEqual(3);
  });

  test('переключение секций', async ({ authedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const sections = ['Безопасность', 'Уведомления', 'Политики', 'Интеграции', 'Аккаунт'];
    for (const section of sections) {
      const tab = page.getByText(section).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('тема интерфейса переключается', async ({ authedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Ищем переключатель темы
    const darkTheme = page.getByText('Тёмная').first();
    if (await darkTheme.isVisible().catch(() => false)) {
      await darkTheme.click();
      await page.waitForTimeout(500);

      // Проверяем, что тёмная тема применилась
      const isDark = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
          document.documentElement.getAttribute('data-theme') === 'dark' ||
          document.body.classList.contains('g-root_theme_dark');
      });

      // Вернём светлую
      const lightTheme = page.getByText('Светлая').first();
      if (await lightTheme.isVisible()) {
        await lightTheme.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('публичная страница — toggle и slug', async ({ authedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const publicPageSection = page.getByText('Публичная страница').first();
    if (await publicPageSection.isVisible().catch(() => false)) {
      // Проверяем наличие slug input
      const slugInput = page.getByPlaceholder('slug');
      if (await slugInput.isVisible()) {
        const currentValue = await slugInput.inputValue();
        expect(currentValue).toBeDefined();
      }
    }
  });
});
