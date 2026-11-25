/* 차름 공통 모듈: 관리 버튼 모양(adminButton) — 원본은 common/adminButton.js. 앱 안의 <script id="adminButton">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   오른쪽 아래 파란 물방울 버튼(닫혀 있으면 "charum", 관리 메뉴가 열리면 검은 바탕에 "심"), 누르는 동안 도는 고리까지 모양을 한곳에(2026-11-25 선생님 —
   007만 옛 모양이라 글자가 넘치던 것 때문). 다른 모듈과 달리 이것은 모양까지 맡는다(모든 앱이 똑같은 버튼이어야 해서).
   누르는 동작은 adminHold 모듈: 3초 누르기 앱은 AdminButton.hold({...}), 한 번 누르는 앱(004·005·006)은 AdminButton.tap(fn).

   AdminButton.put({ z, open, hide })   — 버튼을 놓을 자리(body 안)에서 부름. 버튼(#adminBtn)을 돌려줌.
     z     z-index(없으면 50)
     open  관리 메뉴가 열려 있는지 () => 참/거짓 (없으면 body에 admin이 붙었을 때) — 열리면 검은 바탕·"심"
     hide  버튼을 숨길 때 () => 참/거짓 (없으면 body에 setup이 붙었을 때 — 처음 설정 화면에는 필요 없음)
   AdminButton.hold({isOpen, canOpen, open, close, ms, holding, bubble})  = AdminHold.bind(버튼, …)
   AdminButton.tap(fn)   한 번 누르면 fn(e) — 눌리는 자리는 AdminHold.pad로 화면 구석까지
   AdminButton.sync()    열림·숨김을 바로 다시 봄(앱이 메뉴를 열고 닫은 바로 뒤에 부르면 0.25초 기다리지 않음) */
window.AdminButton = (function () {
  'use strict';
  var o = { z: 50, open: null, hide: null }, btn = null;
  var CSS = '#adminBtn{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));width:43px;height:43px;border-radius:50%;'
    + 'z-index:var(--ab-z,50);touch-action:none;--p:0;padding:0;margin:0;opacity:.4;transition:opacity .3s;cursor:pointer;display:flex;align-items:center;justify-content:center;'
    + '-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;'
    + 'border:1px solid rgba(14,92,170,.55);'
    + 'background:radial-gradient(ellipse 70% 45% at 50% 88%,rgba(170,245,255,.95),rgba(170,245,255,0) 70%),radial-gradient(circle at 50% 40%,#4FC4F5 0%,#1E8BE0 55%,#0D5FB8 100%);'
    + 'box-shadow:inset 0 -4px 10px rgba(150,240,255,.55),inset 0 3px 6px rgba(0,40,100,.45),0 4px 10px rgba(0,60,130,.35),0 1px 2px rgba(0,30,70,.4)}'
    + '#adminBtn::before{content:"";position:absolute;left:14%;right:14%;top:5%;height:44%;border-radius:50% 50% 45% 45%/60% 60% 40% 40%;'
    + 'background:linear-gradient(to bottom,rgba(255,255,255,.95),rgba(255,255,255,.35) 60%,rgba(255,255,255,.05));pointer-events:none}'
    + '#adminBtn::after{content:"";position:absolute;inset:-5px;border-radius:50%;background:conic-gradient(#22AFBC calc(var(--p)*360deg),transparent 0);'
    + '-webkit-mask:radial-gradient(circle,transparent 22px,#000 23px);mask:radial-gradient(circle,transparent 22px,#000 23px);opacity:.9;pointer-events:none}'
    + '#adminBtn .ab-label{position:relative;display:block;text-align:center;font-family:"Noto Sans KR","Apple SD Gothic Neo",sans-serif;font-weight:700;font-size:8.5px;'
    + 'letter-spacing:.02em;line-height:1;color:#fff;text-shadow:0 1px 1.5px rgba(0,50,110,.65);pointer-events:none;white-space:nowrap}'
    + '#adminBtn.ab-on{opacity:.6;border-color:rgba(10,20,26,.8);'
    + 'background:radial-gradient(ellipse 70% 45% at 50% 88%,rgba(110,230,240,.85),rgba(110,230,240,0) 70%),radial-gradient(circle at 50% 40%,#3D4F5A 0%,#17242C 60%,#05090C 100%);'
    + 'box-shadow:inset 0 -4px 10px rgba(90,220,235,.45),inset 0 3px 6px rgba(0,0,0,.6),0 4px 10px rgba(0,0,0,.4),0 0 0 3px rgba(63,207,210,.35)}'
    + '#adminBtn.ab-on .ab-label{font-family:Jua,"Noto Sans KR",sans-serif;font-weight:400;font-size:17px;letter-spacing:0;color:#9FF3F5;text-shadow:0 0 6px rgba(63,207,210,.7),0 1px 1px rgba(0,0,0,.6)}'
    + '#adminBtn.ab-hide{display:none}'
    + '@media print{#adminBtn{display:none!important}}';
  function isOpen() { try { return o.open ? !!o.open() : document.body.classList.contains('admin'); } catch (e) { return false; } }
  function isHidden() { try { return o.hide ? !!o.hide() : document.body.classList.contains('setup'); } catch (e) { return false; } }
  function sync() {
    if (!btn) return;
    var on = isOpen();
    btn.classList.toggle('ab-on', on);
    btn.classList.toggle('ab-hide', isHidden());
    var t = on ? '심' : 'charum', l = btn.querySelector('.ab-label');
    if (l && l.textContent !== t) l.textContent = t;
  }
  function put(x) {
    for (var k in (x || {})) o[k] = x[k];
    if (!document.getElementById('abStyle')) {
      var st = document.createElement('style'); st.id = 'abStyle'; st.textContent = CSS; document.head.appendChild(st);
    }
    btn = document.getElementById('adminBtn');
    if (!btn) {
      btn = document.createElement('button'); btn.id = 'adminBtn'; btn.type = 'button';
      btn.setAttribute('aria-label', '교사 모드: 3초 동안 누르기');
      btn.innerHTML = '<span class="ab-label" id="abLabel">charum</span>';
      var s = document.currentScript;
      if (s && s.parentNode && s.parentNode !== document.head) s.parentNode.insertBefore(btn, s); else document.body.appendChild(btn);
    }
    btn.style.setProperty('--ab-z', o.z);
    sync(); setInterval(sync, 250);
    return btn;
  }
  function hold(h) {
    var x = {}; for (var k in h) x[k] = h[k];
    var oo = x.open, oc = x.close;
    x.open = function () { var r = oo && oo.apply(this, arguments); sync(); return r; };
    x.close = function () { var r = oc && oc.apply(this, arguments); sync(); return r; };
    window.AdminHold.bind(btn, x);
  }
  function tap(fn) {
    btn.setAttribute('aria-label', '관리');
    window.AdminHold.pad(btn);
    btn.addEventListener('click', function (e) { fn(e); sync(); });
  }
  return { put: put, hold: hold, tap: tap, sync: sync, el: function () { return btn; } };
})();
