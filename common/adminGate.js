/* 차름 공통 모듈: 관리 버튼 — 왼쪽 위 점(adminGate). 원본은 common/adminGate.js. 앱 안의 <script id="adminGate">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다. */
/* 관리 메뉴 열기 2단계: 관리 버튼을 3초 누른 뒤, 왼쪽 위에 3초 동안 나타나는 작은 점을 눌러야 열림(학생이 보고 따라 하기 어렵게) */
window.AdminGate = (function () {
  const st = document.createElement('style');
  st.textContent = '#agDot{position:fixed;left:18px;top:18px;width:62px;height:62px;border-radius:50%;z-index:2147483600;display:none;cursor:pointer;touch-action:none;'
    + 'background:radial-gradient(circle at 50% 38%,rgba(210,252,253,.9),rgba(120,225,232,.55) 60%,rgba(70,190,205,.4));border:2px solid rgba(34,175,188,.75);box-shadow:0 0 10px rgba(120,225,232,.6)}'
    + '#agDot svg{position:absolute;left:50%;top:50%;width:74px;height:74px;transform:translate(-50%,-50%) rotate(-90deg);pointer-events:none}'
    + '#agDot circle{fill:none;stroke:#22AFBC;stroke-width:4;stroke-linecap:round}';
  document.head.appendChild(st);
  const dot = document.createElement('div'); dot.id = 'agDot'; dot.setAttribute('aria-label', '관리 열기');
  dot.innerHTML = '<svg viewBox="0 0 74 74"><circle cx="37" cy="37" r="34"/></svg>';
  document.body.appendChild(dot);
  const ring = dot.querySelector('circle'), L = 2 * Math.PI * 34;
  ring.style.strokeDasharray = L;
  let cb = null, t0 = 0, raf = 0, WAIT = 3000;
  const hide = () => { dot.style.display = 'none'; cancelAnimationFrame(raf); cb = null; };
  const tick = () => { const p = (performance.now() - t0) / WAIT; if (p >= 1 || !cb) return hide(); ring.style.strokeDashoffset = L * p; raf = requestAnimationFrame(tick); };
  let armed = false;
  dot.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!cb) return; armed = true; cancelAnimationFrame(raf); try { dot.setPointerCapture(e.pointerId); } catch (x) {} });
  const done = e => { e.preventDefault(); e.stopPropagation(); if (!armed) return; armed = false; const f = cb; cb = null; setTimeout(() => { dot.style.display = 'none'; }, 60); if (f) f(); };
  dot.addEventListener('pointerup', done); dot.addEventListener('pointercancel', done);   /* 전자칠판은 손을 뗄 때 pointercancel이 오기도 함 */
  dot.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
  return { ask(fn) { cb = fn; t0 = performance.now(); ring.style.strokeDashoffset = 0; dot.style.display = 'block'; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }, cancel: hide };
})();
