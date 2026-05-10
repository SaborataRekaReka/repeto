import { test, expect, getAuthToken, loginViaAPI, loginViaUI } from "./helpers/auth";
import type { Dialog, Locator, Page } from "@playwright/test";

const AUTH_ROUTE_RE = /\/(auth|registration|login)(?:\?|#|$)/i;
const DESTRUCTIVE_BUTTON_RE =
  /удал|delete|remove|unlink|отвяз|архив|deactivate|deactivate|drop|purge|destroy|сброс|reset/i;
const API_BASE = "/api";
const HARNESS_KEY = String(process.env.E2E_TEST_HARNESS_KEY || "").trim();
const SECOND_TUTOR_EMAIL = String(process.env.E2E_SECOND_TUTOR_EMAIL || "").trim();
const SECOND_TUTOR_PASSWORD = String(process.env.E2E_SECOND_TUTOR_PASSWORD || "").trim();
const VISUAL_LAYER_ENABLED = String(process.env.E2E_MEGA_VISUAL || "").trim() === "1";
const MEGA_VERBOSE = String(process.env.E2E_MEGA_VERBOSE || "").trim() === "1";
const MEGA_NO_TIMEOUT = String(process.env.E2E_MEGA_NO_TIMEOUT || "").trim() === "1";
const MEGA_TIMEOUT_FROM_ENV = Number(String(process.env.E2E_MEGA_TIMEOUT_MS || "").trim());
const DEFAULT_MEGA_TIMEOUT_MS = 1_260_000;
const RESOLVED_MEGA_TIMEOUT_MS =
  Number.isFinite(MEGA_TIMEOUT_FROM_ENV) && MEGA_TIMEOUT_FROM_ENV > 0
    ? MEGA_TIMEOUT_FROM_ENV
    : DEFAULT_MEGA_TIMEOUT_MS;
const MEGA_HEARTBEAT_FROM_ENV = Number(String(process.env.E2E_MEGA_HEARTBEAT_MS || "").trim());
const DEFAULT_MEGA_HEARTBEAT_MS = 30_000;
const RESOLVED_MEGA_HEARTBEAT_MS =
  Number.isFinite(MEGA_HEARTBEAT_FROM_ENV) && MEGA_HEARTBEAT_FROM_ENV >= 5_000
    ? MEGA_HEARTBEAT_FROM_ENV
    : DEFAULT_MEGA_HEARTBEAT_MS;

type NotificationChannelCode = "EMAIL" | "PUSH" | "TELEGRAM" | "MAX";

type GateStatus = "pass" | "fail" | "incomplete";

type CoverageLayer =
  | "control-coverage"
  | "effect-coverage"
  | "persistence-coverage"
  | "cross-account-coverage"
  | "visual-coverage"
  | "contract-coverage";

type LayerStatus = {
  layer: CoverageLayer;
  status: GateStatus;
  details: string;
};

type BlockStatusResult = {
  status: GateStatus;
  details: string;
};

type EffectContractResult = BlockStatusResult & {
  checks: number;
  effects: number;
};

type PersistenceResult = BlockStatusResult & {
  checks: number;
};

type NegativeGuardResult = BlockStatusResult & {
  checks: number;
};

type MultiTutorResult = BlockStatusResult & {
  checks: number;
};

type NotificationsHomeworkResult = {
  status: GateStatus;
  details: string;
  incompleteReasons: string[];
  channelsChecked: number;
  remindersChecked: number;
  homeworkChecks: number;
  portalChecks: number;
  crossAccountChecks: number;
  multiTutorChecks: number;
};

function megaLog(message: string) {
  // Keep explicit logs for long-running runs so terminal output shows current phase.
  console.log(`[MEGA][${new Date().toISOString()}] ${message}`);
}

function megaVerboseLog(message: string) {
  if (!MEGA_VERBOSE) return;
  megaLog(message);
}

const SETTINGS_TAB_PLAN: Array<{
  key: "account" | "public-page" | "integrations" | "notifications" | "policies" | "security";
  label: RegExp;
}> = [
  { key: "account", label: /Личные данные/i },
  { key: "public-page", label: /Публичная страница/i },
  { key: "integrations", label: /Интеграции/i },
  { key: "notifications", label: /Уведомления/i },
  { key: "policies", label: /Правила занятий/i },
  { key: "security", label: /Безопасность/i },
];

type RouteSweep = {
  id: string;
  path: string;
  readySelector: string;
  maxIterations?: number;
  maxButtonsPerSnapshot?: number;
};

type SweepCandidate = {
  id: string;
  signature: string;
  label: string;
};

type SweepStats = {
  routeId: string;
  discovered: number;
  attempted: number;
  clicked: number;
  skippedDestructive: number;
  failedClicks: number;
};

type PublicProfileState = {
  slug: string | null;
  restore: () => Promise<void>;
};

const ROUTE_SWEEP_PLAN: RouteSweep[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    readySelector: ".repeto-dashboard-grid, .repeto-platform-access-alert, .repeto-top-header, h1",
  },
  {
    id: "students",
    path: "/students",
    readySelector: ".page-overlay__title, .repeto-sl-list, .repeto-top-header, h1",
  },
  {
    id: "schedule",
    path: "/schedule",
    readySelector: ".repeto-schedule-toolbar, .repeto-top-header, h1",
  },
  {
    id: "finance",
    path: "/finance",
    readySelector: ".repeto-finance-overview-row, .repeto-top-header, h1",
  },
  {
    id: "payments",
    path: "/payments",
    readySelector: ".page-overlay__title, .repeto-top-header, h1",
  },
  {
    id: "packages",
    path: "/packages",
    readySelector: ".page-overlay__title, .repeto-top-header, h1",
  },
  {
    id: "files",
    path: "/files",
    readySelector: ".page-overlay__title, .repeto-top-header, .repeto-mobile-nav, h1",
  },
  {
    id: "notifications",
    path: "/notifications",
    readySelector: ".repeto-notifications-toolbar, .repeto-top-header, h1",
  },
  {
    id: "support",
    path: "/support",
    readySelector: "input[placeholder*='Поиск'], .repeto-top-header, h1",
  },
];

function splitSelectors(selectorList: string) {
  return selectorList
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function routeBase(path: string) {
  return path.split("?")[0] || path;
}

function routeMatches(url: string, path: string) {
  return url.includes(routeBase(path));
}

function randomSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown[] }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

function plusMinutesIso(minutes: number) {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  return date.toISOString();
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function hasMockFlag(payload: unknown) {
  if (!payload || typeof payload !== "object") return false;
  const top = payload as { mock?: unknown; data?: { mock?: unknown } };
  return top.mock === true || top.data?.mock === true;
}

function gateStatusForLayers(
  layerStatuses: LayerStatus[],
  requiredLayers: CoverageLayer[],
): GateStatus {
  const required = layerStatuses.filter((row) => requiredLayers.includes(row.layer));
  if (required.some((row) => row.status === "fail")) return "fail";
  if (required.some((row) => row.status === "incomplete")) return "incomplete";
  return "pass";
}

async function authHeaders(page: Page) {
  const token = await getAuthToken(page);
  return { Authorization: `Bearer ${token}` };
}

function harnessHeaders() {
  if (!HARNESS_KEY) {
    return {};
  }

  return {
    "x-test-harness-key": HARNESS_KEY,
  };
}

function extractOtpCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";

  const top = payload as {
    code?: unknown;
    otp?: unknown;
    data?: {
      code?: unknown;
      otp?: unknown;
    };
  };

  const directCode = String(top.code ?? "").trim();
  if (/^\d{6}$/.test(directCode)) return directCode;

  const directOtp = String(top.otp ?? "").trim();
  if (/^\d{6}$/.test(directOtp)) return directOtp;

  const nestedCode = String(top.data?.code ?? "").trim();
  if (/^\d{6}$/.test(nestedCode)) return nestedCode;

  const nestedOtp = String(top.data?.otp ?? "").trim();
  if (/^\d{6}$/.test(nestedOtp)) return nestedOtp;

  return "";
}

async function loginStudentViaHarness(page: Page, email: string) {
  const issueResponse = await page.request.post(`${API_BASE}/student-auth/testing/issue-and-read-otp`, {
    headers: harnessHeaders(),
    data: {
      email,
      purpose: "LOGIN",
    },
  });

  if (issueResponse.status() === 403 || issueResponse.status() === 404) {
    return null;
  }

  if (!issueResponse.ok()) {
    return null;
  }

  const issuePayload = (await issueResponse.json().catch(() => null)) as unknown;
  let code = extractOtpCode(issuePayload);

  if (!code) {
    const latestResponse = await page.request.get(`${API_BASE}/student-auth/testing/latest-otp`, {
      headers: harnessHeaders(),
      params: {
        email,
        purpose: "LOGIN",
      },
    });

    if (latestResponse.status() !== 403 && latestResponse.status() !== 404 && latestResponse.ok()) {
      const latestPayload = (await latestResponse.json().catch(() => null)) as unknown;
      code = extractOtpCode(latestPayload);
    }
  }

  if (!/^\d{6}$/.test(code)) {
    return null;
  }

  const verifyResponse = await page.request.post(`${API_BASE}/student-auth/verify-otp`, {
    data: {
      email,
      code,
    },
  });
  if (!verifyResponse.ok()) {
    return null;
  }

  const verifyPayload = (await verifyResponse.json()) as {
    accessToken?: string;
    account?: {
      id?: string;
      email?: string;
    };
  };

  if (!verifyPayload.accessToken) {
    return null;
  }

  return {
    accessToken: String(verifyPayload.accessToken || ""),
    accountId: String(verifyPayload.account?.id || ""),
  };
}

async function clearMessengerOutbox(page: Page, headers: Record<string, string>) {
  const response = await page.request.delete(`${API_BASE}/notifications/testing/messenger-outbox`, {
    headers,
  });

  if (response.status() === 403 || response.status() === 404) {
    return false;
  }

  expect(response.ok()).toBeTruthy();
  return true;
}

async function waitForTutorNotification(
  page: Page,
  headers: Record<string, string>,
  type: string,
  predicate: (row: {
    id: string;
    type: string;
    title: string;
    lessonId?: string | null;
    studentId?: string | null;
    channel?: string | null;
  }) => boolean,
  timeoutMs = 20_000,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await page.request.get(`${API_BASE}/notifications`, {
      headers,
      params: {
        type,
        limit: 120,
      },
    });

    if (response.ok()) {
      const rows = asArray<{
        id: string;
        type: string;
        title: string;
        lessonId?: string | null;
        studentId?: string | null;
        channel?: string | null;
      }>(await response.json());
      const found = rows.find(predicate);
      if (found) return found;
    }

    await page.waitForTimeout(350);
  }

  return null;
}

async function createStudent(
  page: Page,
  headers: Record<string, string>,
  overrides: Partial<{
    name: string;
    email: string;
    phone: string;
    subject: string;
    rate: number;
    parentEmail: string;
  }> = {},
) {
  const suffix = randomSuffix();
  const response = await page.request.post(`${API_BASE}/students`, {
    headers,
    data: {
      name: overrides.name || `Mega Student ${suffix}`,
      email: overrides.email || `mega.student.${suffix}@example.com`,
      phone: overrides.phone || "+79990001122",
      subject: overrides.subject || "Математика",
      rate: overrides.rate ?? 2300,
      parentEmail: overrides.parentEmail || `mega.parent.${suffix}@example.com`,
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as {
    id: string;
    name: string;
    email?: string | null;
    accountId?: string | null;
  };
}

async function activateStudentAccount(
  page: Page,
  headers: Record<string, string>,
  studentId: string,
) {
  const response = await page.request.post(`${API_BASE}/students/${studentId}/activate-account`, {
    headers,
  });
  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as {
    accountId?: string | null;
    invited?: boolean;
    status?: string | null;
  };

  const hasAccount = typeof payload.accountId === "string" && payload.accountId.trim().length > 0;
  const isInvited = payload.invited === true || payload.status === "INVITED";
  expect(hasAccount || isInvited).toBeTruthy();
}

async function maybePickFileId(page: Page, headers: Record<string, string>) {
  const response = await page.request.get(`${API_BASE}/files`, { headers });
  if (!response.ok()) return null;

  const payload = (await response.json()) as {
    files?: Array<{ id?: string; type?: string }>;
  };

  const files = Array.isArray(payload.files) ? payload.files : [];
  const firstFile = files.find((row) => String(row.type || "").toLowerCase() === "file");
  return firstFile?.id || null;
}

function sampleTextByType(type: string | null, index: number) {
  const timestamp = Date.now();
  const lowType = String(type || "").toLowerCase();

  if (lowType === "email") return `mega.ui.${timestamp}.${index}@example.com`;
  if (lowType === "tel") return `+7999${String(timestamp).slice(-7)}`;
  if (lowType === "number") return String(1000 + index * 100);
  return `Mega UI ${timestamp} ${index}`;
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

async function waitForUiSettle(page: Page, timeoutMs = 2_500) {
  await page.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => null);
}

async function gotoAuthed(page: Page, path: string, readySelector?: string) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await waitForUiSettle(page, 4_000);

    if (!AUTH_ROUTE_RE.test(page.url())) {
      if (readySelector) {
        await expectAnySelectorVisible(page, readySelector);
      }
      return;
    }

    const relogged = (await loginViaAPI(page).catch(() => false)) || false;
    if (!relogged) {
      await loginViaUI(page);
    }
  }

  throw new Error(`Route ${path} stayed unauthorized after re-login attempts.`);
}

async function closeTransientUi(page: Page) {
  const closeLikeButtons = [
    page.getByRole("button", { name: /Отмена|Закрыть|Назад|Cancel|Close|Back/i }).first(),
    page.locator("[aria-label='Close'], [aria-label='Закрыть']").first(),
    page.locator("[role='dialog'] button").filter({ hasText: /Отмена|Закрыть|Назад|Cancel|Close/i }).first(),
  ];

  for (const button of closeLikeButtons) {
    const visible = await button.isVisible().catch(() => false);
    if (!visible) continue;

    const enabled = await button.isEnabled().catch(() => true);
    if (!enabled) continue;

    await button.click({ timeout: 1_500 }).catch(() => null);
    await page.waitForTimeout(150);
  }

  await page.keyboard.press("Escape").catch(() => null);
  await page.waitForTimeout(120);
}

async function readControlState(locator: Locator) {
  const ariaChecked = await locator.getAttribute("aria-checked").catch(() => null);
  if (ariaChecked !== null) return `aria-checked:${ariaChecked}`;

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

async function runControlEffectContractCycle(page: Page): Promise<EffectContractResult> {
  let checks = 0;
  let effects = 0;

  await gotoAuthed(page, "/students", ".repeto-top-header, .page-overlay__title, h1");
  const createStudentButton = page
    .locator("button")
    .filter({ hasText: /Новый ученик|Добавить ученика/i })
    .first();

  if (await createStudentButton.isVisible().catch(() => false)) {
    checks += 1;
    await createStudentButton.click({ timeout: 2_000 }).catch(() => null);
    const dialog = page
      .locator("[role='dialog'], [aria-label='Новый ученик'], [aria-label='Карточка ученика']")
      .first();
    if (await dialog.isVisible().catch(() => false)) {
      effects += 1;
    }
    await closeTransientUi(page);
    if (!(await dialog.isVisible().catch(() => false))) {
      effects += 1;
    }
  }

  await gotoAuthed(page, "/settings", ".repeto-settings-layout, .repeto-settings-content, h1");
  const beforeSettingsUrl = page.url();
  const integrationsButton = page
    .locator(".page-overlay__nav-item, .repeto-settings-nav-btn, button")
    .filter({ hasText: /Интеграции/i })
    .first();

  if (await integrationsButton.isVisible().catch(() => false)) {
    checks += 1;
    await integrationsButton.click({ timeout: 2_000 }).catch(() => null);
    await waitForUiSettle(page, 2_000);
    if (page.url() !== beforeSettingsUrl || /tab=integrations/i.test(page.url())) {
      effects += 1;
    }
  }

  await gotoAuthed(
    page,
    "/settings?tab=notifications",
    ".repeto-settings-content, .repeto-settings-page-head__title, .repeto-top-header, h1",
  );

  const toggle = page
    .locator("input[type='checkbox'], [role='switch'], [role='checkbox']")
    .first();

  if (await toggle.isVisible().catch(() => false)) {
    checks += 1;
    const before = await readControlState(toggle);
    await toggle.click({ force: true }).catch(() => null);
    await page.waitForTimeout(160);
    const after = await readControlState(toggle);
    if (before !== after) {
      effects += 1;
    }
    await toggle.click({ force: true }).catch(() => null);
  }

  if (checks === 0) {
    return {
      status: "incomplete",
      details: "No contract controls were visible for effect assertions.",
      checks,
      effects,
    };
  }

  if (effects < checks) {
    return {
      status: "fail",
      details: `Observable effects mismatch: effects=${effects}, checks=${checks}`,
      checks,
      effects,
    };
  }

  return {
    status: "pass",
    details: `Each checked control produced observable effect (effects=${effects}).`,
    checks,
    effects,
  };
}

async function runNegativeAndGuardCycle(page: Page): Promise<NegativeGuardResult> {
  let checks = 0;
  let passed = 0;
  let mocked = false;
  const details: string[] = [];

  const invalidOtpResponse = await page.request.post(`${API_BASE}/student-auth/verify-otp`, {
    data: {
      email: `mega.invalid.${randomSuffix()}@example.com`,
      code: "000000",
    },
  });
  checks += 1;
  const invalidOtpPayload = (await invalidOtpResponse.json().catch(() => null)) as unknown;
  mocked = mocked || hasMockFlag(invalidOtpPayload);
  if (invalidOtpResponse.status() >= 400) {
    passed += 1;
  } else {
    details.push(`verify-otp invalid returned ${invalidOtpResponse.status()}`);
  }

  const headers = await authHeaders(page);
  const invalidReminderResponse = await page.request.post(
    `${API_BASE}/notifications/send-reminder/non-existing-student`,
    {
      headers,
      data: {
        type: "invalid",
        comment: "MEGA invalid reminder",
      },
    },
  );
  checks += 1;
  const invalidReminderPayload = (await invalidReminderResponse.json().catch(() => null)) as unknown;
  mocked = mocked || hasMockFlag(invalidReminderPayload);
  if (invalidReminderResponse.status() >= 400) {
    passed += 1;
  } else {
    details.push(`send-reminder invalid returned ${invalidReminderResponse.status()}`);
  }

  const browser = page.context().browser();
  if (browser) {
    const origin = new URL(page.url()).origin;
    const anonContext = await browser.newContext({ baseURL: origin });
    try {
      const anonymousSettingsResponse = await anonContext.request.get(`${API_BASE}/settings`);
      checks += 1;
      const anonymousPayload =
        (await anonymousSettingsResponse.json().catch(() => null)) as unknown;
      mocked = mocked || hasMockFlag(anonymousPayload);

      if (anonymousSettingsResponse.status() === 401 || anonymousSettingsResponse.status() === 403) {
        passed += 1;
      } else {
        details.push(
          `anonymous /settings guard returned ${anonymousSettingsResponse.status()}`,
        );
      }
    } finally {
      await anonContext.close();
    }
  }

  if (mocked) {
    return {
      status: "incomplete",
      details: "Negative/guard checks are incomplete in mock API mode.",
      checks,
    };
  }

  if (checks === 0) {
    return {
      status: "incomplete",
      details: "Negative/guard checks were not executed.",
      checks,
    };
  }

  if (passed < checks) {
    return {
      status: "fail",
      details: `Negative/guard failures: ${details.join("; ") || "unknown"}`,
      checks,
    };
  }

  return {
    status: "pass",
    details: `Negative/guard checks passed (${passed}/${checks}).`,
    checks,
  };
}

async function runA11yKeyboardMobileCycle(page: Page): Promise<BlockStatusResult> {
  let checks = 0;
  let passed = 0;
  const initialViewport = page.viewportSize();

  try {
    await gotoAuthed(page, "/students", ".repeto-top-header, .page-overlay__title, h1");

    await page.keyboard.press("Tab").catch(() => null);
    checks += 1;
    const hasFocusableTarget = await page.evaluate(
      () => Boolean(document.activeElement && document.activeElement !== document.body),
    );
    if (hasFocusableTarget) passed += 1;

    const createStudentButton = page
      .locator("button")
      .filter({ hasText: /Новый ученик|Добавить ученика/i })
      .first();

    if (await createStudentButton.isVisible().catch(() => false)) {
      await createStudentButton.focus().catch(() => null);
      await page.keyboard.press("Enter").catch(() => null);

      const dialog = page
        .locator("[role='dialog'], [aria-label='Новый ученик'], [aria-label='Карточка ученика']")
        .first();

      checks += 1;
      if (await dialog.isVisible().catch(() => false)) {
        passed += 1;
      }

      checks += 1;
      const dialogRoleVisible = await page
        .locator("[role='dialog']")
        .first()
        .isVisible()
        .catch(() => false);
      if (dialogRoleVisible) {
        passed += 1;
      }

      await page.keyboard.press("Escape").catch(() => null);
      await page.waitForTimeout(180);

      checks += 1;
      if (!(await dialog.isVisible().catch(() => false))) {
        passed += 1;
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAuthed(
      page,
      "/dashboard",
      ".repeto-mobile-nav, .repeto-mobile-fab, .repeto-top-header, h1",
    );

    checks += 1;
    const mobileShellVisible = await isAnySelectorVisible(
      page,
      ".repeto-mobile-nav, .repeto-mobile-fab",
    );
    if (mobileShellVisible) {
      passed += 1;
    }
  } finally {
    if (initialViewport) {
      await page.setViewportSize(initialViewport).catch(() => null);
    }
  }

  if (checks === 0) {
    return {
      status: "incomplete",
      details: "No a11y/keyboard/mobile checks were executed.",
    };
  }

  if (passed < checks) {
    return {
      status: "fail",
      details: `A11y/keyboard/mobile mismatches: ${passed}/${checks}`,
    };
  }

  return {
    status: "pass",
    details: `A11y/keyboard/mobile checks passed: ${passed}/${checks}`,
  };
}

function containsReminderMins(settings: Record<string, unknown>, expected: string) {
  const raw = JSON.stringify(settings);
  return (
    raw.includes(`\"selfReminderMins\":\"${expected}\"`) ||
    raw.includes(`\"selfReminderMins\":${Number(expected)}`)
  );
}

async function runPersistenceCycle(page: Page): Promise<PersistenceResult> {
  const headers = await authHeaders(page);

  const probeResponse = await page.request.get(`${API_BASE}/settings`, { headers });
  const probePayload = (await probeResponse.json().catch(() => null)) as unknown;
  if (hasMockFlag(probePayload)) {
    return {
      status: "incomplete",
      details: "Persistence layer is incomplete in mock API mode.",
      checks: 0,
    };
  }

  const original = await readNotificationSettings(page, headers);
  const marker = String(41 + Math.floor(Math.random() * 20));

  let checks = 0;
  let passed = 0;

  try {
    await patchNotificationSettings(page, headers, {
      channels: ["EMAIL", "PUSH"],
      channel: "email",
      selfReminder: true,
      selfReminderMins: marker,
      studentReminder: true,
      studentReminderHours: "2",
      paymentReminder: true,
      paymentReminderDays: "3",
      cancelNotify: true,
    });

    const afterSave = await readNotificationSettings(page, headers);
    checks += 1;
    if (containsReminderMins(afterSave, marker)) {
      passed += 1;
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForUiSettle(page, 4_000);

    const afterReload = await readNotificationSettings(page, headers);
    checks += 1;
    if (containsReminderMins(afterReload, marker)) {
      passed += 1;
    }

    const browser = page.context().browser();
    if (!browser) {
      return {
        status: "incomplete",
        details: "Persistence fresh-session check is unavailable without browser handle.",
        checks,
      };
    }

    const origin = new URL(page.url()).origin;
    const freshContext = await browser.newContext({ baseURL: origin });

    try {
      const freshPage = await freshContext.newPage();
      const relogged = (await loginViaAPI(freshPage).catch(() => false)) || false;
      if (!relogged) {
        await loginViaUI(freshPage);
      }

      const freshHeaders = await authHeaders(freshPage);
      const afterFreshSession = await readNotificationSettings(freshPage, freshHeaders);
      checks += 1;
      if (containsReminderMins(afterFreshSession, marker)) {
        passed += 1;
      }
    } finally {
      await freshContext.close();
    }
  } finally {
    await patchNotificationSettings(page, headers, original).catch(() => null);
  }

  if (checks === 0) {
    return {
      status: "incomplete",
      details: "Persistence checks were not executed.",
      checks,
    };
  }

  if (passed < checks) {
    return {
      status: "fail",
      details: `Persistence mismatches: ${passed}/${checks}`,
      checks,
    };
  }

  return {
    status: "pass",
    details: `Persistence checks passed: ${passed}/${checks}`,
    checks,
  };
}

async function runVisualRegressionLayer(page: Page): Promise<BlockStatusResult> {
  if (!VISUAL_LAYER_ENABLED) {
    return {
      status: "incomplete",
      details: "Visual layer disabled (set E2E_MEGA_VISUAL=1).",
    };
  }

  await gotoAuthed(page, "/dashboard", ".repeto-dashboard-grid, .repeto-top-header, h1");
  const dashboardTarget = page
    .locator(".repeto-dashboard-grid, .repeto-top-header, h1")
    .first();
  await expect(dashboardTarget).toBeVisible();
  await expect(dashboardTarget).toHaveScreenshot("mega-visual-dashboard-core.png");

  await gotoAuthed(page, "/students", ".page-overlay__title, .repeto-top-header, h1");
  const studentsTarget = page
    .locator(".page-overlay__title, .repeto-top-header, h1")
    .first();
  await expect(studentsTarget).toBeVisible();
  await expect(studentsTarget).toHaveScreenshot("mega-visual-students-core.png");

  await gotoAuthed(page, "/settings", ".repeto-settings-content, .repeto-settings-page-head__title, h1");
  const settingsTarget = page
    .locator(".repeto-settings-content, .repeto-settings-page-head__title, h1")
    .first();
  await expect(settingsTarget).toBeVisible();
  await expect(settingsTarget).toHaveScreenshot("mega-visual-settings-core.png");

  return {
    status: "pass",
    details: "Visual regression snapshots validated for critical screens.",
  };
}

async function runMultiTutorCycle(page: Page, studentEmail: string): Promise<MultiTutorResult> {
  if (!SECOND_TUTOR_EMAIL || !SECOND_TUTOR_PASSWORD) {
    return {
      status: "incomplete",
      details:
        "Multi-tutor block requires E2E_SECOND_TUTOR_EMAIL and E2E_SECOND_TUTOR_PASSWORD.",
      checks: 0,
    };
  }

  const loginResponse = await page.request.post(`${API_BASE}/auth/login`, {
    data: {
      email: SECOND_TUTOR_EMAIL,
      password: SECOND_TUTOR_PASSWORD,
    },
  });

  if (!loginResponse.ok()) {
    return {
      status: "incomplete",
      details: `Second tutor login failed with status ${loginResponse.status()}.`,
      checks: 0,
    };
  }

  const loginPayload = (await loginResponse.json()) as { accessToken?: string };
  const secondToken = String(loginPayload.accessToken || "").trim();
  if (!secondToken) {
    return {
      status: "incomplete",
      details: "Second tutor access token is missing.",
      checks: 0,
    };
  }

  const secondHeaders = { Authorization: `Bearer ${secondToken}` };
  const studentsResponse = await page.request.get(`${API_BASE}/students`, {
    headers: secondHeaders,
  });

  if (!studentsResponse.ok()) {
    return {
      status: "fail",
      details: `Second tutor /students returned ${studentsResponse.status()}.`,
      checks: 1,
    };
  }

  const rows = asArray<{ email?: string }>(await studentsResponse.json());
  const hasSharedStudent = rows.some(
    (row) => String(row.email || "").toLowerCase() === studentEmail.toLowerCase(),
  );

  if (!hasSharedStudent) {
    return {
      status: "incomplete",
      details:
        "Shared student is not linked to second tutor in current dataset (multi-tutor context switch cannot be asserted).",
      checks: 1,
    };
  }

  return {
    status: "pass",
    details: "Second tutor sees the same student account context.",
    checks: 1,
  };
}

async function tryFillVisibleDialogFields(page: Page) {
  const dialog = page
    .locator("[role='dialog'], .g-dialog, [aria-label='Новый ученик'], [aria-label='Новое занятие'], [aria-label='Новая оплата']")
    .first();

  if (!(await dialog.isVisible().catch(() => false))) {
    return 0;
  }

  const inputLocator = dialog.locator("input:not([type='hidden']):not([type='checkbox']):not([type='radio']), textarea");
  const inputCount = Math.min(await inputLocator.count(), 8);
  let filled = 0;

  for (let i = 0; i < inputCount; i += 1) {
    const input = inputLocator.nth(i);

    const visible = await input.isVisible().catch(() => false);
    if (!visible) continue;

    const editable = await input.isEditable().catch(() => false);
    if (!editable) continue;

    const currentValue = await input.inputValue().catch(() => "");
    if (currentValue.trim().length > 0) continue;

    const type = await input.getAttribute("type").catch(() => null);
    const text = sampleTextByType(type, i + 1);

    await input.fill(text).catch(() => null);
    filled += 1;
  }

  return filled;
}

async function snapshotVisibleButtons(
  page: Page,
  sweepKey: string,
  maxButtons: number,
): Promise<SweepCandidate[]> {
  return page.evaluate(
    ({ key, max }) => {
      const attrName = "data-e2e-mega-id";

      function visible(el: HTMLElement) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
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

      for (const existing of Array.from(document.querySelectorAll(`[${attrName}]`))) {
        existing.removeAttribute(attrName);
      }

      const nodes = Array.from(document.querySelectorAll("button, [role='button']"));
      const result: SweepCandidate[] = [];
      let sequence = 0;

      for (const node of nodes) {
        const el = node as HTMLElement;

        if (!visible(el)) continue;

        const ariaDisabled = (el.getAttribute("aria-disabled") || "").toLowerCase() === "true";
        const disabled =
          ariaDisabled ||
          ("disabled" in el &&
            Boolean((el as HTMLButtonElement & { disabled?: boolean }).disabled));

        if (disabled) continue;

        const label =
          (el.getAttribute("aria-label") || "").trim() ||
          el.textContent?.replace(/\s+/g, " ").trim() ||
          "button";

        const id = `${key}-${sequence + 1}`;
        el.setAttribute(attrName, id);

        result.push({
          id,
          signature: selectorFor(el),
          label: label.slice(0, 200),
        });

        sequence += 1;
        if (result.length >= max) break;
      }

      return result;
    },
    { key: sweepKey, max: maxButtons },
  );
}

async function clickCandidateById(page: Page, id: string) {
  const locator = page.locator(`[data-e2e-mega-id="${id}"]`).first();
  const beforeUrl = page.url();

  const visible = await locator.isVisible().catch(() => false);
  if (!visible) return false;

  const enabled = await locator.isEnabled().catch(() => false);
  if (!enabled) return false;

  await locator.scrollIntoViewIfNeeded().catch(() => null);

  const clicked = await locator
    .click({ timeout: 4_000 })
    .then(() => true)
    .catch(() => false);

  if (clicked) {
    const afterClickUrl = page.url();
    if (afterClickUrl !== beforeUrl || AUTH_ROUTE_RE.test(afterClickUrl)) {
      await waitForUiSettle(page, 2_000);
    }
    await page.waitForTimeout(120);
  }

  return clicked;
}

async function sweepRouteButtons(
  page: Page,
  route: RouteSweep,
  allowDestructive: boolean,
): Promise<SweepStats> {
  await gotoAuthed(page, route.path, route.readySelector);

  const maxIterations = route.maxIterations || 60;
  const maxButtonsPerSnapshot = route.maxButtonsPerSnapshot || 90;

  megaLog(
    `route-sweep:start route=${route.id} path=${route.path} maxIterations=${maxIterations} maxButtons=${maxButtonsPerSnapshot}`,
  );

  const discovered = new Set<string>();
  const attempted = new Set<string>();

  let clicked = 0;
  let skippedDestructive = 0;
  let failedClicks = 0;
  let idleRounds = 0;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    if (iteration === 0 || iteration % 10 === 0) {
      megaVerboseLog(
        `route-sweep:progress route=${route.id} iteration=${iteration}/${maxIterations} discovered=${discovered.size} attempted=${attempted.size} clicked=${clicked}`,
      );
    }

    if (!routeMatches(page.url(), route.path) || AUTH_ROUTE_RE.test(page.url())) {
      await gotoAuthed(page, route.path, route.readySelector);
    }

    const candidates = await snapshotVisibleButtons(
      page,
      `${route.id}-${Date.now()}-${iteration}`,
      maxButtonsPerSnapshot,
    );

    for (const row of candidates) {
      discovered.add(row.signature);
    }

    const next = candidates.find((row) => !attempted.has(row.signature));
    if (!next) {
      idleRounds += 1;
      if (idleRounds >= 2) break;
      await closeTransientUi(page);
      continue;
    }

    idleRounds = 0;
    attempted.add(next.signature);

    const isDestructive = DESTRUCTIVE_BUTTON_RE.test(next.label);
    if (isDestructive && !allowDestructive) {
      skippedDestructive += 1;
      continue;
    }

    const clickedNow = await clickCandidateById(page, next.id);
    if (!clickedNow) {
      failedClicks += 1;
      continue;
    }

    clicked += 1;
    await tryFillVisibleDialogFields(page);
    await closeTransientUi(page);
  }

  megaLog(
    `route-sweep:done route=${route.id} discovered=${discovered.size} attempted=${attempted.size} clicked=${clicked} skippedDestructive=${skippedDestructive} failedClicks=${failedClicks}`,
  );

  return {
    routeId: route.id,
    discovered: discovered.size,
    attempted: attempted.size,
    clicked,
    skippedDestructive,
    failedClicks,
  };
}

async function toggleSettingsSwitches(page: Page) {
  await gotoAuthed(
    page,
    "/settings?tab=notifications",
    ".repeto-settings-content, .repeto-settings-page-head__title, .repeto-settings-overlay, .repeto-top-header, h1",
  );

  const toggles = page.locator("input[type='checkbox'], [role='switch'], [role='checkbox']");
  const count = Math.min(await toggles.count(), 20);
  let toggled = 0;

  for (let i = 0; i < count; i += 1) {
    const toggle = toggles.nth(i);

    const visible = await toggle.isVisible().catch(() => false);
    if (!visible) continue;

    const enabled = await toggle.isEnabled().catch(() => false);
    if (!enabled) continue;

    await toggle.click({ force: true }).catch(() => null);
    await page.waitForTimeout(120);
    await toggle.click({ force: true }).catch(() => null);
    toggled += 1;
  }

  return toggled;
}

async function safeDelete(page: Page, path: string, headers: Record<string, string>) {
  await page.request.delete(path, { headers }).catch(() => null);
}

async function readNotificationSettings(page: Page, headers: Record<string, string>) {
  const response = await page.request.get(`${API_BASE}/settings`, { headers });
  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as {
    notificationSettings?: Record<string, unknown>;
  };

  if (
    payload.notificationSettings &&
    typeof payload.notificationSettings === "object" &&
    !Array.isArray(payload.notificationSettings)
  ) {
    return payload.notificationSettings;
  }

  return {} as Record<string, unknown>;
}

async function patchNotificationSettings(
  page: Page,
  headers: Record<string, string>,
  settings: Record<string, unknown>,
) {
  const response = await page.request.patch(`${API_BASE}/settings/notifications`, {
    headers,
    data: settings,
  });
  expect(response.ok()).toBeTruthy();
  return response;
}

async function createLesson(
  page: Page,
  headers: Record<string, string>,
  dto: {
    studentId: string;
    subject?: string;
    scheduledAt: string;
    duration?: number;
    rate?: number;
  },
) {
  const response = await page.request.post(`${API_BASE}/lessons`, {
    headers,
    data: {
      studentId: dto.studentId,
      subject: dto.subject || "Математика",
      scheduledAt: dto.scheduledAt,
      duration: dto.duration ?? 60,
      rate: dto.rate ?? 2200,
      format: "ONLINE",
    },
  });
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  if (Array.isArray(payload)) {
    const first = payload[0] as { id?: string } | undefined;
    return String(first?.id || "");
  }

  return String((payload as { id?: string }).id || "");
}

async function createHomework(
  page: Page,
  headers: Record<string, string>,
  studentId: string,
  task: string,
  lessonId?: string,
  fileIds: string[] = [],
) {
  const response = await page.request.post(`${API_BASE}/students/${studentId}/homework`, {
    headers,
    data: {
      task,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      lessonId,
      fileIds,
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { id?: string; status?: string };
}

async function readPortalData(page: Page, studentHeaders: Record<string, string>, studentId: string) {
  const response = await page.request.get(`${API_BASE}/student-portal/students/${studentId}/data`, {
    headers: studentHeaders,
  });
  expect(response.ok()).toBeTruthy();

  return (await response.json()) as {
    homework?: Array<{
      id?: string;
      task?: string;
      done?: boolean;
      linkedFiles?: Array<{ id?: string }>;
      studentUploads?: Array<{ id?: string; url?: string }>;
    }>;
    files?: Array<{ id?: string }>;
    notifications?: {
      telegram?: { connected?: boolean; deepLink?: string };
      max?: { connected?: boolean; deepLink?: string };
    } | null;
  };
}

async function runSettingsAllTabsCycle(page: Page, allowDestructive: boolean) {
  const totals = {
    visitedTabs: 0,
    discovered: 0,
    attempted: 0,
    clicked: 0,
    skippedDestructive: 0,
    failedClicks: 0,
  };

  for (const tab of SETTINGS_TAB_PLAN) {
    const path = tab.key === "account" ? "/settings" : `/settings?tab=${encodeURIComponent(tab.key)}`;

    await gotoAuthed(page, path, ".repeto-settings-layout, .repeto-settings-content");

    const navButton = page
      .locator(".page-overlay__nav-item, .repeto-settings-nav-btn, button")
      .filter({ hasText: tab.label })
      .first();

    if (await navButton.isVisible().catch(() => false)) {
      await navButton.click({ timeout: 2_000 }).catch(() => null);
      await waitForUiSettle(page, 2_000);
    }

    await expectAnySelectorVisible(
      page,
      ".repeto-settings-page-head__title, .repeto-settings-section-card, .repeto-settings-content",
      10_000,
    );

    const stats = await sweepRouteButtons(
      page,
      {
        id: `settings-tab-${tab.key}`,
        path,
        readySelector: ".repeto-settings-layout, .repeto-settings-content, .repeto-settings-page-head__title",
        maxIterations: 35,
        maxButtonsPerSnapshot: 100,
      },
      allowDestructive,
    );

    totals.visitedTabs += 1;
    totals.discovered += stats.discovered;
    totals.attempted += stats.attempted;
    totals.clicked += stats.clicked;
    totals.skippedDestructive += stats.skippedDestructive;
    totals.failedClicks += stats.failedClicks;
  }

  return totals;
}

async function runNotificationsAndHomeworkCycle(page: Page): Promise<NotificationsHomeworkResult> {
  const headers = await authHeaders(page);
  const originalNotificationSettings = await readNotificationSettings(page, headers);

  const sectionStats: NotificationsHomeworkResult = {
    status: "pass",
    details: "Notifications/homework cycle completed.",
    incompleteReasons: [],
    channelsChecked: 0,
    remindersChecked: 0,
    homeworkChecks: 0,
    portalChecks: 0,
    crossAccountChecks: 0,
    multiTutorChecks: 0,
  };

  let studentId: string | null = null;
  let studentEmail = "";
  let baseLessonId: string | null = null;
  let baseHomeworkId: string | null = null;
  const tempLessonIds: string[] = [];
  let sharedFileId: string | null = null;

  try {
    const marker = randomSuffix();
    const desiredStudentEmail = `mega.flow.${marker}@example.com`;
    const student = await createStudent(page, headers, {
      name: `Mega Flow ${marker}`,
      email: desiredStudentEmail,
      phone: `+7${String(Date.now()).slice(-10)}`,
      subject: "Физика",
      rate: 2800,
      parentEmail: `mega.parent.${marker}@example.com`,
    });

    studentId = student.id;
    studentEmail = String(student.email || desiredStudentEmail).trim();
    expect(studentEmail).toContain("@");

    await activateStudentAccount(page, headers, studentId);

    baseLessonId = await createLesson(page, headers, {
      studentId,
      subject: "Физика",
      scheduledAt: plusMinutesIso(35),
      duration: 60,
      rate: 2800,
    });
    expect(baseLessonId.length).toBeGreaterThan(0);

    sharedFileId = await maybePickFileId(page, headers);
    if (sharedFileId) {
      const shareResponse = await page.request.patch(`${API_BASE}/files/${sharedFileId}/share`, {
        headers,
        data: {
          studentIds: [studentId],
          applyToChildren: false,
        },
      });
      expect(shareResponse.ok()).toBeTruthy();
      sectionStats.homeworkChecks += 1;
    }

    const homeworkPayload = await createHomework(
      page,
      headers,
      studentId,
      `Mega homework ${marker}`,
      baseLessonId,
      sharedFileId ? [sharedFileId] : [],
    );
    baseHomeworkId = String(homeworkPayload.id || "");
    expect(baseHomeworkId.length).toBeGreaterThan(0);

    const studentSession = await loginStudentViaHarness(page, studentEmail);
    if (!studentSession?.accessToken) {
      sectionStats.status = "incomplete";
      sectionStats.details =
        "Student OTP harness is required for full homework/materials cycle. Use real backend API (not mock /api) and enable testing OTP endpoints.";
      sectionStats.incompleteReasons.push(sectionStats.details);
      return sectionStats;
    }

    const studentHeaders = { Authorization: `Bearer ${studentSession!.accessToken}` };

    const portalBefore = await readPortalData(page, studentHeaders, studentId);
    const homeworkBefore = (Array.isArray(portalBefore.homework) ? portalBefore.homework : []).find(
      (row) => row.id === baseHomeworkId,
    );
    expect(homeworkBefore).toBeTruthy();
    sectionStats.portalChecks += 1;
    sectionStats.crossAccountChecks += 1;

    if (sharedFileId) {
      const sharedVisible = (Array.isArray(portalBefore.files) ? portalBefore.files : []).some(
        (row) => row.id === sharedFileId,
      );
      expect(sharedVisible).toBeTruthy();
      sectionStats.homeworkChecks += 1;
      sectionStats.crossAccountChecks += 1;
    }

    const toggleDoneResponse = await page.request.patch(
      `${API_BASE}/student-portal/students/${studentId}/homework/${baseHomeworkId}`,
      {
        headers: studentHeaders,
        data: { done: true },
      },
    );
    expect(toggleDoneResponse.ok()).toBeTruthy();

    const uploadResponse = await page.request.post(
      `${API_BASE}/student-portal/students/${studentId}/homework/${baseHomeworkId}/upload`,
      {
        headers: studentHeaders,
        multipart: {
          file: {
            name: `mega-homework-${marker}.txt`,
            mimeType: "text/plain",
            buffer: Buffer.from("mega-homework-upload", "utf-8"),
          },
        },
      },
    );
    expect(uploadResponse.ok()).toBeTruthy();

    const portalAfterUpload = await readPortalData(page, studentHeaders, studentId);
    const homeworkAfter = (Array.isArray(portalAfterUpload.homework) ? portalAfterUpload.homework : []).find(
      (row) => row.id === baseHomeworkId,
    );
    expect(Boolean(homeworkAfter?.done)).toBeTruthy();
    expect((homeworkAfter?.studentUploads || []).length).toBeGreaterThan(0);
    sectionStats.homeworkChecks += 2;
    sectionStats.portalChecks += 1;
    sectionStats.crossAccountChecks += 1;

    const tutorHomeworkSubmitNotice = await waitForTutorNotification(
      page,
      headers,
      "SYSTEM",
      (row) => row.studentId === studentId && /домаш|homework|загруз|решени/i.test(row.title),
      8_000,
    );
    if (tutorHomeworkSubmitNotice) {
      sectionStats.crossAccountChecks += 1;
    }

    for (const channel of ["EMAIL", "PUSH", "TELEGRAM", "MAX"] as NotificationChannelCode[]) {
      await patchNotificationSettings(page, headers, {
        channels: [channel],
        channel: channel.toLowerCase(),
        studentReminder: true,
        studentReminderHours: "2",
        selfReminder: true,
        selfReminderMins: "180",
        paymentReminder: true,
        paymentReminderDays: "3",
        cancelNotify: true,
      });

      const lessonId = await createLesson(page, headers, {
        studentId,
        subject: `Reminder ${channel}`,
        scheduledAt: plusMinutesIso(40 + sectionStats.channelsChecked * 2),
        duration: 60,
        rate: 2000,
      });
      expect(lessonId.length).toBeGreaterThan(0);
      tempLessonIds.push(lessonId);

      const tutorReminder = await waitForTutorNotification(
        page,
        headers,
        "LESSON_REMINDER",
        (row) => row.lessonId === lessonId && /Скоро занятие/i.test(row.title),
      );

      expect(tutorReminder).toBeTruthy();
      expect(String(tutorReminder?.channel || "").toUpperCase()).toBe(channel);
      sectionStats.channelsChecked += 1;
    }

    await patchNotificationSettings(page, headers, {
      channels: ["TELEGRAM", "MAX", "PUSH", "EMAIL"],
      channel: "telegram",
      studentReminder: true,
      studentReminderHours: "2",
      selfReminder: true,
      selfReminderMins: "60",
      paymentReminder: true,
      paymentReminderDays: "3",
      cancelNotify: true,
    });

    await clearMessengerOutbox(page, headers);

    const lessonReminderResponse = await page.request.post(
      `${API_BASE}/notifications/send-reminder/${studentId}`,
      {
        headers,
        data: {
          type: "lesson",
          lessonIds: [baseLessonId],
          comment: "MEGA lesson reminder",
          notifyParent: true,
        },
      },
    );
    expect(lessonReminderResponse.ok()).toBeTruthy();
    const lessonReminderPayload = (await lessonReminderResponse.json()) as {
      telegram?: boolean;
      max?: boolean;
      parentNotified?: boolean;
    };
    expect(typeof lessonReminderPayload.parentNotified).toBe("boolean");
    sectionStats.remindersChecked += 1;

    const homeworkReminderResponse = await page.request.post(
      `${API_BASE}/notifications/send-reminder/${studentId}`,
      {
        headers,
        data: {
          type: "homework",
          homeworkIds: [baseHomeworkId],
          comment: "MEGA homework reminder",
          notifyParent: true,
        },
      },
    );
    expect(homeworkReminderResponse.ok()).toBeTruthy();
    const homeworkReminderPayload = (await homeworkReminderResponse.json()) as {
      telegram?: boolean;
      max?: boolean;
      parentNotified?: boolean;
    };
    expect(typeof homeworkReminderPayload.parentNotified).toBe("boolean");
    sectionStats.remindersChecked += 1;

    const tutorLessonNotice = await waitForTutorNotification(
      page,
      headers,
      "LESSON_REMINDER",
      (row) => row.studentId === studentId && /Напоминание о занятии отправлено/i.test(row.title),
    );
    expect(tutorLessonNotice).toBeTruthy();
    sectionStats.remindersChecked += 1;

    const tutorHomeworkNotice = await waitForTutorNotification(
      page,
      headers,
      "SYSTEM",
      (row) => row.studentId === studentId && /Напоминание о домашке отправлено/i.test(row.title),
    );
    expect(tutorHomeworkNotice).toBeTruthy();
    sectionStats.remindersChecked += 1;

    const outboxResponse = await page.request.get(`${API_BASE}/notifications/testing/messenger-outbox`, {
      headers,
      params: { studentId },
    });

    if (outboxResponse.status() !== 403 && outboxResponse.status() !== 404) {
      expect(outboxResponse.ok()).toBeTruthy();
      const outbox = (await outboxResponse.json()) as {
        records?: Array<{
          eventType?: string;
          studentId?: string;
          channels?: string[];
        }>;
      };

      const records = Array.isArray(outbox.records) ? outbox.records : [];
      const hasLessonRecord = records.some(
        (row) =>
          row.studentId === studentId &&
          row.eventType === "lesson_reminder" &&
          Array.isArray(row.channels) &&
          row.channels.includes("TELEGRAM") &&
          row.channels.includes("MAX"),
      );

      const hasHomeworkRecord = records.some(
        (row) =>
          row.studentId === studentId &&
          row.eventType === "homework_reminder" &&
          Array.isArray(row.channels) &&
          row.channels.includes("TELEGRAM") &&
          row.channels.includes("MAX"),
      );

      expect(hasLessonRecord).toBeTruthy();
      expect(hasHomeworkRecord).toBeTruthy();
      sectionStats.remindersChecked += 2;
    }

    const portalAfterReminders = await readPortalData(page, studentHeaders, studentId);
    const integrationHints = portalAfterReminders.notifications;
    expect(Boolean(integrationHints)).toBeTruthy();
    expect(Boolean(integrationHints?.telegram) || Boolean(integrationHints?.max)).toBeTruthy();
    sectionStats.portalChecks += 1;
    sectionStats.crossAccountChecks += 1;

    if (sharedFileId) {
      const revokeShareResponse = await page.request.patch(`${API_BASE}/files/${sharedFileId}/share`, {
        headers,
        data: {
          studentIds: [],
          applyToChildren: false,
        },
      });
      expect(revokeShareResponse.ok()).toBeTruthy();

      const portalAfterRevoke = await readPortalData(page, studentHeaders, studentId);
      const stillShared = (Array.isArray(portalAfterRevoke.files) ? portalAfterRevoke.files : []).some(
        (row) => row.id === sharedFileId,
      );
      expect(stillShared).toBeFalsy();
      sectionStats.homeworkChecks += 1;
      sectionStats.portalChecks += 1;
      sectionStats.crossAccountChecks += 1;
    }

    const multiTutor = await runMultiTutorCycle(page, studentEmail);
    if (multiTutor.status === "pass") {
      sectionStats.multiTutorChecks += multiTutor.checks;
      sectionStats.crossAccountChecks += 1;
    } else if (multiTutor.status === "incomplete") {
      sectionStats.status = sectionStats.status === "fail" ? "fail" : "incomplete";
      sectionStats.incompleteReasons.push(multiTutor.details);
    } else {
      sectionStats.status = "fail";
      sectionStats.details = `Multi-tutor check failed: ${multiTutor.details}`;
    }
  } finally {
    await page.request
      .patch(`${API_BASE}/settings/notifications`, {
        headers,
        data: originalNotificationSettings,
      })
      .catch(() => null);

    if (sharedFileId && studentId) {
      await page.request
        .patch(`${API_BASE}/files/${sharedFileId}/share`, {
          headers,
          data: {
            studentIds: [],
            applyToChildren: false,
          },
        })
        .catch(() => null);
    }

    if (baseHomeworkId && studentId) {
      await page.request
        .delete(`${API_BASE}/students/${studentId}/homework/${baseHomeworkId}`, { headers })
        .catch(() => null);
    }

    const lessonIdsToDelete = [baseLessonId, ...tempLessonIds].filter(
      (row): row is string => typeof row === "string" && row.length > 0,
    );
    for (const lessonId of lessonIdsToDelete) {
      await safeDelete(page, `${API_BASE}/lessons/${lessonId}`, headers);
    }

    if (studentId) {
      await safeDelete(page, `${API_BASE}/students/${studentId}`, headers);
    }
  }

  if (sectionStats.status === "pass") {
    sectionStats.details =
      `channels=${sectionStats.channelsChecked}, reminders=${sectionStats.remindersChecked}, ` +
      `homework=${sectionStats.homeworkChecks}, portal=${sectionStats.portalChecks}, ` +
      `crossAccount=${sectionStats.crossAccountChecks}, multiTutor=${sectionStats.multiTutorChecks}`;
  }

  if (sectionStats.status === "incomplete" && sectionStats.incompleteReasons.length > 0) {
    sectionStats.details = sectionStats.incompleteReasons.join(" | ");
  }

  return sectionStats;
}

async function runStudentsFormCycle(page: Page) {
  await gotoAuthed(page, "/students", ".repeto-top-header, .page-overlay__title, h1");

  const openButton = page
    .locator("button")
    .filter({ hasText: /Новый ученик|Добавить ученика/i })
    .first();

  if (!(await openButton.isVisible().catch(() => false))) {
    return { opened: false, filled: 0 };
  }

  await openButton.click();
  await page.waitForTimeout(250);

  const dialog = page
    .locator("[role='dialog'], [aria-label='Новый ученик'], [aria-label='Карточка ученика']")
    .first();

  if (!(await dialog.isVisible().catch(() => false))) {
    return { opened: true, filled: 0 };
  }

  const filled = await tryFillVisibleDialogFields(page);

  // In mega sweep we intentionally do not persist UI-form entities to keep runs deterministic.
  await closeTransientUi(page);

  return { opened: true, filled };
}

async function runPaymentFormCycle(page: Page) {
  await gotoAuthed(page, "/payments", ".repeto-top-header, .page-overlay__title, h1");

  const openButton = page
    .locator("button")
    .filter({ hasText: /Записать оплату|Добавить оплату/i })
    .first();

  if (!(await openButton.isVisible().catch(() => false))) {
    return { opened: false, filled: 0 };
  }

  await openButton.click();
  await page.waitForTimeout(250);

  const dialog = page
    .locator("[role='dialog'], [aria-label='Новая оплата'], [aria-label='Редактирование оплаты']")
    .first();

  if (!(await dialog.isVisible().catch(() => false))) {
    return { opened: true, filled: 0 };
  }

  const filled = await tryFillVisibleDialogFields(page);
  await closeTransientUi(page);

  return { opened: true, filled };
}

async function runPackageFormCycle(page: Page) {
  await gotoAuthed(page, "/packages", ".repeto-top-header, .page-overlay__title, h1");

  const openButton = page
    .locator("button")
    .filter({ hasText: /Новый пакет|Добавить пакет/i })
    .first();

  if (!(await openButton.isVisible().catch(() => false))) {
    return { opened: false, filled: 0 };
  }

  await openButton.click();
  await page.waitForTimeout(250);

  const dialog = page
    .locator("[role='dialog'], [aria-label='Новый пакет'], [aria-label='Редактирование пакета']")
    .first();

  if (!(await dialog.isVisible().catch(() => false))) {
    return { opened: true, filled: 0 };
  }

  const filled = await tryFillVisibleDialogFields(page);
  await closeTransientUi(page);

  return { opened: true, filled };
}

async function runSupportFormCycle(page: Page) {
  await gotoAuthed(page, "/support", "input[placeholder*='Поиск'], .repeto-top-header, h1");

  const searchInput = page
    .locator("input[placeholder*='Поиск'], input[placeholder*='стать'], input[type='search']")
    .first();

  if (!(await searchInput.isVisible().catch(() => false))) {
    return false;
  }

  await searchInput.fill("оплата");
  await searchInput.press("Enter").catch(() => null);
  await waitForUiSettle(page, 2_000);
  await searchInput.fill("");
  return true;
}

async function runAuthSwitchCycle(page: Page) {
  await page.context().clearCookies();
  await page.goto("/auth?view=signin", { waitUntil: "domcontentloaded" });
  await waitForUiSettle(page, 2_000);

  const studentSwitch = page
    .getByRole("button", { name: /у меня есть репетитор|вход ученика/i })
    .first();

  if (await studentSwitch.isVisible().catch(() => false)) {
    await studentSwitch.click();
    await page.waitForTimeout(150);
  }

  const tutorSwitch = page
    .getByRole("button", { name: /я репетитор|для репетиторов|вход в repeto/i })
    .first();

  if (await tutorSwitch.isVisible().catch(() => false)) {
    await tutorSwitch.click();
    await page.waitForTimeout(150);
  }

  const relogged = (await loginViaAPI(page).catch(() => false)) || false;
  if (!relogged) {
    await loginViaUI(page);
  }
}

async function readTutorSlug(page: Page): Promise<string | null> {
  try {
    const token = await getAuthToken(page);
    const response = await page.request.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok()) return null;
    const me = (await response.json()) as { slug?: string | null };
    const slug = String(me.slug || "").trim();
    return slug.length > 0 ? slug : null;
  } catch {
    return null;
  }
}

async function ensurePublicProfile(page: Page, slugSeed: string): Promise<PublicProfileState> {
  const token = await getAuthToken(page);
  const headers = { Authorization: `Bearer ${token}` };

  const settingsResponse = await page.request.get("/api/settings", { headers });
  if (!settingsResponse.ok()) {
    return { slug: null, restore: async () => undefined };
  }

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
    const slugResponse = await page.request.get("/api/settings/account/slug", {
      headers,
      params: { value: `${slugSeed}-${Date.now()}` },
    });

    if (!slugResponse.ok()) {
      return { slug: null, restore: async () => undefined };
    }

    const slugPayload = (await slugResponse.json()) as {
      suggested?: string;
      requested?: string;
      slug?: string;
    };
    publicSlug = String(
      slugPayload.suggested || slugPayload.requested || slugPayload.slug || "",
    ).trim();
  }

  if (!publicSlug) {
    return { slug: null, restore: async () => undefined };
  }

  const shouldPatch =
    !originalPublished ||
    publicSlug !== originalSlug ||
    settings.showPublicPackages === false;

  if (shouldPatch) {
    const patchResponse = await page.request.patch("/api/settings/account", {
      headers,
      data: {
        slug: publicSlug,
        published: true,
        showPublicPackages: true,
      },
    });

    if (!patchResponse.ok()) {
      return { slug: null, restore: async () => undefined };
    }
  }

  const restore = async () => {
    if (!shouldPatch) return;

    await page.request
      .patch("/api/settings/account", {
        headers,
        data: {
          slug: originalSlug,
          published: originalPublished,
          showPublicPackages: originalShowPublicPackages,
        },
      })
      .catch(() => null);
  };

  return { slug: publicSlug, restore };
}

async function runPublicBookingCycle(page: Page, slug: string) {
  await page.goto(`/t/${slug}/book`, { waitUntil: "domcontentloaded" });
  await waitForUiSettle(page, 3_000);

  const firstOption = page.locator(".repeto-bk-option").first();
  if (!(await firstOption.isVisible().catch(() => false))) {
    return { opened: true, advanced: false, filled: 0 };
  }

  await firstOption.click({ timeout: 2_000 }).catch(() => null);

  const continueButton = page
    .locator(".repeto-bk-action-btn")
    .filter({ hasText: /Продолжить|Далее/i })
    .first();

  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click({ timeout: 2_000 }).catch(() => null);
    await waitForUiSettle(page, 2_000);
  }

  const filled = await tryFillVisibleDialogFields(page);
  await closeTransientUi(page);

  return { opened: true, advanced: true, filled };
}

test.describe("Mega UI Cycle", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(MEGA_NO_TIMEOUT ? 0 : RESOLVED_MEGA_TIMEOUT_MS);

  test("MEGA-UI-001 long tutor+student UI cycle with all visible buttons sweep", async ({
    authedPage: page,
  }) => {
    // Keep the whole test no-timeout-capable, but prevent any single UI action from waiting forever.
    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(20_000);

    const dialogHandler = async (dialog: Dialog) => {
      megaVerboseLog(`dialog detected type=${dialog.type()} message=${dialog.message().slice(0, 120)}`);
      await dialog.dismiss().catch(() => null);
    };
    page.on("dialog", dialogHandler);

    megaLog(
      `start MEGA-UI-001 timeout=${MEGA_NO_TIMEOUT ? "disabled" : `${RESOLVED_MEGA_TIMEOUT_MS}ms`} verbose=${MEGA_VERBOSE ? "on" : "off"}`,
    );

    let currentPhase = "bootstrap";
    const setPhase = (phase: string) => {
      currentPhase = phase;
      megaLog(`phase ${phase}`);
    };

    const heartbeatTimer: ReturnType<typeof setInterval> | null = MEGA_VERBOSE
      ? setInterval(() => {
          megaLog(`heartbeat phase=${currentPhase}`);
        }, RESOLVED_MEGA_HEARTBEAT_MS)
      : null;

    try {
      const allowDestructive =
        String(process.env.E2E_MEGA_PRESS_DESTRUCTIVE || "").trim() === "1";

    const totals = {
      discovered: 0,
      attempted: 0,
      clicked: 0,
      skippedDestructive: 0,
      failedClicks: 0,
      formsTouched: 0,
      formsFilled: 0,
      switchesPressed: 0,
      settingsTabsVisited: 0,
      notificationChannelsChecked: 0,
      reminderEventsChecked: 0,
      homeworkChecks: 0,
      portalChecks: 0,
      crossAccountChecks: 0,
      multiTutorChecks: 0,
      contractChecks: 0,
      contractEffects: 0,
      negativeChecks: 0,
      persistenceChecks: 0,
    };

    const layerStatuses: LayerStatus[] = [];
    const recordLayer = (layer: CoverageLayer, status: GateStatus, details: string) => {
      layerStatuses.push({ layer, status, details });
      megaLog(`layer-status ${layer}=${status} details=${details}`);
    };

    setPhase("students-form");
    const studentsCycle = await runStudentsFormCycle(page);
    totals.formsTouched += studentsCycle.opened ? 1 : 0;
    totals.formsFilled += studentsCycle.filled;

    setPhase("payments-form");
    const paymentsCycle = await runPaymentFormCycle(page);
    totals.formsTouched += paymentsCycle.opened ? 1 : 0;
    totals.formsFilled += paymentsCycle.filled;

    setPhase("packages-form");
    const packagesCycle = await runPackageFormCycle(page);
    totals.formsTouched += packagesCycle.opened ? 1 : 0;
    totals.formsFilled += packagesCycle.filled;

    setPhase("support-form");
    const supportCycleOk = await runSupportFormCycle(page);
    if (supportCycleOk) {
      totals.formsTouched += 1;
      totals.formsFilled += 1;
    }

    setPhase("effect-contract");
    const contractResult = await runControlEffectContractCycle(page).catch(
      (error): EffectContractResult => ({
        status: "fail",
        details: `Contract cycle crashed: ${normalizeErrorMessage(error)}`,
        checks: 0,
        effects: 0,
      }),
    );
    totals.contractChecks += contractResult.checks;
    totals.contractEffects += contractResult.effects;
    recordLayer("contract-coverage", contractResult.status, contractResult.details);

    setPhase("negative-guard");
    const negativeResult = await runNegativeAndGuardCycle(page).catch(
      (error): NegativeGuardResult => ({
        status: "fail",
        details: `Negative/guard cycle crashed: ${normalizeErrorMessage(error)}`,
        checks: 0,
      }),
    );
    totals.negativeChecks += negativeResult.checks;

    setPhase("a11y-keyboard-mobile");
    const a11yResult = await runA11yKeyboardMobileCycle(page).catch(
      (error): BlockStatusResult => ({
        status: "fail",
        details: `A11y/keyboard/mobile cycle crashed: ${normalizeErrorMessage(error)}`,
      }),
    );

    const effectStatuses: GateStatus[] = [contractResult.status, a11yResult.status];
    const effectStatus: GateStatus = effectStatuses.includes("fail")
      ? "fail"
      : effectStatuses.includes("incomplete")
        ? "incomplete"
        : "pass";
    recordLayer(
      "effect-coverage",
      effectStatus,
      `contract=${contractResult.status}; a11y=${a11yResult.status}; negative=${negativeResult.status}`,
    );

    setPhase("persistence");
    const persistenceResult = await runPersistenceCycle(page).catch(
      (error): PersistenceResult => ({
        status: "fail",
        details: `Persistence cycle crashed: ${normalizeErrorMessage(error)}`,
        checks: 0,
      }),
    );
    totals.persistenceChecks += persistenceResult.checks;
    recordLayer("persistence-coverage", persistenceResult.status, persistenceResult.details);

    setPhase("settings-switches");
    totals.switchesPressed += await toggleSettingsSwitches(page);

    setPhase("notifications-homework-cross-account");
    const remindersAndHomework = await runNotificationsAndHomeworkCycle(page);
    totals.notificationChannelsChecked += remindersAndHomework.channelsChecked;
    totals.reminderEventsChecked += remindersAndHomework.remindersChecked;
    totals.homeworkChecks += remindersAndHomework.homeworkChecks;
    totals.portalChecks += remindersAndHomework.portalChecks;
    totals.crossAccountChecks += remindersAndHomework.crossAccountChecks;
    totals.multiTutorChecks += remindersAndHomework.multiTutorChecks;
    recordLayer(
      "cross-account-coverage",
      remindersAndHomework.status,
      remindersAndHomework.details,
    );

    setPhase("settings-all-tabs");
    const settingsTabsSweep = await runSettingsAllTabsCycle(page, allowDestructive);
    totals.settingsTabsVisited += settingsTabsSweep.visitedTabs;
    totals.discovered += settingsTabsSweep.discovered;
    totals.attempted += settingsTabsSweep.attempted;
    totals.clicked += settingsTabsSweep.clicked;
    totals.skippedDestructive += settingsTabsSweep.skippedDestructive;
    totals.failedClicks += settingsTabsSweep.failedClicks;

    setPhase("public-profile-and-booking");
    const publicProfile = await ensurePublicProfile(page, "mega-ui");

    try {
      if (publicProfile.slug) {
        const publicCycle = await runPublicBookingCycle(page, publicProfile.slug);
        totals.formsTouched += publicCycle.opened ? 1 : 0;
        totals.formsFilled += publicCycle.filled;

        const publicSweep = await sweepRouteButtons(
          page,
          {
            id: "public-booking",
            path: `/t/${publicProfile.slug}/book`,
            readySelector: ".repeto-bk-step, .repeto-bk-options, .repeto-bk-option",
            maxIterations: 45,
            maxButtonsPerSnapshot: 80,
          },
          allowDestructive,
        );

        totals.discovered += publicSweep.discovered;
        totals.attempted += publicSweep.attempted;
        totals.clicked += publicSweep.clicked;
        totals.skippedDestructive += publicSweep.skippedDestructive;
        totals.failedClicks += publicSweep.failedClicks;
      }

      setPhase("route-sweep-plan");
      for (const route of ROUTE_SWEEP_PLAN) {
        setPhase(`route-sweep:${route.id}`);
        const stats = await sweepRouteButtons(page, route, allowDestructive);
        totals.discovered += stats.discovered;
        totals.attempted += stats.attempted;
        totals.clicked += stats.clicked;
        totals.skippedDestructive += stats.skippedDestructive;
        totals.failedClicks += stats.failedClicks;
      }

      setPhase("auth-switch");
      await runAuthSwitchCycle(page);
    } finally {
      await publicProfile.restore();
    }

    const controlStatus: GateStatus =
      totals.discovered > 50 &&
      totals.attempted > 30 &&
      totals.clicked > 25 &&
      totals.settingsTabsVisited >= SETTINGS_TAB_PLAN.length
        ? "pass"
        : "fail";

    recordLayer(
      "control-coverage",
      controlStatus,
      `discovered=${totals.discovered}, attempted=${totals.attempted}, clicked=${totals.clicked}, settingsTabs=${totals.settingsTabsVisited}`,
    );

    setPhase("visual-layer");
    const visualLayer = await runVisualRegressionLayer(page).catch(
      (error): BlockStatusResult => ({
        status: "fail",
        details: `Visual layer failed: ${normalizeErrorMessage(error)}`,
      }),
    );
    recordLayer("visual-coverage", visualLayer.status, visualLayer.details);

    const coreGate = gateStatusForLayers(layerStatuses, [
      "control-coverage",
      "effect-coverage",
      "persistence-coverage",
      "contract-coverage",
    ]);

    const fullGate = gateStatusForLayers(layerStatuses, [
      "control-coverage",
      "effect-coverage",
      "persistence-coverage",
      "cross-account-coverage",
      "visual-coverage",
      "contract-coverage",
    ]);

    const incompleteReasons = layerStatuses
      .filter((row) => row.status === "incomplete")
      .map((row) => `${row.layer}: ${row.details}`);

    const failedReasons = layerStatuses
      .filter((row) => row.status === "fail")
      .map((row) => `${row.layer}: ${row.details}`);

    megaLog(
      `gate-result core100=${coreGate} full100=${fullGate} incomplete=${incompleteReasons.length} failed=${failedReasons.length}`,
    );

    test.info().annotations.push({
      type: "mega-ui-summary",
      description: JSON.stringify({
        totals,
        layers: layerStatuses,
        gate: {
          core100: coreGate,
          full100: fullGate,
        },
        incompleteReasons,
        failedReasons,
      }),
    });

    expect(totals.discovered).toBeGreaterThan(50);
    expect(totals.attempted).toBeGreaterThan(30);
    expect(totals.clicked).toBeGreaterThan(25);
    expect(totals.formsTouched).toBeGreaterThan(0);
    expect(totals.formsFilled).toBeGreaterThan(0);
    expect(totals.switchesPressed).toBeGreaterThan(0);
    expect(totals.settingsTabsVisited).toBeGreaterThanOrEqual(SETTINGS_TAB_PLAN.length);

    if (remindersAndHomework.status === "pass") {
      expect(totals.notificationChannelsChecked).toBe(4);
      expect(totals.reminderEventsChecked).toBeGreaterThanOrEqual(4);
      expect(totals.homeworkChecks).toBeGreaterThanOrEqual(3);
      expect(totals.portalChecks).toBeGreaterThanOrEqual(2);
      expect(totals.crossAccountChecks).toBeGreaterThanOrEqual(3);
    }

    expect(totals.negativeChecks).toBeGreaterThan(0);
    expect(coreGate).not.toBe("fail");
    expect(fullGate).not.toBe("fail");

      megaLog("done MEGA-UI-001");
    } finally {
      page.off("dialog", dialogHandler);
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      megaLog("stop MEGA-UI-001");
    }
  });
});
