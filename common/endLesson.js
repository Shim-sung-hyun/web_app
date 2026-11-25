/* 차름 공통 모듈: 수업 끝내기(endLesson) — 원본은 common/endLesson.js. 앱 안의 <script id="endLesson">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   전자칠판엔 Esc가 없음 → 관리 메뉴를 열면 전체 화면에서 나오고(잠깐 나가기),
   관리 메뉴에 있는 동안 왼쪽 아래 "⏻ 수업 끝내기"(두 번 눌러야)로 앱을 아예 끝냄: 소리 멈춤 → 저장 신호 → 전체 화면 나감 → 탭 닫기 → 안 닫히면 "수업을 마쳤어요".
   오류·의견 알리기(reportLink)와 같은 왼쪽 아래 묶음(#chCorner)에서 그 위에 놓여 서로 겹치지 않음.
   앱이 넘겨 줌: EndLesson.set({ board: 'https://www.charum.org/webapp/59784', when: () => 참/거짓 })
     board  "차름 게시판으로" 주소     when  관리 메뉴가 열려 있는지(없으면 body에 admin이 붙었을 때)   2026-10-22 처음, 2026-11-25 모듈로 */
window.EndLesson = (function () {
  var o = { board: 'https://www.charum.org/webapp', when: null };
  var ctxs = []; ['AudioContext', 'webkitAudioContext'].forEach(function (n) {
    var C = window[n]; if (!C || C.__endWrap) return;
    var W = function () { var c = new (Function.prototype.bind.apply(C, [null].concat([].slice.call(arguments))))(); ctxs.push(c); return c; };
    W.prototype = C.prototype; W.__endWrap = true; try { window[n] = W; } catch (e) {}
  });
  var css = document.createElement('style');
  css.textContent = '#endBtn{display:none;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:#fff;border:1.5px solid #B4473B;color:#9A3328;font:700 14px/1.2 "Noto Sans KR","Apple SD Gothic Neo",sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.1);cursor:pointer;touch-action:none}#endBtn.on{display:inline-flex}#endBtn.sure{background:#B4473B;color:#fff}'
    + '#endCover{position:fixed;inset:0;z-index:2147483600;background:#F3F1EC;display:flex;align-items:center;justify-content:center;font-family:"Noto Sans KR","Apple SD Gothic Neo",sans-serif;color:#2B3236}'
    + '#endCover .c{text-align:center;display:flex;flex-direction:column;gap:18px;align-items:center}#endCover h1{font-family:Jua,"Noto Sans KR",sans-serif;font-weight:400;font-size:44px;margin:0}#endCover p{margin:0;color:#5E676B;font-size:16px}'
    + '#endCover .r{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}#endCover button,#endCover a{font:700 18px/1 "Noto Sans KR",sans-serif;padding:14px 26px;border-radius:14px;border:1.5px solid #8B979B;background:#fff;color:#2B3236;text-decoration:none;cursor:pointer}#endCover .p{background:#2B3236;color:#fff;border-color:#2B3236}@media print{#endBtn{display:none!important}}';
  document.head.appendChild(css);
  function admin() { try { return o.when ? !!o.when() : document.body.classList.contains('admin'); } catch (e) { return false; } }
  function exitFull() { try { if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); else if (document.webkitFullscreenElement) document.webkitExitFullscreen(); } catch (e) {} }
  function hush() { try { speechSynthesis.cancel(); } catch (e) {} document.querySelectorAll('audio,video').forEach(function (m) { try { m.pause(); } catch (e) {} }); ctxs.forEach(function (c) { try { c.suspend(); } catch (e) {} }); }
  function end() {
    hush(); try { window.dispatchEvent(new Event('pagehide')); } catch (e) {} exitFull();
    var cv = document.createElement('div'); cv.id = 'endCover';
    cv.innerHTML = '<div class="c"><h1>수업을 마쳤어요</h1><p>이 창(탭)을 닫아도 됩니다. 하던 것은 이 기기에 저장되어 있습니다.</p><div class="r"><button type="button" class="p" id="endAgain">다시 시작</button><a href="' + o.board + '">차름 게시판으로</a></div></div>';
    document.body.appendChild(cv);
    cv.querySelector('#endAgain').onclick = function () { location.reload(); };
    ['pointerdown', 'click', 'touchstart', 'keydown'].forEach(function (t) { cv.addEventListener(t, function (e) { e.stopPropagation(); });   /* 단추가 받은 뒤 막음(잡는 단계에서 막으면 "다시 시작"까지 막힘, 2026-10-26) */ });
    setTimeout(function () { try { window.close(); } catch (e) {} }, 150);
    setInterval(hush, 1000);   /* 늦게 시작한 소리도 멈춤 */
  }
  function corner() {
    if (window.ReportLink) return window.ReportLink.corner();
    var c = document.getElementById('chCorner');
    if (!c) { c = document.createElement('div'); c.id = 'chCorner'; c.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147480001;display:flex;flex-direction:column-reverse;align-items:flex-start;gap:8px'; document.body.appendChild(c); }
    return c;
  }
  var was = false, sureT = 0;
  function tick() {
    if (!document.body) return;
    var b = document.getElementById('endBtn');
    if (!b) {
      b = document.createElement('button'); b.id = 'endBtn'; b.type = 'button'; b.title = '앱을 끝내요(전체 화면에서 나가고 탭을 닫아요)';
      b.innerHTML = '<span aria-hidden="true">⏻</span><span class="t">수업 끝내기</span>';
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (!b.classList.contains('sure')) {
          b.classList.add('sure'); b.querySelector('.t').textContent = '한 번 더 누르면 끝나요'; clearTimeout(sureT);
          sureT = setTimeout(function () { b.classList.remove('sure'); b.querySelector('.t').textContent = '수업 끝내기'; }, 3000); return;
        }
        end();
      });
      ['click', 'pointerup'].forEach(function (t) { b.addEventListener(t, function (e) { e.stopPropagation(); }); });
      corner().appendChild(b);
    }
    var a = admin();
    b.classList.toggle('on', a);
    if (a && !was) exitFull();   /* 관리 메뉴를 열면 전체 화면에서 나옴(잠깐 나가기) */
    was = a;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
  setInterval(tick, 400);
  return { set: function (x) { for (var k in x) o[k] = x[k]; tick(); } };
})();
