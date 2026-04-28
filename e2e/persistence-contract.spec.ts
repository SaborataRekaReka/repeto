import { test, expect, getAuthToken, DEMO_EMAIL, DEMO_PASSWORD, loginViaUI } from "./helpers/auth";
import type { Page } from "@playwright/test";

const API_BASE = "http://127.0.0.1:3200/api";

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

async function tutorAuthHeaders(page: Page) {
    const loginResponse = await page.request.post(`${API_BASE}/auth/login`, {
        data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    expect(loginResponse.ok()).toBeTruthy();

    const loginPayload = (await loginResponse.json()) as { accessToken?: string };
    expect(typeof loginPayload.accessToken).toBe("string");

    return { Authorization: `Bearer ${loginPayload.accessToken}` };
}

async function getStableAuthHeaders(page: Page) {
    const backendSessionHeaders = await tutorAuthHeaders(page).catch(() => null);
    if (backendSessionHeaders) {
        return backendSessionHeaders;
    }

    return authHeaders(page);
}

function parseRateLimitDelayMs(headers: Record<string, string>, attempt: number) {
    const retryAfterRaw = headers["retry-after"];
    const resetRaw = headers["x-ratelimit-reset"];

    const retryAfterSeconds = Number.parseFloat(retryAfterRaw || "");
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        return Math.max(1_500, Math.ceil(retryAfterSeconds * 1000));
    }

    const resetCandidate = Number.parseFloat(resetRaw || "");
    if (Number.isFinite(resetCandidate) && resetCandidate > 0) {
        // Nest throttler may expose reset as seconds until reset or as unix timestamp.
        if (resetCandidate < 10_000) {
            return Math.max(1_500, Math.ceil(resetCandidate * 1000));
        }

        const maybeEpochMs = resetCandidate > 1_000_000_000_000 ? resetCandidate : resetCandidate * 1000;
        const deltaMs = Math.ceil(maybeEpochMs - Date.now());
        if (deltaMs > 0) return Math.max(1_500, deltaMs);
    }

    return Math.min(25_000, 2_000 * (attempt + 1));
}

async function readSettingsWithRetry(page: Page, headers: Record<string, string>) {
    let currentHeaders = headers;
    let lastStatus = -1;

    for (let attempt = 0; attempt < 14; attempt += 1) {
        const response = await page.request.get(`${API_BASE}/settings`, { headers: currentHeaders });
        lastStatus = response.status();

        if (response.ok()) {
            const payload = (await response.json().catch(() => ({}))) as {
                showPublicPackages?: boolean;
            };
            return payload;
        }

        if (response.status() === 401 || response.status() === 403 || response.status() === 404) {
            currentHeaders = await getStableAuthHeaders(page);
            await page.waitForTimeout(350 * (attempt + 1));
            continue;
        }

        if (response.status() === 429) {
            const headersMap = response.headers();
            const delayMs = parseRateLimitDelayMs(headersMap, attempt);
            await page.waitForTimeout(delayMs);
            continue;
        }

        await page.waitForTimeout(400 * (attempt + 1));
    }

    throw new Error(`Unable to read settings via API after retries (lastStatus=${lastStatus})`);
}

async function patchSettingsAccountWithRetry(
    page: Page,
    headers: Record<string, string>,
    data: Record<string, unknown>,
) {
    let currentHeaders = headers;
    let lastStatus = -1;

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await page.request.patch(`${API_BASE}/settings/account`, {
            headers: currentHeaders,
            data,
        });
        lastStatus = response.status();

        if (response.ok()) {
            return response;
        }

        if (lastStatus === 401 || lastStatus === 403 || lastStatus === 404) {
            currentHeaders = await getStableAuthHeaders(page);
            await page.waitForTimeout(350 * (attempt + 1));
            continue;
        }

        if (lastStatus === 429) {
            const delayMs = parseRateLimitDelayMs(response.headers(), attempt);
            await page.waitForTimeout(delayMs);
            continue;
        }

        if (lastStatus >= 500) {
            await page.waitForTimeout(Math.min(10_000, 700 * (attempt + 1)));
            continue;
        }

        break;
    }

    throw new Error(`Unable to patch /settings/account after retries (lastStatus=${lastStatus})`);
}

async function gotoSettings(page: Page, tab?: string) {
    const targetPath = tab ? `/settings?tab=${encodeURIComponent(tab)}` : "/settings";

    for (let attempt = 0; attempt < 2; attempt += 1) {
        await page.goto(targetPath, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(350);

        const currentUrl = page.url();
        if (/\/(auth|registration)(?:\?|#|$)/.test(currentUrl)) {
            await loginViaUI(page);
            continue;
        }

        await expect(page).toHaveURL(/\/settings(?:\?|#|$)/);

        if (tab && !new RegExp(`(?:\\?|&)tab=${tab}(?:&|$)`, "i").test(page.url())) {
            const sectionButton = page.getByRole("button", { name: new RegExp(tab, "i") }).first();
            if (await sectionButton.isVisible().catch(() => false)) {
                await sectionButton.click();
                await page.waitForTimeout(300);
            }
        }

        const readyCandidates = [
            page.getByText(/^Настройки$/i).first(),
            page.getByRole("button", { name: /Личные данные/i }).first(),
            page.getByRole("button", { name: /Интеграции/i }).first(),
            page.getByText(/Личные данные/i).first(),
            page.locator(".repeto-settings-section-card").first(),
            page.locator("main").first(),
        ];

        let ready = false;
        for (const candidate of readyCandidates) {
            if (await candidate.isVisible().catch(() => false)) {
                ready = true;
                break;
            }
        }

        expect(ready, "Settings page did not expose any known ready markers").toBeTruthy();
        return;
    }

    throw new Error(`Unable to open settings page (currentURL=${page.url()})`);
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

        const nodes = Array.from(
            document.querySelectorAll("input[type='checkbox'], [role='checkbox'], [role='switch'], [aria-checked]")
        );
        const rows: CheckboxMeta[] = [];

        for (const node of nodes) {
            const el = node as HTMLElement;

            let target: HTMLElement = el;
            if (!visible(target)) {
                let ancestor = el.parentElement;
                for (let depth = 0; depth < 6 && ancestor; depth += 1) {
                    if (visible(ancestor)) {
                        target = ancestor;
                        break;
                    }
                    ancestor = ancestor.parentElement;
                }
            }

            if (!visible(target)) continue;

            const labelFromFor =
                target.id
                    ? (document.querySelector(`label[for='${CSS.escape(target.id)}']`) as HTMLElement | null)
                    : null;

            const labelledBy = (target.getAttribute("aria-labelledby") || "")
                .split(/\s+/)
                .map((id) => id.trim())
                .filter(Boolean)
                .map((id) => document.getElementById(id)?.textContent || "")
                .join(" ")
                .trim();

            const label =
                (target.getAttribute("aria-label") || "").trim() ||
                labelledBy ||
                (labelFromFor?.textContent || "").replace(/\s+/g, " ").trim() ||
                (target.textContent || "").replace(/\s+/g, " ").trim() ||
                "checkbox";

            let checked = false;
            if (el.tagName.toLowerCase() === "input" && (el as HTMLInputElement).type === "checkbox") {
                checked = Boolean((el as HTMLInputElement).checked);
            } else {
                const switchLike =
                    target.getAttribute("role") === "switch" ||
                    el.getAttribute("role") === "switch" ||
                    target.tagName.toLowerCase() === "switch" ||
                    el.tagName.toLowerCase() === "switch";

                const ariaChecked =
                    target.getAttribute("aria-checked") ||
                    el.getAttribute("aria-checked") ||
                    (target.querySelector("[aria-checked]") as HTMLElement | null)?.getAttribute("aria-checked") ||
                    "";

                if (ariaChecked === "true" || ariaChecked === "false") {
                    checked = ariaChecked === "true";
                } else {
                    const nestedInput = target.querySelector("input[type='checkbox']") as HTMLInputElement | null;
                    if (nestedInput) {
                        checked = Boolean(nestedInput.checked);
                    } else if (target.hasAttribute("checked") || el.hasAttribute("checked")) {
                        checked = true;
                    } else if (switchLike) {
                        checked = false;
                    }
                }
            }

            rows.push({
                selector: selectorFor(target),
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

        if (el.tagName.toLowerCase() === "input" && (el as HTMLInputElement).type === "checkbox") {
            return Boolean((el as HTMLInputElement).checked);
        }

        const value = el.getAttribute("aria-checked");
        if (value === "true") return true;
        if (value === "false") return false;

        if (el.hasAttribute("checked")) return true;

        const switchLike =
            el.getAttribute("role") === "switch" ||
            el.tagName.toLowerCase() === "switch";

        const nestedChecked = (el.querySelector("input[type='checkbox']") as HTMLInputElement | null)?.checked;
        if (typeof nestedChecked === "boolean") return nestedChecked;

        const nestedAria = (el.querySelector("[aria-checked]") as HTMLElement | null)?.getAttribute("aria-checked");
        if (nestedAria === "true") return true;
        if (nestedAria === "false") return false;

        const nestedCheckedAttr = (el.querySelector("[checked]") as HTMLElement | null);
        if (nestedCheckedAttr) return true;

        if (switchLike) return false;

        return null;
    }, selector);
}

async function resolveCheckboxState(page: Page, selector: string, label: string): Promise<boolean | null> {
    const direct = await readCheckboxState(page, selector);
    if (direct !== null) return direct;

    const rows = await collectVisibleCheckboxes(page);
    const bySelector = rows.find((row) => row.selector === selector);
    if (bySelector) return bySelector.checked;

    const byLabel = rows.find((row) => row.label === label);
    return byLabel ? byLabel.checked : null;
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
        await gotoSettings(page, "notifications");

        const all = await collectVisibleCheckboxes(page);
        const candidates = all.filter((row) => !isPotentiallyDestructive(row.label)).slice(0, 8);
        expect(candidates.length).toBeGreaterThan(0);

        const changed: Array<{ selector: string; label: string; before: boolean; after: boolean }> = [];

        try {
            for (const checkbox of candidates) {
                await gotoSettings(page, "notifications");

                const locator = page.locator(checkbox.selector).first();
                const visible = await locator.isVisible().catch(() => false);
                if (!visible) continue;

                const before = await resolveCheckboxState(page, checkbox.selector, checkbox.label);
                if (before === null) continue;

                await locator.scrollIntoViewIfNeeded().catch(() => null);
                await locator.click().catch(() => null);
                await persistIfNeeded(page);

                const after = await resolveCheckboxState(page, checkbox.selector, checkbox.label);
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
                const current = await resolveCheckboxState(page, checkbox.selector, checkbox.label);
                expect(current, `Reload mismatch for checkbox: ${checkbox.label}`).toBe(checkbox.after);
            }
        } finally {
            await gotoSettings(page, "notifications");
            for (const checkbox of changed.reverse()) {
                const current = await resolveCheckboxState(page, checkbox.selector, checkbox.label);
                if (current === null || current === checkbox.before) continue;

                const locator = page.locator(checkbox.selector).first();
                if (!(await locator.isVisible().catch(() => false))) continue;
                await locator.click().catch(() => null);
                await persistIfNeeded(page);
            }
        }
    });

    test("PERS-CHECKBOX-002 checkbox state persists across fresh browser context", async ({ authedPage: page, browser }) => {
        await gotoSettings(page, "notifications");

        const baseCandidates = (await collectVisibleCheckboxes(page))
            .filter((row) => !isPotentiallyDestructive(row.label));

        const namedCandidates = baseCandidates
            .filter((row) => row.label.trim().toLowerCase() !== "checkbox");

        const candidates = (namedCandidates.length > 0 ? namedCandidates : baseCandidates).slice(0, 8);
        expect(candidates.length).toBeGreaterThan(0);

        let hasPersistentCandidate = false;

        for (const target of candidates) {
            let originalState: boolean | null = null;
            let toggledState: boolean | null = null;

            try {
                await gotoSettings(page, "notifications");

                originalState = await resolveCheckboxState(page, target.selector, target.label);
                if (originalState === null) continue;

                const locator = page.locator(target.selector).first();
                if (!(await locator.isVisible().catch(() => false))) continue;

                await locator.click().catch(() => null);
                await persistIfNeeded(page);

                toggledState = await resolveCheckboxState(page, target.selector, target.label);
                if (toggledState === null || toggledState === originalState) continue;

                const freshContext = await browser.newContext({
                    baseURL: "http://localhost:3300",
                    viewport: { width: 1440, height: 900 },
                    locale: "ru-RU",
                });

                try {
                    const freshPage = await freshContext.newPage();
                    await ensureAuthInContext(freshPage);
                    await gotoSettings(freshPage, "notifications");

                    const freshState = await resolveCheckboxState(freshPage, target.selector, target.label);
                    if (freshState === toggledState) {
                        hasPersistentCandidate = true;
                        break;
                    }
                } finally {
                    await freshContext.close();
                }
            } finally {
                if (originalState !== null) {
                    await gotoSettings(page, "notifications");
                    const current = await resolveCheckboxState(page, target.selector, target.label);
                    if (current !== null && current !== originalState) {
                        const locator = page.locator(target.selector).first();
                        if (await locator.isVisible().catch(() => false)) {
                            await locator.click().catch(() => null);
                            await persistIfNeeded(page);
                        }
                    }
                }
            }
        }

        expect(hasPersistentCandidate).toBeTruthy();
    });

    test("PERS-TOGGLE-001 critical account toggles persist across API and UI reload", async ({ authedPage: page, browser }) => {
        const headers = await getStableAuthHeaders(page);
        const settings = await readSettingsWithRetry(page, headers);

        const originalShowPublicPackages = settings.showPublicPackages !== false;
        const nextValue = !originalShowPublicPackages;

        try {
            const patchResponse = await patchSettingsAccountWithRetry(page, headers, {
                showPublicPackages: nextValue,
            });
            expect(patchResponse.ok()).toBeTruthy();

            const verifyApiPayload = await readSettingsWithRetry(page, headers);
            expect(verifyApiPayload.showPublicPackages !== false).toBe(nextValue);

            await gotoSettings(page);
            await page.reload({ waitUntil: "domcontentloaded" });
            await page.waitForLoadState("networkidle");

            const postReloadHeaders = await getStableAuthHeaders(page);
            const verifyAfterReloadPayload = await readSettingsWithRetry(page, postReloadHeaders);
            expect(verifyAfterReloadPayload.showPublicPackages !== false).toBe(nextValue);

            const freshContext = await browser.newContext({
                baseURL: "http://localhost:3300",
                viewport: { width: 1440, height: 900 },
                locale: "ru-RU",
            });

            try {
                const freshPage = await freshContext.newPage();
                await ensureAuthInContext(freshPage);
                const freshHeaders = await getStableAuthHeaders(freshPage);
                const freshVerifyPayload = await readSettingsWithRetry(freshPage, freshHeaders);
                expect(freshVerifyPayload.showPublicPackages !== false).toBe(nextValue);
            } finally {
                await freshContext.close();
            }
        } finally {
            const restoreHeaders = await getStableAuthHeaders(page).catch(() => headers);
            await patchSettingsAccountWithRetry(page, restoreHeaders, {
                showPublicPackages: originalShowPublicPackages,
            }).catch(() => null);
        }
    });
});
