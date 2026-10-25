<?php
/* 차름 기증 사진 탭 (2026-10-25)
   관리자로 로그인했을 때만, 회원 메뉴 목록(회원정보 보기 · 스크랩 보기 · 저장함 보기 …)이 있는 곳에
   "기증 사진 N" 탭을 붙인다. 누르면 서버 루트의 donate-admin.php(관리자만 열림)로 간다.
   기다리는 장 수는 donate.php가 쌓는 donate-data/ 의 파일 수.
   (2026-10-25 더함) 그 옆에 "사진 다리" 탭 → charum-api/relay-admin.php. 이달 전송량이 안전판의 80%를 넘으면 빨간 %를 붙임. */
if (!defined('__XE__') && !defined('RX_VERSION')) exit();
if ($called_position !== 'before_display_content') return;
if (Context::getResponseMethod() !== 'HTML' || !is_string($output)) return;
if (!Rhymix\Framework\Session::isAdmin()) return;

$charum_n = count(glob(RX_BASEDIR . 'charum-api/donate-data/d_*.json') ?: []);
/* Claude가 "다시 볼 사진"으로 돌려보낸 것(비공개 저장소 flagged/ 가운데 아직 정하지 않은 것)도 더함 — 10분마다 한 번만 GitHub에 물어봄 */
$charum_cache = RX_BASEDIR . 'charum-api/donate-data/flagged-cache.json';
$charum_f = 0;
$charum_c = is_file($charum_cache) ? json_decode((string)@file_get_contents($charum_cache), true) : null;
if (is_array($charum_c) && time() - (int)($charum_c['t'] ?? 0) < 600) { $charum_f = (int)($charum_c['n'] ?? 0); }
elseif (is_file(RX_BASEDIR . 'charum-api/donate-config.php') && function_exists('curl_init')) {
  $GITHUB_TOKEN = ''; $INBOX_REPO = 'Shim-sung-hyun/charum-inbox';
  include RX_BASEDIR . 'charum-api/donate-config.php';
  $charum_get = function ($p) use ($GITHUB_TOKEN, $INBOX_REPO) {
    $ch = curl_init('https://api.github.com/repos/' . $INBOX_REPO . '/contents/' . $p);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 4, CURLOPT_CONNECTTIMEOUT => 3,
      CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $GITHUB_TOKEN, 'Accept: application/vnd.github+json', 'User-Agent: charum-donate']]);
    $r = curl_exec($ch); $c = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return $c === 200 ? (json_decode((string)$r, true) ?: []) : [];
  };
  if (strlen($GITHUB_TOKEN) > 20) {
    $charum_dec = [];
    foreach ($charum_get('decisions') as $e) if (preg_match('/^(.+)\.json$/', $e['name'] ?? '', $m)) $charum_dec[$m[1]] = 1;
    foreach ($charum_get('flagged') as $e) if (($e['type'] ?? '') === 'dir' && empty($charum_dec[$e['name']])) $charum_f++;
    @file_put_contents($charum_cache, json_encode(['t' => time(), 'n' => $charum_f]));
  }
}
$charum_n += $charum_f;
/* 사진 다리 이달 사용량(%) — relay-data/ 의 settings.json·usage-YYYY-MM.json 을 읽기만 함 */
$charum_rp = 0;
$charum_rs = json_decode((string)@file_get_contents(RX_BASEDIR . 'charum-api/relay-data/settings.json'), true);
$charum_ru = json_decode((string)@file_get_contents(RX_BASEDIR . 'charum-api/relay-data/usage-' . gmdate('Y-m', time() + 32400) . '.json'), true);
$charum_cap = (float)(is_array($charum_rs) && !empty($charum_rs['monthGB']) ? $charum_rs['monthGB'] : 60) * 1e9;
if (is_array($charum_ru) && $charum_cap > 0) $charum_rp = (int)floor(100 * (float)($charum_ru['bytes'] ?? 0) / $charum_cap);
$charum_js = <<<'JS'
<script>
(function(){
  var N=__N__, RP=__RP__;
  var TABS=[{url:'/charum-api/donate-admin.php',label:'기증 사진',badge:N>0?String(N):''},
            {url:'/charum-api/relay-admin.php',label:'사진 다리',badge:RP>=80?RP+'%':''}];
  function run(){
    var seen=[];
    var links=document.querySelectorAll('a[href*="dispMemberSavedDocument"],a[href*="dispMemberScrappedDocument"],a[href*="dispMemberInfo"],a[href*="dispMemberOwnDocument"]');
    for(var i=0;i<links.length;i++){
      var li=links[i].closest('li'); if(!li||!li.parentNode) continue;
      var ul=li.parentNode; if(seen.indexOf(ul)>=0||ul.querySelector('a[data-charum-donate]')) continue; seen.push(ul);
      /* 지금 고른 탭이 아닌 칸의 모양을 본떠 새 칸을 만듦 */
      var base=null, kids=ul.children;
      for(var k=0;k<kids.length;k++){ var c=kids[k]; if(c.tagName==='LI'&&c.querySelector('a')&&!/\b(active|on|selected|current|cur)\b/.test(c.className+' '+c.querySelector('a').className)){ base=c; break; } }
      base=base||li;
      for(var t=0;t<TABS.length;t++){ var T=TABS[t];
        var nli=document.createElement('li'); nli.className=(base.className||'').replace(/\b(active|on|selected|current|cur)\b/g,'').trim();
        var a=document.createElement('a'); var ba=base.querySelector('a');
        a.className=((ba&&ba.className)||'').replace(/\b(active|on|selected|current|cur)\b/g,'').trim();
        a.href=T.url; a.setAttribute('data-charum-donate','1'); a.textContent=T.label;
        if(T.badge){ var b=document.createElement('span'); b.textContent=T.badge;
          b.style.cssText='display:inline-block;min-width:18px;margin-left:6px;padding:0 6px;border-radius:9px;background:#c62828;color:#fff;font-size:12px;line-height:18px;text-align:center;font-weight:700;vertical-align:1px';
          a.appendChild(b); }
        nli.appendChild(a); ul.appendChild(nli);
      }
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();
</script>
JS;
$charum_js = str_replace(['__N__', '__RP__'], [(string)$charum_n, (string)$charum_rp], $charum_js);
$charum_p = strripos($output, '</body>');
$output = ($charum_p !== false) ? substr_replace($output, $charum_js, $charum_p, 0) : $output . $charum_js;
