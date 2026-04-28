import type { Page } from "@playwright/test";
import { test, expect, getAuthToken, loginViaAPI, loginViaUI } from "./helpers/auth";

const AUTH_ROUTE_RE = /\/auth|\/registration|\/login/i;

function splitSelectors(selectorList: string) {
  return selectorList
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function isAnySelectorVisible(page: Page, selectorList: string) {
  const selectors = splitSelectors(selectorList);
  for (const selector of selectors) {
    const visible = await page.locator(selector).first().isVisible().catch(() => false);
    if (visible) return true;
  }
  return false;
}

async function expectAnySelectorVisible(page: Page, selectorList: string, timeoutMs = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isAnySelectorVisible(page, selectorList)) {
      return;
    }
    await page.waitForTimeout(200);
  }

  throw new Error(`No ready selector became visible: ${selectorList}`);
}

function isAuthRoute(url: string) {
  return AUTH_ROUTE_RE.test(url);
}

async function gotoRoute(page: Page, path: string, readySelector?: string, options?: { requireMain?: boolean }) {
  const requireMain = options?.requireMain ?? true;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(300);

    if (!isAuthRoute(page.url())) {
      if (requireMain) {
        await expect(page.locator("main").first()).toBeVisible();
      }
      if (readySelector) {
        await expectAnySelectorVisible(page, readySelector);
      }
      return;
    }

    const loggedInViaApi = await loginViaAPI(page);
    if (!loggedInViaApi) {
      await loginViaUI(page);
    }
  }

  throw new Error(`Route ${path} redirected to auth after re-login attempt.`);
}

async function readTutorSlug(page: Page): Promise<string | null> {
  try {
    const token = await getAuthToken(page);
    const response = await page.request.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok()) return null;
    const me = await response.json();
    return typeof me?.slug === "string" && me.slug.trim().length > 0 ? me.slug.trim() : null;
  } catch {
    return null;
  }
}

test.describe("Complex UI Journeys v3", () => {
  test("core navigation keeps shell and route readiness", async ({ authedPage: page }) => {
    test.setTimeout(180_000);

    const routeChecks: Array<{ path: string; readySelector: string }> = [
      {
        path: "/dashboard",
        readySelector: "text=Главное, a[href='/schedule'], button:has-text('Добавить ученика')",
      },
      {
        path: "/students",
        readySelector: "text=Ученики, .repeto-sl-pill, button:has-text('Создать')",
      },
      {
        path: "/schedule",
        readySelector: "text=Расписание, [role='tab']:has-text('Месяц'), button:has-text('Сегодня')",
      },
      {
        path: "/finance",
        readySelector: "text=Финансы, .repeto-sl-pill, button:has-text('Создать')",
      },
      {
        path: "/payments",
        readySelector: "text=Финансы, text=Оплаты, .repeto-sl-pill, button:has-text('Создать')",
      },
      {
        path: "/packages",
        readySelector: "text=Пакеты, button:has-text('Обычные'), button:has-text('Создать')",
      },
      {
        path: "/files",
        readySelector: "text=Материалы, button:has-text('Синхронизировать диски'), button:has-text('Создать')",
      },
      {
        path: "/notifications",
        readySelector: "text=Уведомления, button:has-text('Непрочитанные'), button:has-text('Расписание')",
      },
      {
        path: "/settings",
        readySelector: "text=Настройки, text=Личные данные, button:has-text('Сохранить')",
      },
      {
        path: "/support",
        readySelector: "text=Поддержка, input[placeholder*='Поиск'], main",
      },
    ];

    for (const route of routeChecks) {
      await gotoRoute(page, route.path, route.readySelector);
      await expect(page).toHaveURL(new RegExp(route.path.replace("/", "\\/")));
    }
  });

  test("schedule: switch calendar modes and open create action", async ({ authedPage: page }) => {
    await gotoRoute(
      page,
      "/schedule",
      "text=Расписание, [role='tab']:has-text('Месяц'), [role='tab']:has-text('Неделя'), [role='tab']:has-text('День')",
    );

    for (const mode of ["Месяц", "Неделя", "День"]) {
      const tab = page.getByRole("tab", { name: new RegExp(`^${mode}$`, "i") }).first();
      if (!(await tab.isVisible().catch(() => false))) continue;
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
    }

    const prevButton = page.getByRole("button", { name: /предыдущий/i }).first();
    if (await prevButton.isVisible().catch(() => false)) {
      await prevButton.click();
    }

    const nextButton = page.getByRole("button", { name: /следующий/i }).first();
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
    }

    const createButton = page.getByRole("button", { name: /создать|новое занятие/i }).first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    const menuVisible = await page.getByRole("menu").first().isVisible().catch(() => false);
    if (menuVisible) {
      const lessonItem = page.getByRole("menuitem", { name: /заняти|урок/i }).first();
      if (await lessonItem.isVisible().catch(() => false)) {
        await lessonItem.click();
      } else {
        await page.keyboard.press("Escape");
      }
    }

    const modalVisible = await page
      .locator("[role='dialog'], [aria-label*='заняти'], [aria-label*='Заняти']")
      .first()
      .isVisible()
      .catch(() => false);
    if (modalVisible) {
      await page.keyboard.press("Escape");
    }
  });

  test("finance stack: payments filters, packages tabs and files sections", async ({ authedPage: page }) => {
    await gotoRoute(page, "/payments", "text=Финансы, .repeto-sl-pill, input[placeholder*='Имя']");

    const studentSearch = page
      .locator("input[placeholder*='Имя'], input[placeholder*='Поиск'], input[placeholder*='ученик']")
      .first();
    if (await studentSearch.isVisible().catch(() => false)) {
      await studentSearch.fill("Сидоров");
      await studentSearch.fill("");
    }

    const paidFilter = page.getByRole("button", { name: /оплачено/i }).first();
    if (await paidFilter.isVisible().catch(() => false)) {
      await paidFilter.click();
    }

    const createButton = page.getByRole("button", { name: /создать|записать оплату|добавить оплату/i }).first();
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await page.keyboard.press("Escape");
    }

    await gotoRoute(page, "/packages", "text=Пакеты, button:has-text('Обычные'), button:has-text('Публичные')");

    for (const label of ["Обычные", "Публичные"]) {
      const tabButton = page.getByRole("button", { name: new RegExp(label, "i") }).first();
      if (await tabButton.isVisible().catch(() => false)) {
        await tabButton.click();
      }
    }

    await gotoRoute(page, "/files", "text=Материалы, button:has-text('Файлы'), button:has-text('Доступы учеников')");

    for (const sectionLabel of ["Файлы", "Доступы учеников"]) {
      const sectionButton = page.getByRole("button", { name: new RegExp(sectionLabel, "i") }).first();
      if (await sectionButton.isVisible().catch(() => false)) {
        await sectionButton.click();
      }
    }
  });

  test("notifications and settings sections remain interactive", async ({ authedPage: page }) => {
    await gotoRoute(page, "/notifications", "text=Уведомления, button:has-text('Все'), button:has-text('Непрочитанные')");

    for (const tabLabel of ["Все", "Непрочитанные", "Оплаты", "Расписание"]) {
      const tabButton = page.getByRole("button", { name: new RegExp(`^${tabLabel}$`, "i") }).first();
      if (await tabButton.isVisible().catch(() => false)) {
        await tabButton.click();
      }
    }

    await gotoRoute(page, "/settings", "text=Настройки, text=Личные данные, button:has-text('Сохранить')");

    for (const sectionLabel of [
      "Личные данные",
      "Публичная страница",
      "Интеграции",
      "Уведомления",
      "Правила занятий",
      "Безопасность",
    ]) {
      const sectionButton = page.getByRole("button", { name: new RegExp(sectionLabel, "i") }).first();
      if (await sectionButton.isVisible().catch(() => false)) {
        await sectionButton.click();
      }
    }

    const saveButton = page.getByRole("button", { name: /сохранить/i }).first();
    if (await saveButton.isVisible().catch(() => false)) {
      await expect(saveButton).toBeVisible();
    } else {
      await expectAnySelectorVisible(page, "text=Личные данные, text=Интеграции, text=Уведомления");
    }
  });

  test("public tutor profile and booking page are reachable", async ({ authedPage: page }) => {
    const slug = await readTutorSlug(page);
    test.skip(!slug, "Current tutor account has no slug configured.");

    await gotoRoute(page, `/t/${slug}`, ".repeto-tp-page, text=Записаться, text=Записаться на занятие", { requireMain: false });

    const bookingLink = page.locator(`a[href='/t/${slug}/book']:visible`).first();
    if (await bookingLink.count()) {
      await bookingLink.click();
    } else {
      await gotoRoute(page, `/t/${slug}/book`, undefined, { requireMain: false });
    }

    await expect(page).toHaveURL(new RegExp(`\\/t\\/${slug}\\/book`));

    const bookingState = page
      .locator(".repeto-bk-step, .repeto-bk-loading, .repeto-bk-options, .repeto-bk-option")
      .first();

    if (await bookingState.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(bookingState).toBeVisible();
      return;
    }

    const fallbackState = page
      .getByText(/не удалось загрузить страницу записи|нет доступных (слотов|пакетов)|запись недоступна/i)
      .first();

    await expect(fallbackState).toBeVisible({ timeout: 10_000 });
  });
});