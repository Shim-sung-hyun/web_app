/* 차름 공통 모듈: 진행 표시(progBar) — 원본은 common/progBar.js. 앱 안의 <script id="progBar">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   지침 3절: 학생 화면 맨 위 가운데, 숫자 없이 칸 막대(10칸 넘으면 이어진 막대). 칸·막대를 짜는 일만 여기서, 색·크기·자리는 앱 CSS 그대로(2026-11-25).
   ProgBar.draw(넣을 곳, 모두, 한 것, 고를 것)
     모두 ≤ max(10)이면 칸: <i class="d">(한 것) <i class="n">(지금) <i>(남은 것)
     넘으면 이어진 막대: <b style="width:…%">  — 같은 막대를 다시 그리면 너비만 바꿈(부드럽게 늘어나게)
   고를 것: tag 칸 태그('i')  done 한 칸 class('d')  now 지금 칸 class('n')  wrap 칸을 감쌀 span class('')
            max 칸으로 그릴 최대(10, Infinity면 늘 칸)  bar 막대 틀(HTML, 안쪽 너비 줄 자리에 %W — 없으면 '<b style="width:%W%"></b>')
            pct 막대 너비(없으면 (한 것+next)/모두)  next 지금 칸까지 채움(true/false)  min 막대 최소 너비%(0)
            cellsClass / barClass  칸·막대일 때 넣을 곳에 붙일 class(주지 않으면 그대로) */
window.ProgBar = (function () {
  'use strict';
  function draw(el, n, k, o) {
    o = o || {};
    if (!el) return;
    var max = o.max == null ? 10 : o.max;
    if (n <= max) {
      var tag = o.tag || 'i', dn = o.done == null ? 'd' : o.done, nw = o.now == null ? 'n' : o.now, h = '';
      for (var i = 0; i < n; i++) h += '<' + tag + (i < k ? ' class="' + dn + '"' : i === k ? ' class="' + nw + '"' : '') + '></' + tag + '>';
      el.innerHTML = o.wrap ? '<span class="' + o.wrap + '">' + h + '</span>' : h;
      if (o.cellsClass != null) el.className = o.cellsClass;
      el.removeAttribute('data-pg');
      return 'cells';
    }
    var p = o.pct != null ? o.pct : (k + (o.next ? 1 : 0)) / Math.max(1, n) * 100;
    p = Math.max(o.min || 0, Math.min(100, Math.round(p)));
    var tpl = o.bar || '<b style="width:%W%"></b>';
    if (o.barClass != null) el.className = o.barClass;
    if (el.getAttribute('data-pg') === tpl) {
      var w = el.querySelector('[style*="width"]');
      if (w) { w.style.width = p + '%'; return 'bar'; }
    }
    el.innerHTML = tpl.replace('%W', p);
    el.setAttribute('data-pg', tpl);
    return 'bar';
  }
  return { draw: draw };
})();
