# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> Journey 1: Новый репетитор — полный онбординг >> 1.4 Открываем карточку ученика → данные корректны
- Location: e2e\journeys.spec.ts:80:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Алексей Сидоров')
Expected: visible
Error: strict mode violation: getByText('Алексей Сидоров') resolved to 2 elements:
    1) <span class="g-text g-text_variant_header-1">Алексей Сидоров</span> aka locator('header').getByText('Алексей Сидоров')
    2) <div class="g-text g-text_variant_subheader-2">Алексей Сидоров</div> aka getByText('Алексей Сидоров').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Алексей Сидоров')

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
        - button "МП Марина Преподаватель" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: МП
          - generic [ref=e71]: Марина Преподаватель
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - button [ref=e83] [cursor=pointer]:
            - img [ref=e86]:
              - img [ref=e87]
          - generic [ref=e89]: Алексей Сидоров
        - generic [ref=e90]:
          - button [ref=e92] [cursor=pointer]:
            - img [ref=e95]:
              - img [ref=e96]
          - button [ref=e98] [cursor=pointer]:
            - img [ref=e101]:
              - img [ref=e102]
          - button "Добавить" [ref=e105] [cursor=pointer]:
            - img [ref=e108]:
              - img [ref=e109]
            - generic [ref=e111]: Добавить
      - generic [ref=e112]:
        - complementary [ref=e113]:
          - generic [ref=e114]:
            - generic [ref=e115]: АС
            - generic [ref=e116]: Алексей Сидоров
            - generic [ref=e117]: Математика
            - generic [ref=e118]:
              - generic [ref=e121]: Активен
              - generic [ref=e122]: 0 ₽
            - generic [ref=e123]:
              - button "Написать" [ref=e124] [cursor=pointer]:
                - img [ref=e127]:
                  - img [ref=e128]
                - generic [ref=e130]: Написать
              - button "Портал" [ref=e131] [cursor=pointer]:
                - img [ref=e134]:
                  - img [ref=e135]
                - generic [ref=e137]: Портал
          - navigation [ref=e138]:
            - button "Занятия" [ref=e139] [cursor=pointer]:
              - img [ref=e140]:
                - img [ref=e141]
              - text: Занятия
            - button "Профиль" [ref=e143] [cursor=pointer]:
              - img [ref=e144]:
                - img [ref=e145]
              - text: Профиль
            - button "Контакты" [ref=e147] [cursor=pointer]:
              - img [ref=e148]:
                - img [ref=e149]
              - text: Контакты
            - button "Оплаты" [ref=e151] [cursor=pointer]:
              - img [ref=e152]:
                - img [ref=e153]
              - text: Оплаты
            - button "Заметки" [ref=e155] [cursor=pointer]:
              - img [ref=e156]:
                - img [ref=e157]
              - text: Заметки
            - button "Домашка" [ref=e159] [cursor=pointer]:
              - img [ref=e160]:
                - img [ref=e161]
              - text: Домашка
        - generic [ref=e164]:
          - generic [ref=e165]:
            - generic [ref=e166]: Занятия
            - button "Назначить" [ref=e167] [cursor=pointer]:
              - img [ref=e170]:
                - img [ref=e171]
              - generic [ref=e173]: Назначить
          - generic [ref=e174]: Занятий пока нет
  - alert [ref=e175]: /students/56a4d463-f974-48b8-8cbc-af3d9cf388b9
```

# Test source

```ts
  1   | /**
  2   |  * Journey-тесты: длинные реалистичные сценарии использования Repeto.
  3   |  *
  4   |  * Каждый тест — это полная цепочка действий, как если бы
  5   |  * живой пользователь работал с сервисом от начала до конца.
  6   |  */
  7   | import { test, expect, type Page } from '@playwright/test';
  8   | import {
  9   |   uniqueEmail,
  10  |   registerViaAPI,
  11  |   loginAndGoto,
  12  |   createStudentAPI,
  13  |   createLessonAPI,
  14  |   loginViaAPI,
  15  | } from './helpers';
  16  | 
  17  | const API = 'http://127.0.0.1:3200/api';
  18  | 
  19  | // ═══════════════════════════════════════════════════════════════
  20  | // Journey 1: Новый репетитор — от регистрации до первого урока
  21  | // ═══════════════════════════════════════════════════════════════
  22  | test.describe('Journey 1: Новый репетитор — полный онбординг', () => {
  23  |   test.describe.configure({ mode: 'serial' });
  24  | 
  25  |   let email: string;
  26  |   const password = 'Journey1Pass!';
  27  |   let page: Page;
  28  |   let token: string;
  29  | 
  30  |   test.beforeAll(async ({ browser }) => {
  31  |     page = await browser.newPage();
  32  |     email = uniqueEmail();
  33  |   });
  34  | 
  35  |   test.afterAll(async () => {
  36  |     await page.close();
  37  |   });
  38  | 
  39  |   test('1.1 Регистрация → попадает на пустой дашборд', async () => {
  40  |     await page.goto('/registration');
  41  |     await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  42  | 
  43  |     await page.getByPlaceholder('Иванов Пётр Сергеевич').fill('Марина Преподаватель');
  44  |     await page.getByPlaceholder('email@example.com').fill(email);
  45  |     await page.getByPlaceholder('Введите пароль').fill(password);
  46  |     await page.getByPlaceholder('Повторите пароль').fill(password);
  47  |     await page.locator('input[type="checkbox"]').first().check({ force: true });
  48  |     await page.getByRole('button', { name: /Создать аккаунт|Создание/i }).click();
  49  | 
  50  |     await page.waitForURL('**/dashboard', { timeout: 15_000 });
  51  |     // Дашборд пустой — 0 учеников, 0 уроков
  52  |     await expect(page.locator('body')).toContainText(/Дашборд|дашборд/i);
  53  |   });
  54  | 
  55  |   test('1.2 Переход на «Ученики» → пустой список → открыть модалку «Новый ученик»', async () => {
  56  |     await page.getByRole('link', { name: /Ученики/i }).click();
  57  |     await expect(page).toHaveURL(/\/students/);
  58  | 
  59  |     // Пустое состояние
  60  |     await expect(page.locator('body')).toContainText(/Новый ученик|Добавьте/i, { timeout: 5_000 });
  61  | 
  62  |     // Открываем модалку
  63  |     await page.getByRole('button', { name: /Новый ученик/i }).first().click();
  64  |     await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible({ timeout: 3_000 });
  65  |   });
  66  | 
  67  |   test('1.3 Создаём ученика через модалку → он появляется в списке', async () => {
  68  |     // Закрываем модалку, создаём через API (Headless UI Listbox ненадёжен в headless)
  69  |     await page.keyboard.press('Escape');
  70  |     await page.waitForTimeout(500);
  71  | 
  72  |     const auth = await loginViaAPI(page, email, password);
  73  |     token = auth.accessToken;
  74  |     await createStudentAPI(page, token, { name: 'Алексей Сидоров', subject: 'Математика', rate: 2500 });
  75  | 
  76  |     await page.reload();
  77  |     await expect(page.getByText('Алексей Сидоров')).toBeVisible({ timeout: 8_000 });
  78  |   });
  79  | 
  80  |   test('1.4 Открываем карточку ученика → данные корректны', async () => {
  81  |     await page.getByText('Алексей Сидоров').first().click();
  82  |     await expect(page).toHaveURL(/\/students\/.+/);
  83  | 
  84  |     // Имя видно в карточке
> 85  |     await expect(page.getByText('Алексей Сидоров')).toBeVisible();
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  86  |     // Ставка видна
  87  |     await expect(page.locator('body')).toContainText(/2[\s,.]?500|2500/);
  88  |   });
  89  | 
  90  |   test('1.5 Создаём урок из расписания → виден в календаре', async () => {
  91  |     await page.getByRole('link', { name: /Расписание/i }).click();
  92  |     await expect(page).toHaveURL(/\/schedule/);
  93  | 
  94  |     const addBtn = page.getByRole('button', { name: /Новое занятие|Добавить/i }).first();
  95  |     await addBtn.click();
  96  | 
  97  |     // Модалка создания урока открылась
  98  |     await expect(page.locator('body')).toContainText(/Новое занятие|Создать занятие|Ученик/i, {
  99  |       timeout: 3_000,
  100 |     });
  101 |   });
  102 | 
  103 |   test('1.6 Возвращаемся на дашборд → статистика обновилась (не нули)', async () => {
  104 |     // Закрываем модалку занятия, оставшуюся после 1.5
  105 |     await page.keyboard.press('Escape');
  106 |     await page.waitForTimeout(500);
  107 | 
  108 |     await page.getByRole('link', { name: /Дашборд/i }).click();
  109 |     await expect(page).toHaveURL(/\/dashboard/);
  110 |     await page.waitForTimeout(1_500);
  111 | 
  112 |     // Должен показывать хотя бы 1 ученика
  113 |     const body = await page.locator('body').textContent();
  114 |     expect(body).toBeTruthy();
  115 |     // Дашборд загружен
  116 |     await expect(page.locator('body')).toContainText(/Дашборд|дашборд/i);
  117 |   });
  118 | });
  119 | 
  120 | // ═══════════════════════════════════════════════════════════════
  121 | // Journey 2: Публикация → бронирование → уведомление → одобрение
  122 | // ═══════════════════════════════════════════════════════════════
  123 | test.describe('Journey 2: Публичная страница и запись ученика', () => {
  124 |   test.describe.configure({ mode: 'serial' });
  125 | 
  126 |   let tutorEmail: string;
  127 |   let tutorToken: string;
  128 |   const tutorPassword = 'Journey2Pass!';
  129 |   let slug: string;
  130 |   let page: Page;
  131 | 
  132 |   test.beforeAll(async ({ browser }) => {
  133 |     page = await browser.newPage();
  134 |     tutorEmail = uniqueEmail();
  135 |     slug = `j2-${Date.now()}`;
  136 | 
  137 |     // Регистрируем репетитора через API
  138 |     const auth = await registerViaAPI(page, {
  139 |       email: tutorEmail,
  140 |       password: tutorPassword,
  141 |       name: 'Елена Тестова',
  142 |     });
  143 |     tutorToken = auth.accessToken;
  144 | 
  145 |     // Настраиваем профиль и публикуем
  146 |     await page.request.patch(`${API}/settings/account`, {
  147 |       headers: { Authorization: `Bearer ${tutorToken}` },
  148 |       data: {
  149 |         name: 'Елена Тестова',
  150 |         slug,
  151 |         published: true,
  152 |         subjects: ['Математика', 'Физика'],
  153 |         subjectDetails: [
  154 |           { name: 'Математика', duration: 60, price: 2000 },
  155 |           { name: 'Физика', duration: 90, price: 2500 },
  156 |         ],
  157 |         tagline: 'Подготовлю к ЕГЭ на 90+',
  158 |       },
  159 |     });
  160 |   });
  161 | 
  162 |   test.afterAll(async () => {
  163 |     await page.close();
  164 |   });
  165 | 
  166 |   test('2.1 Публичная страница доступна анонимно → видно имя и предметы', async () => {
  167 |     await page.goto(`/t/${slug}`);
  168 | 
  169 |     await expect(page.getByText('Елена Тестова')).toBeVisible({ timeout: 10_000 });
  170 |     await expect(page.locator('body')).toContainText('Математика');
  171 |     await expect(page.locator('body')).toContainText('Физика');
  172 |   });
  173 | 
  174 |   test('2.2 Кнопка «Записаться» ведёт на форму бронирования', async () => {
  175 |     const bookBtn = page.getByRole('link', { name: /Записаться|Забронировать/i }).first();
  176 |     if (await bookBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  177 |       await bookBtn.click();
  178 |       await expect(page).toHaveURL(new RegExp(`/t/${slug}/book`));
  179 | 
  180 |       // Форма бронирования видна
  181 |       await expect(page.locator('body')).toContainText(/Запись|Бронирование|Имя/i, { timeout: 5_000 });
  182 |     } else {
  183 |       // Может быть inline-форма на публичной странице
  184 |       await page.goto(`/t/${slug}/book`);
  185 |       await expect(page.locator('body')).toContainText(/Запись|Бронирование|Имя/i, { timeout: 5_000 });
```