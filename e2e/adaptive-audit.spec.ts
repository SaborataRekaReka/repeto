import fs from "fs";
import path from "path";
import type { Page, TestInfo } from "@playwright/test";
import { test, expect, getAuthToken, loginViaAPI, loginViaUI } from "./helpers/auth";

type AuditSeverity = "critical" | "major" | "minor";
type AuditContext = "authed" | "guest" | "student-only";

type ViewportPreset = {
  id: "mobile" | "tablet";
  width: number;
  height: number;
};

type RouteTemplate = {
  id: string;
  template: string;
  context: AuditContext;
};

type ResolvedRoute = {
  id: string;
  template: string;
  path: string;
  context: AuditContext;
};

type RawIssue = {
  label: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

type AuditMetrics = {
  horizontalOverflowPx: number;
  offscreenInteractive: RawIssue[];
  tinyTapTargets: RawIssue[];
  tinyCriticalCtas: RawIssue[];
  fixedOverlaps: RawIssue[];
  modalOverflows: RawIssue[];
  dropdownOverflows: RawIssue[];
  tableOverflows: RawIssue[];
  cls: number;
};

type DefectRecord = {
  routeId: string;
  routeTemplate: string;
  routePath: string;
  finalUrl: string;
  viewport: string;
  severity: AuditSeverity;
  category: string;
  description: string;
  screenshot: string;
};

type RouteRunResult = {
  routeId: string;
  template: string;
  path: string;
  context: AuditContext;
  viewport: string;
  finalUrl: string;
  statusCode: number | null;
  screenshot: string;
  notes: string[];
  defectCount: number;
  majorOrCriticalCount: number;
};

const VIEWPORTS: ViewportPreset[] = [
  { id: "mobile", width: 390, height: 844 },
  { id: "tablet", width: 834, height: 1112 },
];

const AUTH_ROUTE_RE = /\/(auth|registration|login)(?:\?|#|$)/i;
const IMPORTANT_CTA_RE =
  /^\s*(сохран|созда|добав|запис|продолж|войти|подтверд|оплат(?!ы)|book|save|submit|pay)\b/i;

const DEFAULT_QUERY_BY_ROUTE: Record<string, string> = {
  "/auth": "view=signin",
  "/support/article": "id=start-1",
  "/support/search-result": "q=start",
};

const FAST_MODE = String(process.env.E2E_ADAPTIVE_FAST || "").trim() === "1";
const SKIP_OVERLAY_PROBE = String(process.env.E2E_ADAPTIVE_SKIP_OVERLAY || "").trim() === "1";
const OVERLAY_PROBE_ALL_VIEWPORTS =
  String(process.env.E2E_ADAPTIVE_OVERLAY_ALL_VIEWPORTS || "").trim() === "1";
const ROUTE_GREP_RAW = String(process.env.E2E_ADAPTIVE_ROUTE_GREP || "").trim();
const ROUTE_GREP = ROUTE_GREP_RAW.length > 0 ? new RegExp(ROUTE_GREP_RAW, "i") : null;
const MAX_ROUTES = Number(String(process.env.E2E_ADAPTIVE_MAX_ROUTES || "").trim());
const SHARD_TOTAL_RAW = Number(String(process.env.E2E_ADAPTIVE_SHARD_TOTAL || "").trim());
const SHARD_INDEX_RAW = Number(String(process.env.E2E_ADAPTIVE_SHARD_INDEX || "").trim());
const SHARD_TOTAL = Number.isFinite(SHARD_TOTAL_RAW) && SHARD_TOTAL_RAW >= 1 ? Math.floor(SHARD_TOTAL_RAW) : 1;
const SHARD_INDEX =
  Number.isFinite(SHARD_INDEX_RAW) && SHARD_INDEX_RAW >= 1 && SHARD_INDEX_RAW <= SHARD_TOTAL
    ? Math.floor(SHARD_INDEX_RAW)
    : 1;

const GOTO_TIMEOUT_MS = FAST_MODE ? 12_000 : 15_000;
const NETWORKIDLE_TIMEOUT_MS = FAST_MODE ? 1200 : 3500;
const POST_NAV_PAUSE_MS = FAST_MODE ? 30 : 80;
const OVERLAY_CLICK_SETTLE_MS = FAST_MODE ? 90 : 220;
const OVERLAY_CLOSE_SETTLE_MS = FAST_MODE ? 60 : 120;
const OVERLAY_CLICK_TIMEOUT_MS = FAST_MODE ? 650 : 1400;
const AUDIT_TEST_TIMEOUT_MS = FAST_MODE ? 1_200_000 : 2_400_000;

function sanitizeFileSegment(value: string): string {
  return (
    value
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "route"
  );
}

function classifyRouteContext(template: string): AuditContext {
  const pathPart = template.split("?")[0] || template;
  if (/^\/student(?:\/|$)/i.test(pathPart)) return "student-only";
  if (
    /^\/(auth|login|registration|legal)(?:\/|$)/i.test(pathPart) ||
    /^\/t\//i.test(pathPart)
  ) {
    return "guest";
  }
  return "authed";
}

function pageFileToTemplate(pagesDir: string, filePath: string): string | null {
  const relative = path.relative(pagesDir, filePath).replace(/\\/g, "/");
  if (!relative || relative.startsWith("api/")) return null;
  if (/^_app\.|^_document\.|^_error\./i.test(path.basename(relative))) return null;

  let route = relative.replace(/\.(tsx|ts|jsx|js)$/i, "");
  route = route.replace(/\/index$/i, "");
  if (route === "index") route = "";

  const withLeadingSlash = `/${route}`.replace(/\/+/g, "/");
  const template = withLeadingSlash.replace(/\[\.\.\.([^\]]+)\]/g, ":$1").replace(/\[([^\]]+)\]/g, ":$1");
  return template || "/";
}

function discoverRouteTemplates(): RouteTemplate[] {
  const pagesDir = path.resolve(process.cwd(), "frontend-gravity/pages");
  const stack: string[] = [pagesDir];
  const templates: RouteTemplate[] = [];
  const unique = new Set<string>();

  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;

    const children = fs.readdirSync(dir, { withFileTypes: true });
    for (const child of children) {
      const absolutePath = path.join(dir, child.name);
      if (child.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (!/\.(tsx|ts|jsx|js)$/i.test(child.name)) continue;
      const template = pageFileToTemplate(pagesDir, absolutePath);
      if (!template || unique.has(template)) continue;

      unique.add(template);
      templates.push({
        id: sanitizeFileSegment(template === "/" ? "root" : template.replace(/[/?=&:]/g, "-")),
        template,
        context: classifyRouteContext(template),
      });
    }
  }

  templates.push({ id: "auth-student", template: "/auth?view=student", context: "guest" });

  return templates.sort((a, b) => a.template.localeCompare(b.template));
}

function applyDefaultQuery(pathValue: string): string {
  const pathPart = pathValue.split("?")[0] || pathValue;
  if (pathValue.includes("?")) return pathValue;

  const defaultQuery = DEFAULT_QUERY_BY_ROUTE[pathPart];
  if (!defaultQuery) return pathValue;

  return `${pathValue}?${defaultQuery}`;
}

function resolveTemplatePath(
  template: string,
  params: Record<string, string | null | undefined>,
): string | null {
  if (!template.includes(":")) return applyDefaultQuery(template);

  let unresolved = false;
  const resolved = template.replace(/:([a-zA-Z0-9_]+)/g, (_match, key: string) => {
    const value = params[key];
    if (!value) {
      unresolved = true;
      return `__missing_${key}__`;
    }
    return encodeURIComponent(value);
  });

  if (unresolved) return null;
  return applyDefaultQuery(resolved);
}

async function hasTutorSession(page: Page): Promise<boolean> {
  try {
    const response = await page.request.post("/api/auth/refresh", { timeout: 5000 });
    if (!response.ok()) return false;
    const payload = await response.json().catch(() => null);
    return Boolean(payload?.accessToken);
  } catch {
    return false;
  }
}

async function ensureTutorSession(page: Page) {
  if (await hasTutorSession(page)) return;

  const viaApi = await loginViaAPI(page);
  if (!viaApi) {
    await loginViaUI(page);
  }
}

async function clearSession(page: Page) {
  await page.context().clearCookies();

  await page.goto("http://localhost:3300", { waitUntil: "domcontentloaded" }).catch(() => null);
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore storage errors
    }
    try {
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }
  });
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

async function readFirstStudentId(page: Page): Promise<string | null> {
  try {
    const token = await getAuthToken(page);
    const response = await page.request.get("/api/students?limit=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok()) return null;

    const payload = await response.json();
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const id = rows.length > 0 ? String(rows[0]?.id || "").trim() : "";
    return id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

async function installClsTracker(page: Page) {
  await page.addInitScript(() => {
    // @ts-ignore
    window.__repetoCls = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const shift = entry as any;
          if (shift?.hadRecentInput) continue;
          // @ts-ignore
          window.__repetoCls = Number(window.__repetoCls || 0) + Number(shift?.value || 0);
        }
      });

      observer.observe({ type: "layout-shift", buffered: true });
    } catch {
      // ignore browser support issues
    }
  });
}

async function dismissCookieConsentIfPresent(page: Page) {
  const consentButtons = [
    page.locator("button", { hasText: /^Согласен$/i }).first(),
    page.locator("button", { hasText: /^Принять(?:\s+все)?$/i }).first(),
    page.locator("button", { hasText: /^Accept(?:\s+all)?$/i }).first(),
  ];

  for (const button of consentButtons) {
    const visible = await button.isVisible().catch(() => false);
    if (!visible) continue;

    await button.click().catch(() => null);
    await page.waitForTimeout(POST_NAV_PAUSE_MS);
    break;
  }

  await page.keyboard.press("Escape").catch(() => null);
}

async function resetClsCounter(page: Page) {
  await page.evaluate(() => {
    // @ts-ignore
    window.__repetoCls = 0;
  }).catch(() => null);
}

async function collectMetrics(page: Page): Promise<AuditMetrics> {
  return page.evaluate((importantCtaPattern) => {
    const importantCta = new RegExp(importantCtaPattern, "i");
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const root = document.scrollingElement || document.documentElement;
    const body = document.body;

    const maxScrollWidth = Math.max(
      Number(root?.scrollWidth || 0),
      Number(document.documentElement.scrollWidth || 0),
      Number(body?.scrollWidth || 0),
    );

    const horizontalOverflowPx = Math.max(0, maxScrollWidth - vw);

    const hasHorizontalScrollableAncestor = (element: Element) => {
      let current = (element as HTMLElement).parentElement;

      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const allowsHorizontalScroll = style.overflowX === "auto" || style.overflowX === "scroll";

        if (allowsHorizontalScroll && current.scrollWidth > current.clientWidth + 2) {
          return true;
        }

        current = current.parentElement;
      }

      return false;
    };

    const isVisible = (element: Element) => {
      const node = element as HTMLElement;
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") {
        return false;
      }
      if (Number(style.opacity || "1") <= 0.01) return false;

      const rect = node.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;
      if (rect.bottom < 0 || rect.top > vh) return false;
      return true;
    };

    const labelOf = (element: Element) => {
      const node = element as HTMLElement;
      const direct =
        node.getAttribute("aria-label") ||
        node.getAttribute("title") ||
        // @ts-ignore
        node.placeholder ||
        node.innerText ||
        node.textContent ||
        "";

      return String(direct || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 90);
    };

    const toIssue = (element: Element) => {
      const rect = (element as HTMLElement).getBoundingClientRect();
      return {
        label: labelOf(element),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };

    const isActionControl = (element: Element) => {
      const node = element as HTMLElement;
      const tag = String(node.tagName || "").toLowerCase();
      const role = String(node.getAttribute("role") || "").toLowerCase();

      if (tag === "button") return true;
      if (tag === "input") {
        const inputType = String((node as HTMLInputElement).type || "").toLowerCase();
        return inputType === "button" || inputType === "submit" || inputType === "reset";
      }

      if (role === "button") return true;
      return false;
    };

    const interactiveSelector =
      "button, a[href], input:not([type='hidden']), select, textarea, [role='button'], [role='link'], [role='tab'], [role='menuitem'], [role='combobox'], [aria-haspopup]";

    const interactiveNodes = Array.from(document.querySelectorAll(interactiveSelector)).slice(0, 900);
    const visibleInteractive: Array<{ element: Element; issue: RawIssue }> = [];

    for (const node of interactiveNodes) {
      if (!isVisible(node)) continue;
      visibleInteractive.push({ element: node, issue: toIssue(node) });
    }

    const offscreenInteractive: RawIssue[] = [];
    const tinyTapTargets: RawIssue[] = [];
    const tinyCriticalCtas: RawIssue[] = [];

    for (const entry of visibleInteractive) {
      const issue = entry.issue;

      if (issue.left < -1 || issue.right > vw + 1) {
        if (!hasHorizontalScrollableAncestor(entry.element)) {
          offscreenInteractive.push(issue);
        }
      }

      const tooSmall = issue.width < 44 || issue.height < 44;
      if (tooSmall) {
        tinyTapTargets.push(issue);
        if (importantCta.test(issue.label) && isActionControl(entry.element)) {
          tinyCriticalCtas.push(issue);
        }
      }
    }

    const fixedCandidates: Array<{ element: Element; rect: DOMRect }> = [];
    const allNodes = Array.from(document.querySelectorAll("body *")).slice(0, 3000);

    for (const node of allNodes) {
      if (!isVisible(node)) continue;

      const style = window.getComputedStyle(node as HTMLElement);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      if (Number(style.opacity || "1") <= 0.01) continue;

      const rect = (node as HTMLElement).getBoundingClientRect();
      if (rect.width < 40 || rect.height < 28) continue;
      fixedCandidates.push({ element: node, rect });
      if (fixedCandidates.length >= 60) break;
    }

    const fixedOverlaps: RawIssue[] = [];
    const ctas = visibleInteractive
      .filter((entry) => importantCta.test(entry.issue.label) && isActionControl(entry.element))
      .slice(0, 120);

    for (const cta of ctas) {
      for (const fixed of fixedCandidates) {
        const ctaElement = cta.element;
        if (fixed.element === ctaElement) continue;
        if (fixed.element.contains(ctaElement) || ctaElement.contains(fixed.element)) continue;

        const fixedNode = fixed.element as HTMLElement;
        const fixedClassName =
          typeof fixedNode.className === "string"
            ? fixedNode.className
            : String((fixedNode.className as any)?.baseVal || "");
        const isBottomNavOverlay =
          /repeto-mobile-nav|repeto-mobile-fab-wrap|repeto-mobile-fab|page-overlay__fab-wrap/i.test(fixedClassName);

        if (isBottomNavOverlay) continue;

        const left = Math.max(cta.issue.left, fixed.rect.left);
        const right = Math.min(cta.issue.right, fixed.rect.right);
        const top = Math.max(cta.issue.top, fixed.rect.top);
        const bottom = Math.min(cta.issue.bottom, fixed.rect.bottom);

        const width = right - left;
        const height = bottom - top;
        if (width <= 0 || height <= 0) continue;

        const overlapRatio = (width * height) / Math.max(1, cta.issue.width * cta.issue.height);
        if (overlapRatio >= 0.25) {
          fixedOverlaps.push(cta.issue);
          break;
        }
      }
    }

    const modalSelectors = "[role='dialog'], [aria-modal='true'], .g-modal, .modal, .repeto-modal";
    const modalNodes = Array.from(document.querySelectorAll(modalSelectors)).slice(0, 20);
    const modalOverflows: RawIssue[] = [];

    for (const modal of modalNodes) {
      if (!isVisible(modal)) continue;
      const issue = toIssue(modal);
      const overflowsViewport =
        issue.left < -1 ||
        issue.right > vw + 1 ||
        issue.top < -1 ||
        issue.bottom > vh + 1;

      const node = modal as HTMLElement;
      const contentOverflow = node.scrollWidth - node.clientWidth > 2;
      if (overflowsViewport || contentOverflow) {
        modalOverflows.push(issue);
      }
    }

    const dropdownSelectors =
      "[role='listbox'], [role='menu'], .g-popup, .g-popover, .g-select-popup, .g-menu";
    const dropdownNodes = Array.from(document.querySelectorAll(dropdownSelectors)).slice(0, 30);
    const dropdownOverflows: RawIssue[] = [];

    for (const dropdown of dropdownNodes) {
      if (!isVisible(dropdown)) continue;
      const issue = toIssue(dropdown);
      if (issue.width < 20 || issue.height < 20) continue;

      const overflowsViewport =
        issue.left < -1 ||
        issue.right > vw + 1 ||
        issue.top < -1 ||
        issue.bottom > vh + 1;

      if (overflowsViewport) {
        dropdownOverflows.push(issue);
      }
    }

    const tables = Array.from(document.querySelectorAll("table")).slice(0, 30);
    const tableOverflows: RawIssue[] = [];

    for (const table of tables) {
      if (!isVisible(table)) continue;

      const rect = (table as HTMLElement).getBoundingClientRect();
      if (rect.width <= vw + 2) continue;

      let hasScrollableAncestor = false;
      let current = (table as HTMLElement).parentElement;

      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        if (
          (style.overflowX === "auto" || style.overflowX === "scroll") &&
          current.scrollWidth > current.clientWidth + 2
        ) {
          hasScrollableAncestor = true;
          break;
        }
        current = current.parentElement;
      }

      if (!hasScrollableAncestor) {
        tableOverflows.push(toIssue(table));
      }
    }

    // @ts-ignore
    const cls = Number(window.__repetoCls || 0);

    return {
      horizontalOverflowPx: Number(horizontalOverflowPx.toFixed(2)),
      offscreenInteractive: offscreenInteractive.slice(0, 20),
      tinyTapTargets: tinyTapTargets.slice(0, 40),
      tinyCriticalCtas: tinyCriticalCtas.slice(0, 20),
      fixedOverlaps: fixedOverlaps.slice(0, 15),
      modalOverflows: modalOverflows.slice(0, 15),
      dropdownOverflows: dropdownOverflows.slice(0, 15),
      tableOverflows: tableOverflows.slice(0, 15),
      cls: Number(cls.toFixed(4)),
    };
  }, IMPORTANT_CTA_RE.source);
}

async function safePagePause(page: Page, timeoutMs: number) {
  if (page.isClosed()) return;
  await page.waitForTimeout(timeoutMs).catch(() => null);
}

async function runOverlayProbe(page: Page): Promise<{ opened: boolean; metrics: AuditMetrics | null }> {
  if (page.isClosed()) {
    return { opened: false, metrics: null };
  }

  let openedModal = false;
  let openedDropdown = false;

  const modalTrigger = page
    .locator("button")
    .filter({ hasText: /нов|созда|добав|запис|оплат|редакт/i })
    .first();

  if ((await modalTrigger.count()) > 0) {
    const canClick =
      (await modalTrigger.isVisible().catch(() => false)) &&
      !(await modalTrigger.isDisabled().catch(() => false));

    if (canClick) {
      await modalTrigger.click({ timeout: OVERLAY_CLICK_TIMEOUT_MS }).catch(() => null);
      await safePagePause(page, OVERLAY_CLICK_SETTLE_MS);

      if (page.isClosed()) {
        return { opened: false, metrics: null };
      }

      const visibleDialog = await page
        .locator("[role='dialog'], [aria-modal='true'], .g-modal, .modal")
        .first()
        .isVisible()
        .catch(() => false);

      if (visibleDialog) {
        openedModal = true;
      }
    }
  }

  const dropdownCandidates = [
    page.locator("[role='combobox']").first(),
    page.locator("button[aria-haspopup='listbox']").first(),
    page.locator("button[aria-haspopup='menu']").first(),
  ];

  for (const candidate of dropdownCandidates) {
    const exists = (await candidate.count()) > 0;
    if (!exists) continue;

    const canClick =
      (await candidate.isVisible().catch(() => false)) &&
      !(await candidate.isDisabled().catch(() => false));
    if (!canClick) continue;

    await candidate.click({ timeout: OVERLAY_CLICK_TIMEOUT_MS }).catch(() => null);
    await safePagePause(page, OVERLAY_CLICK_SETTLE_MS);

    if (page.isClosed()) {
      return { opened: false, metrics: null };
    }

    const popupVisible = await page
      .locator("[role='listbox'], [role='menu'], .g-popup, .g-popover, .g-select-popup")
      .first()
      .isVisible()
      .catch(() => false);

    if (popupVisible) {
      openedDropdown = true;
      break;
    }
  }

  const opened = openedModal || openedDropdown;
  const metrics = opened && !page.isClosed() ? await collectMetrics(page).catch(() => null) : null;

  if (page.isClosed()) {
    return { opened: false, metrics: null };
  }

  await page.keyboard.press("Escape").catch(() => null);
  await page.keyboard.press("Escape").catch(() => null);
  await safePagePause(page, OVERLAY_CLOSE_SETTLE_MS);

  return { opened, metrics };
}

function relativeFromWorkspace(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

function addDefect(
  defects: DefectRecord[],
  nextDefect: DefectRecord,
) {
  const duplicate = defects.find(
    (existing) =>
      existing.routePath === nextDefect.routePath &&
      existing.viewport === nextDefect.viewport &&
      existing.category === nextDefect.category &&
      existing.description === nextDefect.description,
  );

  if (!duplicate) {
    defects.push(nextDefect);
  }
}

function summarizeIssue(issue: RawIssue): string {
  const label = issue.label ? `"${issue.label}"` : "(без подписи)";
  return `${label} [${issue.width}x${issue.height}] x=${issue.left}..${issue.right}`;
}

function defectsFromMetrics(args: {
  route: ResolvedRoute;
  viewportId: string;
  finalUrl: string;
  screenshot: string;
  metrics: AuditMetrics;
  defects: DefectRecord[];
  overlayPass?: boolean;
}) {
  const { route, viewportId, finalUrl, screenshot, metrics, defects, overlayPass } = args;
  const categoryPrefix = overlayPass ? "overlay/" : "";

  if (metrics.horizontalOverflowPx > 40) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "critical",
      category: `${categoryPrefix}horizontal-overflow`,
      description: `Горизонтальный overflow ${metrics.horizontalOverflowPx}px`,
      screenshot,
    });
  } else if (metrics.horizontalOverflowPx > 6) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "major",
      category: `${categoryPrefix}horizontal-overflow`,
      description: `Горизонтальный overflow ${metrics.horizontalOverflowPx}px`,
      screenshot,
    });
  }

  if (metrics.offscreenInteractive.length > 0) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "major",
      category: `${categoryPrefix}offscreen-interactive`,
      description: `Интерактивные элементы выходят за viewport: ${summarizeIssue(metrics.offscreenInteractive[0])}`,
      screenshot,
    });
  }

  if (metrics.fixedOverlaps.length > 0) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "major",
      category: `${categoryPrefix}fixed-overlap`,
      description: `Fixed/sticky перекрывает CTA: ${summarizeIssue(metrics.fixedOverlaps[0])}`,
      screenshot,
    });
  }

  if (metrics.modalOverflows.length > 0) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "major",
      category: `${categoryPrefix}modal-overflow`,
      description: `Модальное окно не помещается в viewport: ${summarizeIssue(metrics.modalOverflows[0])}`,
      screenshot,
    });
  }

  if (metrics.dropdownOverflows.length > 0) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "major",
      category: `${categoryPrefix}dropdown-overflow`,
      description: `Dropdown/listbox выходит за viewport: ${summarizeIssue(metrics.dropdownOverflows[0])}`,
      screenshot,
    });
  }

  if (metrics.tableOverflows.length > 0) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "major",
      category: `${categoryPrefix}table-overflow`,
      description: `Таблица шире viewport без горизонтального контейнера: ${summarizeIssue(metrics.tableOverflows[0])}`,
      screenshot,
    });
  }

  if (metrics.tinyCriticalCtas.length > 0) {
    const issue = metrics.tinyCriticalCtas[0];
    const isSeverelySmall = issue.width < 36 || issue.height < 36;

    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: isSeverelySmall ? "major" : "minor",
      category: `${categoryPrefix}tiny-critical-cta`,
      description: `Критичный CTA меньше 44x44: ${summarizeIssue(issue)}`,
      screenshot,
    });
  }

  if (metrics.tinyTapTargets.length > 0) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "minor",
      category: `${categoryPrefix}tiny-tap-target`,
      description: `Есть tap target меньше 44x44 (пример): ${summarizeIssue(metrics.tinyTapTargets[0])}`,
      screenshot,
    });
  }

  if (metrics.cls >= 0.35) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "major",
      category: `${categoryPrefix}layout-shift`,
      description: `Сильный layout shift (CLS=${metrics.cls})`,
      screenshot,
    });
  } else if (metrics.cls >= 0.15) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewportId,
      severity: "minor",
      category: `${categoryPrefix}layout-shift`,
      description: `Заметный layout shift (CLS=${metrics.cls})`,
      screenshot,
    });
  }
}

async function auditSingleRoute(args: {
  page: Page;
  route: ResolvedRoute;
  viewport: ViewportPreset;
  testInfo: TestInfo;
  defects: DefectRecord[];
  routeIndex: number;
  routeTotal: number;
}): Promise<RouteRunResult> {
  const { page, route, viewport, testInfo, defects, routeIndex, routeTotal } = args;

  const notes: string[] = [];
  let statusCode: number | null = null;

  console.log(
    `[ADAPTIVE][${viewport.id}] ${routeIndex}/${routeTotal} -> ${route.path} (template=${route.template}, context=${route.context})`,
  );

  try {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: GOTO_TIMEOUT_MS });
    statusCode = response?.status() ?? null;
  } catch (error) {
    const screenshotPath = testInfo.outputPath(
      `adaptive-${viewport.id}-${route.id}-navigation-error.png`,
    );
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);

    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl: page.url(),
      viewport: viewport.id,
      severity: "critical",
      category: "navigation",
      description: `Ошибка открытия страницы: ${String(error)}`,
      screenshot: relativeFromWorkspace(screenshotPath),
    });

    return {
      routeId: route.id,
      template: route.template,
      path: route.path,
      context: route.context,
      viewport: viewport.id,
      finalUrl: page.url(),
      statusCode,
      screenshot: relativeFromWorkspace(screenshotPath),
      notes,
      defectCount: defects.length,
      majorOrCriticalCount: defects.filter((d) => d.severity !== "minor").length,
    };
  }

  await page.waitForLoadState("networkidle", { timeout: NETWORKIDLE_TIMEOUT_MS }).catch(() => null);
  await page.waitForTimeout(POST_NAV_PAUSE_MS);
  await dismissCookieConsentIfPresent(page);
  await page.waitForTimeout(POST_NAV_PAUSE_MS);
  await resetClsCounter(page);
  await page.waitForTimeout(POST_NAV_PAUSE_MS);

  const screenshotPath = testInfo.outputPath(`adaptive-${viewport.id}-${route.id}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const finalUrl = page.url();
  const finalPathname = (() => {
    try {
      const parsed = new URL(finalUrl);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return finalUrl;
    }
  })();

  if (statusCode !== null && statusCode >= 500) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewport.id,
      severity: "critical",
      category: "http-status",
      description: `HTTP ${statusCode} на загрузке страницы`,
      screenshot: relativeFromWorkspace(screenshotPath),
    });
  }

  if (route.context === "authed" && AUTH_ROUTE_RE.test(finalPathname)) {
    addDefect(defects, {
      routeId: route.id,
      routeTemplate: route.template,
      routePath: route.path,
      finalUrl,
      viewport: viewport.id,
      severity: "critical",
      category: "unexpected-auth-redirect",
      description: "Авторизованный маршрут редиректит на auth/login/registration",
      screenshot: relativeFromWorkspace(screenshotPath),
    });
  }

  if (route.context === "student-only" && AUTH_ROUTE_RE.test(finalPathname)) {
    notes.push("student-only маршрут редиректит на auth (ожидаемо без student-сессии)");
  }

  const beforeDefects = defects.length;
  const metrics = await collectMetrics(page);
  defectsFromMetrics({
    route,
    viewportId: viewport.id,
    finalUrl,
    screenshot: relativeFromWorkspace(screenshotPath),
    metrics,
    defects,
  });

  const shouldProbeOverlays =
    !SKIP_OVERLAY_PROBE &&
    (OVERLAY_PROBE_ALL_VIEWPORTS || viewport.id === "mobile") &&
    route.context === "authed" &&
    /\/students(?:\/|$)|\/schedule(?:\/|$)|\/payments(?:\/|$)|\/packages(?:\/|$)|\/settings(?:\/|$)|\/support(?:\/|$)|\/files(?:\/|$)|\/t\/[^/]+\/book(?:\?|$)/i.test(
      route.path,
    );

  if (shouldProbeOverlays) {
    const overlayProbe = await runOverlayProbe(page);
    if (overlayProbe.opened && overlayProbe.metrics) {
      defectsFromMetrics({
        route,
        viewportId: viewport.id,
        finalUrl: page.url(),
        screenshot: relativeFromWorkspace(screenshotPath),
        metrics: overlayProbe.metrics,
        defects,
        overlayPass: true,
      });
    }
  }

  const routeDefects = defects.slice(beforeDefects).length;
  const routeMajorCritical = defects.slice(beforeDefects).filter((d) => d.severity !== "minor").length;

  console.log(
    `[ADAPTIVE][${viewport.id}] done ${route.path} defects=${routeDefects} majorOrCritical=${routeMajorCritical}`,
  );

  return {
    routeId: route.id,
    template: route.template,
    path: route.path,
    context: route.context,
    viewport: viewport.id,
    finalUrl,
    statusCode,
    screenshot: relativeFromWorkspace(screenshotPath),
    notes,
    defectCount: routeDefects,
    majorOrCriticalCount: routeMajorCritical,
  };
}

test.describe("Adaptive Audit", () => {
  test.describe.configure({ mode: "serial" });

  test("adaptive mobile+tablet across all frontend pages", async ({ page }, testInfo) => {
    test.setTimeout(AUDIT_TEST_TIMEOUT_MS);

    await installClsTracker(page);
    await ensureTutorSession(page);

    const slug = await readTutorSlug(page);
    const studentId = await readFirstStudentId(page);

    const routeTemplates = discoverRouteTemplates();
    const dynamicParams: Record<string, string | null> = {
      slug,
      id: studentId,
    };

    const unresolvedTemplates: string[] = [];
    const routes: ResolvedRoute[] = [];

    for (const template of routeTemplates) {
      const pathValue = resolveTemplatePath(template.template, dynamicParams);
      if (!pathValue) {
        unresolvedTemplates.push(template.template);
        continue;
      }
      routes.push({ ...template, path: pathValue });
    }

    let selectedRoutes = routes;

    if (ROUTE_GREP) {
      selectedRoutes = selectedRoutes.filter(
        (route) => ROUTE_GREP.test(route.path) || ROUTE_GREP.test(route.template) || ROUTE_GREP.test(route.id),
      );
    }

    if (Number.isFinite(MAX_ROUTES) && MAX_ROUTES > 0) {
      selectedRoutes = selectedRoutes.slice(0, Math.floor(MAX_ROUTES));
    }

    if (SHARD_TOTAL > 1) {
      selectedRoutes = selectedRoutes.filter((_, index) => index % SHARD_TOTAL === SHARD_INDEX - 1);
    }

    const authedRoutes = selectedRoutes.filter((route) => route.context === "authed");
    const guestRoutes = selectedRoutes.filter((route) => route.context === "guest");
    const studentOnlyRoutes = selectedRoutes.filter((route) => route.context === "student-only");

    const defects: DefectRecord[] = [];
    const routeResults: RouteRunResult[] = [];

    const totalRouteRuns =
      VIEWPORTS.length * (authedRoutes.length + guestRoutes.length + studentOnlyRoutes.length);
    let routeRunCounter = 0;

    console.log(
      `[ADAPTIVE] start fast=${FAST_MODE} routesDiscovered=${routeTemplates.length} routesAudited=${selectedRoutes.length} totalRuns=${totalRouteRuns} shard=${SHARD_INDEX}/${SHARD_TOTAL}`,
    );

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await ensureTutorSession(page);

      for (const route of authedRoutes) {
        routeRunCounter += 1;
        const result = await auditSingleRoute({
          page,
          route,
          viewport,
          testInfo,
          defects,
          routeIndex: routeRunCounter,
          routeTotal: totalRouteRuns,
        });
        routeResults.push(result);
      }
    }

    await clearSession(page);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of guestRoutes) {
        routeRunCounter += 1;
        const result = await auditSingleRoute({
          page,
          route,
          viewport,
          testInfo,
          defects,
          routeIndex: routeRunCounter,
          routeTotal: totalRouteRuns,
        });
        routeResults.push(result);
      }
    }

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of studentOnlyRoutes) {
        routeRunCounter += 1;
        const result = await auditSingleRoute({
          page,
          route,
          viewport,
          testInfo,
          defects,
          routeIndex: routeRunCounter,
          routeTotal: totalRouteRuns,
        });
        routeResults.push(result);
      }
    }

    const majorOrCriticalDefects = defects.filter(
      (defect) => defect.severity === "critical" || defect.severity === "major",
    );

    const report = {
      generatedAt: new Date().toISOString(),
      viewports: VIEWPORTS,
      config: {
        fastMode: FAST_MODE,
        skipOverlayProbe: SKIP_OVERLAY_PROBE,
        routeGrep: ROUTE_GREP_RAW || null,
        maxRoutes: Number.isFinite(MAX_ROUTES) && MAX_ROUTES > 0 ? Math.floor(MAX_ROUTES) : null,
        shardTotal: SHARD_TOTAL,
        shardIndex: SHARD_INDEX,
      },
      routesDiscovered: routeTemplates.length,
      routesAudited: selectedRoutes.length,
      unresolvedDynamicTemplates: unresolvedTemplates,
      dynamicParams: {
        slugAvailable: Boolean(slug),
        studentIdAvailable: Boolean(studentId),
      },
      summary: {
        totalDefects: defects.length,
        critical: defects.filter((d) => d.severity === "critical").length,
        major: defects.filter((d) => d.severity === "major").length,
        minor: defects.filter((d) => d.severity === "minor").length,
      },
      defects,
      routeResults,
    };

    const reportJsonPath = path.resolve(process.cwd(), "runbook-logs", "adaptive-audit-report.json");
    fs.mkdirSync(path.dirname(reportJsonPath), { recursive: true });
    fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2), "utf8");

    const reportMdPath = path.resolve(process.cwd(), "runbook-logs", "adaptive-audit-report.md");
    const reportLines: string[] = [];
    reportLines.push("# Adaptive Audit Report");
    reportLines.push("");
    reportLines.push(`Generated: ${report.generatedAt}`);
    reportLines.push(`Routes audited: ${report.routesAudited}/${report.routesDiscovered}`);
    reportLines.push(
      `Defects: critical=${report.summary.critical}, major=${report.summary.major}, minor=${report.summary.minor}`,
    );
    reportLines.push("");

    if (unresolvedTemplates.length > 0) {
      reportLines.push("## Unresolved Dynamic Routes");
      for (const unresolved of unresolvedTemplates) {
        reportLines.push(`- ${unresolved}`);
      }
      reportLines.push("");
    }

    reportLines.push("## Defects");
    if (defects.length === 0) {
      reportLines.push("- none");
    } else {
      for (const defect of defects) {
        reportLines.push(
          `- [${defect.severity.toUpperCase()}] ${defect.routePath} (${defect.viewport}) - ${defect.category}: ${defect.description}`,
        );
      }
    }
    reportLines.push("");

    fs.writeFileSync(reportMdPath, reportLines.join("\n"), "utf8");

    testInfo.annotations.push({
      type: "adaptive-audit-report",
      description: relativeFromWorkspace(reportJsonPath),
    });

    expect(
      majorOrCriticalDefects,
      `Adaptive audit has critical/major defects. See ${relativeFromWorkspace(reportJsonPath)}`,
    ).toHaveLength(0);
  });
});
