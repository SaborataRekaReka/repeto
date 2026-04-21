import { test, expect } from "./helpers/auth";
import type { Locator, Page } from "@playwright/test";

type RouteCheck = {
    id: string;
    path: string;
    readySelector: string;
};

const DESKTOP_ROUTES: RouteCheck[] = [
    { id: "dashboard", path: "/dashboard", readySelector: ".repeto-dashboard-grid, .repeto-platform-access-alert" },
    { id: "students", path: "/students", readySelector: ".page-overlay__title" },
    { id: "schedule", path: "/schedule", readySelector: ".repeto-schedule-toolbar" },
    { id: "payments", path: "/finance/payments", readySelector: ".page-overlay__title" },
    { id: "packages", path: "/finance/packages", readySelector: ".page-overlay__title" },
    { id: "notifications", path: "/notifications", readySelector: ".repeto-notifications-toolbar" },
    { id: "settings", path: "/settings", readySelector: ".repeto-settings-layout" },
];

const MOBILE_ROUTES: RouteCheck[] = [
    { id: "dashboard", path: "/dashboard", readySelector: ".repeto-mobile-nav, .repeto-dashboard-grid" },
    { id: "students", path: "/students", readySelector: ".page-overlay__title" },
    { id: "schedule", path: "/schedule", readySelector: ".repeto-schedule-toolbar" },
    { id: "payments", path: "/finance/payments", readySelector: ".page-overlay__title" },
    { id: "settings", path: "/settings", readySelector: ".repeto-settings-layout" },
];

async function setLightTheme(page: Page) {
    await page.addInitScript(() => {
        try {
            localStorage.setItem("repeto-theme-v2", "light");
        } catch {
            // Ignore storage errors in test mode.
        }
    });
}

async function gotoReady(page: Page, route: RouteCheck) {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator(route.readySelector).first()).toBeVisible();
}

function visualMask(page: Page): Locator[] {
    return [
        page.locator(".Toastify__toast-container").first(),
        page.locator(".recharts-responsive-container").first(),
        page.locator(".recharts-surface").first(),
        page.locator("time").first(),
        page.locator("[data-testid*='date'], [data-testid*='time']").first(),
    ];
}

test.describe("Visual Consistency Contract", () => {
    test.describe.configure({ mode: "serial" });
    test.setTimeout(240_000);

    test("VIS-DESKTOP-001 critical desktop routes match baseline", async ({ authedPage: page }) => {
        await page.setViewportSize({ width: 1720, height: 1024 });
        await setLightTheme(page);

        for (const route of DESKTOP_ROUTES) {
            await gotoReady(page, route);
            await expect(page).toHaveScreenshot(`vis-desktop-${route.id}.png`, {
                animations: "disabled",
                caret: "hide",
                fullPage: false,
                maxDiffPixelRatio: 0.02,
                mask: visualMask(page),
            });
        }
    });

    test("VIS-MOBILE-001 critical mobile routes match baseline", async ({ authedPage: page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await setLightTheme(page);

        for (const route of MOBILE_ROUTES) {
            await gotoReady(page, route);
            await expect(page).toHaveScreenshot(`vis-mobile-${route.id}.png`, {
                animations: "disabled",
                caret: "hide",
                fullPage: false,
                maxDiffPixelRatio: 0.03,
                mask: visualMask(page),
            });
        }
    });

    test("VIS-COMPONENT-001 core controls and dialogs match baseline", async ({ authedPage: page }) => {
        await page.setViewportSize({ width: 1720, height: 1024 });
        await setLightTheme(page);

        await page.goto("/settings", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        const settingsLayout = page.locator(".repeto-settings-layout").first();
        await expect(settingsLayout).toBeVisible();
        await expect(settingsLayout).toHaveScreenshot("vis-component-settings-layout.png", {
            animations: "disabled",
            caret: "hide",
            maxDiffPixelRatio: 0.02,
            mask: visualMask(page),
        });

        const firstCheckbox = page.locator("input[type='checkbox'], [role='checkbox']").first();
        if (await firstCheckbox.isVisible().catch(() => false)) {
            await expect(firstCheckbox).toHaveScreenshot("vis-component-checkbox.png", {
                animations: "disabled",
                caret: "hide",
                maxDiffPixelRatio: 0.02,
            });
        }

        await page.goto("/students", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        const newStudentButton = page.getByRole("button", { name: /Новый ученик|Добавить ученика/i }).first();
        if (await newStudentButton.isVisible().catch(() => false)) {
            await newStudentButton.click();
            const studentDialog = page.locator("[role='dialog']").first();
            await expect(studentDialog).toBeVisible();
            await expect(studentDialog).toHaveScreenshot("vis-component-student-dialog.png", {
                animations: "disabled",
                caret: "hide",
                maxDiffPixelRatio: 0.02,
                mask: visualMask(page),
            });
            await page.keyboard.press("Escape").catch(() => null);
        }

        await page.goto("/schedule", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        const createLessonButton = page.locator("button").filter({ hasText: /Новое занятие/i }).first();
        if (await createLessonButton.isVisible().catch(() => false)) {
            await createLessonButton.click();
            const lessonDialog = page.locator("[role='dialog']").first();
            await expect(lessonDialog).toBeVisible();
            await expect(lessonDialog).toHaveScreenshot("vis-component-lesson-dialog.png", {
                animations: "disabled",
                caret: "hide",
                maxDiffPixelRatio: 0.02,
                mask: visualMask(page),
            });
        }
    });
});
