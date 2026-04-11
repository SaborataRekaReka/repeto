# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys-tier1.spec.ts >> Journey 9: Редактирование и удаление ученика >> 9.3 Открываем карточку → видим обновлённые данные
- Location: e2e\journeys-tier1.spec.ts:218:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Анна Обновлённая')
Expected: visible
Error: strict mode violation: getByText('Анна Обновлённая') resolved to 2 elements:
    1) <span class="g-text g-text_variant_header-1">Анна Обновлённая</span> aka locator('header').getByText('Анна Обновлённая')
    2) <div class="g-text g-text_variant_subheader-2">Анна Обновлённая</div> aka getByText('Анна Обновлённая').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Анна Обновлённая')

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
        - button "ТЕ Тест ЕдитСтудент" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТЕ
          - generic [ref=e71]: Тест ЕдитСтудент
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - button [ref=e83] [cursor=pointer]:
            - img [ref=e86]:
              - img [ref=e87]
          - generic [ref=e89]: Анна Обновлённая
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
            - generic [ref=e115]: АО
            - generic [ref=e116]: Анна Обновлённая
            - generic [ref=e117]: Химия
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
  - alert [ref=e175]: /students/d853d5ae-88e3-4643-820c-f02aaadd2e52
```

# Test source

```ts
  122 |   });
  123 | 
  124 |   test('8.5 Редактируем урок через API → данные обновились', async () => {
  125 |     // Сначала вернём статус обратно на PLANNED чтобы можно было редактировать
  126 |     await page.request.patch(`${API}/lessons/${lessonId}/status`, {
  127 |       headers: { Authorization: `Bearer ${token}` },
  128 |       data: { status: 'PLANNED' },
  129 |     });
  130 | 
  131 |     const patchRes = await page.request.patch(`${API}/lessons/${lessonId}`, {
  132 |       headers: { Authorization: `Bearer ${token}` },
  133 |       data: { rate: 3500, duration: 90 },
  134 |     });
  135 |     expect(patchRes.ok()).toBe(true);
  136 | 
  137 |     const getRes = await page.request.get(`${API}/lessons/${lessonId}`, {
  138 |       headers: { Authorization: `Bearer ${token}` },
  139 |     });
  140 |     const updated = await getRes.json();
  141 |     expect(updated.rate).toBe(3500);
  142 |     expect(updated.duration).toBe(90);
  143 |   });
  144 | 
  145 |   test('8.6 Удаляем урок → он исчезает из расписания', async () => {
  146 |     const delRes = await page.request.delete(`${API}/lessons/${lessonId}`, {
  147 |       headers: { Authorization: `Bearer ${token}` },
  148 |     });
  149 |     expect(delRes.ok()).toBe(true);
  150 | 
  151 |     // Перезагружаем расписание
  152 |     await page.goto('/schedule');
  153 |     await page.waitForTimeout(2_000);
  154 | 
  155 |     // Урок больше не виден (либо страница пуста, либо нет «Физика»)
  156 |     const bodyText = await page.locator('body').textContent();
  157 |     // Если на странице вообще есть уроки, то конкретно «Физика» должна пропасть
  158 |     // (могут остаться другие уроки — проверяем именно наш)
  159 |     const getRes = await page.request.get(`${API}/lessons/${lessonId}`, {
  160 |       headers: { Authorization: `Bearer ${token}` },
  161 |     });
  162 |     // Урок удалён — должен быть 404
  163 |     expect(getRes.status()).toBe(404);
  164 |   });
  165 | });
  166 | 
  167 | // ═══════════════════════════════════════════════════════════════
  168 | // Journey 9: Редактирование и удаление ученика
  169 | // ═══════════════════════════════════════════════════════════════
  170 | test.describe('Journey 9: Редактирование и удаление ученика', () => {
  171 |   test.describe.configure({ mode: 'serial' });
  172 | 
  173 |   let email: string;
  174 |   let token: string;
  175 |   const password = 'Journey9Pass!';
  176 |   let page: Page;
  177 |   let studentId: string;
  178 | 
  179 |   test.beforeAll(async ({ browser }) => {
  180 |     page = await browser.newPage();
  181 |     email = uniqueEmail();
  182 | 
  183 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест ЕдитСтудент' });
  184 |     token = auth.accessToken;
  185 | 
  186 |     const student = await createStudentAPI(page, token, {
  187 |       name: 'Анна Редактируемая',
  188 |       subject: 'Химия',
  189 |       rate: 1800,
  190 |     });
  191 |     studentId = student.id;
  192 |   });
  193 | 
  194 |   test.afterAll(async () => {
  195 |     await page.close();
  196 |   });
  197 | 
  198 |   test('9.1 Ученики → видим ученика в списке', async () => {
  199 |     // Login → dashboard first, then navigate via sidebar (avoids auth loss on page.goto)
  200 |     await loginAndGoto(page, '/dashboard', email, password);
  201 |     await page.getByRole('link', { name: /Ученики/i }).click();
  202 |     await page.waitForURL(/\/students/, { timeout: 10_000 });
  203 |     await expect(page.getByText('Анна Редактируемая')).toBeVisible({ timeout: 8_000 });
  204 |   });
  205 | 
  206 |   test('9.2 Редактируем ученика через API → данные обновляются', async () => {
  207 |     const patchRes = await page.request.patch(`${API}/students/${studentId}`, {
  208 |       headers: { Authorization: `Bearer ${token}` },
  209 |       data: { name: 'Анна Обновлённая', rate: 2200 },
  210 |     });
  211 |     expect(patchRes.ok()).toBe(true);
  212 | 
  213 |     // Проверяем в UI
  214 |     await page.reload();
  215 |     await expect(page.getByText('Анна Обновлённая')).toBeVisible({ timeout: 5_000 });
  216 |   });
  217 | 
  218 |   test('9.3 Открываем карточку → видим обновлённые данные', async () => {
  219 |     await page.getByText('Анна Обновлённая').first().click();
  220 |     await expect(page).toHaveURL(/\/students\/.+/);
  221 | 
> 222 |     await expect(page.getByText('Анна Обновлённая')).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  223 |     await expect(page.locator('body')).toContainText(/2[\s,.]?200|2200/);
  224 |   });
  225 | 
  226 |   test('9.4 Меняем статус ученика на «На паузе»', async () => {
  227 |     const patchRes = await page.request.patch(`${API}/students/${studentId}`, {
  228 |       headers: { Authorization: `Bearer ${token}` },
  229 |       data: { status: 'PAUSED' },
  230 |     });
  231 |     expect(patchRes.ok()).toBe(true);
  232 | 
  233 |     // Проверяем через API
  234 |     const getRes = await page.request.get(`${API}/students/${studentId}`, {
  235 |       headers: { Authorization: `Bearer ${token}` },
  236 |     });
  237 |     const student = await getRes.json();
  238 |     expect(student.status).toBe('PAUSED');
  239 |   });
  240 | 
  241 |   test('9.5 Ученики → вкладка «На паузе» → ученик виден', async () => {
  242 |     await page.goto('/students');
  243 |     await page.waitForTimeout(1_000);
  244 | 
  245 |     const pauseTab = page.getByRole('button', { name: /На паузе/i }).first();
  246 |     if (await pauseTab.isVisible().catch(() => false)) {
  247 |       await pauseTab.click();
  248 |       await page.waitForTimeout(1_000);
  249 |       await expect(page.getByText('Анна Обновлённая')).toBeVisible({ timeout: 5_000 });
  250 |     }
  251 |   });
  252 | 
  253 |   test('9.6 Удаляем ученика → он исчезает', async () => {
  254 |     const delRes = await page.request.delete(`${API}/students/${studentId}`, {
  255 |       headers: { Authorization: `Bearer ${token}` },
  256 |     });
  257 |     expect(delRes.ok()).toBe(true);
  258 | 
  259 |     // Проверяем 404
  260 |     const getRes = await page.request.get(`${API}/students/${studentId}`, {
  261 |       headers: { Authorization: `Bearer ${token}` },
  262 |     });
  263 |     expect(getRes.status()).toBe(404);
  264 | 
  265 |     // UI: обновляем — ученика нет
  266 |     await page.goto('/students');
  267 |     await page.waitForTimeout(1_500);
  268 |     const bodyText = await page.locator('body').textContent();
  269 |     expect(bodyText).not.toContain('Анна Обновлённая');
  270 |   });
  271 | });
  272 | 
  273 | // ═══════════════════════════════════════════════════════════════
  274 | // Journey 10: Подтверждение и отклонение бронирования
  275 | // ═══════════════════════════════════════════════════════════════
  276 | test.describe('Journey 10: Подтверждение / отклонение бронирования', () => {
  277 |   test.describe.configure({ mode: 'serial' });
  278 | 
  279 |   let tutorEmail: string;
  280 |   let tutorToken: string;
  281 |   const tutorPassword = 'Journey10Pass!';
  282 |   let slug: string;
  283 |   let page: Page;
  284 | 
  285 |   test.beforeAll(async ({ browser }) => {
  286 |     page = await browser.newPage();
  287 |     tutorEmail = uniqueEmail();
  288 |     slug = `j10-${Date.now()}`;
  289 | 
  290 |     const auth = await registerViaAPI(page, {
  291 |       email: tutorEmail,
  292 |       password: tutorPassword,
  293 |       name: 'Ольга Букинг',
  294 |     });
  295 |     tutorToken = auth.accessToken;
  296 | 
  297 |     // Публикуем профиль
  298 |     await page.request.patch(`${API}/settings/account`, {
  299 |       headers: { Authorization: `Bearer ${tutorToken}` },
  300 |       data: {
  301 |         slug,
  302 |         published: true,
  303 |         subjects: ['Математика'],
  304 |         subjectDetails: [{ name: 'Математика', duration: 60, price: 2000 }],
  305 |       },
  306 |     });
  307 | 
  308 |     // Создаём слоты доступности на каждый день недели (30-мин блоки 09:00–12:00)
  309 |     const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
  310 |     for (let day = 0; day < 7; day++) {
  311 |       for (let h = 9; h < 12; h++) {
  312 |         slots.push({ dayOfWeek: day, startTime: `${String(h).padStart(2, '0')}:00`, endTime: `${String(h).padStart(2, '0')}:30` });
  313 |         slots.push({ dayOfWeek: day, startTime: `${String(h).padStart(2, '0')}:30`, endTime: `${String(h + 1).padStart(2, '0')}:00` });
  314 |       }
  315 |     }
  316 |     const slotsRes = await page.request.put(`${API}/availability`, {
  317 |       headers: { Authorization: `Bearer ${tutorToken}` },
  318 |       data: { slots },
  319 |     });
  320 |     // Slots might return 200 or 201
  321 |     if (!slotsRes.ok()) {
  322 |       console.warn('Availability slots setup returned:', slotsRes.status());
```