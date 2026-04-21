import { test, expect, getAuthToken } from "./helpers/auth";
import type { Page } from "@playwright/test";

type ControlKind = "button" | "checkbox" | "link";

type ControlMeta = {
    selector: string;
    kind: ControlKind;
    label: string;
    href?: string;
};

type UiFingerprint = {
    url: string;
    dialogs: number;
    alerts: number;
    checked: string;
    expanded: string;
    pressed: string;
    selected: string;
    visible: boolean;
};

type RouteManifest = {
    id: string;
    path: string;
    readySelector: string;
};

const AUTHED_ROUTES: RouteManifest[] = [
    {
        id: "CTRL-DASH-001",
        path: "/dashboard",
        readySelector: ".repeto-dashboard-grid, .repeto-platform-access-alert",
    },
    {
        id: "CTRL-STUD-001",
        path: "/students",
        readySelector: ".page-overlay__title",
    },
    {
        id: "CTRL-SCHED-001",
        path: "/schedule",
        readySelector: ".repeto-schedule-toolbar",
    },
    {
        id: "CTRL-FIN-001",
        path: "/finance",
        readySelector: ".repeto-finance-overview-row, .page-overlay__title",
    },
    {
        id: "CTRL-PAY-001",
        path: "/payments",
        readySelector: ".page-overlay__title",
    },
    {
        id: "CTRL-PKG-001",
        path: "/packages",
        readySelector: ".page-overlay__title",
    },
    {
        id: "CTRL-FILES-001",
        path: "/files",
        readySelector: ".page-overlay__title",
    },
    {
        id: "CTRL-NOTIF-001",
        path: "/notifications",
        readySelector: ".repeto-notifications-toolbar",
    },
    {
        id: "CTRL-SET-001",
        path: "/settings",
        readySelector: ".repeto-settings-layout",
    },
    {
        id: "CTRL-SUP-001",
        path: "/support",
        readySelector: "input[placeholder*='Поиск'], .repeto-top-header",
    },
];

const PUBLIC_ROUTES: RouteManifest[] = [
    {
        id: "CTRL-AUTH-001",
        path: "/auth?view=signin",
        readySelector: "form",
    },
    {
        id: "CTRL-AUTH-002",
        path: "/auth?view=student",
        readySelector: "form",
    },
];

function isPotentiallyDestructive(label: string) {
    const low = label.toLowerCase();
    return [
        "удал",
        "архив",
        "отвяз",
        "reject",
        "delete",
        "remove",
        "unlink",
    ].some((needle) => low.includes(needle));
}

function isExternalHref(href?: string) {
    if (!href) return false;
    return /^https?:\/\//i.test(href) && !href.includes("localhost") && !href.includes("127.0.0.1");
}

async function gotoRoute(page: Page, path: string, readySelector: string) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator(readySelector).first()).toBeVisible();
}

async function readTutorSlug(page: Page): Promise<string | null> {
    try {
        const token = await getAuthToken(page);
        const response = await page.request.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok()) return null;
        const me = await response.json();
        const slug = String(me?.slug || "").trim();
        return slug.length > 0 ? slug : null;
    } catch {
        return null;
    }
}

async function collectControls(page: Page): Promise<ControlMeta[]> {
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
            document.querySelectorAll(
                "button, a[href], input[type='checkbox'], [role='button'], [role='checkbox']"
            )
        );

        const rows: ControlMeta[] = [];

        for (const node of nodes) {
            if (!visible(node)) continue;

            const el = node as HTMLElement;
            const role = (el.getAttribute("role") || "").toLowerCase();
            const tag = el.tagName.toLowerCase();
            const inputType = tag === "input" ? ((el as HTMLInputElement).type || "") : "";

            const disabledAttr =
                el.getAttribute("aria-disabled") === "true" ||
                ("disabled" in el && Boolean((el as HTMLButtonElement | HTMLInputElement).disabled));
            if (disabledAttr) continue;

            const kind: ControlKind =
                inputType === "checkbox" || role === "checkbox"
                    ? "checkbox"
                    : tag === "a"
                        ? "link"
                        : "button";

            const label =
                (el.getAttribute("aria-label") || "").trim() ||
                (el.textContent || "").replace(/\s+/g, " ").trim() ||
                `${tag}:${role || "control"}`;

            const href = tag === "a" ? (el as HTMLAnchorElement).getAttribute("href") || undefined : undefined;

            rows.push({
                selector: selectorFor(el),
                kind,
                label: label.slice(0, 120),
                href,
            });
        }

        const unique = new Map<string, ControlMeta>();
        for (const row of rows) {
            if (!unique.has(row.selector)) {
                unique.set(row.selector, row);
            }
        }

        return Array.from(unique.values());
    });
}

async function readFingerprint(page: Page, selector: string): Promise<UiFingerprint> {
    return page.evaluate((inputSelector) => {
        const element = document.querySelector(inputSelector) as HTMLElement | null;
        const input = element as HTMLInputElement | null;

        let checked = "";
        if (input && input.tagName.toLowerCase() === "input" && input.type === "checkbox") {
            checked = String(input.checked);
        } else if (element) {
            checked = String(element.getAttribute("aria-checked") || "");
        }

        const style = element ? window.getComputedStyle(element) : null;
        const rect = element ? element.getBoundingClientRect() : null;
        const visible = Boolean(
            element &&
                style &&
                rect &&
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                style.opacity !== "0" &&
                rect.width > 0 &&
                rect.height > 0
        );

        return {
            url: window.location.pathname + window.location.search + window.location.hash,
            dialogs: document.querySelectorAll("[role='dialog'], .g-dialog, .modal").length,
            alerts: document.querySelectorAll("[role='alert'], .g-alert, .Toastify__toast").length,
            checked,
            expanded: String(element?.getAttribute("aria-expanded") || ""),
            pressed: String(element?.getAttribute("aria-pressed") || ""),
            selected: String(element?.getAttribute("aria-selected") || ""),
            visible,
        };
    }, selector);
}

function hasVisibleEffect(before: UiFingerprint, after: UiFingerprint) {
    return (
        before.url !== after.url ||
        before.dialogs !== after.dialogs ||
        before.alerts !== after.alerts ||
        before.checked !== after.checked ||
        before.expanded !== after.expanded ||
        before.pressed !== after.pressed ||
        before.selected !== after.selected ||
        before.visible !== after.visible
    );
}

async function closeTransientUi(page: Page) {
    await page.keyboard.press("Escape").catch(() => null);

    const closeRegexes = [/^Отмена$/i, /^Закрыть$/i, /^Close$/i, /^Cancel$/i];
    for (const name of closeRegexes) {
        const button = page.getByRole("button", { name }).first();
        if (await button.isVisible().catch(() => false)) {
            await button.click().catch(() => null);
        }
    }
}

async function assertControlsProduceUiEffect(page: Page, route: RouteManifest) {
    await gotoRoute(page, route.path, route.readySelector);

    const controls = await collectControls(page);
    expect(controls.length).toBeGreaterThan(0);

    const failures: string[] = [];
    const skipped: string[] = [];

    for (const control of controls) {
        if (isExternalHref(control.href)) {
            skipped.push(`${control.label} -> external`);
            continue;
        }

        if (isPotentiallyDestructive(control.label)) {
            skipped.push(`${control.label} -> destructive safety skip`);
            continue;
        }

        await gotoRoute(page, route.path, route.readySelector);

        const locator = page.locator(control.selector).first();
        const isVisible = await locator.isVisible().catch(() => false);
        if (!isVisible) {
            skipped.push(`${control.label} -> not visible after reset`);
            continue;
        }

        const before = await readFingerprint(page, control.selector);

        await locator.scrollIntoViewIfNeeded().catch(() => null);
        await locator.click({ timeout: 5000 }).catch(() => null);
        await page.waitForTimeout(250);

        const after = await readFingerprint(page, control.selector).catch(async () => {
            return {
                ...(await readFingerprint(page, "body")),
                visible: false,
            } as UiFingerprint;
        });

        const changed = hasVisibleEffect(before, after);
        if (!changed) {
            failures.push(`${control.kind} | ${control.label} | ${control.selector}`);
        }

        await closeTransientUi(page);
    }

    expect(
        failures,
        `${route.id}: controls without visible UI effect\n${failures.join("\n")}`
    ).toEqual([]);

    test.info().annotations.push({
        type: "coverage",
        description: `${route.id}: checked=${controls.length - skipped.length}, skipped=${skipped.length}`,
    });
}

test.describe("Controls Contract Coverage", () => {
    test.describe.configure({ mode: "serial" });
    test.setTimeout(240_000);

    for (const route of AUTHED_ROUTES) {
        test(`${route.id} each visible control has UI effect`, async ({ authedPage: page }) => {
            await assertControlsProduceUiEffect(page, route);
        });
    }

    test("CTRL-PUBLIC-001 public tutor controls have UI effect", async ({ authedPage: page }) => {
        const slug = await readTutorSlug(page);
        test.skip(!slug, "Current tutor has no public slug.");

        await assertControlsProduceUiEffect(page, {
            id: "CTRL-PUBLIC-001",
            path: `/t/${slug}`,
            readySelector: ".repeto-tp-page",
        });
    });

    test("CTRL-BOOK-001 booking controls have UI effect", async ({ authedPage: page }) => {
        const slug = await readTutorSlug(page);
        test.skip(!slug, "Current tutor has no public slug.");

        await assertControlsProduceUiEffect(page, {
            id: "CTRL-BOOK-001",
            path: `/t/${slug}/book`,
            readySelector: ".repeto-bk-step, .repeto-bk-loading",
        });
    });

    for (const route of PUBLIC_ROUTES) {
        test(`${route.id} auth controls have UI effect`, async ({ page }) => {
            await page.context().clearCookies();
            await assertControlsProduceUiEffect(page, route);
        });
    }

    test("CTRL-CHECKBOX-001 each visible checkbox toggles", async ({ authedPage: page }) => {
        const route = {
            id: "CTRL-CHECKBOX-001",
            path: "/settings",
            readySelector: ".repeto-settings-layout",
        };
        await gotoRoute(page, route.path, route.readySelector);

        const controls = (await collectControls(page)).filter((row) => row.kind === "checkbox");
        expect(controls.length).toBeGreaterThan(0);

        const failures: string[] = [];

        for (const control of controls) {
            await gotoRoute(page, route.path, route.readySelector);
            const locator = page.locator(control.selector).first();
            if (!(await locator.isVisible().catch(() => false))) continue;

            const before = await readFingerprint(page, control.selector);
            await locator.click().catch(() => null);
            await page.waitForTimeout(200);
            const after = await readFingerprint(page, control.selector);

            if (before.checked === after.checked) {
                failures.push(`${control.label} | ${control.selector}`);
            }
        }

        expect(failures, `Checkboxes without state change\n${failures.join("\n")}`).toEqual([]);
    });
});
