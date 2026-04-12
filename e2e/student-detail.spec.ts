/**
 * STUDENT DETAIL PAGE E2E TESTS
 * Tests: profile info, tabs, lessons tab, payments tab, notes, homework
 */
import { test, expect, API_BASE, getAuthToken } from './helpers/auth';

/** Get first student ID from API */
async function getFirstStudentId(page: import('@playwright/test').Page): Promise<string | null> {
  const token = await getAuthToken(page);
  const resp = await page.request.get(`${API_BASE}/students?limit=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok()) return null;
  const data = await resp.json();
  const students = data.data || data;
  return students.length > 0 ? students[0].id : null;
}

test.describe('Карточка ученика — профиль', () => {
  test('страница загружается с данными ученика', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    await page.goto(`/students/${studentId}`);
    await page.waitForLoadState('networkidle');

    // Имя ученика должно быть видно
    // Проверяем общую загрузку — табы должны быть
    const hasTab = await page.getByText('Занятия').first().isVisible().catch(() => false);
    expect(hasTab).toBeTruthy();
  });
});

test.describe('Карточка ученика — табы', () => {
  test('таб "Занятия" показывает историю', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    await page.goto(`/students/${studentId}`);
    await page.waitForLoadState('networkidle');

    await page.getByText('Занятия').first().click();
    await page.waitForTimeout(500);

    // Либо карточки занятий (с датой/временем/предметом), либо пусто
    const hasContent = await page.getByText(/Дата|Запланировано|Проведено|Отменено/i).first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/Нет занятий|пока нет/i).first().isVisible().catch(() => false);
    expect(hasContent || hasEmpty).toBeTruthy();
  });

  test('таб "Профиль" показывает данные', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    await page.goto(`/students/${studentId}?tab=profile`);
    await page.waitForLoadState('networkidle');

    // Должны быть поля: Предмет, Ставка и т.д.
    const hasProfileData = await page.getByText(/Предмет|Ставка|Ученик/i).first().isVisible().catch(() => false);
    expect(hasProfileData).toBeTruthy();
  });

  test('таб "Контакты" показывает контакт-данные', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    await page.goto(`/students/${studentId}?tab=contacts`);
    await page.waitForLoadState('networkidle');

    // Контактная информация
    const hasContacts = await page.getByText(/Телефон|WhatsApp|Контакт|Родител/i).first().isVisible().catch(() => false);
    expect(hasContacts).toBeTruthy();
  });

  test('таб "Оплаты" показывает историю оплат', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    await page.goto(`/students/${studentId}?tab=payments`);
    await page.waitForLoadState('networkidle');

    const hasPayments = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/Нет оплат|Оплаты/i).first().isVisible().catch(() => false);
    expect(hasPayments || hasEmpty).toBeTruthy();
  });

  test('таб "Заметки" — просмотр и добавление', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    await page.goto(`/students/${studentId}?tab=notes`);
    await page.waitForLoadState('networkidle');

    // Ищем кнопку добавления заметки или поле ввода
    const hasNoteInput = await page.locator('textarea, input[placeholder*="заметк" i]').first().isVisible().catch(() => false);
    const hasAddButton = await page.getByRole('button', { name: /добавить|новая заметка/i }).isVisible().catch(() => false);
    const hasNotes = await page.getByText(/Заметки|Нет заметок/i).first().isVisible().catch(() => false);

    expect(hasNoteInput || hasAddButton || hasNotes).toBeTruthy();
  });

  test('таб "Домашка" — просмотр', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    await page.goto(`/students/${studentId}?tab=homework`);
    await page.waitForLoadState('networkidle');

    const hasHomework = await page.getByText(/Домашка|домашн|задани/i).first().isVisible().catch(() => false);
    expect(hasHomework).toBeTruthy();
  });
});

test.describe('Карточка ученика — действия', () => {
  test('кнопка "Запланировать" открывает модал занятия', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    await page.goto(`/students/${studentId}`);
    await page.waitForLoadState('networkidle');

    const scheduleBtn = page.getByRole('button', { name: /Запланировать/i });
    if (await scheduleBtn.isVisible().catch(() => false)) {
      await scheduleBtn.click();
      await page.waitForTimeout(500);

      // Модал создания занятия должен открыться
      const modalVisible = await page.getByRole('button', { name: 'Сохранить' }).isVisible().catch(() => false);
      expect(modalVisible).toBeTruthy();

      // Закрываем
      await page.getByRole('button', { name: /Отмена|close/i }).first().click();
    }
  });

  test('кнопка "Записать оплату" открывает модал оплаты', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    await page.goto(`/students/${studentId}`);
    await page.waitForLoadState('networkidle');

    const paymentBtn = page.getByRole('button', { name: /Записать оплату/i });
    if (await paymentBtn.isVisible().catch(() => false)) {
      await paymentBtn.click();
      await page.waitForTimeout(500);

      // Модал создания оплаты
      const hasAmountField = await page.getByPlaceholder('4200').isVisible().catch(() => false);
      expect(hasAmountField).toBeTruthy();

      // Закрываем
      await page.getByRole('button', { name: /Отмена|close/i }).first().click();
    }
  });

  test('URL с ?tab= сохраняет активный таб', async ({ authedPage: page }) => {
    const studentId = await getFirstStudentId(page);
    if (!studentId) { test.skip(); return; }

    // Открываем сразу на табе "Оплаты"
    await page.goto(`/students/${studentId}?tab=payments`);
    await page.waitForLoadState('networkidle');

    // Проверяем, что таб URL сохранён
    expect(page.url()).toContain('tab=payments');
  });
});
