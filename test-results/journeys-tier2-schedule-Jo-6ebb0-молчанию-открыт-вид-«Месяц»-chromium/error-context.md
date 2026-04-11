# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-schedule.spec.ts >> Journey 24: Переключение видов расписания >> 24.1 По умолчанию открыт вид «Месяц»
- Location: e2e\journeys-tier2-schedule.spec.ts:42:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Месяц' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Месяц' })

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
        - button "ВТ Вид Тест" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ВТ
          - generic [ref=e71]: Вид Тест
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
  1   | /**
  2   |  * Этап 3 · Расписание — все виды и навигация
  3   |  *
  4   |  * Journey 24: Переключение видов Month → Week → Day
  5   |  * Journey 25: Навигация стрелками ← →
  6   |  * Journey 26: Клик по дню в месяце → Day view
  7   |  * Journey 27: Уроки отображаются в Week и Day
  8   |  * Journey 28: LessonDetailModal из расписания + действия
  9   |  */
  10  | import { test, expect, type Page } from '@playwright/test';
  11  | import {
  12  |   uniqueEmail,
  13  |   registerViaAPI,
  14  |   loginAndGoto,
  15  |   createStudentAPI,
  16  |   createLessonAPI,
  17  | } from './helpers';
  18  | 
  19  | const API = 'http://127.0.0.1:3200/api';
  20  | 
  21  | // ═══════════════════════════════════════════════════════════════
  22  | // Journey 24: Переключение видов Month → Week → Day
  23  | // ═══════════════════════════════════════════════════════════════
  24  | test.describe('Journey 24: Переключение видов расписания', () => {
  25  |   test.describe.configure({ mode: 'serial' });
  26  | 
  27  |   let email: string;
  28  |   let token: string;
  29  |   const password = 'Journey24Pass!';
  30  |   let page: Page;
  31  | 
  32  |   test.beforeAll(async ({ browser }) => {
  33  |     page = await browser.newPage();
  34  |     email = uniqueEmail();
  35  |     await registerViaAPI(page, { email, password, name: 'Вид Тест' });
  36  |   });
  37  | 
  38  |   test.afterAll(async () => {
  39  |     await page.close();
  40  |   });
  41  | 
  42  |   test('24.1 По умолчанию открыт вид «Месяц»', async () => {
  43  |     await loginAndGoto(page, '/schedule', email, password);
  44  |     await page.waitForTimeout(1_000);
  45  | 
  46  |     // Кнопка «Месяц» активна (имеет bg-n-1)
  47  |     const monthBtn = page.getByRole('button', { name: 'Месяц' });
> 48  |     await expect(monthBtn).toBeVisible({ timeout: 5_000 });
      |                            ^ Error: expect(locator).toBeVisible() failed
  49  |     await expect(monthBtn).toHaveClass(/bg-n-1/);
  50  | 
  51  |     // Видны дни недели
  52  |     await expect(page.getByText('Пн').first()).toBeVisible();
  53  |     await expect(page.getByText('Вс').first()).toBeVisible();
  54  |   });
  55  | 
  56  |   test('24.2 Клик «Неделя» → вид меняется', async () => {
  57  |     await page.getByRole('button', { name: 'Неделя' }).click();
  58  |     await page.waitForTimeout(500);
  59  | 
  60  |     // Кнопка «Неделя» стала активной
  61  |     await expect(page.getByRole('button', { name: 'Неделя' })).toHaveClass(/bg-n-1/);
  62  |     // Кнопка «Месяц» больше не активна
  63  |     await expect(page.getByRole('button', { name: 'Месяц' })).not.toHaveClass(/bg-n-1/);
  64  | 
  65  |     // Видны временные метки (часы)
  66  |     await expect(page.getByText('8:00').first()).toBeVisible({ timeout: 3_000 });
  67  |     await expect(page.getByText('12:00').first()).toBeVisible();
  68  |   });
  69  | 
  70  |   test('24.3 Клик «День» → вид меняется', async () => {
  71  |     await page.getByRole('button', { name: 'День' }).click();
  72  |     await page.waitForTimeout(500);
  73  | 
  74  |     await expect(page.getByRole('button', { name: 'День' })).toHaveClass(/bg-n-1/);
  75  | 
  76  |     // Видны временные метки
  77  |     await expect(page.getByText('8:00').first()).toBeVisible({ timeout: 3_000 });
  78  | 
  79  |     // Заголовок содержит название дня недели и число
  80  |     const label = page.locator('.text-h6').first();
  81  |     await expect(label).toContainText(/\d{1,2}/);
  82  |   });
  83  | 
  84  |   test('24.4 Клик «Месяц» → возврат к месячному виду', async () => {
  85  |     await page.getByRole('button', { name: 'Месяц' }).click();
  86  |     await page.waitForTimeout(500);
  87  | 
  88  |     await expect(page.getByRole('button', { name: 'Месяц' })).toHaveClass(/bg-n-1/);
  89  |     // Дни недели снова видны
  90  |     await expect(page.getByText('Пн').first()).toBeVisible();
  91  |   });
  92  | });
  93  | 
  94  | // ═══════════════════════════════════════════════════════════════
  95  | // Journey 25: Навигация стрелками ← →
  96  | // ═══════════════════════════════════════════════════════════════
  97  | test.describe('Journey 25: Навигация стрелками', () => {
  98  |   test.describe.configure({ mode: 'serial' });
  99  | 
  100 |   let email: string;
  101 |   let token: string;
  102 |   const password = 'Journey25Pass!';
  103 |   let page: Page;
  104 | 
  105 |   test.beforeAll(async ({ browser }) => {
  106 |     page = await browser.newPage();
  107 |     email = uniqueEmail();
  108 |     await registerViaAPI(page, { email, password, name: 'Навигация Тест' });
  109 |   });
  110 | 
  111 |   test.afterAll(async () => {
  112 |     await page.close();
  113 |   });
  114 | 
  115 |   test('25.1 Месяц: заголовок показывает текущий месяц', async () => {
  116 |     await loginAndGoto(page, '/schedule', email, password);
  117 |     await page.waitForTimeout(1_000);
  118 | 
  119 |     const label = page.locator('.text-h6').first();
  120 |     const now = new Date();
  121 |     const monthNames = [
  122 |       'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  123 |       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  124 |     ];
  125 |     await expect(label).toContainText(monthNames[now.getMonth()]);
  126 |     await expect(label).toContainText(String(now.getFullYear()));
  127 |   });
  128 | 
  129 |   test('25.2 Стрелка вправо → следующий месяц', async () => {
  130 |     // Кнопки навигации — < и > рядом с заголовком
  131 |     const nextBtn = page.locator('button.btn-stroke.btn-square').nth(1);
  132 |     await nextBtn.click();
  133 |     await page.waitForTimeout(500);
  134 | 
  135 |     const label = page.locator('.text-h6').first();
  136 |     const now = new Date();
  137 |     const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1);
  138 |     const monthNames = [
  139 |       'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  140 |       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  141 |     ];
  142 |     await expect(label).toContainText(monthNames[nextMonth.getMonth()]);
  143 |   });
  144 | 
  145 |   test('25.3 Стрелка влево → возврат к текущему месяцу', async () => {
  146 |     const prevBtn = page.locator('button.btn-stroke.btn-square').first();
  147 |     await prevBtn.click();
  148 |     await page.waitForTimeout(500);
```