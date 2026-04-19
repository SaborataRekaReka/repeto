/**
 * SCHEDULE / LESSONS E2E TESTS
 * Tests: calendar views, create lesson, lesson detail modal, status changes, delete
 */
import { test, expect, API_BASE, getAuthToken } from './helpers/auth';

test.describe('Расписание — отображение', () => {
  test('календарь загружается (вид Месяц)', async ({ authedPage: page }) => {
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    // Должен быть активен один из видов: Месяц / Неделя / День
    await expect(page.getByText('Месяц').first()).toBeVisible();
    await expect(page.getByText('Неделя').first()).toBeVisible();
    await expect(page.getByText('День').first()).toBeVisible();
  });

  test('переключение видов: Месяц → Неделя → День', async ({ authedPage: page }) => {
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    // Неделя
    await page.getByRole('radio', { name: 'Неделя' }).click();
    await page.waitForTimeout(500);

    // День
    await page.getByRole('radio', { name: 'День' }).click();
    await page.waitForTimeout(500);

    // Обратно на Месяц
    await page.getByRole('radio', { name: 'Месяц' }).click();
    await page.waitForTimeout(500);
  });

  test('навигация по месяцам (стрелки < >)', async ({ authedPage: page }) => {
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

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
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    // Нажимаем "Новое занятие"
    await page.getByRole('button', { name: /Новое занятие/i }).first().click();
    const lessonDialog = page.getByRole('dialog', { name: 'Новое занятие' }).first();
    await expect(lessonDialog).toBeVisible({ timeout: 10000 });

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
    let createdStudentId: string | null = null;
    let accessToken: string | null = null;

    try {
      await page.goto('/schedule');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /Новое занятие/i }).first().click();
      const lessonDialog = page.getByRole('dialog', { name: 'Новое занятие' }).first();
      await expect(lessonDialog).toBeVisible({ timeout: 10000 });

      await lessonDialog.getByRole('combobox').first().click();
      await page.getByRole('option', { name: 'Добавить ученика' }).click();

      const studentDialog = page.locator('[role="dialog"]').filter({ hasText: 'Новый ученик' }).first();
      await expect(studentDialog).toBeVisible({ timeout: 10000 });

      await studentDialog.getByPlaceholder('Иванов Пётр Сергеевич').fill(uniqueStudentName);
      await studentDialog.getByText('Выберите предмет').first().click();
      // Popup options are rendered through a portal; selecting active option by keyboard is more stable.
      await page.keyboard.press('Enter');
      await studentDialog.getByPlaceholder('2100').fill('1900');

      await studentDialog.getByRole('button', { name: 'Сохранить' }).click();
      await expect(studentDialog).toBeHidden({ timeout: 15000 });

      await expect(lessonDialog).toBeVisible({ timeout: 10000 });
      await expect(lessonDialog.getByText(uniqueStudentName).first()).toBeVisible({ timeout: 10000 });

      accessToken = await getAuthToken(page);
      const studentsResponse = await page.request.get(`${API_BASE}/students`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { search: uniqueStudentName, limit: 5 },
      });
      expect(studentsResponse.ok()).toBeTruthy();

      const studentsPayload = (await studentsResponse.json()) as {
        data?: Array<{ id: string; name: string }>;
      };

      const createdStudent = (studentsPayload.data || []).find(
        (student) => student.name === uniqueStudentName,
      );
      expect(createdStudent).toBeTruthy();
      createdStudentId = createdStudent?.id || null;

      await lessonDialog.getByRole('button', { name: 'Назад' }).click();
      await expect(lessonDialog).toBeHidden({ timeout: 10000 });
    } finally {
      if (createdStudentId) {
        try {
          const token = accessToken || (await getAuthToken(page));
          await page.request.delete(`${API_BASE}/students/${createdStudentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // best-effort cleanup
        }
      }
    }
  });

  test('занятие с еженедельным повтором создаёт серию и доступно на следующей неделе', async ({ authedPage: page }) => {
    let recurrenceLessonId: string | null = null;
    let accessToken: string | null = null;

    try {
      await page.goto('/schedule');
      await page.waitForLoadState('networkidle');

      await page.getByRole('radio', { name: 'Неделя' }).click();
      await page.waitForTimeout(400);

      const firstWeekColumn = page
        .locator('.repeto-calendar-scroll div[style*="cursor: pointer"]')
        .first();
      await firstWeekColumn.click({ position: { x: 16, y: 24 } });

      await expect(page.getByText('Новое занятие').first()).toBeVisible();

      const studentTrigger = page.getByText('Выберите ученика');
      await studentTrigger.click();
      const firstStudentOption = page.getByRole('option').first();
      await expect(firstStudentOption).toBeVisible({ timeout: 10000 });
      await firstStudentOption.click();

      const subjectTrigger = page.getByText('Выберите предмет').first();
      if (await subjectTrigger.isVisible().catch(() => false)) {
        await subjectTrigger.click();
        const firstSubjectOption = page.getByRole('option').first();
        if (await firstSubjectOption.isVisible().catch(() => false)) {
          await firstSubjectOption.click();
        }
      }

      await page.getByRole('checkbox', { name: 'Повторять еженедельно' }).click();

      const createRequestPromise = page.waitForRequest(
        (request) => request.url().includes('/api/lessons') && request.method() === 'POST',
      );
      const createResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/lessons') && response.request().method() === 'POST',
      );

      await page.getByRole('button', { name: /Сохранить|Создать занятие/i }).click();

      const createRequest = await createRequestPromise;
      const createResponse = await createResponsePromise;
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
      const recurrenceGroupId = createdLessons[0]?.recurrenceGroupId || null;

      const sortedTimes = createdLessons
        .map((lesson) => new Date(lesson.scheduledAt).getTime())
        .sort((a, b) => a - b);

      const hasWeeklyStep = sortedTimes.some((time, index) => {
        if (index === 0) return false;
        const diffDays = Math.round((time - sortedTimes[index - 1]) / (24 * 60 * 60 * 1000));
        return diffDays === 7;
      });

      expect(hasWeeklyStep).toBeTruthy();

      const firstDate = new Date(createdLessons[0].scheduledAt);
      const nextWeekDate = new Date(firstDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const nextWeekDateKey = nextWeekDate.toISOString().split('T')[0];

      accessToken = await getAuthToken(page);
      const nextWeekResponse = await page.request.get(`${API_BASE}/lessons`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { from: nextWeekDateKey, to: nextWeekDateKey },
      });
      expect(nextWeekResponse.ok()).toBeTruthy();

      const nextWeekLessons = (await nextWeekResponse.json()) as Array<{
        recurrenceGroupId?: string | null;
      }>;

      const recurrenceLessonsNextWeek = nextWeekLessons.filter(
        (lesson) => lesson.recurrenceGroupId && lesson.recurrenceGroupId === recurrenceGroupId,
      );
      expect(recurrenceLessonsNextWeek.length).toBeGreaterThan(0);
    } finally {
      if (recurrenceLessonId) {
        try {
          const token = accessToken || (await getAuthToken(page));
          await page.request.delete(`${API_BASE}/lessons/${recurrenceLessonId}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { deleteRecurrence: true },
          });
        } catch {
          // best-effort cleanup
        }
      }
    }
  });

  test('модалка занятия: домашка, материалы и оплата сохраняются и отображаются в секциях', async ({ authedPage: page }) => {
    const stamp = Date.now();
    const studentName = `E2E LessonPanel ${stamp}`;
    const homeworkTask = `Домашка e2e ${stamp}`;
    const paymentAmount = 7777;
    let createdStudentId: string | null = null;
    let accessToken: string | null = null;
    let materialsWereAttached = false;

    try {
      accessToken = await getAuthToken(page);
      const createStudentResponse = await page.request.post(`${API_BASE}/students`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          name: studentName,
          subject: 'Математика',
          rate: 1500,
        },
      });
      expect(createStudentResponse.ok()).toBeTruthy();

      const createdStudent = (await createStudentResponse.json()) as { id?: string };
      createdStudentId = createdStudent?.id || null;
      expect(createdStudentId).toBeTruthy();

      await page.goto('/schedule');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /Новое занятие/i }).first().click();

      const lessonDialog = page.getByRole('dialog', { name: 'Новое занятие' }).first();
      await expect(lessonDialog).toBeVisible({ timeout: 10000 });

      await lessonDialog.getByRole('combobox').first().click();
      await page.getByRole('option', { name: studentName }).first().click({ force: true });

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

      if (materialsWereAttached) {
        await expect(
          lessonDialog.getByText('Выбрано для домашнего задания').first(),
        ).toBeVisible({ timeout: 10000 });
      }

      await homeworkForm.getByRole('button', { name: 'Сохранить' }).click();
      await expect(homeworkForm).toBeHidden({ timeout: 10000 });

      await expect(lessonDialog.getByText(homeworkTask).first()).toBeVisible({ timeout: 10000 });
      await expect(lessonDialog.getByText(/добавлено\s+\d+\s+задани/i)).toHaveCount(0);

      if (materialsWereAttached) {
        await expect(lessonDialog.getByText('Сохранено в домашних заданиях').first()).toBeVisible({ timeout: 10000 });
      }

      await lessonDialog.getByRole('button', { name: 'Добавить оплату' }).first().click();

      const paymentDialog = page.getByRole('dialog', { name: 'Новая оплата' }).first();
      await expect(paymentDialog).toBeVisible({ timeout: 10000 });

      const paymentStudentSelect = paymentDialog.getByText('Выберите ученика').first();
      if (await paymentStudentSelect.isVisible().catch(() => false)) {
        await paymentStudentSelect.click();
        await page.getByRole('option', { name: studentName }).first().click({ force: true });
      }

      await paymentDialog.getByPlaceholder('4200').fill(String(paymentAmount));
      await paymentDialog.getByRole('button', { name: 'Сохранить' }).click();
      await expect(paymentDialog).toBeHidden({ timeout: 10000 });

      await expect(
        lessonDialog.getByText(`${paymentAmount.toLocaleString('ru-RU')} ₽`).first(),
      ).toBeVisible({ timeout: 10000 });

      await lessonDialog.getByRole('button', { name: 'Назад' }).click();
      await expect(lessonDialog).toBeHidden({ timeout: 10000 });
    } finally {
      if (createdStudentId) {
        try {
          const token = accessToken || (await getAuthToken(page));
          await page.request.delete(`${API_BASE}/students/${createdStudentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // best-effort cleanup
        }
      }
    }
  });
});

test.describe('Расписание — модал деталей занятия', () => {
  test('открыть занятие и проверить кнопки', async ({ authedPage: page }) => {
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    // Переключаемся на Неделя для лучшей видимости
    await page.getByRole('radio', { name: 'Неделя' }).click();
    await page.waitForLoadState('networkidle');

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
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

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
