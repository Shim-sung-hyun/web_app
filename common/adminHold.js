/* 차름 공통 모듈: 관리 버튼 누르기(adminHold) — 원본은 common/adminHold.js. 앱 안의 <script id="adminHold">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   버튼의 모양·색·자리는 앱마다(CSS), 누르는 동작만 여기서 한곳에.

   AdminHold.pad(버튼)
     눌리는 자리를 넓힘: 버튼에서 화면 구석까지, 안쪽으로도 조금(보이는 것은 그대로).
     전자칠판은 화면 가장자리의 터치를 조금 어긋나게 잡아서 작은 버튼(43px)이 "눌러도 반응 없음"이 되곤 함(2026-11-11 선생님).
   AdminHold.bind(버튼, {isOpen, canOpen, open, close, ms, unit, holding, bubble})
     닫혀 있을 때: ms(3초) 동안 누르면 AdminGate.ask(open) — 왼쪽 위 점을 눌러야 열림.
     열려 있을 때: 한 번 누르면 close().
     isOpen()  관리 메뉴가 열려 있는지          canOpen()  지금 열어도 되는지(없으면 늘 됨)
     unit      고리 진행(--p)을 적는 꼴: ''(0~1) 또는 '%'   holding  누르는 동안 버튼에 붙일 class
     bubble    true면 이벤트를 위로 흘려보냄(앱이 화면 전체에서 듣는 것이 있을 때)
     누르는 동안 터치가 아주 잠깐(GRACE) 끊겨도 처음으로 돌아가지 않고 이어짐(칠판이 긴 누름을 잠깐 놓칠 때). */
window.AdminHold = (function () {
  'use strict';
  var GRACE = 250;
  function pad(btn) {
    if (!btn || btn.querySelector('.ah-pad')) return;
    if (!document.getElementById('ahStyle')) {
      var st = document.createElement('style'); st.id = 'ahStyle';
      st.textContent = '.ah-pad{position:absolute;left:-16px;top:-16px;right:-60px;bottom:-60px;border-radius:0;background:transparent}';
      document.head.appendChild(st);
    }
    var p = document.createElement('span'); p.className = 'ah-pad'; p.setAttribute('aria-hidden', 'true'); p.style.pointerEvents = 'auto';
    btn.insertBefore(p, btn.firstChild);
  }
  function bind(btn, o) {
    o = o || {}; pad(btn);
    var MS = o.ms || 3000, unit = o.unit || '', raf = 0, t0 = 0, on = false, lost = 0, justOpened = false, ignoreUntil = 0;
    function setP(p) { btn.style.setProperty('--p', unit === '%' ? (p * 100) + '%' : p); }
    function stop() { on = false; clearTimeout(lost); lost = 0; cancelAnimationFrame(raf); setP(0); if (o.holding) btn.classList.remove(o.holding); }
    function tick() {
      if (!on) return;
      var p = Math.min(1, (performance.now() - t0) / MS); setP(p);
      if (p >= 1) { stop(); justOpened = true; window.AdminGate.ask(o.open); return; }
      raf = requestAnimationFrame(tick);
    }
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault(); if (!o.bubble) e.stopPropagation();
      if (o.isOpen()) return;                       /* 닫기는 click에서 바로 */
      if (o.canOpen && !o.canOpen()) return;
      try { btn.setPointerCapture(e.pointerId); } catch (x) {}
      if (on && lost) { clearTimeout(lost); lost = 0; return; }   /* 잠깐 끊겼다 다시 닿음 — 이어서 */
      on = true; t0 = performance.now(); if (o.holding) btn.classList.add(o.holding);
      cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
      btn.addEventListener(ev, function () {
        if (justOpened) { justOpened = false; ignoreUntil = performance.now() + 500; }
        if (on && !lost) lost = setTimeout(stop, GRACE);
      });
    });
    btn.addEventListener('click', function (e) {
      if (!o.bubble) e.stopPropagation();
      if (performance.now() < ignoreUntil) return;  /* 3초 눌러 연 직후 손을 뗄 때 생기는 click은 무시 */
      if (o.isOpen()) o.close();
    });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    return { cancel: stop };
  }
  return { pad: pad, bind: bind };
})();
