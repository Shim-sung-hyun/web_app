/* 차름 공통 모듈: 관리 버튼 — 누르는 동안 표시(holdBubble). 원본은 common/holdBubble.js. 앱 안의 <script id="holdBubble">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다. */
/* 관리 버튼을 3초 누르는 동안: (휴대폰·태블릿을 손가락으로 누를 때만) 버튼 조금 위(손가락에 가리지 않는 곳)에 투명한 아쿠아 원이 1초에 한 번씩 부드럽게 세 번 깜빡. 전자칠판·PC는 버튼 둘레 고리만. 손을 떼면 바로 사라짐 */
(function(){
  const btn = document.querySelector('#adminBtn, #aqua'); if (!btn) return;
  const st = document.createElement('style');
  st.textContent = '.hb-dot{position:fixed;width:40px;height:40px;border-radius:50%;pointer-events:none;z-index:2147483000;opacity:0;'
    + 'background:radial-gradient(circle at 50% 40%,rgba(200,250,252,.75),rgba(120,225,232,.35) 60%,rgba(80,200,210,.2));'
    + 'border:1.5px solid rgba(70,185,200,.55);box-shadow:0 0 10px rgba(130,230,238,.55)}';
  document.head.appendChild(st);
  const dot = document.createElement('div'); dot.className = 'hb-dot'; document.body.appendChild(dot);
  let down = false, raf = 0, useDot = false;
  const mobileOS = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const prog = () => { const v = getComputedStyle(btn).getPropertyValue('--p').trim(); const n = parseFloat(v) || 0; return /%$/.test(v) ? n / 100 : n; };
  const hide = () => { dot.style.opacity = 0; btn.style.opacity = ''; };
  const loop = () => {
    const p = prog();
    if (down && p > 0.01 && p < 1) {
      const r = btn.getBoundingClientRect(), S = 40;
      dot.style.left = Math.max(4, Math.min(innerWidth - S - 4, r.left + r.width / 2 - S / 2)) + 'px';
      dot.style.top = Math.max(4, r.top - S - 34) + 'px';
      btn.style.opacity = '.75';
      if (!useDot) return void (raf = requestAnimationFrame(loop));
      dot.style.opacity = (0.9 * Math.sin(Math.PI * ((p * 3) % 1))).toFixed(3);   /* 1초마다 한 번: 천천히 나타났다 사라짐 */
    } else hide();
    if (down) raf = requestAnimationFrame(loop); else hide();
  };
  btn.addEventListener('pointerdown', e => { useDot = e.pointerType !== 'mouse' && (mobileOS || Math.min(screen.width, screen.height) < 1040); down = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }, true);
  const up = () => { down = false; cancelAnimationFrame(raf); hide(); };
  ['pointerup', 'pointercancel', 'blur'].forEach(t => addEventListener(t, up, true));
})();
