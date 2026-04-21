# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: buttons-interactivity.spec.ts >> Кнопки — все интерактивные элементы работают >> Packages: кнопка "Новый пакет" открывает модал
- Location: e2e\buttons-interactivity.spec.ts:50:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Новый пакет/i }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: /Новый пакет/i }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - link "Repeto" [ref=e7] [cursor=pointer]:
      - /url: /
      - img "Repeto" [ref=e8]
    - generic [ref=e10]:
      - generic [ref=e11]: Вход в Repeto
      - generic [ref=e12]: Введите данные вашего аккаунта
      - generic [ref=e13]:
        - generic [ref=e14]: Email
        - textbox "email@example.com" [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e19]: Пароль
        - generic [ref=e21]:
          - textbox "Введите пароль" [ref=e22]
          - button "Показать пароль" [ref=e24] [cursor=pointer]:
            - img [ref=e25]:
              - img [ref=e26]
      - button "Забыли пароль?" [ref=e29] [cursor=pointer]
      - button "Войти" [ref=e30] [cursor=pointer]:
        - generic [ref=e31]: Войти
    - button "У меня есть репетитор" [ref=e33] [cursor=pointer]
    - paragraph [ref=e34]:
      - text: Нет аккаунта?
      - button "Зарегистрироваться" [ref=e35] [cursor=pointer]
  - alert [ref=e36]: Repeto — Вход
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
  19  |     await page.getByRole('button', { name: /Отмена/i }).first().click();
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
> 55  |     await expect(btn).toBeVisible();
      |                       ^ Error: expect(locator).toBeVisible() failed
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
  120 |     await expect(page.getByPlaceholder('Иванов Пётр Сергеевич')).toBeVisible();
  121 |   });
  122 | 
  123 |   test('создание оплаты без суммы — не сохраняется', async ({ authedPage: page }) => {
  124 |     await page.goto('/finance/payments');
  125 |     await page.waitForLoadState('networkidle');
  126 | 
  127 |     await page.getByRole('button', { name: /Записать оплату/i }).first().click();
  128 |     await page.waitForTimeout(500);
  129 | 
  130 |     // Сохраняем без заполнения
  131 |     await page.getByRole('button', { name: 'Сохранить' }).click();
  132 |     await page.waitForTimeout(500);
  133 | 
  134 |     // Модал должен остаться открытым
  135 |     await expect(page.getByPlaceholder('4200')).toBeVisible();
  136 |   });
  137 | });
  138 | 
```