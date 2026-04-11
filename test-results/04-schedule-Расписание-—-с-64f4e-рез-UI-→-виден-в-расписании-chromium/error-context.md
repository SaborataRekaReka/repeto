# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-schedule.spec.ts >> Расписание — создание урока >> создать урок через UI → виден в расписании
- Location: e2e\04-schedule.spec.ts:21:7

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: /Новое занятие|Добавить/i }) resolved to 2 elements:
    1) <button tabindex="0" type="button" class="g-button g-button_view_action g-button_size_m g-button_pin_round-round">…</button> aka getByRole('button', { name: 'Добавить' })
    2) <button tabindex="0" type="button" class="g-button g-button_view_action g-button_size_m g-button_pin_round-round">…</button> aka getByRole('button', { name: 'Новое занятие' })

Call log:
  - waiting for getByRole('button', { name: /Новое занятие|Добавить/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - link "Repeto" [ref=e4] [cursor=pointer]:
        - /url: /dashboard
        - generic [ref=e6]: Repeto
      - navigation [ref=e7]:
        - link "Дашборд" [ref=e8] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e10]:
            - img [ref=e11]
          - generic [ref=e13]: Дашборд
        - link "Ученики" [ref=e14] [cursor=pointer]:
          - /url: /students
          - img [ref=e16]:
            - img [ref=e17]
          - generic [ref=e19]: Ученики
        - link "Расписание" [ref=e20] [cursor=pointer]:
          - /url: /schedule
          - img [ref=e22]:
            - img [ref=e23]
          - generic [ref=e25]: Расписание
        - link "Финансы" [ref=e26] [cursor=pointer]:
          - /url: /finance
          - img [ref=e28]:
            - img [ref=e29]
          - generic [ref=e31]: Финансы
        - link "Оплаты" [ref=e32] [cursor=pointer]:
          - /url: /payments
          - img [ref=e34]:
            - img [ref=e35]
          - generic [ref=e37]: Оплаты
        - link "Пакеты" [ref=e38] [cursor=pointer]:
          - /url: /packages
          - img [ref=e40]:
            - img [ref=e41]
          - generic [ref=e43]: Пакеты
        - link "Материалы" [ref=e44] [cursor=pointer]:
          - /url: /files
          - img [ref=e46]:
            - img [ref=e47]
          - generic [ref=e49]: Материалы
      - generic [ref=e50]:
        - link "Уведомления" [ref=e51] [cursor=pointer]:
          - /url: /notifications
          - img [ref=e53]:
            - img [ref=e54]
          - generic [ref=e56]: Уведомления
        - link "Настройки" [ref=e57] [cursor=pointer]:
          - /url: /settings
          - img [ref=e59]:
            - img [ref=e60]
          - generic [ref=e62]: Настройки
        - link "Поддержка" [ref=e63] [cursor=pointer]:
          - /url: /support
          - img [ref=e65]:
            - img [ref=e66]
          - generic [ref=e68]: Поддержка
        - button "ТР Тест Расписание" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТР
          - generic [ref=e71]: Тест Расписание
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e83]: Расписание
        - generic [ref=e84]:
          - button [ref=e86] [cursor=pointer]:
            - img [ref=e89]:
              - img [ref=e90]
          - button [ref=e92] [cursor=pointer]:
            - img [ref=e95]:
              - img [ref=e96]
          - button "Добавить" [ref=e99] [cursor=pointer]:
            - img [ref=e102]:
              - img [ref=e103]
            - generic [ref=e105]: Добавить
      - generic [ref=e107] [cursor=pointer]:
        - generic [ref=e108]:
          - img [ref=e110]:
            - img [ref=e111]
          - generic [ref=e113]: Рабочие часы
        - img [ref=e114]:
          - img [ref=e115]
      - generic [ref=e117]:
        - group [ref=e120] [cursor=pointer]:
          - combobox [ref=e121]:
            - generic [ref=e122]: Запланированные, Проведённые, Отменённые учеником, Отменённые мной, Неявки, Переносы
          - generic [ref=e124]: "6"
          - button "Очистить" [ref=e125]:
            - img [ref=e126]:
              - img [ref=e127]
          - img [ref=e129]:
            - img [ref=e130]
        - generic [ref=e132]:
          - button [ref=e133] [cursor=pointer]:
            - img [ref=e136]:
              - img [ref=e137]
          - button [ref=e139] [cursor=pointer]:
            - img [ref=e142]:
              - img [ref=e143]
        - generic [ref=e145]: 6 – 12 апр 2026
        - radiogroup [ref=e146]:
          - generic [ref=e147] [cursor=pointer]:
            - radio "Месяц" [ref=e148]
            - generic [ref=e149]: Месяц
          - generic [ref=e150]:
            - radio "Неделя" [checked] [ref=e151]
            - generic [ref=e152]: Неделя
          - generic [ref=e153] [cursor=pointer]:
            - radio "День" [ref=e154]
            - generic [ref=e155]: День
        - button "Подключить Яндекс.Календарь" [ref=e156] [cursor=pointer]:
          - img [ref=e159]:
            - img [ref=e160]
          - generic [ref=e162]: Подключить Яндекс.Календарь
        - button "Новое занятие" [ref=e163] [cursor=pointer]:
          - img [ref=e166]:
            - img [ref=e167]
          - generic [ref=e169]: Новое занятие
      - generic [ref=e171]:
        - generic [ref=e172]:
          - generic [ref=e174]:
            - generic [ref=e175]: Пн
            - generic [ref=e177]: "6"
          - generic [ref=e178]:
            - generic [ref=e179]: Вт
            - generic [ref=e181]: "7"
          - generic [ref=e182]:
            - generic [ref=e183]: Ср
            - generic [ref=e185]: "8"
          - generic [ref=e186]:
            - generic [ref=e187]: Чт
            - generic [ref=e189]: "9"
          - generic [ref=e190]:
            - generic [ref=e191]: Пт
            - generic [ref=e193]: "10"
          - generic [ref=e194]:
            - generic [ref=e195]: Сб
            - generic [ref=e197]: "11"
          - generic [ref=e198]:
            - generic [ref=e199]: Вс
            - generic [ref=e201]: "12"
        - generic [ref=e203]:
          - generic [ref=e205]: 01:00
          - generic [ref=e207]: 02:00
          - generic [ref=e209]: 03:00
          - generic [ref=e211]: 04:00
          - generic [ref=e213]: 05:00
          - generic [ref=e215]: 06:00
          - generic [ref=e217]: 07:00
          - generic [ref=e219]: 08:00
          - generic [ref=e221]: 09:00
          - generic [ref=e223]: 10:00
          - generic [ref=e225]: 11:00
          - generic [ref=e227]: 12:00
          - generic [ref=e229]: 13:00
          - generic [ref=e231]: 14:00
          - generic [ref=e233]: 15:00
          - generic [ref=e235]: 16:00
          - generic [ref=e237]: 17:00
          - generic [ref=e239]: 18:00
          - generic [ref=e241]: 19:00
          - generic [ref=e243]: 20:00
          - generic [ref=e245]: 21:00
          - generic [ref=e247]: 22:00
          - generic [ref=e249]: 23:00
  - alert [ref=e257]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { uniqueEmail, registerViaAPI, loginAndGoto, createStudentAPI } from './helpers';
  3  | 
  4  | test.describe('Расписание — создание урока', () => {
  5  |   let email: string;
  6  |   let token: string;
  7  |   let studentName: string;
  8  |   const password = 'TestSchedule123!';
  9  | 
  10 |   test.beforeAll(async ({ browser }) => {
  11 |     const ctx = await browser.newContext();
  12 |     const page = await ctx.newPage();
  13 |     email = uniqueEmail();
  14 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Расписание' });
  15 |     token = auth.accessToken;
  16 |     studentName = 'Ученик Расписания';
  17 |     await createStudentAPI(page, token, { name: studentName });
  18 |     await ctx.close();
  19 |   });
  20 | 
  21 |   test('создать урок через UI → виден в расписании', async ({ page }) => {
  22 |     await loginAndGoto(page, '/schedule', email, password);
  23 | 
  24 |     // Кнопка создания урока
  25 |     const addBtn = page.getByRole('button', { name: /Новое занятие|Добавить/i });
> 26 |     await addBtn.click();
     |                  ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: /Новое занятие|Добавить/i }) resolved to 2 elements:
  27 | 
  28 |     // Ждём модальное окно
  29 |     await page.waitForTimeout(500);
  30 | 
  31 |     // Ищем select ученика и заполняем дату/время
  32 |     // Кнопка «Сохранить»
  33 |     const saveBtn = page.getByRole('button', { name: /Сохранить/i });
  34 |     // Если форма не заполнена, проверяем что модалка открылась
  35 |     await expect(page.locator('body')).toContainText(/Новое занятие|Создать занятие|Ученик/i);
  36 |   });
  37 | });
  38 | 
```