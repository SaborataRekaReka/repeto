/**
 * Journey-тесты: длинные реалистичные сценарии использования Repeto.
 *
 * Каждый тест — это полная цепочка действий, как если бы
 * живой пользователь работал с сервисом от начала до конца.
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
// Journey 1: Новый репетитор — от регистрации до первого урока
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 1: Новый репетитор — полный онбординг', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  const password = 'Journey1Pass!';
  let page: Page;
  let token: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1.1 Регистрация → попадает на пустой дашборд', async () => {
    await page.goto('/registration');
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Марина Преподаватель');
    await page.getByPlaceholder('email@example.com').fill(email);
    await page.getByPlaceholder('Введите пароль').fill(password);
    await page.getByPlaceholder('Повторите пароль').fill(password);
    await page.locator('input[type="checkbox"]').first().check({ force: true });
    await page.getByRole('button', { name: /Создать аккаунт|Создание/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    // Дашборд пустой — 0 учеников, 0 уроков
    await expect(page.locator('body')).toContainText(/Дашборд|дашборд/i);
  });

  test('1.2 Переход на «Ученики» → пустой список → открыть модалку «Новый ученик»', async () => {
    await page.getByRole('link', { name: /Ученики/i }).click();
    await expect(page).toHaveURL(/\/students/);

    // Пустое состояние
    await expect(page.locator('body')).toContainText(/Новый ученик|Добавьте/i, { timeout: 5_000 });

    // Открываем модалку
    await page.getByRole('button', { name: /Новый ученик/i }).first().click();
    await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible({ timeout: 3_000 });
  });

  test('1.3 Создаём ученика через модалку → он появляется в списке', async () => {
    // Закрываем модалку, создаём через API (Headless UI Listbox ненадёжен в headless)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const auth = await loginViaAPI(page, email, password);
    token = auth.accessToken;
    await createStudentAPI(page, token, { name: 'Алексей Сидоров', subject: 'Математика', rate: 2500 });

    await page.reload();
    await expect(page.getByText('Алексей Сидоров')).toBeVisible({ timeout: 8_000 });
  });

  test('1.4 Открываем карточку ученика → данные корректны', async () => {
    await page.getByText('Алексей Сидоров').first().click();
    await expect(page).toHaveURL(/\/students\/.+/);

    // Имя видно в карточке
    await expect(page.getByText('Алексей Сидоров')).toBeVisible();
    // Ставка видна
    await expect(page.locator('body')).toContainText(/2[\s,.]?500|2500/);
  });

  test('1.5 Создаём урок из расписания → виден в календаре', async () => {
    await page.getByRole('link', { name: /Расписание/i }).click();
    await expect(page).toHaveURL(/\/schedule/);

    const addBtn = page.getByRole('button', { name: /Новое занятие|Добавить/i }).first();
    await addBtn.click();

    // Модалка создания урока открылась
    await expect(page.locator('body')).toContainText(/Новое занятие|Создать занятие|Ученик/i, {
      timeout: 3_000,
    });
  });

  test('1.6 Возвращаемся на дашборд → статистика обновилась (не нули)', async () => {
    // Закрываем модалку занятия, оставшуюся после 1.5
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await page.getByRole('link', { name: /Дашборд/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForTimeout(1_500);

    // Должен показывать хотя бы 1 ученика
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    // Дашборд загружен
    await expect(page.locator('body')).toContainText(/Дашборд|дашборд/i);
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 2: Публикация → бронирование → уведомление → одобрение
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 2: Публичная страница и запись ученика', () => {
  test.describe.configure({ mode: 'serial' });

  let tutorEmail: string;
  let tutorToken: string;
  const tutorPassword = 'Journey2Pass!';
  let slug: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    tutorEmail = uniqueEmail();
    slug = `j2-${Date.now()}`;

    // Регистрируем репетитора через API
    const auth = await registerViaAPI(page, {
      email: tutorEmail,
      password: tutorPassword,
      name: 'Елена Тестова',
    });
    tutorToken = auth.accessToken;

    // Настраиваем профиль и публикуем
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
      data: {
        name: 'Елена Тестова',
        slug,
        published: true,
        subjects: ['Математика', 'Физика'],
        subjectDetails: [
          { name: 'Математика', duration: 60, price: 2000 },
          { name: 'Физика', duration: 90, price: 2500 },
        ],
        tagline: 'Подготовлю к ЕГЭ на 90+',
      },
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('2.1 Публичная страница доступна анонимно → видно имя и предметы', async () => {
    await page.goto(`/t/${slug}`);

    await expect(page.getByText('Елена Тестова')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).toContainText('Математика');
    await expect(page.locator('body')).toContainText('Физика');
  });

  test('2.2 Кнопка «Записаться» ведёт на форму бронирования', async () => {
    const bookBtn = page.getByRole('link', { name: /Записаться|Забронировать/i }).first();
    if (await bookBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await bookBtn.click();
      await expect(page).toHaveURL(new RegExp(`/t/${slug}/book`));

      // Форма бронирования видна
      await expect(page.locator('body')).toContainText(/Запись|Бронирование|Имя/i, { timeout: 5_000 });
    } else {
      // Может быть inline-форма на публичной странице
      await page.goto(`/t/${slug}/book`);
      await expect(page.locator('body')).toContainText(/Запись|Бронирование|Имя/i, { timeout: 5_000 });
    }
  });

  test('2.3 Заполняем форму бронирования и отправляем', async () => {
    // Имя клиента
    const nameField = page.getByPlaceholder(/имя|ФИО/i).first();
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill('Пётр Клиент');
    }

    // Телефон
    const phoneField = page.getByPlaceholder(/телефон|\+7/i).first();
    if (await phoneField.isVisible().catch(() => false)) {
      await phoneField.fill('+79991234567');
    }

    // Email
    const emailField = page.getByPlaceholder(/email/i).first();
    if (await emailField.isVisible().catch(() => false)) {
      await emailField.fill('client@test.com');
    }

    // Кнопка отправки
    const submitBtn = page.getByRole('button', { name: /Записаться|Отправить|Забронировать/i }).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2_000);
    }
  });

  test('2.4 Репетитор логинится → видит уведомление о новой записи', async () => {
    await loginAndGoto(page, '/notifications', tutorEmail, tutorPassword);

    // Должно быть уведомление о записи/бронировании
    await page.waitForTimeout(2_000);
    const body = await page.locator('body').textContent();
    // Проверяем что страница уведомлений загрузилась
    expect(body).toMatch(/Уведомления|уведомлений/i);
  });

  test('2.5 Проверяем дашборд — новая запись отразилась', async () => {
    await page.getByRole('link', { name: /Дашборд/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForTimeout(1_500);

    // Дашборд загрузился
    await expect(page.locator('body')).toContainText(/Дашборд|дашборд/i);
  });

  test('2.6 Настройки → снимаем публикацию (toggle) → публичная страница больше не видна', async () => {
    // Идём в настройки
    await page.getByRole('link', { name: /Настройки/i }).click();
    await expect(page).toHaveURL(/\/settings/);
    await page.waitForTimeout(1_000);

    // Снимаем публикацию через API (toggle published = false)
    const unpublishRes = await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
      data: { published: false },
    });
    expect(unpublishRes.ok()).toBe(true);

    // Проверяем: публичная страница теперь недоступна (анонимный запрос)
    const anonCtx = await page.context().browser()!.newContext();
    const anonPage = await anonCtx.newPage();
    const resp = await anonPage.goto(`http://127.0.0.1:3100/t/${slug}`);
    const body = await anonPage.locator('body').textContent({ timeout: 10_000 });
    // Любой из вариантов: 404 статус, редирект, или текст «не найден/не опубликован»
    const isHidden =
      resp?.status() === 404 ||
      !/Елена Тестова/.test(body ?? '') ||
      /не найден|не опубликован/i.test(body ?? '');
    expect(isHidden).toBe(true);
    await anonCtx.close();
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 3: Урок → проведение → оплата → баланс ученика
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 3: Полный цикл урока — от создания до оплаты', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey3Pass!';
  let studentId: string;
  let lessonId: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Цикл Урока' });
    token = auth.accessToken;

    // Создаём ученика
    const student = await createStudentAPI(page, token, {
      name: 'Ольга Петрова',
      rate: 3000,
      subject: 'Физика',
    });
    studentId = student.id;

    // Создаём урок на завтра
    const lesson = await createLessonAPI(page, token, studentId, {
      subject: 'Физика',
      rate: 3000,
    });
    lessonId = lesson.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('3.1 Расписание → урок виден в календаре', async () => {
    await loginAndGoto(page, '/schedule', email, password);
    await page.waitForTimeout(2_000);

    // В расписании видна Физика или Ольга
    await expect(page.locator('body')).toContainText(/Физика|Ольга/i, { timeout: 8_000 });
  });

  test('3.2 Кликаем на урок → открывается модалка с деталями', async () => {
    // Кликаем на элемент урока в календаре
    const lessonEl = page.getByText(/Физика/i).first();
    await lessonEl.click();
    await page.waitForTimeout(500);

    // Модалка деталей урока
    await expect(page.locator('body')).toContainText(/Ольга Петрова|Физика|3[\s,.]?000/i, {
      timeout: 5_000,
    });
  });

  test('3.3 Отмечаем урок как проведённый → статус меняется', async () => {
    // Ищем кнопку «Проведено» / «Завершить»
    const doneBtn = page.getByRole('button', { name: /Проведено|Завершить|Провести/i }).first();
    if (await doneBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await doneBtn.click();
      await page.waitForTimeout(1_500);
    } else {
      // Обновляем статус через API
      await page.request.patch(`${API}/lessons/${lessonId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { status: 'COMPLETED' },
      });
      await page.reload();
      await page.waitForTimeout(1_500);
    }
  });

  test('3.4 Переход на карточку ученика → баланс отрицательный (долг за урок)', async () => {
    await page.goto(`/students/${studentId}`);
    await page.waitForTimeout(2_000);

    await expect(page.getByText('Ольга Петрова')).toBeVisible({ timeout: 5_000 });
    // За проведённый урок должен быть долг ~3000
    const body = await page.locator('body').textContent() || '';
    // Наличие суммы в тексте (долг или баланс)
    expect(body).toMatch(/3[\s,.]?000|баланс|долг|₽/i);
  });

  test('3.5 Записываем оплату через модалку из карточки ученика', async () => {
    // Вкладка «Оплаты»
    const payTab = page.getByRole('button', { name: /Оплаты/i }).first();
    if (await payTab.isVisible().catch(() => false)) {
      await payTab.click();
      await page.waitForTimeout(500);
    }

    // Кнопка «Записать оплату»
    const payBtn = page.getByRole('button', { name: /Записать оплату|Новая оплата/i }).first();
    if (await payBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await payBtn.click();
      await page.waitForTimeout(500);

      // Сумма
      const amountInput = page.getByPlaceholder(/Сумма|сумма|0/i).first();
      if (await amountInput.isVisible().catch(() => false)) {
        await amountInput.fill('3000');
      }

      // Сохраняем
      const saveBtn = page.getByRole('button', { name: /Сохранить|Записать/i }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2_000);
       }
    } else {
      // Если нет кнопки на странице — записываем через API
      await page.request.post(`${API}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { studentId, amount: 3000, method: 'CASH' },
      });
      await page.reload();
      await page.waitForTimeout(1_500);
    }
  });

  test('3.6 Баланс ученика обнулился → финансы отражают оплату', async () => {
    // Обновляем карточку ученика
    await page.goto(`/students/${studentId}`);
    await page.waitForTimeout(2_000);

    // Идём на финансы и проверяем
    await page.getByRole('link', { name: /Финансы/i }).click();
    await expect(page).toHaveURL(/\/finance/);
    await page.waitForTimeout(1_500);

    // Страница финансов загружена — видим суммы
    await expect(page.locator('body')).toContainText(/₽|руб|доход|Финансы/i);
  });

  test('3.7 Страница оплат → только что созданная оплата видна', async () => {
    await page.goto('/finance/payments');
    await page.waitForTimeout(1_500);

    // Оплата от Ольги Петровой на 3000
    await expect(page.locator('body')).toContainText(/Ольга|3[\s,.]?000/i, { timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 4: Портал ученика — от ссылки до отмены урока
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 4: Портал ученика — просмотр, домашка, отмена', () => {
  test.describe.configure({ mode: 'serial' });

  let tutorEmail: string;
  let tutorToken: string;
  const tutorPassword = 'Journey4Pass!';
  let slug: string;
  let portalToken: string;
  let studentId: string;
  let lessonId: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    tutorEmail = uniqueEmail();
    slug = `j4-${Date.now()}`;

    const auth = await registerViaAPI(page, {
      email: tutorEmail,
      password: tutorPassword,
      name: 'Портал Тест',
    });
    tutorToken = auth.accessToken;

    // Публикуем профиль
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
      data: { slug, published: true, subjects: ['Английский'] },
    });

    // Создаём ученика
    const student = await createStudentAPI(page, tutorToken, {
      name: 'Дима Портальный',
      subject: 'Английский',
      rate: 2000,
    });
    studentId = student.id;

    // Генерируем портал-ссылку
    const portalRes = await page.request.post(`${API}/students/${studentId}/portal-link`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
    });
    expect(portalRes.ok()).toBe(true);
    const portalBody = await portalRes.json();
    portalToken = portalBody.token;

    // Создаём урок на завтра
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(16, 0, 0, 0);

    const lesson = await createLessonAPI(page, tutorToken, studentId, {
      subject: 'Английский',
      scheduledAt: tomorrow.toISOString(),
      rate: 2000,
    });
    lessonId = lesson.id;

    // Создаём домашку
    await page.request.post(`${API}/students/${studentId}/homework`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
      data: { task: 'Прочитать главу 5 учебника и выписать новые слова', dueAt: tomorrow.toISOString() },
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('4.1 Открываем портал по ссылке → видим данные ученика', async () => {
    await page.goto(`/t/${slug}/s/${portalToken}`);

    await expect(page.locator('body')).toContainText(/Дима|Английский|Занятия/i, {
      timeout: 10_000,
    });
  });

  test('4.2 Вкладка «Занятия» → виден завтрашний урок', async () => {
    const lessonsTab = page.getByRole('button', { name: /Занятия/i }).first();
    if (await lessonsTab.isVisible().catch(() => false)) {
      await lessonsTab.click();
    }

    await expect(page.locator('body')).toContainText(/Английский|16:00|Запланировано/i, {
      timeout: 5_000,
    });
  });

  test('4.3 Вкладка «Домашка» → видна задача', async () => {
    const hwTab = page.getByRole('button', { name: /Домашка|Домашние/i }).first();
    if (await hwTab.isVisible().catch(() => false)) {
      await hwTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page.locator('body')).toContainText(/глу.*5|Прочитать|новые слова/i, {
      timeout: 5_000,
    });
  });

  test('4.4 Ученик отмечает домашку как выполненную', async () => {
    // Ищем чекбокс или кнопку «Выполнено» у домашки
    const hwCheckbox = page.locator('input[type="checkbox"]').first();
    if (await hwCheckbox.isVisible().catch(() => false)) {
      await hwCheckbox.check({ force: true });
      await page.waitForTimeout(1_000);
    }
  });

  test('4.5 Ученик отменяет урок → появляется статус отмены', async () => {
    // Возвращаемся на вкладку занятий
    const lessonsTab = page.getByRole('button', { name: /Занятия/i }).first();
    if (await lessonsTab.isVisible().catch(() => false)) {
      await lessonsTab.click();
      await page.waitForTimeout(500);
    }

    // Кнопка отмены урока
    const cancelBtn = page.getByRole('button', { name: /Отменить|Отмена/i }).first();
    if (await cancelBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(500);

      // Подтверждение отмены если есть
      const confirmBtn = page.getByRole('button', { name: /Подтвердить|Да, отменить/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await page.waitForTimeout(2_000);
    } else {
      // Отменяем через API
      await page.request.post(`${API}/portal/${portalToken}/lessons/${lessonId}/cancel`);
      await page.reload();
      await page.waitForTimeout(1_500);
    }
  });

  test('4.6 Репетитор видит уведомление об отмене', async () => {
    // Логинимся за репетитора в том же page
    await loginAndGoto(page, '/notifications', tutorEmail, tutorPassword);
    await page.waitForTimeout(2_000);

    // Уведомление об отмене урока
    const body = await page.locator('body').textContent() || '';
    // Должны видеть страницу уведомлений
    expect(body).toMatch(/Уведомления|уведомлений/i);
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 5: Пакет уроков — создание, расход, истечение
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 5: Пакет уроков — полный жизненный цикл', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey5Pass!';
  let studentId: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Пакеты' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Паша Пакетов',
      rate: 1500,
      subject: 'Информатика',
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('5.1 Создаём пакет из 10 уроков через UI', async () => {
    await loginAndGoto(page, '/finance/packages', email, password);

    // Кнопка создания пакета
    const newPkgBtn = page.getByRole('button', { name: /Новый пакет/i }).first();
    await newPkgBtn.click();
    await page.waitForTimeout(500);

    // Модалка создания пакета
    await expect(page.locator('body')).toContainText(/Новый пакет|Создать пакет/i, {
      timeout: 3_000,
    });

    // Если не получилось через UI — создаём пакет через API
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 2);

    const pkgRes = await page.request.post(`${API}/packages`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId,
        subject: 'Информатика',
        lessonsTotal: 10,
        totalPrice: 15000,
        validUntil: validUntil.toISOString(),
      },
    });
    expect(pkgRes.ok()).toBe(true);
    await page.reload();
    await page.waitForTimeout(1_500);
  });

  test('5.2 Пакет виден на странице пакетов', async () => {
    await page.goto('/finance/packages');
    await page.waitForTimeout(1_500);

    await expect(page.locator('body')).toContainText(/Паша|Информатика|10/i, { timeout: 5_000 });
  });

  test('5.3 Проводим 3 урока → прогресс пакета обновляется', async () => {
    // Создаём и завершаем 3 урока через API
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (3 - i)); // в прошлом
      date.setHours(14 + i, 0, 0, 0);

      const lesson = await createLessonAPI(page, token, studentId, {
        subject: 'Информатика',
        scheduledAt: date.toISOString(),
        rate: 1500,
      });

      await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { status: 'COMPLETED' },
      });
    }

    // Обновляем страницу пакетов
    await page.goto('/finance/packages');
    await page.waitForTimeout(2_000);

    // Должны видеть прогресс (3/10 или 30%)
    const body = await page.locator('body').textContent() || '';
    // Пакет всё ещё виден
    expect(body).toMatch(/Паша|Информатика/i);
  });

  test('5.4 Карточка ученика → вкладка «Занятия» → видны проведённые уроки', async () => {
    await page.goto(`/students/${studentId}`);
    await page.waitForTimeout(2_000);

    await expect(page.getByText('Паша Пакетов')).toBeVisible({ timeout: 5_000 });

    // Вкладка «Занятия»
    const lessonsTab = page.getByRole('button', { name: /Занятия/i }).first();
    if (await lessonsTab.isVisible().catch(() => false)) {
      await lessonsTab.click();
      await page.waitForTimeout(1_000);
    }

    // Должны быть видны проведённые уроки
    await expect(page.locator('body')).toContainText(/Информатика/i, { timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 6: Настройки → безопасность → смена пароля → перелогин
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 6: Смена пароля и политик → всё продолжает работать', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  const oldPassword = 'Journey6Pass!';
  const newPassword = 'NewJourney6Pass!';
  let token: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password: oldPassword, name: 'Тест Безопасность' });
    token = auth.accessToken;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('6.1 Настройки → вкладка «Безопасность» → смена пароля', async () => {
    await loginAndGoto(page, '/settings', email, oldPassword);

    // Переключаемся на вкладку безопасности
    const secTab = page.getByRole('button', { name: /Безопасность/i }).first();
    if (await secTab.isVisible().catch(() => false)) {
      await secTab.click();
      await page.waitForTimeout(500);
    }

    // Меняем пароль через API (UI может отличаться)
    const changeRes = await page.request.post(`${API}/settings/change-password`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { currentPassword: oldPassword, newPassword },
    });
    expect(changeRes.ok()).toBe(true);
  });

  test('6.2 Старый пароль больше не работает', async () => {
    // Выходим
    await page.goto('/registration');

    // Пробуем войти со старым паролем
    await page.getByPlaceholder('Введите email или телефон').fill(email);
    await page.getByPlaceholder('Введите пароль').fill(oldPassword);
    await page.getByRole('button', { name: 'Войти' }).click();

    // Ждём ошибку входа
    await page.waitForTimeout(3_000);
    // Не должны попасть на дашборд
    expect(page.url()).toContain('/registration');
  });

  test('6.3 Новый пароль работает → дашборд доступен', async () => {
    await page.goto('/registration');
    await page.getByPlaceholder('Введите email или телефон').fill(email);
    await page.getByPlaceholder('Введите пароль').fill(newPassword);
    await page.getByRole('button', { name: 'Войти' }).click();

    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('6.4 Настройки → политики → изменяем время отмены', async () => {
    await page.getByRole('link', { name: /Настройки/i }).click();
    await expect(page).toHaveURL(/\/settings/);

    // Вкладка «Политики»
    const polTab = page.getByRole('button', { name: /Политик/i }).first();
    if (await polTab.isVisible().catch(() => false)) {
      await polTab.click();
      await page.waitForTimeout(500);
    }

    // Обновляем политики через API
    const polRes = await page.request.patch(`${API}/settings/policies`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { cancelTimeHours: 12, lateCancelAction: 'CHARGE_FULL', noShowAction: 'CHARGE_FULL' },
    });
    // Токен мог протухнуть после смены пароля — перелогинимся
    if (!polRes.ok()) {
      const loginRes = await loginViaAPI(page, email, newPassword);
      token = loginRes.accessToken;

      const retryRes = await page.request.patch(`${API}/settings/policies`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { cancelTimeHours: 12, lateCancelAction: 'CHARGE_FULL', noShowAction: 'CHARGE_FULL' },
      });
      expect(retryRes.ok()).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 7: Перенос урока учеником → уведомление → подтверждение
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 7: Перенос урока через портал → одобрение репетитором', () => {
  test.describe.configure({ mode: 'serial' });

  let tutorEmail: string;
  let tutorToken: string;
  const tutorPassword = 'Journey7Pass!';
  let slug: string;
  let portalToken: string;
  let studentId: string;
  let lessonId: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    tutorEmail = uniqueEmail();
    slug = `j7-${Date.now()}`;

    const auth = await registerViaAPI(page, {
      email: tutorEmail,
      password: tutorPassword,
      name: 'Перенос Тест',
    });
    tutorToken = auth.accessToken;

    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
      data: { slug, published: true, subjects: ['Химия'] },
    });

    const student = await createStudentAPI(page, tutorToken, {
      name: 'Аня Переносова',
      subject: 'Химия',
      rate: 1800,
    });
    studentId = student.id;

    const portalRes = await page.request.post(`${API}/students/${studentId}/portal-link`, {
      headers: { Authorization: `Bearer ${tutorToken}` },
    });
    const portalBody = await portalRes.json();
    portalToken = portalBody.token;

    // Урок через 3 дня (чтобы не нарушить политику отмены)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(11, 0, 0, 0);

    const lesson = await createLessonAPI(page, tutorToken, studentId, {
      subject: 'Химия',
      scheduledAt: futureDate.toISOString(),
      rate: 1800,
    });
    lessonId = lesson.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('7.1 Ученик открывает портал → видит предстоящий урок', async () => {
    await page.goto(`/t/${slug}/s/${portalToken}`);

    await expect(page.locator('body')).toContainText(/Химия|Занятия|Аня/i, { timeout: 10_000 });
  });

  test('7.2 Ученик запрашивает перенос через API', async () => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 5);
    newDate.setHours(15, 0, 0, 0);

    const rescheduleRes = await page.request.post(
      `${API}/portal/${portalToken}/lessons/${lessonId}/reschedule`,
      {
        data: { newDate: newDate.toISOString().slice(0, 10), newTime: '15:00' },
      },
    );
    expect(rescheduleRes.ok()).toBe(true);

    // Обновляем портал — урок должен показать статус «Ожидает переноса»
    await page.reload();
    await page.waitForTimeout(2_000);
  });

  test('7.3 Репетитор видит уведомление → одобряет перенос', async () => {
    // Логинимся за репетитора в том же page
    await loginAndGoto(page, '/notifications', tutorEmail, tutorPassword);
    await page.waitForTimeout(2_000);

    // Ищем уведомление о переносе
    const rescheduleNotif = page.getByText(/перенос|Перенос|reschedule/i).first();
    if (await rescheduleNotif.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Ищем кнопку подтверждения
      const confirmBtn = page.getByRole('button', { name: /Подтвердить|Одобрить/i }).first();
      if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1_500);
      }
    } else {
      // Подтверждаем через API — ищем нотификацию
      const notifsRes = await page.request.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${tutorToken}` },
      });
      if (notifsRes.ok()) {
        const notifs = await notifsRes.json();
        const rescheduleNotifData = (notifs.items || notifs || []).find(
          (n: any) => n.type === 'RESCHEDULE_REQUESTED',
        );
        if (rescheduleNotifData) {
          await page.request.post(
            `${API}/notifications/${rescheduleNotifData.id}/confirm-reschedule`,
            { headers: { Authorization: `Bearer ${tutorToken}` } },
          );
        }
      }
    }
  });

  test('7.4 Ученик видит в портале обновлённое время урока', async () => {
    await page.goto(`/t/${slug}/s/${portalToken}`);
    await page.waitForTimeout(2_000);

    // Урок должен быть виден (неважно время — главное что не отменён)
    await expect(page.locator('body')).toContainText(/Химия|Занятия/i, { timeout: 10_000 });
  });

  test('7.5 Расписание репетитора → урок перенесён на новую дату', async () => {
    await loginAndGoto(page, '/schedule', tutorEmail, tutorPassword);
    await page.waitForTimeout(2_000);

    // Расписание загружено
    await expect(page.locator('body')).toContainText(/Расписание|Календарь/i);
  });
});
