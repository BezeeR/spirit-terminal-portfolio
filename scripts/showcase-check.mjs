import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createApp } from '../server/app.ts';

const out = resolve('test-results/showcase');
await mkdir(out, { recursive: true });
const server = createApp(resolve('dist')).listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.PORTFOLIO_BROWSER_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const errors = [], results = [];
let currentPage;
const layouts = [[320,568],[390,844],[667,375],[1024,768],[1440,900],[1920,1080],[2580,1440]];
const galleryProjects = [['Afterhours','afterhours',5],['TCG Buds Sim','tcg-buds-pack-night',3],['CardSlate Desktop','cardslate-desktop',3],['CardSlate Website','cardslate-web',1]];
async function enter(page, hash = 'afterhours') {
  await page.goto(`${origin}/#${hash}`);
  const quiet = page.getByRole('button', { name: 'ENTER QUIETLY', exact: true });
  // Every fixture uses a fresh context. Wait for its first-visit dialog instead
  // of racing the effect that opens it on a motion-enabled mobile page.
  await quiet.click();
  await page.locator('.boot-screen').waitFor({state:'detached'});
  await page.getByRole('heading', { name: hash === 'afterhours' ? 'Afterhours' : 'TCG Buds Sim', exact: true }).waitFor();
}
async function scene(page, gallery, n) {
  await page.waitForFunction(({ selector, n }) => {
    const root = document.querySelector(selector);
    const track = root?.querySelector('.showcase-track');
    const selected = root?.querySelector('.showcase-filmstrip button[aria-current]');
    return (selected ? selected.textContent.includes(String(n).padStart(2,'0')) : n === 1 && track?.children.length === 1) && Math.abs(track.scrollLeft - (n - 1) * track.clientWidth) < 2;
  }, { selector: await gallery.evaluate(el => el.closest('dialog') ? '.project-viewer .project-showcase' : '.visual-column .project-showcase'), n });
}
async function overflow(page, label) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${label}: page overflow`);
  const clipping = await page.locator('.project-viewer[open] .project-viewer-header button,.project-viewer[open] .project-viewer-footer a').evaluateAll(elements => elements.filter(el => {
    const r=el.getBoundingClientRect();return r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1;
  }).map(el => el.textContent));
  assert.deepEqual(clipping, [], `${label}: clipped controls`);
}
async function presentation(gallery, label) {
  const conflicts = await gallery.evaluate(root => {
    const media=root.querySelector('.showcase-screen').getBoundingClientRect();
    const intersects=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    const found=[...root.querySelectorAll('.showcase-media-label,.showcase-expand')].filter(el=>intersects(media,el.getBoundingClientRect())).map(el=>el.className);
    const copy=root.querySelector('.site-copy'), product=root.querySelector('.site-product-preview');
    if(copy&&product) {
      const a=copy.getBoundingClientRect(),b=product.getBoundingClientRect();
      if(intersects(a,b))found.push('website copy overlaps product preview');
      for(const box of [a,b])if(box.left<media.left-1||box.right>media.right+1||box.top<media.top-1||box.bottom>media.bottom+1)found.push('website artwork is clipped');
    }
    return found;
  });
  assert.deepEqual(conflicts,[],`${label}: preview text and controls must stay clear of artwork`);
}
try {
  for (const [width,height] of layouts) {
    const context = await browser.newContext({ viewport:{width,height}, reducedMotion:'reduce' });
    const page = currentPage = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const external = [];
    page.on('request', request => { if(!request.url().startsWith(origin)) external.push(request.url()); });
    await enter(page);
    await page.evaluate(() => document.documentElement.style.fontSize = '20px');
    for (const [title,id,count] of galleryProjects) {
      await page.getByRole('button',{name:`Open ${title}`,exact:true}).click();
      const inline=page.locator('.visual-column .project-showcase');
      await presentation(inline,`${title}/${width}/inline`);
      if(id==='cardslate-web'&&[320,390,1440].includes(width))await page.locator('.visual-frame').screenshot({path:`${out}/cardslate-web-${width}-inline.png`});
      const opener = page.getByRole('button',{name:'VIEW PROJECT',exact:false});
      await opener.click();
      const dialog = page.getByRole('dialog',{name:title,exact:true});
      await dialog.waitFor();
      assert.equal(await dialog.getByRole('button',{name:'Close project viewer',exact:true}).evaluate(el=>el===document.activeElement),true);
      const gallery=dialog.getByRole('region',{name:`${title} project gallery`,exact:true});
      await gallery.locator('.showcase-track').focus();
      await page.keyboard.press('ArrowRight');
      await scene(page,gallery,Math.min(2,count));
      assert.equal(await page.evaluate(()=>location.hash),`#${id}`,'gallery keys never change the project');
      await page.keyboard.press('End');
      await scene(page,gallery,count);
      if(count>1)assert.equal(await gallery.getByRole('button',{name:'Next scene',exact:true}).isDisabled(),true);
      else assert.equal(await gallery.getByRole('button',{name:/^(Next|Previous) scene$/}).count(),0,'single previews do not display unusable arrows');
      await page.keyboard.press('Home');
      await scene(page,gallery,1);
      if (title === 'Afterhours' && width === 390) {
        for (let n=1;n<=5;n++) {
          await gallery.locator('.showcase-filmstrip button').nth(n-1).click();
          await scene(page,gallery,n);
          const photo=gallery.locator('.showcase-slide[aria-hidden="false"] img');
          await photo.evaluate(image=>image.decode());
          assert(await photo.getAttribute('alt'),'every alpha capture has a description');
          assert.equal(await gallery.locator('.showcase-media-label').innerText(),'ALPHA CAPTURE · FICTIONAL CR');
          if (n>1) await dialog.screenshot({path:`${out}/afterhours-scene-${n}-390.png`});
        }
        await gallery.locator('.showcase-filmstrip button').first().click();
        await scene(page,gallery,1);
      }
      await overflow(page,`${title}/${width}`);
      await presentation(gallery,`${title}/${width}/expanded`);
      const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      assert.deepEqual(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],`${title}/${width}: accessibility`);
      assert.equal(await page.locator('iframe,video').count(),0,'screenshots do not load video or third-party players');
      if ([390,1440].includes(width) && title !== 'CardSlate Desktop') {
        await dialog.screenshot({path:`${out}/${title==='Afterhours'?'afterhours':id==='cardslate-web'?'cardslate-web':'tcg-buds'}-${width}.png`});
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.project-viewer').count(),0);
      assert.equal(await opener.evaluate(el=>el===document.activeElement),true,'closing restores the invoking button');
    }
    assert.deepEqual(external,[],'viewing the project makes no third-party request');
    results.push({width,height,textScale:'125%',projects:galleryProjects.length,axeViolations:0});
    await context.close();
  }

  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
  const page=currentPage=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await enter(page);
  const inline=page.locator('.visual-column .project-showcase'), track=inline.locator('.showcase-track');
  await track.evaluate(async el => {
    for(let node=el;node;node=node.parentElement) {
      await Promise.all(node.getAnimations().filter(animation=>animation.effect.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));
    }
    // Position vertically without letting the page's smooth-scroll animation
    // move the target after CDP touch coordinates have been sampled.
    el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
    await new Promise(requestAnimationFrame);
  });
  const box=await track.boundingBox(), client=await context.newCDPSession(page);
  const geometry = await track.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const hit=document.elementFromPoint(rect.x + el.clientWidth * .85, rect.y + el.clientHeight * .5);
    return { left:rect.left, right:rect.right, viewport:innerWidth, inGallery:!!hit?.closest('.project-showcase') };
  });
  assert.equal(geometry.left >= 0 && geometry.right <= geometry.viewport,true,'the mobile gallery fits within the visible screen');
  assert.equal(geometry.inGallery,true,'native touch starts on the gallery after page positioning settles');
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.85,y:box.y+box.height*.5}]});
  for(let step=1;step<=8;step++) {
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*(.85-.7*step/8),y:box.y+box.height*.5}]});
    await page.waitForTimeout(20);
  }
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForFunction(()=>Number(document.querySelector('.visual-column .showcase-track').scrollLeft)>50,undefined,{timeout:5000});
  await scene(page,inline,2);
  assert.equal(await page.evaluate(()=>location.hash),'#afterhours','a real horizontal swipe stays inside the selected project');
  await inline.getByRole('button',{name:/^03 /}).click();
  await scene(page,inline,3);
  await inline.getByRole('button',{name:/^Expand /}).click();
  const dialog=page.getByRole('dialog',{name:'Afterhours',exact:true});
  const gallery=dialog.getByRole('region',{name:'Afterhours project gallery',exact:true});
  await scene(page,gallery,3);
  await gallery.getByRole('button',{name:/^01 /}).click();
  await scene(page,gallery,1);
  await gallery.getByRole('button',{name:'INSPECT IMAGE',exact:true}).click();
  assert.equal(await gallery.getByRole('button',{name:'FIT IMAGE',exact:true}).getAttribute('aria-pressed'),'true');
  await gallery.getByRole('button',{name:'Next scene',exact:true}).click();
  await scene(page,gallery,2);
  assert.equal(await gallery.getByRole('button',{name:'INSPECT IMAGE',exact:true}).getAttribute('aria-pressed'),'false','changing to another screenshot resets inspection');
  for(let n=0;n<12;n++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement===document.body||document.querySelector('.project-viewer').contains(document.activeElement)),true,'modal focus stays contained');
  }
  await dialog.getByRole('button',{name:'Close project viewer',exact:true}).click();
  await context.close();

  const offline=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'});
  const fallback=currentPage=await offline.newPage();
  // Only the original trading capture fails; the next approved photo stays available.
  await fallback.route(/\/assets\/afterhours-(?!advanced-|portfolio-|orders-|news-)[A-Za-z0-9_-]+\.webp$/,route=>route.fulfill({status:404,contentType:'text/plain',body:'Unavailable fixture'}));
  await enter(fallback);
  const offlineGallery=fallback.locator('.visual-column .project-showcase');
  await scene(fallback,offlineGallery,1);
  await offlineGallery.getByText('PREVIEW OFFLINE',{exact:true}).waitFor();
  await offlineGallery.getByRole('button',{name:'Next scene',exact:true}).click();
  await scene(fallback,offlineGallery,2);
  await offlineGallery.locator('.showcase-slide[aria-hidden="false"] img').evaluate(image=>image.decode());
  assert.equal(await offlineGallery.locator('.showcase-slide[aria-hidden="false"]').getByText('PREVIEW OFFLINE',{exact:true}).count(),0,'another capture still loads after the first image fails');
  await offline.close();
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/checks.json`,JSON.stringify({results,touchSwipe:'passed',focusReturn:'passed',keyboardIsolation:'passed',imageFailure:'passed',noExternalMedia:'passed',errors},null,2));
  console.log(`PASS project gallery: ${layouts.length*galleryProjects.length} larger-text project/layout combinations, unobscured preview artwork, WCAG checks, native touch swipe, smooth navigation, thumbnails, inspect mode, modal focus/Escape, project isolation, and missing-image recovery.`);
} catch(error) {
  if(currentPage&&!currentPage.isClosed()) {
    await currentPage.screenshot({path:`${out}/failure.png`,fullPage:true}).catch(()=>{});
    await writeFile(`${out}/failure.html`,await currentPage.content()).catch(()=>{});
  }
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
