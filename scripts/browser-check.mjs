import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createApp } from '../server/app.ts';

const out = resolve('test-results/portfolio');
await mkdir(out, { recursive: true });
const server = createApp(resolve('dist')).listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.PORTFOLIO_BROWSER_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const projects = ['CardSlate Desktop', 'CardSlate Website', 'Event Companion', 'Systems Portfolio', 'TCG Buds Storefront', 'StratBoard', 'TCG Buds Sim', 'Afterhours'];
const viewports = [[320,568],[360,740],[390,844],[620,850],[667,375],[760,360],[820,1180],[900,600],[901,700],[1024,768],[1180,740],[1280,720],[1440,900],[1920,1080]];
const results = [];
const errors = [];
let currentPage;

async function checkOverflow(page, label) {
  const size = await page.evaluate(() => {
    const stage = document.querySelector('.project-stage');
    return { width: innerWidth, document: document.documentElement.scrollWidth, stage: stage.scrollWidth, stageClient: stage.clientWidth };
  });
  assert(size.document <= size.width + 1, `${label}: document overflow ${JSON.stringify(size)}`);
  assert(size.stage <= size.stageClient + 1, `${label}: project overflow ${JSON.stringify(size)}`);
}

try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = currentPage = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto(origin);
    await page.getByRole('button', { name: 'ENTER QUIETLY', exact: true }).click();
    await page.getByRole('heading', { name: 'CardSlate Desktop', exact: true }).waitFor();
    assert.equal(await page.locator('.boot-screen').count(), 0);
    for (const title of projects) {
      await page.getByRole('button', { name: `Open ${title}`, exact: true }).click();
      await page.getByRole('heading', { name: title, exact: true }).waitFor();
      await checkOverflow(page, `${width} ${title}`);
      await page.getByRole('tab', { name: 'LOADOUT', exact: true }).click();
      assert(await page.getByRole('tabpanel').locator('.stack-cloud span').count() >= 3, `${title}: technology list is empty`);
      await checkOverflow(page, `${width} ${title} stack`);
      await page.getByRole('tab', { name: 'TECHNIQUES', exact: true }).click();
    }
    assert((await page.locator('.project-meta').innerText()).includes('Discord playtest pending'));
    assert.equal(await page.locator('.project-action-disabled').innerText(), 'PRIVATE ALPHA');
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    const serious = axe.violations.filter(v => ['serious','critical'].includes(v.impact));
    if (axe.violations.length) await writeFile(`${out}/axe-${width}.json`, JSON.stringify(axe.violations,null,2));
    assert.equal(serious.length, 0, `${width} accessibility: ${JSON.stringify(serious.map(v => ({id:v.id,nodes:v.nodes.map(n => n.target)})))}`);
    await page.evaluate(() => window.scrollTo(0,0));
    if ([320,390,667,1024,1440,1920].includes(width)) await page.screenshot({ path: `${out}/afterhours-${width}.png`, fullPage: true });

    await page.getByRole('button', { name: 'Open contact console', exact: true }).click();
    assert(await page.getByRole('dialog').isVisible());
    assert.equal(await page.locator('form').count(), 0);
    for (let i=0; i<7; i++) {
      await page.keyboard.press('Tab');
      // Chromium may focus browser chrome (reported as body) between modal cycles.
      assert(await page.evaluate(() => document.activeElement === document.body || document.querySelector('dialog').contains(document.activeElement)), `${width}: focus reached the background controls`);
    }
    await page.keyboard.press('Escape');
    assert(!(await page.getByRole('dialog').isVisible()));
    assert.equal(await page.locator(':focus').getAttribute('aria-label'), 'Open contact console');
    assert(!requests.some(url => url.includes('/api/projects')));
    assert(!requests.some(url => !url.startsWith(origin)), `${width}: third-party request before opening the radio`);
    results.push({ width, height, projectsChecked: projects.length, seriousAxeViolations: serious.length, otherAxeViolations: axe.violations.map(v => v.id) });
    await context.close();
  }

  const page = currentPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/#afterhours`);
  await page.getByRole('button', { name: 'ENTER QUIETLY', exact: true }).click();
  await page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Open Afterhours', exact: true }).focus();
  await page.keyboard.press('Home');
  await page.getByRole('heading', { name: 'CardSlate Desktop', exact: true }).waitFor();
  await page.keyboard.press('End');
  await page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
  await page.getByRole('tab', { name: 'TECHNIQUES', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: 'LOADOUT', exact: true }).getAttribute('aria-selected'), 'true');
  await page.getByRole('button', { name: 'Open TCG Buds Sim', exact: true }).click();
  assert.equal(await page.locator('.project-actions a').count(), 0, 'Discord-only project stays inside its showcase');
  await page.getByRole('button', { name: 'VIEW PROJECT', exact: false }).waitFor();
  await page.screenshot({ path: `${out}/tcg-buds-sim-1440.png`, fullPage: true });

  // Storage restrictions must not blank the portfolio or silently mute the radio.
  const privatePage = currentPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await privatePage.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
  });
  privatePage.on('pageerror', error => errors.push(error.message));
  await privatePage.goto(`${origin}/#afterhours`);
  await privatePage.getByRole('button', { name: 'ENTER QUIETLY', exact: true }).click();
  await privatePage.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
  assert.equal(await privatePage.getByRole('slider', { name: 'Video volume', includeHidden: true }).inputValue(), '0.34');
  await privatePage.close();

  // Deterministic YouTube boundary: opt-in loading, playback, and a stable host across tabs.
  await page.route('https://www.youtube.com/iframe_api', route => route.fulfill({ contentType: 'text/javascript', body: `
    window.YT = { PlayerState: { PLAYING:1, PAUSED:2, ENDED:0 }, Player: function(host, options) {
      const player = this;
      window.__radio = { volume:0, paused:true, destroyed:false };
      this.setVolume = value => window.__radio.volume=value;
      this.getCurrentTime = () => 12;
      this.getDuration = () => 3600;
      this.getVideoData = () => ({title:'Nujabes set'});
      this.getPlayerState = () => window.__radio.paused ? 2 : 1;
      this.playVideo = () => { window.__radio.paused=false; options.events.onStateChange({target:player,data:1}); };
      this.pauseVideo = () => { window.__radio.paused=true; options.events.onStateChange({target:player,data:2}); };
      this.loadVideoById = this.playVideo;
      this.cueVideoById = this.pauseVideo;
      this.destroy = () => window.__radio.destroyed=true;
      setTimeout(() => options.events.onReady({target:player}), 0);
    }};
    window.onYouTubeIframeAPIReady();
  ` }));
  await page.getByRole('button', { name: 'Play FULL VINYL', exact: false }).click();
  await page.waitForFunction(() => window.__radio && !window.__radio.paused);
  assert.equal(await page.evaluate(() => window.__radio.volume), 34);
  const hostId = await page.locator('.radio-video-host').getAttribute('id');
  await page.getByRole('button', { name: 'Open Afterhours', exact: true }).click();
  assert.equal(await page.locator('.radio-video-host').getAttribute('id'), hostId);
  assert.equal(await page.evaluate(() => window.__radio.destroyed), false);
  await page.getByRole('button', { name: 'Collapse video player', exact: true }).first().click();
  assert.equal(await page.evaluate(() => window.__radio.paused), true);
  assert.equal(errors.length, 0, `Browser errors: ${errors.join('; ')}`);
  await writeFile(`${out}/checks.json`, JSON.stringify({ results, errors, navigation: 'passed', storageRestrictions: 'passed', radio: 'passed' }, null, 2));
  console.log(`Passed ${viewports.length * projects.length} project/viewport combinations, accessibility, modal focus, deep links, keyboard controls, private storage, and opt-in radio.`);
} catch (error) {
  if (currentPage && !currentPage.isClosed()) {
    await currentPage.screenshot({ path: `${out}/failure.png`, fullPage: true }).catch(() => {});
    await writeFile(`${out}/failure.html`, await currentPage.content()).catch(() => {});
  }
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
