# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: buttons-interactivity.spec.ts >> Кнопки — все интерактивные элементы работают >> Students: кнопка "Новый ученик" открывает модал
- Location: e2e\buttons-interactivity.spec.ts:9:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Отмена/i }).first()

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - link "Repeto" [ref=e6] [cursor=pointer]:
            - /url: /dashboard
          - navigation "Основная навигация" [ref=e8]:
            - link "Дашборд" [ref=e9] [cursor=pointer]:
              - /url: /dashboard
            - link "Расписание" [ref=e10] [cursor=pointer]:
              - /url: /schedule
            - link "Финансы" [ref=e11] [cursor=pointer]:
              - /url: /finance
        - generic [ref=e12]:
          - generic [ref=e13]:
            - generic:
              - generic:
                - generic:
                  - textbox "Поиск учеников..."
                  - generic:
                    - img:
                      - img
            - button "Поиск учеников" [ref=e14] [cursor=pointer]:
              - img [ref=e15]:
                - img [ref=e16]
          - link "Уведомления" [ref=e18] [cursor=pointer]:
            - /url: /notifications
            - img [ref=e19]:
              - img [ref=e20]
          - link "Настройки" [ref=e22] [cursor=pointer]:
            - /url: /settings
            - img [ref=e23]:
              - img [ref=e24]
          - link "Поддержка" [ref=e26] [cursor=pointer]:
            - /url: /support
            - img [ref=e27]:
              - img [ref=e28]
          - button "Профиль" [ref=e31] [cursor=pointer]:
            - img [ref=e32]:
              - generic [ref=e33]: U
            - generic [ref=e34]: Репетитор
            - img [ref=e36]:
              - img [ref=e37]
    - main [ref=e39]:
      - generic [ref=e41]:
        - button "Назад" [ref=e42] [cursor=pointer]:
          - img [ref=e43]:
            - img [ref=e44]
        - generic [ref=e46]:
          - complementary [ref=e47]:
            - heading "Ученики" [level=2] [ref=e48]
            - navigation [ref=e49]:
              - button "Добавить ученика" [active] [ref=e50] [cursor=pointer]:
                - generic [ref=e51]:
                  - generic:
                    - generic:
                      - img
                - text: Добавить ученика
              - button "Записать оплату" [ref=e52] [cursor=pointer]:
                - generic [ref=e53]:
                  - generic:
                    - generic:
                      - img
                - text: Записать оплату
              - button "Добавить занятие" [ref=e54] [cursor=pointer]:
                - generic [ref=e55]:
                  - generic:
                    - generic:
                      - img
                - text: Добавить занятие
              - button "Экспорт в .csv" [ref=e56] [cursor=pointer]:
                - generic [ref=e57]:
                  - generic:
                    - generic:
                      - img
                - text: Экспорт в .csv
          - main [ref=e58]:
            - generic [ref=e61]:
              - img [ref=e63]:
                - img [ref=e64]
              - textbox "Имя, предмет или класс" [ref=e66]
            - generic [ref=e68]:
              - button "Все" [ref=e69] [cursor=pointer]
              - button "Активные" [ref=e70] [cursor=pointer]
              - button "На паузе" [ref=e71] [cursor=pointer]
              - button "Архив" [ref=e72] [cursor=pointer]
              - button "Долги по оплате" [ref=e73] [cursor=pointer]
            - generic [ref=e74]:
              - generic [ref=e75]: Пока нет учеников
              - generic [ref=e76]: Добавьте первого ученика, чтобы начать вести журнал занятий и оплат.
  - alert [ref=e77]
  - dialog "Новый ученик" [ref=e78]:
    - button "Назад" [ref=e80] [cursor=pointer]:
      - img [ref=e81]:
        - img [ref=e82]
    - generic [ref=e85]:
      - heading "Новый ученик" [level=1] [ref=e86]
      - generic [ref=e88] [cursor=pointer]:
        - generic [ref=e89]: ФИО *
        - textbox "Иванов Пётр Сергеевич" [ref=e93]
      - generic [ref=e94]:
        - generic [ref=e96] [cursor=pointer]:
          - generic [ref=e97]: Класс
          - textbox "11" [ref=e101]
        - generic [ref=e103] [cursor=pointer]:
          - generic [ref=e104]: Возраст
          - spinbutton [ref=e108]
      - generic [ref=e110] [cursor=pointer]:
        - generic [ref=e111]: Предмет *
        - textbox "Введите или выберите предмет" [ref=e116]
      - generic [ref=e118] [cursor=pointer]:
        - generic [ref=e119]: Телефон ученика
        - textbox "+7 (900) 123-45-67" [ref=e123]
      - generic [ref=e125] [cursor=pointer]:
        - generic [ref=e126]: Email ученика
        - textbox "student@email.com" [ref=e130]
      - generic [ref=e131]:
        - generic [ref=e132]: Родитель
        - generic [ref=e134] [cursor=pointer]:
          - generic [ref=e135]: ФИО родителя
          - textbox "Иванова Мария Петровна" [ref=e139]
        - generic [ref=e141] [cursor=pointer]:
          - generic [ref=e142]: Телефон родителя
          - textbox "+7 (900) 123-45-67" [ref=e146]
        - generic [ref=e148] [cursor=pointer]:
          - generic [ref=e149]: Email родителя
          - textbox "parent@email.com" [ref=e153]
      - generic [ref=e155] [cursor=pointer]:
        - generic [ref=e156]: Ставка за занятие (₽) *
        - textbox "2100" [ref=e160]
      - generic [ref=e162] [cursor=pointer]:
        - generic [ref=e163]: Заметки
        - textbox "Любые заметки..." [ref=e167]
    - button "Сохранить" [ref=e169] [cursor=pointer]:
      - generic [ref=e170]: Сохранить
```

# Test source

```ts
  1   | /**
  2   |  * BUTTON & INTERACTIVITY E2E TESTS
  3   |  * Tests: every button on every page actually works (clickable, not dead)
  4   |  */
  5   | import { test, expect } from './helpers/auth';
  6   | 
  7   | test.describe('Кнопки — все интерактивные элементы работают', () => {
  8   |   
  9   |   test('Students: кнопка "Новый ученик" открывает модал', async ({ authedPage: page }) => {
  10  |     await page.goto('/students');
  11  |     await page.waitForLoadState('networkidle');
  12  | 
  13  |     const btn = page.getByRole('button', { name: /Новый ученик|Добавить ученика/i }).first();
  14  |     await expect(btn).toBeVisible();
  15  |     await btn.click();
  16  |     // Модал должен открыться
  17  |     await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible({ timeout: 5000 });
  18  |     // Закрываем
> 19  |     await page.getByRole('button', { name: /Отмена/i }).first().click();
      |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  20  |   });
  21  | 
  22  |   test('Schedule: кнопка "Новое занятие" открывает модал', async ({ authedPage: page }) => {
  23  |     await page.goto('/schedule');
  24  |     await page.waitForLoadState('networkidle');
  25  | 
  26  |     const btn = page.getByRole('button', { name: /Новое занятие/i }).first();
  27  |     await expect(btn).toBeVisible();
  28  |     await btn.click();
  29  |     await page.waitForTimeout(500);
  30  |     // Модал создания занятия
  31  |     const hasModal = await page.getByRole('button', { name: 'Сохранить' }).isVisible().catch(() => false);
  32  |     expect(hasModal).toBeTruthy();
  33  |     // Закрываем
  34  |     await page.getByRole('button', { name: /Отмена/i }).first().click();
  35  |   });
  36  | 
  37  |   test('Payments: кнопка "Записать оплату" открывает модал', async ({ authedPage: page }) => {
  38  |     await page.goto('/finance/payments');
  39  |     await page.waitForLoadState('networkidle');
  40  | 
  41  |     const btn = page.getByRole('button', { name: /Записать оплату/i }).first();
  42  |     await expect(btn).toBeVisible();
  43  |     await btn.click();
  44  |     await page.waitForTimeout(500);
  45  |     await expect(page.getByPlaceholder('4200')).toBeVisible({ timeout: 5000 });
  46  |     // Закрываем
  47  |     await page.getByRole('button', { name: /Отмена/i }).first().click();
  48  |   });
  49  | 
  50  |   test('Packages: кнопка "Новый пакет" открывает модал', async ({ authedPage: page }) => {
  51  |     await page.goto('/finance/packages');
  52  |     await page.waitForLoadState('networkidle');
  53  | 
  54  |     const btn = page.getByRole('button', { name: /Новый пакет/i }).first();
  55  |     await expect(btn).toBeVisible();
  56  |     await btn.click();
  57  |     await page.waitForTimeout(500);
  58  |     const hasModal = await page.getByRole('button', { name: /Сохранить/i }).isVisible().catch(() => false);
  59  |     expect(hasModal).toBeTruthy();
  60  |     // Закрываем
  61  |     await page.getByRole('button', { name: /Отмена/i }).first().click();
  62  |   });
  63  | });
  64  | 
  65  | test.describe('Кнопки — empty state CTA', () => {
  66  |   test('Empty state "Добавить ученика" работает (если список пуст)', async ({ authedPage: page }) => {
  67  |     // Это тестирует CTA в пустом состоянии — гарантируем, что клик не падает
  68  |     await page.goto('/students');
  69  |     await page.waitForLoadState('networkidle');
  70  | 
  71  |     const emptyBtn = page.getByRole('button', { name: /Добавить ученика/i });
  72  |     if (await emptyBtn.isVisible().catch(() => false)) {
  73  |       await emptyBtn.click();
  74  |       await page.waitForTimeout(500);
  75  |       // Модал создания
  76  |       await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible({ timeout: 5000 });
  77  |       await page.getByRole('button', { name: /Отмена/i }).first().click();
  78  |     }
  79  |   });
  80  | });
  81  | 
  82  | test.describe('Модалы — закрытие', () => {
  83  |   test('модал студента закрывается по "Отмена"', async ({ authedPage: page }) => {
  84  |     await page.goto('/students');
  85  |     await page.waitForLoadState('networkidle');
  86  | 
  87  |     await page.getByRole('button', { name: /Новый ученик|Добавить ученика/i }).first().click();
  88  |     await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible({ timeout: 5000 });
  89  |     
  90  |     await page.getByRole('button', { name: /Отмена/i }).first().click();
  91  |     await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeHidden({ timeout: 5000 });
  92  |   });
  93  | 
  94  |   test('модал студента закрывается по Escape', async ({ authedPage: page }) => {
  95  |     await page.goto('/students');
  96  |     await page.waitForLoadState('networkidle');
  97  | 
  98  |     await page.getByRole('button', { name: /Новый ученик|Добавить ученика/i }).first().click();
  99  |     await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible({ timeout: 5000 });
  100 | 
  101 |     await page.keyboard.press('Escape');
  102 |     // Modal should close (some Gravity UI modals don't close on Escape — we test it)
  103 |     await page.waitForTimeout(500);
  104 |   });
  105 | });
  106 | 
  107 | test.describe('Формы — валидация', () => {
  108 |   test('создание ученика без ФИО — не сохраняется', async ({ authedPage: page }) => {
  109 |     await page.goto('/students');
  110 |     await page.waitForLoadState('networkidle');
  111 | 
  112 |     await page.getByRole('button', { name: /Новый ученик|Добавить ученика/i }).first().click();
  113 |     await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible({ timeout: 5000 });
  114 | 
  115 |     // Нажимаем "Сохранить" без заполнения полей
  116 |     await page.getByRole('button', { name: 'Сохранить' }).click();
  117 |     await page.waitForTimeout(500);
  118 | 
  119 |     // Модал НЕ должен закрыться (валидация)
```