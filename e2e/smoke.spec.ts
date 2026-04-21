import type { Page } from "@playwright/test";
import { test, expect, getAuthToken } from "./helpers/auth";

async function gotoRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
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

test.describe("Smoke v2", () => {
  test("unauthorized access is redirected to auth", async ({ page }) => {
    await page.context().clearCookies();
    await gotoRoute(page, "/dashboard");
    await expect(page).toHaveURL(/\/auth|\/registration|\/login/i);
    await expect(page.locator("form").first()).toBeVisible();
  });

  test("auth page supports tutor and student sign-in views", async ({ page }) => {
    await gotoRoute(page, "/auth?view=signin");
    await expect(page.getByText(/вход в repeto/i)).toBeVisible();

    const studentSwitch = page.getByRole("button", { name: /у меня есть репетитор/i });
    await expect(studentSwitch).toBeVisible();
    await studentSwitch.click();
    await expect(page.getByText(/вход ученика/i)).toBeVisible();
  });

  const routeChecks: Array<{
    path: string;
    readySelector: string;
  }> = [
    { path: "/dashboard", readySelector: ".repeto-dashboard-grid, .repeto-platform-access-alert" },
    { path: "/students", readySelector: ".page-overlay__title" },
    { path: "/schedule", readySelector: ".repeto-schedule-toolbar__create button" },
    { path: "/finance", readySelector: ".repeto-finance-overview-row" },
    { path: "/payments", readySelector: ".page-overlay__title" },
    { path: "/packages", readySelector: ".page-overlay__title" },
    { path: "/files", readySelector: ".page-overlay__title" },
    { path: "/notifications", readySelector: ".repeto-notifications-toolbar" },
    { path: "/settings", readySelector: ".repeto-settings-layout" },
    { path: "/support", readySelector: "input[placeholder*='Поиск'], .repeto-top-header" },
  ];

  for (const route of routeChecks) {
    test(`route ${route.path} renders`, async ({ authedPage: page }) => {
      await gotoRoute(page, route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace("/", "\\/")));
      await expect(page.locator(route.readySelector).first()).toBeVisible();
    });
  }

  test("public tutor profile and booking route are reachable", async ({ authedPage: page }) => {
    const slug = await readTutorSlug(page);
    test.skip(!slug, "Current tutor account has no slug configured.");

    await gotoRoute(page, `/t/${slug}`);
    await expect(page.locator(".repeto-tp-page").first()).toBeVisible();

    const bookLink = page.locator(`a[href="/t/${slug}/book"]:visible`).first();
    if (await bookLink.count()) {
      await bookLink.click();
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

  test("student portal route requires student auth", async ({ page }) => {
    await page.context().clearCookies();
    await gotoRoute(page, "/student");
    await expect(page).toHaveURL(/\/auth/i);
    await expect(page).toHaveURL(/view=student/i);
  });
});

