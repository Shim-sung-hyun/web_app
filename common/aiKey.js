/* 차름 공통 모듈: AI 키 칸(aiKey) — 원본은 common/aiKey.js. 앱 안의 <script id="aiKey">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   키를 쓰는 앱(001·004·007·010 베타·012)의 설정에 같은 모양으로(2026-11-25 선생님, 시안 A 고친 판):
   - 접으면 한 줄 "▶ AI 키 넣기 (선택)" (+ "1개 기억됨" / 다 넣었으면 "AI 키 · 모두 기억됨")
   - 펼치면 위에 '기억된 키'(접힌 줄, 누르면 앞뒤 몇 글자 + 바꾸기·지우기), 아래에 '넣을 키'(첫 것은 펼쳐 둠).
     하나도 없으면 아래만, 다 넣었으면 위만.
   - 키 받는 법은 서비스 이름이 든 링크 한 줄(서비스마다 안내 페이지 하나, charum.org/study/doc.html?이름_guide)
   - 휴대폰으로 받기(keyRelay 모듈)는 Gemini·Google 음성만(중계 서버가 그 둘만 받음)
   키는 이 기기·이 브라우저의 localStorage 같은 칸(webapp.geminiKey 등)에 — 다른 차름 앱이 저절로 불러 씀.

   AiKey.mount(넣을 곳, { use: [{ svc: 'gemini', what: '내 사진에서 물건 찾기' }, …], open: false, onChange: (svc, 값) => {} })
     svc: 'gemini' | 'gtts'(Google 음성) | 'azure'(키+지역) | 'cloudflare'(Account ID+토큰)
     open: 처음부터 펼쳐 둘지   color: 앱 영역 색(제목·저장 단추·링크)   onChange: 저장·지울 때(값은 칸이 하나면 글, 둘 이상이면 {이름: 글}, 지우면 '')
   AiKey.get('gemini') → 글('' = 없음) · AiKey.get('azure') → {key, region} · AiKey.has('gtts') → 참/거짓
   AiKey.set('gtts', 글 또는 {…}) / AiKey.clear('gtts')   앱이 다른 길(키 확인 창 등)로 받은 키도 같은 칸에
   AiKey.refresh()   다시 그림(앱이 키를 바꾼 뒤) — 다른 창에서 바뀐 것은 저절로 */
window.AiKey = (function () {
  'use strict';
  var GUIDE = 'https://www.charum.org/study/doc.html?';
  var SVC = {
    gemini: { name: 'Gemini', guide: 'gemini_guide', relay: 'gemini', f: [{ n: 'key', k: 'webapp.geminiKey', ph: 'Gemini 키 붙여넣기 (AIza… 또는 AQ.…)', secret: true, test: /^(AIza|AQ\.)/ }] },
    gtts: { name: 'Google 음성', guide: 'google-tts_guide', relay: 'cloud', f: [{ n: 'key', k: 'webapp.cloudKey', ph: 'Google 음성 키 붙여넣기', secret: true }] },
    azure: { name: 'Azure 음성', guide: 'azure_guide', f: [{ n: 'key', k: 'webapp.azureKey', ph: 'Azure 음성 키 붙여넣기', secret: true }, { n: 'region', k: 'webapp.azureRegion', ph: '지역 (예: koreacentral)', test: /^[a-z0-9]+$/ }] },
    cloudflare: { name: 'Cloudflare AI', guide: 'cloudflare_guide', f: [{ n: 'account', k: 'webapp.cfAccount', ph: 'Account ID' }, { n: 'token', k: 'webapp.cfToken', ph: 'API Token 붙여넣기', secret: true }] }
  };
  var boxes = [];
  function rd(k) { try { return (localStorage.getItem(k) || '').trim(); } catch (e) { return ''; } }
  function wr(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} }
  function get(svc) {
    var s = SVC[svc]; if (!s) return '';
    if (s.f.length === 1) return rd(s.f[0].k);
    var o = {}; s.f.forEach(function (f) { o[f.n] = rd(f.k); }); return o;
  }
  function has(svc) { var s = SVC[svc]; return !!s && s.f.every(function (f) { return !!rd(f.k); }); }
  function set(svc, v) {
    var s = SVC[svc]; if (!s) return;
    if (s.f.length === 1) wr(s.f[0].k, typeof v === 'string' ? v.trim() : '');
    else s.f.forEach(function (f) { wr(f.k, v && v[f.n] ? String(v[f.n]).trim() : ''); });
    refresh();
  }
  function clear(svc) {
    var s = SVC[svc]; if (!s) return;
    s.f.forEach(function (f) { if (f.secret || s.f.length === 1) wr(f.k, ''); });   /* 지역·ID처럼 비밀이 아닌 칸은 남김(다시 넣을 때 편하게) */
    refresh();
  }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tail(v) { v = String(v || ''); return v.length > 10 ? esc(v.slice(0, 4)) + '••••••••' + esc(v.slice(-4)) : '••••' + esc(v.slice(-2)); }

  var CSS = '.kbx{font-size:14px;line-height:1.5}.kbx summary{list-style:none;cursor:pointer}.kbx summary::-webkit-details-marker{display:none}'
    + '.kbx .kb-tri::before{content:"";display:inline-block;border-style:solid;border-width:5px 0 5px 7px;border-color:transparent transparent transparent currentColor;margin-right:7px;vertical-align:1px;transition:transform .15s}'
    + '.kbx details[open]>summary.kb-tri::before,.kbx[open]>summary.kb-tri::before{transform:rotate(90deg)}'
    + '.kbx>summary.kb-tri{color:var(--kb-ac,#17766F);font-weight:700;font-size:13.5px;padding:4px 0}'
    + '.kbx .kb-pill{margin-left:6px;padding:1px 8px;border-radius:999px;background:#E6F2EA;color:#1B7F3A;font-size:11px;font-weight:700}'
    + '.kbx .kb-lead{font-size:12px;color:#6B7478;margin:2px 0 4px}'
    + '.kbx .kb-grp{font-size:11.5px;color:#6B7478;margin:10px 0 0;font-weight:600}'
    + '.kbx .kb-svc{border-top:1px solid #E2DDD3;padding:7px 0 5px}'
    + '.kbx .kb-svc>summary{font-weight:600;font-size:13px;display:flex;align-items:baseline;gap:8px;color:inherit}'
    + '.kbx .kb-what{flex:1;font-weight:400;color:#6B7478;font-size:12px}'
    + '.kbx .kb-ok{color:#1B7F3A;font-size:12px;font-weight:700;white-space:nowrap}'
    + '.kbx .kb-in{padding:4px 0 2px 14px}'
    + '.kbx .kb-how{font-size:12px;color:#6B7478;margin-bottom:5px}'
    + '.kbx .kb-how a{color:var(--kb-ac,#17766F);text-decoration:none;border-bottom:1px dotted currentColor;white-space:nowrap}'
    + '.kbx input{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:13px;padding:7px 9px;border:1px solid #CFC9BD;border-radius:8px;background:#fff;color:inherit;margin-top:5px}'
    + '.kbx input:first-of-type{margin-top:0}.kbx input.kb-bad{border-color:#C0473B}'
    + '.kbx .kb-btns{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}'
    /* 단추는 앱의 단추 CSS(#dockMore button 같은 것)에 덮이지 않게 !important */
    + '.kbx .kb-b{font:inherit!important;font-size:12.5px!important;font-weight:600!important;padding:5px 10px!important;margin:0!important;border-radius:8px!important;border:1px solid #CFC9BD!important;background:#fff!important;color:#2B3236!important;cursor:pointer;box-shadow:none!important;min-height:0!important;height:auto!important}'
    + '.kbx .kb-b.kb-p{background:var(--kb-ac,#17766F)!important;border-color:var(--kb-ac,#17766F)!important;color:#fff!important}'
    + '.kbx .kb-b.kb-x{color:#9A3328!important;border-color:#E3C2BD!important}'
    + '.kbx .kb-mask{font-family:ui-monospace,Menlo,monospace;font-size:12.5px;color:#6B7478;word-break:break-all}';
  function css() { if (document.getElementById('kbxCss')) return; var s = document.createElement('style'); s.id = 'kbxCss'; s.textContent = CSS; document.head.appendChild(s); }

  function render(b) {
    var use = b.o.use.filter(function (u) { return SVC[u.svc]; });
    var done = use.filter(function (u) { return has(u.svc); }), todo = use.filter(function (u) { return !has(u.svc); });
    var wasOpen = b.root ? b.root.open : !!b.o.open;
    var openSvc = {}; if (b.root && !b.reset) b.root.querySelectorAll('details.kb-svc[open]').forEach(function (d) { openSvc[d.dataset.svc] = 1; });
    b.reset = false;   /* 저장·지운 뒤에는 처음 꼴로: 기억된 키는 접고, 넣을 키는 첫 것만 펼침 */
    var all = use.length && !todo.length;
    var h = '<summary class="kb-tri">' + (all ? 'AI 키 (선택)' : 'AI 키 넣기 (선택)')
      + (done.length ? ' <span class="kb-pill">' + (all ? '모두 기억됨' : done.length + '개 기억됨') + '</span>' : '') + '</summary>';
    h += '<div class="kb-lead">' + (done.length ? '' : '없어도 앱은 그대로 돼요. ') + '넣은 키는 이 기기·이 브라우저의 다른 차름 앱에서도 저절로 쓰여요.</div>';
    function row(u, isDone, first) {
      var s = SVC[u.svc], op = openSvc[u.svc] ? 1 : b.edit[u.svc] ? 1 : (!isDone && first && !Object.keys(openSvc).length);
      var r = '<details class="kb-svc" data-svc="' + u.svc + '"' + (op ? ' open' : '') + '><summary class="kb-tri">' + esc(s.name)
        + (u.what ? ' <span class="kb-what">' + esc(u.what) + '</span>' : '<span class="kb-what"></span>') + (isDone ? '<span class="kb-ok">✓ 기억됨</span>' : '') + '</summary><div class="kb-in">';
      if (isDone && !b.edit[u.svc]) {
        r += s.f.filter(function (f) { return f.secret; }).map(function (f) { return '<div class="kb-mask">' + tail(rd(f.k)) + '</div>'; }).join('')
          + '<div class="kb-btns"><button type="button" class="kb-b" data-act="edit">바꾸기</button><button type="button" class="kb-b kb-x" data-act="del">지우기</button></div>';
      } else {
        r += '<div class="kb-how">키가 없으면 → <a href="' + GUIDE + s.guide + '" target="_blank" rel="noopener">' + esc(s.name) + ' 키 받는 법 ↗</a></div>'
          + s.f.map(function (f) { return '<input data-f="' + f.n + '" type="' + (f.secret ? 'password' : 'text') + '" autocomplete="off" spellcheck="false" placeholder="' + esc(f.ph) + '" value="' + (f.secret ? '' : esc(rd(f.k))) + '">'; }).join('')
          + '<div class="kb-btns"><button type="button" class="kb-b kb-p" data-act="save">저장</button>'
          + (s.relay && window.KeyRelay ? '<button type="button" class="kb-b" data-act="phone">휴대폰으로 받기</button>' : '')
          + (isDone ? '<button type="button" class="kb-b" data-act="cancel">그대로 두기</button>' : '') + '</div>';
      }
      return r + '</div></details>';
    }
    if (done.length) h += '<div class="kb-grp">기억된 키</div>' + done.map(function (u) { return row(u, true); }).join('');
    if (todo.length) h += '<div class="kb-grp">넣을 키</div>' + todo.map(function (u, i) { return row(u, false, i === 0); }).join('');
    if (!b.root) { b.root = document.createElement('details'); b.root.className = 'kbx'; b.el.appendChild(b.root); }
    b.root.innerHTML = h; b.root.open = wasOpen;
  }
  function fire(b, svc) { b.reset = true; refresh(); if (b.o.onChange) { try { b.o.onChange(svc, has(svc) ? get(svc) : ''); } catch (e) { console.error(e); } } }
  function act(b, e) {
    var t = e.target.closest('[data-act]'); if (!t || !b.root.contains(t)) return;
    e.preventDefault(); e.stopPropagation();
    var d = t.closest('.kb-svc'), svc = d.dataset.svc, s = SVC[svc], a = t.dataset.act;
    if (a === 'edit') { b.edit[svc] = 1; render(b); return; }
    if (a === 'cancel') { delete b.edit[svc]; render(b); return; }
    if (a === 'del') { clear(svc); fire(b, svc); return; }
    if (a === 'phone') {
      var want = {}; want[s.relay] = 1;
      window.KeyRelay.receive({ want: [s.relay], onKeys: function (g) { var v = g && g[s.relay]; if (v) { delete b.edit[svc]; set(svc, String(v).trim()); fire(b, svc); } } });
      return;
    }
    if (a === 'save') {
      var ok = true, v = {};
      s.f.forEach(function (f) {
        var inp = d.querySelector('input[data-f="' + f.n + '"]'), x = inp.value.trim();
        if (f.n === 'region') x = x.toLowerCase();
        var bad = !x || (f.test && !f.test.test(x)); inp.classList.toggle('kb-bad', bad); if (bad) ok = false; v[f.n] = x;
      });
      if (!ok) return;
      delete b.edit[svc]; set(svc, s.f.length === 1 ? v[s.f[0].n] : v); fire(b, svc);
    }
  }
  function mount(el, o) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return null;
    css();
    var b = { el: el, o: o || { use: [] }, root: null, edit: {} };
    boxes.push(b); render(b);
    if (b.o.color) b.root.style.setProperty('--kb-ac', b.o.color);
    b.root.addEventListener('click', function (e) { act(b, e); });
    b.root.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { var s = e.target.closest('.kb-svc').querySelector('[data-act="save"]'); if (s) s.click(); } });
    ['pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach(function (t) { b.root.addEventListener(t, function (e) { e.stopPropagation(); }); });
    return b.root;
  }
  function refresh() { boxes = boxes.filter(function (b) { return b.el.isConnected; }); boxes.forEach(function (b) { if (b.root && !b.root.querySelector('input:focus')) render(b); }); }
  window.addEventListener('storage', function (e) { if (!e.key || /^webapp\./.test(e.key)) refresh(); });
  return { mount: mount, get: get, has: has, set: set, clear: clear, refresh: refresh, services: SVC };
})();
