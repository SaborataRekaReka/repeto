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

/* ═══════════════════════════════════════════════════════════════
   Journey 29 · StatCards — числа и навигация
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 29: StatCards — числа и навигация', () => {
  let page: Page;
  let token: string;
  let email: string;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    token = reg.accessToken;
    email = reg.email;

    const student = await createStudentAPI(page, token, { name: 'Стат Ученик' });

    // Completed lesson (for lessonsThisMonth > 0)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);
    const lesson = await createLessonAPI(page, token, student.id, {
      scheduledAt: yesterday.toISOString(),
    });
    await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'COMPLETED' },
    });

    // Payment (for incomeThisMonth > 0)
    await page.request.post(`${API}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId: student.id,
        amount: 2000,
        method: 'CASH',
        date: new Date().toISOString(),
      },
    });

    await loginAndGoto(page, '/dashboard', email, password);
    await page.waitForTimeout(2_000);
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('29.1 Активных учеников > 0', async () => {
    const card = page.locator('a.card[href="/students"]');
    const value = card.locator('.text-h4');
    await expect(value).toBeVisible();
    const text = await value.textContent();
    expect(text).not.toBe('0');
    expect(text).not.toBe('—');
  });

  test('29.2 Занятий в этом месяце — значение отображается', async () => {
    const card = page.locator('a.card[href="/schedule"]');
    const value = card.locator('.text-h4');
    await expect(value).toBeVisible();
    const text = await value.textContent();
    expect(text).not.toBe('—');
  });

  test('29.3 Доход за месяц содержит ₽', async () => {
    const card = page.locator('a.card[href="/finance"]');
    const value = card.locator('.text-h4');
    await expect(value).toBeVisible();
    const text = await value.textContent();
    expect(text).toMatch(/₽/);
  });

  test('29.4 К оплате учениками — карточка видна', async () => {
    const card = page.locator('a.card[href="/finance/payments"]');
    const value = card.locator('.text-h4');
    await expect(value).toBeVisible();
  });

  test('29.5 Клик по карточке «Ученики» → /students', async () => {
    await page.locator('a.card[href="/students"]').click();
    await page.waitForURL('**/students');
    await page.goto('/dashboard');
    await page.waitForTimeout(1_000);
  });
});

/* ═══════════════════════════════════════════════════════════════
   Journey 30 · TodaySchedule — виджет и LessonDetailModal
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 30: TodaySchedule — виджет и LessonDetailModal', () => {
  let page: Page;
  let token: string;
  let email: string;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    token = reg.accessToken;
    email = reg.email;

    const student = await createStudentAPI(page, token, { name: 'Сегодня Ученик' });

    // Lesson today at 15:00
    const today = new Date();
    today.setHours(15, 0, 0, 0);
    await createLessonAPI(page, token, student.id, {
      scheduledAt: today.toISOString(),
      subject: 'Физика',
    });

    await loginAndGoto(page, '/dashboard', email, password);
    await page.waitForTimeout(2_000);
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('30.1 Виджет «Сегодня» — заголовок с датой', async () => {
    const todayCard = page.locator('.card').filter({ hasText: 'Сегодня,' });
    await expect(todayCard).toBeVisible();
  });

  test('30.2 Урок отображается в виджете', async () => {
    const todayCard = page.locator('.card').filter({ hasText: 'Сегодня,' });
    const lessonBtn = todayCard.locator('button').first();
    await expect(lessonBtn).toBeVisible();
  });

  test('30.3 Клик по уроку → LessonDetailModal', async () => {
    const todayCard = page.locator('.card').filter({ hasText: 'Сегодня,' });
    await todayCard.locator('button').first().click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    await expect(modal.first()).toBeVisible({ timeout: 3_000 });
  });

  test('30.4 Модалка содержит предмет урока', async () => {
    await expect(page.getByText(/Математика/i).first()).toBeVisible();
  });

  test('30.5 Кнопка «Проведено» → статус меняется', async () => {
    // Modal should still be open from 30.3
    const completedBtn = page.getByRole('button', { name: /Проведено/i });
    await expect(completedBtn).toBeVisible({ timeout: 3_000 });
    await completedBtn.click();
    await page.waitForTimeout(1_000);

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Reload to confirm status change
    await page.reload();
    await page.waitForTimeout(2_000);

    const todayCard = page.locator('.card').filter({ hasText: 'Сегодня,' });
    // Green badge = completed status
    await expect(todayCard.getByText(/Проведено/i)).toBeVisible({ timeout: 5_000 });
  });
});

/* ═══════════════════════════════════════════════════════════════
   Journey 31 · DebtList — задолженности и навигация
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 31: DebtList — задолженности и навигация', () => {
  let page: Page;
  let token: string;
  let email: string;
  let studentId: string;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    token = reg.accessToken;
    email = reg.email;

    const student = await createStudentAPI(page, token, { name: 'Должник Тест' });
    studentId = student.id;

    // Completed lesson without payment = debt
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);
    const lesson = await createLessonAPI(page, token, student.id, {
      scheduledAt: yesterday.toISOString(),
    });
    await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'COMPLETED' },
    });

    await loginAndGoto(page, '/dashboard', email, password);
    await page.waitForTimeout(2_000);
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('31.1 Виджет «Задолженности» виден', async () => {
    const debtCard = page.locator('.card').filter({ hasText: 'Задолженности' });
    await expect(debtCard).toBeVisible();
  });

  test('31.2 Должник отображается в списке', async () => {
    const debtCard = page.locator('.card').filter({ hasText: 'Задолженности' });
    await expect(debtCard.getByText('Должник Тест')).toBeVisible({ timeout: 5_000 });
  });

  test('31.3 Сумма долга отображается красным', async () => {
    const debtCard = page.locator('.card').filter({ hasText: 'Задолженности' });
    const debtAmount = debtCard.locator('.text-pink-1');
    await expect(debtAmount.first()).toBeVisible();
  });

  test('31.4 Клик по должнику → страница ученика', async () => {
    const debtCard = page.locator('.card').filter({ hasText: 'Задолженности' });
    const link = debtCard.locator(`a[href="/students/${studentId}"]`).first();
    await link.click();
    await page.waitForURL(`**/students/${studentId}`);
    expect(page.url()).toContain('/students/');
    await page.goto('/dashboard');
    await page.waitForTimeout(1_000);
  });
});

/* ═══════════════════════════════════════════════════════════════
   Journey 32 · Последние оплаты + график дохода + конверсия
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 32: Последние оплаты, доход и конверсия', () => {
  let page: Page;
  let token: string;
  let email: string;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    token = reg.accessToken;
    email = reg.email;

    const student = await createStudentAPI(page, token, { name: 'Платящий Тест' });

    // Completed lesson
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);
    const lesson = await createLessonAPI(page, token, student.id, {
      scheduledAt: yesterday.toISOString(),
    });
    await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'COMPLETED' },
    });

    // Payment
    await page.request.post(`${API}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId: student.id,
        amount: 3000,
        method: 'CASH',
        date: new Date().toISOString(),
      },
    });

    await loginAndGoto(page, '/dashboard', email, password);
    await page.waitForTimeout(2_000);
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('32.1 Виджет «Последние оплаты» виден', async () => {
    const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
    await expect(card).toBeVisible();
  });

  test('32.2 Оплата отображается в таблице', async () => {
    const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
    await expect(card.getByText('Платящий Тест')).toBeVisible({ timeout: 5_000 });
  });

  test('32.3 Сумма оплаты видна', async () => {
    const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
    await expect(card.getByText(/3[\s\u00a0]?000/)).toBeVisible();
  });

  test('32.4 Статус оплаты — «Получен»', async () => {
    const card = page.locator('.card').filter({ hasText: 'Последние оплаты' });
    await expect(card.getByText('Получен')).toBeVisible();
  });

  test('32.5 Виджет «Доход» виден', async () => {
    const card = page.locator('.card').filter({ hasText: 'Итого за период' });
    await expect(card).toBeVisible();
  });

  test('32.6 Получено — сумма отображается', async () => {
    const card = page.locator('.card').filter({ hasText: 'Итого за период' });
    await expect(card.getByText(/Получено/).first()).toBeVisible({ timeout: 5_000 });
  });

  test('32.7 Итого за период — содержит ₽', async () => {
    const card = page.locator('.card').filter({ hasText: 'Итого за период' });
    const total = card.locator('.text-h5');
    await expect(total).toBeVisible();
    const text = await total.textContent();
    expect(text).toMatch(/₽/);
    expect(text).not.toBe('0 ₽');
  });

  test('32.8 Конверсия в оплату — процент виден', async () => {
    const card = page.locator('.card').filter({ hasText: 'Конверсия в оплату' });
    await expect(card).toBeVisible();
    const pct = card.locator('.text-h1');
    await expect(pct).toBeVisible();
  });
});

/* ═══════════════════════════════════════════════════════════════
   Journey 33 · Занятия на неделю + Истекающие пакеты
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 33: Занятия на неделю и истекающие пакеты', () => {
  let page: Page;
  let token: string;
  let email: string;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    token = reg.accessToken;
    email = reg.email;

    const student = await createStudentAPI(page, token, { name: 'Неделя Ученик' });

    // Lesson tomorrow (for WeekSchedule)
    await createLessonAPI(page, token, student.id, { subject: 'Английский' });

    await loginAndGoto(page, '/dashboard', email, password);
    await page.waitForTimeout(2_000);
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('33.1 Виджет «Занятия на неделю» виден', async () => {
    const card = page.locator('.card').filter({ hasText: 'Занятия на неделю' });
    await expect(card).toBeVisible();
  });

  test('33.2 Урок на неделю отображается', async () => {
    const card = page.locator('.card').filter({ hasText: 'Занятия на неделю' });
    await expect(card.getByText(/Математика/)).toBeVisible({ timeout: 5_000 });
  });

  test('33.3 Клик по уроку → LessonDetailModal', async () => {
    const card = page.locator('.card').filter({ hasText: 'Занятия на неделю' });
    await card.locator('button').first().click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"]');
    await expect(modal.first()).toBeVisible({ timeout: 3_000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('33.4 Виджет «Истекающие пакеты» виден', async () => {
    const card = page.locator('.card').filter({ hasText: 'Истекающие пакеты' });
    await expect(card).toBeVisible();
  });

  test('33.5 Без пакетов — пустое состояние', async () => {
    const card = page.locator('.card').filter({ hasText: 'Истекающие пакеты' });
    const emptyText = card.getByText(/нет пакетов|истекающим/i);
    await expect(emptyText).toBeVisible();
  });
});
