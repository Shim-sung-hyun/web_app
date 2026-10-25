<?php
/* =====================================================================
   차름 사진 다리 — 관리자 화면 (relay-admin.php) — 2026-10-25 판
   charum.org에 "관리자"로 로그인한 사람만 열린다.
   - 연수 코드 만들기·켜고 끄기·끝나는 날·하루 한도, 이달 사용량(전송량), 부른 주소, 전체 한도.
   - 사진 내용은 여기서도 볼 수 없다(잠겨 있고, 받는 순간 지워짐).
   - 주소: https://www.charum.org/charum-api/relay-admin.php
   ===================================================================== */
require dirname(__DIR__) . '/common/autoload.php';   /* 라이믹스는 한 칸 위(서버 맨 위 폴더) */
Context::init();
$isAdmin = Rhymix\Framework\Session::isAdmin();
require __DIR__ . '/relay-lib.php';

function jout($a) { header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); echo json_encode($a, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit; }
function kmonth($off = 0) { $t = time() + 32400; $y = (int)gmdate('Y', $t); $m = (int)gmdate('n', $t) + $off; while ($m < 1) { $m += 12; $y--; } return sprintf('%04d-%02d', $y, $m); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!$isAdmin) jout(['error' => 'login']);
  $o = $_SERVER['HTTP_ORIGIN'] ?? ''; $host = $_SERVER['HTTP_HOST'] ?? '';
  if (!$o || parse_url($o, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $host)) jout(['error' => 'origin']);
  $in = json_decode((string)file_get_contents('php://input'), true); if (!is_array($in)) jout(['error' => 'bad']);
  $a = $in['a'] ?? '';
  $lock = relay_lock();
  $S = relay_settings();
  if ($a === 'list') {
    $open = 0; foreach (glob(RELAY_DIR . '/s_*.json') ?: [] as $f) $open++;
    jout(['settings' => $S, 'now' => relay_usage(kmonth()), 'prev' => relay_usage(kmonth(-1)), 'month' => kmonth(), 'prevMonth' => kmonth(-1), 'today' => relay_today(), 'open' => $open]);
  }
  if ($a === 'code') {
    $pc = strtolower(trim((string)($in['code'] ?? '')));
    if (!relay_code_ok($pc)) jout(['error' => 'code']);
    $old = $S['codes'][$pc] ?? ['made' => relay_today()];
    $until = (string)($in['until'] ?? '');
    if ($until !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $until)) jout(['error' => 'until']);
    $S['codes'][$pc] = ['label' => mb_substr(trim((string)($in['label'] ?? '')), 0, 40), 'on' => !empty($in['on']), 'until' => $until,
                        'day' => max(1, min(100000, (int)($in['day'] ?? 1000))), 'made' => $old['made'] ?? relay_today()];
    relay_save_settings($S); jout(['ok' => true]);
  }
  if ($a === 'delcode') { unset($S['codes'][(string)($in['code'] ?? '')]); relay_save_settings($S); jout(['ok' => true]); }
  if ($a === 'limits') {
    $S['monthGB'] = max(1, min(180, (float)($in['monthGB'] ?? 60)));
    $S['maxMB'] = max(1, min(8, (int)($in['maxMB'] ?? 4)));
    $S['maxItems'] = max(1, min(100, (int)($in['maxItems'] ?? 30)));
    relay_save_settings($S); jout(['ok' => true]);
  }
  jout(['error' => 'bad']);
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
if (!$isAdmin) {
  $login = '/index.php?act=dispMemberLoginForm&success_return_url=' . rawurlencode('/charum-api/relay-admin.php');
  echo '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>사진 다리</title>'
     . '<body style="font-family:\'Noto Sans KR\',sans-serif;background:#EEF2F5;color:#1C2A31;display:grid;place-items:center;min-height:90vh;margin:0">'
     . '<div style="background:#fff;border:1px solid #CFD9DF;border-radius:16px;padding:28px 30px;text-align:center;max-width:420px">'
     . '<p style="font-size:18px;margin:0 0 16px">관리자로 로그인해야 볼 수 있어요.</p>'
     . '<a href="' . htmlspecialchars($login) . '" style="display:inline-block;padding:10px 20px;border-radius:10px;background:#3F6A86;color:#fff;text-decoration:none;font-weight:700">로그인</a></div></body></html>';
  exit;
}
?><!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>사진 다리 - 차름</title>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{--ink:#1C2A31;--sub:#56666E;--line:#CFD9DF;--pri:#3F6A86;--bg:#EEF2F5;--ok:#1b7f3a;--err:#c62828;--warn:#B26A00}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;font-size:15px;word-break:keep-all}
main{max-width:1040px;margin:0 auto;padding:22px 16px 60px}
.top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.top a{color:var(--sub);font-size:14px}
h1{font-family:'Jua','Noto Sans KR',sans-serif;font-weight:400;font-size:30px;margin:0;color:var(--pri)}
h2{font-size:18px;margin:0 0 10px}
.lead{margin:6px 0 16px;color:var(--sub);line-height:1.7}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin-bottom:14px}
.meter{height:14px;border-radius:999px;background:#E3E9ED;overflow:hidden;margin:8px 0 6px}
.meter i{display:block;height:100%;background:var(--pri);border-radius:999px}
.meter.warn i{background:var(--warn)} .meter.full i{background:var(--err)}
.nums{display:flex;gap:22px;flex-wrap:wrap;color:var(--sub);font-size:14px} .nums b{color:var(--ink);font-size:17px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:8px 6px;border-bottom:1px solid #E6ECEF;text-align:left;vertical-align:middle}
th{color:var(--sub);font-weight:400;font-size:13px;white-space:nowrap}
td.n,.pill,code{white-space:nowrap}
td.n{text-align:right;font-variant-numeric:tabular-nums}
code{font-size:14px;background:#F1F4F6;padding:1px 6px;border-radius:6px}
input,button{font:inherit}
input[type=text],input[type=date],input[type=number]{padding:7px 9px;border:1px solid var(--line);border-radius:9px;min-width:0}
button{padding:7px 12px;border-radius:9px;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}
button.pri{background:var(--pri);border-color:var(--pri);color:#fff;font-weight:700}
.sw{display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.pill{display:inline-block;font-size:12px;padding:1px 8px;border-radius:999px;border:1px solid var(--line);color:var(--sub)}
.pill.on{border-color:#9CC8A9;background:#EAF6EE;color:var(--ok)} .pill.end{border-color:#E7B9B9;background:#FBEDED;color:var(--err)}
.form{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end}
.form label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--sub)}
.note{font-size:13px;color:var(--sub);line-height:1.6}
#state{min-height:1.5em;margin:6px 0 0} #state.err{color:var(--err)} #state.ok{color:var(--ok)}
.scroll{overflow-x:auto}
</style>
</head>
<body>
<main>
<div class="top"><h1>사진 다리</h1><a href="/index.php?act=dispMemberInfo">← 회원 정보로</a></div>
<p class="lead">선생님들이 만든 앱이 휴대폰 사진을 받을 때 이 서버를 다리로 씁니다. 사진은 휴대폰에서 잠가 오므로 여기서도 볼 수 없고, 받는 순간 지워집니다. <b>연수 코드</b>가 켜져 있어야 쓸 수 있습니다.</p>

<section class="card" id="useBox"><h2>이달 사용량</h2><p class="note">불러오는 중…</p></section>

<section class="card">
  <h2>연수 코드</h2>
  <p class="note" style="margin-top:0">코드는 선생님 앱 소스에 보이므로 비밀번호가 아닙니다. 연수마다 하나씩 만들어 켜고, 끝나면 끄거나 끝나는 날을 정해 두세요. 하루 한도는 그 코드로 하루에 만들 수 있는 번호(QR) 수입니다.</p>
  <div class="scroll"><table id="codes"><thead><tr><th>코드</th><th>이름</th><th>상태</th><th>끝나는 날</th><th class="n">하루 한도</th><th class="n">오늘 번호</th><th class="n">이달 번호</th><th class="n">이달 사진</th><th class="n">이달 전송</th><th></th></tr></thead><tbody></tbody></table></div>
  <h2 style="margin-top:18px;font-size:16px" id="formTitle">새 연수 코드</h2>
  <div class="form">
    <label>코드 (영문 소문자·숫자·-, 3~24자)<input type="text" id="fCode" placeholder="2026-11-seoul" autocapitalize="off" spellcheck="false"></label>
    <label>이름 (나만 보는 메모)<input type="text" id="fLabel" placeholder="서울 특수교사 연수 11월"></label>
    <label>끝나는 날 (비우면 계속)<input type="date" id="fUntil"></label>
    <label>하루 한도 (번호 수)<input type="number" id="fDay" min="1" max="100000" value="1000"></label>
    <label class="sw" style="flex-direction:row;align-items:center"><input type="checkbox" id="fOn" checked> 켜기</label>
    <div style="display:flex;gap:8px"><button class="pri" type="button" id="fSave">저장</button><button type="button" id="fNew">새로</button></div>
  </div>
  <p id="state"></p>
</section>

<section class="card">
  <h2>전체 한도</h2>
  <div class="form">
    <label>한 달 전송량 안전판 (GB)<input type="number" id="lGB" min="1" max="180" step="1"></label>
    <label>사진 한 장 (MB)<input type="number" id="lMB" min="1" max="8"></label>
    <label>번호 하나로 보낼 장 수<input type="number" id="lItems" min="1" max="100"></label>
    <div><button class="pri" type="button" id="lSave">저장</button></div>
  </div>
  <p class="note">한 달 전송량이 안전판에 닿으면 그달은 새 전송을 받지 않습니다(호스팅 한 달 180GB 가운데 게시판 몫을 남기려고). 사진 한 장은 올리기·받기로 두 번 셉니다. 휴대폰이 긴 쪽 1600px로 줄여 보내므로 한 장은 보통 0.3~0.6MB입니다.</p>
</section>

<section class="card">
  <h2>부른 주소 (이달, 번호 수)</h2>
  <p class="note" style="margin-top:0">어느 앱(주소)이 다리를 쓰는지 봅니다. 모르는 주소가 많이 쓰면 그 코드를 끄세요.</p>
  <div class="scroll"><table id="origins"><thead><tr><th>주소</th><th class="n">번호</th></tr></thead><tbody></tbody></table></div>
</section>
<p class="note">점검: <a href="/charum-api/relay.php?ping" target="_blank">/charum-api/relay.php?ping</a> · 받기 페이지: <a href="/study/get.html" target="_blank">/study/get.html</a></p>
</main>
<script>
const API='/charum-api/relay-admin.php';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const say=(t,c)=>{ $('state').textContent=t; $('state').className=c||''; };
const gb=b=>(b/1e9).toFixed(b<1e9?3:2)+' GB';
const mb=b=>b<1e9?(b/1e6).toFixed(1)+' MB':gb(b);
async function call(o){ const r=await fetch(API,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'text/plain'},body:JSON.stringify(o)}); const j=await r.json(); if(j.error) throw new Error(j.error); return j; }
let D=null;
function live(c){ return c.on&&(!c.until||c.until>=D.today); }
async function load(){
  try{ D=await call({a:'list'}); }catch(e){ say(e.message==='login'?'로그인이 풀렸어요. 다시 로그인해 주세요.':'불러오지 못했어요: '+e.message,'err'); return; }
  const S=D.settings, U=D.now, P=D.prev, cap=S.monthGB*1e9, pct=Math.min(100,U.bytes/cap*100);
  $('useBox').innerHTML=`<h2>이달 사용량 <span class="note">${esc(D.month)}</span></h2>
    <div class="meter ${pct>=100?'full':pct>=80?'warn':''}"><i style="width:${pct.toFixed(1)}%"></i></div>
    <div class="nums"><span>전송 <b>${gb(U.bytes)}</b> / 안전판 ${S.monthGB} GB (${pct.toFixed(1)}%)</span><span>번호 <b>${U.o}</b></span><span>사진 <b>${U.s}</b>장</span><span>지금 열린 번호 <b>${D.open}</b></span></div>
    <p class="note" style="margin:8px 0 0">지난달(${esc(D.prevMonth)}) 전송 ${gb(P.bytes)} · 번호 ${P.o} · 사진 ${P.s}장${pct>=100?' · <b style="color:var(--err)">안전판에 닿아 새 전송을 멈췄어요. 아래 "전체 한도"에서 올릴 수 있어요.</b>':''}</p>`;
  const tb=$('codes').querySelector('tbody'), codes=Object.entries(S.codes).sort((a,b)=>(b[1].made||'').localeCompare(a[1].made||''));
  tb.innerHTML=codes.map(([k,c])=>{ const u=U.codes[k]||{o:0,s:0,bytes:0,days:{}}, t=(u.days&&u.days[D.today])||{o:0};
    const st=live(c)?'<span class="pill on">켜짐</span>':c.on?'<span class="pill end">끝남</span>':'<span class="pill">꺼짐</span>';
    return `<tr><td><code>${esc(k)}</code></td><td>${esc(c.label)}</td><td>${st}</td><td>${esc(c.until||'계속')}</td><td class="n">${c.day}</td><td class="n">${t.o}</td><td class="n">${u.o}</td><td class="n">${u.s}</td><td class="n">${mb(u.bytes)}</td>
      <td style="white-space:nowrap"><button type="button" data-tog="${esc(k)}">${c.on?'끄기':'켜기'}</button> <button type="button" data-edit="${esc(k)}">고치기</button> <button type="button" data-del="${esc(k)}">지우기</button></td></tr>`; }).join('')||'<tr><td colspan="10" class="note">아직 코드가 없어요.</td></tr>';
  tb.querySelectorAll('[data-tog]').forEach(b=>b.onclick=()=>{ const k=b.dataset.tog, c=S.codes[k]; save({...c,code:k,on:!c.on}); });
  tb.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{ const k=b.dataset.edit, c=S.codes[k]; $('fCode').value=k; $('fCode').readOnly=true; $('fLabel').value=c.label||''; $('fUntil').value=c.until||''; $('fDay').value=c.day; $('fOn').checked=!!c.on; $('formTitle').textContent='코드 고치기: '+k; $('fLabel').focus(); });
  tb.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{ const k=b.dataset.del; if(!confirm(`코드 "${k}"를 지울까요? 이 코드를 넣은 앱은 더 이상 사진을 받지 못해요.`)) return; try{ await call({a:'delcode',code:k}); say('지웠어요.','ok'); load(); }catch(e){ say('지우지 못했어요: '+e.message,'err'); } });
  $('lGB').value=S.monthGB; $('lMB').value=S.maxMB; $('lItems').value=S.maxItems;
  const og=Object.entries(U.origins||{}).sort((a,b)=>b[1]-a[1]).slice(0,30);
  $('origins').querySelector('tbody').innerHTML=og.map(([o,n])=>`<tr><td>${esc(o)}</td><td class="n">${n}</td></tr>`).join('')||'<tr><td colspan="2" class="note">이달에는 아직 없어요.</td></tr>';
}
async function save(c){
  try{ await call({a:'code',code:c.code,label:c.label,until:c.until,day:c.day,on:c.on}); say(`"${c.code}" 저장했어요.`,'ok'); clearForm(); load(); }
  catch(e){ say(e.message==='code'?'코드는 영문 소문자·숫자·-로 3~24자예요(첫 글자는 영문이나 숫자).':e.message==='until'?'끝나는 날을 다시 골라 주세요.':'저장하지 못했어요: '+e.message,'err'); }
}
function clearForm(){ $('fCode').value=''; $('fCode').readOnly=false; $('fLabel').value=''; $('fUntil').value=''; $('fDay').value=1000; $('fOn').checked=true; $('formTitle').textContent='새 연수 코드'; }
$('fSave').onclick=()=>{ const code=$('fCode').value.trim().toLowerCase(); if(!code){ say('코드를 써 주세요.','err'); $('fCode').focus(); return; }
  if(!$('fCode').readOnly&&D&&D.settings.codes[code]&&!confirm(`"${code}"는 이미 있어요. 덮어쓸까요?`)) return;
  save({code,label:$('fLabel').value,until:$('fUntil').value,day:+$('fDay').value||1000,on:$('fOn').checked}); };
$('fNew').onclick=clearForm;
$('lSave').onclick=async()=>{ try{ await call({a:'limits',monthGB:+$('lGB').value,maxMB:+$('lMB').value,maxItems:+$('lItems').value}); say('전체 한도를 저장했어요.','ok'); load(); }catch(e){ say('저장하지 못했어요: '+e.message,'err'); } };
load();
</script>
</body>
</html>
