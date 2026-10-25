<?php
/* =====================================================================
   차름 기증 사진 — 관리자 화면 (donate-admin.php) — 2026-10-25 판
   charum.org에 "관리자"로 로그인한 사람만 열린다(확인 글자 필요 없음).
   - donate.php와 같은 곳(서버 루트)에 올린다. 기증 사진은 donate.php가 쌓은 donate-data/ 를 그대로 읽는다.
   - 회원 메뉴의 "기증 사진" 탭은 애드온 addons/charum_donate 가 붙인다(관리자에게만, 기다리는 장 수 표시).
   - 할 수 있는 것: 기증 사진 보기 · 골라 zip 받기(차름 사진 모음 꼴) · 서버에서 지우기.
   - 주소: https://www.charum.org/donate-admin.php
   ===================================================================== */

require __DIR__ . '/common/autoload.php';   /* 라이믹스를 불러 로그인 상태를 봄 */
Context::init();
$isAdmin = Rhymix\Framework\Session::isAdmin();
$DIR = __DIR__ . '/donate-data';

function jout($a) { header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); echo json_encode($a, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit; }
function idok($id) { return is_string($id) && preg_match('/^[a-z0-9]{8,40}$/', $id); }
function pending($DIR) { return count(glob($DIR . '/d_*.json') ?: []); }

/* 기다리는 장 수(관리자만) */
if (isset($_GET['count'])) jout(['n' => $isAdmin ? pending($DIR) : null]);

/* 목록·사진·지우기(관리자만, 같은 주소에서 연 화면만) */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!$isAdmin) jout(['error' => 'login']);
  $o = $_SERVER['HTTP_ORIGIN'] ?? ''; $host = $_SERVER['HTTP_HOST'] ?? '';
  if (!$o || parse_url($o, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $host)) jout(['error' => 'origin']);   /* 다른 사이트에서 몰래 부르지 못하게 */
  $raw = $GLOBALS['HTTP_RAW_POST_DATA'] ?? file_get_contents('php://input');
  $in = json_decode((string)$raw, true); if (!is_array($in)) jout(['error' => 'bad']);
  $a = $in['a'] ?? '';
  if ($a === 'list') {
    $list = [];
    foreach (glob($DIR . '/d_*.json') ?: [] as $f) { $d = json_decode((string)@file_get_contents($f), true); if (!$d) continue;
      $list[] = ['id' => $d['id'], 't' => $d['t']]; }
    usort($list, function ($x, $y) { return $x['t'] <=> $y['t']; });
    jout(['list' => $list]);
  }
  if ($a === 'get') { $id = $in['id'] ?? ''; if (!idok($id) || !is_file($DIR . '/d_' . $id . '.json')) jout(['error' => 'nofile']);
    $d = json_decode((string)file_get_contents($DIR . '/d_' . $id . '.json'), true);
    $d['app'] = $d['app'] ?? '001'; $d['check'] = $d['check'] ?? 'gemini'; $d['shapes'] = $d['shapes'] ?? [];
    jout($d); }
  if ($a === 'del') { $id = $in['id'] ?? ''; if (idok($id)) @unlink($DIR . '/d_' . $id . '.json'); jout(['ok' => true]); }
  jout(['error' => 'bad']);
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
if (!$isAdmin) {
  $login = '/index.php?act=dispMemberLoginForm&success_return_url=' . rawurlencode('/donate-admin.php');
  echo '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>기증 사진</title>'
     . '<body style="font-family:\'Noto Sans KR\',sans-serif;background:#EEF4F2;color:#1A2B2E;display:grid;place-items:center;min-height:90vh;margin:0">'
     . '<div style="background:#fff;border:1px solid #CBDAD7;border-radius:16px;padding:28px 30px;text-align:center;max-width:420px">'
     . '<p style="font-size:18px;margin:0 0 16px">관리자로 로그인해야 볼 수 있어요.</p>'
     . '<a href="' . htmlspecialchars($login) . '" style="display:inline-block;padding:10px 20px;border-radius:10px;background:#17766F;color:#fff;text-decoration:none;font-weight:700">로그인</a></div></body></html>';
  exit;
}
$n = pending($DIR);
?><!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>기증 사진 - 차름</title>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<style>
:root{--ink:#1A2B2E;--sub:#55686B;--line:#CBDAD7;--pri:#17766F;--bg:#EEF4F2;--ok:#1b7f3a;--err:#c62828}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;font-size:15px}
main{max-width:1100px;margin:0 auto;padding:22px 16px 60px}
.top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.top a{color:var(--sub);font-size:14px}
h1{font-family:'Jua','Noto Sans KR',sans-serif;font-weight:400;font-size:30px;margin:0;color:var(--pri)}
.lead{margin:0 0 14px;color:var(--sub);line-height:1.7}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-bottom:12px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
button{font:inherit;padding:8px 13px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}
button:disabled{opacity:.5}
#state{margin:8px 0 0;min-height:1.5em} #state.err{color:var(--err)} #state.ok{color:var(--ok)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px}
.it{background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px}
.it.sel{border-color:var(--pri)}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.pv{position:relative} .pv img,.pv svg{width:100%;display:block;border-radius:8px}
.pv svg{position:absolute;inset:0;height:100%}
.ph{aspect-ratio:4/3;background:#F2F5F4;border-radius:8px;display:grid;place-items:center;color:var(--sub);font-size:13px}
.bar{display:flex;gap:6px;align-items:center;justify-content:space-between;margin-top:6px}
.bar small{color:var(--sub)}
.note{font-size:13px;color:var(--sub);line-height:1.6}
.tag{display:inline-block;font-size:12px;padding:1px 7px;border-radius:999px;border:1px solid var(--line);color:var(--sub);margin-right:4px}
.tag.none{border-color:#E0A100;color:#8A5A00;background:#FFF6DA}
</style>
</head>
<body>
<main>
<div class="top"><h1>기증 사진 <span style="font-size:20px;color:var(--sub)"><?= $n ?>장 기다림</span></h1><a href="/index.php?act=dispMemberInfo">← 회원 정보로</a></div>
<p class="lead">선생님들이 기증한 사진이 여기 모여요. 쓸 사진을 골라 zip으로 받아 Claude에게 보내면 <b>차름 사진 모음</b>에 들어가요. 받은 뒤에는 "고른 것 서버에서 지우기"로 비워 주세요.</p>
<div class="card">
  <p class="note" style="margin-top:0">사람·얼굴·이름·번호·차 번호판·학교 이름이 보이면 <b>지우기</b>. <span class="tag none">검사 안 함</span>이 붙은 사진은 앱 검사 없이 온 것이니 더 꼼꼼히 봐 주세요. 빨간 선은 앱이 찾은 도형이에요.</p>
  <div class="row"><button id="zip" type="button" disabled>고른 것 zip 받기</button><button id="delSel" type="button" disabled>고른 것 서버에서 지우기</button><button id="all" type="button">모두 고르기</button><span id="cnt" class="note"></span></div>
  <p id="state"></p>
</div>
<div class="grid" id="grid"></div>
</main>
<script>
const API='/donate-admin.php';
const $=id=>document.getElementById(id);
const say=(t,c)=>{ $('state').textContent=t; $('state').className=c||''; };
let ITEMS={}, SEL=new Set();
async function call(o){ const r=await fetch(API,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'text/plain'},body:JSON.stringify(o)}); const j=await r.json(); if(j.error) throw new Error(j.error); return j; }
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function overlay(d){ if(!(d.shapes&&d.shapes.length)) return ''; return `<svg viewBox="0 0 1000 1000" preserveAspectRatio="none">${d.shapes.map(s=>{ const b=s.box;
  if(s.pts&&s.pts.length>2) return `<polygon points="${s.pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#e53935" stroke-width="5" vector-effect="non-scaling-stroke"/>`;
  return `<ellipse cx="${(b.x0+b.x1)/2}" cy="${(b.y0+b.y1)/2}" rx="${(b.x1-b.x0)/2}" ry="${(b.y1-b.y0)/2}" fill="none" stroke="#e53935" stroke-width="5" vector-effect="non-scaling-stroke"/>`; }).join('')}</svg>`; }
function count(){ $('cnt').textContent=`고름 ${SEL.size} / ${Object.keys(ITEMS).length}`; $('zip').disabled=$('delSel').disabled=!SEL.size; }
async function load(){ say('불러오는 중…'); $('grid').innerHTML=''; ITEMS={}; SEL.clear(); count();
  try{ const {list}=await call({a:'list'}); if(!list.length){ say('기다리는 사진이 없어요.','ok'); return; }
    for(const m of list){ const d=await call({a:'get',id:m.id}); ITEMS[d.id]=d;
      const mt=d.meta||{}, sg=mt.suggest||{};
      const el=document.createElement('div'); el.className='it'; el.innerHTML=`<div class="pair"><div class="pv"><img src="data:image/jpeg;base64,${d.img}" alt="">${overlay(d)}</div>${d.art?`<div class="pv"><img src="data:image/jpeg;base64,${d.art}" alt=""></div>`:'<div class="ph">그림 없음</div>'}</div>
        <div class="bar"><span><b>${esc(d.title||'(이름 없음)')}</b><br><small><span class="tag">${d.app==='000'?'제작자 모으기':esc(d.app||'001')+' 앱에서'}</span>${mt.place?`<span class="tag">${esc(mt.place)}</span>`:''}${sg.shape?'<span class="tag">도형 찾기</span>':''}${sg.puzzle?'<span class="tag">그림 조각</span>':''}${d.check==='none'?'<span class="tag none">검사 안 함</span>':''}${mt.tags&&mt.tags.length?esc(mt.tags.join(' · '))+' · ':''}${new Date(d.t*1000).toLocaleString('ko-KR')}${mt.note?'<br>'+esc(mt.note):''}${(d.shapes||[]).length?` · 도형 ${d.shapes.length}개 · ${esc([...new Set(d.shapes.map(s=>s.obj))].join(', '))}`:''}</small></span>
        <span class="row"><label><input type="checkbox" data-a="sel"> 고르기</label><button type="button" data-a="del">지우기</button></span></div>`;
      el.querySelector('[data-a=sel]').onchange=e=>{ e.target.checked?SEL.add(d.id):SEL.delete(d.id); el.classList.toggle('sel',e.target.checked); count(); };
      el.querySelector('[data-a=del]').onclick=async()=>{ if(!confirm('이 사진을 서버에서 지울까요?')) return; await call({a:'del',id:d.id}); delete ITEMS[d.id]; SEL.delete(d.id); el.remove(); count(); };
      $('grid').appendChild(el); count(); }
    say(list.length+'장을 불러왔어요.','ok');
  }catch(e){ say(e.message==='login'?'로그인이 풀렸어요. 다시 로그인해 주세요.':'불러오지 못했어요: '+e.message,'err'); } }
$('all').onclick=()=>{ document.querySelectorAll('[data-a=sel]').forEach(c=>{ if(!c.checked){ c.checked=true; c.dispatchEvent(new Event('change')); } }); };
$('zip').onclick=async()=>{ if(typeof JSZip==='undefined'){ say('zip 도구를 불러오지 못했어요. 새로 고침해 주세요.','err'); return; }
  const z=new JSZip(), meta=[], day=new Date().toLocaleDateString('sv-SE');
  for(const id of SEL){ const d=ITEMS[id], sid='d'+id, files={photo:`${sid}/photo.jpg`};
    z.file(files.photo,d.img,{base64:true}); if(d.art){ files.art=`${sid}/art.jpg`; z.file(files.art,d.art,{base64:true}); }
    const mt=d.meta||{}, sg=mt.suggest||{};
    /* 차름 사진 모음(media/photos/photos.json) 한 줄 꼴 그대로(review.html과 같음) */
    meta.push({id:sid,title:d.title,source:d.app==='000'?'maker':'donated',added:day,privacy:'',check:d.check||'gemini',from:d.app||'001',
      tags:[mt.place,...(mt.tags||[])].filter(Boolean),files,suggest:{shape:!!sg.shape,puzzle:!!sg.puzzle},note:mt.note||'',
      uses:{...((d.shapes&&d.shapes.length)||sg.shape||d.app==='001'?{shape:{ok:false,shapes:d.shapes||[]}}:{}),puzzle:false}}); }
  z.file('donations.json',JSON.stringify(meta,null,1));
  const b=await z.generateAsync({type:'blob'}); const l=document.createElement('a'); l.href=URL.createObjectURL(b); l.download='donations-'+day+'.zip'; l.click();
  say(SEL.size+'장을 받았어요. Claude에게 보내 주세요. 그다음 "고른 것 서버에서 지우기".','ok'); };
$('delSel').onclick=async()=>{ if(!confirm(`고른 ${SEL.size}장을 서버에서 지울까요?`)) return; for(const id of [...SEL]){ await call({a:'del',id}); } load(); };
load();
</script>
</body>
</html>
