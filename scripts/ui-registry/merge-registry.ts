import fs from "node:fs";
import path from "node:path";

type AnyRecord = Record<string, any>;

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(ROOT, "docs", "ui-registry");
const STATIC_FILE = path.join(OUT_DIR, "static-elements.json");
const RUNTIME_FILE = path.join(OUT_DIR, "runtime-elements.json");

const JSON_OUT = path.join(OUT_DIR, "ui-elements.json");
const CSV_OUT = path.join(OUT_DIR, "ui-elements.csv");
const ROUTES_OUT = path.join(OUT_DIR, "routes.md");
const A11Y_OUT = path.join(OUT_DIR, "accessibility-findings.md");
const ANALYTICS_OUT = path.join(OUT_DIR, "analytics-events-proposal.md");
const README_OUT = path.join(OUT_DIR, "README.md");
const BACKLOG_JSON_OUT = path.join(OUT_DIR, "priority-backlog.json");
const BACKLOG_MD_OUT = path.join(OUT_DIR, "priority-backlog.md");
const BASELINE_OUT = path.join(OUT_DIR, "baseline-metrics.json");

function readJson(file: string): AnyRecord {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function text(v: any): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function normalize(v: any): string {
  return text(v).trim().toLowerCase();
}

function slug(v: any): string {
  return normalize(v).replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "unknown";
}

function csvEscape(v: any): string {
  const raw = text(v).replace(/\r?\n/g, " ");
  if (/[",]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function keyFor(item: AnyRecord): string {
  const route = normalize(item.route || item?.source?.route || "");
  const label = normalize(item.label || item.text || item.accessibleName || item.ariaLabel || item.textContent || "");
  const href = normalize(item.href || "");
  const comp = normalize(item.component || item.tagName || "");
  const type = normalize(item.elementType || item.role || item.type || item.tagName || "");
  return [route, label, href, comp, type].join("|");
}

function inferElementType(x: AnyRecord): string {
  const t = normalize(x.elementType || x.role || x.tagName || x.type || "");
  if (["button", "link", "input", "form", "tab", "switch", "modal", "widget", "menuitem", "checkbox", "radio"].includes(t)) return t;
  if (t === "a") return "link";
  if (["textarea", "select", "textinput"].includes(t)) return "input";
  if (t === "dialog") return "modal";
  return "widget";
}

function inferCanonicalGroup(item: AnyRecord): "button" | "input" | "select" | "toggle" | "link" | "tab" | "menu" | "modal" | "form" | "widget" {
  const type = inferElementType(item);
  const component = normalize(item.component || item.widget || "");
  if (type === "link") return "link";
  if (type === "form") return "form";
  if (type === "tab") return "tab";
  if (type === "modal") return "modal";
  if (type === "menuitem" || component.includes("dropdown") || component.includes("menu")) return "menu";
  if (type === "switch" || type === "checkbox" || type === "radio") return "toggle";
  if (type === "input") {
    if (component.includes("select")) return "select";
    return "input";
  }
  if (type === "button") return "button";
  return "widget";
}

function inferArea(route: string, widget: string): string {
  const r = route || "";
  const w = (widget || "").toLowerCase();
  if (r.startsWith("/t/") && r.endsWith("/book")) return "booking";
  if (r.startsWith("/t/")) return "public-profile";
  if (r.startsWith("/settings")) return "settings";
  if (r.startsWith("/finance") || r === "/payments" || r === "/packages") return "finance";
  if (r.startsWith("/auth") || r.startsWith("/registration")) return "auth";
  if (w.includes("sidebar") || w.includes("layout") || w.includes("nav")) return "sidebar";
  if (w.includes("modal") || w.includes("dialog")) return "modal";
  return "main";
}

function stableTestId(selector: string, testId: string | null): boolean {
  return Boolean(testId || selector.includes("[data-testid=") || selector.includes("data-testid"));
}

function risk(hasAccessibleName: boolean, elementType: string): "low" | "medium" | "high" {
  if (hasAccessibleName) return "low";
  if (["button", "link", "tab", "menuitem", "switch"].includes(elementType)) return "high";
  if (["input", "checkbox", "radio"].includes(elementType)) return "medium";
  return "low";
}

function buildAnalyticsProposal(): string {
  const events = [
    ["ui_click_sidebar_dashboard", "Клик по сайдбару: Главное (/dashboard)"],
    ["ui_click_sidebar_students", "Клик по сайдбару: Ученики (/students)"],
    ["ui_click_sidebar_schedule", "Клик по сайдбару: Расписание (/schedule)"],
    ["ui_click_sidebar_finance", "Клик по сайдбару: Финансы (/finance)"],
    ["ui_click_quick_create_student", "Quick action: Добавить ученика"],
    ["ui_click_quick_create_lesson", "Quick action: Добавить занятие"],
    ["ui_click_quick_create_payment", "Quick action: Записать оплату"],
    ["ui_click_quick_create_package", "Quick action: Создать пакет"],
    ["ui_submit_create_student", "Submit создания ученика"],
    ["ui_submit_create_lesson", "Submit создания занятия"],
    ["ui_submit_create_payment", "Submit создания оплаты"],
    ["ui_click_public_booking", "Переход к публичному бронированию"],
    ["ui_booking_select_option", "Выбор предмета/пакета в booking wizard"],
    ["ui_booking_select_time_slot", "Выбор слота времени"],
    ["ui_booking_continue", "Нажатие Continue в booking wizard"],
    ["ui_auth_switch_to_student", "Переключение auth -> student view"],
    ["ui_auth_switch_to_tutor", "Переключение auth -> tutor view"],
    ["ui_settings_toggle_changed", "Изменение switch/toggle в settings"],
  ];

  return [
    "# Analytics events proposal",
    "",
    "| Event name | Trigger |",
    "|---|---|",
    ...events.map(([name, desc]) => `| ${name} | ${desc} |`),
    "",
    "Рекомендуемые common properties: route, area, widget, component, elementType, label, testId, isMobile.",
    "Рекомендуемый формат события: `ui_{action}_{area}_{target}`.",
    "Рекомендуемый формат testid: `ui-{area}-{target}-{variant?}` (kebab-case).",
  ].join("\n");
}

function scorePriority(item: AnyRecord, runtimeIncomplete: boolean): { score: number; level: "high" | "medium" | "low"; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (item.quality?.risk === "high") {
    score += 50;
    reasons.push("high a11y risk");
  } else if (item.quality?.risk === "medium") {
    score += 30;
    reasons.push("medium a11y risk");
  }

  if (!item.quality?.hasStableTestId && ["button", "link", "tab", "switch", "menuitem", "checkbox", "radio"].includes(item.elementType)) {
    score += 25;
    reasons.push("missing stable testid");
  }

  if (item.quality?.needsAnalyticsEvent) {
    score += 20;
    reasons.push("missing analytics event mapping");
  }

  if (item.route === "/unknown") {
    score += 15;
    reasons.push("unknown route attribution");
  }

  if (item.matchStatus === "static-only" && ["button", "link", "tab", "menuitem", "switch", "checkbox", "radio"].includes(item.elementType)) {
    score += 15;
    reasons.push("runtime match missing");
  }

  if (item.unstableSelector) {
    score += 10;
    reasons.push("unstable runtime selector");
  }

  if (item.probableDuplicate) {
    score += 8;
    reasons.push("probable duplicate");
  }

  if (runtimeIncomplete) {
    score += 5;
    reasons.push("runtime crawl incomplete");
  }

  const level: "high" | "medium" | "low" = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return { score, level, reasons };
}

function standardizationClusterKey(item: AnyRecord): string {
  const canonicalGroup = inferCanonicalGroup(item);
  const semanticLabel = normalize(item.label || item.accessibleName || item.ariaLabel || item.text || "");
  const href = normalize(item.href || "");
  const area = normalize(item.area || "");
  return [canonicalGroup, semanticLabel, href, area].join("|");
}

function buildBacklog(topClusters: AnyRecord[], generatedAt: string, runtimeIncomplete: boolean): string {
  const lines = [
    "# Priority backlog (top clusters)",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Runtime incomplete: ${runtimeIncomplete}`,
    "",
    "| Rank | Cluster | Canonical group | Elements | High | Medium | Unknown route | Avg score | Routes sample |",
    "|---:|---|---|---:|---:|---:|---:|---:|---|",
  ];

  topClusters.forEach((cluster, idx) => {
    const routesSample = (cluster.routes as string[]).slice(0, 5).join(", ");
    lines.push(`| ${idx + 1} | ${cluster.clusterId} | ${cluster.canonicalGroup} | ${cluster.elementCount} | ${cluster.high} | ${cluster.medium} | ${cluster.unknownRoute} | ${cluster.avgScore} | ${routesSample || "-"} |`);
  });

  lines.push(
    "",
    "## Recommended execution",
    "",
    "1. Close all high-priority clusters (high a11y + missing testid on interactive controls).",
    "2. Resolve top unknown-route clusters to improve attribution quality.",
    "3. Unify button/input/toggle clusters by canonical API in descending avg score.",
  );

  return lines.join("\n");
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const staticData = readJson(STATIC_FILE);
  const runtimeData = readJson(RUNTIME_FILE);
  const staticElements: AnyRecord[] = Array.isArray(staticData.elements) ? staticData.elements : [];
  const runtimeElements: AnyRecord[] = Array.isArray(runtimeData.elements) ? runtimeData.elements : [];

  const byKey = new Map<string, AnyRecord>();

  for (const s of staticElements) {
    const key = keyFor(s);
    if (!byKey.has(key)) {
      byKey.set(key, {
        ...s,
        elementType: inferElementType(s),
        route: s.route || "/unknown",
        area: s.area || inferArea(s.route || "", s.widget || ""),
        widget: s.widget || "unknown",
        runtime: s.runtime || {},
        source: { ...(s.source || {}), staticFound: true, runtimeFound: false },
      });
    }
  }

  const runtimeOnly: AnyRecord[] = [];
  for (const r of runtimeElements) {
    const key = keyFor(r);
    const found = byKey.get(key);
    if (found) {
      found.runtime = {
        selector: r.selector || found.runtime?.selector || null,
        role: r.role || found.runtime?.role || null,
        visible: r.visible,
        disabled: r.disabled,
      };
      found.source = {
        ...(found.source || {}),
        runtimeFound: true,
      };
      if (!found.accessibleName) {
        found.accessibleName = r.accessibleName || r.ariaLabel || r.textContent || null;
      }
      if (!found.label) {
        found.label = r.textContent || r.accessibleName || r.ariaLabel || null;
      }
      if (!found.href) found.href = r.href || null;
      if (!found.ariaLabel) found.ariaLabel = r.ariaLabel || null;
      found.meta = {
        ...(found.meta || {}),
        testId: found.meta?.testId || r.testId || null,
        screenshotPath: r.screenshotPath || null,
      };
      continue;
    }

    const elementType = inferElementType(r);
    const route = r.route || "/unknown";
    runtimeOnly.push({
      id: r.id || `ui.runtime.${runtimeOnly.length + 1}`,
      route,
      page: route === "/" ? "Home" : route.split("/").filter(Boolean).join(" ") || "Unknown",
      area: inferArea(route, "unknown"),
      widget: "unknown",
      component: r.tagName || "unknown",
      elementType,
      label: r.textContent || r.accessibleName || r.ariaLabel || null,
      accessibleName: r.accessibleName || r.ariaLabel || r.textContent || null,
      text: r.textContent || null,
      ariaLabel: r.ariaLabel || null,
      placeholder: r.placeholder || null,
      href: r.href || null,
      action: null,
      eventHandlers: [],
      states: [r.disabled ? "disabled" : "default"],
      source: {
        file: "runtime-dom",
        line: 0,
        staticFound: false,
        runtimeFound: true,
      },
      runtime: {
        selector: r.selector,
        role: r.role || null,
        visible: Boolean(r.visible),
        disabled: Boolean(r.disabled),
      },
      quality: {
        hasAccessibleName: Boolean(r.accessibleName || r.ariaLabel || r.textContent),
        hasStableTestId: stableTestId(r.selector || "", r.testId || null),
        needsAriaLabel: !Boolean(r.accessibleName || r.ariaLabel || r.textContent),
        needsAnalyticsEvent: ["button", "link", "tab", "switch", "checkbox", "radio", "menuitem"].includes(elementType),
        risk: "low",
      },
      notes: "runtime-only",
      meta: {
        parentSection: r.parentSectionHeading || null,
        testId: r.testId || null,
        screenshotPath: r.screenshotPath || null,
      },
    });
  }

  const merged = [...byKey.values(), ...runtimeOnly].map((item) => {
    const elementType = inferElementType(item);
    const hasAccessibleName = Boolean(item.accessibleName || item.ariaLabel || item.label || item.text);
    const selector = item.runtime?.selector || "";
    const tId = item.meta?.testId || null;
    const quality = {
      hasAccessibleName,
      hasStableTestId: stableTestId(selector, tId),
      needsAriaLabel: !hasAccessibleName && ["button", "link", "menuitem", "tab"].includes(elementType),
      needsAnalyticsEvent: ["button", "link", "menuitem", "tab", "switch", "checkbox", "radio"].includes(elementType),
      risk: risk(hasAccessibleName, elementType),
    };

    const states = Array.isArray(item.states) ? item.states.slice() : [];
    if (item.runtime?.disabled && !states.includes("disabled")) states.push("disabled");

    return {
      ...item,
      route: item.route || "/unknown",
      area: item.area || inferArea(item.route || "", item.widget || ""),
      widget: item.widget || "unknown",
      component: item.component || "unknown",
      elementType,
      states,
      source: {
        file: item.source?.file || "unknown",
        line: Number(item.source?.line || 0),
        staticFound: Boolean(item.source?.staticFound),
        runtimeFound: Boolean(item.source?.runtimeFound),
      },
      runtime: {
        selector: item.runtime?.selector || null,
        role: item.runtime?.role || null,
        visible: item.runtime?.visible ?? null,
        disabled: item.runtime?.disabled ?? null,
      },
      quality,
      notes: item.notes || "",
    };
  });

  const countsByRoute = new Map<string, number>();
  merged.forEach((item) => countsByRoute.set(item.route, (countsByRoute.get(item.route) || 0) + 1));

  const duplicates = new Map<string, number>();
  merged.forEach((item) => {
    const k = `${item.route}|${normalize(item.label || item.accessibleName)}|${item.elementType}`;
    duplicates.set(k, (duplicates.get(k) || 0) + 1);
  });

  const runtimeIncomplete = Boolean(runtimeData.incomplete);

  const withFlags = merged.map((item) => {
    const k = `${item.route}|${normalize(item.label || item.accessibleName)}|${item.elementType}`;
    const probableDuplicate = (duplicates.get(k) || 0) > 1;
    const staticOnly = item.source.staticFound && !item.source.runtimeFound;
    const dead = staticOnly && ["button", "link", "menuitem", "tab"].includes(item.elementType);
    const unstable = item.source.runtimeFound && !item.quality.hasStableTestId;
    const canonicalGroup = inferCanonicalGroup(item);
    const clusterId = `cluster.${slug(standardizationClusterKey(item))}`;
    const priority = scorePriority(
      {
        ...item,
        matchStatus: item.source.staticFound && item.source.runtimeFound ? "static+runtime" : staticOnly ? "static-only" : "runtime-only",
        probableDuplicate,
        unstableSelector: unstable,
      },
      runtimeIncomplete,
    );

    return {
      ...item,
      canonicalGroup,
      clusterId,
      matchStatus: item.source.staticFound && item.source.runtimeFound
        ? "static+runtime"
        : staticOnly
          ? "static-only"
          : "runtime-only",
      probableDuplicate,
      potentiallyDead: dead,
      unstableSelector: unstable,
      standardizationFlags: {
        isHighRiskA11y: item.quality.risk === "high",
        missingStableTestId: !item.quality.hasStableTestId,
        missingAnalyticsEvent: item.quality.needsAnalyticsEvent,
        unknownRoute: item.route === "/unknown",
        runtimeGap: staticOnly,
        duplicateInCluster: probableDuplicate,
      },
      priority,
    };
  });

  fs.writeFileSync(JSON_OUT, JSON.stringify(withFlags, null, 2), "utf8");

  const headers = [
    "id", "route", "page", "area", "widget", "component", "elementType", "canonicalGroup", "clusterId", "label", "accessibleName", "ariaLabel", "placeholder", "href", "action",
    "eventHandlers", "states", "sourceFile", "sourceLine", "staticFound", "runtimeFound", "selector", "role", "visible", "disabled",
    "hasAccessibleName", "hasStableTestId", "needsAriaLabel", "needsAnalyticsEvent", "risk", "matchStatus", "probableDuplicate", "potentiallyDead", "unstableSelector",
    "priorityScore", "priorityLevel", "priorityReasons", "notes",
  ];

  const rows = [headers.join(",")];
  withFlags.forEach((item) => {
    rows.push([
      item.id,
      item.route,
      item.page,
      item.area,
      item.widget,
      item.component,
      item.elementType,
      item.canonicalGroup,
      item.clusterId,
      item.label,
      item.accessibleName,
      item.ariaLabel,
      item.placeholder,
      item.href,
      item.action,
      Array.isArray(item.eventHandlers) ? item.eventHandlers.join("|") : "",
      Array.isArray(item.states) ? item.states.join("|") : "",
      item.source.file,
      item.source.line,
      item.source.staticFound,
      item.source.runtimeFound,
      item.runtime.selector,
      item.runtime.role,
      item.runtime.visible,
      item.runtime.disabled,
      item.quality.hasAccessibleName,
      item.quality.hasStableTestId,
      item.quality.needsAriaLabel,
      item.quality.needsAnalyticsEvent,
      item.quality.risk,
      item.matchStatus,
      item.probableDuplicate,
      item.potentiallyDead,
      item.unstableSelector,
      item.priority.score,
      item.priority.level,
      Array.isArray(item.priority.reasons) ? item.priority.reasons.join("|") : "",
      item.notes,
    ].map(csvEscape).join(","));
  });
  fs.writeFileSync(CSV_OUT, rows.join("\n"), "utf8");

  const routeLines = [
    "# UI routes coverage",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Route | Elements |",
    "|---|---:|",
    ...Array.from(countsByRoute.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([route, count]) => `| ${route} | ${count} |`),
    "",
    "## Route runtime status",
    "",
    `- Runtime incomplete: ${runtimeIncomplete}`,
    ...((runtimeData.reasons || []) as string[]).map((x) => `- ${x}`),
    "",
    "## Required groups overview",
    "",
    "- global layout: sidebar navigation, bottom/mobile navigation, quick actions, profile menu, theme switcher, search",
    "- dashboard widgets: TaskTiles, StatCards, InsightBanner, TodaySchedule, WeekSchedule, IncomeChart, ConversionRate, ExpiringPackages, ProfitBreakdown, DebtList, WeekLoad, LessonPanelV2",
    "- students: list controls, create student, student card, filters/search",
    "- schedule: create lesson, lesson dialog/panel, export, calendar controls",
    "- finance: payments, packages, filters, create payment, create package",
    "- files/materials: tabs, integration CTA, file links/actions",
    "- notifications: tabs, filters, actions",
    "- settings: section nav, theme buttons, switches/toggles, account/public profile/integrations/policies",
    "- support: search, article links",
    "- public tutor page: booking link, policy popup, reviews, certificates/lightbox",
    "- booking wizard: options, continue buttons, calendar days, time slots, OTP/details steps",
    "- auth: tutor sign-in, student sign-in, view switch controls",
  ];
  fs.writeFileSync(ROUTES_OUT, routeLines.join("\n"), "utf8");

  const a11yIssues = withFlags.filter((item) => {
    const missingName = !item.quality.hasAccessibleName && ["button", "link", "menuitem", "tab", "input", "switch", "checkbox", "radio"].includes(item.elementType);
    return missingName;
  });

  const a11yLines = [
    "# Accessibility findings",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| severity | route | element | problem | source file | suggested fix | priority |",
    "|---|---|---|---|---|---|---|",
  ];

  a11yIssues.forEach((item) => {
    const elementLabel = item.label || item.component || item.id;
    const problem = item.elementType === "input"
      ? "Input without visible label/aria-label/placeholder"
      : item.elementType === "link"
        ? "Link without accessible name"
        : "Interactive control without accessible name";
    const severity = item.quality.risk === "high" ? "high" : item.quality.risk === "medium" ? "medium" : "low";
    a11yLines.push(`| ${severity} | ${item.route} | ${elementLabel} | ${problem} | ${item.source.file} | Add visible text or aria-label, and keep role semantics explicit | ${item.priority.level} (${item.priority.score}) |`);
  });

  if (a11yIssues.length === 0) {
    a11yLines.push("| low | - | - | No obvious missing accessible names detected in collected data | - | Keep monitoring with runtime crawl | low (0) |", "");
  }

  fs.writeFileSync(A11Y_OUT, a11yLines.join("\n"), "utf8");
  fs.writeFileSync(ANALYTICS_OUT, buildAnalyticsProposal(), "utf8");

  const testIdTargets = withFlags.filter((x) => !x.quality.hasStableTestId && ["button", "link", "tab", "switch", "menuitem"].includes(x.elementType));
  const analyticsTargets = withFlags.filter((x) => x.quality.needsAnalyticsEvent);
  const unknownRouteCount = withFlags.filter((x) => x.route === "/unknown").length;
  const highPriorityCount = withFlags.filter((x) => x.priority.level === "high").length;
  const mediumPriorityCount = withFlags.filter((x) => x.priority.level === "medium").length;

  const clusterMap = new Map<string, AnyRecord>();
  for (const item of withFlags) {
    const cluster = clusterMap.get(item.clusterId) || {
      clusterId: item.clusterId,
      canonicalGroup: item.canonicalGroup,
      elementCount: 0,
      high: 0,
      medium: 0,
      low: 0,
      unknownRoute: 0,
      routes: new Set<string>(),
      totalScore: 0,
      sampleItems: [] as string[],
    };

    cluster.elementCount += 1;
    cluster.totalScore += Number(item.priority.score || 0);
    cluster[item.priority.level] += 1;
    if (item.route === "/unknown") cluster.unknownRoute += 1;
    cluster.routes.add(item.route);
    if (cluster.sampleItems.length < 3) {
      cluster.sampleItems.push(item.id);
    }
    clusterMap.set(item.clusterId, cluster);
  }

  const clusters = Array.from(clusterMap.values())
    .map((cluster) => ({
      ...cluster,
      routes: Array.from(cluster.routes),
      avgScore: Math.round((cluster.totalScore / Math.max(cluster.elementCount, 1)) * 10) / 10,
    }))
    .sort((a, b) => {
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      if (b.high !== a.high) return b.high - a.high;
      return b.elementCount - a.elementCount;
    });

  const topClusters = clusters.slice(0, 20);
  const generatedAt = new Date().toISOString();
  const backlog = {
    generatedAt,
    runtimeIncomplete,
    summary: {
      totalClusters: clusters.length,
      topClusters: topClusters.length,
      highPriorityCount,
      mediumPriorityCount,
      unknownRouteCount,
    },
    clusters: topClusters,
  };

  fs.writeFileSync(BACKLOG_JSON_OUT, JSON.stringify(backlog, null, 2), "utf8");
  fs.writeFileSync(BACKLOG_MD_OUT, buildBacklog(topClusters, generatedAt, runtimeIncomplete), "utf8");

  const baselineMetrics = {
    generatedAt,
    totals: {
      elements: withFlags.length,
      runtimeCoverage: Array.isArray(runtimeData.routesSucceeded) ? runtimeData.routesSucceeded.length : 0,
      runtimeIncomplete,
      unknownRouteCount,
      accessibilityIssues: a11yIssues.length,
      missingStableTestId: testIdTargets.length,
      missingAnalyticsEvent: analyticsTargets.length,
      highPriorityCount,
      mediumPriorityCount,
    },
    priorityByCanonicalGroup: withFlags.reduce((acc: Record<string, AnyRecord>, item) => {
      const key = item.canonicalGroup;
      if (!acc[key]) {
        acc[key] = { total: 0, high: 0, medium: 0, low: 0 };
      }
      acc[key].total += 1;
      acc[key][item.priority.level] += 1;
      return acc;
    }, {}),
  };
  fs.writeFileSync(BASELINE_OUT, JSON.stringify(baselineMetrics, null, 2), "utf8");

  const readme = [
    "# UI registry",
    "",
    "Реестр UI-элементов Repeto (machine-readable + human-readable).",
    "",
    "## Что внутри",
    "",
    "- `ui-elements.json` — объединённый реестр статического и runtime-аудита",
    "- `ui-elements.csv` — CSV-экспорт для QA/аналитики",
    "- `routes.md` — покрытие и группировка по маршрутам",
    "- `accessibility-findings.md` — accessibility-наблюдения",
    "- `analytics-events-proposal.md` — предложение по событиям аналитики",
    "- `priority-backlog.json` — top-20 кластеров для следующей итерации",
    "- `priority-backlog.md` — human-readable ranked backlog",
    "- `baseline-metrics.json` — baseline метрик для сравнения дельт",
    "",
    "## Сводка",
    "",
    `- Найдено UI-элементов: **${withFlags.length}**`,
    `- Route coverage (runtime succeeded): **${Array.isArray(runtimeData.routesSucceeded) ? runtimeData.routesSucceeded.length : 0}**`,
    `- Runtime incomplete: **${runtimeIncomplete}**`,
    `- Unknown route: **${unknownRouteCount}**`,
    `- Accessibility issues: **${a11yIssues.length}**`,
    `- Требуют stable data-testid: **${testIdTargets.length}**`,
    `- Требуют analytics event: **${analyticsTargets.length}**`,
    `- High priority elements: **${highPriorityCount}**`,
    `- Medium priority elements: **${mediumPriorityCount}**`,
    "",
    "## Iteration A outputs",
    "",
    "- Canonical group per element (`canonicalGroup`).",
    "- Standardization cluster id per element (`clusterId`).",
    "- Per-element priority block (`priority.score`, `priority.level`, `priority.reasons`).",
    "- Top-20 ranked clusters in `priority-backlog.*`.",
    "",
    "## Перезапуск",
    "",
    "```bash",
    "npm run ui-registry:static",
    "npm run ui-registry:runtime",
    "npm run ui-registry:merge",
    "# или",
    "npm run ui-registry",
    "```",
  ].join("\n");

  fs.writeFileSync(README_OUT, readme, "utf8");

  console.log(`[ui-registry] merge complete: ${withFlags.length} elements, ${clusters.length} clusters`);
}

main();
