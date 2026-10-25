<?php
/* 차름 기증 사진 탭 (2026-10-25)
   관리자로 로그인했을 때만, 회원 메뉴 목록(회원정보 보기 · 스크랩 보기 · 저장함 보기 …)이 있는 곳에
   "기증 사진 N" 탭을 붙인다. 누르면 서버 루트의 donate-admin.php(관리자만 열림)로 간다.
   기다리는 장 수는 donate.php가 쌓는 donate-data/ 의 파일 수. */
if (!defined('__XE__') && !defined('RX_VERSION')) exit();
if ($called_position !== 'before_display_content') return;
if (Context::getResponseMethod() !== 'HTML' || !is_string($output)) return;
if (!Rhymix\Framework\Session::isAdmin()) return;

$charum_n = count(glob(RX_BASEDIR . 'donate-data/d_*.json') ?: []);
/* Claude가 "다시 볼 사진"으로 돌려보낸 것(비공개 저장소 flagged/ 가운데 아직 정하지 않은 것)도 더함 — 10분마다 한 번만 GitHub에 물어봄 */
$charum_cache = RX_BASEDIR . 'donate-data/flagged-cache.json';
$charum_f = 0;
$charum_c = is_file($charum_cache) ? json_decode((string)@file_get_contents($charum_cache), true) : null;
if (is_array($charum_c) && time() - (int)($charum_c['t'] ?? 0) < 600) { $charum_f = (int)($charum_c['n'] ?? 0); }
elseif (is_file(RX_BASEDIR . 'donate-config.php') && function_exists('curl_init')) {
  $GITHUB_TOKEN = ''; $INBOX_REPO = 'Shim-sung-hyun/charum-inbox';
  include RX_BASEDIR . 'donate-config.php';
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
$charum_js = <<<'JS'
<script>
(function(){
  var N=__N__, URL='/donate-admin.php';
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
      var nli=document.createElement('li'); nli.className=(base.className||'').replace(/\b(active|on|selected|current|cur)\b/g,'').trim();
      var a=document.createElement('a'); var ba=base.querySelector('a');
      a.className=((ba&&ba.className)||'').replace(/\b(active|on|selected|current|cur)\b/g,'').trim();
      a.href=URL; a.setAttribute('data-charum-donate','1'); a.textContent='기증 사진';
      if(N>0){ var b=document.createElement('span'); b.textContent=N;
        b.style.cssText='display:inline-block;min-width:18px;margin-left:6px;padding:0 6px;border-radius:9px;background:#c62828;color:#fff;font-size:12px;line-height:18px;text-align:center;font-weight:700;vertical-align:1px';
        a.appendChild(b); }
      nli.appendChild(a); ul.appendChild(nli);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
})();
</script>
JS;
$charum_js = str_replace('__N__', (string)$charum_n, $charum_js);
$charum_p = strripos($output, '</body>');
$output = ($charum_p !== false) ? substr_replace($output, $charum_js, $charum_p, 0) : $output . $charum_js;
