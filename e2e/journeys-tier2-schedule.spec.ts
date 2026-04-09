/**
 * Этап 3 · Расписание — все виды и навигация
 *
 * Journey 24: Переключение видов Month → Week → Day
 * Journey 25: Навигация стрелками ← →
 * Journey 26: Клик по дню в месяце → Day view
 * Journey 27: Уроки отображаются в Week и Day
 * Journey 28: LessonDetailModal из расписания + действия
 */
import { test, expect, type Page } from '@playwright/test';
import {
  uniqueEmail,
  registerViaAPI,
  loginAndGoto,
  createStudentAPI,
  createLessonAPI,
} from './helpers';

const API = 'http://127.0.0.1:3200/api';

// ═══════════════════════════════════════════════════════════════
// Journey 24: Переключение видов Month → Week → Day
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 24: Переключение видов расписания', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey24Pass!';
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    await registerViaAPI(page, { email, password, name: 'Вид Тест' });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('24.1 По умолчанию открыт вид «Месяц»', async () => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(1_000);

    // Кнопка «Месяц» активна (имеет bg-n-1)
    const monthBtn = page.getByRole('button', { name: 'Месяц' });
    await expect(monthBtn).toBeVisible({ timeout: 5_000 });
    await expect(monthBtn).toHaveClass(/bg-n-1/);

    // Видны дни недели
    await expect(page.getByText('Пн').first()).toBeVisible();
    await expect(page.getByText('Вс').first()).toBeVisible();
  });

  test('24.2 Клик «Неделя» → вид меняется', async () => {
    await page.getByRole('button', { name: 'Неделя' }).click();
    await page.waitForTimeout(500);

    // Кнопка «Неделя» стала активной
    await expect(page.getByRole('button', { name: 'Неделя' })).toHaveClass(/bg-n-1/);
    // Кнопка «Месяц» больше не активна
    await expect(page.getByRole('button', { name: 'Месяц' })).not.toHaveClass(/bg-n-1/);

    // Видны временные метки (часы)
    await expect(page.getByText('8:00').first()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('12:00').first()).toBeVisible();
  });

  test('24.3 Клик «День» → вид меняется', async () => {
    await page.getByRole('button', { name: 'День' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: 'День' })).toHaveClass(/bg-n-1/);

    // Видны временные метки
    await expect(page.getByText('8:00').first()).toBeVisible({ timeout: 3_000 });

    // Заголовок содержит название дня недели и число
    const label = page.locator('.text-h6').first();
    await expect(label).toContainText(/\d{1,2}/);
  });

  test('24.4 Клик «Месяц» → возврат к месячному виду', async () => {
    await page.getByRole('button', { name: 'Месяц' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: 'Месяц' })).toHaveClass(/bg-n-1/);
    // Дни недели снова видны
    await expect(page.getByText('Пн').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 25: Навигация стрелками ← →
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 25: Навигация стрелками', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey25Pass!';
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    await registerViaAPI(page, { email, password, name: 'Навигация Тест' });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('25.1 Месяц: заголовок показывает текущий месяц', async () => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(1_000);

    const label = page.locator('.text-h6').first();
    const now = new Date();
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ];
    await expect(label).toContainText(monthNames[now.getMonth()]);
    await expect(label).toContainText(String(now.getFullYear()));
  });

  test('25.2 Стрелка вправо → следующий месяц', async () => {
    // Кнопки навигации — < и > рядом с заголовком
    const nextBtn = page.locator('button.btn-stroke.btn-square').nth(1);
    await nextBtn.click();
    await page.waitForTimeout(500);

    const label = page.locator('.text-h6').first();
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1);
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ];
    await expect(label).toContainText(monthNames[nextMonth.getMonth()]);
  });

  test('25.3 Стрелка влево → возврат к текущему месяцу', async () => {
    const prevBtn = page.locator('button.btn-stroke.btn-square').first();
    await prevBtn.click();
    await page.waitForTimeout(500);

    const label = page.locator('.text-h6').first();
    const now = new Date();
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ];
    await expect(label).toContainText(monthNames[now.getMonth()]);
  });

  test('25.4 Неделя: стрелки переключают на ±7 дней', async () => {
    await page.getByRole('button', { name: 'Неделя' }).click();
    await page.waitForTimeout(500);

    const label = page.locator('.text-h6').first();
    const textBefore = await label.textContent();

    // Следующая неделя
    const nextBtnW = page.locator('button.btn-stroke.btn-square').nth(1);
    await nextBtnW.click();
    await page.waitForTimeout(500);

    const textAfter = await label.textContent();
    expect(textAfter).not.toBe(textBefore);
  });

  test('25.5 День: стрелки переключают на ±1 день', async () => {
    await page.getByRole('button', { name: 'День' }).click();
    await page.waitForTimeout(500);

    const label = page.locator('.text-h6').first();
    const textBefore = await label.textContent();

    const nextBtnD = page.locator('button.btn-stroke.btn-square').nth(1);
    await nextBtnD.click();
    await page.waitForTimeout(500);

    const textAfter = await label.textContent();
    expect(textAfter).not.toBe(textBefore);
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 26: Кнопка «Новое занятие» из расписания
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 26: Кнопка «Новое занятие» из расписания', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey26Pass!';
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Новое Занятие Тест' });
    token = auth.accessToken;

    await createStudentAPI(page, token, {
      name: 'Расписанный Ученик',
      subject: 'Английский',
      rate: 2500,
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('26.1 Кнопка «Новое занятие» видна на странице', async () => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(1_000);

    await expect(
      page.getByRole('button', { name: /Новое занятие/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('26.2 Клик → модалка создания урока', async () => {
    await page.getByRole('button', { name: /Новое занятие/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новое занятие/i);
  });

  test('26.3 Закрыть модалку → расписание на месте', async () => {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3_000 });

    await expect(page.getByText('Пн').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 27: Уроки отображаются во всех видах
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 27: Уроки во всех видах расписания', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey27Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Виды Тест' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Видовой Ученик',
      subject: 'Химия',
      rate: 1800,
    });
    studentId = student.id;

    // Урок на завтра в 14:00 (по умолчанию из createLessonAPI)
    await createLessonAPI(page, token, studentId, {
      subject: 'Химия',
      rate: 1800,
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('27.1 Вид «Месяц» — урок виден как LessonDot', async () => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(1_000);

    // Урок отображается с именем ученика и предметом
    await expect(page.locator('button').filter({ hasText: /Химия/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('27.2 Вид «Неделя» — урок виден в сетке', async () => {
    await page.getByRole('button', { name: 'Неделя' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('button').filter({ hasText: /Химия/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('27.3 Вид «День» — урок виден в тайм-слоте', async () => {
    // Переключаемся на день
    await page.getByRole('button', { name: 'День' }).click();
    await page.waitForTimeout(500);

    // Переходим на завтра (урок на завтра)
    const nextBtn = page.locator('button.btn-stroke.btn-square').nth(1);
    await nextBtn.click();
    await page.waitForTimeout(500);

    // Урок с предметом «Химия» виден
    await expect(page.locator('button').filter({ hasText: /Химия/ }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('27.4 Время урока отображается в Day view', async () => {
    // В Day view рядом с уроком показано время 14:00
    await expect(page.getByText('14:00').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 28: LessonDetailModal из расписания + действия
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 28: LessonDetailModal из расписания', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey28Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Модалка Расписание' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Модальный Ученик',
      subject: 'Физика',
      rate: 2200,
    });
    studentId = student.id;

    await createLessonAPI(page, token, studentId, {
      subject: 'Физика',
      rate: 2200,
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('28.1 Клик по уроку в Month → LessonDetailModal', async () => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(1_000);

    // Кликаем по LessonDot с предметом «Физика»
    const lessonDot = page.locator('button').filter({ hasText: /Физика/ }).first();
    await lessonDot.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3_000 });
    await expect(dialog).toContainText('Физика');
    await expect(dialog).toContainText('Модальный Ученик');
  });

  test('28.2 Модалка содержит данные урока', async () => {
    const dialog = page.getByRole('dialog');

    // Статус
    await expect(dialog.getByText(/Запланировано/i)).toBeVisible();

    // Детали: дата, время, длительность, ставка
    await expect(dialog.getByText(/Дата/)).toBeVisible();
    await expect(dialog.getByText(/Время/)).toBeVisible();
    await expect(dialog.getByText(/60 мин/)).toBeVisible();
    await expect(dialog).toContainText(/2[\s,.]?200|2200/);
  });

  test('28.3 Кнопка «Проведено» → статус меняется', async () => {
    const dialog = page.getByRole('dialog');
    const completedBtn = dialog.getByRole('button', { name: /Проведено/i });
    await expect(completedBtn).toBeVisible();
    await completedBtn.click();

    // Модалка может обновиться или закрыться
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });

  test('28.4 После «Проведено» — урок обновился в расписании', async () => {
    // Перезагрузка для получения актуального статуса
    await page.reload();
    await page.waitForTimeout(2_000);

    // Точка урока теперь фиолетовая (bg-purple-1 = completed)
    const lessonDot = page.locator('button').filter({ hasText: /Физика/ }).first();
    await expect(lessonDot).toBeVisible({ timeout: 5_000 });

    // Проверяем что рядом с уроком есть фиолетовая точка
    const purpleDot = lessonDot.locator('.bg-purple-1');
    await expect(purpleDot).toBeVisible();
  });

  test('28.5 Создаём второй урок и отменяем его', async () => {
    // Создаём ещё один урок на завтра через API
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 1);
    dayAfter.setHours(16, 0, 0, 0);

    await createLessonAPI(page, token, studentId, {
      subject: 'Физика',
      rate: 2200,
      scheduledAt: dayAfter.toISOString(),
    });

    // Перезагружаем расписание
    await page.reload();
    await page.waitForTimeout(2_000);

    // Находим вторую LessonDot с Физикой (которая ещё planned)
    const lessonDots = page.locator('button').filter({ hasText: /Физика/ });
    const plannedDot = lessonDots.locator(':scope', { has: page.locator('.bg-green-1') }).first();
    await plannedDot.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3_000 });
  });

  test('28.6 Кнопка «Отменить» → подтверждение → урок отменён', async () => {
    const dialog = page.getByRole('dialog');
    const cancelBtn = dialog.getByRole('button', { name: /Отменить/i });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Может появиться подтверждение
    const confirmBtn = page.getByRole('button', { name: /Подтвердить|Да|Отменить занятие/i });
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });

  test('28.7 Отменённый урок — точка розовая', async () => {
    await page.reload();
    await page.waitForTimeout(2_000);

    // Ищем LessonDot с розовой точкой (cancelled)
    const pinkDot = page.locator('button').filter({ hasText: /Физика/ })
      .locator('.bg-pink-1');
    await expect(pinkDot.first()).toBeVisible({ timeout: 5_000 });
  });
});
