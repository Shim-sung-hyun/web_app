/* 차름 공통 모듈: 오류·의견 알리기(reportLink) — 원본은 common/reportLink.js. 앱 안의 <script id="reportLink">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   선생님 화면(설정·관리 메뉴)에서만 왼쪽 아래에 작게 "💬 오류·의견 알리기". 누르면 차름 게시판 이 앱 글의 댓글 칸이 새 탭으로(로그인 없이 댓글 가능).
   휴대폰처럼 좁으면 💬 동그라미만. 수업 끝내기(endLesson)와 같은 왼쪽 아래 묶음(#chCorner)에 들어가 서로 겹치지 않음(맨 아래가 이것).
   앱이 넘겨 줌: ReportLink.set({ board: 'https://www.charum.org/webapp/59784', color: '#17766F', when: () => 참/거짓 })
     board  이 앱 게시판 글 주소(없으면 게시판 목록)      color  앱 영역 색(글자·테두리)
     when   언제 보일지(없으면 body에 setup 또는 admin이 붙었을 때)   2026-10-22 처음, 2026-11-25 모듈로 */
window.ReportLink = (function () {
  var o = { board: 'https://www.charum.org/webapp', color: '#4E6A80', when: null };
  var css = document.createElement('style');
  css.textContent = '#chCorner{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147480001;display:flex;flex-direction:column-reverse;align-items:flex-start;gap:8px;pointer-events:none}'
    + '#chCorner>*{pointer-events:auto}'
    + '#reportBtn{display:none;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.92);border:1px solid var(--rb-c55);color:var(--rb-c);font:600 13px/1.2 "Noto Sans KR","Apple SD Gothic Neo",sans-serif;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.08);cursor:pointer}'
    + '#reportBtn:hover{background:#fff;border-color:var(--rb-c)}#reportBtn.on{display:inline-flex}'
    + '@media (max-width:600px){#reportBtn{width:40px;height:40px;padding:0;justify-content:center;font-size:18px}#reportBtn .rbTxt{display:none}}'
    + '@media print{#chCorner{display:none!important}}';
  document.head.appendChild(css);
  function corner() {
    var c = document.getElementById('chCorner');
    if (!c) { c = document.createElement('div'); c.id = 'chCorner'; document.body.appendChild(c); }
    return c;
  }
  function url() { return o.board + (/\/\d+$/.test(o.board) ? '#write' : ''); }
  function make() {
    var a = document.getElementById('reportBtn'); if (a) return a;
    a = document.createElement('a'); a.id = 'reportBtn'; a.target = '_blank'; a.rel = 'noopener'; a.title = '이 앱의 오류나 의견을 게시판 댓글로 남겨요';
    a.setAttribute('aria-label', '오류·의견 알리기'); a.innerHTML = '<span aria-hidden="true">💬</span><span class="rbTxt">오류·의견 알리기</span>';
    var c = corner(); c.insertBefore(a, c.firstChild);   /* column-reverse: 첫 자식이 맨 아래 */
    return a;
  }
  function show() {
    try { if (o.when) return !!o.when(); var c = document.body.classList; return c.contains('setup') || c.contains('admin'); } catch (e) { return false; }
  }
  function tick() {
    if (!document.body) return;
    var a = make(); a.href = url();
    a.style.setProperty('--rb-c', o.color); a.style.setProperty('--rb-c55', o.color + '55');
    a.classList.toggle('on', show());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  setInterval(tick, 700);
  return {
    set: function (x) { for (var k in x) o[k] = x[k]; tick(); },
    corner: corner
  };
})();
