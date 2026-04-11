# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> Journey 2: Публичная страница и запись ученика >> 2.6 Настройки → снимаем публикацию (toggle) → публичная страница больше не видна
- Location: e2e\journeys.spec.ts:235:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/t/j2-1775929964481
Call log:
  - navigating to "http://127.0.0.1:3100/t/j2-1775929964481", waiting until "load"

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
        - button "ЕТ Елена Тестова" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ЕТ
          - generic [ref=e71]: Елена Тестова
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
            - generic [ref=e110] [cursor=pointer]: ЕТ
            - generic [ref=e111]: Елена Тестова
            - generic [ref=e112]: pw-1775929964481-k7fv9@test.com
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
            - button "Интеграции" [ref=e133] [cursor=pointer]:
              - img [ref=e134]:
                - img [ref=e135]
              - text: Интеграции
          - generic [ref=e137]:
            - generic [ref=e138]:
              - generic [ref=e139]: Публичная страница
              - switch [checked] [ref=e142] [cursor=pointer]
            - link "repeto.ru/t/j2-1775929964481" [ref=e144] [cursor=pointer]:
              - /url: /t/j2-1775929964481
              - img [ref=e145]:
                - img [ref=e146]
              - text: repeto.ru/t/j2-1775929964481
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
          - generic [ref=e165]:
            - generic [ref=e166]: Данные аккаунта
            - generic [ref=e168]:
              - generic [ref=e169]:
                - generic [ref=e170]: ФИО
                - textbox "Смирнов Алексей Иванович" [ref=e173]: Елена Тестова
              - generic [ref=e174]:
                - generic [ref=e175]: Email
                - textbox "email@example.com" [disabled] [ref=e178]: pw-1775929964481-k7fv9@test.com
                - generic [ref=e179]: Изменение email пока недоступно
              - generic [ref=e180]:
                - generic [ref=e181]: Телефон
                - textbox "+7 900 123-45-67" [ref=e184]
              - generic [ref=e185]:
                - generic [ref=e186]: WhatsApp
                - textbox "+79001234567" [ref=e189]
              - generic [ref=e190]:
                - generic [ref=e191]: ВКонтакте
                - textbox "https://vk.com/username" [ref=e194]
              - generic [ref=e195]:
                - generic [ref=e196]: Сайт
                - textbox "https://my-site.ru" [ref=e199]
              - generic [ref=e200]:
                - generic [ref=e201]: Подзаголовок (для публичной страницы)
                - textbox "Репетитор по математике и физике" [ref=e204]: Подготовлю к ЕГЭ на 90+
              - generic [ref=e205]:
                - generic [ref=e206]: О себе
                - textbox "Подробная информация о вашем опыте, подходе, достижениях..." [ref=e209]
          - generic [ref=e210]:
            - generic [ref=e211]:
              - generic [ref=e212]: Предметы и цены
              - button "Добавить" [ref=e213] [cursor=pointer]:
                - img [ref=e216]:
                  - img [ref=e217]
                - generic [ref=e219]: Добавить
            - generic [ref=e221]:
              - generic [ref=e222]:
                - generic [ref=e223]: Предмет
                - generic [ref=e224]: Цена за час
                - generic [ref=e225]: Длительность
              - generic [ref=e227]:
                - generic [ref=e228]:
                  - textbox "Математика" [ref=e231]
                  - generic [ref=e232]:
                    - textbox "2 100" [ref=e235]: "2000"
                    - generic: ₽
                  - generic [ref=e236]:
                    - textbox "60" [ref=e239]
                    - generic: мин
                  - button [ref=e240] [cursor=pointer]:
                    - img [ref=e243]:
                      - img [ref=e244]
                - generic [ref=e246]:
                  - textbox "Математика" [ref=e249]: Физика
                  - generic [ref=e250]:
                    - textbox "2 100" [ref=e253]: "2500"
                    - generic: ₽
                  - generic [ref=e254]:
                    - textbox "60" [ref=e257]: "90"
                    - generic: мин
                  - button [ref=e258] [cursor=pointer]:
                    - img [ref=e261]:
                      - img [ref=e262]
          - generic [ref=e264]:
            - generic [ref=e265]: Формат занятий
            - generic [ref=e267]:
              - generic [ref=e268]: Формат
              - group [ref=e270] [cursor=pointer]:
                - combobox [ref=e271]:
                  - generic [ref=e272]: Онлайн (Zoom / Google Meet)
                - img [ref=e273]:
                  - img [ref=e274]
          - button "Сохранить изменения" [ref=e277] [cursor=pointer]:
            - generic [ref=e278]: Сохранить изменения
  - alert [ref=e279]: Настройки — Repeto
```

# Test source

```ts
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
  186 |     }
  187 |   });
  188 | 
  189 |   test('2.3 Заполняем форму бронирования и отправляем', async () => {
  190 |     // Имя клиента
  191 |     const nameField = page.getByPlaceholder(/имя|ФИО/i).first();
  192 |     if (await nameField.isVisible().catch(() => false)) {
  193 |       await nameField.fill('Пётр Клиент');
  194 |     }
  195 | 
  196 |     // Телефон
  197 |     const phoneField = page.getByPlaceholder(/телефон|\+7/i).first();
  198 |     if (await phoneField.isVisible().catch(() => false)) {
  199 |       await phoneField.fill('+79991234567');
  200 |     }
  201 | 
  202 |     // Email
  203 |     const emailField = page.getByPlaceholder(/email/i).first();
  204 |     if (await emailField.isVisible().catch(() => false)) {
  205 |       await emailField.fill('client@test.com');
  206 |     }
  207 | 
  208 |     // Кнопка отправки
  209 |     const submitBtn = page.getByRole('button', { name: /Записаться|Отправить|Забронировать/i }).first();
  210 |     if (await submitBtn.isVisible().catch(() => false)) {
  211 |       await submitBtn.click();
  212 |       await page.waitForTimeout(2_000);
  213 |     }
  214 |   });
  215 | 
  216 |   test('2.4 Репетитор логинится → видит уведомление о новой записи', async () => {
  217 |     await loginAndGoto(page, '/notifications', tutorEmail, tutorPassword);
  218 | 
  219 |     // Должно быть уведомление о записи/бронировании
  220 |     await page.waitForTimeout(2_000);
  221 |     const body = await page.locator('body').textContent();
  222 |     // Проверяем что страница уведомлений загрузилась
  223 |     expect(body).toMatch(/Уведомления|уведомлений/i);
  224 |   });
  225 | 
  226 |   test('2.5 Проверяем дашборд — новая запись отразилась', async () => {
  227 |     await page.getByRole('link', { name: /Дашборд/i }).click();
  228 |     await expect(page).toHaveURL(/\/dashboard/);
  229 |     await page.waitForTimeout(1_500);
  230 | 
  231 |     // Дашборд загрузился
  232 |     await expect(page.locator('body')).toContainText(/Дашборд|дашборд/i);
  233 |   });
  234 | 
  235 |   test('2.6 Настройки → снимаем публикацию (toggle) → публичная страница больше не видна', async () => {
  236 |     // Идём в настройки
  237 |     await page.getByRole('link', { name: /Настройки/i }).click();
  238 |     await expect(page).toHaveURL(/\/settings/);
  239 |     await page.waitForTimeout(1_000);
  240 | 
  241 |     // Снимаем публикацию через API (toggle published = false)
  242 |     const unpublishRes = await page.request.patch(`${API}/settings/account`, {
  243 |       headers: { Authorization: `Bearer ${tutorToken}` },
  244 |       data: { published: false },
  245 |     });
  246 |     expect(unpublishRes.ok()).toBe(true);
  247 | 
  248 |     // Проверяем: публичная страница теперь недоступна (анонимный запрос)
  249 |     const anonCtx = await page.context().browser()!.newContext();
  250 |     const anonPage = await anonCtx.newPage();
> 251 |     const resp = await anonPage.goto(`http://127.0.0.1:3100/t/${slug}`);
      |                                 ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/t/j2-1775929964481
  252 |     const body = await anonPage.locator('body').textContent({ timeout: 10_000 });
  253 |     // Любой из вариантов: 404 статус, редирект, или текст «не найден/не опубликован»
  254 |     const isHidden =
  255 |       resp?.status() === 404 ||
  256 |       !/Елена Тестова/.test(body ?? '') ||
  257 |       /не найден|не опубликован/i.test(body ?? '');
  258 |     expect(isHidden).toBe(true);
  259 |     await anonCtx.close();
  260 |   });
  261 | });
  262 | 
  263 | // ═══════════════════════════════════════════════════════════════
  264 | // Journey 3: Урок → проведение → оплата → баланс ученика
  265 | // ═══════════════════════════════════════════════════════════════
  266 | test.describe('Journey 3: Полный цикл урока — от создания до оплаты', () => {
  267 |   test.describe.configure({ mode: 'serial' });
  268 | 
  269 |   let email: string;
  270 |   let token: string;
  271 |   const password = 'Journey3Pass!';
  272 |   let studentId: string;
  273 |   let lessonId: string;
  274 |   let page: Page;
  275 | 
  276 |   test.beforeAll(async ({ browser }) => {
  277 |     page = await browser.newPage();
  278 |     email = uniqueEmail();
  279 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Цикл Урока' });
  280 |     token = auth.accessToken;
  281 | 
  282 |     // Создаём ученика
  283 |     const student = await createStudentAPI(page, token, {
  284 |       name: 'Ольга Петрова',
  285 |       rate: 3000,
  286 |       subject: 'Физика',
  287 |     });
  288 |     studentId = student.id;
  289 | 
  290 |     // Создаём урок на завтра
  291 |     const lesson = await createLessonAPI(page, token, studentId, {
  292 |       subject: 'Физика',
  293 |       rate: 3000,
  294 |     });
  295 |     lessonId = lesson.id;
  296 |   });
  297 | 
  298 |   test.afterAll(async () => {
  299 |     await page.close();
  300 |   });
  301 | 
  302 |   test('3.1 Расписание → урок виден в календаре', async () => {
  303 |     await loginAndGoto(page, '/schedule', email, password);
  304 |     await page.waitForTimeout(2_000);
  305 | 
  306 |     // В расписании видна Физика или Ольга
  307 |     await expect(page.locator('body')).toContainText(/Физика|Ольга/i, { timeout: 8_000 });
  308 |   });
  309 | 
  310 |   test('3.2 Кликаем на урок → открывается модалка с деталями', async () => {
  311 |     // Кликаем на элемент урока в календаре
  312 |     const lessonEl = page.getByText(/Физика/i).first();
  313 |     await lessonEl.click();
  314 |     await page.waitForTimeout(500);
  315 | 
  316 |     // Модалка деталей урока
  317 |     await expect(page.locator('body')).toContainText(/Ольга Петрова|Физика|3[\s,.]?000/i, {
  318 |       timeout: 5_000,
  319 |     });
  320 |   });
  321 | 
  322 |   test('3.3 Отмечаем урок как проведённый → статус меняется', async () => {
  323 |     // Ищем кнопку «Проведено» / «Завершить»
  324 |     const doneBtn = page.getByRole('button', { name: /Проведено|Завершить|Провести/i }).first();
  325 |     if (await doneBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  326 |       await doneBtn.click();
  327 |       await page.waitForTimeout(1_500);
  328 |     } else {
  329 |       // Обновляем статус через API
  330 |       await page.request.patch(`${API}/lessons/${lessonId}/status`, {
  331 |         headers: { Authorization: `Bearer ${token}` },
  332 |         data: { status: 'COMPLETED' },
  333 |       });
  334 |       await page.reload();
  335 |       await page.waitForTimeout(1_500);
  336 |     }
  337 |   });
  338 | 
  339 |   test('3.4 Переход на карточку ученика → баланс отрицательный (долг за урок)', async () => {
  340 |     await page.goto(`/students/${studentId}`);
  341 |     await page.waitForTimeout(2_000);
  342 | 
  343 |     await expect(page.getByText('Ольга Петрова')).toBeVisible({ timeout: 5_000 });
  344 |     // За проведённый урок должен быть долг ~3000
  345 |     const body = await page.locator('body').textContent() || '';
  346 |     // Наличие суммы в тексте (долг или баланс)
  347 |     expect(body).toMatch(/3[\s,.]?000|баланс|долг|₽/i);
  348 |   });
  349 | 
  350 |   test('3.5 Записываем оплату через модалку из карточки ученика', async () => {
  351 |     // Вкладка «Оплаты»
```