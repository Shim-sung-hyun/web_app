/* 차름 공통 모듈: 휴대폰에서 사진 받기(photoRelay) — 원본은 common/photoRelay.js. 앱 안의 <script id="photoRelay">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   번호·단추 색은 앱이 :root에 --relay-accent 로 넘겨 준다(없으면 청록 #17766F). */
/* ===== 휴대폰으로 사진 받기 (전자칠판 쪽) — key-relay와 같은 방식 =====
   전자칠판이 번호 4자리 + 공개 열쇠를 맡기면, 휴대폰(photo-send.html)이 사진을 잠가서 보내고,
   전자칠판이 받는 순간 서버에서 지워짐. 서버는 사진을 볼 수 없음.
   2026-10-26: opts.max(1~12)로 번호 하나에 여러 장 — QR은 한 번만 찍고, 한 장씩 onPhoto(blob, n). 휴대폰이 "다 보냈습니다"를 누르거나
   max장을 받으면 저절로 닫힘, 한 장이라도 받으면 "다 받았습니다" 단추. */
(function(){
const RELAY='https://charum.org/charum-api/photo-relay.php';
const SEND_PAGE='https://shim-sung-hyun.github.io/web_app/photo-send.html';
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

const b64u={ enc:b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),
  dec:s=>{ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; const bin=atob(s), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u; } };
async function aesFrom(priv,pubRaw,code){
  const pub=await crypto.subtle.importKey('raw',pubRaw,{name:'ECDH',namedCurve:'P-256'},false,[]);
  const bits=await crypto.subtle.deriveBits({name:'ECDH',public:pub},priv,256);
  const hk=await crypto.subtle.importKey('raw',bits,'HKDF',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new TextEncoder().encode('webapp-photo-relay|'+code),info:new TextEncoder().encode('v1')},hk,{name:'AES-GCM',length:256},false,['decrypt']);
}
async function call(body){
  const r=await fetch(RELAY,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(body),cache:'no-store'});
  let j={}; try{ j=await r.json(); }catch(e){}
  if(!r.ok||j.error) throw Object.assign(new Error(j.error||('http'+r.status)),{code:j.error||('http '+r.status)});
  return j;
}
const CSS=`
#prBox{position:fixed;inset:0;z-index:2147483000;background:rgba(20,30,34,.55);display:flex;align-items:center;justify-content:center;font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;color:#1C2A31}
#prBox .pr-card{background:#fff;border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:26px 30px 22px;width:min(660px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box}
#prBox h2{margin:0 0 4px;font-size:22px}
#prBox .pr-sub{margin:0 0 18px;color:#56666E;font-size:15px;line-height:1.55}
#prBox .pr-note{margin:-8px 0 16px;padding:10px 14px;border-radius:12px;background:#EEF3F6;color:#2F4556;font-size:15px;line-height:1.55}
#prBox .pr-main{display:flex;gap:26px;align-items:center;justify-content:center;flex-wrap:wrap}
#prBox .pr-qr{background:#fff;border:1px solid #dde5e7;border-radius:14px;padding:6px;line-height:0;width:196px;height:196px;box-sizing:content-box}
#prBox .pr-code{font-family:'Jua','Noto Sans KR',sans-serif;font-size:78px;letter-spacing:.14em;line-height:1;color:var(--relay-accent,#17766F);text-align:center;padding-left:.14em}
#prBox .pr-codebox{display:flex;flex-direction:column;align-items:center;gap:10px}
#prBox .pr-steps{margin:0;padding-left:20px;font-size:15px;line-height:1.7;color:#30404a}
#prBox .pr-url{font-size:13px;color:#56666E;word-break:break-all}
#prBox .pr-state{margin:16px 0 0;font-size:15px;color:#30404a;min-height:1.6em;text-align:center}
#prBox .pr-state.err{color:#c62828;font-weight:700}
#prBox .pr-btns{display:flex;justify-content:center;gap:10px;margin-top:14px}
#prBox button{font:inherit;font-size:16px;padding:10px 22px;border-radius:12px;border:1px solid #c9d4d8;background:#f4f7f8;color:#1C2A31;cursor:pointer;min-height:44px}
#prBox button.pr-pri{background:var(--relay-accent,#17766F);border-color:var(--relay-accent,#17766F);color:#fff}
`;
function ensureCss(){ if(document.getElementById('prCss')) return; const s=document.createElement('style'); s.id='prCss'; s.textContent=CSS; document.head.appendChild(s); }
let active=null;
async function receive(opts){
  opts=opts||{}; ensureCss(); close();
  const MAX=Math.max(1,Math.min(12,opts.max||1));   /* 번호 하나로 받을 장 수(2026-10-26 여러 장) */
  const box=document.createElement('div'); box.id='prBox'; box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true');
  box.innerHTML=`<div class="pr-card"><h2>휴대폰에서 사진 받기</h2>
    <p class="pr-sub">휴대폰으로 찍은 사진을 이 화면으로 보냅니다. 사진은 잠가서 보내고, 중계 서버도 사진을 볼 수 없습니다.</p>${opts.note?'<p class="pr-note">'+opts.note+'</p>':''}
    <div class="pr-main"><div class="pr-qr" id="prQr"></div>
      <div class="pr-codebox"><div class="pr-code" id="prCode">····</div>
        <ol class="pr-steps"><li>휴대폰 카메라로 QR을 찍어요.</li><li>사진을 찍거나 골라요.<br><small>잘 나온 사진은 <b>기증(선택)</b>에도 체크해 주세요.</small></li>${(opts.want||[]).includes('gemini')?'<li>처음 한 번은 <b>Gemini 키</b>도 넣어요.<br><small>키가 없으면 그 화면의 "키 받는 법"(1~2분)</small></li>':''}<li><b>보내기</b>를 눌러요.${MAX>1?"<br><small>"+MAX+"장까지 한 번에 보낼 수 있어요.</small>":""}</li></ol></div></div>
    <p class="pr-state" id="prState">번호를 만들고 있어요…</p>
    <div class="pr-btns"><button type="button" id="prCancel">닫기</button></div></div>`;
  document.body.appendChild(box);
  const st=box.querySelector('#prState'), stop=()=>close();
  box.querySelector('#prCancel').onclick=stop;
  box.addEventListener('pointerdown',e=>{ if(e.target===box) stop(); });
  ['pointerdown','pointerup','click','touchstart','touchend','mousedown','mouseup'].forEach(t=>box.addEventListener(t,e=>e.stopPropagation()));
  const me=active={box,timer:null,tick:null,code:'',sid:'',dead:false};
  const say=(t,cls)=>{ st.textContent=t; st.className='pr-state'+(cls?' '+cls:''); };
  const retry=()=>{ const b=box.querySelector('.pr-btns'); b.innerHTML='<button type="button" class="pr-pri" id="prAgain">새 번호 받기</button><button type="button" id="prCancel2">닫기</button>';
    b.querySelector('#prAgain').onclick=()=>receive(opts); b.querySelector('#prCancel2').onclick=stop; };
  try{
    if(!window.crypto||!crypto.subtle) throw Object.assign(new Error('insecure'),{code:'insecure'});
    const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
    const pubRaw=await crypto.subtle.exportKey('raw',kp.publicKey);
    const o=await call({a:'open',pub:b64u.enc(pubRaw),max:MAX});
    if(me.dead) return;
    me.code=o.code; me.sid=o.sid;
    box.querySelector('#prCode').textContent=o.code;
    const want=(opts.want||[]).filter(x=>x==='gemini'||x==='cloud');
    box.querySelector('#prQr').innerHTML=QR.svg(SEND_PAGE+'#c='+o.code+(want.length?'&k='+want.join(','):'')+(opts.app?'&app='+opts.app:''),196);
    let end=Date.now()+(o.ttl||180)*1000, got=0;
    const left=()=>{ const s=Math.max(0,Math.round((end-Date.now())/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
    const waitMsg=()=>got?`${got}장 받았습니다. 더 보내도 됩니다`+(MAX>1?` (${MAX}장까지)`:'')+` · 남은 시간 ${left()}`:'휴대폰에서 보내기를 기다리고 있어요 · 남은 시간 '+left();
    const finishBtn=()=>{ const b=box.querySelector('.pr-btns'); if(b.querySelector('#prDone')) return;
      b.innerHTML='<button type="button" class="pr-pri" id="prDone">다 받았습니다</button>'; b.querySelector('#prDone').onclick=stop; };
    const finish=()=>{ clearInterval(me.tick); clearTimeout(me.timer); me.dead=true;
      say(got?`${got}장 받았습니다.`:'휴대폰에서 다 보냈어요.'); setTimeout(()=>{ if(active===me) close(); },got?1200:600); };
    say(waitMsg());
    me.tick=setInterval(()=>{ if(Date.now()>end){ clearInterval(me.tick); clearTimeout(me.timer); me.dead=true;
        if(got){ say(`${got}장 받았습니다. 시간이 다 되어 받기를 마쳤습니다.`); setTimeout(()=>{ if(active===me) close(); },1500); }
        else { say('시간이 지났어요. 새 번호를 받아 주세요.','err'); retry(); } return; }
      if(!me.busy) say(waitMsg()); },1000);
    const poll=async()=>{
      if(me.dead) return;
      let r; try{ r=await call({a:'poll',code:me.code,sid:me.sid}); }catch(e){ me.timer=setTimeout(poll,3000); return; }
      if(me.dead) return;
      if(r.ttl) end=Date.now()+r.ttl*1000;
      if(r.status==='wait'){ me.timer=setTimeout(poll,1500); return; }
      if(r.status==='end'){ finish(); return; }
      if(r.status!=='done'){ clearInterval(me.tick); me.dead=true; if(got){ finish(); return; } say('번호가 끝났어요. 새 번호를 받아 주세요.','err'); retry(); return; }
      me.busy=true; say(`사진을 받았어요. 여는 중이에요… (${got+1}장째)`);
      try{
        const key=await aesFrom(kp.privateKey,b64u.dec(r.epub),me.code);
        const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64u.dec(r.iv)},key,b64u.dec(r.ct));
        /* 휴대폰이 키도 함께 보냈으면: "CHRM" + 판(1) + JSON 길이(4바이트) + JSON + 사진 */
        let u=new Uint8Array(plain), keys=null;
        if(u.length>9&&u[0]===67&&u[1]===72&&u[2]===82&&u[3]===77&&u[4]===1){
          const n=(u[5]<<24|u[6]<<16|u[7]<<8|u[8])>>>0;
          try{ keys=JSON.parse(new TextDecoder().decode(u.slice(9,9+n))); }catch(e){}
          u=u.slice(9+n);
        }
        const blob=new Blob([u],{type:'image/jpeg'});
        got++;
        try{ if(keys&&opts.onKeys) opts.onKeys(keys); }catch(e){ console.error(e); }
        try{ if(opts.onPhoto) await opts.onPhoto(blob,got); }catch(e){ console.error(e); }
      }catch(e){ console.error(e); }
      me.busy=false;
      if(me.dead) return;
      if(MAX===1||r.end||got>=MAX){ finish(); return; }
      finishBtn(); say(waitMsg());
      me.timer=setTimeout(poll,r.more?50:1500);
    };
    me.timer=setTimeout(poll,1500);
  }catch(e){
    const c=e&&e.code;
    say(c==='insecure'?'이 화면은 https 주소에서만 사진을 받을 수 있어요.':c==='busy'||c===429?'지금은 번호를 만들 수 없어요. 잠시 뒤에 다시 해 주세요.':c==='origin'?'중계 서버가 이 주소의 요청을 받지 않아요(origin).':'중계 서버에 연결할 수 없어요. ('+(c||(e&&e.name)||'network')+')','err');
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
window.PhotoRelay={receive,close};
})();
