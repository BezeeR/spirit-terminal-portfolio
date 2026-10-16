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
const errors = [];
const results = [];
let currentPage;

async function createPage({ width = 1440, height = 900, seen = false, preference = 'on', blocked = false, storage = '', delay = 0, reducedMotion = 'reduce', failFirst = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  await context.addInitScript(({ seen, preference, blocked, storage }) => {
    if (seen) localStorage.setItem('spirit-terminal-intro-seen', '1');
    if (seen) localStorage.setItem('spirit-terminal-midnight-radio-autoplay', preference);
    window.__blockPlayback = blocked;
    for (const name of storage === 'both' ? ['localStorage','sessionStorage'] : storage === 'local' ? ['localStorage'] : []) {
      Object.defineProperty(window, name, { configurable: true, get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
    }
  }, { seen, preference, blocked, storage });
  const page = currentPage = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  let apiRequests = 0;
  await page.route('https://www.youtube.com/iframe_api', async route => {
    apiRequests++;
    if (failFirst && apiRequests === 1) return route.abort();
    await route.fulfill({ contentType: 'text/javascript', body: `
      window.YT = { PlayerState: { PLAYING:1, PAUSED:2, ENDED:0 }, Player: function(host, options) {
        const player = this;
        const frame = document.createElement('iframe');
        window.__radio = { paused:true, volume:0, playCalls:0, ready:false };
        this.getIframe = () => frame;
        this.setVolume = value => window.__radio.volume=value;
        this.getCurrentTime = () => 12;
        this.getDuration = () => 3600;
        this.getVideoData = () => ({ title:'Nujabes set' });
        this.getPlayerState = () => window.__radio.paused ? 2 : 1;
        this.playVideo = () => {
          window.__radio.playCalls++;
          if (window.__blockPlayback) { options.events.onStateChange({target:player,data:2}); options.events.onAutoplayBlocked({target:player}); return; }
          window.__radio.paused=false;
          options.events.onStateChange({target:player,data:1});
        };
        this.pauseVideo = () => { window.__radio.paused=true; options.events.onStateChange({target:player,data:2}); };
        this.loadVideoById = this.playVideo;
        this.cueVideoById = this.pauseVideo;
        this.destroy = () => {};
        window.__nativePause = () => this.pauseVideo();
        window.__nativePlay = () => this.playVideo();
        setTimeout(() => { window.__radio.ready=true; options.events.onReady({target:player}); window.__radio.allow=frame.getAttribute('allow'); }, ${delay});
      }};
      window.onYouTubeIframeAPIReady();
    ` });
  });
  await page.goto(`${origin}/#afterhours`);
  return { page, context, requests: () => apiRequests };
}

async function playing(page) {
  await page.waitForFunction(() => window.__radio && !window.__radio.paused);
  assert.equal(await page.getByRole('button', { name: 'Pause Nujabes set', exact: true }).getAttribute('aria-pressed'), 'true');
}

try {
  for (const [width,height] of [[320,568],[390,844],[667,375],[1440,900]]) {
    const { page, context, requests } = await createPage({ width, height });
    const dialog = page.getByRole('dialog', { name: 'SPIRIT_', exact: true });
    await dialog.waitFor();
    assert.equal(requests(), 0, 'The intro must not load YouTube before a visitor chooses music');
    assert(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1), `${width}: intro overflows horizontally`);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.equal(axe.violations.length, 0, `${width} intro accessibility: ${JSON.stringify(axe.violations.map(v => ({ id:v.id, targets:v.nodes.map(n => n.target) })))}`);
    for (const name of ['ENTER WITH MUSIC','ENTER QUIETLY']) {
      const button = await page.getByRole('button', { name, exact: false }).boundingBox();
      assert(button && button.y >= 0 && button.y + button.height <= height, `${width}: entry controls must fit the viewport`);
    }
    await page.screenshot({ path: `${out}/intro-${width}.png` });
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').innerText(), 'ENTER QUIETLY');
    await page.keyboard.press('Enter');
    await page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
    assert.equal(await page.locator(':focus').getAttribute('id'), 'project-content');
    await page.reload();
    await page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
    assert.equal(await page.locator('.boot-screen').count(), 0);
    assert.equal(requests(), 0, 'Quiet entry must remain quiet on return');
    results.push(`intro ${width}: keyboard entry, accessibility, layout, remembered quiet return`);
    await context.close();
  }

  const music = await createPage({ reducedMotion: 'no-preference' });
  await music.page.getByRole('button', { name: 'ENTER WITH MUSIC', exact: false }).waitFor();
  await music.page.keyboard.press('Enter');
  await playing(music.page);
  assert.equal(await music.page.evaluate(() => window.__radio.volume), 34);
  assert((await music.page.evaluate(() => window.__radio.allow)).includes('autoplay'));
  const frame = await music.page.locator('.radio-video-frame').boundingBox();
  assert(frame.width >= 200 && frame.height >= 200);
  await music.page.reload();
  await playing(music.page);
  assert.equal(await music.page.locator('.boot-screen').count(), 0);
  assert.equal(await music.page.evaluate(() => window.__radio.playCalls), 1, 'Return must make one startup attempt');
  // Native YouTube controls must work as well as the portfolio buttons.
  await music.page.evaluate(() => window.__nativePause());
  assert.equal(await music.page.evaluate(() => localStorage.getItem('spirit-terminal-midnight-radio-autoplay')), 'off');
  await music.page.evaluate(() => window.__nativePlay());
  await playing(music.page);
  await music.page.getByRole('button', { name: 'Pause Nujabes set', exact: true }).click();
  await music.page.reload();
  await music.page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
  assert.equal(await music.page.evaluate(() => !!window.__radio), false, 'An explicit pause must survive return visits');
  results.push('first entry starts music; return attempts autoplay; native and portfolio pause preferences persist');
  await music.context.close();

  const escape = await createPage();
  await escape.page.getByRole('dialog').waitFor();
  await escape.page.keyboard.press('Escape');
  await escape.page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
  assert.equal(escape.requests(), 0);
  results.push('Escape enters quietly without requesting YouTube');
  await escape.context.close();

  for (const seen of [false,true]) {
    const blocked = await createPage({ seen, blocked: true });
    if (!seen) await blocked.page.getByRole('button', { name: 'ENTER WITH MUSIC', exact: false }).click();
    await blocked.page.getByRole('button', { name: 'PLAY MUSIC ▶', exact: true }).waitFor();
    assert.equal(await blocked.page.evaluate(() => localStorage.getItem('spirit-terminal-midnight-radio-autoplay')), 'on', 'Browser blocking is not a visitor pause preference');
    assert.equal(await blocked.page.getByRole('button', { name: 'Start music: Nujabes set', exact: true }).getAttribute('aria-pressed'), 'false');
    assert.equal(await blocked.page.getByRole('button', { name: 'Pause Nujabes set', exact: true }).count(), 0);
    await blocked.page.evaluate(() => { window.__blockPlayback=false; });
    await blocked.page.getByRole('button', { name: 'PLAY MUSIC ▶', exact: true }).click();
    await playing(blocked.page);
    results.push(`${seen ? 'return' : 'first entry'} blocked autoplay: accurate Play state and manual recovery`);
    await blocked.context.close();
  }

  const pending = await createPage({ seen: true, delay: 1000 });
  await pending.page.waitForFunction(() => window.__radio && !window.__radio.ready);
  await pending.page.getByRole('button', { name: 'Collapse video player', exact: true }).first().click();
  await pending.page.waitForFunction(() => window.__radio.ready);
  assert.equal(await pending.page.evaluate(() => window.__radio.playCalls), 0, 'Closing during load must cancel late playback');
  results.push('collapse cancels a pending automatic playback request');
  await pending.context.close();

  for (const storage of ['local','both']) {
    const restricted = await createPage({ storage });
    await restricted.page.getByRole('button', { name: 'ENTER QUIETLY', exact: true }).click();
    await restricted.page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
    await restricted.page.reload();
    if (storage === 'local') await restricted.page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
    else await restricted.page.getByRole('button', { name: 'ENTER QUIETLY', exact: true }).waitFor();
    results.push(`${storage} storage restriction: safe entry and expected persistence fallback`);
    await restricted.context.close();
  }

  const unavailable = await createPage({ seen:true, failFirst:true });
  await unavailable.page.locator('.radio-error').waitFor();
  await unavailable.page.getByRole('button', { name: 'Play FULL VINYL', exact: false }).click();
  await playing(unavailable.page);
  assert.equal(unavailable.requests(), 2);
  results.push('failed YouTube API load can be retried without reloading the portfolio');
  await unavailable.context.close();

  assert.equal(errors.length, 0, errors.join('; '));
  await writeFile(`${out}/intro-checks.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(`Passed ${results.length} intro/music checks, including first/return visits, blocked autoplay, quiet preferences, cancelled startup, restricted storage, and API retry.`);
} catch (error) {
  if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({ path: `${out}/intro-failure.png`, fullPage:true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
