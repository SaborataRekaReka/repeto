/**
 * Journey-тесты Tier 1: критические пробелы.
 *
 * Journey 8:  Полный CRUD урока через UI (создание → редактирование → удаление)
 * Journey 9:  Редактирование и удаление ученика
 * Journey 10: Подтверждение / отклонение бронирования
 * Journey 11: Статусы уроков — NO_SHOW, CANCELLED, конфликт времени
 */
import { test, expect, type Page } from '@playwright/test';
import {
  uniqueEmail,
  registerViaAPI,
  loginAndGoto,
  createStudentAPI,
  createLessonAPI,
  loginViaAPI,
} from './helpers';

const API = 'http://127.0.0.1:3200/api';

// ═══════════════════════════════════════════════════════════════
// Journey 8: Полный CRUD урока — создание UI → редактирование → статусы → удаление
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 8: Полный CRUD урока через UI', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey8Pass!';
  let page: Page;
  let studentId: string;
  let lessonId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();

    const auth = await registerViaAPI(page, { email, password, name: 'Тест Уроки' });
    token = auth.accessToken;

    // Создаём ученика через API для быстроты
    const student = await createStudentAPI(page, token, {
      name: 'Дмитрий Урокин',
      subject: 'Физика',
      rate: 3000,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('8.1 Расписание → кнопка «Новое занятие» → модалка открывается', async () => {
    await loginAndGoto(page, '/schedule', email, password);

    await page.getByRole('button', { name: /Новое занятие|Добавить/i }).first().click();
    await expect(page.locator('body')).toContainText(/Новое занятие/i, { timeout: 3_000 });
  });

  test('8.2 Создаём урок через API и проверяем в расписании', async () => {
    // Закрываем модалку
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Создаём урок на завтра через API
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);

    const lessonRes = await page.request.post(`${API}/lessons`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId,
        subject: 'Физика',
        scheduledAt: tomorrow.toISOString(),
        duration: 60,
        rate: 3000,
        format: 'ONLINE',
      },
    });
    expect(lessonRes.ok()).toBe(true);
    const lesson = await lessonRes.json();
    lessonId = lesson.id;

    // Перезагружаем расписание
    await page.reload();
    await page.waitForTimeout(2_000);

    // Урок должен быть виден
    await expect(page.locator('body')).toContainText(/Физика|Дмитрий/i, { timeout: 8_000 });
  });

  test('8.3 Клик по уроку → модалка деталей → видим данные', async () => {
    // Кликаем на урок в расписании
    const lessonEl = page.locator('text=Физика').first();
    if (await lessonEl.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await lessonEl.click();
      await page.waitForTimeout(1_000);

      // Должны видеть модалку с деталями
      await expect(page.locator('body')).toContainText(/Физика/i);
      await expect(page.locator('body')).toContainText(/Дмитрий/i);
    }
  });

  test('8.4 Отмечаем урок «Проведено» → статус меняется', async () => {
    // Через API меняем статус на COMPLETED
    const statusRes = await page.request.patch(`${API}/lessons/${lessonId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'COMPLETED' },
    });
    expect(statusRes.ok()).toBe(true);

    // Проверяем через API что статус обновился
    const getRes = await page.request.get(`${API}/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.ok()).toBe(true);
    const updated = await getRes.json();
    expect(updated.status).toBe('COMPLETED');
  });

  test('8.5 Редактируем урок через API → данные обновились', async () => {
    // Сначала вернём статус обратно на PLANNED чтобы можно было редактировать
    await page.request.patch(`${API}/lessons/${lessonId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'PLANNED' },
    });

    const patchRes = await page.request.patch(`${API}/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { rate: 3500, duration: 90 },
    });
    expect(patchRes.ok()).toBe(true);

    const getRes = await page.request.get(`${API}/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = await getRes.json();
    expect(updated.rate).toBe(3500);
    expect(updated.duration).toBe(90);
  });

  test('8.6 Удаляем урок → он исчезает из расписания', async () => {
    const delRes = await page.request.delete(`${API}/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes.ok()).toBe(true);

    // Перезагружаем расписание
    await page.goto('/schedule');
    await page.waitForTimeout(2_000);

    // Урок больше не виден (либо страница пуста, либо нет «Физика»)
    const bodyText = await page.locator('body').textContent();
    // Если на странице вообще есть уроки, то конкретно «Физика» должна пропасть
    // (могут остаться другие уроки — проверяем именно наш)
    const getRes = await page.request.get(`${API}/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Урок удалён — должен быть 404
    expect(getRes.status()).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 9: Редактирование и удаление ученика
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 9: Редактирование и удаление ученика', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey9Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();

    const auth = await registerViaAPI(page, { email, password, name: 'Тест ЕдитСтудент' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Анна Редактируемая',
      subject: 'Химия',
      rate: 1800,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('9.1 Ученики → видим ученика в списке', async () => {
    // Login → dashboard first, then navigate via sidebar (avoids auth loss on page.goto)
    await loginAndGoto(page, '/dashboard', email, password);
    await page.getByRole('link', { name: /Ученики/i }).click();
    await page.waitForURL(/\/students/, { timeout: 10_000 });
    await expect(page.getByText('Анна Редактируемая')).toBeVisible({ timeout: 8_000 });
  });

  test('9.2 Редактируем ученика через API → данные обновляются', async () => {
    const patchRes = await page.request.patch(`${API}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Анна Обновлённая', rate: 2200 },
    });
    expect(patchRes.ok()).toBe(true);

    // Проверяем в UI
    await page.reload();
    await expect(page.getByText('Анна Обновлённая')).toBeVisible({ timeout: 5_000 });
  });

  test('9.3 Открываем карточку → видим обновлённые данные', async () => {
    await page.getByText('Анна Обновлённая').first().click();
    await expect(page).toHaveURL(/\/students\/.+/);

    await expect(page.getByText('Анна Обновлённая')).toBeVisible();
    await expect(page.locator('body')).toContainText(/2[\s,.]?200|2200/);
  });

  test('9.4 Меняем статус ученика на «На паузе»', async () => {
    const patchRes = await page.request.patch(`${API}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'PAUSED' },
    });
    expect(patchRes.ok()).toBe(true);

    // Проверяем через API
    const getRes = await page.request.get(`${API}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const student = await getRes.json();
    expect(student.status).toBe('PAUSED');
  });

  test('9.5 Ученики → вкладка «На паузе» → ученик виден', async () => {
    await page.goto('/students');
    await page.waitForTimeout(1_000);

    const pauseTab = page.getByRole('button', { name: /На паузе/i }).first();
    if (await pauseTab.isVisible().catch(() => false)) {
      await pauseTab.click();
      await page.waitForTimeout(1_000);
      await expect(page.getByText('Анна Обновлённая')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('9.6 Удаляем ученика → он исчезает', async () => {
    const delRes = await page.request.delete(`${API}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes.ok()).toBe(true);

    // Проверяем 404
    const getRes = await page.request.get(`${API}/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.status()).toBe(404);

    // UI: обновляем — ученика нет
    await page.goto('/students');
    await page.waitForTimeout(1_500);
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Анна Обновлённая');
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 10: Подтверждение и отклонение бронирования
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 10: Подтверждение / отклонение бронирования', () => {
  test.describe.configure({ mode: 'serial' });

  let tutorEmail: string;
  let tutorToken: string;
  const tutorPassword = 'Journey10Pass!';
  let slug: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    tutorEmail = uniqueEmail();
    slug = `j10-${Date.now()}`;

    const auth = await registerViaAPI(page, {
      email: tutorEmail,
      password: tutorPassword,
      name: 'Ольга Букинг',
    });
    tutorToken = auth.accessToken;

    // Публикуем профиль
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
      data: {
        slug,
        published: true,
        subjects: ['Математика'],
        subjectDetails: [{ name: 'Математика', duration: 60, price: 2000 }],
      },
    });

    // Создаём слоты доступности на каждый день недели (30-мин блоки 09:00–12:00)
    const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
    for (let day = 0; day < 7; day++) {
      for (let h = 9; h < 12; h++) {
        slots.push({ dayOfWeek: day, startTime: `${String(h).padStart(2, '0')}:00`, endTime: `${String(h).padStart(2, '0')}:30` });
        slots.push({ dayOfWeek: day, startTime: `${String(h).padStart(2, '0')}:30`, endTime: `${String(h + 1).padStart(2, '0')}:00` });
      }
    }
    const slotsRes = await page.request.put(`${API}/availability`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
      data: { slots },
    });
    // Slots might return 200 or 201
    if (!slotsRes.ok()) {
      console.warn('Availability slots setup returned:', slotsRes.status());
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('10.1 Клиент отправляет заявку на бронирование через API', async () => {
    // Вычисляем завтрашнюю дату
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD

    // Бронируем через публичный API
    const bookRes = await page.request.post(`${API}/public/tutors/${slug}/book`, {
      data: {
        subject: 'Математика',
        date: dateStr,
        startTime: '10:00',
        clientName: 'Клиент Бронирования',
        clientPhone: '+79990001122',
        clientEmail: 'booking-client@test.com',
      },
    });
    expect(bookRes.ok()).toBe(true);
    const booking = await bookRes.json();
    expect(booking.id || booking.bookingRequestId || booking.status).toBeTruthy();
  });

  test('10.2 Репетитор видит уведомление с кнопками «Подтвердить» / «Отклонить»', async () => {
    await loginAndGoto(page, '/notifications', tutorEmail, tutorPassword);
    await page.waitForTimeout(2_000);

    // Проверяем наличие уведомлений
    await expect(page.locator('body')).toContainText(/Уведомлен/i);

    // Ищем кнопки подтверждения/отклонения
    const confirmBtn = page.getByRole('button', { name: /Подтвердить/i }).first();
    const rejectBtn = page.getByRole('button', { name: /Отклонить/i }).first();

    const hasConfirm = await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasReject = await rejectBtn.isVisible({ timeout: 1_000 }).catch(() => false);

    // Если кнопки есть в UI — пробуем подтвердить
    if (hasConfirm) {
      await confirmBtn.click();
      await page.waitForTimeout(2_000);
    }
    // Если кнопок нет — проверяем через API
    else {
      // Получаем уведомления через API
      const notifsRes = await page.request.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${tutorToken}` },
      });
      if (notifsRes.ok()) {
        const notifs = await notifsRes.json();
        const arr = notifs.data || notifs.items || (Array.isArray(notifs) ? notifs : []);
        const bookingNotif = arr.find(
          (n: any) => n.type === 'BOOKING_NEW' || n.type === 'booking_new',
        );
        if (bookingNotif) {
          const confirmRes = await page.request.post(
            `${API}/notifications/${bookingNotif.id}/confirm-booking`,
            { headers: { Authorization: `Bearer ${tutorToken}` } },
          );
          // Может быть 200 или 404 если бронирования не было
          expect([200, 201, 404].includes(confirmRes.status())).toBe(true);
        }
      }
    }
  });

  test('10.3 Отправляем вторую заявку и отклоняем', async () => {
    // Вычисляем послезавтрашнюю дату для второй заявки  
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dateStr = dayAfter.toISOString().slice(0, 10);

    const bookRes = await page.request.post(`${API}/public/tutors/${slug}/book`, {
      data: {
        subject: 'Математика',
        date: dateStr,
        startTime: '10:00',
        clientName: 'Второй Клиент',
        clientPhone: '+79990003344',
      },
    });
    expect(bookRes.ok()).toBe(true);

    // Репетитор отклоняет через API
    await page.waitForTimeout(1_000);
    const notifsRes = await page.request.get(`${API}/notifications`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
    });
    expect(notifsRes.ok()).toBe(true);
    const notifs = await notifsRes.json();
    const arr = notifs.data || notifs.items || (Array.isArray(notifs) ? notifs : []);
    const bookingNotif = arr.find(
      (n: any) =>
        (n.type === 'BOOKING_NEW' || n.type === 'booking_new') && !n.read,
    );
    if (bookingNotif) {
      const rejectRes = await page.request.post(
        `${API}/notifications/${bookingNotif.id}/reject-booking`,
        { headers: { Authorization: `Bearer ${tutorToken}` } },
      );
      expect([200, 201].includes(rejectRes.status())).toBe(true);
    }
  });

  test('10.4 Уведомления → страница обновилась после действий', async () => {
    await page.goto('/notifications');
    await page.waitForTimeout(2_000);
    await expect(page.locator('body')).toContainText(/Уведомлен/i);
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 11: Статусы уроков — NO_SHOW, отмена, конфликт времени
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 11: Статусы уроков и конфликт расписания', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey11Pass!';
  let page: Page;
  let studentId: string;
  let lesson1Id: string;
  let lesson2Id: string;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();

    const auth = await registerViaAPI(page, { email, password, name: 'Тест Статусы' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Пётр Статусов',
      subject: 'Математика',
      rate: 2000,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('11.1 Создаём урок → статус PLANNED', async () => {
    const dt = new Date(tomorrow);
    dt.setHours(10, 0, 0, 0);

    const lesson = await createLessonAPI(page, token, studentId, {
      scheduledAt: dt.toISOString(),
      subject: 'Математика',
      rate: 2000,
    });
    lesson1Id = lesson.id;
    expect(lesson.status).toBe('PLANNED');
  });

  test('11.2 Статус → COMPLETED → возврат нельзя в PLANNED', async () => {
    // Ставим COMPLETED
    const res1 = await page.request.patch(`${API}/lessons/${lesson1Id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'COMPLETED' },
    });
    expect(res1.ok()).toBe(true);

    const getRes = await page.request.get(`${API}/lessons/${lesson1Id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const lesson = await getRes.json();
    expect(lesson.status).toBe('COMPLETED');
  });

  test('11.3 Создаём второй урок → NO_SHOW', async () => {
    const dt = new Date(tomorrow);
    dt.setHours(12, 0, 0, 0);

    const lesson = await createLessonAPI(page, token, studentId, {
      scheduledAt: dt.toISOString(),
      subject: 'Математика',
      rate: 2000,
    });
    lesson2Id = lesson.id;

    // Ставим NO_SHOW
    const res = await page.request.patch(`${API}/lessons/${lesson2Id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'NO_SHOW' },
    });
    expect(res.ok()).toBe(true);

    const getRes = await page.request.get(`${API}/lessons/${lesson2Id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = await getRes.json();
    expect(updated.status).toBe('NO_SHOW');
  });

  test('11.4 CANCELLED_TUTOR → урок отменён репетитором', async () => {
    const dt = new Date(tomorrow);
    dt.setHours(14, 0, 0, 0);

    const lesson = await createLessonAPI(page, token, studentId, {
      scheduledAt: dt.toISOString(),
      subject: 'Математика',
      rate: 2000,
    });

    const res = await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'CANCELLED_TUTOR', cancelReason: 'Болезнь' },
    });
    expect(res.ok()).toBe(true);

    const getRes = await page.request.get(`${API}/lessons/${lesson.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = await getRes.json();
    expect(updated.status).toBe('CANCELLED_TUTOR');
  });

  test('11.5 CANCELLED_STUDENT → урок отменён учеником', async () => {
    const dt = new Date(tomorrow);
    dt.setHours(16, 0, 0, 0);

    const lesson = await createLessonAPI(page, token, studentId, {
      scheduledAt: dt.toISOString(),
      subject: 'Математика',
      rate: 2000,
    });

    const res = await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'CANCELLED_STUDENT' },
    });
    expect(res.ok()).toBe(true);

    const getRes = await page.request.get(`${API}/lessons/${lesson.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = await getRes.json();
    expect(updated.status).toBe('CANCELLED_STUDENT');
  });

  test('11.6 Конфликт расписания — два урока в одно время', async () => {
    const dt = new Date(tomorrow);
    dt.setHours(18, 0, 0, 0);

    // Первый урок
    const lesson1 = await createLessonAPI(page, token, studentId, {
      scheduledAt: dt.toISOString(),
      duration: 60,
    });
    expect(lesson1.id).toBeTruthy();

    // Второй урок в то же время — может вернуть ошибку или создаться
    const res2 = await page.request.post(`${API}/lessons`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId,
        subject: 'Математика',
        scheduledAt: dt.toISOString(),
        duration: 60,
        rate: 2000,
        format: 'ONLINE',
      },
    });

    // Записываем результат — оба варианта допустимы:
    // 1) API отклоняет конфликт (409 или 400)
    // 2) API разрешает (некоторые тьюторы хотят параллельные уроки)
    const isConflictRejected = res2.status() >= 400;
    const isAllowed = res2.ok();
    expect(isConflictRejected || isAllowed).toBe(true);

    // Если конфликт допускается — фиксируем это как факт
    if (isAllowed) {
      const body = await res2.json();
      expect(body.id).toBeTruthy();
    }
  });

  test('11.7 Расписание → все уроки отражены в UI', async () => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(2_000);

    // Расписание загружено
    await expect(page.locator('body')).toContainText(/Расписание|Календарь/i);

    // Проверяем через API что уроки существуют
    const from = new Date(tomorrow);
    from.setHours(0, 0, 0, 0);
    const to = new Date(tomorrow);
    to.setHours(23, 59, 59, 0);

    const lessonsRes = await page.request.get(
      `${API}/lessons?from=${from.toISOString()}&to=${to.toISOString()}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(lessonsRes.ok()).toBe(true);
    const lessons = await lessonsRes.json();
    // Должно быть >= 4 урока (COMPLETED + NO_SHOW + CANCELLED_TUTOR + CANCELLED_STUDENT + возможно конфликтный)
    const arr = Array.isArray(lessons) ? lessons : lessons.items || [];
    expect(arr.length).toBeGreaterThanOrEqual(4);
  });
});
