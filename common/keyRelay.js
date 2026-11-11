/* 차름 공통 모듈: 휴대폰으로 키 받기(keyRelay) — 원본은 common/keyRelay.js. 앱 안의 <script id="keyRelay">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다. */
/* ===== 휴대폰으로 키 받기 (전자칠판 쪽) — 공통 모듈 ===== */
(function(){
const RELAY='https://charum.org/charum-api/key-relay.php';
/* 중계 서버 주소를 넣기 전에는 "휴대폰으로 받기" 단추를 감춤 */
const READY=/^https?:\/\//.test(RELAY);
const SEND_PAGE='https://shim-sung-hyun.github.io/web_app/key-send.html';

/* --- 작은 QR 만들기(바이트 모드, 오류 정정 M, 1~10판) --- */
const QR=(function(){
  const EXP=new Array(512), LOG=new Array(256); let x=1;
  for(let i=0;i<255;i++){ EXP[i]=x; LOG[x]=i; x<<=1; if(x&256) x^=0x11d; }
  for(let i=255;i<512;i++) EXP[i]=EXP[i-255];
  const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
  function rsGen(n){ let g=[1]; for(let i=0;i<n;i++){ const ng=new Array(g.length+1).fill(0); for(let j=0;j<g.length;j++){ ng[j]^=g[j]; ng[j+1]^=mul(g[j],EXP[i]); } g=ng; } return g; }
  function rsRem(data,n){ const g=rsGen(n), r=new Array(n).fill(0); for(const d of data){ const f=d^r.shift(); r.push(0); for(let i=0;i<n;i++) r[i]^=mul(g[i+1],f); } return r; }
  /* 판마다 [블록당 오류정정 수, 블록 수 그룹1, 그룹1 데이터 수, 블록 수 그룹2, 그룹2 데이터 수] (M) */
  const T=[null,[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],[16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44]];
  const ALIGN=[null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
  function make(text){
    const bytes=Array.from(new TextEncoder().encode(text));
    let v=1; for(;v<=9;v++){ const t=T[v], cap=t[1]*t[2]+t[3]*t[4]; if(4+(v<10?8:16)+bytes.length*8<=cap*8) break; }
    if(v>9) throw new Error('too long');
    const t=T[v], cap=t[1]*t[2]+t[3]*t[4];
    const bits=[]; const put=(val,n)=>{ for(let i=n-1;i>=0;i--) bits.push((val>>>i)&1); };
    put(4,4); put(bytes.length,v<10?8:16); bytes.forEach(b=>put(b,8));
    put(0,Math.min(4,cap*8-bits.length)); while(bits.length%8) bits.push(0);
    const data=[]; for(let i=0;i<bits.length;i+=8){ let b=0; for(let j=0;j<8;j++) b=(b<<1)|bits[i+j]; data.push(b); }
    for(let p=0;data.length<cap;p++) data.push(p%2?0x11:0xEC);
    const blocks=[], ecs=[]; let k=0;
    for(let g=0;g<2;g++) for(let b=0;b<t[1+g*2];b++){ const d=data.slice(k,k+t[2+g*2]); k+=d.length; blocks.push(d); ecs.push(rsRem(d,t[0])); }
    const all=[]; const maxD=Math.max(...blocks.map(b=>b.length));
    for(let i=0;i<maxD;i++) for(const b of blocks) if(i<b.length) all.push(b[i]);
    for(let i=0;i<t[0];i++) for(const e of ecs) all.push(e[i]);
    const N=17+v*4, M=[], F=[]; for(let i=0;i<N;i++){ M.push(new Array(N).fill(0)); F.push(new Array(N).fill(false)); }
    const set=(r,c,val)=>{ M[r][c]=val?1:0; F[r][c]=true; };
    const finder=(r,c)=>{ for(let i=-1;i<=7;i++) for(let j=-1;j<=7;j++){ const rr=r+i, cc=c+j; if(rr<0||cc<0||rr>=N||cc>=N) continue;
      const on=(i>=0&&i<=6&&(j===0||j===6))||(j>=0&&j<=6&&(i===0||i===6))||(i>=2&&i<=4&&j>=2&&j<=4); set(rr,cc,on); } };
    finder(0,0); finder(0,N-7); finder(N-7,0);
    for(let i=8;i<N-8;i++){ set(6,i,i%2===0); set(i,6,i%2===0); }
    const al=ALIGN[v], L=al[al.length-1]; for(const r of al) for(const c of al){ if((r===6&&c===6)||(r===6&&c===L)||(r===L&&c===6)) continue; for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++) set(r+i,c+j,Math.max(Math.abs(i),Math.abs(j))!==1); }
    set(N-8,8,1);
    for(let i=0;i<9;i++){ if(!F[8][i]) F[8][i]=true; if(!F[i][8]) F[i][8]=true; }
    for(let i=0;i<8;i++){ F[8][N-1-i]=true; F[N-1-i][8]=true; }
    if(v>=7){ for(let i=0;i<6;i++) for(let j=0;j<3;j++){ F[i][N-11+j]=true; F[N-11+j][i]=true; } }
    const dbits=[]; all.forEach(b=>{ for(let i=7;i>=0;i--) dbits.push((b>>>i)&1); });
    let bi=0, up=true;
    for(let c=N-1;c>0;c-=2){ if(c===6) c=5;
      for(let n=0;n<N;n++){ const r=up?N-1-n:n; for(let d=0;d<2;d++){ const cc=c-d; if(F[r][cc]) continue; M[r][cc]=bi<dbits.length?dbits[bi++]:0; } }
      up=!up; }
    const masks=[(r,c)=>(r+c)%2===0,(r)=>r%2===0,(r,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,(r,c)=>(r*c)%2+(r*c)%3===0,(r,c)=>((r*c)%2+(r*c)%3)%2===0,(r,c)=>((r+c)%2+(r*c)%3)%2===0];
    function fmt(Mx,mask){ let d=(0<<3)|mask; /* M = 00 */ let rem=d; for(let i=0;i<10;i++) rem=(rem<<1)^((rem>>>9)*0x537); const f=((d<<10)|rem)^0x5412;
      const b=i=>(f>>>i)&1;
      for(let i=0;i<=5;i++) Mx[i][8]=b(i); Mx[7][8]=b(6); Mx[8][8]=b(7); Mx[8][7]=b(8); for(let i=9;i<15;i++) Mx[8][14-i]=b(i);
      for(let i=0;i<8;i++) Mx[8][N-1-i]=b(i); for(let i=8;i<15;i++) Mx[N-15+i][8]=b(i);
      Mx[N-8][8]=1;
      if(v>=7){ let rv=v; for(let i=0;i<12;i++) rv=(rv<<1)^((rv>>>11)*0x1f25); const vb=(v<<12)|rv;
        for(let i=0;i<18;i++){ const bit=(vb>>>i)&1, a=N-11+(i%3), bb=Math.floor(i/3); Mx[bb][a]=bit; Mx[a][bb]=bit; } } }
    function penalty(Mx){ let p=0;
      for(let r=0;r<N;r++){ let run=1; for(let c=1;c<N;c++){ if(Mx[r][c]===Mx[r][c-1]){ run++; if(run===5) p+=3; else if(run>5) p++; } else run=1; } }
      for(let c=0;c<N;c++){ let run=1; for(let r=1;r<N;r++){ if(Mx[r][c]===Mx[r-1][c]){ run++; if(run===5) p+=3; else if(run>5) p++; } else run=1; } }
      for(let r=0;r<N-1;r++) for(let c=0;c<N-1;c++){ const s=Mx[r][c]+Mx[r+1][c]+Mx[r][c+1]+Mx[r+1][c+1]; if(s===0||s===4) p+=3; }
      const pat=[1,0,1,1,1,0,1,0,0,0,0], pat2=[0,0,0,0,1,0,1,1,1,0,1];
      for(let r=0;r<N;r++) for(let c=0;c+11<=N;c++){ let a=true,b=true,a2=true,b2=true; for(let k=0;k<11;k++){ if(Mx[r][c+k]!==pat[k]) a=false; if(Mx[r][c+k]!==pat2[k]) b=false; if(Mx[c+k][r]!==pat[k]) a2=false; if(Mx[c+k][r]!==pat2[k]) b2=false; } p+=40*(a+b+a2+b2); }
      let dark=0; for(let r=0;r<N;r++) for(let c=0;c<N;c++) dark+=Mx[r][c]; p+=Math.floor(Math.abs(dark*20-N*N*10)/(N*N))*10; return p; }
    let best=null, bp=1e9;
    for(let m=0;m<8;m++){ const Mx=M.map(r=>r.slice()); for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(!F[r][c]&&masks[m](r,c)) Mx[r][c]^=1; fmt(Mx,m); const p=penalty(Mx); if(p<bp){ bp=p; best=Mx; } }
    return best;
  }
  function svg(text,px){ const m=make(text), N=m.length, q=4, S=N+q*2; let d='';
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(m[r][c]) d+=`M${c+q} ${r+q}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR 코드"><rect width="${S}" height="${S}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`; }
  return {make,svg};
})();

/* --- 자물쇠(ECDH P-256 → HKDF → AES-GCM) --- */
const b64u={ enc:b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),
  dec:s=>{ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); } };
async function aesFrom(priv,pubRaw,code){
  const pub=await crypto.subtle.importKey('raw',pubRaw,{name:'ECDH',namedCurve:'P-256'},false,[]);
  const bits=await crypto.subtle.deriveBits({name:'ECDH',public:pub},priv,256);
  const hk=await crypto.subtle.importKey('raw',bits,'HKDF',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new TextEncoder().encode('webapp-key-relay|'+code),info:new TextEncoder().encode('v1')},hk,{name:'AES-GCM',length:256},false,['decrypt']);
}
async function call(body){
  const r=await fetch(RELAY,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(body),cache:'no-store'});
  let j={}; try{ j=await r.json(); }catch(e){}
  if(!r.ok||j.error) throw Object.assign(new Error(j.error||('http'+r.status)),{code:j.error||('http '+r.status)});
  return j;
}

/* --- 화면 --- */
const CSS=`
#krBox{position:fixed;inset:0;z-index:2147483000;background:rgba(20,24,40,.55);display:flex;align-items:center;justify-content:center;font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;color:#1d2133}
#krBox .kr-card{background:#fff;border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:26px 30px 22px;width:min(640px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box}
#krBox h2{margin:0 0 4px;font-size:22px}
#krBox .kr-sub{margin:0 0 18px;color:#5b6077;font-size:15px;line-height:1.55}
#krBox .kr-main{display:flex;gap:26px;align-items:center;justify-content:center;flex-wrap:wrap}
#krBox .kr-qr{box-sizing:content-box;background:#fff;border:1px solid #e3e5ee;border-radius:14px;padding:6px;line-height:0}
#krBox .kr-code{font-family:'Jua','Noto Sans KR',sans-serif;font-size:78px;letter-spacing:.14em;line-height:1;color:#1E4396;text-align:center;padding-left:.14em}
#krBox .kr-codebox{display:flex;flex-direction:column;align-items:center;gap:10px}
#krBox .kr-steps{margin:0;padding-left:20px;font-size:15px;line-height:1.7;color:#30344a}
#krBox .kr-url{font-size:13px;color:#5b6077;word-break:break-all}
#krBox .kr-state{margin:16px 0 0;font-size:15px;color:#30344a;min-height:1.6em;text-align:center}
#krBox .kr-state.err{color:#c62828;font-weight:700}
#krBox .kr-state.ok{color:#1b7f3a;font-weight:700}
#krBox .kr-btns{display:flex;justify-content:center;gap:10px;margin-top:14px}
#krBox button{font:inherit;font-size:16px;padding:10px 22px;border-radius:12px;border:1px solid #c9cde0;background:#f4f5fa;color:#1d2133;cursor:pointer;min-height:44px}
#krBox button.kr-pri{background:#2C5FCF;border-color:#2C5FCF;color:#fff}
html:not(.kr-ready) .kr-open{display:none!important}
#krBox .kr-done{text-align:center}
#krBox .kr-big{width:84px;height:84px;margin:6px auto 12px;border-radius:50%;background:#e7f5ec;color:#1b7f3a;font-size:52px;line-height:84px;font-weight:700}
#krBox .kr-done h2{font-size:26px;margin:0 0 14px}
#krBox .kr-list{list-style:none;margin:0 auto 14px;padding:0;display:inline-flex;flex-direction:column;gap:10px;text-align:left}
#krBox .kr-list li{display:flex;align-items:center;gap:10px;font-size:18px}
#krBox .kr-list .kr-ok{color:#1b7f3a;font-weight:700}
#krBox .kr-list code{font-family:ui-monospace,Menlo,monospace;font-size:18px;background:#f1f3f8;border-radius:8px;padding:3px 10px;color:#30344a}
.kr-open{font:inherit;font-size:14px;padding:6px 12px;border-radius:10px;border:1px solid #9fb3e6;background:#eef3ff;color:#1E4396;cursor:pointer;white-space:nowrap;min-height:36px}
`;
function ensureCss(){ if(document.getElementById('krCss')) return; const s=document.createElement('style'); s.id='krCss'; s.textContent=CSS; document.head.appendChild(s); }

function mask(k){ return '••••'+esc(k.slice(-4)); }
function esc(t){ return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
/* 받은 뒤: 저절로 닫지 않고 완료 화면을 보여 줌(교사가 고개를 들었을 때도 남아 있게) */
function showDone(box,got,stop){
  const rows=[['gemini','Gemini 키'],['cloud','Google 음성 키 (Cloud)']].filter(([k])=>got[k])
    .map(([k,l])=>`<li><span class="kr-ok">✓</span><b>${l}</b><code>${mask(got[k])}</code></li>`).join('');
  box.querySelector('.kr-card').innerHTML=`<div class="kr-done"><div class="kr-big" aria-hidden="true">✓</div><h2>키를 받았어요</h2>
    <ul class="kr-list">${rows}</ul>
    <p class="kr-sub">끝 네 자리가 휴대폰에서 보낸 키와 같은지 보세요. 받은 키는 이 기기에 저장했어요.</p>
    <div class="kr-btns"><button type="button" class="kr-pri" id="krOk">확인</button></div></div>`;
  const ok=box.querySelector('#krOk'); ok.onclick=stop; try{ ok.focus({preventScroll:true}); }catch(e){}
}

let active=null;
async function receive(opts){
  opts=opts||{}; ensureCss(); close();
  const box=document.createElement('div'); box.id='krBox'; box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true');
  box.innerHTML=`<div class="kr-card"><h2>휴대폰으로 키 받기</h2>
    <p class="kr-sub">키를 휴대폰에서 이 화면으로 보내요. 키는 잠가서 보내고, 중계 서버는 키를 볼 수 없어요.</p>
    <div class="kr-main"><div class="kr-qr" id="krQr" style="width:196px;height:196px;box-sizing:content-box"></div>
      <div class="kr-codebox"><div class="kr-code" id="krCode">····</div>
        <ol class="kr-steps"><li>휴대폰으로 QR을 찍거나<br><span class="kr-url">${SEND_PAGE.replace('https://','')}</span> 를 열어요.</li><li>위 번호 4자리와 키를 넣고 <b>보내기</b>.</li></ol></div></div>
    <p class="kr-state" id="krState">번호를 만들고 있어요…</p>
    <div class="kr-btns"><button type="button" id="krCancel">닫기</button></div></div>`;
  document.body.appendChild(box);
  const st=box.querySelector('#krState'), stop=()=>close();
  box.querySelector('#krCancel').onclick=stop;
  box.addEventListener('pointerdown',e=>{ if(e.target===box) stop(); });
  /* 이 창을 누른 것이 뒤의 앱(전체 화면 들어가기, 다음으로 넘어가기 등)에 닿지 않게 */
  ['pointerdown','pointerup','click','touchstart','touchend','mousedown','mouseup'].forEach(t=>box.addEventListener(t,e=>e.stopPropagation()));
  const me=active={box,timer:null,tick:null,code:'',sid:'',dead:false};
  const say=(t,cls)=>{ st.textContent=t; st.className='kr-state'+(cls?' '+cls:''); };
  const retry=()=>{ const b=box.querySelector('.kr-btns'); b.innerHTML='<button type="button" class="kr-pri" id="krAgain">다시 받기</button><button type="button" id="krCancel2">닫기</button>';
    b.querySelector('#krAgain').onclick=()=>receive(opts); b.querySelector('#krCancel2').onclick=stop; };
  try{
    if(!window.crypto||!crypto.subtle) throw Object.assign(new Error('insecure'),{code:'insecure'});
    const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
    const pubRaw=await crypto.subtle.exportKey('raw',kp.publicKey);
    const o=await call({a:'open',pub:b64u.enc(pubRaw),want:(opts.want||['cloud','gemini']).join(',')});
    if(me.dead) return;
    me.code=o.code; me.sid=o.sid;
    box.querySelector('#krCode').textContent=o.code;
    box.querySelector('#krQr').innerHTML=QR.svg(SEND_PAGE+'#c='+o.code+'&w='+(opts.want||['cloud','gemini']).join(','),196);
    const end=Date.now()+(o.ttl||180)*1000;
    const left=()=>{ const s=Math.max(0,Math.round((end-Date.now())/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
    say('휴대폰에서 보내기를 기다리고 있어요 · 남은 시간 '+left());
    me.tick=setInterval(()=>{ if(Date.now()>end){ clearInterval(me.tick); clearTimeout(me.timer); me.dead=true; say('시간이 지났어요. 다시 받아 주세요.','err'); retry(); return; }
      say('휴대폰에서 보내기를 기다리고 있어요 · 남은 시간 '+left()); },1000);
    const poll=async()=>{
      if(me.dead) return;
      let r; try{ r=await call({a:'poll',code:me.code,sid:me.sid}); }catch(e){ me.timer=setTimeout(poll,3000); return; }
      if(me.dead) return;
      if(r.status==='wait'){ me.timer=setTimeout(poll,2000); return; }
      if(r.status!=='done'){ clearInterval(me.tick); me.dead=true; say('번호가 끝났어요. 다시 받아 주세요.','err'); retry(); return; }
      clearInterval(me.tick); me.dead=true;
      try{
        const key=await aesFrom(kp.privateKey,b64u.dec(r.epub),me.code);
        const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64u.dec(r.iv)},key,b64u.dec(r.ct));
        const k=JSON.parse(new TextDecoder().decode(plain))||{};
        const got={}; if(typeof k.cloud==='string'&&k.cloud.trim()) got.cloud=k.cloud.trim(); if(typeof k.gemini==='string'&&k.gemini.trim()) got.gemini=k.gemini.trim();
        /* 두 키를 모두 이 기기에 남겨 두어, 다른 앱(예: 001 Gemini)을 열 때도 채워지게 함 */
        if(got.gemini){ try{ localStorage.setItem('webapp.geminiKey',got.gemini); }catch(e){} }
        if(got.cloud){ try{ localStorage.setItem('webapp.cloudKey',got.cloud); }catch(e){} }
        const want=opts.want||['cloud','gemini']; const useful=want.filter(w=>got[w]);
        if(!useful.length){ say(want.includes('gemini')&&!want.includes('cloud')?'Gemini 키가 오지 않았어요. 휴대폰에서 Gemini 키를 넣어 보내 주세요.':'Cloud 키가 오지 않았어요. 휴대폰에서 Cloud 키를 넣어 보내 주세요.','err'); retry(); return; }
        me.sid=''; /* 받아 갔다는 표시는 서버에 남겨 휴대폰이 확인하게 함(닫을 때 지우지 않음) */
        try{ opts.onKeys&&opts.onKeys(got); }catch(e){ console.error(e); }
        showDone(box,got,stop);
      }catch(e){ say('키를 풀지 못했어요. 다시 받아 주세요.','err'); retry(); }
    };
    me.timer=setTimeout(poll,1500);
  }catch(e){
    const c=e&&e.code;
    say(c==='insecure'?'이 화면은 https 주소에서만 키를 받을 수 있어요.':c==='busy'||c===429?'지금은 번호를 만들 수 없어요. 잠시 뒤에 다시 해 주세요.':c==='origin'?'중계 서버가 이 주소의 요청을 받지 않아요(origin). key-relay.php 맨 위 설정을 확인해 주세요.':'중계 서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요. ('+(c||(e&&e.name)||'network')+')','err');
    retry();
  }
}
function close(){
  if(!active) return; const me=active; active=null; me.dead=true;
  clearInterval(me.tick); clearTimeout(me.timer);
  if(me.code&&me.sid) call({a:'close',code:me.code,sid:me.sid}).catch(()=>{});
  me.box.remove();
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&active) close(); },true);
/* 모든 앱이 함께 쓰는 키 자리(webapp.cloudKey·webapp.geminiKey): 앱이 키를 저장하거나 지울 때 같이 맞춤 */
function share(kind,val){ const k=kind==='gemini'?'webapp.geminiKey':'webapp.cloudKey'; try{ val?localStorage.setItem(k,val):localStorage.removeItem(k); }catch(e){} return val; }
window.KeyRelay={receive,close,QR,share,button:(label)=>`<button type="button" class="kr-open" data-kr="1">${label||'📱 휴대폰으로 받기'}</button>`};
ensureCss();
if(READY) document.documentElement.classList.add('kr-ready'); /* body 클래스를 통째로 바꾸는 앱이 있어 html에 붙임 */
})();
