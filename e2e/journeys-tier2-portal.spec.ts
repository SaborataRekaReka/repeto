import { test, expect, Page } from '@playwright/test';
import { uniqueEmail, registerViaAPI, createStudentAPI, createLessonAPI, deleteAccount } from './helpers';

const API = 'http://127.0.0.1:3200/api';

/* ═══════════════════════════════════════════════════════════════
   Journey 41 · Портал ученика — контент всех вкладок
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 41: Портал ученика — контент всех вкладок', () => {
  let page: Page;
  let token: string;
  let portalToken: string;
  let slug: string;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password, name: 'Репетитор Тест' });
    token = reg.accessToken;
    slug = `pw-portal-${Date.now()}`;

    // Publish profile
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { slug, published: true },
    });

    // Create student
    const student = await createStudentAPI(page, token, { name: 'Портал Ученик', rate: 2500 });

    // Create upcoming lesson (tomorrow)
    await createLessonAPI(page, token, student.id, { rate: 2500 });

    // Create past lesson (yesterday) and mark completed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);
    const pastLesson = await createLessonAPI(page, token, student.id, {
      scheduledAt: yesterday.toISOString(),
      rate: 2500,
    });
    await page.request.patch(`${API}/lessons/${pastLesson.id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'COMPLETED' },
    });

    // Create a payment so balance is visible
    await page.request.post(`${API}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { studentId: student.id, amount: 5000, method: 'SBP' },
    });

    // Generate portal link
    const portalRes = await page.request.post(`${API}/students/${student.id}/portal-link`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(portalRes.ok()).toBe(true);
    const portalData = await portalRes.json();
    portalToken = portalData.token;

    // Navigate to portal
    await page.goto(`/t/${slug}/s/${portalToken}`);
    await page.waitForTimeout(2_000);
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('41.1 Портал загружен — имя ученика видно', async () => {
    await expect(page.getByText('Портал Ученик').first()).toBeVisible();
  });

  test('41.2 Информация о репетиторе видна', async () => {
    await expect(page.getByText('Репетитор Тест').first()).toBeVisible();
  });

  test('41.3 Вкладка «Занятия» — ближайшие занятия', async () => {
    await expect(page.getByText('Ближайшие занятия')).toBeVisible();
  });

  test('41.4 Прошедшие занятия видны', async () => {
    await expect(page.getByText('Прошедшие занятия')).toBeVisible();
  });

  test('41.5 Политика отмен видна', async () => {
    await expect(page.getByText('Политика отмен')).toBeVisible();
  });

  test('41.6 Вкладка «Домашка» — пустое состояние', async () => {
    await page.getByRole('button', { name: /Домашка/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Нет текущих заданий/i)).toBeVisible();
  });

  test('41.7 Вкладка «Материалы» — пустое состояние', async () => {
    await page.getByRole('button', { name: /Материалы/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Нет материалов/i)).toBeVisible();
  });

  test('41.8 Вкладка «Оплата» — баланс и ставка видны', async () => {
    await page.getByRole('button', { name: /Оплата/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Текущий баланс/i)).toBeVisible();
    await expect(page.getByText(/Ставка/i)).toBeVisible();
  });

  test('41.9 История оплат — оплата видна', async () => {
    await expect(page.getByText(/5\s?000/)).toBeVisible();
  });
});

/* ═══════════════════════════════════════════════════════════════
   Journey 42 · Портал — отмена урока (двойной клик) + отзыв
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 42: Портал — отмена урока и отзыв', () => {
  let page: Page;
  let token: string;
  let slug: string;
  let portalToken: string;
  let pastLessonId: string;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password, name: 'Репетитор Отмена' });
    token = reg.accessToken;
    slug = `pw-cancel-${Date.now()}`;

    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { slug, published: true },
    });

    const student = await createStudentAPI(page, token, { name: 'Ученик Отмена', rate: 2000 });

    // Upcoming lesson for cancellation
    await createLessonAPI(page, token, student.id);

    // Past lesson for feedback
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);
    const pastLesson = await createLessonAPI(page, token, student.id, {
      scheduledAt: yesterday.toISOString(),
    });
    pastLessonId = pastLesson.id;
    await page.request.patch(`${API}/lessons/${pastLesson.id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'COMPLETED' },
    });

    const portalRes = await page.request.post(`${API}/students/${student.id}/portal-link`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const portalData = await portalRes.json();
    portalToken = portalData.token;

    await page.goto(`/t/${slug}/s/${portalToken}`);
    await page.waitForTimeout(2_000);
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('42.1 Кнопка «Отменить» видна у ближайшего урока', async () => {
    await expect(page.getByRole('button', { name: /Отменить/i }).first()).toBeVisible();
  });

  test('42.2 Первый клик → confirmation box', async () => {
    await page.getByRole('button', { name: /Отменить/i }).first().click();
    await page.waitForTimeout(500);
    // Confirmation text should appear
    await expect(page.getByText(/Нажмите.*ещё раз|подтвержд/i).first()).toBeVisible({ timeout: 3_000 });
  });

  test('42.3 Второй клик → урок отменён', async () => {
    // Click the confirmation cancel button (now with pink border)
    await page.getByRole('button', { name: /Отменить/i }).first().click();
    await page.waitForTimeout(2_000);
    await page.reload();
    await page.waitForTimeout(2_000);
    // Upcoming section should now be empty (lesson removed)
    await expect(page.getByText(/Нет запланированных занятий/i)).toBeVisible({ timeout: 5_000 });
  });

  test('42.4 Отзыв через API → оценка видна', async () => {
    // Submit feedback via API (UI interaction with 5 circles is complex)
    await page.request.post(`${API}/portal/${portalToken}/lessons/${pastLessonId}/feedback`, {
      data: { rating: 5, feedback: 'Отлично!' },
    });
    await page.reload();
    await page.waitForTimeout(2_000);
    // Rating circles should show (5 filled)
    const filledCircles = page.locator('.bg-yellow-1');
    await expect(filledCircles.first()).toBeVisible({ timeout: 5_000 });
  });
});

/* ═══════════════════════════════════════════════════════════════
   Journey 43 · Портал — недействительная ссылка
   ═══════════════════════════════════════════════════════════════ */
test.describe('Journey 43: Портал — недействительная ссылка', () => {
  let page: Page;
  let token: string;
  let slug: string;
  const password = 'TestPass123!';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
    token = reg.accessToken;
    slug = `pw-invalid-${Date.now()}`;
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { slug, published: true },
    });
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('43.1 Невалидный токен → сообщение об ошибке', async () => {
    await page.goto(`/t/${slug}/s/invalid-token-abc123`);
    await page.waitForTimeout(2_000);
    await expect(page.getByText(/недействительна|не найден|Invalid/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('43.2 Сообщение предлагает обратиться к репетитору', async () => {
    await expect(page.getByText(/репетитор|актуальную ссылку/i).first()).toBeVisible();
  });
});
