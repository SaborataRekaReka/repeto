# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-settings.spec.ts >> Journey 38: Настройки — рендеринг всех вкладок >> 38.5 Интеграции — ЮKassa видна
- Location: e2e\journeys-tier2-settings.spec.ts:110:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('ЮKassa')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('ЮKassa')

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - button "ТP Тест Playwright" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТP
          - generic [ref=e71]: Тест Playwright
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e83]: Настройки
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
      - generic [ref=e106]:
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e110] [cursor=pointer]: ТP
            - generic [ref=e111]: Тест Playwright
            - generic [ref=e112]: pw-1775929594302-q02g4@test.com
            - button "Изменить фото" [ref=e114] [cursor=pointer]:
              - generic [ref=e115]: Изменить фото
          - generic [ref=e116]:
            - button "Аккаунт" [ref=e117] [cursor=pointer]:
              - img [ref=e118]:
                - img [ref=e119]
              - text: Аккаунт
            - button "Безопасность" [ref=e121] [cursor=pointer]:
              - img [ref=e122]:
                - img [ref=e123]
              - text: Безопасность
            - button "Уведомления" [ref=e125] [cursor=pointer]:
              - img [ref=e126]:
                - img [ref=e127]
              - text: Уведомления
            - button "Политики" [ref=e129] [cursor=pointer]:
              - img [ref=e130]:
                - img [ref=e131]
              - text: Политики
            - button "Интеграции" [active] [ref=e133] [cursor=pointer]:
              - img [ref=e134]:
                - img [ref=e135]
              - text: Интеграции
          - generic [ref=e137]:
            - generic [ref=e138]:
              - generic [ref=e139]: Публичная страница
              - switch [ref=e142] [cursor=pointer]
            - textbox "slug" [ref=e147]: playwright-test
          - generic [ref=e148]:
            - generic [ref=e149]: Тема интерфейса
            - generic [ref=e150]:
              - button "Светлая" [ref=e151] [cursor=pointer]:
                - img [ref=e152]:
                  - img [ref=e153]
                - text: Светлая
              - button "Системная" [ref=e155] [cursor=pointer]:
                - img [ref=e156]:
                  - img [ref=e157]
                - text: Системная
              - button "Тёмная" [ref=e159] [cursor=pointer]:
                - img [ref=e160]:
                  - img [ref=e161]
                - text: Тёмная
        - generic [ref=e164]:
          - generic [ref=e167]:
            - img [ref=e169]:
              - img [ref=e170]
            - generic [ref=e172]:
              - generic [ref=e173]: Google Calendar
              - generic [ref=e174]: Двусторонняя синхронизация расписания
              - generic [ref=e178]: Не подключено
            - button "Подключить" [ref=e179] [cursor=pointer]:
              - generic [ref=e180]: Подключить
          - generic [ref=e183]:
            - img [ref=e185]:
              - img [ref=e186]
            - generic [ref=e188]:
              - generic [ref=e189]: Яндекс.Календарь
              - generic [ref=e190]: Двусторонняя синхронизация расписания
              - generic [ref=e194]: Не подключено
            - button "Подключить" [ref=e195] [cursor=pointer]:
              - generic [ref=e196]: Подключить
          - generic [ref=e199]:
            - img [ref=e201]:
              - img [ref=e202]
            - generic [ref=e204]:
              - generic [ref=e205]: Яндекс.Диск
              - generic [ref=e206]: Хранение и доступ к файлам учеников
              - generic [ref=e210]: Не подключено
            - button "Подключить" [ref=e211] [cursor=pointer]:
              - generic [ref=e212]: Подключить
  - alert [ref=e213]
```

# Test source

```ts
  13  |   const slug = `pw-s-${Date.now()}`;
  14  | 
  15  |   test.beforeAll(async ({ browser }) => {
  16  |     page = await browser.newPage();
  17  |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  18  |     token = reg.accessToken;
  19  |     await loginAndGoto(page, '/settings', reg.email, password);
  20  |     await page.waitForTimeout(1_000);
  21  |   });
  22  | 
  23  |   test.afterAll(async () => {
  24  |     await deleteAccount(page, token, password);
  25  |     await page.close();
  26  |   });
  27  | 
  28  |   test('37.1 Страница настроек загружена', async () => {
  29  |     await expect(page.getByText('Настройки').first()).toBeVisible();
  30  |   });
  31  | 
  32  |   test('37.2 Таб «Аккаунт» активен по умолчанию', async () => {
  33  |     await expect(page.getByRole('button', { name: 'Аккаунт', exact: true })).toBeVisible();
  34  |   });
  35  | 
  36  |   test('37.3 Карточка «Данные аккаунта» видна', async () => {
  37  |     await expect(page.getByText('Данные аккаунта')).toBeVisible();
  38  |   });
  39  | 
  40  |   test('37.4 Изменить имя → Сохранить → reload → имя сохранилось', async () => {
  41  |     const nameField = page.getByPlaceholder('Смирнов Алексей Иванович');
  42  |     await nameField.fill('Тест Настроек');
  43  |     await page.getByRole('button', { name: /Сохранить изменения/i }).click();
  44  |     await page.waitForTimeout(2_000);
  45  |     await page.reload();
  46  |     await page.waitForTimeout(2_000);
  47  |     await expect(nameField).toHaveValue('Тест Настроек');
  48  |   });
  49  | 
  50  |   test('37.5 Задать slug + включить публикацию → /t/slug доступна', async () => {
  51  |     // Set slug via API (UI auto-save on blur can be unreliable in tests)
  52  |     await page.request.patch(`${API}/settings/account`, {
  53  |       headers: { Authorization: `Bearer ${token}` },
  54  |       data: { slug, published: true },
  55  |     });
  56  |     await page.reload();
  57  |     await page.waitForTimeout(2_000);
  58  |     // Public page should be accessible via HTTP
  59  |     const resp = await page.request.get(`http://localhost:3100/t/${slug}`);
  60  |     expect(resp.status()).toBeLessThan(400);
  61  |   });
  62  | });
  63  | 
  64  | /* ═══════════════════════════════════════════════════════════════
  65  |    Journey 38 · Настройки — все вкладки отображаются
  66  |    ═══════════════════════════════════════════════════════════════ */
  67  | test.describe('Journey 38: Настройки — рендеринг всех вкладок', () => {
  68  |   let page: Page;
  69  |   let token: string;
  70  |   const password = 'TestPass123!';
  71  | 
  72  |   test.beforeAll(async ({ browser }) => {
  73  |     page = await browser.newPage();
  74  |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  75  |     token = reg.accessToken;
  76  |     await loginAndGoto(page, '/settings', reg.email, password);
  77  |     await page.waitForTimeout(1_000);
  78  |   });
  79  | 
  80  |   test.afterAll(async () => {
  81  |     await deleteAccount(page, token, password);
  82  |     await page.close();
  83  |   });
  84  | 
  85  |   test('38.1 Безопасность — форма смены пароля видна', async () => {
  86  |     await page.getByRole('button', { name: /Безопасность/i }).click();
  87  |     await page.waitForTimeout(500);
  88  |     await expect(page.locator('.card-title').filter({ hasText: 'Сменить пароль' })).toBeVisible();
  89  |     await expect(page.getByPlaceholder('Введите текущий пароль')).toBeVisible();
  90  |   });
  91  | 
  92  |   test('38.2 Безопасность — «Удалить аккаунт» видна', async () => {
  93  |     const deleteBtn = page.getByRole('button', { name: /Удалить аккаунт/i });
  94  |     await deleteBtn.scrollIntoViewIfNeeded();
  95  |     await expect(deleteBtn).toBeVisible();
  96  |   });
  97  | 
  98  |   test('38.3 Уведомления — настройки видны', async () => {
  99  |     await page.getByRole('button', { name: /Уведомления/i }).click();
  100 |     await page.waitForTimeout(500);
  101 |     await expect(page.getByText('Настройки уведомлений')).toBeVisible();
  102 |   });
  103 | 
  104 |   test('38.4 Политики — настройки видны', async () => {
  105 |     await page.getByRole('button', { name: /Политики/i }).click();
  106 |     await page.waitForTimeout(500);
  107 |     await expect(page.getByText('Политика отмен')).toBeVisible();
  108 |   });
  109 | 
  110 |   test('38.5 Интеграции — ЮKassa видна', async () => {
  111 |     await page.getByRole('button', { name: /Интеграции/i }).click();
  112 |     await page.waitForTimeout(500);
> 113 |     await expect(page.getByText('ЮKassa')).toBeVisible();
      |                                            ^ Error: expect(locator).toBeVisible() failed
  114 |   });
  115 | });
  116 | 
  117 | /* ═══════════════════════════════════════════════════════════════
  118 |    Journey 39 · Безопасность — смена пароля через UI
  119 |    ═══════════════════════════════════════════════════════════════ */
  120 | test.describe('Journey 39: Безопасность — смена пароля', () => {
  121 |   let page: Page;
  122 |   let token: string;
  123 |   let email: string;
  124 |   const password = 'TestPass123!';
  125 |   const newPassword = 'NewPass456!';
  126 | 
  127 |   test.beforeAll(async ({ browser }) => {
  128 |     page = await browser.newPage();
  129 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  130 |     token = reg.accessToken;
  131 |     email = reg.email;
  132 |     await loginAndGoto(page, '/settings', email, password);
  133 |     await page.waitForTimeout(1_000);
  134 |     await page.getByRole('button', { name: /Безопасность/i }).click();
  135 |     await page.waitForTimeout(500);
  136 |   });
  137 | 
  138 |   test.afterAll(async () => {
  139 |     // Clean up with the NEW password (access token still valid as JWT)
  140 |     await page.request.delete(`${API}/settings/account`, {
  141 |       headers: { Authorization: `Bearer ${token}` },
  142 |       data: { password: newPassword },
  143 |     });
  144 |     await page.close();
  145 |   });
  146 | 
  147 |   test('39.1 Заполнить и отправить форму смены пароля', async () => {
  148 |     await page.getByPlaceholder('Введите текущий пароль').fill(password);
  149 |     await page.getByPlaceholder('Введите новый пароль').fill(newPassword);
  150 |     await page.getByPlaceholder('Повторите новый пароль').fill(newPassword);
  151 |     await page.getByRole('button', { name: /Сменить пароль/i }).click();
  152 |     await page.waitForTimeout(3_000);
  153 |   });
  154 | 
  155 |   test('39.2 Редирект на страницу входа', async () => {
  156 |     await expect(page).toHaveURL(/registration|sign-in/i, { timeout: 10_000 });
  157 |   });
  158 | 
  159 |   test('39.3 Логин с новым паролем работает', async () => {
  160 |     await page.getByPlaceholder('Введите email или телефон').fill(email);
  161 |     await page.getByPlaceholder('Введите пароль').fill(newPassword);
  162 |     await page.getByRole('button', { name: 'Войти' }).click();
  163 |     await page.waitForURL('**/dashboard', { timeout: 10_000 });
  164 |   });
  165 | });
  166 | 
  167 | /* ═══════════════════════════════════════════════════════════════
  168 |    Journey 40 · Удаление аккаунта через UI
  169 |    ═══════════════════════════════════════════════════════════════ */
  170 | test.describe('Journey 40: Удаление аккаунта через UI', () => {
  171 |   let page: Page;
  172 |   const password = 'TestPass123!';
  173 | 
  174 |   test.beforeAll(async ({ browser }) => {
  175 |     page = await browser.newPage();
  176 |     const reg = await registerViaAPI(page, { email: uniqueEmail(), password });
  177 |     await loginAndGoto(page, '/settings', reg.email, password);
  178 |     await page.waitForTimeout(1_000);
  179 |     await page.getByRole('button', { name: /Безопасность/i }).click();
  180 |     await page.waitForTimeout(500);
  181 |   });
  182 | 
  183 |   test.afterAll(async () => {
  184 |     await page.close();
  185 |   });
  186 | 
  187 |   test('40.1 Кнопка «Удалить аккаунт» видна', async () => {
  188 |     await expect(page.getByRole('button', { name: /Удалить аккаунт/i })).toBeVisible();
  189 |   });
  190 | 
  191 |   test('40.2 Клик → форма подтверждения с паролем', async () => {
  192 |     await page.getByRole('button', { name: /Удалить аккаунт/i }).click();
  193 |     await page.waitForTimeout(500);
  194 |     await expect(page.getByPlaceholder('Ваш пароль')).toBeVisible();
  195 |     await expect(page.getByRole('button', { name: /Подтвердить удаление/i })).toBeVisible();
  196 |   });
  197 | 
  198 |   test('40.3 Ввод пароля → подтверждение → redirect на /registration', async () => {
  199 |     await page.getByPlaceholder('Ваш пароль').fill(password);
  200 |     await page.getByRole('button', { name: /Подтвердить удаление/i }).click();
  201 |     await expect(page).toHaveURL(/registration/i, { timeout: 10_000 });
  202 |   });
  203 | });
  204 | 
```