<?php
/* =====================================================================
   차름 웹앱 사용 횟수 — 관리자 화면 (usage-admin.php) — 2026-11-23 판
   charum.org에 "관리자"로 로그인한 사람만 열린다. 기록은 usage.php가 usage-data/에 모은 날짜별 합계뿐.
   - 앱마다 '열림'(같은 기기·같은 날은 한 번)과 '다 함'(앱마다 정한 한 판을 마친 수).
   - 주소: https://www.charum.org/charum-api/usage-admin.php
   ===================================================================== */
require dirname(__DIR__) . '/common/autoload.php';   /* 라이믹스는 한 칸 위(서버 맨 위 폴더) */
Context::init();
$isAdmin = Rhymix\Framework\Session::isAdmin();

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
if (!$isAdmin) {
  $login = '/index.php?act=dispMemberLoginForm&success_return_url=' . rawurlencode('/charum-api/usage-admin.php');
  echo '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>앱 사용 횟수</title>'
     . '<body style="font-family:\'Noto Sans KR\',sans-serif;background:#EEF2F5;color:#1C2A31;display:grid;place-items:center;min-height:90vh;margin:0">'
     . '<div style="background:#fff;border:1px solid #CFD9DF;border-radius:16px;padding:28px 30px;text-align:center;max-width:420px">'
     . '<p style="font-size:18px;margin:0 0 16px">관리자로 로그인해야 볼 수 있어요.</p>'
     . '<a href="' . htmlspecialchars($login) . '" style="display:inline-block;padding:10px 20px;border-radius:10px;background:#3F6A86;color:#fff;text-decoration:none;font-weight:700">로그인</a></div></body></html>';
  exit;
}

$DIR = __DIR__ . '/usage-data';
$all = [];
foreach (glob("$DIR/????-??.json") ?: [] as $f) {
  $m = json_decode((string)@file_get_contents($f), true);
  if (is_array($m)) $all += $m;
}
ksort($all);
$today = gmdate('Y-m-d', time() + 32400);
?><!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>앱 사용 횟수 - 차름</title>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{--ink:#1C2A31;--sub:#56666E;--line:#CFD9DF;--pri:#3F6A86;--pri2:#A9C1D1;--bg:#EEF2F5}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;font-size:15px;word-break:keep-all}
main{max-width:1040px;margin:0 auto;padding:22px 16px 60px}
.top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.top a{color:var(--sub);font-size:14px}
h1{font-family:'Jua','Noto Sans KR',sans-serif;font-weight:400;font-size:30px;margin:0;color:var(--pri)}
h2{font-size:18px;margin:0 0 10px}
.lead{margin:6px 0 16px;color:var(--sub);line-height:1.7}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin-bottom:14px}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.tabs button{font:inherit;padding:6px 12px;border-radius:9px;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}
.tabs button.on{background:var(--pri);border-color:var(--pri);color:#fff;font-weight:700}
.wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:8px 6px;border-bottom:1px solid #E6ECEF;text-align:left;vertical-align:middle}
th{color:var(--sub);font-weight:400;font-size:13px;white-space:nowrap}
td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
td.app b{font-weight:700} td.app small{display:block;color:var(--sub);font-size:12px}
tr.sum td{border-top:2px solid var(--line);font-weight:700}
.bar{display:flex;align-items:center;gap:6px;min-width:120px}
.bar i{display:block;height:9px;border-radius:5px;background:var(--pri)}
.days{display:flex;align-items:flex-end;gap:3px;height:120px;padding-top:6px;border-bottom:1px solid var(--line)}
.days div{flex:1;min-width:4px;display:flex;flex-direction:column;justify-content:flex-end;height:100%;position:relative}
.days span{display:block;background:var(--pri);border-radius:3px 3px 0 0}
.days span.o{background:var(--pri2)}
.daylab{display:flex;justify-content:space-between;color:var(--sub);font-size:12px;margin-top:4px}
.key{display:flex;gap:14px;color:var(--sub);font-size:13px;margin-top:8px}
.key i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.note{font-size:13px;color:var(--sub);line-height:1.7}
</style>
</head>
<body>
<main>
  <div class="top"><h1>앱 사용 횟수</h1><a href="/">charum.org로</a></div>
  <p class="lead">앱마다 <b>열림</b>(같은 기기·같은 날은 한 번)과 <b>다 함</b>(한 판을 마친 수)을 날짜별로 더한 숫자입니다. 학생 이름이나 기록은 모으지 않습니다. 2026-11-23부터 셉니다.</p>

  <div class="card">
    <div class="tabs" id="tabs"></div>
    <div class="wrap"><table id="tbl"></table></div>
  </div>

  <div class="card">
    <h2>최근 30일</h2>
    <div class="days" id="days"></div>
    <div class="daylab" id="daylab"></div>
    <div class="key"><span><i style="background:var(--pri2)"></i>열림</span><span><i style="background:var(--pri)"></i>다 함</span></div>
  </div>

  <p class="note">· 내 컴퓨터 파일로 연 앱과 자동 시험은 세지 않습니다. 선생님이 직접 열어 본 것은 함께 셉니다.<br>
  · '다 함'은 앱마다 뜻이 다릅니다(표의 작은 글씨). 큰 수 읽기처럼 한 번에 짧게 끝나는 앱은 숫자가 크게 나옵니다.<br>
  · 기록 파일: 서버 charum-api/usage-data/ (달마다 한 파일).</p>
</main>
<script>
const DATA = <?= json_encode($all, JSON_UNESCAPED_UNICODE) ?: '{}' ?>, TODAY = <?= json_encode($today) ?>;
const APPS = {
  '001': ['도형 찾기', '도형 한 장 마침'],
  '002': ['내 그림 퍼즐', '퍼즐 완성'],
  '003': ['무지개 찾기', '한 판 끝'],
  '004': ['시 외우기', '시를 끝까지 들음'],
  '005': ['큰 수 읽기', '수 하나 읽음'],
  '006': ['자리 이름 익히기', '통과'],
  '007': ['낱말 익히기', '수업 한 번 끝'],
  '008': ['동물이 사는 곳', '묶음 하나 끝'],
  '009': ['동물 다섯 고개', '수업 한 번 끝'],
  '010': ['무엇으로 만들었을까', '묶음 하나 끝'],
  '011': ['색깔 악보', '노래 한 곡 끝'],
  '012': ['팝아트 만들기', 'AI 그림 완성']
};
const shift = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const ym = d => d.slice(0, 7);
const PERIODS = [
  ['오늘', d => d === TODAY],
  ['최근 7일', d => d > shift(TODAY, -7)],
  ['이번 달', d => ym(d) === ym(TODAY)],
  ['지난 달', d => ym(d) === ym(shift(TODAY.slice(0, 8) + '01', -1))],
  ['모두', () => true]
];
let cur = 1;
function sum(test) {
  const s = {};
  for (const d in DATA) if (test(d)) for (const a in DATA[d]) { s[a] = s[a] || { o: 0, d: 0 }; s[a].o += DATA[d][a].o || 0; s[a].d += DATA[d][a].d || 0; }
  return s;
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function draw() {
  document.getElementById('tabs').innerHTML = PERIODS.map((p, i) => `<button type="button" class="${i === cur ? 'on' : ''}" data-i="${i}">${p[0]}</button>`).join('');
  const s = sum(PERIODS[cur][1]), ids = [...new Set([...Object.keys(APPS), ...Object.keys(s)])].sort();
  const max = Math.max(1, ...ids.map(a => (s[a] || {}).o || 0));
  let to = 0, td = 0;
  const rows = ids.map(a => {
    const c = s[a] || { o: 0, d: 0 }, nm = APPS[a] || ['(이름 없음)', ''];
    to += c.o; td += c.d;
    return `<tr><td class="app"><b>${a} ${esc(nm[0])}</b><small>다 함 = ${esc(nm[1])}</small></td>
      <td><div class="bar"><i style="width:${Math.round(c.o / max * 100)}px"></i></div></td>
      <td class="n">${c.o.toLocaleString()}</td><td class="n">${c.d.toLocaleString()}</td></tr>`;
  }).join('');
  document.getElementById('tbl').innerHTML = `<tr><th>앱</th><th></th><th style="text-align:right">열림</th><th style="text-align:right">다 함</th></tr>${rows}
    <tr class="sum"><td>모두</td><td></td><td class="n">${to.toLocaleString()}</td><td class="n">${td.toLocaleString()}</td></tr>`;
}
document.getElementById('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cur = +b.dataset.i; draw(); } });
draw();
(function days() {
  const list = []; for (let i = 29; i >= 0; i--) list.push(shift(TODAY, -i));
  const v = list.map(d => { let o = 0, dn = 0; for (const a in DATA[d] || {}) { o += DATA[d][a].o || 0; dn += DATA[d][a].d || 0; } return [o, dn]; });
  const max = Math.max(1, ...v.map(x => Math.max(x[0], x[1])));
  document.getElementById('days').innerHTML = v.map((x, i) =>
    `<div title="${list[i]} · 열림 ${x[0]} · 다 함 ${x[1]}" style="flex-direction:row;align-items:flex-end;gap:1px"><span class="o" style="flex:1;height:${x[0] / max * 100}%"></span><span style="flex:1;height:${x[1] / max * 100}%"></span></div>`).join('');
  document.getElementById('daylab').innerHTML = `<span>${list[0].slice(5)}</span><span>${list[15].slice(5)}</span><span>오늘</span>`;
})();
</script>
</body>
</html>
