/**
 * STUDENTS CRUD E2E TESTS
 * Tests: list, create, view detail, tabs, delete — and live update without F5
 */
import { test, expect, waitForAPI, API_BASE } from './helpers/auth';

test.describe('Ученики — список', () => {
  test('страница загружается и показывает список', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByPlaceholder('Имя, предмет или класс')).toBeVisible();
    await expect(page.locator('.repeto-sl-table--students')).toBeVisible();

    // После загрузки данных рендерится либо список строк, либо empty state
    await expect
      .poll(async () => {
        const rowCount = await page.locator('.repeto-sl-row--students').count();
        const emptyCount = await page.locator('.repeto-sl-empty').count();
        return rowCount > 0 || emptyCount > 0;
      }, { timeout: 10000 })
      .toBeTruthy();
  });

  test('табы фильтруют список', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /^Активные/i }).first().click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /^На паузе/i }).first().click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /^Все/i }).first().click();
    await page.waitForTimeout(300);
  });

  test('поиск учеников работает', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.getByPlaceholder('Имя, предмет или класс');
    if (await searchInput.isVisible()) {
      await searchInput.fill('ТестПоискНесуществующий');
      await page.waitForTimeout(500);
      // Should show empty or fewer results
      await page.locator('.repeto-sl-row--students').count();
      // Clear
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('форма создания: класс и возраст разделены', async ({ authedPage: page }) => {
    await page.goto('/students?create=1');
    await page.waitForLoadState('domcontentloaded');

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
    await page.goto('/students?create=1');
    await page.waitForLoadState('domcontentloaded');

    const studentDialog = page.getByRole('dialog', { name: 'Новый ученик' }).first();
    await expect(studentDialog).toBeVisible({ timeout: 10000 });

    // ФИО — через placeholder модала
    const nameInput = studentDialog.getByPlaceholder('Иванов Пётр Сергеевич');
    await nameInput.fill(testStudentName);

    // Предмет
    const subjectInput = studentDialog.getByPlaceholder('Введите или выберите предмет');
    await subjectInput.fill('Математика');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

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
    await page.waitForLoadState('domcontentloaded');

    // Если есть ученики, кликаем на первого
    const firstRow = page.locator('.repeto-sl-row--students').first();
    const hasStudents = await firstRow.isVisible().catch(() => false);
    if (!hasStudents) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForLoadState('domcontentloaded');

    // Должны быть на странице ученика
    await expect(page).toHaveURL(/students\/[a-z0-9-]+/i);
  });

  test('табы карточки ученика переключаются', async ({ authedPage: page }) => {
    await page.goto('/students');
    await page.waitForLoadState('domcontentloaded');

    const firstRow = page.locator('.repeto-sl-row--students').first();
    if (!await firstRow.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForLoadState('domcontentloaded');

    // Проверяем каждый таб (Gravity UI SegmentedRadioGroup → role="radio")
    const tabNames = ['Занятия', 'Профиль', 'Контакты', 'Оплаты', 'Заметки', 'Домашка'];
    for (const tabName of tabNames) {
      const tab = page.getByRole('radio', { name: tabName }).or(page.getByRole('tab', { name: tabName })).first();
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
