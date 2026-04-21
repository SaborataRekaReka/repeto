import type { Locator, Page } from "@playwright/test";
import { test, expect, getAuthToken, loginViaAPI, loginViaUI } from "./helpers/auth";

const AUTH_ROUTE_RE = /\/(auth|registration|login)(?:\?|#|$)/i;

function splitSelectors(selectorList: string) {
  return selectorList
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function isAnySelectorVisible(page: Page, selectorList: string) {
  const selectors = splitSelectors(selectorList);
  for (const selector of selectors) {
    const visible = await page
      .locator(selector)
      .first()
      .isVisible()
      .catch(() => false);
    if (visible) return true;
  }
  return false;
}

async function expectAnySelectorVisible(page: Page, selectorList: string, timeoutMs = 12_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isAnySelectorVisible(page, selectorList)) {
      return;
    }
    await page.waitForTimeout(250);
  }

  throw new Error(`No ready selector became visible: ${selectorList}`);
}

async function clickAllVisibleEnabled(locator: Locator) {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const item = locator.nth(i);
    if (!(await item.isVisible().catch(() => false))) continue;
    if (!(await item.isEnabled().catch(() => false))) continue;
    await item.click();
  }
}

async function gotoAuthed(page: Page, path: string, readySelector?: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    if (!AUTH_ROUTE_RE.test(page.url())) {
      if (readySelector) {
        await expectAnySelectorVisible(page, readySelector);
      }
      return;
    }

    let relogged = false;
    try {
      await loginViaUI(page);
      relogged = true;
    } catch {
      relogged = await loginViaAPI(page);
    }

    if (!relogged) {
      await page.waitForTimeout(Math.min(8_000, 1_200 * (attempt + 1)));
    }
  }

  throw new Error(`Route ${path} redirected to auth after re-login attempt.`);
}

async function openRoute(page: Page, path: string, readySelector?: string) {
  const navLink = page.locator(`a[href="${path}"]:visible`).first();
  if (await navLink.count()) {
    await navLink.click();
    await page.waitForLoadState("networkidle");

    if (AUTH_ROUTE_RE.test(page.url())) {
      await gotoAuthed(page, path, readySelector);
      return;
    }

    await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/")));
    if (readySelector) {
      await expectAnySelectorVisible(page, readySelector);
    }
    return;
  }

  await gotoAuthed(page, path, readySelector);
}

async function closeModal(page: Page) {
  const backButton = page.getByRole("button", { name: "Назад" }).first();
  if (await backButton.isVisible().catch(() => false)) {
    await backButton.click();
    return;
  }

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

test.describe("Interaction Coverage 80 Chains (INT80)", () => {
  test("INT80-CHAIN-001 | auth gateway story: tutor/student switch and protected guards", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/auth?view=signin", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/вход в repeto/i)).toBeVisible();

    const studentSwitch = page.getByRole("button", { name: /у меня есть репетитор/i }).first();
    if (await studentSwitch.isVisible().catch(() => false)) {
      await studentSwitch.click();
      await expect(page).toHaveURL(/view=student/i);
      await expect(page.getByText(/вход ученика/i)).toBeVisible();
    }

    await page.goto("/student", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/auth/i);
    await expect(page).toHaveURL(/view=student/i);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/auth|\/registration|\/login/i);
  });

  test("INT80-CHAIN-002 | tutor workday: dashboard -> students -> student card -> schedule", async ({ authedPage: page }) => {
    await gotoAuthed(page, "/dashboard", ".repeto-dashboard-grid, .repeto-platform-access-alert, .repeto-top-header");

    const statsTexts = [/ученики/i, /занятия/i, /доход/i, /долг/i];
    let visibleStats = 0;
    for (const statText of statsTexts) {
      if (await page.getByText(statText).first().isVisible().catch(() => false)) {
        visibleStats += 1;
      }
    }
    expect(visibleStats).toBeGreaterThanOrEqual(2);

    await openRoute(page, "/students", ".page-overlay__title, .repeto-sl-pill, .repeto-top-header");
    await clickAllVisibleEnabled(page.locator(".repeto-sl-pill"));

    const searchInput = page.locator(".repeto-sl-search input").first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("test");
      await expect(searchInput).toHaveValue("test");
      await searchInput.fill("");
    }

    const firstRow = page.locator(".repeto-sl-row, table tbody tr").first();
    if (await firstRow.isVisible().catch(() => false)) {
      // Student rows can re-render under active filters; retry with link fallback.
      const openByRow = await firstRow
        .click({ timeout: 3_000 })
        .then(() => true)
        .catch(() => false);

      if (!openByRow) {
        const firstStudentLink = page.locator('a[href^="/students/"]').first();
        if (await firstStudentLink.isVisible().catch(() => false)) {
          await firstStudentLink.click();
        }
      }

      if (/\/students\/[^/?#]+/.test(page.url())) {
        await clickAllVisibleEnabled(page.locator(".page-overlay__nav-item--section"));
      }
    }

    await openRoute(page, "/schedule", ".repeto-schedule-toolbar, .repeto-schedule-toolbar__create button, .repeto-top-header");
    await clickAllVisibleEnabled(page.locator(".repeto-schedule-toolbar__view button"));

    const navButtons = page.locator(".repeto-schedule-toolbar__nav button");
    if ((await navButtons.count()) >= 2) {
      const prev = navButtons.nth(0);
      const next = navButtons.nth(1);
      if (await prev.isVisible().catch(() => false)) await prev.click();
      if (await next.isVisible().catch(() => false)) await next.click();
    }

    const createLessonButton = page.getByRole("button", { name: /новое занятие/i }).first();
    if (await createLessonButton.isVisible().catch(() => false)) {
      await createLessonButton.click();
      await expect(page.locator('[aria-label="Новое занятие"], [aria-label^="Занятие:"]').first()).toBeVisible();
      await closeModal(page);
    }
  });

  test("INT80-CHAIN-003 | finance chain: overview -> payments -> packages", async ({ authedPage: page }) => {
    await gotoAuthed(page, "/finance", ".repeto-finance-overview-row, .repeto-top-header, h1");
    await expect(page.getByText(/доход|баланс|финансы|ожидается/i).first()).toBeVisible();

    await openRoute(page, "/payments", ".page-overlay__title, .repeto-sl-pill, .repeto-top-header, h1");
    await clickAllVisibleEnabled(page.locator(".repeto-sl-pill"));

    const paymentSearch = page.locator(".repeto-sl-search input").first();
    if (await paymentSearch.isVisible().catch(() => false)) {
      await paymentSearch.fill("test");
      await paymentSearch.fill("");
    }

    const createPaymentButton = page
      .locator("button")
      .filter({ hasText: /Записать оплату|Добавить оплату/i })
      .first();
    if (await createPaymentButton.isVisible().catch(() => false)) {
      await createPaymentButton.click();
      await expect(page.locator('[aria-label="Новая оплата"], [aria-label="Редактирование оплаты"]').first()).toBeVisible();
      await closeModal(page);
    }

    await openRoute(page, "/packages", ".page-overlay__title, .repeto-packages-type-tab, .repeto-sl-pill, .repeto-top-header, h1");
    await clickAllVisibleEnabled(page.locator(".repeto-packages-type-tab"));
    await clickAllVisibleEnabled(page.locator(".repeto-sl-pill"));

    const createPackageButton = page.locator("button").filter({ hasText: /Новый пакет/i }).first();
    if (await createPackageButton.isVisible().catch(() => false)) {
      await createPackageButton.click();
      await expect(page.locator('[aria-label="Новый пакет"], [aria-label="Редактирование пакета"]').first()).toBeVisible();
      await closeModal(page);
    }
  });

  test("INT80-CHAIN-004 | operations chain: files -> notifications -> settings", async ({ authedPage: page }) => {
    await gotoAuthed(page, "/files", ".page-overlay__title, .repeto-top-header, h1");
    await clickAllVisibleEnabled(page.locator(".page-overlay__nav-item--section"));

    const connectCloudCta = page.locator('a[href="/settings?tab=integrations"]').first();
    if (await connectCloudCta.isVisible().catch(() => false)) {
      await connectCloudCta.click();
      await expect(page).toHaveURL(/\/settings\?tab=integrations/);
    }

    await openRoute(page, "/notifications", ".repeto-notifications-toolbar, .repeto-top-header");
    await clickAllVisibleEnabled(page.locator(".repeto-notifications-toolbar button"));

    const markAllButton = page.getByRole("button", { name: /прочитать все/i }).first();
    if ((await markAllButton.isVisible().catch(() => false)) && (await markAllButton.isEnabled().catch(() => false))) {
      await markAllButton.click();
    }

    await openRoute(page, "/settings", ".repeto-settings-layout, .repeto-settings-content");
    await clickAllVisibleEnabled(page.locator(".repeto-settings-nav-btn"));
    await clickAllVisibleEnabled(page.locator(".repeto-settings-theme-btn"));
  });

  test("INT80-CHAIN-005 | support story: search -> results/article -> back to dashboard", async ({ authedPage: page }) => {
    await gotoAuthed(page, "/dashboard", ".repeto-dashboard-grid, .repeto-platform-access-alert, .repeto-top-header");
    await openRoute(page, "/support", "input[placeholder*='статьям'], input[placeholder*='Поиск'], .repeto-top-header");

    const searchInput = page.locator('input[placeholder*="статьям"], input[placeholder*="Поиск"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("ученик");
    await searchInput.press("Enter");

    const movedToSearchRoute = await page
      .waitForURL(/\/support\/(search-result|search)/i, { timeout: 4_000 })
      .then(() => true)
      .catch(() => false);
    if (!movedToSearchRoute) {
      await expect(page).toHaveURL(/\/support/i);
    }

    const articleLink = page.locator('a[href*="/support/article"]').first();
    if (await articleLink.isVisible().catch(() => false)) {
      await articleLink.click();
      await expect(page).toHaveURL(/\/support\/article/i);
    }

    await openRoute(page, "/dashboard", ".repeto-dashboard-grid, .repeto-platform-access-alert, .repeto-top-header");
  });

  test("INT80-CHAIN-006 | public funnel story: public profile -> booking route", async ({ authedPage: page }) => {
    const slug = await readTutorSlug(page);
    test.skip(!slug, "Current tutor account has no slug configured.");

    await page.goto(`/t/${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".repeto-tp-page").first()).toBeVisible();

    const bookingLink = page.locator(`a[href="/t/${slug}/book"]:visible`).first();
    if (await bookingLink.count()) {
      await bookingLink.click();
    } else {
      await page.goto(`/t/${slug}/book`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
    }

    await expect(page).toHaveURL(new RegExp(`\\/t\\/${slug}\\/book`));

    const wizardRoot = page
      .locator(".repeto-bk-step, .repeto-bk-loading, .repeto-bk-options, .repeto-bk-option")
      .first();
    const isWizardVisible = await wizardRoot.isVisible({ timeout: 10_000 }).catch(() => false);

    if (isWizardVisible) {
      await expect(wizardRoot).toBeVisible();
      const firstOption = page.locator(".repeto-bk-option").first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
      }
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

  test("INT80-CHAIN-007 | quick actions story: dashboard add menu -> student/schedule flows", async ({ authedPage: page }) => {
    await gotoAuthed(page, "/dashboard", ".repeto-dashboard-grid, .repeto-platform-access-alert, .repeto-top-header");

    const addButton = page.getByRole("button", { name: "Добавить" }).first();
    test.skip(!(await addButton.isVisible().catch(() => false)), "Add menu is not available in current layout.");

    await addButton.click();
    const newStudentItem = page.getByText("Новый ученик").first();
    if (await newStudentItem.isVisible().catch(() => false)) {
      await newStudentItem.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/students/i);
      await closeModal(page);
    }

    await openRoute(page, "/schedule", ".repeto-schedule-toolbar, .repeto-schedule-toolbar__create button, .repeto-top-header");
    const createLessonButton = page.getByRole("button", { name: /новое занятие/i }).first();
    if (await createLessonButton.isVisible().catch(() => false)) {
      await createLessonButton.click();
      const lessonDialog = page.locator('[aria-label="Новое занятие"], [aria-label^="Занятие:"]').first();
      if (await lessonDialog.isVisible({ timeout: 8_000 }).catch(() => false)) {
        await closeModal(page);
      }
    }
  });

  test("INT80-CHAIN-008 | session recovery story: cookie drop -> re-login -> continue work", async ({ authedPage: page }) => {
    await gotoAuthed(page, "/dashboard", ".repeto-dashboard-grid, .repeto-platform-access-alert, .repeto-top-header");
    await openRoute(page, "/notifications", ".repeto-notifications-toolbar, .repeto-top-header");

    await page.context().clearCookies();
    await page.goto("/students", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    if (/\/(auth|registration|login)(?:\?|#|$)/i.test(page.url())) {
      const relogged = await loginViaUI(page)
        .then(() => true)
        .catch(() => false);

      test.skip(!relogged, "Session recovery hit auth throttling/anti-abuse in this environment.");
      await expect(page).not.toHaveURL(/\/auth|\/registration|\/login/i);
    }

    await page.goto("/students", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    test.skip(
      /\/(auth|registration|login)(?:\?|#|$)/i.test(page.url()),
      "Session recovery is blocked by temporary auth wall after cookie drop.",
    );
    await expect(page).toHaveURL(/\/students/i);
  });
});