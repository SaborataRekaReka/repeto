import type { Page } from "@playwright/test";
import { test, expect, getAuthToken } from "./helpers/auth";

async function gotoRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
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
    await gotoRoute(page, "/students");
    await expect(page.locator(".page-overlay__title")).toContainText(/ученики/i);

    const pills = page.locator(".repeto-sl-pill");
    const pillsCount = await pills.count();
    for (let i = 0; i < pillsCount; i += 1) {
      await pills.nth(i).click();
      await expect(pills.nth(i)).toHaveClass(/active/);
    }

    const searchInput = page.locator(".repeto-sl-search input").first();
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");
    await searchInput.fill("");

    const firstRow = page.locator(".repeto-sl-row").first();
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
    await gotoRoute(page, "/schedule");

    const viewButtons = page.locator(".repeto-schedule-toolbar__view button");
    const viewCount = await viewButtons.count();
    for (let i = 0; i < viewCount; i += 1) {
      await viewButtons.nth(i).click();
    }

    const navButtons = page.locator(".repeto-schedule-toolbar__nav button");
    await navButtons.nth(0).click();
    await navButtons.nth(1).click();

    await page.getByRole("button", { name: /новое занятие/i }).click();
    await expect(page.locator('[aria-label="Новое занятие"], [aria-label^="Занятие:"]').first()).toBeVisible();
    await closeModalByEscape(page);
  });

  test("payments flow: tabs, search and create modal", async ({ authedPage: page }) => {
    await gotoRoute(page, "/payments");
    await expect(page.locator(".page-overlay__title")).toContainText(/оплаты/i);

    const pills = page.locator(".repeto-sl-pill");
    const count = await pills.count();
    for (let i = 0; i < count; i += 1) {
      await pills.nth(i).click();
    }

    const searchInput = page.locator(".repeto-sl-search input").first();
    await searchInput.fill("test");
    await searchInput.fill("");

    await page.locator('button:has-text("Добавить оплату")').first().click();
    await expect(page.locator('[aria-label="Новая оплата"], [aria-label="Редактирование оплаты"]').first()).toBeVisible();
    await closeModalByEscape(page);
  });

  test("packages flow: type tabs, status tabs and create modal", async ({ authedPage: page }) => {
    await gotoRoute(page, "/packages");
    await expect(page.locator(".page-overlay__title")).toContainText(/пакеты/i);

    const packageTypeTabs = page.locator(".repeto-packages-type-tab");
    const typeTabsCount = await packageTypeTabs.count();
    for (let i = 0; i < typeTabsCount; i += 1) {
      await packageTypeTabs.nth(i).click();
    }

    const statusTabs = page.locator(".repeto-sl-pill");
    const statusTabsCount = await statusTabs.count();
    for (let i = 0; i < statusTabsCount; i += 1) {
      await statusTabs.nth(i).click();
    }

    await page.locator('button:has-text("Новый пакет")').first().click();
    await expect(page.locator('[aria-label="Новый пакет"], [aria-label="Редактирование пакета"]').first()).toBeVisible();
    await closeModalByEscape(page);
  });

  test("files flow: section switching and empty-state branch", async ({ authedPage: page }) => {
    await gotoRoute(page, "/files");
    await expect(page.locator(".page-overlay__title")).toContainText(/материалы/i);

    const sectionButtons = page.locator(".page-overlay__nav-item--section");
    const sectionCount = await sectionButtons.count();
    for (let i = 0; i < sectionCount; i += 1) {
      await sectionButtons.nth(i).click();
    }

    const connectCloudCta = page.locator('a[href="/settings?tab=integrations"]').first();
    if (await connectCloudCta.isVisible().catch(() => false)) {
      await connectCloudCta.click();
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
    await gotoRoute(page, "/settings");
    await expect(page.locator(".repeto-settings-layout")).toBeVisible();

    const sectionButtons = page.locator(".repeto-settings-nav-btn");
    const count = await sectionButtons.count();
    for (let i = 0; i < count; i += 1) {
      await sectionButtons.nth(i).click();
      await expect(page.locator(".repeto-settings-content")).toBeVisible();
    }

    const themeButtons = page.locator(".repeto-settings-theme-btn");
    const themesCount = await themeButtons.count();
    for (let i = 0; i < themesCount; i += 1) {
      await themeButtons.nth(i).click();
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
    await expect(
      page
        .locator(".repeto-bk-step, .repeto-bk-loading")
        .or(page.getByText(/не удалось загрузить страницу записи/i))
        .first(),
    ).toBeVisible();
  });
});
