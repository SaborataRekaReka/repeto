# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payments.spec.ts >> Оплаты — создание (live update) >> создание оплаты через модал — видна без F5
- Location: e2e\payments.spec.ts:87:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Page crashed
Call log:
  - waiting for getByRole('button', { name: /Записать оплату/i }).first()

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
  19  |     expect(hasTable || hasEmpty).toBeTruthy();
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
> 92  |     await page.getByRole('button', { name: /Записать оплату/i }).first().click();
      |                                                                          ^ Error: locator.click: Page crashed
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
  120 |       const loginResp = await request.post(`${API_BASE}/auth/login`, {
  121 |         data: { email: 'demo@repeto.ru', password: 'demo1234' },
  122 |       });
  123 |       const { accessToken } = await loginResp.json();
  124 | 
  125 |       const resp = await request.get(`${API_BASE}/payments?limit=50`, {
  126 |         headers: { Authorization: `Bearer ${accessToken}` },
  127 |       });
  128 |       const data = await resp.json();
  129 |       const payments = data.data || data;
  130 |       for (const p of payments) {
  131 |         if (p.amount === 999) {
  132 |           await request.delete(`${API_BASE}/payments/${p.id}`, {
  133 |             headers: { Authorization: `Bearer ${accessToken}` },
  134 |           });
  135 |         }
  136 |       }
  137 |     } catch { /* best effort */ }
  138 |   });
  139 | });
  140 | 
  141 | test.describe('Оплаты — детали', () => {
  142 |   test('клик по оплате открывает детали', async ({ authedPage: page }) => {
  143 |     await page.goto('/payments');
  144 |     await page.waitForLoadState('networkidle');
  145 | 
  146 |     const firstRow = page.locator('table tbody tr').first();
  147 |     if (await firstRow.isVisible().catch(() => false)) {
  148 |       await firstRow.click();
  149 |       await page.waitForTimeout(500);
  150 | 
  151 |       // Должен открыться модал деталей
  152 |       const hasDetail = await page.getByText(/Детали оплаты|Сумма|Способ/i).first().isVisible().catch(() => false);
  153 |       expect(hasDetail).toBeTruthy();
  154 |     }
  155 |   });
  156 | });
  157 | 
```