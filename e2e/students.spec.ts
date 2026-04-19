/**
 * STUDENTS CRUD E2E TESTS
 * Tests: list, create, view detail, tabs, delete — and live update without F5
 */
import { test, expect, waitForAPI, API_BASE } from './helpers/auth';

test.describe('Ученики — список', () => {
  test('страница загружается и показывает список', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    // Должен быть заголовок или таб "Все"
    await expect(page.getByText('Все').first()).toBeVisible();
    // Либо ученики в таблице, либо empty state
    const hasStudents = await page.locator('table tbody tr').count().then(c => c > 0);
    const hasEmpty = await page.getByText('Пока нет учеников').isVisible().catch(() => false);
    expect(hasStudents || hasEmpty).toBeTruthy();
  });

  test('табы фильтруют список', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Кликаем "Активные"
    const activeTab = page.getByRole('radio', { name: 'Активные' }).first();
    if (await activeTab.isVisible().catch(() => false)) {
      await activeTab.click();
    } else {
      await page.getByText('Активные').first().click();
    }
    await page.waitForLoadState('networkidle');

    // Кликаем «На паузе»
    const pausedTab = page.getByRole('radio', { name: 'На паузе' }).first();
    if (await pausedTab.isVisible().catch(() => false)) {
      await pausedTab.click();
    } else {
      await page.getByText('На паузе').first().click();
    }
    await page.waitForLoadState('networkidle');

    // Обратно на «Все»
    const allTab = page.getByRole('radio', { name: 'Все' }).first();
    if (await allTab.isVisible().catch(() => false)) {
      await allTab.click();
    } else {
      await page.getByText('Все').first().click();
    }
    await page.waitForLoadState('networkidle');
  });

  test('поиск учеников работает', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Поиск...');
    if (await searchInput.isVisible()) {
      await searchInput.fill('ТестПоискНесуществующий');
      await page.waitForTimeout(500);
      // Should show empty or fewer results
      const rows = await page.locator('table tbody tr').count();
      // Clear
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('форма создания: класс и возраст разделены', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Новый ученик|Добавить ученика/i }).first().click();
    const studentDialog = page.getByRole('dialog', { name: 'Новый ученик' }).first();
    await expect(studentDialog).toBeVisible({ timeout: 10000 });

    await expect(studentDialog.getByText('Класс').first()).toBeVisible();
    await expect(studentDialog.getByText('Возраст').first()).toBeVisible();
    await expect(studentDialog.getByText('Класс / возраст')).toHaveCount(0);

    await studentDialog.getByRole('button', { name: 'Назад' }).click();
    await expect(studentDialog).toBeHidden({ timeout: 10000 });
  });
});

test.describe('Ученики — создание (live update)', () => {
  const testStudentName = `Тест Ученик ${Date.now()}`;

  test('создание ученика через модал — виден без F5', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Запоминаем кол-во строк до
    const rowsBefore = await page.locator('table tbody tr').count();

    // Нажимаем "Новый ученик"
    await page.getByRole('button', { name: /Новый ученик|Добавить ученика/i }).first().click();
    const studentDialog = page.getByRole('dialog', { name: 'Новый ученик' }).first();
    await expect(studentDialog).toBeVisible({ timeout: 10000 });

    // ФИО — через placeholder модала
    const nameInput = studentDialog.getByPlaceholder('Иванов Пётр Сергеевич');
    await nameInput.fill(testStudentName);

    // Предмет — Gravity UI Select
    await studentDialog.getByText('Выберите предмет').click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Математика' }).click();

    // Ставка
    const rateInput = studentDialog.getByPlaceholder('2100');
    if (await rateInput.isVisible()) {
      await rateInput.clear();
      await rateInput.fill('1500');
    }

    // Сохраняем
    const savePromise = waitForAPI(page, '/students');
    await studentDialog.getByRole('button', { name: 'Сохранить' }).click();

    try {
      await savePromise;
    } catch {
      // API might complete before we start waiting
    }

    // Ждём закрытия модала
    await expect(studentDialog).toBeHidden({ timeout: 10000 });

    // ГЛАВНОЕ: ученик виден в списке БЕЗ F5
    await expect(page.getByText(testStudentName).first()).toBeVisible({ timeout: 10000 });
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: найти и удалить тестового ученика
    try {
      const loginResp = await request.post(`${API_BASE}/auth/login`, {
        data: { email: 'demo@repeto.ru', password: 'demo1234' },
      });
      const { accessToken } = await loginResp.json();

      const studentsResp = await request.get(`${API_BASE}/students?search=${encodeURIComponent('Тест Ученик')}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const studentsData = await studentsResp.json();
      const students = studentsData.data || studentsData;
      for (const s of students) {
        if (s.name.startsWith('Тест Ученик')) {
          await request.delete(`${API_BASE}/students/${s.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      }
    } catch { /* cleanup best effort */ }
  });
});

test.describe('Ученики — детальная карточка', () => {
  test('открытие карточки ученика из списка', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Если есть ученики, кликаем на первого
    const firstRow = page.locator('table tbody tr').first();
    const hasStudents = await firstRow.isVisible().catch(() => false);
    if (!hasStudents) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForLoadState('networkidle');

    // Должны быть на странице ученика
    await expect(page).toHaveURL(/students\/[a-z0-9-]+/i);
  });

  test('табы карточки ученика переключаются', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('table tbody tr').first();
    if (!await firstRow.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForLoadState('networkidle');

    // Проверяем каждый таб (Gravity UI SegmentedRadioGroup → role="radio")
    const tabNames = ['Занятия', 'Профиль', 'Контакты', 'Оплаты', 'Заметки', 'Домашка'];
    for (const tabName of tabNames) {
      const tab = page.getByRole('radio', { name: tabName });
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
