import { test, expect, type Page } from '@playwright/test';
import {
  uniqueEmail,
  registerViaAPI,
  loginAndGoto,
  createStudentAPI,
  deleteAccount,
} from './helpers';

const NAV_MATRIX: Array<{ label: string; url: RegExp; marker: RegExp }> = [
  { label: 'Дашборд', url: /\/dashboard/, marker: /Дашборд/i },
  { label: 'Ученики', url: /\/students/, marker: /Ученики/i },
  { label: 'Расписание', url: /\/schedule/, marker: /Расписание/i },
  { label: 'Финансы', url: /\/finance/, marker: /Финансы/i },
  { label: 'Оплаты', url: /\/payments/, marker: /Оплаты/i },
  { label: 'Пакеты', url: /\/packages/, marker: /Пакеты/i },
  { label: 'Материалы', url: /\/files/, marker: /Материалы/i },
  { label: 'Уведомления', url: /\/notifications/, marker: /Уведомления/i },
  { label: 'Настройки', url: /\/settings/, marker: /Настройки/i },
  { label: 'Поддержка', url: /\/support/, marker: /Поддержка/i },
];

async function openCreateMenu(page: Page) {
  const createBtn = page.getByRole('button', { name: /Добавить|Создать/i }).first();
  await expect(createBtn).toBeVisible({ timeout: 5_000 });
  await createBtn.click();
  await expect(page.getByText('Новый ученик').first()).toBeVisible({ timeout: 3_000 });
}

test.describe('UI Simulation Expanded: покрытие интерфейса', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'UiSimExpandPass123!';
  let page: Page;
  let studentName = '';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();

    const auth = await registerViaAPI(page, {
      email,
      password,
      name: 'UI Expanded Tutor',
    });

    token = auth.accessToken;
    studentName = `UI Matrix ${Date.now()}`;

    await createStudentAPI(page, token, {
      name: studentName,
      subject: 'Математика',
      rate: 2500,
    });
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  for (const [index, item] of NAV_MATRIX.entries()) {
    test(`UXM-NAV-${index + 1}: sidebar -> ${item.label}`, async () => {
      await loginAndGoto(page, '/dashboard', email, password);

      await page.getByRole('link', { name: item.label }).first().click();
      await expect(page).toHaveURL(item.url);
      await expect(page.locator('body')).toContainText(item.marker);
    });
  }

  test('UXM-CREATE-1: меню добавления содержит 3 действия', async () => {
    await loginAndGoto(page, '/dashboard', email, password);

    await openCreateMenu(page);
    await expect(page.getByText('Новый ученик').first()).toBeVisible();
    await expect(page.getByText('Новое занятие').first()).toBeVisible();
    await expect(page.getByText('Записать оплату').first()).toBeVisible();
  });

  test('UXM-CREATE-2: добавление -> новое занятие', async () => {
    await loginAndGoto(page, '/dashboard', email, password);

    await openCreateMenu(page);
    await page.getByText('Новое занятие').first().click();
    await expect(page).toHaveURL(/\/schedule(\?create=1)?$/);
    await expect(page.getByRole('dialog')).toContainText(/Новое занятие/i);
    await page.keyboard.press('Escape');
  });

  test('UXM-CREATE-3: добавление -> новая оплата', async () => {
    await loginAndGoto(page, '/dashboard', email, password);

    await openCreateMenu(page);
    await page.getByText('Записать оплату').first().click();
    await expect(page).toHaveURL(/\/payments(\?create=1)?$/);
    await expect(page.getByRole('dialog')).toContainText(/Новая оплата/i);
    await page.keyboard.press('Escape');
  });

  const studentTabs = ['Все', 'Активные', 'На паузе', 'Архив'];
  for (const [index, tabName] of studentTabs.entries()) {
    test(`UXM-STUDENTS-TAB-${index + 1}: переключение на «${tabName}»`, async () => {
      await loginAndGoto(page, '/students', email, password);

      const tab = page.getByRole('button', { name: tabName }).first();
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(page.locator('body')).toContainText(/Ученики/i);
    });
  }

  test('UXM-STUDENTS-5: поиск по ученику работает', async () => {
    await loginAndGoto(page, '/students', email, password);

    await page.getByPlaceholder('Поиск...').fill(studentName.slice(0, 8));
    await expect(page.getByText(studentName).first()).toBeVisible({ timeout: 8_000 });
  });

  test('UXM-STUDENTS-6: модалка нового ученика открывается и закрывается', async () => {
    await loginAndGoto(page, '/students', email, password);

    await page.getByRole('button', { name: /Новый ученик/i }).first().click();
    await expect(page.getByRole('dialog')).toContainText(/Новый ученик/i);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });
  });

  const scheduleViews = ['Месяц', 'Неделя', 'День'];
  for (const [index, viewName] of scheduleViews.entries()) {
    test(`UXM-SCHEDULE-VIEW-${index + 1}: переключение на «${viewName}»`, async () => {
      await loginAndGoto(page, '/schedule', email, password);

      const viewBtn = page.getByRole('radio', { name: viewName }).first();
      await expect(viewBtn).toBeVisible();
      await viewBtn.click();
      await expect(page.locator('body')).toContainText(/Расписание/i);
    });
  }

  test('UXM-SCHEDULE-4: модалка нового занятия из страницы расписания', async () => {
    await loginAndGoto(page, '/schedule', email, password);

    await page.getByRole('button', { name: /Новое занятие/i }).click();
    await expect(page.getByRole('dialog')).toContainText(/Новое занятие/i);
    await page.keyboard.press('Escape');
  });

  test('UXM-PAYMENTS-1: переключение вкладки «Все»', async () => {
    await loginAndGoto(page, '/payments', email, password);

    await page.getByRole('radio', { name: 'Все' }).first().click();
    await expect(page.locator('body')).toContainText(/Оплаты/i);
  });

  test('UXM-PAYMENTS-2: переключение вкладки «Оплачено»', async () => {
    await loginAndGoto(page, '/payments', email, password);

    await page.getByRole('radio', { name: 'Оплачено' }).first().click();
    await expect(page.locator('body')).toContainText(/Оплаты/i);
  });

  test('UXM-PAYMENTS-3: поиск ученика в оплатах', async () => {
    await loginAndGoto(page, '/payments', email, password);

    await page.getByPlaceholder('Поиск...').fill(studentName.slice(0, 6));
    await expect(page.locator('body')).toContainText(/Оплаты/i);
  });

  test('UXM-PAYMENTS-4: модалка новой оплаты открывается', async () => {
    await loginAndGoto(page, '/payments', email, password);

    await page.getByRole('button', { name: /Записать оплату/i }).first().click();
    await expect(page.getByRole('dialog')).toContainText(/Новая оплата/i);
    await page.keyboard.press('Escape');
  });

  const packageTabs = ['Все', 'Активные', 'Завершённые'];
  for (const [index, tabName] of packageTabs.entries()) {
    test(`UXM-PACKAGES-TAB-${index + 1}: переключение на «${tabName}»`, async () => {
      await loginAndGoto(page, '/packages', email, password);

      await page.getByRole('radio', { name: tabName }).first().click();
      await expect(page.locator('body')).toContainText(/Пакеты/i);
    });
  }

  test('UXM-PACKAGES-4: модалка нового пакета открывается', async () => {
    await loginAndGoto(page, '/packages', email, password);

    await page.getByRole('button', { name: /Новый пакет/i }).first().click();
    await expect(page.getByRole('dialog')).toContainText(/Новый пакет/i);
    await page.keyboard.press('Escape');
  });

  const notificationTabs = ['Все', 'Непрочитанные', 'Оплаты', 'Расписание'];
  for (const [index, tabName] of notificationTabs.entries()) {
    test(`UXM-NOTIFICATIONS-TAB-${index + 1}: вкладка «${tabName}»`, async () => {
      await loginAndGoto(page, '/notifications', email, password);

      await page.getByRole('radio', { name: tabName }).first().click();
      await expect(page.locator('body')).toContainText(/Уведомления/i);
    });
  }

  const settingsSections: Array<{ label: string; marker: RegExp }> = [
    { label: 'Аккаунт', marker: /Данные аккаунта/i },
    { label: 'Безопасность', marker: /Сменить пароль/i },
    { label: 'Уведомления', marker: /Настройки уведомлений/i },
    { label: 'Политики', marker: /Политика отмен/i },
    { label: 'Интеграции', marker: /Google Calendar|Яндекс.Календарь|Яндекс.Диск/i },
  ];

  for (const [index, section] of settingsSections.entries()) {
    test(`UXM-SETTINGS-${index + 1}: секция «${section.label}»`, async () => {
      await loginAndGoto(page, '/settings', email, password);

      await page.getByRole('button', { name: section.label }).first().click();
      await expect(page.locator('body')).toContainText(section.marker, { timeout: 8_000 });
    });
  }

  test('UXM-SUPPORT-1: поиск на главной поддержки', async () => {
    await loginAndGoto(page, '/support', email, password);

    await page.getByPlaceholder('Поиск по статьям...').fill('ученик');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/support\/search-result\?q=/);
    await expect(page.locator('body')).toContainText(/Результаты поиска/i);
  });

  test('UXM-SUPPORT-2: переход в категории', async () => {
    await loginAndGoto(page, '/support', email, password);

    await page.getByRole('link', { name: /Все категории/i }).click();
    await expect(page).toHaveURL(/\/support\/categories/);
    await expect(page.locator('body')).toContainText(/Категории/i);
  });

  test('UXM-SUPPORT-3: открытие статьи из разделов', async () => {
    await loginAndGoto(page, '/support', email, password);

    await page.locator('a[href*="/support/article"]').first().click();
    await expect(page).toHaveURL(/\/support\/article\?id=/);
    await expect(page.locator('body')).toContainText(/Поддержка/i);
  });

  test('UXM-RESP-1: мобильный dashboard загружается', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await ctx.newPage();

    await loginAndGoto(mobilePage, '/dashboard', email, password);
    await expect(mobilePage.locator('body')).toContainText(/Дашборд/i);

    await ctx.close();
  });

  test('UXM-RESP-2: мобильные ученики загружаются', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await ctx.newPage();

    await loginAndGoto(mobilePage, '/students', email, password);
    await expect(mobilePage.locator('body')).toContainText(/Ученики/i);

    await ctx.close();
  });

  test('UXM-RESP-3: мобильные уведомления загружаются', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await ctx.newPage();

    await loginAndGoto(mobilePage, '/notifications', email, password);
    await expect(mobilePage.locator('body')).toContainText(/Уведомления/i);

    await ctx.close();
  });

  test('UXM-RESP-4: мобильные настройки загружаются', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await ctx.newPage();

    await loginAndGoto(mobilePage, '/settings', email, password);
    await expect(mobilePage.locator('body')).toContainText(/Настройки/i);

    await ctx.close();
  });
});
