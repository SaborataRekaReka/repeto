import { test, expect, type Page } from '@playwright/test';
import {
  uniqueEmail,
  registerViaAPI,
  loginAndGoto,
  deleteAccount,
} from './helpers';

async function openCreateMenu(page: Page) {
  const createBtn = page.getByRole('button', { name: /Добавить|Создать/i }).first();
  await expect(createBtn).toBeVisible({ timeout: 5_000 });
  await createBtn.click();

  await expect(page.getByText('Новый ученик').first()).toBeVisible({ timeout: 3_000 });
}

test.describe('UI Simulation: интерфейсные сценарии', () => {
  test.describe.configure({ mode: 'serial' });

  let email: string;
  let token: string;
  const password = 'UiSimPass123!';
  let page: Page;
  let studentName = '';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    email = uniqueEmail();

    const auth = await registerViaAPI(page, {
      email,
      password,
      name: 'UI Simulation Tutor',
    });

    token = auth.accessToken;
  });

  test.afterAll(async () => {
    await deleteAccount(page, token, password);
    await page.close();
  });

  test('US-1 Хедер: меню добавления показывает 3 действия', async () => {
    await loginAndGoto(page, '/dashboard', email, password);

    await openCreateMenu(page);

    await expect(page.getByText('Новый ученик').first()).toBeVisible();
    await expect(page.getByText('Новое занятие').first()).toBeVisible();
    await expect(page.getByText('Записать оплату').first()).toBeVisible();
  });

  test('US-2 Ученики: создаем ученика через модалку интерфейса', async () => {
    studentName = `UI Ученик ${Date.now()}`;

    await loginAndGoto(page, '/students?create=1', email, password);

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(modal).toContainText(/Новый ученик/i);

    await modal.getByPlaceholder('Иванов Пётр Сергеевич').fill(studentName);

    const subjectTrigger = modal.locator('button').filter({ hasText: /Выберите предмет|Математика|Английский/ }).first();
    await subjectTrigger.click();
    await page.getByRole('option', { name: 'Математика' }).click();

    await modal.getByPlaceholder('2100').fill('2300');
    await modal.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 8_000 });

    await page.reload();
    await expect(page.getByText(studentName).first()).toBeVisible({ timeout: 8_000 });
  });

  test('US-3 Расписание: открытие модалки нового занятия из хедера', async () => {
    await loginAndGoto(page, '/dashboard', email, password);

    await openCreateMenu(page);
    await page.getByText('Новое занятие').first().click();

    await page.waitForURL(/\/schedule(\?create=1)?$/, { timeout: 10_000 });

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(modal).toContainText(/Новое занятие/i);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5_000 });
  });

  test('US-4 Оплаты: создаем оплату через модалку интерфейса', async () => {
    await loginAndGoto(page, '/payments?create=1', email, password);

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(modal).toContainText(/Новая оплата/i);

    const studentTrigger = modal.locator('button').filter({ hasText: /Выберите ученика/ }).first();
    await studentTrigger.click();
    await page.getByRole('option', { name: studentName }).click();

    await modal.getByPlaceholder('4200').fill('5400');
    await modal.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 8_000 });

    await page.reload();
    await expect(page.getByText(studentName).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('body')).toContainText(/5[\s,.]?400|5400/i);
  });

  test('US-5 Ученики: поиск фильтрует список по имени', async () => {
    await loginAndGoto(page, '/students', email, password);

    const query = studentName.slice(0, 8);
    await page.getByPlaceholder('Поиск...').fill(query);

    await expect(page.getByText(studentName).first()).toBeVisible({ timeout: 8_000 });
  });
});
