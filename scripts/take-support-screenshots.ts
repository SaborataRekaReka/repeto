/**
 * Take screenshots from the real demo account for every support article.
 * Run:  cd app && npx tsx scripts/take-support-screenshots.ts
 */

import { chromium, type Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const BASE = 'http://localhost:3100';
const DEMO_EMAIL = 'demo@repeto.ru';
const DEMO_PASS = 'demo1234';
const PORTAL_TOKEN = 'demo-portal-token-ivanov';
const TUTOR_SLUG = 'demo-tutor';

// Two output dirs: articles/ for per-article screenshots, root for generic ones
const ARTICLE_DIR = path.resolve(__dirname, '../tutor-journal/public/images/support/articles');
const GENERIC_DIR = path.resolve(__dirname, '../tutor-journal/public/images/support');

type Shot = {
  name: string;
  path?: string;
  action?: (page: Page) => Promise<void>;
  waitFor?: string;
  delay?: number;
  fullPage?: boolean;
  portal?: boolean;
  publicPage?: boolean;
  /** Save to generic dir (replaces old screenshots) */
  generic?: boolean;
};

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Screenshot plan ──
const SHOTS: Shot[] = [
  // ════════════════════════════════════════════
  // GENERIC screenshots (replace old bad ones)
  // ════════════════════════════════════════════
  { name: 'dashboard', generic: true, path: '/dashboard', delay: 2000 },
  { name: 'students-list', generic: true, path: '/students', delay: 1500 },
  { name: 'schedule', generic: true, path: '/schedule', delay: 1500 },
  { name: 'finance-overview', generic: true, path: '/finance', delay: 2000 },
  { name: 'payments', generic: true, path: '/finance/payments', delay: 1500 },
  { name: 'packages', generic: true, path: '/finance/packages', delay: 1500 },
  { name: 'notifications', generic: true, path: '/notifications', delay: 1500 },
  { name: 'settings', generic: true, path: '/settings', delay: 1500 },
  { name: 'materials', generic: true, path: '/files', delay: 1500 },
  { name: 'student-card', generic: true, path: '/students', delay: 1000,
    action: async (p) => {
      await p.locator('text=Иванов Пётр').first().click();
      await wait(1500);
    }
  },
  { name: 'schedule-modal', generic: true, path: '/schedule?create=1', delay: 1500 },
  { name: 'public-page', generic: true, path: `/t/${TUTOR_SLUG}`, publicPage: true, delay: 2000 },
  { name: 'student-portal', generic: true, path: `/t/${TUTOR_SLUG}/s/${PORTAL_TOKEN}`, portal: true, delay: 2000 },
  { name: 'support-home', generic: true, path: '/support', delay: 1500 },
  { name: 'support-categories', generic: true, path: '/support/categories', delay: 1500 },
  { name: 'support-article', generic: true, path: '/support/article?id=start-1', delay: 1500 },
  { name: 'support-search', generic: true, path: '/support/search-result?q=ученик', delay: 1500 },
  { name: 'support-dark-home', generic: true, path: '/support', delay: 500,
    action: async (p) => {
      // Toggle dark mode via localStorage + reload
      await p.evaluate(() => { localStorage.setItem('theme', 'dark'); });
      await p.reload({ waitUntil: 'networkidle' });
      await wait(1500);
    }
  },

  // ════════════════════════════════════════════
  // PER-ARTICLE screenshots
  // ════════════════════════════════════════════

  // ── start-1: Как зарегистрироваться ──
  { name: 'start-1-registration', path: '/registration', publicPage: true, delay: 1500 },
  { name: 'start-1-dashboard', path: '/dashboard', delay: 2000 },

  // ── start-2: Как настроить профиль ──
  { name: 'start-2-settings-account', path: '/settings', delay: 1500 },
  { name: 'start-2-settings-profile', path: '/settings', delay: 800,
    action: async (p) => { await p.evaluate(() => window.scrollTo(0, 400)); await wait(300); } },

  // ── start-3: Как указать расписание доступности ──
  { name: 'start-3-schedule', path: '/schedule', delay: 1500 },
  { name: 'start-3-settings-schedule', path: '/settings', delay: 800,
    action: async (p) => {
      // Scroll to area where availability settings would be
      await p.evaluate(() => window.scrollTo(0, 600));
      await wait(500);
    }
  },

  // ── start-4: Как добавить предметы и цены ──
  { name: 'start-4-subjects', path: '/settings', delay: 1000,
    action: async (p) => { await p.evaluate(() => window.scrollTo(0, 900)); await wait(400); } },

  // ── students-1: Как добавить ученика вручную ──
  { name: 'students-1-list', path: '/students', delay: 1500 },
  { name: 'students-1-create-modal', path: '/students?create=1', delay: 1500 },

  // ── students-2: Как подтвердить заявку на запись ──
  { name: 'students-2-notifications', path: '/notifications', delay: 1500 },

  // ── students-3: Как отправить ссылку на портал ──
  { name: 'students-3-student-card', path: '/students', delay: 1000,
    action: async (p) => {
      await p.locator('text=Иванов Пётр').first().click().catch(() => {});
      await wait(1500);
    }
  },

  // ── students-4: Как изменить ставку или предмет ──
  { name: 'students-4-edit', path: '/students', delay: 1000,
    action: async (p) => {
      await p.locator('text=Петрова Анна').first().click().catch(() => {});
      await wait(1500);
    }
  },

  // ── schedule-1: Как создать урок ──
  { name: 'schedule-1-calendar', path: '/schedule', delay: 1500 },
  { name: 'schedule-1-create', path: '/schedule?create=1', delay: 1500 },

  // ── schedule-2: Как отменить или перенести ──
  { name: 'schedule-2-calendar-week', path: '/schedule', delay: 1500,
    action: async (p) => {
      // Switch to week view if possible
      const weekBtn = p.locator('button:has-text("Неделя")').first();
      if (await weekBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await weekBtn.click();
        await wait(1000);
      }
    }
  },

  // ── schedule-3: Как настроить окна доступности ──
  { name: 'schedule-3-availability', path: '/settings', delay: 1500 },

  // ── schedule-4: Как заблокировать день ──
  { name: 'schedule-4-blocked', path: '/schedule', delay: 1500 },

  // ── finance-1: Как зафиксировать оплату ──
  { name: 'finance-1-payments', path: '/finance/payments', delay: 1500 },
  { name: 'finance-1-create', path: '/finance/payments?create=1', delay: 1500 },

  // ── finance-2: Как создать пакет занятий ──
  { name: 'finance-2-packages', path: '/finance/packages', delay: 1500 },

  // ── finance-3: Как посмотреть баланс ──
  { name: 'finance-3-balances', path: '/finance', delay: 2000 },

  // ── finance-4: Как работает аналитика ──
  { name: 'finance-4-overview', path: '/finance', delay: 2000 },
  { name: 'finance-4-dashboard', path: '/dashboard', delay: 2000 },

  // ── public-1: Как опубликовать профиль ──
  { name: 'public-1-page', path: `/t/${TUTOR_SLUG}`, publicPage: true, delay: 2000 },
  { name: 'public-1-settings', path: '/settings', delay: 1500 },

  // ── public-2: Как настроить ссылку ──
  { name: 'public-2-slug-settings', path: '/settings', delay: 1500 },

  // ── public-3: Как ученики записываются ──
  { name: 'public-3-public-page', path: `/t/${TUTOR_SLUG}`, publicPage: true, delay: 2000 },
  { name: 'public-3-booking', path: `/t/${TUTOR_SLUG}`, publicPage: true, delay: 1000,
    action: async (p) => {
      const btn = p.locator('text=Записаться').first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click();
        await wait(1500);
      }
    }
  },

  // ── public-4: Как указать формат занятий ──
  { name: 'public-4-format', path: '/settings', delay: 1000,
    action: async (p) => { await p.evaluate(() => window.scrollTo(0, 600)); await wait(400); } },

  // ── portal-1: Что видит ученик ──
  { name: 'portal-1-overview', path: `/t/${TUTOR_SLUG}/s/${PORTAL_TOKEN}`, portal: true, delay: 2500 },

  // ── portal-2: Как ученик отменяет занятие ──
  { name: 'portal-2-lessons', path: `/t/${TUTOR_SLUG}/s/${PORTAL_TOKEN}`, portal: true, delay: 2500 },

  // ── portal-3: Как ученик отмечает домашку ──
  { name: 'portal-3-homework', path: `/t/${TUTOR_SLUG}/s/${PORTAL_TOKEN}`, portal: true, delay: 1500,
    action: async (p) => {
      const tab = p.locator('text=Домашка').first();
      if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.click();
        await wait(1500);
      }
    }
  },

  // ── portal-4: Как работает политика отмены ──
  { name: 'portal-4-policies', path: '/settings', delay: 800,
    action: async (p) => {
      const tab = p.locator('button:has-text("Политики"), [role="tab"]:has-text("Политики")').first();
      if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.click();
        await wait(1200);
      }
    }
  },
  { name: 'portal-4-portal-lesson', path: `/t/${TUTOR_SLUG}/s/${PORTAL_TOKEN}`, portal: true, delay: 2500 },

  // ── security-1: Защита аккаунта ──
  { name: 'security-1-security', path: '/settings', delay: 800,
    action: async (p) => {
      const tab = p.locator('button:has-text("Безопасность"), [role="tab"]:has-text("Безопасность")').first();
      if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.click();
        await wait(1200);
      }
    }
  },
  { name: 'security-1-settings', path: '/settings', delay: 1500 },

  // ── faq-1: Бесплатно ли ──
  { name: 'faq-1-dashboard', path: '/dashboard', delay: 2000 },

  // ── faq-2: Сколько учеников ──
  { name: 'faq-2-students', path: '/students', delay: 1500 },

  // ── faq-3: Несколько предметов ──
  { name: 'faq-3-subjects', path: '/settings', delay: 1000,
    action: async (p) => { await p.evaluate(() => window.scrollTo(0, 900)); await wait(400); } },

  // ── faq-4: Как связаться ──
  { name: 'faq-4-support', path: '/support', delay: 1500 },
];

async function main() {
  fs.mkdirSync(ARTICLE_DIR, { recursive: true });
  fs.mkdirSync(GENERIC_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  // ── Login ──
  const authPage = await context.newPage();
  console.log('🔐 Logging in as demo@repeto.ru ...');
  await authPage.goto(`${BASE}/registration`);
  await authPage.waitForLoadState('networkidle');

  await authPage.getByPlaceholder('Введите email или телефон').fill(DEMO_EMAIL);
  await authPage.getByPlaceholder('Введите пароль').fill(DEMO_PASS);
  await authPage.getByRole('button', { name: 'Войти' }).click();

  try {
    await authPage.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('✅ Logged in');
  } catch {
    console.error('❌ Login failed — check that demo account exists (run prisma:seed)');
    process.exit(1);
  }

  // Ensure light mode for consistency
  await authPage.evaluate(() => {
    localStorage.setItem('theme', 'light');
  });
  await authPage.reload({ waitUntil: 'networkidle' });
  await wait(1000);

  let ok = 0;
  let fail = 0;

  for (const shot of SHOTS) {
    console.log(`📸 ${shot.name} ...`);

    let page: Page;
    const needsSeparate = shot.portal || shot.publicPage;

    if (needsSeparate) {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      });
      page = await ctx.newPage();
    } else {
      page = authPage;
    }

    try {
      if (shot.path) {
        const url = shot.path.startsWith('http') ? shot.path : `${BASE}${shot.path}`;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      }

      if (shot.waitFor) {
        await page.locator(shot.waitFor).first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      }

      if (shot.delay) await wait(shot.delay);
      if (shot.action) await shot.action(page);

      const dir = shot.generic ? GENERIC_DIR : ARTICLE_DIR;
      const outPath = path.join(dir, `${shot.name}.png`);
      await page.screenshot({ path: outPath, fullPage: shot.fullPage ?? false });
      console.log(`  ✅ ${shot.name}.png`);
      ok++;
    } catch (err: any) {
      console.error(`  ❌ ${shot.name}: ${err.message}`);
      fail++;
    } finally {
      if (needsSeparate) {
        await page.context().close();
      }
    }
  }

  // Dark mode screenshot for support
  console.log('📸 Taking dark-mode support screenshot...');
  await authPage.evaluate(() => { localStorage.setItem('theme', 'dark'); });
  await authPage.reload({ waitUntil: 'networkidle' });
  await wait(1500);

  await browser.close();
  console.log(`\n🎉 Done! ${ok} saved, ${fail} failed out of ${SHOTS.length

      const dir = shot.generic ? GENERIC_DIR : ARTICLE_DIR;
      const outPath = path.join(dir, `${shot.name}.png`);
      await page.screenshot({ path: outPath, fullPage: shot.fullPage ?? false });
      console.log(`  ✅ ${shot.name}.png`);
      ok++;
    } catch (err: any) {
      console.error(`  ❌ ${shot.name}: ${err.message}`);
      fail++;
    } finally {
      if (needsSeparate) {
        await page.context().close();
      }
    }
  }

  // Dark mode screenshot for support
  console.log('📸 Taking dark-mode support screenshot...');
  await authPage.evaluate(() => { localStorage.setItem('theme', 'dark'); });
  await authPage.reload({ waitUntil: 'networkidle' });
  await wait(1500);

  await browser.close();
  console.log(`\n🎉 Done! ${ok} saved, ${fail} failed out of ${SHOTS.length}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
