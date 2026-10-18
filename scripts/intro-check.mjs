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

async function createPage({ width = 1440, height = 900, seen = false, preference = 'on', blocked = false, storage = '', delay = 0, reducedMotion = 'reduce', failFirst = false, touch = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion, hasTouch: touch, isMobile: touch });
  await context.addInitScript(({ seen, preference, blocked, storage }) => {
    if (seen) localStorage.setItem('spirit-terminal-intro-seen', '1');
    if (seen) localStorage.setItem('spirit-terminal-midnight-radio-autoplay', preference);
    window.__blockPlayback = blocked;
    for (const name of storage === 'both' ? ['localStorage','sessionStorage'] : storage === 'local' ? ['localStorage'] : []) {
      Object.defineProperty(window, name, { configurable: true, get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
    }
  }, { seen, preference, blocked, storage });
  const page = currentPage = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  let apiRequests = 0;
  await page.route('https://www.youtube.com/embed/test-radio', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="en"><head><title>Test video</title></head><body style="margin:0;display:grid;place-items:center;height:100vh;background:#15151a;color:white"><button style="min-height:48px;padding:12px;font-size:16px" onclick="parent.postMessage('radio-native-play', '${origin}')">Play video</button></body></html>` }));
  await page.route('https://www.youtube.com/iframe_api', async route => {
    apiRequests++;
    if (failFirst && apiRequests === 1) return route.abort();
    await route.fulfill({ contentType: 'text/javascript', body: `
      window.YT = { PlayerState: { PLAYING:1, PAUSED:2, ENDED:0 }, Player: function(host, options) {
        const player = this;
        const frame = document.createElement('iframe');
        frame.src = 'https://www.youtube.com/embed/test-radio';
        frame.title = 'YouTube video player';
        frame.className = 'radio-video-host';
        frame.style.border = '0';
        host.replaceWith(frame);
        window.__radio = { paused:true, volume:0, playCalls:0, nativePlayCalls:0, ready:false };
        this.getIframe = () => frame;
        this.setVolume = value => window.__radio.volume=value;
        this.getCurrentTime = () => 12;
        this.getDuration = () => 3600;
        this.getVideoData = () => ({ title:'Nujabes set' });
        this.getPlayerState = () => window.__radio.paused ? 2 : 1;
        const play = () => {
          window.__radio.paused=false;
          options.events.onStateChange({target:player,data:1});
        };
        this.playVideo = () => {
          window.__radio.playCalls++;
          if (window.__blockPlayback) { options.events.onStateChange({target:player,data:2}); options.events.onAutoplayBlocked({target:player}); return; }
          play();
        };
        this.pauseVideo = () => { window.__radio.paused=true; options.events.onStateChange({target:player,data:2}); };
        this.loadVideoById = this.playVideo;
        this.cueVideoById = this.pauseVideo;
        this.destroy = () => {};
        window.__nativePause = () => this.pauseVideo();
        window.__nativePlay = () => { window.__radio.nativePlayCalls++; play(); };
        window.addEventListener('message', event => {
          if (event.source === frame.contentWindow && event.data === 'radio-native-play') window.__nativePlay();
        });
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

async function radioViewport(page) {
  // Measure the final viewport after the dock's entrance transform completes.
  // Fractional animated coordinates can otherwise make a 200px frame read below 200.
  await page.locator('.radio-dock').evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {}))));
  return page.locator('.radio-video-frame').boundingBox();
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
  const frame = await radioViewport(music.page);
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
  const directPlayCalls = await music.page.evaluate(() => {
    const before = window.__radio.playCalls;
    document.querySelector('.audio-main-button').click();
    return window.__radio.playCalls - before;
  });
  assert.equal(directPlayCalls, 1, 'A ready player must start in the click handler before awaiting anything');
  await playing(music.page);
  await music.page.getByRole('button', { name: 'Pause Nujabes set', exact: true }).click();
  await music.page.reload();
  await music.page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
  assert.equal(await music.page.evaluate(() => !!window.__radio), false, 'An explicit pause must survive return visits');
  results.push('first entry starts music; return attempts autoplay; native and portfolio pause preferences persist');
  await music.context.close();

  for (const [width,height] of [[320,568],[390,844],[667,375],[820,1180]]) {
    const mobile = await createPage({ width, height, touch: true, blocked: true, reducedMotion: 'no-preference' });
    const dialog = mobile.page.getByRole('dialog');
    await dialog.waitFor();
    assert(await mobile.page.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches));
    assert.equal(mobile.requests(), 0, 'Mobile boot must not load YouTube before music is chosen');
    for (const name of ['ENTER & OPEN RADIO','ENTER QUIETLY']) {
      const button = await mobile.page.getByRole('button', { name, exact: false }).boundingBox();
      assert(button && button.y >= 0 && button.y + button.height <= height, `${width}: touch entry controls must fit`);
    }
    await mobile.page.screenshot({ path: `${out}/intro-touch-${width}.png` });
    await mobile.page.getByRole('button', { name: 'ENTER & OPEN RADIO', exact: false }).tap();
    await mobile.page.getByText('Tap ▶ in the video below to start the Nujabes set.', { exact: true }).waitFor();
    assert.equal(await mobile.page.evaluate(() => window.__radio.playCalls), 0, 'Touch entry prepares the player without a delayed autoplay attempt');
    assert.equal(await mobile.page.locator(':focus').getAttribute('id'), 'midnight-radio-video-panel');
    const frame = await radioViewport(mobile.page);
    assert(frame && frame.width >= 200 && frame.height >= 200, `${width}: native video controls need a usable player viewport: ${JSON.stringify(frame)}`);
    const rail = await mobile.page.getByRole('navigation', {name:'Project navigation', exact:true}).boundingBox();
    const prompt = await mobile.page.locator('.radio-play-prompt').boundingBox();
    const nativePlay = await mobile.page.frameLocator('.radio-video-host').getByRole('button', {name:'Play video',exact:true}).boundingBox();
    assert(prompt && prompt.y >= rail.y + rail.height, `${width}: tap instruction must stay below sticky navigation`);
    assert(nativePlay && nativePlay.y >= rail.y + rail.height && nativePlay.y + nativePlay.height <= height, `${width}: native Play must be visible below sticky navigation`);
    assert(await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Touch radio must not overflow the page');
    const axe = await new AxeBuilder({ page: mobile.page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations.map(v => ({id:v.id,targets:v.nodes.map(n => n.target)}))));
    await mobile.page.screenshot({ path: `${out}/radio-touch-${width}.png` });
    await mobile.page.frameLocator('.radio-video-host').getByRole('button', { name: 'Play video', exact: true }).tap();
    await playing(mobile.page);
    assert.equal(await mobile.page.getByText('Tap ▶ in the video below to start the Nujabes set.', { exact:true }).count(), 0, 'The tap instruction clears only after playback starts');
    await mobile.page.getByText('Now playing. Pause in the video or use the top bar.', { exact:true }).waitFor();
    assert.equal(await mobile.page.evaluate(() => window.__radio.nativePlayCalls), 1);
    await mobile.page.reload();
    await mobile.page.waitForFunction(() => window.__radio?.ready);
    // The ready player can still be entering after a returning visit. Settle
    // its viewport before scrolling to and tapping the native video control.
    await radioViewport(mobile.page);
    assert.equal(await mobile.page.locator('.boot-screen').count(), 0, 'Touch returns skip the remembered boot screen');
    assert.equal(await mobile.page.evaluate(() => window.__radio.playCalls), 0, 'Touch returns keep native Play instead of attempting autoplay');
    await mobile.page.frameLocator('.radio-video-host').getByRole('button', { name: 'Play video', exact: true }).tap();
    await playing(mobile.page);
    await mobile.page.getByRole('button', { name: 'Collapse video player', exact: true }).first().tap();
    await mobile.page.reload();
    await mobile.page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
    assert.equal(mobile.requests(), 2, 'Collapse remembers a quiet touch return without loading YouTube again');
    results.push(`touch ${width}: boot, native Play, revealed player, accessibility, remembered return, quiet collapse`);
    await mobile.context.close();
  }

  const touchQuiet = await createPage({ width:390, height:844, touch:true });
  await touchQuiet.page.getByRole('button', { name: 'ENTER QUIETLY', exact: true }).tap();
  await touchQuiet.page.reload();
  await touchQuiet.page.getByRole('heading', { name: 'Afterhours', exact: true }).waitFor();
  assert.equal(touchQuiet.requests(), 0);
  assert.equal(await touchQuiet.page.locator('.boot-screen').count(), 0);
  results.push('touch quiet entry stays quiet and skips boot on return');
  await touchQuiet.context.close();

  const touchRetry = await createPage({ width:390, height:844, touch:true, failFirst:true });
  await touchRetry.page.getByRole('button', { name: 'ENTER & OPEN RADIO', exact: false }).tap();
  await touchRetry.page.locator('.radio-error').waitFor();
  await touchRetry.page.getByRole('button', { name:'Play FULL VINYL', exact:false }).tap();
  await touchRetry.page.waitForFunction(() => window.__radio?.ready);
  assert.equal(await touchRetry.page.evaluate(() => window.__radio.playCalls), 0);
  await touchRetry.page.frameLocator('.radio-video-host').getByRole('button', { name:'Play video', exact:true }).tap();
  await playing(touchRetry.page);
  assert.equal(touchRetry.requests(), 2);
  results.push('touch player load failure retries and recovers through native Play');
  await touchRetry.context.close();

  const touchBlocked = await createPage({ width:390, height:844, touch:true, seen:true, blocked:true });
  await touchBlocked.page.waitForFunction(() => window.__radio?.ready);
  assert.equal(await touchBlocked.page.evaluate(() => scrollY), 0, 'Preparing touch radio on return must not scroll away from projects');
  await touchBlocked.page.getByRole('button', {name:'Start music: Nujabes set',exact:true}).tap();
  await touchBlocked.page.waitForFunction(() => document.activeElement?.id === 'midnight-radio-video-panel');
  assert.equal(await touchBlocked.page.evaluate(() => window.__radio.playCalls), 1);
  await touchBlocked.page.frameLocator('.radio-video-host').getByRole('button', {name:'Play video',exact:true}).tap();
  await playing(touchBlocked.page);
  results.push('touch custom Play blocking reveals native Play without automatic return scrolling');
  await touchBlocked.context.close();

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
  console.log(`Passed ${results.length} intro/music checks, including touch-native Play, first/return visits, blocked autoplay, quiet preferences, cancelled startup, restricted storage, and API retry.`);
} catch (error) {
  if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({ path: `${out}/intro-failure.png`, fullPage:true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
