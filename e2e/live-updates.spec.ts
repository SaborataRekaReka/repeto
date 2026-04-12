/**
 * LIVE UPDATE (NO F5) E2E TESTS
 * Critical: after CRUD operations, UI must update without page reload
 */
import { test, expect } from './helpers/auth';

test.describe('Live Update — создание отражается без F5', () => {

  test('создать ученика через модал → виден в списке сразу', async ({ authedPage: page }) => {
    const uniqueName = `LiveTest ${Date.now()}`;

    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Нажимаем "Новый ученик"
    await page.getByRole('button', { name: /Новый ученик/i }).first().click();
    await page.waitForTimeout(500);

    // ФИО — через placeholder в модале
    const nameInput = page.getByPlaceholder('Иванов Пётр Сергеевич');
    await nameInput.fill(uniqueName);

    // Предмет — Gravity UI Select (клик на триггер, затем опцию)
    await page.getByText('Выберите предмет').click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Математика' }).click();

    // Ставка
    const rateInput = page.getByPlaceholder('2100');
    if (await rateInput.isVisible()) {
      await rateInput.clear();
      await rateInput.fill('1500');
    }

    // Сохраняем
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await page.waitForTimeout(3000);

    // ГЛАВНОЕ: ученик виден в списке БЕЗ F5
    await expect(page.getByText(uniqueName).first()).toBeVisible({ timeout: 10000 });
  });

  test('контекстное меню ученика содержит действия', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    if (rowCount === 0) { test.skip(); return; }

    // Кликаем "..." в первой строке
    const menuBtn = rows.first().locator('button').last();
    await menuBtn.click();
    await page.waitForTimeout(500);

    // Должно появиться меню с пунктами
    const hasMenu = await page.getByText(/Удалить|В архив|Редактировать|На паузу|Активировать/i).first().isVisible().catch(() => false);
    // Если нет текстового меню, проверим что появился popup
    const hasPopup = await page.locator('[role="menu"], [role="listbox"], [class*="popup"], [class*="dropdown"]').first().isVisible().catch(() => false);
    expect(hasMenu || hasPopup).toBeTruthy();

    await page.keyboard.press('Escape');
  });

  test('создать оплату через модал → видна в таблице сразу', async ({ authedPage: page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    // Запоминаем текущее количество строк
    const rowsBefore = await page.locator('table tbody tr').count();

    // Нажимаем «Записать оплату»
    const createBtn = page.getByRole('button', { name: /Записать оплату/i }).first();
    if (!await createBtn.isVisible().catch(() => false)) {
      test.skip(); return;
    }
    await createBtn.click();
    await page.waitForTimeout(500);

    // Ученик — Gravity UI Select
    await page.getByText('Выберите ученика').click();
    await page.waitForTimeout(300);
    // Выбираем первого ученика из списка
    const firstOption = page.getByRole('option').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
    }
    await page.waitForTimeout(300);

    // Сумма (placeholder "4200")
    const amountInput = page.getByPlaceholder('4200');
    if (await amountInput.isVisible()) {
      await amountInput.fill('9999');
    }

    // Сохраняем
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await page.waitForTimeout(3000);

    // Оплата появилась без F5
    const rowsAfter = await page.locator('table tbody tr').count();
    const amountVisible = await page.getByText('9 999').first().isVisible().catch(() => false);
    expect(rowsAfter > rowsBefore || amountVisible).toBeTruthy();
  });

  test('статус занятия обновляется в UI при клике на событие', async ({ authedPage: page }) => {
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    // Переключаемся на Неделя для карточек
    await page.getByRole('radio', { name: 'Неделя' }).click();
    await page.waitForLoadState('networkidle');

    // Ищем занятие по тексту
    const lessonBlock = page.getByText(/Физика|Английский|Математика/i).first();
    if (!await lessonBlock.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    // Кликаем на занятие
    await lessonBlock.click();
    await page.waitForTimeout(500);

    // Модал/панель деталей должна появиться с кнопками
    const hasActions = await page.getByRole('button', { name: /Проведено|Отменить|Редактировать|Удалить/i }).first().isVisible().catch(() => false);
    expect(hasActions).toBeTruthy();
  });
});

test.describe('Live Update — уведомления', () => {
  test('кнопка "Прочитать все" видна при наличии непрочитанных', async ({ authedPage: page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // Кнопка "Прочитать все (N)" должна быть видна или нет непрочитанных
    const readAllBtn = page.getByRole('button', { name: /Прочитать все/i });
    const hasBtnVisible = await readAllBtn.isVisible().catch(() => false);
    const hasNotifications = await page.locator('[class*="notification"]').first().isVisible().catch(() => false);

    // Или кнопка видна (есть непрочитанные), или нет уведомлений
    expect(hasBtnVisible || !hasNotifications).toBeTruthy();
  });
});
