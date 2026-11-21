/* 차름 공통 모듈: 차름 홈페이지 링크(homeLink) — 원본은 common/homeLink.js. 앱 안의 <script id="homeLink">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   선생님 화면(처음 설정 화면·학습 중 관리 메뉴)에서만 차름 로고를 두고, 누르면 charum.org가 새 탭으로 열림(수업 화면은 그대로).
   - 처음 설정 화면: HomeLink.setup('첫 카드 선택자') — 첫 카드(①)의 왼쪽 위 모서리 바로 위에 붙음(제목 아래 줄과 같은 높이).
     그 자리에 글자(설명 줄)가 겹치면(휴대폰처럼 좁을 때) 로고가 한 줄을 차지하고 카드가 그만큼 내려감.
   - 학습 중 관리 메뉴: 화면 왼쪽 위에 고정. HomeLink.bar('위 메뉴 줄 선택자', …) — 그 줄이 로고와 겹치면(좁은 화면) 로고가 맨 위,
     메뉴 줄은 로고 아래로 내려감(아래쪽에서 수업 끝내기·오류 알리기가 맨 아래, 메뉴가 그 위로 올라가는 것과 같은 짜임).
   - 언제 보일지는 앱이 정함: HomeLink.when(() => 참/거짓). 정하지 않으면 body에 setup 또는 admin이 붙었을 때.
     setup() 카드가 보이는 동안에는 고정 로고 대신 카드 위 로고가 나옴.
   - 고정 로고 자리를 옮길 앱만 HomeLink.at(왼쪽px, 위px)(004·006: 왼쪽 끝까지 닿는 위 메뉴 줄 아래). 2026-11-21 */
window.HomeLink = (function () {
  var URL = 'https://www.charum.org/';
  var LOGO = 'https://www.charum.org/files/attach/images/59600/cdff757386e72b62ba5fb17ea83df99e.png';
  var st = document.createElement('style');
  st.textContent = '.chHomeA{display:inline-flex;align-items:center;line-height:0;padding:4px;border-radius:8px;text-decoration:none;opacity:.9;transition:opacity .15s}'
    + '.chHomeA:hover,.chHomeA:focus-visible{opacity:1}.chHomeA:focus-visible{outline:2px solid currentColor;outline-offset:2px}'
    + '.chHomeA img{height:30px;width:auto;display:block}'
    + '.chHomeA .hlTxt{display:none;font:700 14px/1 "Noto Sans KR","Apple SD Gothic Neo",sans-serif;color:#555;letter-spacing:.02em}'
    + '.chHomeA.noimg img{display:none}.chHomeA.noimg .hlTxt{display:inline;line-height:22px}'
    + '#chHome{position:fixed;left:var(--hl-left,14px);top:var(--hl-top,12px);z-index:2147480000;display:none}#chHome.on{display:inline-flex}'
    + '.chHomeSlot{position:relative;height:0;margin:0}.chHomeSlot .chHomeA{position:absolute;left:-4px;bottom:6px}'
    + '.chHomeSlot.flow{height:auto;margin:0 0 6px}.chHomeSlot.flow .chHomeA{position:static;margin-left:-4px}'
    + '@media (max-width:600px){.chHomeA img{height:24px}}@media print{#chHome,.chHomeSlot{display:none!important}}';
  document.head.appendChild(st);
  var show = function () { var c = document.body.classList; return c.contains('setup') || c.contains('admin'); };
  var setupSel = null, bars = [];
  function link(id) {
    var a = document.createElement('a'); if (id) a.id = id; a.className = 'chHomeA'; a.href = URL; a.target = '_blank'; a.rel = 'noopener';
    a.title = '차름 홈페이지(charum.org) — 새 탭으로 열려요'; a.setAttribute('aria-label', '차름 홈페이지 charum.org');
    var img = new Image(); img.alt = ''; img.src = LOGO; img.onerror = function () { a.classList.add('noimg'); };
    img.onload = function () { tick(); };
    var t = document.createElement('span'); t.className = 'hlTxt'; t.textContent = 'charum.org';
    a.appendChild(img); a.appendChild(t); return a;
  }
  function make() { if (!document.getElementById('chHome')) document.body.appendChild(link('chHome')); }
  function visible(el) { if (!el || !el.isConnected) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }
  function hit(a, b) { return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; }
  /* 처음 설정 화면: 첫 카드 바로 위에 로고 자리(높이 0)를 두고, 글자와 겹치면 한 줄을 차지하게 */
  function placeSetup() {
    var card = setupSel && document.querySelector(setupSel);
    var on = false; try { on = !!show(); } catch (e) {}
    var slot = document.querySelector('.chHomeSlot');
    if (!card || !visible(card) || !on) { if (slot) slot.style.display = 'none'; return false; }
    if (!slot || slot.nextElementSibling !== card) {
      if (slot) slot.remove();
      slot = document.createElement('div'); slot.className = 'chHomeSlot'; slot.appendChild(link());
      card.parentNode.insertBefore(slot, card);
    }
    slot.style.display = '';
    slot.classList.remove('flow');
    var a = slot.firstChild, ar = a.getBoundingClientRect(), pad = { left: ar.left - 2, right: ar.right + 2, top: ar.top - 2, bottom: ar.bottom + 2 };
    /* 카드 앞에 있는 글자·그림만 봄(글 상자 전체가 아니라 실제 글줄) */
    var box = card.parentNode, over = false, rg = document.createRange(), n;
    var before = function (x) { return !!(x.compareDocumentPosition(slot) & 4); };
    var tw = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    while (!over && (n = tw.nextNode())) {
      if (!before(n)) break;
      if (!n.nodeValue.trim()) continue;
      rg.selectNodeContents(n); var rs = rg.getClientRects();
      for (var i = 0; i < rs.length && !over; i++) if (rs[i].width > 1 && hit(pad, rs[i])) over = true;
    }
    if (!over) box.querySelectorAll('img,svg,canvas,button,input,select').forEach(function (x) { if (!over && before(x) && !x.closest('.chHomeSlot') && hit(pad, x.getBoundingClientRect())) over = true; });
    if (!over && ar.top < 0) over = true;
    slot.classList.toggle('flow', over);
    return true;
  }
  /* 관리 메뉴: 위 메뉴 줄이 고정 로고와 겹치면 로고 아래로 내림 */
  function pushBars(a, on) {
    var lr = on ? a.getBoundingClientRect() : null;
    bars.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        var fixed = /fixed|absolute|sticky/.test(getComputedStyle(el).position), was = +(el.dataset.hlPush || 0), need = 0;
        if (lr && visible(el)) {
          var r = el.getBoundingClientRect(), top = r.top - (fixed ? was : 0), bot = r.bottom - (fixed ? was : 0);
          if (r.left < lr.right + 6 && r.right > lr.left && top < lr.bottom + 4 && bot > lr.top) need = Math.ceil(lr.bottom + 6 - top);
        }
        if (need === was) return;
        if (fixed) el.style.translate = need ? '0 ' + need + 'px' : '';
        else el.style.marginTop = need ? need + 'px' : '';
        if (need) el.dataset.hlPush = need; else delete el.dataset.hlPush;
      });
    });
  }
  function tick() {
    make(); var a = document.getElementById('chHome'); if (!a) return;
    var on = false; try { on = !!show(); } catch (e) {}
    var inSetup = placeSetup();
    on = on && !inSetup;
    a.classList.toggle('on', on);
    pushBars(a, on);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  setInterval(tick, 400);
  addEventListener('resize', tick);
  return {
    when: function (fn) { show = fn; tick(); },
    setup: function (sel) { setupSel = sel; tick(); },
    bar: function () { bars = bars.concat([].slice.call(arguments)); tick(); },
    keepTop: function () {},
    at: function (left, top) { var r = document.documentElement.style; if (left != null) r.setProperty('--hl-left', left + 'px'); if (top != null) r.setProperty('--hl-top', top + 'px'); }
  };
})();
