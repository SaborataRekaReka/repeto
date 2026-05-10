/**
 * SCHEDULE / LESSONS E2E TESTS
 * Tests: calendar views, create lesson, lesson detail modal, status changes, delete
 */
import { test, expect, API_BASE, getAuthToken, loginViaUI } from './helpers/auth';

const isAuthScreen = async (page: any) => {
  if (/\/(auth|registration)(?:\?|#|$)/.test(page.url())) {
    return true;
  }

  const hasEmail = await page.getByPlaceholder('email@example.com').first().isVisible().catch(() => false);
  const hasPassword = await page.getByPlaceholder('Введите пароль').first().isVisible().catch(() => false);
  if (hasEmail && hasPassword) {
    return true;
  }

  return page
    .getByRole('heading', { name: /Вход в Repeto/i })
    .first()
    .isVisible()
    .catch(() => false);
};

const gotoAuthed = async (page: any, path: string) => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(path, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);

      if (await isAuthScreen(page)) {
        await loginViaUI(page);
        await page.goto(path, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });
        await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
      }

      if (!(await isAuthScreen(page))) {
        return;
      }

      lastError = new Error(`Protected path ${path} resolved to auth screen`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    await page.waitForTimeout(500 * (attempt + 1));
  }

  throw lastError ?? new Error(`Unable to open protected path ${path}`);
};

const ensureSchedulePageReady = async (page: any, path = '/schedule') => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await gotoAuthed(page, path);

    const viewSelect = page.locator('.repeto-schedule-view-select').first();
    if (await viewSelect.isVisible({ timeout: 6000 }).catch(() => false)) {
      return;
    }

    if (await isAuthScreen(page)) {
      await loginViaUI(page);
      continue;
    }

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
    await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => null);
  }

  throw new Error(`Schedule UI did not become ready for ${path}`);
};

const openLessonModal = async (page: any) => {
  const lessonDialog = page
    .locator("[aria-label='Новое занятие'], [aria-label^='Занятие:'], .lp2[role='dialog'], .repeto-lp[role='dialog']")
    .first();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await gotoAuthed(page, '/schedule?create=1');

    if (await lessonDialog.isVisible({ timeout: 10000 }).catch(() => false)) {
      return lessonDialog;
    }

    await ensureSchedulePageReady(page, '/schedule');

    const createButton = page
      .getByRole('button', { name: /Новое занятие|Добавить занятие/i })
      .first();

    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      if (await lessonDialog.isVisible({ timeout: 10000 }).catch(() => false)) {
        return lessonDialog;
      }
    }
  }

  await expect(lessonDialog).toBeVisible({ timeout: 10000 });
  return lessonDialog;
};

const switchCalendarView = async (page: any, viewLabel: 'Месяц' | 'Неделя' | 'День') => {
  const viewSelect = page.locator('.repeto-schedule-view-select').first();

  if (!(await viewSelect.isVisible({ timeout: 6000 }).catch(() => false))) {
    await ensureSchedulePageReady(page, '/schedule');
  }

  await expect(viewSelect).toBeVisible({ timeout: 10000 });
  await viewSelect.click();
  await page.getByRole('option', { name: viewLabel }).first().click();
  await page.waitForTimeout(400);
};

test.describe('Расписание — отображение', () => {
  test('календарь загружается (вид Месяц)', async ({ authedPage: page }) => {
    await ensureSchedulePageReady(page, '/schedule');

    const viewSelect = page.locator('.repeto-schedule-view-select').first();
    await expect(viewSelect).toBeVisible({ timeout: 10000 });

    await viewSelect.click();
    await expect(page.getByRole('option', { name: 'Месяц' }).first()).toBeVisible();
    await expect(page.getByRole('option', { name: 'Неделя' }).first()).toBeVisible();
    await expect(page.getByRole('option', { name: 'День' }).first()).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('переключение видов: Месяц → Неделя → День', async ({ authedPage: page }) => {
    await ensureSchedulePageReady(page, '/schedule');

    await switchCalendarView(page, 'Неделя');
    await switchCalendarView(page, 'День');
    await switchCalendarView(page, 'Месяц');
  });

  test('навигация по месяцам (стрелки < >)', async ({ authedPage: page }) => {
    await ensureSchedulePageReady(page, '/schedule');

    // Нажимаем "назад" (предыдущий месяц)
    const prevButton = page.getByRole('button', { name: /назад|prev|</i }).or(
      page.locator('button').filter({ has: page.locator('[data-icon="chevron-left"], [data-icon="arrow-left"]') }).first()
    ).or(page.locator('.g-button').first());

    // Try using aria-label or icon-based selectors
    const navButtons = page.locator('button:has(svg)').filter({ hasText: '' });
    const buttons = await navButtons.all();
    if (buttons.length >= 2) {
      // Usually first icon-button is prev, second is next
      await buttons[0].click();
      await page.waitForTimeout(500);
      await buttons[1].click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Расписание — создание занятия (live update)', () => {
  test('создание занятия через кнопку "Новое занятие"', async ({ authedPage: page }) => {
    const lessonDialog = await openLessonModal(page);

    // Проверяем что кнопка создания видна
    await expect(lessonDialog.getByRole('button', { name: /Сохранить|Создать занятие/i })).toBeVisible();
    // В новом полноэкранном варианте закрытие через кнопку "Назад"
    await expect(lessonDialog.getByRole('button', { name: 'Назад' })).toBeVisible();

    // Закрываем модал — не создаём занятие чтобы не мусорить
    await lessonDialog.getByRole('button', { name: 'Назад' }).click();
    await expect(lessonDialog).toBeHidden({ timeout: 10000 });
  });

  test('из формы занятия можно добавить ученика и сразу выбрать его', async ({ authedPage: page }) => {
    const uniqueStudentName = `Автотест Ученик ${Date.now()}`;

    try {
      const lessonDialog = await openLessonModal(page);

      await lessonDialog.getByRole('combobox').first().click();
      await page.getByRole('option', { name: 'Добавить ученика' }).click();

      const studentDialog = page.locator('[role="dialog"]').filter({ hasText: 'Новый ученик' }).first();
      await expect(studentDialog).toBeVisible({ timeout: 10000 });

      await studentDialog.getByPlaceholder('Иванов Пётр Сергеевич').fill(uniqueStudentName);
      const subjectInput = studentDialog.getByPlaceholder('Введите или выберите предмет');
      await subjectInput.fill('Математика');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await studentDialog.getByPlaceholder('2100').fill('1900');

      await studentDialog.getByRole('button', { name: 'Сохранить' }).click();
      await expect(studentDialog).toBeHidden({ timeout: 15000 });

      await expect(lessonDialog).toBeVisible({ timeout: 10000 });
      await expect(lessonDialog.getByText(uniqueStudentName).first()).toBeVisible({ timeout: 10000 });

      await lessonDialog.getByRole('button', { name: 'Назад' }).click();
      await expect(lessonDialog).toBeHidden({ timeout: 10000 });
    } finally {
      // best-effort cleanup by name; do not fail test on cleanup issues
      try {
        const token = await getAuthToken(page);
        const studentsResponse = await page.request.get(`${API_BASE}/students`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { search: uniqueStudentName, limit: 5 },
        });

        if (studentsResponse.ok()) {
          const studentsPayload = (await studentsResponse.json()) as {
            data?: Array<{ id: string; name: string }>;
          };
          const createdStudent = (studentsPayload.data || []).find(
            (student) => student.name === uniqueStudentName,
          );

          if (createdStudent?.id) {
            await page.request.delete(`${API_BASE}/students/${createdStudent.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      } catch {
        // best-effort cleanup
      }
    }
  });

  test('занятие с еженедельным повтором создаёт серию и доступно на следующей неделе', async ({ authedPage: page }) => {
    let recurrenceLessonId: string | null = null;

    try {
      await ensureSchedulePageReady(page, '/schedule');
      await switchCalendarView(page, 'Неделя');

      const lessonDialog = await openLessonModal(page);

      const studentTrigger = lessonDialog.getByText('Выберите ученика').first();
      await studentTrigger.click();
      const firstStudentOption = page.getByRole('option').first();
      await expect(firstStudentOption).toBeVisible({ timeout: 10000 });
      await firstStudentOption.click();

      const subjectTrigger = lessonDialog.getByText('Выберите предмет').first();
      if (await subjectTrigger.isVisible().catch(() => false)) {
        await subjectTrigger.click();
        const firstSubjectOption = page.getByRole('option').first();
        if (await firstSubjectOption.isVisible().catch(() => false)) {
          await firstSubjectOption.click();
        }
      }
      await lessonDialog.getByText('Детали').first().click();
      await page.waitForTimeout(200);

      const repeatSwitchControl = lessonDialog
        .locator('.lp2-invite-card input[role="switch"], .lp2-invite-card input[type="checkbox"]')
        .first();
      if (await repeatSwitchControl.isVisible().catch(() => false)) {
        await repeatSwitchControl.check({ force: true });
      } else {
        await lessonDialog.locator('.lp2-invite-card .g-switch').first().click({ force: true });
      }

      // Обязательные поля для создания урока: дата и время
      const dateTrigger = lessonDialog.locator('.repeto-date-input__trigger').first();
      await dateTrigger.click();
      const todayCell = page.locator('.repeto-date-popup__day--today').first();
      if (await todayCell.isVisible().catch(() => false)) {
        await todayCell.click();
      } else {
        await page.locator('.repeto-date-popup__day').first().click();
      }

      await lessonDialog.getByText('Выберите время').first().click();
      const timeOption = page.getByRole('option', { name: '10:00' }).first();
      if (await timeOption.isVisible().catch(() => false)) {
        await timeOption.click();
      } else {
        await page.getByRole('option').first().click();
      }

      const [createRequest, createResponse] = await Promise.all([
        page.waitForRequest(
          (request) => request.url().includes('/api/lessons') && request.method() === 'POST',
        ),
        page.waitForResponse(
          (response) => response.url().includes('/api/lessons') && response.request().method() === 'POST',
        ),
        lessonDialog.getByTestId('create-lesson-submit').click({ force: true }),
      ]);

      expect(createResponse.ok()).toBeTruthy();

      const payload = createRequest.postDataJSON() as {
        recurrence?: { enabled?: boolean; until?: string; weekdays?: number[] };
      };

      expect(payload.recurrence?.enabled).toBeTruthy();
      expect(Array.isArray(payload.recurrence?.weekdays)).toBeTruthy();
      expect((payload.recurrence?.weekdays || []).length).toBeGreaterThan(0);
      expect(payload.recurrence?.until).toBeTruthy();

      const createdLessons = (await createResponse.json()) as Array<{
        id: string;
        scheduledAt: string;
        recurrenceGroupId?: string | null;
      }>;

      expect(Array.isArray(createdLessons)).toBeTruthy();
      expect(createdLessons.length).toBeGreaterThan(1);

      recurrenceLessonId = createdLessons[0]?.id || null;

      const sortedTimes = createdLessons
        .map((lesson) => new Date(lesson.scheduledAt).getTime())
        .sort((a, b) => a - b);

      const hasWeeklyStep = sortedTimes.some((time, index) => {
        if (index === 0) return false;
        const diffDays = Math.round((time - sortedTimes[index - 1]) / (24 * 60 * 60 * 1000));
        return diffDays === 7;
      });

      expect(hasWeeklyStep).toBeTruthy();

      const secondOccurrence = createdLessons.find((lesson) => lesson.id !== recurrenceLessonId);
      if (!secondOccurrence?.scheduledAt) {
        throw new Error('Recurrence create response does not contain second occurrence');
      }

      const authToken = await getAuthToken(page);
      const nextWeekResponse = await page.request.get(`${API_BASE}/lessons`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!nextWeekResponse.ok()) {
        const errorBody = await nextWeekResponse.text().catch(() => '');
        throw new Error(
          `GET /lessons snapshot failed: status=${nextWeekResponse.status()} body=${errorBody}`,
        );
      }

      const nextWeekLessons = (await nextWeekResponse.json()) as Array<{
        id: string;
        recurrenceGroupId?: string | null;
      }>;

      const hasSecondOccurrenceInSchedule = nextWeekLessons.some(
        (lesson) => lesson.id === secondOccurrence.id,
      );
      expect(hasSecondOccurrenceInSchedule).toBeTruthy();
    } finally {
      if (recurrenceLessonId) {
        try {
          await page.request.delete(`/api/lessons/${recurrenceLessonId}`, {
            params: { deleteRecurrence: true },
          });
        } catch {
          // best-effort cleanup
        }
      }
    }
  });

  test('Escape в модалке оплаты закрывает только вложенную модалку, родительская остаётся открытой', async ({ authedPage: page }) => {
    const lessonDialog = await openLessonModal(page);

    await lessonDialog.getByRole('combobox').first().click();
    const studentOption = page
      .getByRole('option')
      .filter({ hasNotText: /Добавить ученика/i })
      .first();

    if (!(await studentOption.isVisible().catch(() => false))) {
      await lessonDialog.getByRole('button', { name: /Назад|Отмена/i }).first().click();
      test.skip(true, 'Нет доступных учеников для проверки вложенной модалки оплаты.');
    }

    await studentOption.click({ force: true });

    const addPaymentButton = lessonDialog
      .getByRole('button', { name: /Добавить оплату|Записать оплату/i })
      .first();
    await expect(addPaymentButton).toBeEnabled({ timeout: 10000 });
    await addPaymentButton.click();

    const paymentDialog = page.locator('.lp2[role="dialog"][aria-label="Новая оплата"]').first();
    const openPaymentDialog = page.locator('.lp2.lp2--open[role="dialog"][aria-label="Новая оплата"]').first();
    await expect(openPaymentDialog).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Escape');

    // Вложенная модалка оплаты может остаться в DOM, но должна выйти из open-состояния.
    await expect(openPaymentDialog).toHaveCount(0, { timeout: 10000 });
    await expect(paymentDialog).toBeAttached();
    await expect(lessonDialog).toBeVisible({ timeout: 10000 });

    await lessonDialog.getByRole('button', { name: /Назад|Отмена/i }).first().click();
    await expect(lessonDialog).toBeHidden({ timeout: 10000 });
  });

  test('модалка занятия: домашка, материалы и оплата сохраняются и отображаются в секциях', async ({ authedPage: page }) => {
    const stamp = Date.now();
    const homeworkTask = `Домашка e2e ${stamp}`;
    const paymentAmount = 7777;
    let materialsWereAttached = false;

    const lessonDialog = await openLessonModal(page);

    await lessonDialog.getByRole('combobox').first().click();
    const studentOption = page
      .getByRole('option')
      .filter({ hasNotText: /Добавить ученика/i })
      .first();

    if (!(await studentOption.isVisible().catch(() => false))) {
      await lessonDialog.getByRole('button', { name: /Назад|Отмена/i }).first().click();
      test.skip(true, 'Нет доступных учеников для проверки сценария домашки/материалов/оплаты.');
    }

    await studentOption.click({ force: true });

    await lessonDialog.getByRole('button', { name: 'Добавить домашнее задание' }).first().click();
    const homeworkForm = lessonDialog.locator('.lp2-hw-form');
    await expect(homeworkForm).toBeVisible({ timeout: 10000 });

    await homeworkForm
      .getByPlaceholder('Выучить параграф 5, решить задачи №12-18...')
      .fill(homeworkTask);

    await lessonDialog.getByRole('button', { name: 'Прикрепить материалы' }).first().click();
    const materialsDialog = page.getByRole('dialog').filter({ hasText: 'Выбор материалов' }).first();
    await expect(materialsDialog).toBeVisible({ timeout: 10000 });

    const hasNoCloudConnection = await materialsDialog
      .getByText('Облачные диски не подключены')
      .first()
      .isVisible()
      .catch(() => false);

    const hasNoSources = await materialsDialog
      .getByText('Нет доступных источников материалов.')
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasNoCloudConnection && !hasNoSources) {
      const selectAllButton = materialsDialog.getByRole('button', { name: 'Выбрать все' }).first();
      if (await selectAllButton.isVisible().catch(() => false)) {
        await selectAllButton.click();
        materialsWereAttached = true;
      } else {
        const firstCheckbox = materialsDialog.getByRole('checkbox').first();
        if (await firstCheckbox.isVisible().catch(() => false)) {
          await firstCheckbox.click();
          materialsWereAttached = true;
        }
      }
    }

    await materialsDialog.getByRole('button', { name: 'Готово' }).click();
    await expect(materialsDialog).toBeHidden({ timeout: 10000 });

    await homeworkForm.getByRole('button', { name: 'Сохранить' }).click();
    await expect(homeworkForm).toBeHidden({ timeout: 10000 });

    await expect(lessonDialog.getByText(homeworkTask).first()).toBeVisible({ timeout: 10000 });
    await expect(lessonDialog.getByText(/добавлено\s+\d+\s+задани/i)).toHaveCount(0);

    await lessonDialog.getByRole('button', { name: 'Добавить оплату' }).first().click();

    const paymentDialog = page.getByRole('dialog', { name: 'Новая оплата' }).first();
    await expect(paymentDialog).toBeVisible({ timeout: 10000 });

    const paymentStudentSelect = paymentDialog.getByText('Выберите ученика').first();
    if (await paymentStudentSelect.isVisible().catch(() => false)) {
      await paymentStudentSelect.click();
      const firstPaymentStudentOption = page
        .getByRole('option')
        .filter({ hasNotText: /Добавить ученика/i })
        .first();
      if (await firstPaymentStudentOption.isVisible().catch(() => false)) {
        await firstPaymentStudentOption.click({ force: true });
      }
    }

    await paymentDialog.getByPlaceholder('4200').fill(String(paymentAmount));
    await paymentDialog.getByRole('button', { name: 'Сохранить' }).click();
    await expect(paymentDialog).toBeHidden({ timeout: 10000 });

    await expect(
      lessonDialog.getByText(`${paymentAmount.toLocaleString('ru-RU')} ₽`).first(),
    ).toBeVisible({ timeout: 10000 });

    await lessonDialog.getByRole('button', { name: 'Назад' }).click();
    await expect(lessonDialog).toBeHidden({ timeout: 10000 });
  });
});

test.describe('Расписание — модал деталей занятия', () => {
  test('открыть занятие и проверить кнопки', async ({ authedPage: page }) => {
    await ensureSchedulePageReady(page, '/schedule');

    // Переключаемся на Неделя для лучшей видимости
    await switchCalendarView(page, 'Неделя');

    // Ищем занятие по тексту предмета (из скриншота: "Физика", "Английский")
    const lessonBlock = page.getByText(/Физика|Английский|Математика/i).first();
    if (await lessonBlock.isVisible().catch(() => false)) {
      await lessonBlock.click();
      await page.waitForTimeout(500);

      // Модал или панель деталей должна появиться
      const hasDetails = await page.getByText(/Запланировано|Проведено|Отменено|Информация/i).first().isVisible().catch(() => false);
      const hasButtons = await page.getByRole('button', { name: /Редактировать|Проведено|Отменить|Удалить/i }).first().isVisible().catch(() => false);

      expect(hasDetails || hasButtons).toBeTruthy();
    } else {
      // Нет занятий на этой неделе — пропускаем
      test.skip();
    }
  });

  test('фильтры типов занятий', async ({ authedPage: page }) => {
    await ensureSchedulePageReady(page, '/schedule');

    // Пробуем открыть фильтр типов
    const filterButton = page.getByText('Типы занятий').or(
      page.getByRole('button', { name: /типы|фильтр/i })
    ).first();

    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Пробуем выбрать "Проведённые"
      const conductedOption = page.getByText('Проведённые').first();
      if (await conductedOption.isVisible()) {
        await conductedOption.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
