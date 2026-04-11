# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier2-schedule.spec.ts >> Journey 26: Кнопка «Новое занятие» из расписания >> 26.1 Кнопка «Новое занятие» видна на странице
- Location: e2e\journeys-tier2-schedule.spec.ts:219:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Новое занятие/i })
Expected: visible
Error: strict mode violation: getByRole('button', { name: /Новое занятие/i }) resolved to 2 elements:
    1) <button class="repeto-sidebar__profile-btn">…</button> aka getByRole('button', { name: 'НЗ Новое Занятие Тест' })
    2) <button tabindex="0" type="button" class="g-button g-button_view_action g-button_size_m g-button_pin_round-round">…</button> aka getByRole('button', { name: 'Новое занятие', exact: true })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /Новое занятие/i })

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
        - button "НЗ Новое Занятие Тест" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: НЗ
          - generic [ref=e71]: Новое Занятие Тест
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
  149 | 
  150 |     const label = page.locator('.text-h6').first();
  151 |     const now = new Date();
  152 |     const monthNames = [
  153 |       'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  154 |       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  155 |     ];
  156 |     await expect(label).toContainText(monthNames[now.getMonth()]);
  157 |   });
  158 | 
  159 |   test('25.4 Неделя: стрелки переключают на ±7 дней', async () => {
  160 |     await page.getByRole('button', { name: 'Неделя' }).click();
  161 |     await page.waitForTimeout(500);
  162 | 
  163 |     const label = page.locator('.text-h6').first();
  164 |     const textBefore = await label.textContent();
  165 | 
  166 |     // Следующая неделя
  167 |     const nextBtnW = page.locator('button.btn-stroke.btn-square').nth(1);
  168 |     await nextBtnW.click();
  169 |     await page.waitForTimeout(500);
  170 | 
  171 |     const textAfter = await label.textContent();
  172 |     expect(textAfter).not.toBe(textBefore);
  173 |   });
  174 | 
  175 |   test('25.5 День: стрелки переключают на ±1 день', async () => {
  176 |     await page.getByRole('button', { name: 'День' }).click();
  177 |     await page.waitForTimeout(500);
  178 | 
  179 |     const label = page.locator('.text-h6').first();
  180 |     const textBefore = await label.textContent();
  181 | 
  182 |     const nextBtnD = page.locator('button.btn-stroke.btn-square').nth(1);
  183 |     await nextBtnD.click();
  184 |     await page.waitForTimeout(500);
  185 | 
  186 |     const textAfter = await label.textContent();
  187 |     expect(textAfter).not.toBe(textBefore);
  188 |   });
  189 | });
  190 | 
  191 | // ═══════════════════════════════════════════════════════════════
  192 | // Journey 26: Кнопка «Новое занятие» из расписания
  193 | // ═══════════════════════════════════════════════════════════════
  194 | test.describe('Journey 26: Кнопка «Новое занятие» из расписания', () => {
  195 |   test.describe.configure({ mode: 'serial' });
  196 | 
  197 |   let email: string;
  198 |   let token: string;
  199 |   const password = 'Journey26Pass!';
  200 |   let page: Page;
  201 | 
  202 |   test.beforeAll(async ({ browser }) => {
  203 |     page = await browser.newPage();
  204 |     email = uniqueEmail();
  205 |     const auth = await registerViaAPI(page, { email, password, name: 'Новое Занятие Тест' });
  206 |     token = auth.accessToken;
  207 | 
  208 |     await createStudentAPI(page, token, {
  209 |       name: 'Расписанный Ученик',
  210 |       subject: 'Английский',
  211 |       rate: 2500,
  212 |     });
  213 |   });
  214 | 
  215 |   test.afterAll(async () => {
  216 |     await page.close();
  217 |   });
  218 | 
  219 |   test('26.1 Кнопка «Новое занятие» видна на странице', async () => {
  220 |     await loginAndGoto(page, '/schedule', email, password);
  221 |     await page.waitForTimeout(1_000);
  222 | 
  223 |     await expect(
  224 |       page.getByRole('button', { name: /Новое занятие/i }),
> 225 |     ).toBeVisible({ timeout: 5_000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  226 |   });
  227 | 
  228 |   test('26.2 Клик → модалка создания урока', async () => {
  229 |     await page.getByRole('button', { name: /Новое занятие/i }).click();
  230 | 
  231 |     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3_000 });
  232 |     await expect(page.getByRole('dialog')).toContainText(/Новое занятие/i);
  233 |   });
  234 | 
  235 |   test('26.3 Закрыть модалку → расписание на месте', async () => {
  236 |     await page.keyboard.press('Escape');
  237 |     await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3_000 });
  238 | 
  239 |     await expect(page.getByText('Пн').first()).toBeVisible();
  240 |   });
  241 | });
  242 | 
  243 | // ═══════════════════════════════════════════════════════════════
  244 | // Journey 27: Уроки отображаются во всех видах
  245 | // ═══════════════════════════════════════════════════════════════
  246 | test.describe('Journey 27: Уроки во всех видах расписания', () => {
  247 |   test.describe.configure({ mode: 'serial' });
  248 | 
  249 |   let email: string;
  250 |   let token: string;
  251 |   const password = 'Journey27Pass!';
  252 |   let page: Page;
  253 |   let studentId: string;
  254 | 
  255 |   test.beforeAll(async ({ browser }) => {
  256 |     page = await browser.newPage();
  257 |     email = uniqueEmail();
  258 |     const auth = await registerViaAPI(page, { email, password, name: 'Виды Тест' });
  259 |     token = auth.accessToken;
  260 | 
  261 |     const student = await createStudentAPI(page, token, {
  262 |       name: 'Видовой Ученик',
  263 |       subject: 'Химия',
  264 |       rate: 1800,
  265 |     });
  266 |     studentId = student.id;
  267 | 
  268 |     // Урок на завтра в 14:00 (по умолчанию из createLessonAPI)
  269 |     await createLessonAPI(page, token, studentId, {
  270 |       subject: 'Химия',
  271 |       rate: 1800,
  272 |     });
  273 |   });
  274 | 
  275 |   test.afterAll(async () => {
  276 |     await page.close();
  277 |   });
  278 | 
  279 |   test('27.1 Вид «Месяц» — урок виден как LessonDot', async () => {
  280 |     await loginAndGoto(page, '/schedule', email, password);
  281 |     await page.waitForTimeout(1_000);
  282 | 
  283 |     // Урок отображается с именем ученика и предметом
  284 |     await expect(page.locator('button').filter({ hasText: /Химия/ }).first()).toBeVisible({ timeout: 5_000 });
  285 |   });
  286 | 
  287 |   test('27.2 Вид «Неделя» — урок виден в сетке', async () => {
  288 |     await page.getByRole('button', { name: 'Неделя' }).click();
  289 |     await page.waitForTimeout(500);
  290 | 
  291 |     await expect(page.locator('button').filter({ hasText: /Химия/ }).first()).toBeVisible({ timeout: 5_000 });
  292 |   });
  293 | 
  294 |   test('27.3 Вид «День» — урок виден в тайм-слоте', async () => {
  295 |     // Переключаемся на день
  296 |     await page.getByRole('button', { name: 'День' }).click();
  297 |     await page.waitForTimeout(500);
  298 | 
  299 |     // Переходим на завтра (урок на завтра)
  300 |     const nextBtn = page.locator('button.btn-stroke.btn-square').nth(1);
  301 |     await nextBtn.click();
  302 |     await page.waitForTimeout(500);
  303 | 
  304 |     // Урок с предметом «Химия» виден
  305 |     await expect(page.locator('button').filter({ hasText: /Химия/ }).first()).toBeVisible({ timeout: 5_000 });
  306 |   });
  307 | 
  308 |   test('27.4 Время урока отображается в Day view', async () => {
  309 |     // В Day view рядом с уроком показано время 14:00
  310 |     await expect(page.getByText('14:00').first()).toBeVisible();
  311 |   });
  312 | });
  313 | 
  314 | // ═══════════════════════════════════════════════════════════════
  315 | // Journey 28: LessonDetailModal из расписания + действия
  316 | // ═══════════════════════════════════════════════════════════════
  317 | test.describe('Journey 28: LessonDetailModal из расписания', () => {
  318 |   test.describe.configure({ mode: 'serial' });
  319 | 
  320 |   let email: string;
  321 |   let token: string;
  322 |   const password = 'Journey28Pass!';
  323 |   let page: Page;
  324 |   let studentId: string;
  325 | 
```