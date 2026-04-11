# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journeys.spec.ts >> Journey 5: Пакет уроков — полный жизненный цикл >> 5.4 Карточка ученика → вкладка «Занятия» → видны проведённые уроки
- Location: e2e\journeys.spec.ts:661:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Паша Пакетов')
Expected: visible
Error: strict mode violation: getByText('Паша Пакетов') resolved to 2 elements:
    1) <span class="g-text g-text_variant_header-1">Паша Пакетов</span> aka locator('header').getByText('Паша Пакетов')
    2) <div class="g-text g-text_variant_subheader-2">Паша Пакетов</div> aka getByText('Паша Пакетов').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Паша Пакетов')

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
        - button "ТП Тест Пакеты" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: ТП
          - generic [ref=e71]: Тест Пакеты
      - button "Свернуть меню" [ref=e72] [cursor=pointer]
    - main [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - button [ref=e83] [cursor=pointer]:
            - img [ref=e86]:
              - img [ref=e87]
          - generic [ref=e89]: Паша Пакетов
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
            - generic [ref=e115]: ПП
            - generic [ref=e116]: Паша Пакетов
            - generic [ref=e117]: Информатика
            - generic [ref=e118]:
              - generic [ref=e121]: Активен
              - generic [ref=e122]: "-4 500 ₽"
            - generic [ref=e123]:
              - button "Написать" [ref=e124] [cursor=pointer]:
                - img [ref=e127]:
                  - img [ref=e128]
                - generic [ref=e130]: Написать
              - button "Портал" [ref=e131] [cursor=pointer]:
                - img [ref=e134]:
                  - img [ref=e135]
                - generic [ref=e137]: Портал
              - button "Напомнить" [ref=e138] [cursor=pointer]:
                - img [ref=e141]:
                  - img [ref=e142]
                - generic [ref=e144]: Напомнить
          - navigation [ref=e145]:
            - button "Занятия" [ref=e146] [cursor=pointer]:
              - img [ref=e147]:
                - img [ref=e148]
              - text: Занятия
            - button "Профиль" [ref=e150] [cursor=pointer]:
              - img [ref=e151]:
                - img [ref=e152]
              - text: Профиль
            - button "Контакты" [ref=e154] [cursor=pointer]:
              - img [ref=e155]:
                - img [ref=e156]
              - text: Контакты
            - button "Оплаты" [ref=e158] [cursor=pointer]:
              - img [ref=e159]:
                - img [ref=e160]
              - text: Оплаты
            - button "Заметки" [ref=e162] [cursor=pointer]:
              - img [ref=e163]:
                - img [ref=e164]
              - text: Заметки
            - button "Домашка" [ref=e166] [cursor=pointer]:
              - img [ref=e167]:
                - img [ref=e168]
              - text: Домашка
        - generic [ref=e171]:
          - generic [ref=e172]:
            - generic [ref=e173]: Занятия
            - button "Назначить" [ref=e174] [cursor=pointer]:
              - img [ref=e177]:
                - img [ref=e178]
              - generic [ref=e180]: Назначить
          - generic [ref=e181]:
            - button "Дата 10.04.2026 Время 16:00 – 17:00 Предмет Информатика Ставка 1 500 ₽ Проведено" [ref=e182] [cursor=pointer]:
              - generic [ref=e183]:
                - generic [ref=e184]:
                  - generic [ref=e185]: Дата
                  - text: 10.04.2026
                - generic [ref=e186]:
                  - generic [ref=e187]: Время
                  - generic [ref=e188]: 16:00 – 17:00
                - generic [ref=e189]:
                  - generic [ref=e190]: Предмет
                  - text: Информатика
                - generic [ref=e191]:
                  - generic [ref=e192]: Ставка
                  - generic [ref=e193]: 1 500 ₽
                - generic [ref=e194]:
                  - generic [ref=e197]: Проведено
                  - img [ref=e198]:
                    - img [ref=e199]
            - button "Дата 09.04.2026 Время 15:00 – 16:00 Предмет Информатика Ставка 1 500 ₽ Проведено" [ref=e201] [cursor=pointer]:
              - generic [ref=e202]:
                - generic [ref=e203]:
                  - generic [ref=e204]: Дата
                  - text: 09.04.2026
                - generic [ref=e205]:
                  - generic [ref=e206]: Время
                  - generic [ref=e207]: 15:00 – 16:00
                - generic [ref=e208]:
                  - generic [ref=e209]: Предмет
                  - text: Информатика
                - generic [ref=e210]:
                  - generic [ref=e211]: Ставка
                  - generic [ref=e212]: 1 500 ₽
                - generic [ref=e213]:
                  - generic [ref=e216]: Проведено
                  - img [ref=e217]:
                    - img [ref=e218]
            - button "Дата 08.04.2026 Время 14:00 – 15:00 Предмет Информатика Ставка 1 500 ₽ Проведено" [ref=e220] [cursor=pointer]:
              - generic [ref=e221]:
                - generic [ref=e222]:
                  - generic [ref=e223]: Дата
                  - text: 08.04.2026
                - generic [ref=e224]:
                  - generic [ref=e225]: Время
                  - generic [ref=e226]: 14:00 – 15:00
                - generic [ref=e227]:
                  - generic [ref=e228]: Предмет
                  - text: Информатика
                - generic [ref=e229]:
                  - generic [ref=e230]: Ставка
                  - generic [ref=e231]: 1 500 ₽
                - generic [ref=e232]:
                  - generic [ref=e235]: Проведено
                  - img [ref=e236]:
                    - img [ref=e237]
  - alert [ref=e239]: /students/38bcd1a4-d260-40b3-b880-4a8c9888e859
```

# Test source

```ts
  565 | // ═══════════════════════════════════════════════════════════════
  566 | test.describe('Journey 5: Пакет уроков — полный жизненный цикл', () => {
  567 |   test.describe.configure({ mode: 'serial' });
  568 | 
  569 |   let email: string;
  570 |   let token: string;
  571 |   const password = 'Journey5Pass!';
  572 |   let studentId: string;
  573 |   let page: Page;
  574 | 
  575 |   test.beforeAll(async ({ browser }) => {
  576 |     page = await browser.newPage();
  577 |     email = uniqueEmail();
  578 |     const auth = await registerViaAPI(page, { email, password, name: 'Тест Пакеты' });
  579 |     token = auth.accessToken;
  580 | 
  581 |     const student = await createStudentAPI(page, token, {
  582 |       name: 'Паша Пакетов',
  583 |       rate: 1500,
  584 |       subject: 'Информатика',
  585 |     });
  586 |     studentId = student.id;
  587 |   });
  588 | 
  589 |   test.afterAll(async () => {
  590 |     await page.close();
  591 |   });
  592 | 
  593 |   test('5.1 Создаём пакет из 10 уроков через UI', async () => {
  594 |     await loginAndGoto(page, '/finance/packages', email, password);
  595 | 
  596 |     // Кнопка создания пакета
  597 |     const newPkgBtn = page.getByRole('button', { name: /Новый пакет/i }).first();
  598 |     await newPkgBtn.click();
  599 |     await page.waitForTimeout(500);
  600 | 
  601 |     // Модалка создания пакета
  602 |     await expect(page.locator('body')).toContainText(/Новый пакет|Создать пакет/i, {
  603 |       timeout: 3_000,
  604 |     });
  605 | 
  606 |     // Если не получилось через UI — создаём пакет через API
  607 |     const validUntil = new Date();
  608 |     validUntil.setMonth(validUntil.getMonth() + 2);
  609 | 
  610 |     const pkgRes = await page.request.post(`${API}/packages`, {
  611 |       headers: { Authorization: `Bearer ${token}` },
  612 |       data: {
  613 |         studentId,
  614 |         subject: 'Информатика',
  615 |         lessonsTotal: 10,
  616 |         totalPrice: 15000,
  617 |         validUntil: validUntil.toISOString(),
  618 |       },
  619 |     });
  620 |     expect(pkgRes.ok()).toBe(true);
  621 |     await page.reload();
  622 |     await page.waitForTimeout(1_500);
  623 |   });
  624 | 
  625 |   test('5.2 Пакет виден на странице пакетов', async () => {
  626 |     await page.goto('/finance/packages');
  627 |     await page.waitForTimeout(1_500);
  628 | 
  629 |     await expect(page.locator('body')).toContainText(/Паша|Информатика|10/i, { timeout: 5_000 });
  630 |   });
  631 | 
  632 |   test('5.3 Проводим 3 урока → прогресс пакета обновляется', async () => {
  633 |     // Создаём и завершаем 3 урока через API
  634 |     for (let i = 0; i < 3; i++) {
  635 |       const date = new Date();
  636 |       date.setDate(date.getDate() - (3 - i)); // в прошлом
  637 |       date.setHours(14 + i, 0, 0, 0);
  638 | 
  639 |       const lesson = await createLessonAPI(page, token, studentId, {
  640 |         subject: 'Информатика',
  641 |         scheduledAt: date.toISOString(),
  642 |         rate: 1500,
  643 |       });
  644 | 
  645 |       await page.request.patch(`${API}/lessons/${lesson.id}/status`, {
  646 |         headers: { Authorization: `Bearer ${token}` },
  647 |         data: { status: 'COMPLETED' },
  648 |       });
  649 |     }
  650 | 
  651 |     // Обновляем страницу пакетов
  652 |     await page.goto('/finance/packages');
  653 |     await page.waitForTimeout(2_000);
  654 | 
  655 |     // Должны видеть прогресс (3/10 или 30%)
  656 |     const body = await page.locator('body').textContent() || '';
  657 |     // Пакет всё ещё виден
  658 |     expect(body).toMatch(/Паша|Информатика/i);
  659 |   });
  660 | 
  661 |   test('5.4 Карточка ученика → вкладка «Занятия» → видны проведённые уроки', async () => {
  662 |     await page.goto(`/students/${studentId}`);
  663 |     await page.waitForTimeout(2_000);
  664 | 
> 665 |     await expect(page.getByText('Паша Пакетов')).toBeVisible({ timeout: 5_000 });
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  666 | 
  667 |     // Вкладка «Занятия»
  668 |     const lessonsTab = page.getByRole('button', { name: /Занятия/i }).first();
  669 |     if (await lessonsTab.isVisible().catch(() => false)) {
  670 |       await lessonsTab.click();
  671 |       await page.waitForTimeout(1_000);
  672 |     }
  673 | 
  674 |     // Должны быть видны проведённые уроки
  675 |     await expect(page.locator('body')).toContainText(/Информатика/i, { timeout: 5_000 });
  676 |   });
  677 | });
  678 | 
  679 | // ═══════════════════════════════════════════════════════════════
  680 | // Journey 6: Настройки → безопасность → смена пароля → перелогин
  681 | // ═══════════════════════════════════════════════════════════════
  682 | test.describe('Journey 6: Смена пароля и политик → всё продолжает работать', () => {
  683 |   test.describe.configure({ mode: 'serial' });
  684 | 
  685 |   let email: string;
  686 |   const oldPassword = 'Journey6Pass!';
  687 |   const newPassword = 'NewJourney6Pass!';
  688 |   let token: string;
  689 |   let page: Page;
  690 | 
  691 |   test.beforeAll(async ({ browser }) => {
  692 |     page = await browser.newPage();
  693 |     email = uniqueEmail();
  694 |     const auth = await registerViaAPI(page, { email, password: oldPassword, name: 'Тест Безопасность' });
  695 |     token = auth.accessToken;
  696 |   });
  697 | 
  698 |   test.afterAll(async () => {
  699 |     await page.close();
  700 |   });
  701 | 
  702 |   test('6.1 Настройки → вкладка «Безопасность» → смена пароля', async () => {
  703 |     await loginAndGoto(page, '/settings', email, oldPassword);
  704 | 
  705 |     // Переключаемся на вкладку безопасности
  706 |     const secTab = page.getByRole('button', { name: /Безопасность/i }).first();
  707 |     if (await secTab.isVisible().catch(() => false)) {
  708 |       await secTab.click();
  709 |       await page.waitForTimeout(500);
  710 |     }
  711 | 
  712 |     // Меняем пароль через API (UI может отличаться)
  713 |     const changeRes = await page.request.post(`${API}/settings/change-password`, {
  714 |       headers: { Authorization: `Bearer ${token}` },
  715 |       data: { currentPassword: oldPassword, newPassword },
  716 |     });
  717 |     expect(changeRes.ok()).toBe(true);
  718 |   });
  719 | 
  720 |   test('6.2 Старый пароль больше не работает', async () => {
  721 |     // Выходим
  722 |     await page.goto('/registration');
  723 | 
  724 |     // Пробуем войти со старым паролем
  725 |     await page.getByPlaceholder('Введите email или телефон').fill(email);
  726 |     await page.getByPlaceholder('Введите пароль').fill(oldPassword);
  727 |     await page.getByRole('button', { name: 'Войти' }).click();
  728 | 
  729 |     // Ждём ошибку входа
  730 |     await page.waitForTimeout(3_000);
  731 |     // Не должны попасть на дашборд
  732 |     expect(page.url()).toContain('/registration');
  733 |   });
  734 | 
  735 |   test('6.3 Новый пароль работает → дашборд доступен', async () => {
  736 |     await page.goto('/registration');
  737 |     await page.getByPlaceholder('Введите email или телефон').fill(email);
  738 |     await page.getByPlaceholder('Введите пароль').fill(newPassword);
  739 |     await page.getByRole('button', { name: 'Войти' }).click();
  740 | 
  741 |     await page.waitForURL('**/dashboard', { timeout: 10_000 });
  742 |     await expect(page).toHaveURL(/\/dashboard/);
  743 |   });
  744 | 
  745 |   test('6.4 Настройки → политики → изменяем время отмены', async () => {
  746 |     await page.getByRole('link', { name: /Настройки/i }).click();
  747 |     await expect(page).toHaveURL(/\/settings/);
  748 | 
  749 |     // Вкладка «Политики»
  750 |     const polTab = page.getByRole('button', { name: /Политик/i }).first();
  751 |     if (await polTab.isVisible().catch(() => false)) {
  752 |       await polTab.click();
  753 |       await page.waitForTimeout(500);
  754 |     }
  755 | 
  756 |     // Обновляем политики через API
  757 |     const polRes = await page.request.patch(`${API}/settings/policies`, {
  758 |       headers: { Authorization: `Bearer ${token}` },
  759 |       data: { cancelTimeHours: 12, lateCancelAction: 'CHARGE_FULL', noShowAction: 'CHARGE_FULL' },
  760 |     });
  761 |     // Токен мог протухнуть после смены пароля — перелогинимся
  762 |     if (!polRes.ok()) {
  763 |       const loginRes = await loginViaAPI(page, email, newPassword);
  764 |       token = loginRes.accessToken;
  765 | 
```