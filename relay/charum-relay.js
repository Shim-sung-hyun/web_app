/* =====================================================================
   차름 사진 다리 — 휴대폰 사진 받기 모듈 (charum-relay.js) · 2026-10-25 판
   연수에서 만든 앱(전자칠판·태블릿 화면)에 이 한 줄을 넣으면, 휴대폰 사진을 QR로 받을 수 있습니다.

     <script src="https://shim-sung-hyun.github.io/web_app/relay/charum-relay.js"></script>

   쓰는 법
     CharumRelay.receive({
       code: '연수 코드',              // 연수에서 받은 코드(꼭)
       onPhoto: function (blob, info) { … },   // 사진이 올 때마다. blob = JPEG 사진, info = {n:몇 번째, name, width, height}
       onDone: function (count) { … },         // (선택) 창을 닫을 때. count = 받은 장 수
       many: true                      // (선택) 한 번 찍고 여러 장(기본). false면 한 장 받고 닫힘
     });
     CharumRelay.pick({code:'…'}).then(function (blob) { … });   // 한 장만 받기(창을 닫으면 null)
     CharumRelay.button(단추, {code:'…', onPhoto:…});           // 단추를 누르면 받기 창

   - 사진은 휴대폰에서 긴 쪽 1600px로 줄이고(위치 정보가 빠짐) 잠가서 보냅니다. 중계 서버(charum.org)는 사진을 열어 볼 수 없고,
     이 화면이 받는 순간 서버에서 지워집니다.
   - 휴대폰에서는 보낸 사진을 차름 사진 모음에 기증할 수도 있습니다(선택, 제작자가 살펴본 뒤 공개).
   - https 주소(GitHub Pages 등)나 컴퓨터에서 바로 연 파일에서 됩니다(잠그는 기능이 http 주소에서는 막힘).
   ===================================================================== */
(function () {
'use strict';
var RELAY = 'https://charum.org/charum-api/relay.php';
var SEND_PAGE = 'https://www.charum.org/study/send.html';
if (window.CHARUM_RELAY_TEST) { RELAY = window.CHARUM_RELAY_TEST.relay || RELAY; SEND_PAGE = window.CHARUM_RELAY_TEST.send || SEND_PAGE; }
/* QR 만들기(차름 공통, 바깥 라이브러리 없이) */
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

var b64u = {
  enc: function (b) { var u = new Uint8Array(b), s = ''; for (var i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec: function (s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
};
/* 열쇠 만들기 — 휴대폰(send.html)과 꼭 같아야 함 */
async function aesFrom(priv, pubRaw, code) {
  var pub = await crypto.subtle.importKey('raw', pubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  var bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, priv, 256);
  var hk = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('charum-relay|' + code), info: new TextEncoder().encode('v1') }, hk, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}
async function call(body) {
  var r = await fetch(RELAY, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), cache: 'no-store' });
  var j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok || j.error) { var er = new Error(j.error || ('http ' + r.status)); er.code = j.error || ('http ' + r.status); throw er; }
  return j;
}
/* 잠금을 푼 내용: "CRL1" + 머리 길이(4바이트) + 머리(JSON) + 사진 */
function unpack(buf) {
  var u = new Uint8Array(buf), head = {};
  if (u.length > 8 && u[0] === 67 && u[1] === 82 && u[2] === 76 && u[3] === 49) {
    var n = (u[4] << 24 | u[5] << 16 | u[6] << 8 | u[7]) >>> 0;
    try { head = JSON.parse(new TextDecoder().decode(u.subarray(8, 8 + n))); } catch (e) {}
    u = u.slice(8 + n);
  }
  return { blob: new Blob([u], { type: head.type === 'image/png' ? 'image/png' : 'image/jpeg' }), head: head };
}

var ERR = {
  pc: '연수 코드가 맞지 않아요. 앱에 넣은 코드를 확인해 주세요.',
  pc_off: '이 연수 코드는 지금 꺼져 있거나 쓰는 기간이 끝났어요.',
  pc_day: '이 연수 코드로 오늘 만들 수 있는 번호를 다 썼어요. 내일 다시 해 주세요.',
  month: '이번 달 중계 서버 사용량이 다 찼어요. 다음 달에 다시 쓸 수 있어요.',
  busy: '지금은 번호를 만들 수 없어요. 잠시 뒤에 다시 해 주세요.',
  insecure: '이 화면은 https 주소에서만 사진을 받을 수 있어요(GitHub Pages 주소나 컴퓨터에서 연 파일은 돼요).',
  nocode: '연수 코드를 넣지 않았어요. CharumRelay.receive({code:"…"}) 처럼 넣어 주세요.'
};

var CSS = '\
#crBox{position:fixed;inset:0;z-index:2147483000;background:rgba(18,26,32,.55);display:flex;align-items:center;justify-content:center;font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#1C2A31;-webkit-text-size-adjust:100%}\
#crBox *{box-sizing:border-box}#crBox{word-break:keep-all}\
#crBox .cr-card{background:#fff;border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:24px 28px 20px;width:min(680px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;text-align:left}\
#crBox h2{margin:0 0 4px;font-size:22px;font-weight:700;color:#1C2A31}\
#crBox .cr-sub{margin:0 0 16px;color:#56666E;font-size:15px;line-height:1.55}\
#crBox .cr-main{display:flex;gap:24px;align-items:center;justify-content:center;flex-wrap:wrap}\
#crBox .cr-qr{background:#fff;border:1px solid #dde5e7;border-radius:14px;padding:6px;line-height:0;width:208px;height:208px}\
#crBox .cr-qr svg{width:100%;height:100%}\
#crBox .cr-right{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-width:230px}\
#crBox .cr-code{font-size:56px;font-weight:700;letter-spacing:.08em;line-height:1;color:var(--cr,#3F6A86);font-variant-numeric:tabular-nums}\
#crBox .cr-steps{margin:0;padding-left:20px;font-size:15px;line-height:1.7;color:#30404a}\
#crBox .cr-url{font-size:14px;color:#1C2A31;font-weight:700;word-break:break-all}\
#crBox .cr-state{margin:14px 0 0;font-size:15px;color:#30404a;min-height:1.6em;text-align:center}\
#crBox .cr-state.err{color:#c62828;font-weight:700}\
#crBox .cr-state.ok{color:#1b7f3a;font-weight:700}\
#crBox .cr-got{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px}\
#crBox .cr-got img{width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid #dde5e7}\
#crBox .cr-btns{display:flex;justify-content:center;gap:10px;margin-top:14px;flex-wrap:wrap}\
#crBox button{font:inherit;font-size:16px;padding:10px 22px;border-radius:12px;border:1px solid #c9d4d8;background:#f4f7f8;color:#1C2A31;cursor:pointer;min-height:48px;touch-action:manipulation}\
#crBox button.cr-pri{background:var(--cr,#3F6A86);border-color:var(--cr,#3F6A86);color:#fff;font-weight:700}\
#crBox .cr-foot{margin:12px 0 0;font-size:12px;color:#7a8a91;text-align:center}\
@media (max-width:560px){#crBox .cr-card{padding:18px 16px}#crBox .cr-code{font-size:44px}#crBox .cr-qr{width:180px;height:180px}}';
function ensureCss() { if (document.getElementById('crCss')) return; var s = document.createElement('style'); s.id = 'crCss'; s.textContent = CSS; document.head.appendChild(s); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

var active = null;
async function receive(opts) {
  opts = opts || {};
  var many = opts.many !== false;
  ensureCss(); close(true);
  var box = document.createElement('div'); box.id = 'crBox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  if (opts.color) box.style.setProperty('--cr', opts.color);
  var shortUrl = SEND_PAGE.replace(/^https?:\/\/(www\.)?/, '');
  box.innerHTML = '<div class="cr-card"><h2>' + esc(opts.title || '휴대폰에서 사진 받기') + '</h2>' +
    '<p class="cr-sub">휴대폰 사진을 이 화면으로 보내요.' + (many ? ' 한 번 찍으면 여러 장을 차례로 보낼 수 있어요.' : '') + '</p>' +
    '<div class="cr-main"><div class="cr-qr" id="crQr"></div><div class="cr-right"><div class="cr-code" id="crCode" aria-label="번호">······</div>' +
    '<ol class="cr-steps"><li>휴대폰 카메라로 QR을 찍어요.<br><small>또는 <span class="cr-url">' + esc(shortUrl) + '</span>에서 번호를 넣어요.</small></li><li>사진을 찍거나 골라요.</li><li><b>보내기</b>를 눌러요.</li></ol></div></div>' +
    '<p class="cr-state" id="crState">번호를 만들고 있어요…</p><div class="cr-got" id="crGot"></div>' +
    '<div class="cr-btns" id="crBtns"><button type="button" id="crClose">닫기</button></div>' +
    '<p class="cr-foot">사진은 잠가서 보내고 받는 순간 지워져요. 중계 서버는 사진을 볼 수 없어요. · 차름 사진 다리</p></div>';
  (document.fullscreenElement || document.webkitFullscreenElement || document.body).appendChild(box);
  var q = function (id) { return box.querySelector('#' + id); };
  var me = active = { box: box, timer: null, tick: null, code: '', sid: '', dead: false, n: 0, opts: opts, end: 0 };
  var say = function (t, cls) { var st = q('crState'); st.textContent = t; st.className = 'cr-state' + (cls ? ' ' + cls : ''); };
  var setBtns = function (again) {
    var b = q('crBtns');
    b.innerHTML = (again ? '<button type="button" class="cr-pri" id="crAgain">' + (me.n ? '더 받기 (새 번호)' : '새 번호 받기') + '</button>' : '') +
      '<button type="button" id="crClose"' + (me.n && !again ? ' class="cr-pri"' : '') + '>' + (me.n ? '다 받았어요' : '닫기') + '</button>';
    if (again) q('crAgain').onclick = function () { var n = me.n; receive(Object.assign({}, opts, { _n: n })).then(function () { if (active) active.n = n; }); };
    q('crClose').onclick = function () { close(); };
  };
  me.n = opts._n || 0;
  setBtns(false);
  box.addEventListener('pointerdown', function (e) { if (e.target === box && !me.n) close(); });
  ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'keydown'].forEach(function (t) { box.addEventListener(t, function (e) { e.stopPropagation(); }); });
  var left = function () { var s = Math.max(0, Math.round((me.end - Date.now()) / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  var waiting = function () { say(me.n ? me.n + '장 받았어요. 더 보내도 돼요 · 남은 시간 ' + left() : '휴대폰에서 보내기를 기다리고 있어요 · 남은 시간 ' + left(), me.n ? 'ok' : ''); };
  try {
    if (!opts.code) { var e0 = new Error('nocode'); e0.code = 'nocode'; throw e0; }
    if (!window.crypto || !crypto.subtle) { var e1 = new Error('insecure'); e1.code = 'insecure'; throw e1; }
    var kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
    var pubRaw = await crypto.subtle.exportKey('raw', kp.publicKey);
    var o = await call({ a: 'open', pc: String(opts.code).toLowerCase(), pub: b64u.enc(pubRaw) });
    if (me.dead) return;
    me.code = o.code; me.sid = o.sid; me.end = Date.now() + (o.ttl || 180) * 1000;
    q('crCode').textContent = o.code.slice(0, 3) + ' ' + o.code.slice(3);
    q('crQr').innerHTML = QR.svg(SEND_PAGE + '#c=' + o.code + (many ? '' : '&one=1') + '&o=' + encodeURIComponent((location.host || 'file').slice(0, 40)), 208);
    waiting();
    me.tick = setInterval(function () {
      if (me.dead) return;
      if (Date.now() > me.end) { stopTimers(me); me.dead = true; say(me.n ? me.n + '장 받았어요. 번호 시간이 끝났어요.' : '시간이 지났어요. 새 번호를 받아 주세요.', me.n ? 'ok' : 'err'); setBtns(true); return; }
      if (!me.busy) waiting();
    }, 1000);
    var poll = async function () {
      if (me.dead) return;
      var r;
      try { r = await call({ a: 'poll', code: me.code, sid: me.sid }); } catch (e) { me.timer = setTimeout(poll, 3000); return; }
      if (me.dead) return;
      if (typeof r.left === 'number') me.end = Date.now() + r.left * 1000;
      if (r.status === 'wait') { me.timer = setTimeout(poll, 1500); return; }
      if (r.status === 'end' || r.status === 'gone') {
        stopTimers(me); me.dead = true; me.sid = '';
        if (r.status === 'end' && me.n) { say(me.n + '장 다 받았어요.', 'ok'); setTimeout(function () { if (active === me) close(); }, 1400); setBtns(false); return; }
        say(me.n ? me.n + '장 받았어요. 번호 시간이 끝났어요.' : '번호가 끝났어요. 새 번호를 받아 주세요.', me.n ? 'ok' : 'err'); setBtns(true); return;
      }
      if (r.status !== 'item') { me.timer = setTimeout(poll, 1500); return; }
      me.busy = true; say('사진을 받았어요. 여는 중이에요…');
      try {
        var key = await aesFrom(kp.privateKey, b64u.dec(r.epub), me.code);
        var plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64u.dec(r.iv) }, key, b64u.dec(r.ct));
        var p = unpack(plain);
        me.n++;
        var url = URL.createObjectURL(p.blob), im = document.createElement('img'); im.src = url; im.alt = me.n + '번째 사진';
        var got = q('crGot'); got.appendChild(im); while (got.children.length > 8) got.removeChild(got.firstChild);
        var info = { n: me.n, name: p.head.name || '', width: p.head.w || 0, height: p.head.h || 0 };
        try { opts.onPhoto && opts.onPhoto(p.blob, info); } catch (e) { console.error(e); }
        if (!many) { me.sid = ''; call({ a: 'close', code: me.code, sid: o.sid }).catch(function () {}); close(); return; }
        setBtns(false);
      } catch (e) { say('사진 한 장을 열지 못했어요. 그 사진만 다시 보내 주세요.', 'err'); }
      me.busy = false;
      if (!me.dead) { if (!r.more) waiting(); me.timer = setTimeout(poll, r.more ? 150 : 1500); }
    };
    me.timer = setTimeout(poll, 1500);
  } catch (e) {
    var c = e && e.code;
    say(ERR[c] || ('중계 서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요. (' + (c || (e && e.name) || 'network') + ')'), 'err');
    if (c !== 'nocode' && c !== 'insecure' && c !== 'pc') setBtns(true);
    if (c === 'nocode' || c === 'pc') console.warn('[CharumRelay] ' + (ERR[c] || c));
  }
}
function stopTimers(me) { clearInterval(me.tick); clearTimeout(me.timer); }
function close(silent) {
  if (!active) return;
  var me = active; active = null; me.dead = true; stopTimers(me);
  if (me.code && me.sid) call({ a: 'close', code: me.code, sid: me.sid }).catch(function () {});
  if (me.box && me.box.parentNode) me.box.parentNode.removeChild(me.box);
  if (!silent) { try { me.opts.onDone && me.opts.onDone(me.n); } catch (e) { console.error(e); } }
}
function pick(opts) {
  return new Promise(function (res) {
    var got = null;
    receive(Object.assign({}, opts || {}, { many: false, onPhoto: function (b) { got = b; }, onDone: function () { res(got); } }));
  });
}
function button(el, opts) {
  if (typeof el === 'string') el = document.querySelector(el);
  if (el) el.addEventListener('click', function () { receive(opts); });
  return el;
}
/* 받은 사진을 그림 주소로(img.src 등에 바로) */
function toDataURL(blob) { return new Promise(function (res, rej) { var f = new FileReader(); f.onload = function () { res(f.result); }; f.onerror = rej; f.readAsDataURL(blob); }); }

window.CharumRelay = { receive: receive, pick: pick, button: button, close: function () { close(); }, toDataURL: toDataURL, version: '2026-10-25' };
})();
