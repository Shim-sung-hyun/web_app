/* 차름 공통 모듈: 학생 명단(roster) — 원본은 common/roster.js. 앱 안의 <script id="roster">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   명단은 같은 기기의 모든 차름 앱이 함께 쓴다(webapp.students). 뺀 학생은 webapp.students.out에 뺀 날과 함께 옮긴다.
   뺀 학생의 기록은 KEEP_DAYS(6개월) 동안 남겨 두고, 그동안 같은 이름으로 다시 넣으면 같은 학생으로 되살아나 기록이 이어진다.
   6개월이 지나면 앱마다 Roster.purge(기록)로 그 학생의 줄을 지운다. 빼낸 표시는 다른 앱도 지울 수 있게 3년 동안 남긴다.

   쓰는 법(앱):
     Roster.list()            지금 명단 [{id,name}]
     Roster.nameOf(id)        이름(뺀 학생도)
     Roster.has(id)           지금 명단에 있는지
     Roster.add(이름)         넣은(또는 되살린) 학생을 돌려줌
     Roster.remove(id)        명단에서 뺌(기록은 앱이 6개월 보관)
     Roster.kept()            기록을 보관 중인 뺀 학생 [{id,name,at,until}]
     Roster.purge(log, row=>row.s)   보관 기간이 지난 학생의 줄을 뺀 새 배열
     Roster.mount(칸, {btn, on, input, onChange})   넣기·빼기 화면을 칸 안에 그림
       btn·on·input: 그 앱의 단추·눌림·입력 칸 class(얼굴은 앱마다). onChange({type:'add'|'remove'|'restore', id})
*/
(function () {
  'use strict';
  var KEY = 'webapp.students', OUT = 'webapp.students.out', DAY = 864e5, KEEP_DAYS = 183, MARK_DAYS = 1100;
  function get(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return Array.isArray(v) ? v : d; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function clean(n) { return String(n || '').trim().replace(/\s+/g, ' ').slice(0, 20); }
  function newId() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function list() { return get(KEY, []).filter(function (s) { return s && s.id && s.name; }); }
  function outs() {
    var now = Date.now(), all = get(OUT, []), live = all.filter(function (o) { return o && o.id && now - (o.at || 0) < MARK_DAYS * DAY; });
    if (live.length !== all.length) put(OUT, live);
    return live;
  }
  function kept() {
    var now = Date.now(), ids = {};
    list().forEach(function (s) { ids[s.id] = 1; });
    return outs().filter(function (o) { return !ids[o.id] && now - o.at < KEEP_DAYS * DAY; })
      .map(function (o) { return { id: o.id, name: o.name, at: o.at, until: o.at + KEEP_DAYS * DAY }; });
  }
  function nameOf(id) {
    var s = list().filter(function (x) { return x.id === id; })[0] || outs().filter(function (x) { return x.id === id; })[0];
    return s ? s.name : '';
  }
  function has(id) { return list().some(function (s) { return s.id === id; }); }
  function add(name) {
    var n = clean(name); if (!n) return null;
    var L = list(), same = L.filter(function (s) { return s.name === n; })[0];
    if (same) return same;
    var back = kept().filter(function (o) { return o.name === n; }).sort(function (a, b) { return b.at - a.at; })[0];
    var st = back ? { id: back.id, name: n } : { id: newId(), name: n };
    L.push(st); put(KEY, L);
    if (back) put(OUT, outs().filter(function (o) { return o.id !== back.id; }));
    return st;
  }
  function remove(id) {
    var L = list(), st = L.filter(function (s) { return s.id === id; })[0]; if (!st) return;
    put(KEY, L.filter(function (s) { return s.id !== id; }));
    put(OUT, outs().filter(function (o) { return o.id !== id; }).concat([{ id: st.id, name: st.name, at: Date.now() }]));
  }
  function purge(log, idOf) {
    if (!Array.isArray(log)) return log;
    var now = Date.now(), gone = {};
    outs().forEach(function (o) { if (now - o.at >= KEEP_DAYS * DAY) gone[o.id] = 1; });
    list().forEach(function (s) { delete gone[s.id]; });
    return log.filter(function (r) { return !gone[idOf ? idOf(r) : r.s]; });
  }
  function md(t) { var d = new Date(t); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }

  /* 기본 꼴: 자리·간격만. 색·글꼴·둥글기는 앱의 단추 class와 CSS 변수(--rs-line, --rs-soft)로 앱마다 */
  var CSS = ':where(.rs){display:grid;gap:10px;margin-top:10px}'
    + ':where(.rs-add){display:flex;gap:8px;flex-wrap:wrap}'
    + ':where(.rs-add input){flex:1;min-width:140px;max-width:260px}'
    + ':where(.rs-names){display:flex;flex-wrap:wrap;gap:6px 8px;margin:0;padding:0;list-style:none}'
    + ':where(.rs-names li){display:inline-flex;align-items:center;gap:2px;padding:2px 2px 2px 12px;border:1.5px solid var(--rs-line,#d6d2cb);border-radius:999px;min-height:40px}'
    + ':where(.rs-x){border:0;background:none;font:inherit;font-size:20px;line-height:1;width:40px;height:40px;border-radius:50%;cursor:pointer;color:inherit;opacity:.55}'
    + ':where(.rs-x:hover,.rs-x:focus-visible){opacity:1;background:var(--rs-soft,rgba(0,0,0,.06))}'
    + ':where(.rs-none,.rs-out){font-size:14px;opacity:.8;margin:0}'
    + ':where(.rs-out summary){cursor:pointer}'
    + ':where(.rs-out ul){margin:6px 0 0;padding:0;list-style:none;display:grid;gap:6px}'
    + ':where(.rs-out li){display:flex;align-items:center;gap:10px;flex-wrap:wrap}';
  function style() {
    if (document.getElementById('rsStyle')) return;
    var s = document.createElement('style'); s.id = 'rsStyle'; s.textContent = CSS;
    (document.head || document.documentElement).insertBefore(s, (document.head || document.documentElement).firstChild);
  }

  function mount(box, opt) {
    opt = opt || {}; style();
    var btn = opt.btn || '', on = opt.on || '', inp = opt.input || '', tell = opt.onChange || function () {};
    function draw() {
      var L = list(), K = kept(), h = '<div class="rs">';
      h += '<div class="rs-add"><input class="' + inp + '" maxlength="20" placeholder="학생 이름" aria-label="넣을 학생 이름" autocomplete="off">'
        + '<button type="button" class="' + btn + ' ' + on + '" data-rs="add">넣기</button></div>';
      h += L.length ? '<ul class="rs-names">' + L.map(function (s) {
        return '<li><span>' + esc(s.name) + '</span><button type="button" class="rs-x" data-rs="del" data-id="' + esc(s.id) + '" aria-label="' + esc(s.name) + ' 빼기">×</button></li>';
      }).join('') + '</ul>' : '<p class="rs-none">아직 넣은 학생이 없어요.</p>';
      if (K.length) h += '<details class="rs-out"><summary>뺀 학생 ' + K.length + '명 — 기록은 보관 중</summary><ul>' + K.map(function (o) {
        return '<li><span>' + esc(o.name) + ' · ' + md(o.until) + '까지 보관</span><button type="button" class="' + btn + '" data-rs="back" data-id="' + esc(o.id) + '">다시 넣기</button></li>';
      }).join('') + '</ul></details>';
      box.innerHTML = h + '</div>';
      var input = box.querySelector('input');
      function doAdd() { var st = add(input.value); if (!st) { input.focus(); return; } draw(); tell({ type: 'add', id: st.id }); }
      box.querySelector('[data-rs=add]').onclick = doAdd;
      input.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } };
      Array.prototype.forEach.call(box.querySelectorAll('[data-rs=del]'), function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-id'), n = nameOf(id);
          if (!confirm(n + ' 학생을 명단에서 뺄까요?\n\n이 기기의 다른 차름 앱 명단에서도 함께 빠져요.\n기록은 6개월 동안 남아 있다가, 그동안 다시 넣지 않으면 지워져요.')) return;
          remove(id); draw(); tell({ type: 'remove', id: id });
        };
      });
      Array.prototype.forEach.call(box.querySelectorAll('[data-rs=back]'), function (b) {
        b.onclick = function () { var st = add(nameOf(b.getAttribute('data-id'))); draw(); if (st) tell({ type: 'restore', id: st.id }); };
      });
    }
    draw();
    return { refresh: draw, focus: function () { var i = box.querySelector('input'); if (i) i.focus(); } };
  }

  window.Roster = { list: list, nameOf: nameOf, has: has, add: add, remove: remove, kept: kept, purge: purge, mount: mount, KEEP_DAYS: KEEP_DAYS };
})();
