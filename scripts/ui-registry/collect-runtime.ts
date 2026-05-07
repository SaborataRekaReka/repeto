import fs from "node:fs";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";

type RuntimeElement = {
  id: string;
  route: string;
  selector: string;
  tagName: string;
  role: string | null;
  textContent: string | null;
  accessibleName: string | null;
  ariaLabel: string | null;
  placeholder: string | null;
  href: string | null;
  type: string | null;
  disabled: boolean;
  visible: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  parentSectionHeading: string | null;
  testId: string | null;
  screenshotPath: string | null;
};

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(ROOT, "docs", "ui-registry");
const OUT_FILE = path.join(OUT_DIR, "runtime-elements.json");
const SCREENSHOT_DIR = path.join(OUT_DIR, "screenshots");

const FRONTEND_BASE = process.env.UI_REGISTRY_BASE_URL || "http://localhost:3300";
const BACKEND_BASE = process.env.UI_REGISTRY_API_URL || "http://127.0.0.1:3200";

const DEMO_EMAIL = String(process.env.E2E_TUTOR_EMAIL || process.env.E2E_EMAIL || "demo@repeto.ru").trim();
const DEMO_PASSWORD = String(process.env.E2E_TUTOR_PASSWORD || process.env.E2E_PASSWORD || "demo1234").trim();

async function health(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function loginViaApi(context: BrowserContext): Promise<boolean> {
  try {
    const resp = await context.request.post(`${FRONTEND_BASE}/api/auth/login`, {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      timeout: 10_000,
    });
    return resp.ok();
  } catch {
    return false;
  }
}

async function readTutorSlug(context: BrowserContext): Promise<string | null> {
  try {
    const refresh = await context.request.post(`${FRONTEND_BASE}/api/auth/refresh`, { timeout: 5000 });
    if (!refresh.ok()) return null;
    const token = await refresh.json().then((x: any) => x?.accessToken as string | undefined).catch(() => undefined);
    if (!token) return null;
    const me = await context.request.get(`${FRONTEND_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 7000,
    });
    if (!me.ok()) return null;
    const payload = await me.json().catch(() => null);
    const slug = String(payload?.slug || "").trim();
    return slug || null;
  } catch {
    return null;
  }
}

async function gotoReady(page: Page, route: string): Promise<boolean> {
  try {
    await page.goto(route, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

async function collectRouteElements(page: Page, route: string): Promise<RuntimeElement[]> {
  const rows = await page.evaluate((currentRoute) => {
    const roleTargets = ["button", "link", "menuitem", "tab", "switch", "checkbox", "radio", "dialog", "tooltip"];
    const selectors = [
      "button",
      "a[href]",
      "input",
      "textarea",
      "select",
      "form",
      "[aria-label]",
      "[role='button']",
      "[role='link']",
      "[role='menuitem']",
      "[role='tab']",
      "[role='switch']",
      "[role='checkbox']",
      "[role='radio']",
      "[role='dialog']",
      "[role='tooltip']",
      "[onclick]",
      "[tabindex]",
      "div[role]",
      "span[role]",
    ];

    const isVisible = (el: Element) => {
      const style = window.getComputedStyle(el as HTMLElement);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const rect = (el as HTMLElement).getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const cssPath = (el: Element): string => {
      const testId = el.getAttribute("data-testid");
      if (testId) return `[data-testid=\"${testId}\"]`;
      if (el.id) return `#${el.id}`;
      const parts: string[] = [];
      let cur: Element | null = el;
      while (cur && parts.length < 5) {
        const tag = cur.tagName.toLowerCase();
        const className = (cur as HTMLElement).className;
        if (className && typeof className === "string") {
          const cn = className.trim().split(/\s+/).filter(Boolean)[0];
          if (cn) {
            parts.unshift(`${tag}.${cn}`);
            cur = cur.parentElement;
            continue;
          }
        }
        const parent = cur.parentElement;
        if (!parent) {
          parts.unshift(tag);
          break;
        }
        const siblings = Array.from(parent.children).filter((x) => x.tagName === cur!.tagName);
        const idx = siblings.indexOf(cur) + 1;
        parts.unshift(`${tag}:nth-of-type(${idx})`);
        cur = parent;
      }
      return parts.join(" > ");
    };

    const headingFor = (el: Element): string | null => {
      let cur: Element | null = el;
      for (let i = 0; i < 6 && cur; i += 1) {
        const scope = cur.closest("section,article,main,aside,nav,div") || cur;
        const heading = scope.querySelector("h1, h2, h3, h4, h5, h6");
        if (heading?.textContent?.trim()) return heading.textContent.trim();
        cur = cur.parentElement;
      }
      return null;
    };

    const accessName = (el: Element): string | null => {
      const aria = el.getAttribute("aria-label");
      if (aria?.trim()) return aria.trim();
      const labelledBy = el.getAttribute("aria-labelledby");
      if (labelledBy) {
        const fromIds = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim())
          .filter(Boolean)
          .join(" ")
          .trim();
        if (fromIds) return fromIds;
      }
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (txt) return txt;
      const title = el.getAttribute("title");
      if (title?.trim()) return title.trim();
      const placeholder = (el as HTMLInputElement).placeholder;
      if (placeholder?.trim()) return placeholder.trim();
      return null;
    };

    const set = new Set<Element>();
    selectors.forEach((s) => document.querySelectorAll(s).forEach((el) => set.add(el)));

    return Array.from(set).map((el, idx) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const role = el.getAttribute("role");
      const tagName = el.tagName.toLowerCase();
      const disabled = (el as HTMLInputElement).disabled || el.getAttribute("aria-disabled") === "true";
      const record = {
        id: `runtime.${currentRoute.replace(/[^a-z0-9]+/gi, "-")}.${idx}`,
        route: currentRoute,
        selector: cssPath(el),
        tagName,
        role,
        textContent: (el.textContent || "").replace(/\s+/g, " ").trim() || null,
        accessibleName: accessName(el),
        ariaLabel: el.getAttribute("aria-label"),
        placeholder: (el as HTMLInputElement).placeholder || null,
        href: (el as HTMLAnchorElement).getAttribute("href"),
        type: (el as HTMLInputElement).type || null,
        disabled,
        visible: isVisible(el),
        boundingBox: Number.isFinite(rect.width)
          ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
          : null,
        parentSectionHeading: headingFor(el),
        testId: el.getAttribute("data-testid"),
        screenshotPath: null,
      };
      if (record.role && !roleTargets.includes(record.role)) {
        record.role = null;
      }
      return record;
    });
  }, route);

  const important = rows.filter((x) => x.visible && (["button", "a", "input", "textarea", "select"].includes(x.tagName) || !!x.role));
  let shotCounter = 0;
  for (const item of important) {
    if (item.accessibleName || item.ariaLabel) continue;
    if (shotCounter >= 40) break;
    try {
      const loc = page.locator(item.selector).first();
      if (await loc.count()) {
        const fileName = `missing-name-${slug(item.route)}-${shotCounter + 1}.png`;
        const full = path.join(SCREENSHOT_DIR, fileName);
        await loc.screenshot({ path: full });
        item.screenshotPath = `docs/ui-registry/screenshots/${fileName}`;
        shotCounter += 1;
      }
    } catch {
      // ignore unstable selectors
    }
  }

  return rows;
}

function slug(v: string): string {
  return v.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "route";
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const frontendUp = await health(`${FRONTEND_BASE}/auth?view=signin`);
  const backendUp = await health(`${BACKEND_BASE}/api/health`).catch(() => false);

  if (!frontendUp) {
    fs.writeFileSync(
      OUT_FILE,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          source: "runtime",
          incomplete: true,
          reasons: [
            `Frontend is unreachable at ${FRONTEND_BASE}. Start frontend on port 3300 and backend on port 3200, then rerun npm run ui-registry:runtime.`,
          ],
          routesAttempted: [],
          routesSucceeded: [],
          routesFailed: [],
          elements: [],
        },
        null,
        2,
      ),
      "utf8",
    );
    console.log("[ui-registry] runtime incomplete: frontend unavailable");
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const authContext = await browser.newContext({ baseURL: FRONTEND_BASE, viewport: { width: 1440, height: 1000 } });
  const publicContext = await browser.newContext({ baseURL: FRONTEND_BASE, viewport: { width: 1440, height: 1000 } });

  const loggedIn = await loginViaApi(authContext);
  const tutorSlug = loggedIn ? await readTutorSlug(authContext) : null;

  const routeEntries: Array<{ route: string; authed: boolean }> = [
    { route: "/auth?view=signin", authed: false },
    { route: "/auth?view=student", authed: false },
    { route: "/dashboard", authed: true },
    { route: "/students", authed: true },
    { route: "/schedule", authed: true },
    { route: "/finance", authed: true },
    { route: "/payments", authed: true },
    { route: "/packages", authed: true },
    { route: "/files", authed: true },
    { route: "/notifications", authed: true },
    { route: "/settings", authed: true },
    { route: "/support", authed: true },
    { route: "/student", authed: false },
  ];

  if (tutorSlug) {
    routeEntries.push({ route: `/t/${tutorSlug}`, authed: true });
    routeEntries.push({ route: `/t/${tutorSlug}/book`, authed: true });
  } else {
    routeEntries.push({ route: "/t/{slug}", authed: false });
    routeEntries.push({ route: "/t/{slug}/book", authed: false });
  }

  const routesAttempted: string[] = [];
  const routesSucceeded: string[] = [];
  const routesFailed: Array<{ route: string; reason: string }> = [];
  const elements: RuntimeElement[] = [];

  for (const entry of routeEntries) {
    routesAttempted.push(entry.route);

    if (entry.route.includes("{slug}")) {
      routesFailed.push({ route: entry.route, reason: "Tutor slug is unavailable for current auth state" });
      continue;
    }

    const context = entry.authed ? authContext : publicContext;
    const page = await context.newPage();
    const ok = await gotoReady(page, entry.route);
    if (!ok) {
      routesFailed.push({ route: entry.route, reason: "Navigation failed or timed out" });
      await page.close();
      continue;
    }

    const collected = await collectRouteElements(page, entry.route);
    elements.push(...collected);
    routesSucceeded.push(entry.route);
    await page.close();
  }

  await authContext.close();
  await publicContext.close();
  await browser.close();

  const incomplete = routesFailed.length > 0 || !backendUp || !loggedIn;
  const reasons: string[] = [];
  if (!backendUp) reasons.push(`Backend health check did not confirm availability at ${BACKEND_BASE}`);
  if (!loggedIn) reasons.push("Authed runtime crawl could not authenticate with demo credentials/API");
  if (routesFailed.length) reasons.push(`Some routes failed: ${routesFailed.map((x) => x.route).join(", ")}`);

  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "runtime",
        incomplete,
        reasons,
        routesAttempted,
        routesSucceeded,
        routesFailed,
        tutorSlug,
        elementsCount: elements.length,
        elements,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`[ui-registry] runtime complete: ${elements.length} elements, ${routesSucceeded.length}/${routesAttempted.length} routes`);
}

main().catch((error) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "runtime",
        incomplete: true,
        reasons: [String(error?.message || error)],
        routesAttempted: [],
        routesSucceeded: [],
        routesFailed: [],
        elements: [],
      },
      null,
      2,
    ),
    "utf8",
  );
  console.error(error);
  process.exitCode = 1;
});
