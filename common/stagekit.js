/* 무대(stage) 공통 모듈 stagekit — 원본은 common/stagekit.js 한 곳. 앱 안의 이 칸은 손으로 고치지 말고 python3 tools/sync-modules.py
   빈 배경 위에 요소를 '밑동이 아래인 것이 앞'으로 쌓는다(만화영화 셀·포토샵 레이어처럼).
   자료: media/stage/<갈래>/<장소>/ (bg.jpg · items/ · skirt/ 밑동 덮개 · front/ 앞가림 띠 · far/ 먼 띠 · stage.json), 차림표 media/stage/index.json
   장면의 규칙은 stage.json 이 가짐(2026-11-04 다시 짬):
     beds  자리 — {이름:{y:[위,아래], x:[[왼,오른]…], persp:원근 여부, skirt:[그 자리에 까는 덮개]}}  예) 땅·물속 바닥·물낯·물가 둑·흙 속·하늘
     items 요소 — {이름:{real:[m,m], bed:놓일 자리, role:'big'|'frame', base·foot(그림의 실제 밑동 — tools/stage-meta.py가 잼)}}
   → 요소는 제 자리에만 놓이고(물풀이 공중에 뜨거나 땅 요소가 물에 서지 않음), 밑동이 그 자리의 땅·바닥·물낯에 정확히 닿음.
   쓰는 법
     const pl = await Stage.load('nature/desert');
     const lay = Stage.compose(pl, {seed: 7});          // 무작위(같은 seed면 같은 장면) · {fixed:[{id,x,y,r,flip}]} · {avoid:[[x0,y0,x1,y1]…], min:0}
     Stage.add(pl, lay, {src, real, x, y, w, h, bed});   // 동물도 같은 규칙으로(real이면 그 깊이의 원근 크기)
     Stage.render(div, pl, lay, {shadow:.28, haze:.3});  // look: layer·bg·zOf·farZ·frontZ·front·skirt·showBeds
   좌표 x·y는 장면 대비 0~1, y는 밑동(땅에 닿는 곳). 모듈은 동작만, 얼굴(그림자 세기·흐림)은 앱이 넘겨 줌. */
(function (G) {
  const BASE = 'https://shim-sung-hyun.github.io/web_app/media/stage/';
  const rnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const img = src => new Promise(ok => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  async function load(id, opt = {}) {
    const base = opt.base || BASE, dir = base + id + '/';
    const cfg = await fetch(dir + 'stage.json', {cache: 'no-cache'}).then(r => r.json());
    const pl = Object.assign({id, dir, horizon: .35, groundTop: .36, unit: .22}, cfg);
    if (!pl.beds) pl.beds = {ground: {y: [pl.groundTop, 1], persp: true, skirt: pl.skirt || []}};
    const bed0 = Object.keys(pl.beds)[0];
    const jobs = [img(dir + (opt.bg || 'bg') + '.jpg').then(i => pl.bgImg = i)];
    for (const [k, it] of Object.entries(pl.items || {})) {
      it.id = k; it.bed = pl.beds[it.bed] ? it.bed : bed0; it.src = (it.from ? base + it.from + '/' : dir) + 'items/' + k + '.webp';
      jobs.push(img(it.src).then(i => { it.img = i; if (i) { it.w = i.naturalWidth; it.h = i.naturalHeight; } }));
    }
    for (const f of pl.front || []) { f.srcUrl = dir + 'front/' + f.src + '.webp'; jobs.push(img(f.srcUrl).then(i => f.img = i)); }
    for (const f of pl.far || []) { f.srcUrl = dir + 'far/' + f.src + '.webp'; jobs.push(img(f.srcUrl).then(i => f.img = i)); }
    pl.skirtImg = {};
    const sk = new Set(Object.values(pl.beds).flatMap(b => b.skirt || []));
    Object.values(pl.items || {}).forEach(i => Array.isArray(i.skirt) && i.skirt.forEach(k => sk.add(k)));
    for (const k of sk) {
      const source = pl.skirtFrom && pl.skirtFrom[k] ? base + pl.skirtFrom[k] + '/skirt/' + k + '.webp' : dir + 'skirt/' + k + '.webp';
      jobs.push(img(source).then(i => { if (i) pl.skirtImg[k] = i; }));
    }
    await Promise.all(jobs);
    for (const k of Object.keys(pl.items || {})) if (!pl.items[k].img) delete pl.items[k];
    return pl;
  }

  /* 그 자리에서 1m가 장면 높이의 몇 몫인가. 원근 자리(땅·바닥)는 지평선에서 내려온 만큼에 비례, 아니면(물낯·흙 속·하늘) 어디서나 같음 */
  const perM = (pl, y, bed) => {
    const b = typeof bed === 'string' ? pl.beds[bed] : bed;
    if (b && b.persp === false) return b.unit || pl.unit;
    return pl.unit * Math.max(.04, (y - pl.horizon) / (1 - pl.horizon));
  };
  const inX = (b, x) => !b.x || b.x.some(r => x >= r[0] && x <= r[1]);
  const inAvoid = (pl, x, y) => (pl.avoid || []).some(r => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]);

  function pickSkirt(pl, it, r) {
    if (it.skirt === false) return null;
    const list = (Array.isArray(it.skirt) ? it.skirt : (pl.beds[it.bed] || {}).skirt || []).filter(k => pl.skirtImg[k]);
    return list.length ? list[Math.floor(((r * 7919) % 1) * list.length)] : null;
  }

  /* 하나 놓기: 실제 높이(m)와 밑동 자리로 크기를 셈. base = 그림 높이 중 밑동 줄의 몫(그 아래는 투명 여백) */
  function place(pl, it, x, y, r, flip, extra) {
    const realH = Array.isArray(it.real) ? it.real[0] + (it.real[1] - it.real[0]) * r : (it.real || 1);
    const base = it.base ?? 1;
    const h = realH * perM(pl, y, it.bed) / base * (it.scale || 1);
    const w = h * (it.w / it.h) * .75;   // 장면이 4:3
    const R = rnd(Math.floor(r * 4294967296));
    const skirtMargin = it.skirtMargin || [.03 + R() * .04, .03 + R() * .04];
    return Object.assign({id: it.id, src: it.src, bed: it.bed, x, y, w, h, base, flip: !!flip, foot: it.foot || [.2, .8], skirt: pickSkirt(pl, it, r), skirtMargin, skirtHeightScale: it.skirtHeightScale, skirtOffset: it.skirtOffset, skirtScale: it.skirtScale}, extra || {});
  }

  /* 무작위 배치: 자리마다 그 자리의 요소만. 고르게 흩뿌리지 않고 2~4 덩어리(큰 것 하나 + 앞쪽 작은 것) + 빈 땅 */
  function compose(pl, opt = {}) {
    if (opt.fixed) return opt.fixed.map(f => place(pl, pl.items[f.id], f.x, f.y, f.r ?? .5, f.flip));
    const R = rnd(opt.seed ?? Math.floor(Math.random() * 1e9)), pick = a => a[Math.floor(R() * a.length)];
    /* 빽빽함(2026-11-09): stage.json "compose" — clusters·perCluster·loose:[적게,많이], maxSame(같은 소품 몇 번까지), overlap(겹침 허용, 작을수록 촘촘) */
    const C = Object.assign({clusters: [2, 4], perCluster: [0, 2], loose: [1, 3], maxSame: 2, overlap: .3}, pl.compose || {}), rng = a => a[0] + Math.floor(R() * (a[1] - a[0] + 1));
    opt = Object.assign({maxSame: C.maxSame}, opt);
    const items = Object.values(pl.items || {}), out = [];
    const byBed = {}; items.forEach(i => { if (i.role !== 'frame') (byBed[i.bed] = byBed[i.bed] || []).push(i); });
    const beds = Object.keys(byBed);
    if (!beds.length) return out;
    const spot = (b, it, near) => {   // 그 자리 안의 x·y (it.ground: 자리 위아래 범위 중 놓일 몫)
      const B = pl.beds[b], g = it.ground || [0, 1], y0 = B.y[0] + (B.y[1] - B.y[0]) * g[0], y1 = B.y[0] + (B.y[1] - B.y[0]) * g[1];
      for (let t = 0; t < 20; t++) {
        const x = near ? clamp(near.x + (R() - .5) * near.w * 1.4, .03, .97) : (B.x ? (r => r[0] + (r[1] - r[0]) * R())(pick(B.x)) : .04 + R() * .92);
        const y = near ? clamp(near.y + .01 + R() * .05, y0, y1) : y0 + (y1 - y0) * R();
        if (inX(B, x) && !inAvoid(pl, x, y)) return {x, y};
      }
      return null;
    };
    /* 놓으면 안 되는 경우(장면의 원리, media/stage/README.txt '장면의 원리'):
       ⑦ 같은 소품은 한 장면에 2번까지 · ⑧ 좌우는 화면 안에 다 들어옴(좌우 가장자리에서 잘려도 되는 것은 가까운 줄기 frame뿐, 위로는 넘어가도 됨) · 같은 자리에서 너무 겹침 */
    const clash = p => out.filter(o => o.id === p.id).length >= (opt.maxSame ?? 2)
      || p.x - p.w / 2 < 0 || p.x + p.w / 2 > 1   // 좌우는 화면 안(위로는 키 큰 나무가 화면 위로 넘어가도 됨)
      || out.some(o => o.bed === p.bed && Math.abs(o.x - p.x) < (o.w + p.w) * C.overlap && Math.abs(o.y - p.y) < .04);
    const n = opt.clusters ?? rng(C.clusters);
    for (let c = 0; c < n; c++) {
      const b = pick(beds.filter(k => pl.beds[k].persp !== false || pl.beds[k].y[1] - pl.beds[k].y[0] > .1)) || pick(beds);
      const list = byBed[b], big = list.filter(i => i.role === 'big'), small = list.filter(i => i.role !== 'big');
      const lead = big.length && R() < .75 ? pick(big) : pick(small.length ? small : big);
      const s = spot(b, lead); if (!s) continue;
      const L = place(pl, lead, s.x, s.y, R(), lead.flip !== false && R() < .5); if (clash(L)) continue; out.push(L);
      for (let j = 0, k = rng(C.perCluster); j < k && small.length; j++) {
        const it = pick(small), s2 = spot(b, it, L); if (!s2) continue;
        const p = place(pl, it, s2.x, s2.y, R() * .7, it.flip !== false && R() < .5); if (!clash(p)) out.push(p);
      }
    }
    const loose = opt.loose ?? rng(C.loose);   // 덩어리 밖 작은 것, 물낯·하늘 같은 얇은 자리의 것도 여기서
    for (let j = 0, t = 0; j < loose && t < loose * 8 + 20; t++) {
      const b = pick(beds), it = pick(byBed[b].filter(i => i.role !== 'big').length ? byBed[b].filter(i => i.role !== 'big') : byBed[b]), s = spot(b, it);
      if (!s) continue; const p = place(pl, it, s.x, s.y, R() * .6, R() < .5); if (!clash(p)) { out.push(p); j++; }
    }
    for (const [b, count] of Object.entries(opt.bedLoose || pl.bedLoose || {})) {
      const pool = (byBed[b] || []).filter(i => i.role !== 'big'), used = new Set();
      if (!pool.length || !Number.isFinite(count) || count <= 0) continue;
      for (let j = 0, t = 0; j < count && t < count * 10; t++) {
        const available = pool.filter(i => !used.has(i.id)), it = pick(available.length ? available : pool), s = spot(b, it);
        if (!s) continue;
        const p = place(pl, it, s.x, s.y, R() * .6, R() < .5);
        if (!clash(p)) { out.push(p); used.add(it.id); j++; }
      }
    }
    const frame = items.filter(i => i.role === 'frame');   // 가까운 줄기: 화면 가장자리, 위는 화면 밖
    if (frame.length && R() < (opt.frame ?? .5)) {
      const it = pick(frame), left = R() < .5, p = place(pl, it, 0, it.frameY ? it.frameY[0] + R() * (it.frameY[1] - it.frameY[0]) : .9 + R() * .08, R(), !left);
      p.h = 1.08 + R() * .12; p.w = p.h * (it.w / it.h) * .75; const sh = it.frameShow ?? .35; p.x = left ? -p.w * (.5 - sh) : 1 + p.w * (.5 - sh); p.skirt = null; out.push(p);   // frameShow: 그림 폭 중 화면 안에 보일 몫(기본 .35) · 가까운 줄기에는 덮개 없음
    }
    if (opt.avoid && opt.avoid.length) {
      const hit = o => opt.avoid.some(r => o.x + o.w / 2 > r[0] && o.x - o.w / 2 < r[2] && o.y > r[1] && o.y - o.h * o.base < r[3]);
      for (let i = out.length - 1; i >= 0; i--) if (hit(out[i])) out.splice(i, 1);
      if (opt.min === 0) return out;
    }
    if ((opt._t || 0) < 5 && out.filter(o => o.h > .06).length < 2)
      return compose(pl, Object.assign({}, opt, {seed: (opt.seed ?? Math.floor(R() * 1e9)) + 1, _t: (opt._t || 0) + 1}));
    return out;
  }

  /* 동물·앱 소품을 같은 규칙으로. real(m)을 주면 그 자리·깊이의 크기로, 아니면 sw·sh(장면 대비)를 그대로 */
  function add(pl, lay, a) {
    const it = {id: a.name || 'actor', src: a.src, real: a.real || 1, w: a.w || 1, h: a.h || 1, base: a.base, foot: a.foot, bed: a.bed || Object.keys(pl.beds)[0], skirt: a.skirt ? undefined : false};
    const p = a.real ? place(pl, it, a.x, a.y, .5, a.flip, {actor: true, el: a.el})
      : {id: it.id, src: a.src, bed: it.bed, x: a.x, y: a.y, w: a.sw, h: a.sh, base: a.base ?? 1, flip: !!a.flip, foot: a.foot || [.2, .8], skirt: null, actor: true, el: a.el};
    lay.push(p); return p;
  }

  function render(box, pl, lay, look = {}) {
    const sh = look.shadow ?? .28, hz = look.haze ?? .3;
    box.innerHTML = '';
    if (!look.layer) { box.style.position = 'relative'; box.style.aspectRatio = box.style.aspectRatio || '4 / 3'; box.style.overflow = 'hidden'; }
    const mk = (tag, css) => { const e = document.createElement(tag); e.style.cssText = 'position:absolute;pointer-events:none;' + css; box.appendChild(e); return e; };
    const fog = far => `saturate(${1 - .4 * hz * far}) brightness(${1 + .12 * hz * far}) contrast(${1 - .25 * hz * far})`;
    if (pl.bgImg && look.bg !== false) { const b = mk('img', 'left:0;top:0;width:100%;height:100%;object-fit:cover;z-index:0'); b.src = pl.bgImg.src; b.alt = ''; }
    for (const f of pl.far || []) if (f.img) {   // 먼 띠: 밑동이 지평선에, 모든 요소 뒤
      const h = f.h || .08, y = f.y ?? pl.horizon + .01, e = mk('img', `left:-1%;width:102%;top:${(y - h * (f.base || 1)) * 100}%;height:${h * 100}%;z-index:${look.farZ ?? 2};object-fit:fill;filter:${fog(1)}`); e.src = f.srcUrl; e.alt = '';
    }
    if (look.showBeds) Object.entries(pl.beds).forEach(([k, b]) => (b.x || [[0, 1]]).forEach(r => {
      const e = mk('div', `left:${r[0] * 100}%;width:${(r[1] - r[0]) * 100}%;top:${b.y[0] * 100}%;height:${Math.max(.004, b.y[1] - b.y[0]) * 100}%;z-index:8000;outline:2px dashed rgba(200,40,40,.8);background:rgba(255,255,255,.08);font:12px sans-serif;color:#a00`); e.textContent = b.name || k; }));
    const order = lay.slice().sort((a, b) => a.y - b.y);
    order.forEach((o, i) => {
      const z = look.zOf ? look.zOf(o, i) : 10 + i * 2;
      const B = pl.beds[o.bed] || {}, far = B.persp === false ? 0 : clamp(1 - (o.y - pl.horizon) / (1 - pl.horizon), 0, 1);
      const top = o.y - o.h * o.base, left = o.x - o.w / 2, fx = f => o.x + (o.flip ? -1 : 1) * o.w * (f - .5);
      const footL = Math.min(fx(o.foot[0]), fx(o.foot[1])), footR = Math.max(fx(o.foot[0]), fx(o.foot[1]));
      if (B.persp !== false && sh > 0 && !o.noShadow) {   // 땅에 닿는 옅은 그림자(같은 방향·진하기)
        const fw = (footR - footL) * 1.1, fh = Math.max(.006, fw * .16);
        mk('div', `left:${((footL + footR) / 2 - fw / 2) * 100}%;top:${(o.y - fh * .55) * 100}%;width:${fw * 100}%;height:${fh * 100}%;z-index:${z - 1};border-radius:50%;background:radial-gradient(closest-side,rgba(40,28,14,${sh}),rgba(40,28,14,0))`);
      }
      const e = o.el || document.createElement('img');
      if (!o.el) { e.src = o.src; e.alt = ''; e.draggable = false; }
      e.style.cssText += `;position:absolute;left:${left * 100}%;top:${top * 100}%;width:${o.w * 100}%;height:${o.h * 100}%;z-index:${z};transform:${o.flip ? 'scaleX(-1)' : 'none'};` + (o.actor ? '' : `filter:${fog(far)};pointer-events:none;`);
      box.appendChild(e); o.z = z;
      const si = o.skirt && pl.skirtImg[o.skirt];
      if (si && look.skirt !== false && o.h > .05) {   // 밑동 덮개: 덮개의 밑동 줄을 요소의 밑동 줄에 맞춰 땅에 붙임
        const m = (pl.skirtMeta || {})[o.skirt] || {base: 1, foot: [0, 1]}, vis = Math.max(.2, m.foot[1] - m.foot[0]);
        const ks = o.skirtScale || 1;   // 앱·선생님이 바꾼 덮개 배율
        const span = footR - footL, mid = (footL + footR) / 2, margin = o.skirtMargin || [.05, .05];
        const left = mid - span * (.5 + margin[0]) * ks, right = mid + span * (.5 + margin[1]) * ks;
        const sw = (right - left) / vis;
        const naturalH = sw * (si.naturalHeight / si.naturalWidth) * 4 / 3;
        const cap = o.h * o.base * .08 * ks;
        const shh = Math.min(naturalH, Math.max(naturalH * .5, cap / m.base)) * (o.skirtHeightScale ?? 1);
        const offset = o.skirtOffset || [0, 0];
        const cx = left - sw * m.foot[0] + sw / 2 + offset[0];
        const cy = o.y + o.h * .004 + offset[1];
        const k = mk('img', `left:${(cx - sw / 2) * 100}%;top:${(cy - shh * m.base) * 100}%;width:${sw * 100}%;height:${shh * 100}%;z-index:${z + 1};filter:${fog(far)}`); k.src = si.src; k.alt = ''; o.skirtAt = [cx, cy - shh * m.base * .45];   // 덮개 가운데(앱이 표시할 때)
      }
    });
    if (look.front !== false) for (const f of pl.front || []) if (f.img) {
      const h = f.h || .12, e = mk('img', `left:-1%;width:102%;top:${(1 - h * (f.base || 1)) * 100}%;height:${h * 100}%;z-index:${look.frontZ ?? 9000};object-fit:fill`); e.src = f.srcUrl; e.alt = '';
    }
    return order;
  }

  /* ── 숨기기(2026-11-09 시작, 무대 위에서 새로 짬) ─────────────────────────────────────────
     동물은 무대의 원근을 그대로 따름: 그려진 몸의 가장 긴 쪽 = 실제 크기(m) × 그 깊이의 1m. 그래서 멀리 숨으면 작고 가까우면 큼.
     숨는 자리 = 같은 자리(bed)에 놓인 소품 바로 뒤(밑동이 소품보다 조금 위 = 조금 멀리). 보이는 몫은 그림 모양(알파)으로 셈해 목표 범위에 맞춤.
     맞는 소품이 없으면 그 동물을 가릴 만한 소품을 바로 앞에 하나 더 놓음. */
  const MASK = new WeakMap();
  function maskOf(img, n = 64) {   // 그림을 가장 긴 쪽 n칸으로 — 칸마다 칠해졌는지
    if (MASK.has(img)) return MASK.get(img);
    const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height, k = n / Math.max(W, H), w = Math.max(1, Math.round(W * k)), h = Math.max(1, Math.round(H * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', {willReadFrequently: true});
    let m = null; try { x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data; m = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] > 110 ? 1 : 0; } catch (e) { m = null; }
    let x0 = w, y0 = h, x1 = -1, y1 = -1; if (m) for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (m[y * w + i]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const r = {w, h, m, box: x1 < 0 ? [0, 0, w, h] : [x0, y0, x1 + 1, y1 + 1]}; MASK.set(img, r); return r;
  }
  const solidAt = (o, img, fx, fy) => {   // 장면 좌표(0~1)에 o의 그림이 칠해져 있나
    const M = maskOf(img); if (!M.m) return false;
    let u = (fx - (o.x - o.w / 2)) / o.w; const v = (fy - (o.y - o.h * o.base)) / o.h;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return false; if (o.flip) u = 1 - u;
    return M.m[Math.floor(v * M.h) * M.w + Math.floor(u * M.w)] === 1;
  };
  function visibleOf(pl, lay, A) {   // 동물 A의 칠해진 칸 중 앞(밑동이 더 아래)의 것에 가려지지 않은 몫
    const M = maskOf(A.img), front = lay.filter(o => o !== A && o.y > A.y && (o.img || (pl.items[o.id] || {}).img));
    let tot = 0, vis = 0;
    for (let j = 0; j < M.h; j++) for (let i = 0; i < M.w; i++) {
      if (!M.m || !M.m[j * M.w + i]) continue; tot++;
      const u = (A.flip ? M.w - 1 - i : i) + .5, fx = A.x - A.w / 2 + A.w * u / M.w, fy = A.y - A.h * A.base + A.h * (j + .5) / M.h;
      if (fx < 0 || fx > 1 || fy < 0 || fy > 1) continue;
      if (!front.some(o => solidAt(o, o.img || pl.items[o.id].img, fx, fy))) vis++;
    }
    return tot ? vis / tot : 0;
  }
  function hide(pl, lay, a, opt = {}) {
    const R = rnd(opt.seed ?? Math.floor(Math.random() * 1e9)), want = opt.visible || [.25, .4], mid = (want[0] + want[1]) / 2;
    const M = maskOf(a.img), bw = (M.box[2] - M.box[0]) / M.w, bh = (M.box[3] - M.box[1]) / M.h, long = Math.max(bw * (M.w / Math.max(M.w, M.h)) * .75 / .75, bh * (M.h / Math.max(M.w, M.h)));
    const bed = a.bed || Object.keys(pl.beds)[0], B = pl.beds[bed], baseFrac = M.box[3] / M.h;
    const make = (x, y, flip) => {   // 그 깊이의 크기로 동물 놓기: 몸의 가장 긴 쪽 = real × 1m (가로는 4:3 장면이라 0.75)
      const m1 = perM(pl, y, bed), bodyLong = a.real * m1, Mw = M.w / Math.max(M.w, M.h), Mh = M.h / Math.max(M.w, M.h);
      const bodyW = bw * Mw, bodyH = bh * Mh, k = bodyLong / Math.max(bodyW * .75, bodyH), h = k * Mh, w = k * Mw * .75;
      return {id: a.name, src: a.src, img: a.img, bed, x, y, w, h, base: baseFrac, flip, foot: [M.box[0] / M.w, M.box[2] / M.w], actor: true, skirt: null, animal: a.name};
    };
    let best = null;
    const minLong = opt.minLong ?? .07;   // 찾을 수 있게: 몸의 가장 긴 쪽이 장면 높이의 7%는 되는 깊이에만(지평선 가까이에선 너무 작음)
    const tryAt = (x, y, flip, extra) => { if (a.real * perM(pl, y, bed) < minLong) return; const A = make(x, y, flip); if (A.x - A.w * .45 < 0 || A.x + A.w * .45 > 1) return;
      lay.push(A); if (extra) lay.push(extra); const v = visibleOf(pl, lay, A); lay.pop(); if (extra) lay.pop();
      const floor = Math.max(.04, want[0] * .5);
      if (v < floor) return;   // 어려워도 단서(귀·꼬리)는 보이게 — 다 가려지는 자리는 버림
      lay.push(A); if (extra) lay.push(extra);   // 먼저 숨긴 동물을 이 동물·새 소품이 앞에서 덮지 않게
      const hurt = lay.some(o => o.animal && o !== A && visibleOf(pl, lay, o) < Math.max(.04, (o.want || want)[0] * .5)); lay.pop(); if (extra) lay.pop(); if (hurt) return;
      const sc = Math.abs(v - mid) + (v < want[0] || v > want[1] ? .5 : 0); if (!best || sc < best.sc) best = {sc, A, v, extra}; };
    const flip0 = () => R() < .5;
    for (const o of lay.filter(o => o.bed === bed && !o.actor && o.h > .03)) {   // 놓인 소품 바로 뒤
      for (let t = 0; t < 10; t++) { const y = Math.max(B.y[0], o.y - .004 - R() * .03), x = o.x + (R() - .5) * o.w * .9; tryAt(x, y, flip0()); }
    }
    if (!best || best.sc > .5) {      // 맞는 소품이 없으면 가릴 소품을 새로 앞에
      const pool = Object.values(pl.items).filter(i => i.bed === bed && i.role !== 'frame');
      for (let t = 0; t < 80; t++) {
        const g = B.y[0] + (B.y[1] - B.y[0]) * (.15 + R() * .8), x = .1 + R() * .8, A0 = make(x, g, false), it = pool[Math.floor(R() * pool.length)];
        if (!it) break; const P = place(pl, it, x + (R() - .5) * A0.w * .5, Math.min(B.y[1], g + .005 + R() * .02), R(), R() < .5); P.skirt = null;
        if (P.h < A0.h * .45 || P.x - P.w / 2 < 0 || P.x + P.w / 2 > 1) continue; tryAt(x, g, flip0(), P);
      }
    }
    if (!best) return null;
    if (best.extra) lay.push(best.extra); lay.push(best.A); best.A.visible = best.v; best.A.want = want; return best.A;
  }

  G.Stage = {load, compose, add, render, perM, place, hide, visibleOf, maskOf, BASE};
})(typeof window !== 'undefined' ? window : globalThis);
