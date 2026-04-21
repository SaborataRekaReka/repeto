import { test, expect, getAuthToken } from "./helpers/auth";
import type { Locator, Page } from "@playwright/test";

const API_BASE = "http://127.0.0.1:3200/api";

type PublicProfileState = {
    slug: string;
    restore: () => Promise<void>;
};

function randomSuffix() {
    return Math.random().toString(36).slice(2, 8);
}

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

async function gotoReady(page: Page, path: string, readySelector: string) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expectAnySelectorVisible(page, readySelector);
}

async function gotoReadyWithFallbackPaths(page: Page, paths: string[], readySelector: string) {
    for (const path of paths) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");

        if (await isAnySelectorVisible(page, readySelector)) {
            return path;
        }
    }

    throw new Error(`None of fallback paths became ready: ${paths.join(", ")}`);
}

async function closeTransientUi(page: Page) {
    await page.keyboard.press("Escape").catch(() => null);

    const closeButton = page.getByRole("button", { name: /Отмена|Закрыть|Cancel|Close/i }).first();
    if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click().catch(() => null);
    }
}

async function authHeaders(page: Page) {
    const token = await getAuthToken(page);
    return { Authorization: `Bearer ${token}` };
}

async function readTutorSlug(page: Page): Promise<string | null> {
    try {
        const headers = await authHeaders(page);
        const response = await page.request.get(`${API_BASE}/auth/me`, { headers });
        if (!response.ok()) return null;
        const me = (await response.json()) as { slug?: string | null };
        const slug = String(me.slug || "").trim();
        return slug.length > 0 ? slug : null;
    } catch {
        return null;
    }
}

async function ensurePublicProfile(page: Page, slugSeed: string): Promise<PublicProfileState> {
    const headers = await authHeaders(page);

    const settingsResponse = await page.request.get(`${API_BASE}/settings`, { headers });
    expect(settingsResponse.ok()).toBeTruthy();

    const settings = (await settingsResponse.json()) as {
        slug?: string | null;
        published?: boolean;
        showPublicPackages?: boolean;
    };

    const originalSlug = typeof settings.slug === "string" ? settings.slug : "";
    const originalPublished = Boolean(settings.published);
    const originalShowPublicPackages = settings.showPublicPackages !== false;

    let publicSlug = originalSlug.trim();
    if (!publicSlug) {
        const slugResponse = await page.request.get(`${API_BASE}/settings/account/slug`, {
            headers,
            params: { value: `${slugSeed}-${randomSuffix()}` },
        });
        expect(slugResponse.ok()).toBeTruthy();

        const slugPayload = (await slugResponse.json()) as {
            suggested?: string;
            requested?: string;
            slug?: string;
        };
        publicSlug = String(slugPayload.suggested || slugPayload.requested || slugPayload.slug || "").trim();
        expect(publicSlug.length).toBeGreaterThan(0);
    }

    const shouldPatch = !originalPublished || publicSlug !== originalSlug || settings.showPublicPackages === false;

    if (shouldPatch) {
        const patchResponse = await page.request.patch(`${API_BASE}/settings/account`, {
            headers,
            data: {
                slug: publicSlug,
                published: true,
                showPublicPackages: true,
            },
        });
        expect(patchResponse.ok()).toBeTruthy();
    }

    const restore = async () => {
        if (!shouldPatch) return;
        await page.request.patch(`${API_BASE}/settings/account`, {
            headers,
            data: {
                slug: originalSlug,
                published: originalPublished,
                showPublicPackages: originalShowPublicPackages,
            },
        }).catch(() => null);
    };

    return { slug: publicSlug, restore };
}

async function readControlState(locator: Locator) {
    const ariaChecked = await locator.getAttribute("aria-checked").catch(() => null);
    if (ariaChecked !== null) {
        return `aria-checked:${ariaChecked}`;
    }

    const type = await locator.getAttribute("type").catch(() => null);
    if (type === "checkbox") {
        const checked = await locator.isChecked().catch(() => false);
        return `checked:${String(checked)}`;
    }

    const ariaPressed = await locator.getAttribute("aria-pressed").catch(() => null);
    const ariaSelected = await locator.getAttribute("aria-selected").catch(() => null);
    const className = await locator.getAttribute("class").catch(() => "");
    return `pressed:${ariaPressed || ""}|selected:${ariaSelected || ""}|class:${className || ""}`;
}

async function clickFirstVisible(locator: Locator) {
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
        const row = locator.nth(index);
        const visible = await row.isVisible().catch(() => false);
        if (!visible) continue;

        const enabled = await row.isEnabled().catch(() => true);
        if (!enabled) continue;

        await row.scrollIntoViewIfNeeded().catch(() => null);
        const clicked = await row.click({ timeout: 5000 }).then(() => true).catch(() => false);
        if (!clicked) continue;
        return row;
    }
    return null;
}

test.describe("Controls Contract Coverage v3", () => {
    test.describe.configure({ mode: "serial" });
    test.setTimeout(240_000);

    test("CTRL-DASH-001 dashboard has at least one actionable control", async ({ authedPage: page }) => {
        await gotoReady(page, "/dashboard", ".repeto-dashboard-grid, .repeto-platform-access-alert, .repeto-top-header");

        const addControl = await clickFirstVisible(
            page.locator("button").filter({ hasText: /Добавить/i }).or(page.locator(".repeto-mobile-fab"))
        );

        if (addControl) {
            await expectAnySelectorVisible(page, ".repeto-quick-actions-menu, [role='menu'], [role='dialog']", 5000);
            await closeTransientUi(page);
            return;
        }

        const beforeUrl = page.url();
        const navLink = await clickFirstVisible(
            page.locator("a[href='/students'], a[href='/schedule'], a[href='/finance'], a[href='/finance/payments'], a[href='/finance/packages']")
        );
        expect(navLink, "No actionable dashboard control was found.").toBeTruthy();

        await page.waitForLoadState("networkidle").catch(() => null);
        expect(page.url()).not.toBe(beforeUrl);
    });

    test("CTRL-STUD-001 students route control opens creation flow", async ({ authedPage: page }) => {
        await gotoReady(page, "/students", ".repeto-top-header, .repeto-mobile-nav, h1, .repeto-sl-list");

        const createButton = page.getByRole("button", { name: /Новый ученик|Добавить ученика/i }).first();
        await expect(createButton).toBeVisible();
        await createButton.click();

        await expect(
            page
                .getByPlaceholder("Иванов Пётр Сергеевич")
                .or(page.locator("[role='dialog'], [aria-label='Новый ученик'], [aria-label='Карточка ученика']").first())
                .first(),
        ).toBeVisible({ timeout: 10_000 });

        await closeTransientUi(page);
    });

    test("CTRL-SCHED-001 schedule create control opens lesson dialog", async ({ authedPage: page }) => {
        await gotoReady(page, "/schedule", ".repeto-schedule-toolbar, .repeto-top-header");

        const createLessonButton = page.locator("button").filter({ hasText: /Новое занятие/i }).first();
        await expect(createLessonButton).toBeVisible();
        await createLessonButton.click();

        await expect(page.locator("[role='dialog'], [aria-label='Новое занятие'], [aria-label^='Занятие:']").first()).toBeVisible({
            timeout: 10_000,
        });

        await closeTransientUi(page);
    });

    test("CTRL-FIN-001 finance route controls are actionable", async ({ authedPage: page }) => {
        await gotoReady(page, "/finance", ".repeto-finance-overview-row, .repeto-top-header, h1");

        const createPaymentButton = page
            .locator("button")
            .filter({ hasText: /Добавить оплату|Записать оплату/i })
            .first();

        if (await createPaymentButton.isVisible().catch(() => false)) {
            await createPaymentButton.click();
            await expect(
                page
                    .getByPlaceholder("4200")
                    .or(page.locator("[role='dialog'], [aria-label='Новая оплата'], [aria-label='Редактирование оплаты']").first())
                    .first(),
            ).toBeVisible({ timeout: 10_000 });
            await closeTransientUi(page);
            return;
        }

        const statusButtons = page.locator("button").filter({ hasText: /Все|Оплачено|Не оплачено/i });
        const count = await statusButtons.count();
        expect(count).toBeGreaterThan(1);

        const target = statusButtons.nth(1);
        const beforeState = await readControlState(target);
        await target.click();
        await page.waitForTimeout(150);
        const afterState = await readControlState(target);
        expect(afterState).not.toBe(beforeState);
    });

    test("CTRL-PAY-001 payments controls open payment modal", async ({ authedPage: page }) => {
        await gotoReady(page, "/finance", ".repeto-finance-overview-row, .repeto-top-header, h1");

        const paymentsNavButton = page.locator("button, a").filter({ hasText: /^Оплаты$/i }).first();
        if (await paymentsNavButton.isVisible().catch(() => false)) {
            await paymentsNavButton.click();
            await page.waitForLoadState("networkidle").catch(() => null);
        }

        await expect(page.getByRole("heading", { name: /Оплаты/i }).first()).toBeVisible();

        const createPaymentButton = page
            .locator("button")
            .filter({ hasText: /Записать оплату|Добавить оплату/i })
            .first();

        await expect(createPaymentButton).toBeVisible();
        await createPaymentButton.click();

        await expect(
            page
                .getByPlaceholder("4200")
                .or(page.locator("[role='dialog'], [aria-label='Новая оплата'], [aria-label='Редактирование оплаты']").first())
                .first(),
        ).toBeVisible({ timeout: 10_000 });

        await closeTransientUi(page);
    });

    test("CTRL-PKG-001 packages controls are actionable", async ({ authedPage: page }) => {
        await gotoReady(page, "/finance", ".repeto-finance-overview-row, .repeto-top-header, h1");

        const packagesNavButton = page.locator("button, a").filter({ hasText: /^Пакеты$/i }).first();
        await expect(packagesNavButton).toBeVisible();
        await packagesNavButton.click();
        await page.waitForLoadState("networkidle").catch(() => null);

        await expect(page.getByRole("heading", { name: /Пакеты/i }).first()).toBeVisible();

        const createPackageButton = page.locator("button").filter({ hasText: /Новый пакет/i }).first();
        if (await createPackageButton.isVisible().catch(() => false)) {
            await createPackageButton.click();
            await expect(
                page
                    .locator("[role='dialog'], [aria-label='Новый пакет'], [aria-label='Редактирование пакета']")
                    .first(),
            ).toBeVisible({ timeout: 10_000 });
            await closeTransientUi(page);
            return;
        }

        const packageTabs = page.locator(".repeto-packages-type-tab, .repeto-sl-pill");
        const tabCount = await packageTabs.count();
        expect(tabCount).toBeGreaterThan(1);

        const target = packageTabs.nth(1);
        const beforeState = await readControlState(target);
        await target.click();
        await page.waitForTimeout(150);
        const afterState = await readControlState(target);
        expect(afterState).not.toBe(beforeState);
    });

    test("CTRL-FILES-001 files route has switching or integration CTA controls", async ({ authedPage: page }) => {
        await gotoReady(page, "/files", ".repeto-top-header, .repeto-mobile-nav, h1, .page-overlay__nav");

        const sectionButtons = page.locator(".page-overlay__nav-item--section, .repeto-files-tabs button");
        const sectionCount = await sectionButtons.count();

        if (sectionCount > 1 && (await sectionButtons.nth(1).isVisible().catch(() => false))) {
            const second = sectionButtons.nth(1);
            const beforeState = await readControlState(second);
            await second.click();
            await page.waitForTimeout(150);
            const afterState = await readControlState(second);
            expect(afterState).not.toBe(beforeState);
            return;
        }

        const integrationLink = page.locator("a[href*='/settings?tab=integrations']").first();
        await expect(integrationLink).toBeVisible();
        await integrationLink.click();
        await page.waitForLoadState("networkidle").catch(() => null);
        await expect(page).toHaveURL(/\/settings\?tab=integrations/);
    });

    test("CTRL-NOTIF-001 notifications tabs are interactive", async ({ authedPage: page }) => {
        await gotoReady(page, "/notifications", ".repeto-notifications-toolbar");

        const tabButtons = page.locator(
            ".repeto-notifications-toolbar__tabs .g-segmented-radio-group__option, .repeto-notifications-toolbar .g-segmented-radio-group__option"
        );
        const count = await tabButtons.count();

        expect(count).toBeGreaterThan(0);

        const targetIndex = count > 1 ? 1 : 0;
        const target = tabButtons.nth(targetIndex);

        const beforeState = await readControlState(target);
        const clicked = await target.click({ timeout: 5000 }).then(() => true).catch(() => false);
        expect(clicked).toBeTruthy();
        await page.waitForTimeout(150);
        const afterState = await readControlState(target);

        if (count > 1) {
            expect(afterState).not.toBe(beforeState);
        } else {
            await expect(page.locator(".repeto-notifications-toolbar")).toBeVisible();
        }
    });

    test("CTRL-SET-001 settings sections are switchable", async ({ authedPage: page }) => {
        await gotoReady(page, "/settings", ".repeto-settings-layout");

        const sectionButtons = page.locator(".repeto-settings-nav-btn");
        const count = await sectionButtons.count();
        expect(count).toBeGreaterThan(0);

        if (count > 1 && (await sectionButtons.nth(1).isVisible().catch(() => false))) {
            const second = sectionButtons.nth(1);
            const beforeState = await readControlState(second);
            await second.click();
            await page.waitForTimeout(200);
            const afterState = await readControlState(second);
            expect(afterState).not.toBe(beforeState);
        } else {
            const themeButton = page.locator(".repeto-settings-theme-btn").first();
            await expect(themeButton).toBeVisible();
            await themeButton.click();
            await expect(themeButton).toBeVisible();
        }

        await expect(page.locator(".repeto-settings-content").first()).toBeVisible();
    });

    test("CTRL-SUP-001 support search control leads to visible results", async ({ authedPage: page }) => {
        await gotoReady(page, "/support", "input[placeholder*='Поиск'], input[placeholder*='стать'], .repeto-top-header");

        const searchInput = page
            .locator("input[placeholder*='Поиск'], input[placeholder*='стать'], input[type='search']")
            .first();
        await expect(searchInput).toBeVisible();

        await searchInput.fill("ученик");
        await searchInput.press("Enter");
        await page.waitForLoadState("networkidle").catch(() => null);

        const movedToSearchRoute = /\/support\/search-result/i.test(page.url());
        const hasVisibleSearchArtifacts = await page
            .locator("a[href*='/support/article'], .repeto-support-search-result, .repeto-support-search-item")
            .first()
            .isVisible()
            .catch(() => false);

        expect(movedToSearchRoute || hasVisibleSearchArtifacts).toBeTruthy();
    });

    test("CTRL-PUBLIC-001 public tutor page controls are interactive", async ({ authedPage: page }) => {
        const profile = await ensurePublicProfile(page, "ctrl-public");

        try {
            await gotoReady(page, `/t/${profile.slug}`, ".repeto-tp-page, .repeto-tp-section");

            const policyButton = page.locator("button").filter({ hasText: /Политика/i }).first();
            if (await policyButton.isVisible().catch(() => false)) {
                await policyButton.click();
                await expect(page.locator("[role='dialog'], .repeto-tp-policy-popup, [role='tooltip']").first()).toBeVisible();
                await closeTransientUi(page);
                return;
            }

            const reviewsButton = page.locator("button").filter({ hasText: /Все отзывы/i }).first();
            if (await reviewsButton.isVisible().catch(() => false)) {
                await reviewsButton.click();
                await expect(page.locator("[role='dialog'], .g-dialog").first()).toBeVisible();
                await closeTransientUi(page);
                return;
            }

            const certThumb = page.locator(".repeto-tp-cert-thumb").first();
            if (await certThumb.isVisible().catch(() => false)) {
                await certThumb.click();
                await expect(page.locator("[role='dialog'], .repeto-tp-lightbox-dialog").first()).toBeVisible();
                await closeTransientUi(page);
                return;
            }

            const bookLink = page.locator(`a[href='/t/${profile.slug}/book']`).first();
            await expect(bookLink).toBeVisible();
            await bookLink.click();
            await page.waitForLoadState("networkidle").catch(() => null);
            await expect(page).toHaveURL(new RegExp(`\\/t\\/${profile.slug}\\/book`));
        } finally {
            await profile.restore();
        }
    });

    test("CTRL-BOOK-001 booking wizard controls advance the flow", async ({ authedPage: page }) => {
        const profile = await ensurePublicProfile(page, "ctrl-book");

        try {
            await gotoReady(page, `/t/${profile.slug}/book`, ".repeto-bk-step, .repeto-bk-options, .repeto-bk-option");

            const firstOption = page.locator(".repeto-bk-option").first();
            test.skip(!(await firstOption.isVisible().catch(() => false)), "No public options in booking wizard.");

            const beforeOptionState = await readControlState(firstOption);
            await firstOption.click();
            const afterOptionState = await readControlState(firstOption);
            expect(afterOptionState).not.toBe(beforeOptionState);

            const continueButton = page.locator(".repeto-bk-action-btn").filter({ hasText: /Продолжить/i }).first();
            await expect(continueButton).toBeVisible();
            await continueButton.click();
            await page.waitForLoadState("networkidle").catch(() => null);

            await expect(
                page
                    .locator(".repeto-bk-cal-day, .repeto-bk-time-slot, .repeto-bk-step--otp, .repeto-bk-step--details")
                    .first(),
            ).toBeVisible({ timeout: 10_000 });
        } finally {
            await profile.restore();
        }
    });

    test("CTRL-AUTH-001 auth signin controls switch to student view", async ({ page }) => {
        await page.context().clearCookies();
        await gotoReady(page, "/auth?view=signin", "form");

        const studentSwitch = page.getByRole("button", { name: /у меня есть репетитор/i }).first();
        await expect(studentSwitch).toBeVisible();
        await studentSwitch.click();

        await expect(page).toHaveURL(/view=student/i);
        await expect(page.getByText(/вход ученика/i)).toBeVisible();
    });

    test("CTRL-AUTH-002 auth student controls switch to tutor view", async ({ page }) => {
        await page.context().clearCookies();
        await gotoReady(page, "/auth?view=student", "form");

        const tutorSwitch = page.getByRole("button", { name: /я репетитор|для репетиторов|вход в repeto/i }).first();
        await expect(tutorSwitch).toBeVisible();
        await tutorSwitch.click();

        await expect(page).toHaveURL(/view=signin/i);
        await expect(page.getByText(/вход в repeto/i)).toBeVisible();
    });

    test("CTRL-CHECKBOX-001 at least one visible settings toggle changes state", async ({ authedPage: page }) => {
        await gotoReady(page, "/settings", ".repeto-settings-layout");

        const toggles = page.locator(".repeto-settings-content [role='switch'], .repeto-settings-content [role='checkbox'], .repeto-settings-content input[type='checkbox']");
        const count = await toggles.count();
        expect(count).toBeGreaterThan(0);

        let changed = false;

        for (let index = 0; index < count; index += 1) {
            const toggle = toggles.nth(index);
            const visible = await toggle.isVisible().catch(() => false);
            if (!visible) continue;

            const enabled = await toggle.isEnabled().catch(() => true);
            if (!enabled) continue;

            const beforeState = await readControlState(toggle);
            await toggle.scrollIntoViewIfNeeded().catch(() => null);
            await toggle.click({ timeout: 5000 }).catch(() => null);
            await page.waitForTimeout(200);
            const afterState = await readControlState(toggle);

            if (beforeState !== afterState) {
                changed = true;
                break;
            }
        }

        expect(changed).toBeTruthy();
    });

});
