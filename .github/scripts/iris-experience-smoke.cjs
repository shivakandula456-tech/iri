
const { chromium } = require('playwright');

const baseURL = process.env.IRIS_BASE_URL || 'http://127.0.0.1:8765/';
const failures = [];
const pass = (message) => console.log('PASS  ' + message);
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  pass(message);
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
    page.setDefaultTimeout(15000);
    page.on('pageerror', (error) => failures.push(error.message));
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.__IRIS_APP__?.ready), null, { timeout: 60000 });
    await page.waitForSelector('#irisExperienceMenuButton:not([disabled])', { timeout: 20000 });
    pass('3D viewer reaches ready state');

    const menuButton = page.locator('#irisExperienceMenuButton');
    const openFeature = async (id) => {
      await menuButton.click();
      await page.locator('#irisExperienceMenu').waitFor({ state: 'visible' });
      await page.locator('[data-feature="' + id + '"]').click();
    };
    const waitForExplorerMode = async (mode) => page.waitForFunction(
      (expected) => window.__IRIS_APP__?.buildingExplorer?.active && window.__IRIS_APP__?.buildingExplorer?.mode === expected,
      mode,
      { timeout: 20000 }
    );
    const returnExterior = async () => {
      await menuButton.click();
      await page.locator('#irisExperienceMenu').waitFor({ state: 'visible' });
      await page.locator('#irisReturnExterior').click();
      await page.waitForFunction(() => {
        const app = window.__IRIS_APP__;
        return app && !app.buildingExplorer?.active && app.mode === 'orbit' && !app.blueprintController?.enabled;
      }, null, { timeout: 12000 });
    };

    await menuButton.click();
    assert(await page.locator('[data-feature]').count() === 8, 'menu exposes all eight experiences');
    await page.locator('#irisExperienceMenuClose').click();

    await openFeature('cutaway');
    await waitForExplorerMode('cutaway');
    assert(await page.locator('#explorerCutControl').isVisible(), 'cutaway opens the cut-plane controls');
    await returnExterior();

    await openFeature('blueprint');
    await page.waitForFunction(() => window.__IRIS_APP__?.buildingExplorer?.active && window.__IRIS_APP__?.buildingExplorer?.mode === 'interior', null, { timeout: 25000 });
    assert(await page.locator('#explorerRoomSection').isVisible(), 'blueprint morph reaches the apartment experience');
    await returnExterior();

    await openFeature('sunlight');
    assert(await page.locator('#lightTool').evaluate((el) => el.open), 'sunlight option opens atmosphere controls');
    await page.locator('#timeOfDay').evaluate((el) => {
      el.value = '12';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    assert((await page.locator('#timeOfDay').inputValue()) === '12', 'time-of-day slider accepts a new setting');
    await returnExterior();

    await openFeature('portal');
    await page.waitForFunction(() => window.__IRIS_APP__?.buildingExplorer?.active && window.__IRIS_APP__?.buildingExplorer?.mode === 'interior', null, { timeout: 25000 });
    assert(await page.locator('#explorerWalkControls').isVisible(), 'building portal enters the apartment walkthrough');
    await returnExterior();

    await openFeature('layers');
    await waitForExplorerMode('xray');
    assert(await page.locator('#explorerFloorRail').isVisible(), 'architectural layer option opens floor and layer controls');
    await returnExterior();

    await openFeature('journey');
    await page.waitForFunction(() => window.__IRIS_APP__?.buildingExplorer?.active && window.__IRIS_APP__?.buildingExplorer?.mode === 'interior', null, { timeout: 25000 });
    assert(await page.locator('#explorerRoomList button').count() >= 4, 'room-to-room journey exposes room destinations');
    await returnExterior();

    await openFeature('compare');
    await page.locator('#irisComparePanel').waitFor({ state: 'visible' });
    await page.locator('#irisCaptureA').click();
    await page.waitForFunction(() => document.getElementById('irisCompareImageA')?.src.startsWith('data:image/png'));
    await page.locator('#irisCaptureB').click();
    await page.waitForFunction(() => document.getElementById('irisCompareImageB')?.src.startsWith('data:image/png'));
    await page.locator('#irisCompareRange').evaluate((el) => {
      el.value = '30';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert(await page.locator('#irisCompareStatus').textContent().then((s) => s.includes('Both views are ready')), 'comparison captures two views and updates the split control');
    await returnExterior();

    await openFeature('postcard');
    await page.locator('#irisPostcardPanel').waitFor({ state: 'visible' });
    await page.locator('#irisPostcardHeading').fill('IRIS RESIDENCES TEST');
    await page.locator('#irisCreatePostcard').click();
    await page.waitForFunction(() => {
      const image = document.getElementById('irisPostcardPreview');
      const link = document.getElementById('irisDownloadPostcard');
      return image && !image.hidden && image.src.startsWith('blob:') && link && !link.hidden && link.href.startsWith('blob:');
    }, null, { timeout: 15000 });
    const downloadWait = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('#irisDownloadPostcard').click();
    const download = await downloadWait;
    assert(download.suggestedFilename().endsWith('-postcard.png'), 'postcard generates and downloads a PNG');
    await returnExterior();

    await page.setViewportSize({ width: 390, height: 844 });
    await menuButton.click();
    assert(await page.locator('[data-feature]:visible').count() === 8, 'mobile menu exposes all eight experiences');
    await page.locator('#irisExperienceMenuClose').click();
    assert(failures.length === 0, 'no unhandled browser JavaScript errors (' + failures.length + ')');
    console.log('All IRIS experience browser checks passed.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
