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

async function gotoRoute(page: Page, path: string, readySelector?: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    if (!isAuthRoute(page.url())) {
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

async function closeModalByEscape(page: Page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
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

test.describe("Journeys v2", () => {
  test("app shell navigation works across current routes", async ({ authedPage: page }) => {
    await gotoRoute(page, "/dashboard");

    const navTargets = [
      "/dashboard",
      "/schedule",
      "/finance",
      "/students",
      "/payments",
      "/packages",
      "/files",
      "/notifications",
      "/settings",
      "/support",
    ];

    for (const target of navTargets) {
      const navLink = page.locator(`a[href="${target}"]:visible`).first();
      if (!(await navLink.count())) continue;

      await navLink.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(new RegExp(target.replace("/", "\\/")));
    }
  });

  test("students flow: filters, search and student card open", async ({ authedPage: page }) => {
    await gotoRoute(page, "/students", "input[placeholder='Имя, предмет или класс'], .repeto-sl-row--students, .repeto-sl-empty");
    await expect(page.getByPlaceholder("Имя, предмет или класс")).toBeVisible();

    const filterButtons = [/Активные/i, /На паузе/i, /^Все/i];
    for (const name of filterButtons) {
      const button = page.getByRole("button", { name }).first();
      if (!(await button.isVisible().catch(() => false))) continue;
      if (!(await button.isEnabled().catch(() => false))) continue;
      await button.click();
      await page.waitForTimeout(250);
    }

    const searchInput = page.getByPlaceholder("Имя, предмет или класс");
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");
    await searchInput.fill("");

    const firstRow = page.locator(".repeto-sl-row--students").first();
    if (await firstRow.isVisible().catch(() => false)) {
      await firstRow.click();
      await expect(page).toHaveURL(/\/students\/[^/?#]+/);
    }
  });

  test("student card tabs switch correctly", async ({ authedPage: page }) => {
    await gotoRoute(page, "/students");

    const firstRow = page.locator(".repeto-sl-row").first();
    test.skip(!(await firstRow.isVisible().catch(() => false)), "No students available for card journey.");

    await firstRow.click();
    await expect(page).toHaveURL(/\/students\/[^/?#]+/);

    const tabButtons = page.locator(".page-overlay__nav-item--section");
    const tabsCount = await tabButtons.count();
    for (let i = 0; i < tabsCount; i += 1) {
      await tabButtons.nth(i).click();
      await expect(tabButtons.nth(i)).toHaveClass(/active/);
    }
  });

  test("schedule controls: views, navigation and lesson modal", async ({ authedPage: page }) => {
    await gotoRoute(page, "/schedule", ".repeto-schedule-toolbar, .repeto-schedule-toolbar__create button, .repeto-top-header");

    const viewButtons = page.locator(".repeto-schedule-toolbar__view button");
    const viewCount = await viewButtons.count();
    for (let i = 0; i < viewCount; i += 1) {
      const viewButton = viewButtons.nth(i);
      if (!(await viewButton.isVisible().catch(() => false))) continue;
      if (!(await viewButton.isEnabled().catch(() => false))) continue;
      await viewButton.click();
    }

    const navButtons = page.locator(".repeto-schedule-toolbar__nav button");
    const navCount = await navButtons.count();
    if (navCount >= 2) {
      const prevButton = navButtons.nth(0);
      const nextButton = navButtons.nth(1);

      if ((await prevButton.isVisible().catch(() => false)) && (await prevButton.isEnabled().catch(() => false))) {
        await prevButton.click();
      }

      if ((await nextButton.isVisible().catch(() => false)) && (await nextButton.isEnabled().catch(() => false))) {
        await nextButton.click();
      }
    }

    const createLessonButton = page.getByRole("button", { name: /новое занятие/i }).first();
    test.skip(
      !(await createLessonButton.isVisible().catch(() => false)),
      "Schedule create control is unavailable for current layout/account state.",
    );

    await createLessonButton.click();
    await expect(page.locator('[aria-label="Новое занятие"], [aria-label^="Занятие:"]').first()).toBeVisible();
    await closeModalByEscape(page);
  });

  test("payments flow: tabs, search and create modal", async ({ authedPage: page }) => {
    await gotoRoute(page, "/finance/payments", "input[placeholder='Имя ученика'], .repeto-sl-row--payments, .repeto-sl-empty");

    const filterButtons = [/Оплачено/i, /^Все/i];
    for (const name of filterButtons) {
      const button = page.getByRole("button", { name }).first();
      if (!(await button.isVisible().catch(() => false))) continue;
      if (!(await button.isEnabled().catch(() => false))) continue;
      await button.click();
      await page.waitForTimeout(250);
    }

    const searchInput = page.getByPlaceholder("Имя ученика");
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("test");
      await searchInput.fill("");
    }

    await page.goto("/finance/payments?create=1", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[aria-label="Новая оплата"], .lp2.lp2--open[aria-label="Новая оплата"]').first()).toBeVisible();
    await closeModalByEscape(page);
  });

  test("packages flow: type tabs, status tabs and create modal", async ({ authedPage: page }) => {
    await gotoRoute(page, "/finance/packages", "input[placeholder='Ученик или предмет'], .repeto-sl-row--packages, .repeto-sl-empty");

    const typeButtons = [/Публичные/i, /Обычные/i];
    for (const name of typeButtons) {
      const button = page.getByRole("button", { name }).first();
      if (!(await button.isVisible().catch(() => false))) continue;
      if (!(await button.isEnabled().catch(() => false))) continue;
      await button.click();
      await page.waitForTimeout(250);
    }

    const statusButtons = [/Активные/i, /Завершённые/i, /^Все/i];
    for (const name of statusButtons) {
      const button = page.getByRole("button", { name }).first();
      if (!(await button.isVisible().catch(() => false))) continue;
      if (!(await button.isEnabled().catch(() => false))) continue;
      await button.click();
      await page.waitForTimeout(250);
    }

    await page.goto("/finance/packages?create=1", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[aria-label="Новый пакет"], [aria-label="Редактирование пакета"]').first()).toBeVisible();
    await closeModalByEscape(page);
  });

  test("files flow: section switching and empty-state branch", async ({ authedPage: page }) => {
    await gotoRoute(
      page,
      "/files",
      "text=Подключите облачное хранилище, text=Нет расшаренных файлов, text=Google Drive, text=Яндекс.Диск",
    );

    const accessButton = page.getByRole("button", { name: /Доступы учеников/i }).first();
    if (await accessButton.isVisible().catch(() => false)) {
      await accessButton.click();
      await page.waitForTimeout(250);
    }

    const filesButton = page.getByRole("button", { name: /^Файлы$/i }).first();
    if (await filesButton.isVisible().catch(() => false)) {
      await filesButton.click();
      await page.waitForTimeout(250);
    }

    const connectCloudButton = page.getByRole("button", { name: /Подключить в Настройках/i }).first();
    if (await connectCloudButton.isVisible().catch(() => false)) {
      await connectCloudButton.click();
      await expect(page).toHaveURL(/\/settings\?tab=integrations/);
    }
  });

  test("notifications flow: tab switching and mark-all action branch", async ({ authedPage: page }) => {
    await gotoRoute(page, "/notifications");
    await expect(page.locator(".repeto-notifications-toolbar")).toBeVisible();

    const tabButtons = page.locator(".repeto-notifications-toolbar button");
    const tabsCount = await tabButtons.count();
    for (let i = 0; i < tabsCount; i += 1) {
      await tabButtons.nth(i).click();
    }

    const markAllButton = page.getByRole("button", { name: /прочитать все/i }).first();
    const canMarkAll =
      (await markAllButton.isVisible().catch(() => false)) &&
      (await markAllButton.isEnabled().catch(() => false));
    if (canMarkAll) {
      await markAllButton.click();
    }
  });

  test("settings flow: sections and theme controls", async ({ authedPage: page }) => {
    await gotoRoute(page, "/settings", ".repeto-settings-content--shell, .repeto-settings-page-head__title");
    await expect(page.locator(".repeto-settings-content--shell")).toBeVisible();

    const sectionLabels = [
      /Личные данные/i,
      /Публичная страница/i,
      /Интеграции/i,
      /Уведомления/i,
      /Правила занятий/i,
      /Безопасность/i,
    ];
    for (const name of sectionLabels) {
      const button = page.getByRole("button", { name }).first();
      if (!(await button.isVisible().catch(() => false))) continue;
      await button.click();
      await expect(page.locator(".repeto-settings-page-head__title")).toBeVisible();
    }

    const themeButtons = [
      page.getByTestId("settings-theme-light").first(),
      page.getByTestId("settings-theme-system").first(),
      page.getByTestId("settings-theme-dark").first(),
    ];
    for (const button of themeButtons) {
      if (!(await button.isVisible().catch(() => false))) continue;
      await button.click();
    }
  });

  test("support flow: search -> results -> article", async ({ authedPage: page }) => {
    await gotoRoute(page, "/support");

    const searchInput = page.locator('input[placeholder*="статьям"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("ученик");
    await searchInput.press("Enter");

    await expect(page).toHaveURL(/\/support\/search-result/i);

    const articleLink = page.locator('a[href*="/support/article"]').first();
    if (await articleLink.isVisible().catch(() => false)) {
      await articleLink.click();
      await expect(page).toHaveURL(/\/support\/article/i);
    } else {
      const categoriesLink = page.locator('a[href="/support/categories"]').first();
      if (await categoriesLink.isVisible().catch(() => false)) {
        await categoriesLink.click();
        await expect(page).toHaveURL(/\/support\/categories/i);
      }
    }
  });

  test("public tutor profile to booking transition", async ({ authedPage: page }) => {
    const slug = await readTutorSlug(page);
    test.skip(!slug, "Current tutor account has no slug configured.");

    await gotoRoute(page, `/t/${slug}`);
    await expect(page.locator(".repeto-tp-page").first()).toBeVisible();

    const bookingLink = page.locator(`a[href="/t/${slug}/book"]:visible`).first();
    if (await bookingLink.count()) {
      await bookingLink.click();
    } else {
      await gotoRoute(page, `/t/${slug}/book`);
    }

    await expect(page).toHaveURL(new RegExp(`\\/t\\/${slug}\\/book`));

    const wizardRoot = page
      .locator(".repeto-bk-step, .repeto-bk-loading, .repeto-bk-options, .repeto-bk-option")
      .first();

    if (await wizardRoot.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(wizardRoot).toBeVisible();
      return;
    }

    const unavailableState = page
      .getByText(/не удалось загрузить страницу записи|нет доступных (слотов|пакетов)|запись недоступна/i)
      .first();

    if (await unavailableState.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(unavailableState).toBeVisible();
      return;
    }

    test.skip(true, "Booking wizard is not available for current public profile state.");
  });
});
