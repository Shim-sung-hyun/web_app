/* 차름 공통 모듈: 멈춘 곳(spot) — 원본은 common/spot.js. 앱 안의 <script id="spot">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   학생마다(학생을 고르지 않으면 '_') 하던 자리를 기기에 저장해, 창을 닫아도 그 학생을 고르면 "멈춘 곳: … [이어 하기] [멈춘 곳 지우기]".
   무엇을 저장할지(묶음·단계·차례)는 앱이 정함. 저장 칸 이름은 앱마다 그대로(옮겨도 예전 멈춘 곳이 이어짐) — 2026-11-25 모듈로.
   const SP = Spot.open('animalHome.resume')   localStorage 칸 이름
     SP.all          학생 → 저장한 것(객체, 앱이 바로 고쳐도 됨)      SP.save()     SP.all을 기기에 씀
     SP.get(누구)    SP.set(누구, 저장할 것)    SP.del(누구)          SP.load()     기기에서 다시 읽음(다른 창에서 바뀌었을 때)
   Spot.bar(넣을 곳, '멈춘 곳 뒤에 붙일 글(HTML)', 이어 하기 할 일, 지우기 할 일)
     → <div class="resume">멈춘 곳: … <button class="chip sm on" id="rsGo">이어 하기</button><button class="chip sm" id="rsDel">멈춘 곳 지우기</button></div>
       모양(.resume·.chip)은 앱 CSS 그대로 */
window.Spot = (function () {
  'use strict';
  function read(k) { try { var v = JSON.parse(localStorage.getItem(k) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function open(key) {
    var sp = {
      all: read(key),
      load: function () { sp.all = read(key); return sp.all; },
      save: function () { try { localStorage.setItem(key, JSON.stringify(sp.all)); } catch (e) {} },
      get: function (who) { return sp.all[who || '_'] || null; },
      set: function (who, o) { sp.all[who || '_'] = o; sp.save(); },
      del: function (who) { delete sp.all[who || '_']; sp.save(); }
    };
    return sp;
  }
  function bar(el, html, go, del) {
    el.innerHTML = '<div class="resume">멈춘 곳: ' + html + ' <button class="chip sm on" id="rsGo" type="button">이어 하기</button><button class="chip sm" id="rsDel" type="button">멈춘 곳 지우기</button></div>';
    el.querySelector('#rsGo').onclick = go;
    el.querySelector('#rsDel').onclick = del;
  }
  return { open: open, bar: bar };
})();
