import { test, devices, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { loginViaUI } from './helpers/auth';

type DeviceKind = 'desktop' | 'mobile';
type CaptureKind = 'pages' | 'widgets' | 'groups';

const OUTPUT_ROOT = path.resolve(__dirname, '../../md/screenshots/fullset-light-demo');

function ensureDirFor(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function toOutputPath(device: DeviceKind, kind: CaptureKind, name: string) {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const filePath = path.join(OUTPUT_ROOT, device, kind, `${normalized}.png`);
  ensureDirFor(filePath);
  return filePath;
}

async function setLightTheme(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem('repeto-theme-v2', 'light');
    } catch {
      // Ignore storage errors in test mode.
    }
  });
}

async function gotoReady(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
}

async function waitVisible(locator: Locator) {
  try {
    await locator.waitFor({ state: 'visible', timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

async function screenshotFullPage(page: Page, device: DeviceKind, name: string) {
  const output = toOutputPath(device, 'pages', name);
  await page.screenshot({ path: output, fullPage: true });
}

async function screenshotBySelectors(
  page: Page,
  device: DeviceKind,
  kind: Exclude<CaptureKind, 'pages'>,
  name: string,
  selectors: string[],
) {
  const output = toOutputPath(device, kind, name);

  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await waitVisible(locator)) {
      await locator.scrollIntoViewIfNeeded().catch(() => undefined);
      await locator.screenshot({ path: output });
      return;
    }
  }

  // Fallback to viewport screenshot if exact block is not found.
  await page.screenshot({ path: output, fullPage: false });
}

async function clickFirstVisible(candidates: Locator[]) {
  for (const candidate of candidates) {
    if (await waitVisible(candidate)) {
      await candidate.click();
      return true;
    }
  }
  return false;
}

async function closeModalIfAny(page: Page) {
  const closed = await clickFirstVisible([
    page.getByRole('button', { name: 'Отмена' }).first(),
    page.getByRole('button', { name: 'Закрыть' }).first(),
    page.locator('button[aria-label="Close"]').first(),
    page.locator('[role="dialog"] button').filter({ hasText: /Отмена|Закрыть|Готово/i }).first(),
  ]);

  if (closed) {
    await page.waitForTimeout(350);
  }
}

async function captureDesktop(page: Page) {
  await gotoReady(page, '/registration');
  await screenshotFullPage(page, 'desktop', 'registration-page');
  await screenshotBySelectors(page, 'desktop', 'widgets', 'registration-form', ['form', '[class*="auth"] form', '[class*="registration"] form']);

  await loginViaUI(page);
  await page.emulateMedia({ colorScheme: 'light' });

  await gotoReady(page, '/dashboard');
  await screenshotFullPage(page, 'desktop', 'dashboard-page');
  await screenshotBySelectors(page, 'desktop', 'groups', 'dashboard-top-group', ['main [class*="grid"]', '[class*="dashboard"] [class*="grid"]']);
  await screenshotBySelectors(page, 'desktop', 'widgets', 'dashboard-income-chart', ['.recharts-responsive-container', 'svg.recharts-surface']);
  await screenshotBySelectors(page, 'desktop', 'widgets', 'dashboard-today-schedule', ['text=/Расписание|Сегодня/i', '[class*="schedule"]']);

  await gotoReady(page, '/students');
  await screenshotFullPage(page, 'desktop', 'students-page');
  await screenshotBySelectors(page, 'desktop', 'groups', 'students-filters-and-list', ['table', '[class*="table"]', '[class*="list"]']);

  await clickFirstVisible([
    page.getByRole('button', { name: /Новый ученик|Добавить ученика/i }).first(),
    page.getByRole('button', { name: /Добавить/i }).first(),
  ]);
  await screenshotBySelectors(page, 'desktop', 'widgets', 'students-create-modal', ['[role="dialog"]', '[class*="modal"]']);
  await closeModalIfAny(page);

  const firstStudentRow = page.locator('table tbody tr').first();
  if (await waitVisible(firstStudentRow)) {
    await firstStudentRow.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshotFullPage(page, 'desktop', 'student-detail-page');
    await screenshotBySelectors(page, 'desktop', 'groups', 'student-detail-tabs', ['[role="radiogroup"]', '[role="tablist"]', '[class*="tabs"]']);
  }

  await gotoReady(page, '/schedule');
  await screenshotFullPage(page, 'desktop', 'schedule-month-page');
  await screenshotBySelectors(page, 'desktop', 'groups', 'schedule-calendar-group', ['[class*="calendar"]', '[class*="schedule"]']);

  const weekTab = page.getByRole('radio', { name: 'Неделя' });
  if (await waitVisible(weekTab)) {
    await weekTab.click();
    await page.waitForTimeout(500);
    await screenshotFullPage(page, 'desktop', 'schedule-week-page');
  }

  const dayTab = page.getByRole('radio', { name: 'День' });
  if (await waitVisible(dayTab)) {
    await dayTab.click();
    await page.waitForTimeout(500);
    await screenshotFullPage(page, 'desktop', 'schedule-day-page');
  }

  await clickFirstVisible([
    page.getByRole('button', { name: /Новое занятие/i }).first(),
    page.getByRole('button', { name: /Добавить/i }).first(),
  ]);
  await screenshotBySelectors(page, 'desktop', 'widgets', 'schedule-create-lesson-modal', ['[role="dialog"]', '[class*="modal"]']);
  await closeModalIfAny(page);

  await gotoReady(page, '/finance/payments');
  await screenshotFullPage(page, 'desktop', 'payments-page');
  await screenshotBySelectors(page, 'desktop', 'groups', 'payments-list-group', ['table', '[class*="table"]', '[class*="list"]']);

  await clickFirstVisible([
    page.getByRole('button', { name: /Записать оплату/i }).first(),
    page.getByRole('button', { name: /Новая оплата|Добавить/i }).first(),
  ]);
  await screenshotBySelectors(page, 'desktop', 'widgets', 'payments-create-modal', ['[role="dialog"]', '[class*="modal"]']);
  await closeModalIfAny(page);

  const firstPaymentRow = page.locator('table tbody tr').first();
  if (await waitVisible(firstPaymentRow)) {
    await firstPaymentRow.click();
    await page.waitForTimeout(400);
    await screenshotBySelectors(page, 'desktop', 'widgets', 'payments-detail-modal', ['[role="dialog"]', '[class*="modal"]']);
    await closeModalIfAny(page);
  }

  await gotoReady(page, '/finance/packages');
  await screenshotFullPage(page, 'desktop', 'packages-page');
  await screenshotBySelectors(page, 'desktop', 'groups', 'packages-list-group', ['table', '[class*="card"]', '[class*="package"]']);

  await clickFirstVisible([
    page.getByRole('button', { name: /Новый пакет/i }).first(),
    page.getByRole('button', { name: /Добавить/i }).first(),
  ]);
  await screenshotBySelectors(page, 'desktop', 'widgets', 'packages-create-modal', ['[role="dialog"]', '[class*="modal"]']);
  await closeModalIfAny(page);

  await gotoReady(page, '/notifications');
  await screenshotFullPage(page, 'desktop', 'notifications-page');
  await screenshotBySelectors(page, 'desktop', 'groups', 'notifications-list-group', ['[class*="notification"]', '[class*="list"]', '[class*="empty"]']);

  await gotoReady(page, '/settings');
  await screenshotFullPage(page, 'desktop', 'settings-page');
  await screenshotBySelectors(page, 'desktop', 'groups', 'settings-sections-group', ['[class*="settings"]', '[role="radiogroup"]', '[class*="tabs"]']);
  await screenshotBySelectors(page, 'desktop', 'widgets', 'settings-theme-widget', ['text=/Светлая|Тёмная/i', '[class*="theme"]']);
}

async function captureMobile(page: Page) {
  await loginViaUI(page);
  await page.emulateMedia({ colorScheme: 'light' });

  await gotoReady(page, '/dashboard');
  await screenshotFullPage(page, 'mobile', 'dashboard-page');

  await gotoReady(page, '/students');
  await screenshotFullPage(page, 'mobile', 'students-page');

  await gotoReady(page, '/schedule');
  await screenshotFullPage(page, 'mobile', 'schedule-page');

  await gotoReady(page, '/finance/payments');
  await screenshotFullPage(page, 'mobile', 'payments-page');

  await gotoReady(page, '/finance/packages');
  await screenshotFullPage(page, 'mobile', 'packages-page');

  await gotoReady(page, '/notifications');
  await screenshotFullPage(page, 'mobile', 'notifications-page');

  await gotoReady(page, '/settings');
  await screenshotFullPage(page, 'mobile', 'settings-page');

  await screenshotBySelectors(page, 'mobile', 'groups', 'mobile-main-content-group', ['main', '[role="main"]', '[class*="layout"]']);
}

async function createContext(browser: Browser, kind: DeviceKind) {
  const context = kind === 'desktop'
    ? await browser.newContext({
      baseURL: 'http://localhost:3300',
      viewport: { width: 1720, height: 1024 },
      colorScheme: 'light',
      locale: 'ru-RU',
    })
    : await browser.newContext({
      ...devices['iPhone 13'],
      baseURL: 'http://localhost:3300',
      colorScheme: 'light',
      locale: 'ru-RU',
    });

  await setLightTheme(context);
  return context;
}

function writeManifest() {
  const manifestPath = path.join(OUTPUT_ROOT, 'README.md');
  ensureDirFor(manifestPath);

  const now = new Date().toISOString();
  const lines = [
    '# Repeto screenshots',
    '',
    `Generated: ${now}`,
    'Theme: light',
    'Account: demo tutor',
    '',
    'Folders:',
    '- desktop/pages',
    '- desktop/widgets',
    '- desktop/groups',
    '- mobile/pages',
    '- mobile/groups',
    '',
    'Source runner: app/e2e/fullset-screenshots.spec.ts',
    '',
  ];

  fs.writeFileSync(manifestPath, lines.join('\n'), 'utf8');
}

test.describe('Full screenshot set in light theme', () => {
  test.setTimeout(12 * 60 * 1000);

  test('desktop and mobile full set for demo tutor', async ({ browser }) => {
    const desktopContext = await createContext(browser, 'desktop');
    const desktopPage = await desktopContext.newPage();
    await captureDesktop(desktopPage);
    await desktopContext.close();

    const mobileContext = await createContext(browser, 'mobile');
    const mobilePage = await mobileContext.newPage();
    await captureMobile(mobilePage);
    await mobileContext.close();

    writeManifest();
  });
});
