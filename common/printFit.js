/* 차름 공통 모듈: 출력(printFit) — 원본은 common/printFit.js. 앱 안의 <script id="printFit">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   전체 화면이면 먼저 나간 뒤 인쇄(전체 화면에서 바로 인쇄하면 미리보기가 왼쪽 위에 작게 붙음),
   PrintFit.page(방향, 여백mm, 덧붙일 인쇄 CSS) 로 이번 한 번의 종이 방향을 정함(인쇄가 끝나면 원래대로) */
(function(){
  var P=window.print.bind(window);
  function fsEl(){ return document.fullscreenElement||document.webkitFullscreenElement; }
  window.print=function(){
    if(!fsEl()){ P(); return; }
    var done=false; function go(){ if(done) return; done=true; setTimeout(P,300); }
    document.addEventListener('fullscreenchange',go,{once:true});
    document.addEventListener('webkitfullscreenchange',go,{once:true});
    try{ var ex=document.exitFullscreen||document.webkitExitFullscreen; var r=ex&&ex.call(document); if(r&&r.catch) r.catch(go); }catch(e){ go(); }
    setTimeout(go,1200);
  };
  function st(){ var s=document.getElementById('printPage'); if(!s){ s=document.createElement('style'); s.id='printPage'; document.head.appendChild(s); } return s; }
  window.PrintFit={
    orient:function(w,h){ return w>h*1.02?'landscape':'portrait'; },
    /* 종이 안쪽 크기(mm): 이 높이에 맞춰 그림을 꽉 채움 */
    inner:function(o,m){ return o==='landscape'?{w:297-2*m,h:210-2*m}:{w:210-2*m,h:297-2*m}; },
    page:function(o,m,css){ st().textContent='@media print{@page{size:A4 '+o+';margin:'+m+'mm}'+(css||'')+'}'; }
  };
  window.addEventListener('afterprint',function(){ var s=document.getElementById('printPage'); if(s) s.textContent=''; });
})();
