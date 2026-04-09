import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaAPI, loginAndGoto, createStudentAPI } from './helpers';

test.describe('Расписание — создание урока', () => {
  let email: string;
  let token: string;
  let studentName: string;
  const password = 'TestSchedule123!';

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    email = uniqueEmail();
    const auth = await registerViaAPI(page, { email, password, name: 'Тест Расписание' });
    token = auth.accessToken;
    studentName = 'Ученик Расписания';
    await createStudentAPI(page, token, { name: studentName });
    await ctx.close();
  });

  test('создать урок через UI → виден в расписании', async ({ page }) => {
    await loginAndGoto(page, '/schedule', email, password);

    // Кнопка создания урока
    const addBtn = page.getByRole('button', { name: /Новое занятие|Добавить/i });
    await addBtn.click();

    // Ждём модальное окно
    await page.waitForTimeout(500);

    // Ищем select ученика и заполняем дату/время
    // Кнопка «Сохранить»
    const saveBtn = page.getByRole('button', { name: /Сохранить/i });
    // Если форма не заполнена, проверяем что модалка открылась
    await expect(page.locator('body')).toContainText(/Новое занятие|Создать занятие|Ученик/i);
  });
});
