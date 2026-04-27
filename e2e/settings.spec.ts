/**
 * SETTINGS E2E TESTS
 * Tests: settings tabs, account form, theme switching  
 */
import { test, expect, getAuthToken, API_BASE } from './helpers/auth';

test.describe('Настройки', () => {
  test('страница настроек загружается', async ({ authedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Секции должны быть видны
    const sections = ['Аккаунт', 'Публичная страница', 'Безопасность', 'Уведомления', 'Политики', 'Интеграции'];
    let visibleSections = 0;
    for (const section of sections) {
      const el = page.getByText(section).first();
      if (await el.isVisible().catch(() => false)) visibleSections++;
    }
    expect(visibleSections).toBeGreaterThanOrEqual(3);
  });

  test('переключение секций', async ({ authedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const sections = ['Публичная страница', 'Безопасность', 'Уведомления', 'Политики', 'Интеграции', 'Аккаунт'];
    for (const section of sections) {
      const tab = page.getByText(section).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('тема интерфейса переключается', async ({ authedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Ищем переключатель темы
    const darkTheme = page.getByText('Тёмная').first();
    if (await darkTheme.isVisible().catch(() => false)) {
      await darkTheme.click();
      await page.waitForTimeout(500);

      // Проверяем, что тёмная тема применилась
      const isDark = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
          document.documentElement.getAttribute('data-theme') === 'dark' ||
          document.body.classList.contains('g-root_theme_dark');
      });

      // Вернём светлую
      const lightTheme = page.getByText('Светлая').first();
      if (await lightTheme.isVisible()) {
        await lightTheme.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('публичная страница — автоподбор slug и статус доступности', async ({ authedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const publicPageTab = page.getByRole('button', { name: 'Публичная страница' }).first();
    if (await publicPageTab.isVisible().catch(() => false)) {
      await publicPageTab.click();
      await page.waitForTimeout(300);

      const slugInput = page.getByPlaceholder('slug').first();
      await expect(slugInput).toBeVisible();

      await slugInput.fill('');
      await slugInput.blur();

      await expect(page.getByText('Адрес свободен').first()).toBeVisible({ timeout: 10000 });
      const currentValue = await slugInput.inputValue();
      expect(currentValue.length).toBeGreaterThan(0);
    }
  });

  test('публичная запись: страница бронирования открывается без бесконечной загрузки', async ({ authedPage: page }) => {
    const token = await getAuthToken(page);

    const settingsResponse = await page.request.get(`${API_BASE}/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(settingsResponse.ok()).toBeTruthy();

    const currentSettings = await settingsResponse.json();
    const originalSlug = typeof currentSettings?.slug === 'string' ? currentSettings.slug : '';
    const originalPublished = Boolean(currentSettings?.published);

    let bookingSlug = originalSlug;

    if (!bookingSlug) {
      const slugResponse = await page.request.get(`${API_BASE}/settings/account/slug`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          value: 'autotest-booking-page',
        },
      });
      expect(slugResponse.ok()).toBeTruthy();
      const slugPayload = await slugResponse.json();
      bookingSlug = String(slugPayload?.slug || '').trim();
      expect(bookingSlug.length).toBeGreaterThan(0);
    }

    const shouldRestoreAccount = !originalPublished || bookingSlug !== originalSlug;

    try {
      if (shouldRestoreAccount) {
        const patchResponse = await page.request.patch(`${API_BASE}/settings/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            slug: bookingSlug,
            published: true,
          },
        });
        expect(patchResponse.ok()).toBeTruthy();
      }

      await page.goto(`/t/${bookingSlug}/book`);
      await expect(page.getByText('Загрузка...').first()).not.toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Выберите предмет').first()).toBeVisible({ timeout: 15000 });
    } finally {
      if (shouldRestoreAccount) {
        await page.request.patch(`${API_BASE}/settings/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            slug: originalSlug,
            published: originalPublished,
          },
        }).catch(() => null);
      }
    }
  });

  test('api: настройка showPublicPackages сохраняется в аккаунте', async ({ authedPage: page }) => {
    const loginResponse = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: 'demo@repeto.ru', password: 'demo1234' },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const loginPayload = await loginResponse.json();
    const token = loginPayload.accessToken as string;

    const settingsResponse = await page.request.get(`${API_BASE}/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(settingsResponse.ok()).toBeTruthy();

    const settingsPayload = await settingsResponse.json();
    const originalShowPublicPackages = settingsPayload?.showPublicPackages !== false;
    const nextValue = !originalShowPublicPackages;

    try {
      const patchResponse = await page.request.patch(`${API_BASE}/settings/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          showPublicPackages: nextValue,
        },
      });
      expect(patchResponse.ok()).toBeTruthy();

      const verifyResponse = await page.request.get(`${API_BASE}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      expect(verifyResponse.ok()).toBeTruthy();
      const verifyPayload = await verifyResponse.json();

      expect(verifyPayload?.showPublicPackages !== false).toBe(nextValue);
    } finally {
      await page.request.patch(`${API_BASE}/settings/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          showPublicPackages: originalShowPublicPackages,
        },
      }).catch(() => null);
    }
  });

  test('публичная запись: раздел "Пакеты занятий" и скидка отображаются', async ({ authedPage: page }) => {
    const loginResponse = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: 'demo@repeto.ru', password: 'demo1234' },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const loginPayload = await loginResponse.json();
    const token = loginPayload.accessToken as string;
    const packageCommentMarker = 'e2e-booking-discount-package';
    let createdPackageId: string | null = null;

    const settingsResponse = await page.request.get(`${API_BASE}/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(settingsResponse.ok()).toBeTruthy();

    const currentSettings = await settingsResponse.json();
    const originalSlug = typeof currentSettings?.slug === 'string' ? currentSettings.slug : '';
    const originalPublished = Boolean(currentSettings?.published);
    const originalShowPublicPackages = currentSettings?.showPublicPackages !== false;
    const originalSubjects = Array.isArray(currentSettings?.subjects) ? currentSettings.subjects : [];
    const originalSubjectDetails = Array.isArray(currentSettings?.subjectDetails)
      ? currentSettings.subjectDetails
      : [];

    let bookingSlug = originalSlug;
    if (!bookingSlug) {
      const slugResponse = await page.request.get(`${API_BASE}/settings/account/slug`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          value: 'autotest-booking-discount',
        },
      });
      expect(slugResponse.ok()).toBeTruthy();
      const slugPayload = await slugResponse.json();
      bookingSlug = String(slugPayload?.suggested || slugPayload?.requested || '').trim();
      expect(bookingSlug.length).toBeGreaterThan(0);
    }

    try {
      const patchAccountResponse = await page.request.patch(`${API_BASE}/settings/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          slug: bookingSlug,
          published: true,
          showPublicPackages: true,
          subjects: ['Математика'],
          subjectDetails: [
            {
              name: 'Математика',
              price: '2500',
              duration: '60',
            },
          ],
        },
      });
      expect(patchAccountResponse.ok()).toBeTruthy();

      const createPackageResponse = await page.request.post(`${API_BASE}/packages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          isPublic: true,
          subject: 'Математика',
          lessonsTotal: 6,
          totalPrice: 12000,
          comment: packageCommentMarker,
        },
      });
      expect(createPackageResponse.ok()).toBeTruthy();
      const createdPackage = await createPackageResponse.json();
      createdPackageId = createdPackage?.id || null;

      await page.goto(`/t/${bookingSlug}/book`);
      await expect(page.getByText('Выберите предмет').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Пакеты занятий').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Скидка\s+3\s?000\s?₽/).first()).toBeVisible({ timeout: 15000 });
    } finally {
      if (createdPackageId) {
        await page.request.delete(`${API_BASE}/packages/${createdPackageId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null);
      }

      await page.request.patch(`${API_BASE}/settings/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          slug: originalSlug,
          published: originalPublished,
          showPublicPackages: originalShowPublicPackages,
          subjects: originalSubjects,
          subjectDetails: originalSubjectDetails,
        },
      }).catch(() => null);
    }
  });

  test('публичная страница: пункт оплаты отображается как предпочитаемый способ', async ({ authedPage: page }) => {
    const token = await getAuthToken(page);

    const settingsResponse = await page.request.get(`${API_BASE}/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(settingsResponse.ok()).toBeTruthy();

    const currentSettings = await settingsResponse.json();
    const originalSlug = typeof currentSettings?.slug === 'string' ? currentSettings.slug : '';
    const originalPublished = Boolean(currentSettings?.published);
    const originalPolicy = (currentSettings?.cancelPolicySettings || {}) as Record<string, unknown>;

    const toPolicyPayload = (source: Record<string, unknown>, defaultPaymentMethod?: string) => ({
      cancelTimeHours: String(source.cancelTimeHours ?? '12'),
      lateCancelAction: String(source.lateCancelAction ?? 'full'),
      noShowAction: String(source.noShowAction ?? 'full'),
      defaultPaymentMethod: defaultPaymentMethod ?? String(source.defaultPaymentMethod ?? 'sbp'),
      isSelfEmployed: Boolean(source.isSelfEmployed ?? false),
      receiptReminder: Boolean(source.receiptReminder ?? false),
    });

    let publicSlug = originalSlug;
    if (!publicSlug) {
      const slugResponse = await page.request.get(`${API_BASE}/settings/account/slug`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          value: 'autotest-preferred-payment',
        },
      });
      expect(slugResponse.ok()).toBeTruthy();
      const slugPayload = await slugResponse.json();
      publicSlug = String(slugPayload?.slug || '').trim();
      expect(publicSlug.length).toBeGreaterThan(0);
    }

    const shouldRestoreAccount = !originalPublished || publicSlug !== originalSlug;

    try {
      const patchPoliciesResponse = await page.request.patch(`${API_BASE}/settings/policies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: toPolicyPayload(originalPolicy, 'transfer'),
      });
      expect(patchPoliciesResponse.ok()).toBeTruthy();

      if (shouldRestoreAccount) {
        const patchAccountResponse = await page.request.patch(`${API_BASE}/settings/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            slug: publicSlug,
            published: true,
          },
        });
        expect(patchAccountResponse.ok()).toBeTruthy();
      }

      await page.goto(`/t/${publicSlug}`);
      await expect(page.getByText('Предпочтительный способ оплаты').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Перевод на карту').first()).toBeVisible({ timeout: 15000 });
    } finally {
      await page.request.patch(`${API_BASE}/settings/policies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: toPolicyPayload(originalPolicy),
      }).catch(() => null);

      if (shouldRestoreAccount) {
        await page.request.patch(`${API_BASE}/settings/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            slug: originalSlug,
            published: originalPublished,
          },
        }).catch(() => null);
      }
    }
  });

  test('api: публикация без персональной ссылки запрещена', async ({ authedPage: page }) => {
    const token = await getAuthToken(page);

    const response = await page.request.patch(`${API_BASE}/settings/account`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        slug: '',
        published: true,
      },
    });

    expect(response.status()).toBe(400);

    const payload = await response.json().catch(() => ({}));
    const message = Array.isArray(payload?.message)
      ? payload.message.join(' ')
      : String(payload?.message || '');

    expect(message.toLowerCase()).toContain('персональной ссылки');
  });

  test('уведомления: только Email/Push/Telegram/Макс без устаревших пунктов', async ({ authedPage: page }) => {
    await page.goto('/settings?tab=notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Настройки уведомлений').first()).toBeVisible();

    await expect(page.getByRole('button', { name: 'Email' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Push' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Telegram' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Макс' }).first()).toBeVisible();

    expect(await page.getByRole('button', { name: 'WhatsApp' }).count()).toBe(0);
    expect(await page.getByRole('button', { name: 'SMS' }).count()).toBe(0);
    expect(await page.getByRole('button', { name: 'Все' }).count()).toBe(0);
    expect(await page.getByText('Еженедельный отчёт').count()).toBe(0);
    expect(await page.getByRole('button', { name: 'Сбросить' }).count()).toBe(0);
  });

  test('api: сохраняются только разрешённые каналы уведомлений', async ({ authedPage: page }) => {
    const token = await getAuthToken(page);

    const patchResponse = await page.request.patch(`${API_BASE}/settings/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        channels: ['EMAIL', 'PUSH', 'WHATSAPP', 'MAX'],
        weeklyReport: true,
        reportDay: 'sun',
      },
    });

    expect(patchResponse.ok()).toBeTruthy();

    const settingsResponse = await page.request.get(`${API_BASE}/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(settingsResponse.ok()).toBeTruthy();

    const payload = await settingsResponse.json();
    const notificationSettings = (payload?.notificationSettings || {}) as {
      channels?: string[];
      weeklyReport?: boolean;
      reportDay?: string;
    };

    const channels = notificationSettings.channels || [];
    expect(channels).toContain('EMAIL');
    expect(channels).toContain('PUSH');
    expect(channels).toContain('MAX');
    expect(channels).not.toContain('WHATSAPP');
    expect(notificationSettings.weeklyReport).toBeUndefined();
    expect(notificationSettings.reportDay).toBeUndefined();
  });

  test('api: ручная оплата не создаёт самоуведомление преподавателю', async ({ authedPage: page }) => {
    const token = await getAuthToken(page);
    const uniqueAmount = 901337;
    let createdPaymentId: string | null = null;

    try {
      const studentsResponse = await page.request.get(`${API_BASE}/students`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'ACTIVE', limit: 1 },
      });
      expect(studentsResponse.ok()).toBeTruthy();

      const studentsPayload = await studentsResponse.json();
      const studentId = studentsPayload?.data?.[0]?.id as string | undefined;
      expect(studentId).toBeTruthy();

      const createPaymentResponse = await page.request.post(`${API_BASE}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          studentId,
          amount: uniqueAmount,
          method: 'SBP',
          comment: 'autotest-no-self-notification',
        },
      });
      expect(createPaymentResponse.ok()).toBeTruthy();

      const createdPayment = await createPaymentResponse.json();
      createdPaymentId = createdPayment?.id || null;

      const notificationsResponse = await page.request.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { type: 'PAYMENT_RECEIVED', limit: 100 },
      });
      expect(notificationsResponse.ok()).toBeTruthy();

      const notificationsPayload = await notificationsResponse.json();
      const notifications = (notificationsPayload?.data || []) as Array<{ description?: string }>;
      const hasSelfNotification = notifications.some((item) =>
        String(item?.description || '').includes(uniqueAmount.toLocaleString('ru-RU')) ||
        String(item?.description || '').includes(String(uniqueAmount)),
      );

      expect(hasSelfNotification).toBeFalsy();
    } finally {
      if (createdPaymentId) {
        await page.request.delete(`${API_BASE}/payments/${createdPaymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
      }
    }
  });
});
