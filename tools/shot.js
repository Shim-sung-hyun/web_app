#!/usr/bin/env node
/* 화면 캡처 — 앱 하나를 네 가지 화면 크기로 열어 캡처한다.

     node tools/shot.js 008/animal-home.html
     node tools/shot.js 001/shape-finder.html --wait 3000 --step "click:#startBtn" --step "wait:1500"

   - 앱은 진짜 주소(https://shim-sung-hyun.github.io/web_app/…)로 열지만, 그 주소의 파일은
     모두 이 저장소에서 꺼내 준다. 그래서 아직 올리지 않은 고친 판이 찍힌다.
   - Gemini·Google 음성(TTS) 요청은 막는다(키를 쓰지 않음). 글꼴은 받을 수 있으면 받고,
     --no-fonts 를 주면 막는다(바깥으로 못 나가는 곳에서 기다리지 않게).
   - 결과는 shots/앱이름/ 에 1366x768.png · 1024x768.png · 820x1180.png · phone.png.
   --step 은 차례대로: click:선택자 · tap:선택자 · press:키 · wait:밀리초 · eval:자바스크립트
   --full 은 화면 밖까지 길게 찍음. --only 1366x768,phone 처럼 일부 크기만 찍을 수 있음. */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SITES = ['https://shim-sung-hyun.github.io/web_app/', 'https://raw.githubusercontent.com/Shim-sung-hyun/web_app/main/'];
const SIZES = {
  '1366x768': { viewport: { width: 1366, height: 768 } },
  '1024x768': { viewport: { width: 1024, height: 768 }, hasTouch: true },
  '820x1180': { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true },
  'phone':    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
};
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.txt': 'text/plain' };

const args = process.argv.slice(2);
const opt = { wait: 2000, steps: [], full: false, fonts: true, only: null, app: null };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--wait') opt.wait = +args[++i];
  else if (a === '--step') opt.steps.push(args[++i]);
  else if (a === '--full') opt.full = true;
  else if (a === '--no-fonts') opt.fonts = false;
  else if (a === '--only') opt.only = args[++i].split(',');
  else opt.app = a.replace(/^\.?\//, '');
}
if (!opt.app || !fs.existsSync(path.join(ROOT, opt.app))) {
  console.error('쓰는 법: node tools/shot.js 008/animal-home.html [--wait 2000] [--step click:#start] [--full] [--no-fonts] [--only phone]');
  process.exit(1);
}

async function serve(route) {
  const url = route.request().url();
  const site = SITES.find(s => url.toLowerCase().startsWith(s.toLowerCase()));
  const rel = decodeURIComponent(url.slice(site.length).split(/[?#]/)[0]) || 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    console.log('  저장소에 없음:', rel);
    return route.fulfill({ status: 404, body: 'not found' });
  }
  route.fulfill({ status: 200, body: fs.readFileSync(file), headers: {
    'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'access-control-allow-origin': '*' } });
}

async function runStep(page, s) {
  const [k, ...rest] = s.split(':'); const v = rest.join(':');
  if (k === 'click') await page.click(v);
  else if (k === 'tap') await page.tap(v);
  else if (k === 'press') await page.keyboard.press(v);
  else if (k === 'wait') await page.waitForTimeout(+v);
  else if (k === 'eval') await page.evaluate(v);
  else throw new Error('모르는 단계: ' + s);
}

(async () => {
  const name = path.basename(opt.app, '.html');
  const out = path.join(ROOT, 'shots', name);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const [label, ctxOpt] of Object.entries(SIZES)) {
    if (opt.only && !opt.only.includes(label)) continue;
    const ctx = await browser.newContext({ ...ctxOpt, locale: 'ko-KR' });
    for (const s of SITES) await ctx.route(s.replace(/\/$/, '') + '/**', serve);
    await ctx.route(/generativelanguage\.googleapis\.com|texttospeech\.googleapis\.com/, r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '{"error":"캡처 중에는 쓰지 않음"}' }));
    if (!opt.fonts) await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log(`  [${label}] 앱 오류:`, e.message));
    await page.goto(SITES[0] + opt.app, { waitUntil: 'load', timeout: 30000 }).catch(e => console.log('  열기 늦음:', e.message));
    await page.waitForTimeout(opt.wait);
    try { for (const s of opt.steps) await runStep(page, s); }
    catch (e) { console.log(`  [${label}] 단계 실패:`, e.message.split('\n')[0]); }
    const file = path.join(out, label + '.png');
    await page.screenshot({ path: file, fullPage: opt.full });
    console.log('찍음:', path.relative(ROOT, file));
    await ctx.close();
  }
  await browser.close();
})();
