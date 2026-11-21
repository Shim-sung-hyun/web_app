/* 차름 공통 모듈: 차름 홈페이지 링크(homeLink) — 원본은 common/homeLink.js. 앱 안의 <script id="homeLink">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   선생님 화면(처음 설정 화면·학습 중 관리 메뉴)에서만 왼쪽 위에 차름 로고를 작게 두고, 누르면 charum.org가 새 탭으로 열림(수업 화면은 그대로).
   언제 보일지는 앱이 정함: HomeLink.when(() => 참/거짓). 정하지 않으면 body에 setup 또는 admin이 붙었을 때.
   자리를 옮길 앱만 HomeLink.at(왼쪽px, 위px) — 위 메뉴 줄이 왼쪽 끝까지 닿는 앱(004·006)은 그 아래로.
   휴대폰처럼 좁으면(600px 이하) 제목과 겹치지 않게 왼쪽 아래 💬 단추 위로 내려감. 좁아도 위에 둘 앱(012처럼 위를 비워 둔 앱)은 HomeLink.keepTop(). 2026-11-21 */
window.HomeLink = (function () {
  var URL = 'https://www.charum.org/';
  var LOGO = 'https://www.charum.org/files/attach/images/59600/cdff757386e72b62ba5fb17ea83df99e.png';
  var st = document.createElement('style');
  st.textContent = '#chHome{position:fixed;left:var(--hl-left,14px);top:var(--hl-top,12px);z-index:2147480000;display:none;align-items:center;line-height:0;padding:4px;border-radius:8px;text-decoration:none;opacity:.88;transition:opacity .15s}'
    + '#chHome.on{display:inline-flex}#chHome:hover,#chHome:focus-visible{opacity:1}#chHome:focus-visible{outline:2px solid currentColor;outline-offset:2px}'
    + '#chHome img{height:30px;width:auto;display:block}'
    + '#chHome .hlTxt{display:none;font:700 14px/1 "Noto Sans KR","Apple SD Gothic Neo",sans-serif;color:#555;letter-spacing:.02em}'
    + '#chHome.noimg img{display:none}#chHome.noimg .hlTxt{display:inline}'
    + '@media (max-width:600px){#chHome img{height:22px}#chHome:not(.top){top:auto;bottom:60px;left:12px;background:rgba(255,255,255,.85)}}@media print{#chHome{display:none!important}}';
  document.head.appendChild(st);
  var show = function () { var c = document.body.classList; return c.contains('setup') || c.contains('admin'); };
  function make() {
    if (document.getElementById('chHome')) return;
    var a = document.createElement('a'); a.id = 'chHome'; a.href = URL; a.target = '_blank'; a.rel = 'noopener';
    a.title = '차름 홈페이지(charum.org) — 새 탭으로 열려요'; a.setAttribute('aria-label', '차름 홈페이지 charum.org');
    var img = new Image(); img.alt = ''; img.src = LOGO; img.onerror = function () { a.classList.add('noimg'); };
    var t = document.createElement('span'); t.className = 'hlTxt'; t.textContent = 'charum.org';
    a.appendChild(img); a.appendChild(t); document.body.appendChild(a);
  }
  function tick() { make(); var a = document.getElementById('chHome'); if (!a) return; var on = false; try { on = !!show(); } catch (e) {} a.classList.toggle('on', on); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  setInterval(tick, 700);
  return {
    when: function (fn) { show = fn; tick(); },
    keepTop: function () { make(); document.getElementById('chHome').classList.add('top'); },
    at: function (left, top) { var r = document.documentElement.style; if (left != null) r.setProperty('--hl-left', left + 'px'); if (top != null) r.setProperty('--hl-top', top + 'px'); }
  };
})();
