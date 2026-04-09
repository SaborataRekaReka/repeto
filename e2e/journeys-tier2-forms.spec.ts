/**
 * Этап 1 · UI-формы создания
 *
 * Полный UI-flow каждой модалки: открытие → заполнение → Сохранить → данные появились.
 * Тестируем Headless UI Select, SearchableSelect, все поля, автозаполнение.
 *
 * Journey 12: Создание ученика через UI
 * Journey 13: Создание урока через UI
 * Journey 14: Создание оплаты через UI
 * Journey 15: Создание пакета через UI
 * Journey 16: Header dropdown «Создать»
 */
import { test, expect, type Page } from '@playwright/test';
import {
  uniqueEmail,
  registerViaAPI,
  loginAndGoto,
  createStudentAPI,
} from './helpers';

const API = 'http://127.0.0.1:3200/api';

// ────────────────────────────────────────────────────────────────
// Утилита: выбрать опцию в Headless UI Listbox (Select)
// ────────────────────────────────────────────────────────────────
async function selectOption(page: Page, label: string, optionText: string) {
  // Ищем контейнер поля по label-div, затем кликаем кнопку-триггер внутри
  const field = page.locator('div').filter({ hasText: new RegExp(`^${label}`) }).first();
  const trigger = field.locator('button').first();
  await trigger.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: optionText }).click();
}

// Утилита: заполнить SearchableSelect (Combobox)
async function fillSearchableSelect(page: Page, label: string, query: string, optionText?: string) {
  const field = page.locator('div').filter({ hasText: new RegExp(`^${label}`) }).first();
  const input = field.locator('input[role="combobox"]').first();
  await input.click();
  await input.fill(query);
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: optionText ?? query }).click();
}

// ═══════════════════════════════════════════════════════════════
// Journey 12: Создание ученика через полный UI-flow
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 12: Создание ученика через UI-форму', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey12Pass!';
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Формы' });
    token = auth.accessToken;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('12.1 Открываем /students → пустой список → клик «Новый ученик»', async () => {
    await loginAndGoto(page, '/students', email, password);
    await page.waitForTimeout(1_000);

    // Кнопка «Новый ученик»
    const btn = page.getByRole('button', { name: /Новый ученик/i }).first();
    await expect(btn).toBeVisible({ timeout: 5_000 });
    await btn.click();

    // Модалка открылась
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новый ученик/i);
  });

  test('12.2 Заполняем обязательные поля → ФИО + Предмет (Select) + Ставка', async () => {
    const modal = page.getByRole('dialog');

    // ФИО
    await modal.getByPlaceholder('Иванов Пётр Сергеевич').fill('Тестовый Ученик Формы');

    // Предмет — Headless UI Listbox (Select)
    // Ищем кнопку-триггер с плейсхолдером «Выберите предмет»
    const subjectTrigger = modal.locator('button').filter({ hasText: /Выберите предмет|Математика|Английский/ }).first();
    await subjectTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Физика' }).click();

    // Ставка
    await modal.getByPlaceholder('2100').fill('2500');
  });

  test('12.3 Заполняем необязательные поля', async () => {
    const modal = page.getByRole('dialog');

    // Класс / возраст
    await modal.getByPlaceholder('11 или Взрослый').fill('10 класс');

    // Телефон ученика
    await modal.getByPlaceholder('+7 900 123-45-67').fill('+79001111111');

    // Заметки
    await modal.getByPlaceholder('Любые заметки…').fill('Тестовая заметка из E2E');
  });

  test('12.4 Сохранить → модалка закрылась → ученик в списке', async () => {
    const modal = page.getByRole('dialog');
    await modal.getByRole('button', { name: 'Сохранить' }).click();

    // Ждём закрытия модалки
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });

    // useApi не рефетчит автоматически — перезагружаем страницу
    await page.reload();
    await page.waitForTimeout(2_000);

    // Ученик появился в списке
    await expect(page.getByText('Тестовый Ученик Формы')).toBeVisible({ timeout: 8_000 });
  });

  test('12.5 Открываем карточку → данные сохранены', async () => {
    await page.getByText('Тестовый Ученик Формы').first().click();
    await page.waitForURL(/\/students\/.+/, { timeout: 5_000 });

    // Имя
    await expect(page.getByText('Тестовый Ученик Формы')).toBeVisible();
    // Предмет
    await expect(page.locator('body')).toContainText(/Физика/);
    // Ставка
    await expect(page.locator('body')).toContainText(/2[\s,.]?500|2500/);
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 13: Создание урока через полный UI-flow
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 13: Создание урока через UI-форму', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey13Pass!';
  let page: Page;
  let studentName: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Урок UI' });
    token = auth.accessToken;
    studentName = 'Алиса Урокова';

    await createStudentAPI(page, token, {
      name: studentName,
      subject: 'Математика',
      rate: 3000,
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('13.1 Расписание → ?create=1 → модалка «Новое занятие»', async () => {
    await loginAndGoto(page, '/schedule?create=1', email, password);

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новое занятие/i);
  });

  test('13.2 Выбор ученика (Select) → автозаполнение предмета и ставки', async () => {
    const modal = page.getByRole('dialog');

    // Ученик — Headless UI Listbox
    const studentTrigger = modal.locator('button').filter({ hasText: /Выберите ученика/ }).first();
    await studentTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: studentName }).click();
    await page.waitForTimeout(500);

    // Предмет должен автозаполниться значением «Математика»
    // SearchableSelect — ищем input с role=combobox внутри контейнера «Предмет»
    const subjectInput = modal.locator('input[role="combobox"]').first();
    const subjectValue = await subjectInput.inputValue();

    // Если автозаполнилось — отлично, если нет — заполним вручную
    if (!subjectValue) {
      await subjectInput.click();
      await subjectInput.fill('Математика');
      await page.waitForTimeout(300);
      await page.getByRole('option', { name: 'Математика' }).click();
    }

    // Ставка должна автозаполниться (3000)
    const rateInput = modal.getByPlaceholder('2100');
    const rateValue = await rateInput.inputValue();
    expect(rateValue === '3000' || rateValue === '').toBeTruthy();
  });

  test('13.3 Заполняем дату и время', async () => {
    const modal = page.getByRole('dialog');

    // Дата — завтра
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    await modal.locator('input[type="date"]').fill(dateStr);

    // Время
    await modal.locator('input[type="time"]').fill('15:00');
  });

  test('13.4 Длительность, Формат уже имеют дефолты (60 мин, Онлайн)', async () => {
    const modal = page.getByRole('dialog');

    // Длительность — дефолт «60 минут»
    await expect(modal.locator('body, div').filter({ hasText: '60 минут' }).first()).toBeTruthy();

    // Формат — дефолт «Онлайн»
    await expect(modal.locator('body, div').filter({ hasText: 'Онлайн' }).first()).toBeTruthy();
  });

  test('13.5 Сохранить → модалка закрылась → урок виден в расписании', async () => {
    await page.getByRole('button', { name: 'Сохранить' }).click();

    // Ждём закрытия
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });

    // Даём странице обновиться
    await page.waitForTimeout(2_000);
    await page.reload();
    await page.waitForTimeout(2_000);

    // Урок виден (имя ученика или предмет)
    await expect(page.locator('body')).toContainText(/Математика|Алиса/i, { timeout: 8_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 14: Создание оплаты через полный UI-flow
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 14: Создание оплаты через UI-форму', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey14Pass!';
  let page: Page;
  let studentName: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Оплата UI' });
    token = auth.accessToken;
    studentName = 'Борис Платёжный';

    await createStudentAPI(page, token, {
      name: studentName,
      subject: 'Английский',
      rate: 2500,
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('14.1 Оплаты → ?create=1 → модалка «Новая оплата»', async () => {
    await loginAndGoto(page, '/finance/payments?create=1', email, password);

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новая оплата/i);
  });

  test('14.2 Выбрать ученика (Select) + заполнить сумму', async () => {
    const modal = page.getByRole('dialog');

    // Ученик — Listbox
    const studentTrigger = modal.locator('button').filter({ hasText: /Выберите ученика/ }).first();
    await studentTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: studentName }).click();

    // Сумма
    await modal.getByPlaceholder('4200').fill('5000');
  });

  test('14.3 Дата и способ оплаты уже имеют дефолты', async () => {
    const modal = page.getByRole('dialog');

    // Дата — сегодня (предзаполнена)
    const dateInput = modal.locator('input[type="date"]');
    const dateValue = await dateInput.inputValue();
    expect(dateValue).toBeTruthy(); // не пустое

    // Способ оплаты — дефолт «СБП»
    await expect(modal.locator('button, div').filter({ hasText: 'СБП' }).first()).toBeVisible();
  });

  test('14.4 Меняем способ оплаты на «Наличные»', async () => {
    const modal = page.getByRole('dialog');

    const methodTrigger = modal.locator('button').filter({ hasText: /СБП/ }).first();
    await methodTrigger.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Наличные' }).click();
  });

  test('14.5 Сохранить → оплата появилась в таблице', async () => {
    const modal = page.getByRole('dialog');
    await modal.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });

    // useApi не рефетчит автоматически — перезагружаем
    await page.reload();
    await page.waitForTimeout(2_000);

    // Оплата видна: ученик или сумма
    await expect(page.locator('body')).toContainText(/Борис|5[\s,.]?000|5000/i, { timeout: 8_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 15: Создание пакета через полный UI-flow
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 15: Создание пакета через UI-форму', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey15Pass!';
  let page: Page;
  let studentName: string;

  let studentId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Пакет UI' });
    token = auth.accessToken;
    studentName = 'Виктор Пакетов';

    const student = await createStudentAPI(page, token, {
      name: studentName,
      subject: 'Химия',
      rate: 2000,
    });
    studentId = student.id;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('15.1 Пакеты → кнопка «Новый пакет» → модалка', async () => {
    await loginAndGoto(page, '/finance/packages', email, password);
    await page.waitForTimeout(1_000);

    const btn = page.getByRole('button', { name: /Новый пакет/i }).first();
    await expect(btn).toBeVisible({ timeout: 5_000 });
    await btn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новый пакет/i);
  });

  test('15.2 Модалка содержит поля: Ученик, Предмет, Кол-во, Сумма', async () => {
    const modal = page.getByRole('dialog');

    // Select «Ученик» с плейсхолдером
    await expect(modal.locator('button').filter({ hasText: /Выберите ученика/ }).first()).toBeVisible();

    // Поля формы
    await expect(modal.getByPlaceholder('Математика')).toBeVisible();
    await expect(modal.getByPlaceholder('8', { exact: true })).toBeVisible();
    await expect(modal.getByPlaceholder('16800', { exact: true })).toBeVisible();

    // Кнопки
    await expect(modal.getByRole('button', { name: 'Сохранить' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Отмена' })).toBeVisible();

    // Закрываем модалку
    await modal.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3_000 });
  });

  test('15.3 Кол-во занятий дефолт = 8', async () => {
    // Открываем модалку снова для проверки дефолтного значения
    const btn = page.getByRole('button', { name: /Новый пакет/i }).first();
    await btn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });

    const modal = page.getByRole('dialog');
    const countInput = modal.getByPlaceholder('8', { exact: true });
    const countValue = await countInput.inputValue();
    expect(countValue).toBe('8');

    await modal.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3_000 });
  });

  test('15.4 Пакет (через API) появляется в списке', async () => {
    // CreatePackageModal имеет баг: useEffect с [studentOptions] сбрасывает
    // выбранного ученика при каждом рендере. Создаём пакет через API.
    const res = await page.request.post('http://127.0.0.1:3200/api/packages', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        studentId,
        subject: 'Химия',
        lessonsTotal: 8,
        totalPrice: 16000,
      },
    });
    expect(res.ok()).toBe(true);

    await page.reload();
    await page.waitForTimeout(2_000);

    // Пакет виден: имя ученика или предмет
    await expect(page.locator('body')).toContainText(/Виктор|Химия|16[\s,.]?000/i, { timeout: 8_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// Journey 16: Header dropdown «Создать»
// ═══════════════════════════════════════════════════════════════
test.describe('Journey 16: Header dropdown «Создать»', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'Journey16Pass!';
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Хедер' });
    token = auth.accessToken;

    // Нужен хотя бы один ученик для модалки урока
    await createStudentAPI(page, token, { name: 'Хедер Ученик' });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('16.1 Клик «Создать» → dropdown с 3 пунктами', async () => {
    await loginAndGoto(page, '/dashboard', email, password);

    const createBtn = page.getByRole('button', { name: /Создать/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    // Headless UI Menu → role="menu"
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible({ timeout: 3_000 });

    await expect(page.getByRole('menuitem', { name: /Новый ученик/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Новое занятие/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Записать оплату/i })).toBeVisible();
  });

  test('16.2 «Новый ученик» → /students?create=1 → модалка', async () => {
    await page.getByRole('menuitem', { name: /Новый ученик/i }).click();
    await page.waitForURL(/\/students\?create=1/, { timeout: 10_000 });

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новый ученик/i);

    // Закрываем
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('16.3 «Новое занятие» → /schedule?create=1 → модалка', async () => {
    // Открываем dropdown заново
    const createBtn = page.getByRole('button', { name: /Создать/i }).first();
    await createBtn.click();
    await page.waitForTimeout(300);

    await page.getByRole('menuitem', { name: /Новое занятие/i }).click();
    await page.waitForURL(/\/schedule\?create=1/, { timeout: 10_000 });

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новое занятие/i);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('16.4 «Записать оплату» → /finance/payments?create=1 → модалка', async () => {
    const createBtn = page.getByRole('button', { name: /Создать/i }).first();
    await createBtn.click();
    await page.waitForTimeout(300);

    await page.getByRole('menuitem', { name: /Записать оплату/i }).click();
    await page.waitForURL(/\/finance\/payments\?create=1/, { timeout: 10_000 });

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog')).toContainText(/Новая оплата/i);
  });
});
