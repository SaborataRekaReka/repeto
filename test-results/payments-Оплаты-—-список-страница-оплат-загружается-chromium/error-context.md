# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payments.spec.ts >> Оплаты — список >> страница оплат загружается
- Location: e2e\payments.spec.ts:8:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - link "Repeto" [ref=e6] [cursor=pointer]:
            - /url: /dashboard
          - navigation "Основная навигация" [ref=e9]:
            - link "Дашборд" [ref=e10] [cursor=pointer]:
              - /url: /dashboard
            - link "Расписание" [ref=e11] [cursor=pointer]:
              - /url: /schedule
            - link "Финансы" [ref=e12] [cursor=pointer]:
              - /url: /finance
        - generic [ref=e13]:
          - generic [ref=e14]:
            - generic:
              - generic:
                - generic:
                  - textbox "Поиск учеников..."
                  - generic:
                    - img:
                      - img
            - button "Поиск учеников" [ref=e15] [cursor=pointer]:
              - img [ref=e16]:
                - img [ref=e17]
          - link "Настройки" [ref=e19] [cursor=pointer]:
            - /url: /settings
            - img [ref=e20]:
              - img [ref=e21]
          - link "Поддержка" [ref=e23] [cursor=pointer]:
            - /url: /support
            - img [ref=e24]:
              - img [ref=e25]
          - button "Профиль" [ref=e28] [cursor=pointer]:
            - img [ref=e29]:
              - generic [ref=e30]: ДР
            - generic [ref=e31]: Демо Репетитор
            - img [ref=e33]:
              - img [ref=e34]
    - main [ref=e36]:
      - heading "Оплаты" [level=1] [ref=e39]
      - generic [ref=e40]:
        - button "Назад" [ref=e41] [cursor=pointer]:
          - img [ref=e42]:
            - img [ref=e43]
        - generic [ref=e45]:
          - complementary [ref=e46]:
            - heading "Оплаты" [level=2] [ref=e47]
            - navigation [ref=e48]:
              - button "Добавить оплату" [ref=e49] [cursor=pointer]:
                - img [ref=e50]:
                  - img [ref=e51]
                - text: Добавить оплату
              - button "Найти должников" [ref=e53] [cursor=pointer]:
                - img [ref=e54]:
                  - img [ref=e55]
                - text: Найти должников
          - main [ref=e57]:
            - generic [ref=e60]:
              - img [ref=e62]:
                - img [ref=e63]
              - textbox "Имя ученика" [ref=e65]
            - generic [ref=e67]:
              - button "Все 22" [ref=e68] [cursor=pointer]:
                - text: Все
                - generic [ref=e69]: "22"
              - button "Оплачено 19" [ref=e70] [cursor=pointer]:
                - text: Оплачено
                - generic [ref=e71]: "19"
            - generic [ref=e72]:
              - generic [ref=e73]:
                - generic [ref=e74]: Дата
                - generic [ref=e75]: Ученик
                - generic [ref=e76]: Сумма
                - generic [ref=e77]: Способ
                - generic [ref=e78]: Статус
              - generic [ref=e80]:
                - generic [ref=e81] [cursor=pointer]:
                  - generic [ref=e83]: 18.04.2026
                  - generic [ref=e85]: LiveTest 1776492772720
                  - generic [ref=e87]: 4 444 ₽
                  - generic [ref=e89]: СБП
                  - generic [ref=e91]: Оплачено
                  - button "Удалить оплату" [ref=e93]:
                    - img [ref=e94]:
                      - img [ref=e95]
                - generic [ref=e97] [cursor=pointer]:
                  - generic [ref=e99]: 18.04.2026
                  - generic [ref=e101]: Alex
                  - generic [ref=e103]: 5 000 ₽
                  - generic [ref=e105]: СБП
                  - generic [ref=e107]: Оплачено
                  - button "Удалить оплату" [ref=e109]:
                    - img [ref=e110]:
                      - img [ref=e111]
                - generic [ref=e113] [cursor=pointer]:
                  - generic [ref=e115]: 18.04.2026
                  - generic [ref=e117]: Alex
                  - generic [ref=e119]: 1 600 ₽
                  - generic [ref=e121]: СБП
                  - generic [ref=e123]: Оплачено
                  - button "Удалить оплату" [ref=e125]:
                    - img [ref=e126]:
                      - img [ref=e127]
                - generic [ref=e129] [cursor=pointer]:
                  - generic [ref=e131]: 18.04.2026
                  - generic [ref=e133]: Alex
                  - generic [ref=e135]: 1 600 ₽
                  - generic [ref=e137]: СБП
                  - generic [ref=e139]: Оплачено
                  - button "Удалить оплату" [ref=e141]:
                    - img [ref=e142]:
                      - img [ref=e143]
                - generic [ref=e145] [cursor=pointer]:
                  - generic [ref=e147]: 17.04.2026
                  - generic [ref=e149]: Alex
                  - generic [ref=e151]: 1 600 ₽
                  - generic [ref=e153]: СБП
                  - generic [ref=e155]: Оплачено
                  - button "Удалить оплату" [ref=e157]:
                    - img [ref=e158]:
                      - img [ref=e159]
                - generic [ref=e161] [cursor=pointer]:
                  - generic [ref=e163]: 17.04.2026
                  - generic [ref=e165]: Кузнецова Мария
                  - generic [ref=e167]: 1 ₽
                  - generic [ref=e169]: СБП
                  - generic [ref=e171]: Оплачено
                  - button "Удалить оплату" [ref=e173]:
                    - img [ref=e174]:
                      - img [ref=e175]
                - generic [ref=e177] [cursor=pointer]:
                  - generic [ref=e179]: 17.04.2026
                  - generic [ref=e181]: Кузнецова Мария
                  - generic [ref=e183]: 5 400 ₽
                  - generic [ref=e185]: СБП
                  - generic [ref=e187]: Оплачено
                  - button "Удалить оплату" [ref=e189]:
                    - img [ref=e190]:
                      - img [ref=e191]
                - generic [ref=e193] [cursor=pointer]:
                  - generic [ref=e195]: 02.04.2026
                  - generic [ref=e197]: Сидоров Максим
                  - generic [ref=e199]: 4 800 ₽
                  - generic [ref=e201]: Перевод
                  - generic [ref=e203]: Оплачено
                  - button "Удалить оплату" [ref=e205]:
                    - img [ref=e206]:
                      - img [ref=e207]
                - generic [ref=e209] [cursor=pointer]:
                  - generic [ref=e211]: 01.04.2026
                  - generic [ref=e213]: Новиков Дмитрий
                  - generic [ref=e215]: 2 100 ₽
                  - generic [ref=e217]: Перевод
                  - generic [ref=e219]: Оплачено
                  - button "Удалить оплату" [ref=e221]:
                    - img [ref=e222]:
                      - img [ref=e223]
                - generic [ref=e225] [cursor=pointer]:
                  - generic [ref=e227]: 01.04.2026
                  - generic [ref=e229]: Петрова Анна
                  - generic [ref=e231]: 3 600 ₽
                  - generic [ref=e233]: Наличные
                  - generic [ref=e235]: Оплачено
                  - button "Удалить оплату" [ref=e237]:
                    - img [ref=e238]:
                      - img [ref=e239]
                - generic [ref=e241] [cursor=pointer]:
                  - generic [ref=e243]: 31.03.2026
                  - generic [ref=e245]: Иванов Пётр
                  - generic [ref=e247]: 2 100 ₽
                  - generic [ref=e249]: Перевод
                  - generic [ref=e251]: Оплачено
                  - button "Удалить оплату" [ref=e253]:
                    - img [ref=e254]:
                      - img [ref=e255]
                - generic [ref=e257] [cursor=pointer]:
                  - generic [ref=e259]: 30.03.2026
                  - generic [ref=e261]: Кузнецова Мария
                  - generic [ref=e263]: 1 600 ₽
                  - generic [ref=e265]: Наличные
                  - generic [ref=e267]: Оплачено
                  - button "Удалить оплату" [ref=e269]:
                    - img [ref=e270]:
                      - img [ref=e271]
                - generic [ref=e273] [cursor=pointer]:
                  - generic [ref=e275]: 28.03.2026
                  - generic [ref=e277]: Иванов Пётр
                  - generic [ref=e279]: 4 200 ₽
                  - generic [ref=e281]: СБП
                  - generic [ref=e283]: Оплачено
                  - button "Удалить оплату" [ref=e285]:
                    - img [ref=e286]:
                      - img [ref=e287]
                - generic [ref=e289] [cursor=pointer]:
                  - generic [ref=e291]: 27.03.2026
                  - generic [ref=e293]: Козлова Дарья
                  - generic [ref=e295]: 2 200 ₽
                  - generic [ref=e297]: Перевод
                  - generic [ref=e299]: Оплачено
                  - button "Удалить оплату" [ref=e301]:
                    - img [ref=e302]:
                      - img [ref=e303]
                - generic [ref=e305] [cursor=pointer]:
                  - generic [ref=e307]: 25.03.2026
                  - generic [ref=e309]: Петрова Анна
                  - generic [ref=e311]: 3 600 ₽
                  - generic [ref=e313]: Наличные
                  - generic [ref=e315]: Оплачено
                  - button "Удалить оплату" [ref=e317]:
                    - img [ref=e318]:
                      - img [ref=e319]
                - generic [ref=e321] [cursor=pointer]:
                  - generic [ref=e323]: 22.03.2026
                  - generic [ref=e325]: Сидоров Максим
                  - generic [ref=e327]: 2 400 ₽
                  - generic [ref=e329]: СБП
                  - generic [ref=e331]: Оплачено
                  - button "Удалить оплату" [ref=e333]:
                    - img [ref=e334]:
                      - img [ref=e335]
                - generic [ref=e337] [cursor=pointer]:
                  - generic [ref=e339]: 20.03.2026
                  - generic [ref=e341]: Кузнецова Мария
                  - generic [ref=e343]: 3 200 ₽
                  - generic [ref=e345]: Наличные
                  - generic [ref=e347]: Оплачено
                  - button "Удалить оплату" [ref=e349]:
                    - img [ref=e350]:
                      - img [ref=e351]
                - generic [ref=e353] [cursor=pointer]:
                  - generic [ref=e355]: 18.03.2026
                  - generic [ref=e357]: Новиков Дмитрий
                  - generic [ref=e359]: 4 200 ₽
                  - generic [ref=e361]: Перевод
                  - generic [ref=e363]: Оплачено
                  - button "Удалить оплату" [ref=e365]:
                    - img [ref=e366]:
                      - img [ref=e367]
                - generic [ref=e369] [cursor=pointer]:
                  - generic [ref=e371]: 15.03.2026
                  - generic [ref=e373]: Козлова Дарья
                  - generic [ref=e375]: 2 200 ₽
                  - generic [ref=e377]: СБП
                  - generic [ref=e379]: Оплачено
                  - button "Удалить оплату" [ref=e381]:
                    - img [ref=e382]:
                      - img [ref=e383]
                - generic [ref=e385] [cursor=pointer]:
                  - generic [ref=e387]: 14.03.2026
                  - generic [ref=e389]: Иванов Пётр
                  - generic [ref=e391]: 2 100 ₽
                  - generic [ref=e393]: Перевод
                  - generic [ref=e395]: Оплачено
                  - button "Удалить оплату" [ref=e397]:
                    - img [ref=e398]:
                      - img [ref=e399]
                - generic [ref=e401] [cursor=pointer]:
                  - generic [ref=e403]: 10.03.2026
                  - generic [ref=e405]: Сидоров Максим
                  - generic [ref=e407]: 4 800 ₽
                  - generic [ref=e409]: СБП
                  - generic [ref=e411]: Оплачено
                  - button "Удалить оплату" [ref=e413]:
                    - img [ref=e414]:
                      - img [ref=e415]
                - generic [ref=e417] [cursor=pointer]:
                  - generic [ref=e419]: 08.03.2026
                  - generic [ref=e421]: Петрова Анна
                  - generic [ref=e423]: 1 800 ₽
                  - generic [ref=e425]: Наличные
                  - generic [ref=e427]: Оплачено
                  - button "Удалить оплату" [ref=e429]:
                    - img [ref=e430]:
                      - img [ref=e431]
  - alert [ref=e433]
```

# Test source

```ts
  1   | /**
  2   |  * PAYMENTS E2E TESTS
  3   |  * Tests: list, tabs, create payment, detail, live update
  4   |  */
  5   | import { test, expect, waitForAPI, API_BASE } from './helpers/auth';
  6   | 
  7   | test.describe('Оплаты — список', () => {
  8   |   test('страница оплат загружается', async ({ authedPage: page }) => {
  9   |     await page.goto('/payments');
  10  |     await page.waitForLoadState('networkidle');
  11  | 
  12  |     // Табы должны быть
  13  |     await expect(page.getByText('Все').first()).toBeVisible();
  14  |     await expect(page.getByText('Оплачено').first()).toBeVisible();
  15  | 
  16  |     // Либо таблица, либо пустой state
  17  |     const hasTable = await page.locator('table').isVisible().catch(() => false);
  18  |     const hasEmpty = await page.getByText(/Нет оплат/).isVisible().catch(() => false);
> 19  |     expect(hasTable || hasEmpty).toBeTruthy();
      |                                  ^ Error: expect(received).toBeTruthy()
  20  |   });
  21  | 
  22  |   test('табы фильтруют оплаты', async ({ authedPage: page }) => {
  23  |     await page.goto('/payments');
  24  |     await page.waitForLoadState('networkidle');
  25  | 
  26  |     await page.getByRole('radio', { name: 'Оплачено' }).click();
  27  |     await page.waitForTimeout(500);
  28  | 
  29  |     await page.getByRole('radio', { name: 'Все' }).click();
  30  |     await page.waitForTimeout(500);
  31  |   });
  32  | 
  33  |   test('поиск по оплатам', async ({ authedPage: page }) => {
  34  |     await page.goto('/payments');
  35  |     await page.waitForLoadState('networkidle');
  36  | 
  37  |     const search = page.getByPlaceholder('Поиск...');
  38  |     if (await search.isVisible()) {
  39  |       await search.fill('НесуществующийПоиск');
  40  |       await page.waitForTimeout(500);
  41  |       await search.clear();
  42  |     }
  43  |   });
  44  | });
  45  | 
  46  | test.describe('Оплаты — создание (live update)', () => {
  47  |   const selectFirstStudentInPaymentModal = async (page: any, paymentDialog: any) => {
  48  |     const studentCombobox = paymentDialog.getByRole('combobox').first();
  49  |     await expect(studentCombobox).toBeVisible({ timeout: 10000 });
  50  |     await studentCombobox.click();
  51  | 
  52  |     const firstOption = page.getByRole('option').first();
  53  |     if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
  54  |       await firstOption.click();
  55  |     } else {
  56  |       await page.keyboard.press('ArrowDown');
  57  |       await page.keyboard.press('Enter');
  58  |     }
  59  | 
  60  |     await expect(
  61  |       paymentDialog
  62  |         .getByText(/Выберите проведенное занятие|Нет свободных проведенных занятий|Загружаем занятия\.\.\./)
  63  |         .first()
  64  |     ).toBeVisible({ timeout: 10000 });
  65  |   };
  66  | 
  67  |   test('в модалке оплаты загружается список активных учеников', async ({ authedPage: page }) => {
  68  |     await page.goto('/payments');
  69  |     await page.waitForLoadState('networkidle');
  70  | 
  71  |     await page.getByRole('button', { name: /Записать оплату/i }).first().click();
  72  | 
  73  |     const paymentDialog = page.getByRole('dialog', { name: 'Новая оплата' }).first();
  74  |     await expect(paymentDialog).toBeVisible({ timeout: 10000 });
  75  | 
  76  |     const loadingHint = paymentDialog.getByText('Загружаем активных учеников...').first();
  77  |     if (await loadingHint.isVisible().catch(() => false)) {
  78  |       await expect(loadingHint).toBeHidden({ timeout: 10000 });
  79  |     }
  80  | 
  81  |     await expect(paymentDialog.getByText('Не удалось загрузить список активных учеников.').first()).toBeHidden();
  82  |     await expect(paymentDialog.getByText('Нет активных учеников для выбора.').first()).toBeHidden();
  83  | 
  84  |     await selectFirstStudentInPaymentModal(page, paymentDialog);
  85  |   });
  86  | 
  87  |   test('создание оплаты через модал — видна без F5', async ({ authedPage: page }) => {
  88  |     await page.goto('/payments');
  89  |     await page.waitForLoadState('networkidle');
  90  | 
  91  |     // Кликаем "Записать оплату"
  92  |     await page.getByRole('button', { name: /Записать оплату/i }).first().click();
  93  |     const paymentDialog = page.getByRole('dialog', { name: 'Новая оплата' }).first();
  94  |     await expect(paymentDialog).toBeVisible({ timeout: 10000 });
  95  | 
  96  |     await selectFirstStudentInPaymentModal(page, paymentDialog);
  97  | 
  98  |     // Сумма
  99  |     await paymentDialog.getByPlaceholder('4200').fill('999');
  100 | 
  101 |     // Сохраняем
  102 |     const savePromise = waitForAPI(page, '/payments');
  103 |     await paymentDialog.getByRole('button', { name: 'Сохранить' }).click();
  104 | 
  105 |     try {
  106 |       await savePromise;
  107 |     } catch {
  108 |       // Запрос мог завершиться до старта ожидания
  109 |     }
  110 | 
  111 |     await expect(paymentDialog).toBeHidden({ timeout: 10000 });
  112 | 
  113 |     // Оплата должна появиться в списке БЕЗ перезагрузки
  114 |     await expect(page.getByText('999').first()).toBeVisible({ timeout: 10000 });
  115 |   });
  116 | 
  117 |   test.afterAll(async ({ request }) => {
  118 |     // Cleanup test payments
  119 |     try {
```