const {chromium}=require('playwright'); const fs=require('fs');
/* 008 숨은 동물 찾기 검사(2026-11-01, 009 세션): 서식지마다 × 쉬움·보통·어려움 × TRIALS번 실제로 장면을 만들고,
   찾을 동물마다 앞에 놓인 소품·다른 동물에 가려지고 남은 점 수를 셈(그림을 캔버스에 겹쳐 그려서).
     node tools/hide-check.js [TRIALS=5]        (저장소 맨 위에서, playwright 필요)
   결과: 완전히 가려진(보이는 점 60 미만) 동물 목록과 비율, '제 소품만으로' 가려진 것과 '다른 것에' 가려진 것을 나눠 보여 줌 */
const path=require('path');
const ROOT=path.resolve(__dirname,'..')+'/', TRIALS=+process.argv[2]||5;
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1366,height:768}});
 await p.route('https://shim-sung-hyun.github.io/web_app/**',r=>{ const f=ROOT+decodeURIComponent(new URL(r.request().url()).pathname.replace('/web_app/','')); if(fs.existsSync(f)) r.fulfill({path:f,headers:{'access-control-allow-origin':'*'}}); else r.fulfill({status:404,body:''}); });
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('https://shim-sung-hyun.github.io/web_app/008/animal-home.html'); await p.waitForTimeout(1500);
 const res=await p.evaluate(async(TRIALS)=>{
   S.sound=false; speak=()=>Promise.resolve(); await gameReady;
   const byP={}; Object.keys(BUN).forEach(l=>BUN[l].forEach(b=>b.items.forEach(x=>{ (byP[x.p]=byP[x.p]||new Set()).add(x.a); })));
   const cache={}; const load=src=>cache[src]||(cache[src]=new Promise(r=>{ const im=new Image(); im.crossOrigin='anonymous'; im.onload=()=>r(im); im.onerror=()=>r(null); im.src=src; }));
   const out=[];
   document.body.classList.remove('setup');
   for(const pl of Object.keys(byP)){ const animals=[...byP[pl]];
    for(const lv of [1,2,3]) for(let tr=0;tr<TRIALS;tr++){
     const targets=shuffle(animals).slice(0,Math.min(4,animals.length));
     RUN={token:1,bd:{places:[pl],items:targets.map(a=>({a,p:pl}))},lv:1}; const tok=1;
     playHide(pl,lv,targets,tok);
     let card=null; for(let i=0;i<60;i++){ await wait(100); card=document.querySelector('.showCard'); if(card&&card.style.opacity==='1') break; }
     await wait(200); card=document.querySelector('.showCard'); if(!card) continue;
     const W=card.clientWidth,H=card.clientHeight;
     const els=[...card.querySelectorAll('img')].filter(e=>!e.classList.contains('bg'));
     const info=await Promise.all(els.map(async e=>{ const im=await load(e.src); return {e,im,z:+e.style.zIndex||0,animal:e.classList.contains('placed'),a:e.alt}; }));
     for(const A of info.filter(x=>x.animal)){
       const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
       const draw=(o)=>{ const e=o.e, w=parseFloat(e.style.width), h=parseFloat(e.style.height), l=parseFloat(e.style.left), t=parseFloat(e.style.top);
         if(!o.im) return; x.save();
         if(o.animal){ x.drawImage(o.im,l-w/2,t-h/2,w,h); }
         else { if(e.style.transform.includes('scaleX(-1)')){ x.translate(l+w/2,0); x.scale(-1,1); x.translate(-(l+w/2),0); } x.drawImage(o.im,l,t,w,h); }
         x.restore(); };
       draw(A); const d0=x.getImageData(0,0,W,H).data; let n0=0; for(let i=3;i<d0.length;i+=4) if(d0[i]>128) n0++;
       x.globalCompositeOperation='destination-out';
       const occ=info.filter(o=>o!==A&&o.z>A.z), cnt=()=>{ const d=x.getImageData(0,0,W,H).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]>128) n++; return n; };
       const own=occ.filter(o=>!o.animal&&Math.abs(o.z-A.z)===1); own.forEach(draw); const nOwn=cnt();
       occ.filter(o=>!own.includes(o)).forEach(draw); const n1=cnt();
       out.push({pl,lv,a:A.a,target:targets.includes(A.a),n0,own:nOwn,vis:n1,frac:n0?n1/n0:0,ok:!!A.im,anim:A.e.complete&&A.e.naturalWidth>0});
     }
     RUN.token=99; await wait(50); clearStage();
    } }
   return out; },TRIALS);
 const t=res.filter(x=>x.target), hid=t.filter(x=>x.vis<60);
 [1,2,3].forEach(lv=>{ const a=t.filter(x=>x.lv===lv), z=a.filter(x=>x.vis<60); console.log(['','쉬움','보통','어려움'][lv]+': 찾을 동물 '+a.length+' 중 완전히 가려짐 '+z.length+' ('+Math.round(100*z.length/Math.max(1,a.length))+'%), 제 소품만으로 '+z.filter(x=>x.own<60).length); });
 hid.sort((x,y)=>x.vis-y.vis).forEach(x=>console.log('  '+x.pl+' '+['','쉬움','보통','어려움'][x.lv]+' '+x.a+' · 원래 '+x.n0+'점 → 제 소품 뒤 '+x.own+' → 최종 '+x.vis)); await b.close(); })();
