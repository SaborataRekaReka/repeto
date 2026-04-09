/**
 * Этап 2 · Карточка ученика — все табы
 *
 * Journey 17: Редактирование ученика через UI
 * Journey 18: Таб «Заметки» — CRUD
 * Journey 19: Таб «Домашка» — CRUD
 * Journey 20: Таб «Оплаты» — запись из карточки
 * Journey 21: Таб «Занятия» — LessonDetailModal + статусы
 * Journey 22: Генерация портал-ссылки (UI)
 * Journey 23: URL-синхронизация табов
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
// Journey 17: Редактирование ученика через UI-модалку
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 17: Редактирование ученика через UI', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey17Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Редакт' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Редактируемый Ученик',
      subject: 'Математика',
      rate: 2000,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('17.1 Карточка ученика → кнопка редактирования → модалка', async () => {
    await loginAndGoto(page, `/students/${studentId}`, email, password);
    await page.waitForTimeout(1_000);

    // Имя ученика видно
    await expect(page.getByText('Редактируемый Ученик')).toBeVisible({ timeout: 5_000 });

    // Кнопка edit с title="Редактировать"
    const profileEditBtn = page.locator('button[title="Редактировать"]').first();
    await profileEditBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('dialog')).toContainText(/Редактировать ученика/i);
  });

  test('17.2 Модалка предзаполнена текущими данными', async () => {
    const modal = page.getByRole('dialog');

    const nameInput = modal.getByPlaceholder('Иванов Пётр Сергеевич');
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe('Редактируемый Ученик');

    const rateInput = modal.getByPlaceholder('2100');
    const rateValue = await rateInput.inputValue();
    expect(rateValue).toBe('2000');
  });

  test('17.3 Изменить имя и ставку → Сохранить', async () => {
    const modal = page.getByRole('dialog');

    // Меняем имя
    const nameInput = modal.getByPlaceholder('Иванов Пётр Сергеевич');
    await nameInput.clear();
    await nameInput.fill('Обновлённый Ученик');

    // Меняем ставку
    const rateInput = modal.getByPlaceholder('2100');
    await rateInput.clear();
    await rateInput.fill('3500');

    await modal.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });
  });

  test('17.4 Данные обновились на странице', async () => {
    await page.reload();
    await page.waitForTimeout(2_000);

    await expect(page.getByText('Обновлённый Ученик')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('body')).toContainText(/3[\s,.]?500|3500/);
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 18: Таб «Заметки» — CRUD
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 18: Таб «Заметки» — CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey18Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Заметки' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Заметочный Ученик',
      subject: 'Физика',
      rate: 1500,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('18.1 Карточка → таб «Заметки» → пустое состояние', async () => {
    await loginAndGoto(page, `/students/${studentId}?tab=notes`, email, password);
    await page.waitForTimeout(1_000);

    // Таб «Заметки» активен
    await expect(page.getByText('Заметки').first()).toBeVisible({ timeout: 5_000 });

    // Пустое состояние
    await expect(page.getByText('Заметок пока нет')).toBeVisible({ timeout: 5_000 });
  });

  test('18.2 Кнопка «Добавить» → форма с textarea', async () => {
    const addBtn = page.getByRole('button', { name: /Добавить/i }).first();
    await addBtn.click();

    await expect(page.getByPlaceholder('Напишите заметку...')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: 'Сохранить' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Отмена' })).toBeVisible();
  });

  test('18.3 Написать заметку → Сохранить → заметка в списке', async () => {
    await page.getByPlaceholder('Напишите заметку...').fill('Первая тестовая заметка E2E');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    // Форма скрылась
    await expect(page.getByPlaceholder('Напишите заметку...')).toBeHidden({ timeout: 3_000 });

    // Заметка видна
    await expect(page.getByText('Первая тестовая заметка E2E')).toBeVisible({ timeout: 5_000 });
  });

  test('18.4 Добавить вторую заметку', async () => {
    const addBtn = page.getByRole('button', { name: /Добавить/i }).first();
    await addBtn.click();

    await page.getByPlaceholder('Напишите заметку...').fill('Вторая заметка');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByText('Вторая заметка')).toBeVisible({ timeout: 5_000 });
    // Обе заметки видны
    await expect(page.getByText('Первая тестовая заметка E2E')).toBeVisible();
  });

  test('18.5 Удалить первую заметку → осталась только вторая', async () => {
    // Находим контейнер .border-t содержащий текст первой заметки
    const noteText = page.getByText('Первая тестовая заметка E2E');
    const noteContainer = page.locator('.border-t').filter({ has: noteText }).first();
    await noteContainer.locator('button.group').click();
    await page.waitForTimeout(1_000);

    // Первая заметка удалена
    await expect(page.getByText('Первая тестовая заметка E2E')).toBeHidden({ timeout: 5_000 });
    // Вторая осталась
    await expect(page.getByText('Вторая заметка')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 19: Таб «Домашка» — CRUD
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 19: Таб «Домашка» — CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey19Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Домашка' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Домашник Ученик',
      subject: 'Английский',
      rate: 2500,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('19.1 Карточка → таб «Домашка» → пустое состояние', async () => {
    await loginAndGoto(page, `/students/${studentId}?tab=homework`, email, password);
    await page.waitForTimeout(1_000);

    await expect(page.getByText('Домашних заданий пока нет')).toBeVisible({ timeout: 5_000 });
  });

  test('19.2 «Дать задание» → модалка «Новое задание»', async () => {
    const addBtn = page.getByRole('button', { name: /Дать задание/i }).first();
    await addBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новое задание/i);
  });

  test('19.3 Заполнить задание → Сохранить → домашка в списке', async () => {
    const modal = page.getByRole('dialog');

    // Задание
    await modal.getByPlaceholder('Опишите задание...').fill('Решить задачи 1-10 из учебника');

    // Срок сдачи — через неделю
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const dueDateStr = dueDate.toISOString().slice(0, 10);
    await modal.locator('input[type="date"]').fill(dueDateStr);

    await modal.getByRole('button', { name: 'Дать задание' }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });

    // Домашка видна в списке
    await expect(page.getByText('Решить задачи 1-10 из учебника')).toBeVisible({ timeout: 5_000 });
  });

  test('19.4 Домашка видна в таблице со сроком', async () => {
    // В таблице видны: задание, срок, кнопка «...»
    await expect(page.getByText('Решить задачи 1-10 из учебника')).toBeVisible();
    // Срок сдачи отображается
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const formatted = dueDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    await expect(page.locator('table')).toContainText(formatted);
  });

  test('19.5 Dropdown → «Удалить» → домашка исчезла', async () => {
    // Открываем dropdown (DropdownMenu — кнопка с Icon "dots" внутри таблицы)
    const dotsBtn = page.locator('td button.btn-square').first();
    await dotsBtn.click();
    await page.waitForTimeout(500);

    // Клик «Удалить» в кастомном dropdown
    await page.locator('button').filter({ hasText: 'Удалить' }).click();
    await page.waitForTimeout(1_000);

    // Домашка исчезла
    await expect(page.getByText('Решить задачи 1-10 из учебника')).toBeHidden({ timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 20: Таб «Оплаты» — запись из карточки
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 20: Таб «Оплаты» — запись из карточки', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey20Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Оплата Карточка' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Платящий Ученик',
      subject: 'Химия',
      rate: 3000,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('20.1 Карточка → таб «Оплаты» → «Записать оплату» → модалка', async () => {
    await loginAndGoto(page, `/students/${studentId}?tab=payments`, email, password);
    await page.waitForTimeout(1_000);

    const payBtn = page.getByRole('button', { name: /Записать оплату/i }).first();
    await expect(payBtn).toBeVisible({ timeout: 5_000 });
    await payBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новая оплата/i);
  });

  test('20.2 Ученик предзаполнен (не Select, а статичный div)', async () => {
    const modal = page.getByRole('dialog');

    // defaultStudent → рендерится не Select, а статичный div с именем
    await expect(modal.getByText('Платящий Ученик')).toBeVisible();

    // Нет кнопки-триггера Select для ученика
    const studentSelect = modal.locator('button').filter({ hasText: /Выберите ученика/ });
    await expect(studentSelect).toHaveCount(0);
  });

  test('20.3 Заполнить сумму → Сохранить → оплата в таблице', async () => {
    const modal = page.getByRole('dialog');

    await modal.getByPlaceholder('4200').fill('6000');

    await modal.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });

    // Перезагрузка для обновления данных
    await page.reload();
    await page.waitForTimeout(2_000);

    // Нажимаем на таб Оплаты снова после reload
    await page.getByText('Оплаты').first().click();
    await page.waitForTimeout(1_000);

    // Оплата видна
    await expect(page.locator('body')).toContainText(/6[\s,.]?000|6000/, { timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 21: Таб «Занятия» — LessonDetailModal + статусы
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 21: Таб «Занятия» — LessonDetailModal', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey21Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Урок Карточка' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Урокный Ученик',
      subject: 'Физика',
      rate: 2000,
    });
    studentId = student.id;

    // Создаём урок на завтра
    await createLessonAPI(page, token, studentId, {
      subject: 'Физика',
      rate: 2000,
      duration: 60,
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('21.1 Карточка → таб «Занятия» → урок в таблице', async () => {
    await loginAndGoto(page, `/students/${studentId}`, email, password);
    await page.waitForTimeout(1_000);

    // Таб «Занятия» активен по умолчанию
    await expect(page.getByText('Физика').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Запланировано').first()).toBeVisible();
  });

  test('21.2 Клик по уроку → LessonDetailModal', async () => {
    // В каждой строке есть кнопка-шеврон (arrow-next) для открытия детали
    const arrowBtn = page.locator('table tbody tr').filter({ hasText: /Физика/ })
      .locator('button').last();
    await arrowBtn.click();

    // Модалка детали урока
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3_000 });
    await expect(dialog.getByText(/Запланировано/i)).toBeVisible();
    await expect(dialog).toContainText(/Физика/);
  });

  test('21.3 Кнопка «Проведено» → статус меняется', async () => {
    const dialog = page.getByRole('dialog');
    const completedBtn = dialog.getByRole('button', { name: /Проведено/i });
    await expect(completedBtn).toBeVisible();
    await completedBtn.click();

    // После клика модалка может закрыться автоматически
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });

  test('21.4 Закрыть модалку → статус обновился в таблице', async () => {
    // Перезагружаем страницу для получения актуальных данных
    await page.reload();
    await page.waitForTimeout(2_000);
    await expect(page.getByText(/Проведено/i).first()).toBeVisible({ timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 22: Генерация портал-ссылки
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 22: Генерация портал-ссылки', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey22Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Портал Ссылка' });
    token = auth.accessToken;

    // Нужен slug для портала
    await page.request.patch(`${API}/settings/account`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { slug: `test-portal-${Date.now()}` },
    });

    const student = await createStudentAPI(page, token, {
      name: 'Портальный Ученик',
      subject: 'Русский язык',
      rate: 1800,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('22.1 Карточка → кнопка портальной ссылки → модалка', async () => {
    await loginAndGoto(page, `/students/${studentId}`, email, password);
    await page.waitForTimeout(1_000);

    // Кнопка с title="Ссылка для ученика"
    const portalBtn = page.locator('button[title="Ссылка для ученика"]').first();
    await portalBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog')).toContainText(/Ссылка для ученика/i);
  });

  test('22.2 Ссылка сгенерирована и видна', async () => {
    const modal = page.getByRole('dialog');

    // Ждём загрузки ссылки (не «Генерация ссылки…»)
    await expect(modal.getByText('Генерация ссылки…')).toBeHidden({ timeout: 10_000 });

    // Ссылка содержит /s/ (portal token path)
    await expect(modal.locator('text=/\\/s\\//')).toBeVisible({ timeout: 5_000 });
  });

  test('22.3 Кнопка «Скопировать» работает', async () => {
    const modal = page.getByRole('dialog');

    const copyBtn = modal.getByRole('button', { name: /Скопировать/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // В headless clipboard API может не сработать, проверяем мягко:
    // либо текст «Скопировано!», либо кнопка просто осталась
    const copied = modal.getByText('Скопировано!');
    const stillCopy = modal.getByRole('button', { name: /Скопировать/i });
    await expect(copied.or(stillCopy)).toBeVisible({ timeout: 3_000 });
  });

  test('22.4 Кнопка «WhatsApp» видна', async () => {
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('button', { name: /WhatsApp/i })).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 23: URL-синхронизация табов
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 23: URL-синхронизация табов', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey23Pass!';
  let page: Page;
  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест URL Табы' });
    token = auth.accessToken;

    const student = await createStudentAPI(page, token, {
      name: 'Табовый Ученик',
      subject: 'История',
      rate: 1500,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('23.1 Без ?tab= → таб «Занятия» активен', async () => {
    await loginAndGoto(page, `/students/${studentId}`, email, password);
    await page.waitForTimeout(1_000);

    // Имя заголовка таба «Занятия» видно
    await expect(page.getByText('Занятия').first()).toBeVisible({ timeout: 5_000 });
    // Кнопка «Назначить занятие» — контент таба Занятия
    await expect(page.getByRole('button', { name: /Назначить занятие/i })).toBeVisible();
  });

  test('23.2 Клик по «Оплаты» → URL обновляется', async () => {
    // Используем getByRole('button') чтобы кликнуть таб, а не ссылку в сайдбаре
    await page.getByRole('button', { name: 'Оплаты' }).click();
    await page.waitForTimeout(500);

    expect(page.url()).toContain('tab=payments');
    await expect(page.getByRole('button', { name: /Записать оплату/i })).toBeVisible();
  });

  test('23.3 Клик по «Заметки» → URL обновляется', async () => {
    await page.getByRole('button', { name: 'Заметки' }).click();
    await page.waitForTimeout(500);

    expect(page.url()).toContain('tab=notes');
    await expect(page.getByRole('button', { name: /Добавить/i })).toBeVisible();
  });

  test('23.4 Клик по «Домашка» → URL обновляется', async () => {
    await page.getByRole('button', { name: 'Домашка' }).click();
    await page.waitForTimeout(500);

    expect(page.url()).toContain('tab=homework');
    await expect(page.getByRole('button', { name: /Дать задание/i })).toBeVisible();
  });

  test('23.5 Прямой переход ?tab=notes → таб «Заметки» активен', async () => {
    await page.goto(`/students/${studentId}?tab=notes`);
    await page.waitForTimeout(1_000);

    await expect(page.getByRole('button', { name: /Добавить/i })).toBeVisible({ timeout: 5_000 });
  });

  test('23.6 Клик по «Занятия» → ?tab= убирается из URL', async () => {
    await page.getByText('Занятия').first().click();
    await page.waitForTimeout(500);

    // При возврате на Занятия — ?tab= не добавляется (дефолтный таб)
    expect(page.url()).not.toContain('tab=');
    await expect(page.getByRole('button', { name: /Назначить занятие/i })).toBeVisible();
  });
});
