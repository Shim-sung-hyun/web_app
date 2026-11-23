#!/usr/bin/env node
/* 학습용 장면 만들기(2026-11-16, 008 선생님: 학습 장면이 빈 배경(bg.jpg)뿐이라 너무 단순 — 동물 공부니까 다른 동물은 없어도 그 곳답게 풍부하게).
     node tools/learn-scene.js                       # 008이 쓰는 11곳 모두
     node tools/learn-scene.js forest sea    # 몇 곳만
     node tools/learn-scene.js forest --seed 12  # 다른 판(마음에 안 들 때)
   하는 일: 무대 모듈(common/stagekit.js)로 그 곳 소품을 짜서(Stage.compose — 동물 없음) 배경 위에 그린 뒤 1200×900으로 찍어
     media/stage/nature/<곳>/learn.jpg 로 저장. 학습 동물이 서는 가운데 땅(008 PL.y 띠)은 비워 둠(avoid) — 동물이 소품보다 앞에 서도 어색하지 않게.
     쓰는 곳: 008 학습 장면(scn) — 숨은 동물 찾기는 그대로 무대를 그때그때 짬. 고른 seed는 learn-scene.json에 적어 둠(같은 판을 다시 만들 수 있게). */
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..') + '/', GH = 'https://shim-sung-hyun.github.io/web_app/';
const AVOID = {'ground': [.08, .8, .92, 1], 'forest': [.08, .8, .92, 1], 'grassland': [.08, .8, .92, 1], 'desert': [.08, .82, .92, 1], 'polar': [.08, .8, .92, 1],
  'mudflat': [.08, .8, .92, 1], 'wetland': [.08, .8, .92, 1], 'underground': [.2, .4, .8, .92], 'sky': [.33, .22, .67, .48], 'water': [.2, .38, .8, 1], 'sea': [.2, .38, .8, 1], 'pond': [.1, .4, .9, .58]};
/* 발밑 줄보다 앞(아래) 땅만 비움 — 동물보다 뒤(멀리)에 놓인 소품은 동물과 겹쳐 보여도 자연스러움(원근). 하늘·물속·땅속은 동물이 떠 있는 가운데만 */
const args = process.argv.slice(2), seedArg = args.includes('--seed') ? +args[args.indexOf('--seed') + 1] : null;
const list = args.filter(a => a in AVOID); const places = list.length ? list : Object.keys(AVOID);
const memo = ROOT + 'media/stage/learn-scene.json'; const M = fs.existsSync(memo) ? JSON.parse(fs.readFileSync(memo, 'utf8')) : {};
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1200, height: 900}});
  await p.route(GH + '**', r => { const f = ROOT + decodeURIComponent(new URL(r.request().url()).pathname.replace('/web_app/', '')); if (fs.existsSync(f) && fs.statSync(f).isFile()) r.fulfill({path: f, headers: {'access-control-allow-origin': '*'}}); else r.fulfill({status: 404, body: ''}); });
  await p.goto(GH + 'tools/');
  await p.setContent('<!doctype html><html><body style="margin:0;background:#fff"><div id="box" style="position:relative;width:1200px;height:900px;overflow:hidden"></div><script src="' + GH + 'common/stagekit.js"></script></body></html>');
  await p.waitForFunction(() => window.Stage, null, {timeout: 20000});
  for (const id of places) {
    const seed = seedArg ?? M[id] ?? 7;
    const ok = await p.evaluate(async ({id, seed, av, GH}) => {
      const box = document.getElementById('box'); box.innerHTML = '';
      const pl = await Stage.load('nature/' + id, {base: GH + 'media/stage/'}); if (!pl) return false;
      const lay = Stage.compose(pl, {seed, avoid: [av], min: 0, clusters: 5, thickets: 3});
      Stage.render(box, pl, lay, {shadow: .25, haze: .3});
      const ims = [...box.querySelectorAll('img')]; await Promise.all(ims.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      return lay.length; }, {id, seed, av: AVOID[id], GH});
    if (!ok) { console.log(id, '무대를 못 불러옴'); continue; }
    await p.waitForTimeout(300);
    await (await p.$('#box')).screenshot({path: ROOT + 'media/stage/nature/' + id + '/learn.jpg', type: 'jpeg', quality: 86});
    M[id] = seed; console.log(id, '소품', ok, '→ learn.jpg (seed ' + seed + ')');
  }
  fs.writeFileSync(memo, JSON.stringify(M, null, 1) + '\n'); await b.close();
})();
