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
