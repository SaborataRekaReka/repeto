const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3300', { waitUntil: 'networkidle' });
    
    // Attempt to open first feature to ensure we are in a state where cells exist
    await page.locator('.feature-item, [class*="feature"], .card, button:visible').first().click().catch(() => {});
    await page.waitForTimeout(1000);

    const cell = page.locator('[class*="work-hour"], [class*="cell"], [class*="hour"]').first();
    // Try to find any element that represents the cursor/marker
    const cursor = page.locator('[class*="cursor"], [class*="pointer"], [class*="marker"], [class*="current"]').first();
    
    const cellRect = await cell.boundingBox({ timeout: 5000 }).catch(() => null);
    const cursorRect = await cursor.boundingBox({ timeout: 5000 }).catch(() => null);

    if (cellRect && cursorRect) {
      const cursorCenter = { x: cursorRect.x + cursorRect.width / 2, y: cursorRect.y + cursorRect.height / 2 };
      const isInside = cursorCenter.x >= cellRect.x && cursorCenter.x <= cellRect.x + cellRect.width &&
                       cursorCenter.y >= cellRect.y && cursorCenter.y <= cellRect.y + cellRect.height;
      console.log(JSON.stringify({ isInside, cellRect, cursorCenter, cursorRect }, null, 2));
    } else {
      console.log(JSON.stringify({ 
        error: 'Not found', 
        cellFound: !!cellRect, 
        cursorFound: !!cursorRect,
        cellSelector: await cell.isVisible().catch(() => false) ? 'visible' : 'hidden',
        cursorSelector: await cursor.isVisible().catch(() => false) ? 'visible' : 'hidden'
      }, null, 2));
    }
  } catch (e) { 
    console.error(e); 
  } finally { 
    await browser.close(); 
  }
})();