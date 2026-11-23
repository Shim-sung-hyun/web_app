/* 차름 공통 모듈: 사용 횟수(usage) — 원본은 common/usage.js. 앱 안에서 고치지 말고 고친 뒤 python3 tools/sync-modules.py (2026-11-23)
   앱 번호와 '열림'·'다 함' 횟수만 charum.org/charum-api/usage.php로 보냄. 학생 이름·기록·기기 정보는 보내지 않음.
   Usage.open('005')  앱을 열 때 한 번 — 같은 기기·같은 날(한국 시간)은 한 번만 셈(새로고침해도 늘지 않음)
   Usage.done()       한 판을 마쳤을 때(앱마다 정한 순간, 앱 README) — 모아 두었다가 1분마다·창을 닫을 때 한꺼번에 보냄
   내 컴퓨터 파일(file:)·localhost·자동 시험 브라우저에서는 보내지 않음. 보는 곳: charum.org/charum-api/usage-admin.php(관리자) */
(function () {
  var ON = false;   /* 2026-11-23 잠시 끔: 서버에 usage.php를 올리고 ?ping이 ok인 것을 확인한 뒤 true로 (없는 주소로 보내면 라이믹스가 DB를 열어 연결 한도를 먹음) */
  var URL = 'https://www.charum.org/charum-api/usage.php', app = '', n = 0, timer = 0;
  function off() {
    var h = location.hostname;
    return location.protocol === 'file:' || !h || h === 'localhost' || /^127\./.test(h) || navigator.webdriver;
  }
  function today() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  function send(o) {
    if (!ON || !app || off()) return;
    o.app = app;
    var body = JSON.stringify(o);
    try { if (navigator.sendBeacon && navigator.sendBeacon(URL, new Blob([body], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch(URL, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body: body }); } catch (e) {}
  }
  function later(fn) {   /* 앱이 다 뜬 뒤(load) 3초 있다가 — 앱 불러오기와 겹치지 않게 (2026-11-23) */
    var go = function () { setTimeout(fn, 3000); };
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  }
  function flush() { clearTimeout(timer); timer = 0; if (n > 0) { var k = n; n = 0; send({ done: k }); } }
  window.Usage = {
    open: function (id) {
      app = String(id || '');
      var key = 'charum.usage.' + app, t = today(), seen = '';
      try { seen = localStorage.getItem(key) || ''; } catch (e) {}
      if (seen === t) return;
      try { localStorage.setItem(key, t); } catch (e) {}
      later(function () { send({ open: 1 }); });
    },
    done: function () {
      if (!app) return;
      n++;
      if (!timer) timer = setTimeout(flush, 60000);
    }
  };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
})();
