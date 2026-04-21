import { test, expect, getAuthToken, DEMO_EMAIL, DEMO_PASSWORD, loginViaUI } from "./helpers/auth";
import type { Page } from "@playwright/test";

const API_BASE = "/api";

type CheckboxMeta = {
    selector: string;
    label: string;
    checked: boolean;
};

function isPotentiallyDestructive(label: string) {
    const low = label.toLowerCase();
    return ["удал", "архив", "отвяз", "delete", "remove", "unlink"].some((needle) => low.includes(needle));
}

async function authHeaders(page: Page) {
    const token = await getAuthToken(page);
    return { Authorization: `Bearer ${token}` };
}

async function gotoSettings(page: Page) {
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".repeto-settings-layout").first()).toBeVisible();
}

async function persistIfNeeded(page: Page) {
    const saveButtons = [
        page.getByRole("button", { name: /^Сохранить$/i }).first(),
        page.getByRole("button", { name: /^Применить$/i }).first(),
        page.getByRole("button", { name: /^Save$/i }).first(),
        page.getByRole("button", { name: /^Apply$/i }).first(),
    ];

    for (const button of saveButtons) {
        const visible = await button.isVisible().catch(() => false);
        if (!visible) continue;

        const disabled = await button.isDisabled().catch(() => false);
        if (disabled) continue;

        await button.click().catch(() => null);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(400);
        return;
    }

    // Some settings are auto-saved.
    await page.waitForTimeout(300);
}

async function collectVisibleCheckboxes(page: Page): Promise<CheckboxMeta[]> {
    return page.evaluate(() => {
        function visible(element: Element) {
            const node = element as HTMLElement;
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                style.opacity !== "0" &&
                rect.width > 0 &&
                rect.height > 0
            );
        }

        function selectorFor(element: Element) {
            const parts: string[] = [];
            let current: Element | null = element;

            while (current && current.nodeType === 1) {
                const node = current as HTMLElement;
                const tag = node.tagName.toLowerCase();

                if (node.id) {
                    parts.unshift(`${tag}#${CSS.escape(node.id)}`);
                    break;
                }

                let index = 1;
                let sibling = current.previousElementSibling;
                while (sibling) {
                    if (sibling.tagName === current.tagName) index += 1;
                    sibling = sibling.previousElementSibling;
                }

                parts.unshift(`${tag}:nth-of-type(${index})`);
                current = current.parentElement;
                if (tag === "body") break;
                if (parts.length >= 10) break;
            }

            return parts.join(" > ");
        }

        const nodes = Array.from(document.querySelectorAll("input[type='checkbox'], [role='checkbox']"));
        const rows: CheckboxMeta[] = [];

        for (const node of nodes) {
            if (!visible(node)) continue;

            const el = node as HTMLElement;
            const label =
                (el.getAttribute("aria-label") || "").trim() ||
                (el.textContent || "").replace(/\s+/g, " ").trim() ||
                "checkbox";

            let checked = false;
            if (el.tagName.toLowerCase() === "input") {
                checked = Boolean((el as HTMLInputElement).checked);
            } else {
                checked = el.getAttribute("aria-checked") === "true";
            }

            rows.push({
                selector: selectorFor(el),
                label: label.slice(0, 120),
                checked,
            });
        }

        const unique = new Map<string, CheckboxMeta>();
        for (const row of rows) {
            if (!unique.has(row.selector)) unique.set(row.selector, row);
        }
        return Array.from(unique.values());
    });
}

async function readCheckboxState(page: Page, selector: string): Promise<boolean | null> {
    return page.evaluate((inputSelector) => {
        const el = document.querySelector(inputSelector) as HTMLElement | null;
        if (!el) return null;

        if (el.tagName.toLowerCase() === "input") {
            return Boolean((el as HTMLInputElement).checked);
        }
        const value = el.getAttribute("aria-checked");
        if (value === "true") return true;
        if (value === "false") return false;
        return null;
    }, selector);
}

async function ensureAuthInContext(page: Page) {
    const loginResponse = await page.request.post("/api/auth/login", {
        data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });

    if (!loginResponse.ok()) {
        await loginViaUI(page);
    }
}

test.describe("Persistence Contract Coverage", () => {
    test.describe.configure({ mode: "serial" });
    test.setTimeout(240_000);

    test("PERS-CHECKBOX-001 settings checkboxes persist after save and reload", async ({ authedPage: page }) => {
        await gotoSettings(page);

        const all = await collectVisibleCheckboxes(page);
        const candidates = all.filter((row) => !isPotentiallyDestructive(row.label)).slice(0, 8);
        expect(candidates.length).toBeGreaterThan(0);

        const changed: Array<{ selector: string; label: string; before: boolean; after: boolean }> = [];

        try {
            for (const checkbox of candidates) {
                await gotoSettings(page);

                const locator = page.locator(checkbox.selector).first();
                const visible = await locator.isVisible().catch(() => false);
                if (!visible) continue;

                const before = await readCheckboxState(page, checkbox.selector);
                if (before === null) continue;

                await locator.scrollIntoViewIfNeeded().catch(() => null);
                await locator.click().catch(() => null);
                await persistIfNeeded(page);

                const after = await readCheckboxState(page, checkbox.selector);
                if (after === null) continue;

                if (before !== after) {
                    changed.push({
                        selector: checkbox.selector,
                        label: checkbox.label,
                        before,
                        after,
                    });
                }
            }

            expect(changed.length).toBeGreaterThan(0);

            await page.reload({ waitUntil: "domcontentloaded" });
            await page.waitForLoadState("networkidle");

            for (const checkbox of changed) {
                const current = await readCheckboxState(page, checkbox.selector);
                expect(current, `Reload mismatch for checkbox: ${checkbox.label}`).toBe(checkbox.after);
            }
        } finally {
            await gotoSettings(page);
            for (const checkbox of changed.reverse()) {
                const current = await readCheckboxState(page, checkbox.selector);
                if (current === null || current === checkbox.before) continue;

                const locator = page.locator(checkbox.selector).first();
                if (!(await locator.isVisible().catch(() => false))) continue;
                await locator.click().catch(() => null);
                await persistIfNeeded(page);
            }
        }
    });

    test("PERS-CHECKBOX-002 checkbox state persists across fresh browser context", async ({ authedPage: page, browser }) => {
        await gotoSettings(page);

        const candidates = (await collectVisibleCheckboxes(page)).filter((row) => !isPotentiallyDestructive(row.label));
        expect(candidates.length).toBeGreaterThan(0);

        const target = candidates[0];
        let originalState: boolean | null = null;
        let toggledState: boolean | null = null;

        try {
            originalState = await readCheckboxState(page, target.selector);
            expect(originalState).not.toBeNull();

            const locator = page.locator(target.selector).first();
            await locator.click().catch(() => null);
            await persistIfNeeded(page);

            toggledState = await readCheckboxState(page, target.selector);
            expect(toggledState).not.toBeNull();
            expect(toggledState).not.toBe(originalState);

            const freshContext = await browser.newContext({
                baseURL: "http://localhost:3300",
                viewport: { width: 1440, height: 900 },
                locale: "ru-RU",
            });

            try {
                const freshPage = await freshContext.newPage();
                await ensureAuthInContext(freshPage);
                await gotoSettings(freshPage);

                const freshState = await readCheckboxState(freshPage, target.selector);
                expect(freshState, `Fresh session mismatch for checkbox: ${target.label}`).toBe(toggledState);
            } finally {
                await freshContext.close();
            }
        } finally {
            if (originalState !== null) {
                await gotoSettings(page);
                const current = await readCheckboxState(page, target.selector);
                if (current !== null && current !== originalState) {
                    const locator = page.locator(target.selector).first();
                    if (await locator.isVisible().catch(() => false)) {
                        await locator.click().catch(() => null);
                        await persistIfNeeded(page);
                    }
                }
            }
        }
    });

    test("PERS-TOGGLE-001 critical account toggles persist across API and UI reload", async ({ authedPage: page, browser }) => {
        const headers = await authHeaders(page);

        const settingsResponse = await page.request.get(`${API_BASE}/settings`, { headers });
        expect(settingsResponse.ok()).toBeTruthy();

        const settings = (await settingsResponse.json()) as {
            showPublicPackages?: boolean;
        };

        const originalShowPublicPackages = settings.showPublicPackages !== false;
        const nextValue = !originalShowPublicPackages;

        try {
            const patchResponse = await page.request.patch(`${API_BASE}/settings/account`, {
                headers,
                data: {
                    showPublicPackages: nextValue,
                },
            });
            expect(patchResponse.ok()).toBeTruthy();

            const verifyApiResponse = await page.request.get(`${API_BASE}/settings`, { headers });
            expect(verifyApiResponse.ok()).toBeTruthy();
            const verifyApiPayload = (await verifyApiResponse.json()) as { showPublicPackages?: boolean };
            expect(verifyApiPayload.showPublicPackages !== false).toBe(nextValue);

            await gotoSettings(page);
            await page.reload({ waitUntil: "domcontentloaded" });
            await page.waitForLoadState("networkidle");

            const verifyAfterReloadResponse = await page.request.get(`${API_BASE}/settings`, { headers });
            expect(verifyAfterReloadResponse.ok()).toBeTruthy();
            const verifyAfterReloadPayload = (await verifyAfterReloadResponse.json()) as { showPublicPackages?: boolean };
            expect(verifyAfterReloadPayload.showPublicPackages !== false).toBe(nextValue);

            const freshContext = await browser.newContext({
                baseURL: "http://localhost:3300",
                viewport: { width: 1440, height: 900 },
                locale: "ru-RU",
            });

            try {
                const freshPage = await freshContext.newPage();
                await ensureAuthInContext(freshPage);

                const freshToken = await getAuthToken(freshPage);
                const freshVerifyResponse = await freshPage.request.get(`${API_BASE}/settings`, {
                    headers: { Authorization: `Bearer ${freshToken}` },
                });
                expect(freshVerifyResponse.ok()).toBeTruthy();
                const freshVerifyPayload = (await freshVerifyResponse.json()) as { showPublicPackages?: boolean };
                expect(freshVerifyPayload.showPublicPackages !== false).toBe(nextValue);
            } finally {
                await freshContext.close();
            }
        } finally {
            await page.request.patch(`${API_BASE}/settings/account`, {
                headers,
                data: {
                    showPublicPackages: originalShowPublicPackages,
                },
            }).catch(() => null);
        }
    });
});
