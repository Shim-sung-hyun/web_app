const {chromium}=require('playwright'); const fs=require('fs');
/* 008 숨은 동물 찾기 검사(2026-11-01, 009 세션): 서식지마다 × 쉬움·보통·어려움 × TRIALS번 실제로 장면을 만들고,
   찾을 동물마다 앞에 놓인 소품·다른 동물에 가려지고 남은 점 수를 셈(그림을 캔버스에 겹쳐 그려서).
     node tools/hide-check.js [TRIALS=5]        (저장소 맨 위에서, playwright 필요)
   결과: 완전히 가려진(보이는 점 60 미만) 동물 목록과 비율, '제 소품만으로' 가려진 것과 '다른 것에' 가려진 것을 나눠 보여 줌.
   2026-11-01(008 세션): 실제 크기에 맞는 소품이 없어 크기를 무시한 경우도 셈. 보이는 몫이 어렵기마다 목표 범위(쉬움 50~65% · 보통 25~35% · 어려움 10~18%, ±5) 안에 드는 비율도 보여 줌 */
const path=require('path');
const ROOT=path.resolve(__dirname,'..')+'/', TRIALS=+process.argv[2]||5;
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1366,height:768}});
 await p.route('https://shim-sung-hyun.github.io/web_app/**',r=>{ const f=ROOT+decodeURIComponent(new URL(r.request().url()).pathname.replace('/web_app/','')); if(fs.existsSync(f)) r.fulfill({path:f,headers:{'access-control-allow-origin':'*'}}); else r.fulfill({status:404,body:''}); });
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('https://shim-sung-hyun.github.io/web_app/008/'+(process.env.APP||'animal-home.html'));   /* 베타: APP=animal-home-beta.html node tools/hide-check.js */ await p.waitForTimeout(1500);
 const res=await p.evaluate(async(TRIALS)=>{
   S.sound=false; speak=()=>Promise.resolve(); await gameReady;
   const byP={}; Object.keys(BUN).forEach(l=>BUN[l].forEach(b=>b.items.forEach(x=>{ (byP[x.p]=byP[x.p]||new Set()).add(x.a); })));
   const cache={}; const load=src=>cache[src]||(cache[src]=new Promise(r=>{ const im=new Image(); im.crossOrigin='anonymous'; im.onload=()=>r(im); im.onerror=()=>r(null); im.src=src; }));
   const out=[];
   document.body.classList.remove('setup');
   for(const pl of Object.keys(byP)){ const animals=[...byP[pl]];
    for(const lv of [1,2,3]) for(let tr=0;tr<TRIALS;tr++){
     const targets=shuffle(animals).slice(0,Math.min(4,animals.length));   /* 같은 곳 동물끼리 한 장면(앱과 같음) */
     RUN={token:1,bd:{places:[pl],items:targets.map(a=>({a,p:pl}))},lv:1}; const tok=1;
     playHide(pl,lv,targets,tok);
     let card=null; for(let i=0;i<60;i++){ await wait(100); card=document.querySelector('.showCard'); if(card&&card.style.opacity==='1') break; }
     await wait(200); card=document.querySelector('.showCard'); if(!card) continue;
     const W=card.clientWidth,H=card.clientHeight;
     const els=[...card.querySelectorAll('img')].filter(e=>!e.classList.contains('bg'));
     /* 무대(2026-11-04 베타): 소품이 상자(div) 안의 그림+밑동 덮개, 꾸밈은 % 단위 — 장면 좌표로 바꿔 셈 */
     const px=(v,ref)=>String(v||'0').endsWith('%')?parseFloat(v)*ref/100:parseFloat(v)||0;
     const geo=e=>{ const P=e.parentElement, inBox=P!==card&&String(P.style.left).endsWith('px'), rw=inBox?parseFloat(P.style.width):W, rh=inBox?parseFloat(P.style.height):H;
       return {l:px(e.style.left,rw)+(inBox?parseFloat(P.style.left):0),t:px(e.style.top,rh)+(inBox?parseFloat(P.style.top):0),w:px(e.style.width,rw),h:px(e.style.height,rh),z:+e.style.zIndex||(inBox?+P.style.zIndex:0)||0}; };
     const info=await Promise.all(els.map(async e=>{ const im=await load(e.src), g=geo(e); return {e,im,g,z:g.z,animal:e.classList.contains('placed'),a:e.alt}; }));
     for(const A of info.filter(x=>x.animal)){
       /* 캔버스를 장면보다 넓게 — 화면 밖으로 나간 몸도 '원래 점'에 셈하고, 보이는 점은 장면 안만 셈 */
       const c=document.createElement('canvas'); c.width=W*3; c.height=H*3; const x=c.getContext('2d'); x.translate(W,H);
       const draw=(o)=>{ const e=o.e, {w,h,l,t}=o.g;
         if(!o.im) return; x.save();
         if(o.animal){ if(e.dataset.flip){ x.translate(l,0); x.scale(-1,1); x.translate(-l,0); } x.drawImage(o.im,l-w/2,t-h/2,w,h); }
         else { if(e.style.transform.includes('scaleX(-1)')){ x.translate(l+w/2,0); x.scale(-1,1); x.translate(-(l+w/2),0); } x.drawImage(o.im,l,t,w,h); }
         x.restore(); };
       draw(A); const d0=x.getImageData(0,0,W*3,H*3).data; let n0=0; for(let i=3;i<d0.length;i+=4) if(d0[i]>128) n0++;
       x.globalCompositeOperation='destination-out';
       if(A.e.dataset.wl) x.fillRect(-W,+A.e.dataset.wl,W*3,H*3);   /* 물에 잠긴 몸(물낯 아래)은 안 보이는 것으로 */
       const occ=info.filter(o=>o!==A&&o.z>A.z), cnt=()=>{ const d=x.getImageData(W,H,W,H).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]>128) n++; return n; };
       const own=occ.filter(o=>!o.animal&&Math.abs(o.z-A.z)===1); own.forEach(draw); const nOwn=cnt();
       occ.filter(o=>!own.includes(o)).forEach(draw); const n1=cnt();
       out.push({scene:W*H,edge:(parseFloat(A.e.style.left)-parseFloat(A.e.style.width)/2<0)||(parseFloat(A.e.style.left)+parseFloat(A.e.style.width)/2>W),free:A.e.dataset.free||'',pl,lv,a:A.a,target:targets.includes(A.a),n0,own:nOwn,vis:n1,frac:n0?n1/n0:0,ok:!!A.im,anim:A.e.complete&&A.e.naturalWidth>0});
     }
     RUN.token=99; await wait(50); clearStage();
    } }
   return out; },TRIALS);
 const t=res.filter(x=>x.target), hid=t.filter(x=>x.vis<60);
 [1,2,3].forEach(lv=>{ const a=t.filter(x=>x.lv===lv), z=a.filter(x=>x.vis<60); console.log(['','쉬움','보통','어려움'][lv]+': 찾을 동물 '+a.length+' 중 완전히 가려짐 '+z.length+' ('+Math.round(100*z.length/Math.max(1,a.length))+'%), 제 소품만으로 '+z.filter(x=>x.own<60).length); });
 /* 보이는 몫(동물 칠해진 점 중 보이는 %)이 앱의 목표 범위(GLV band) 안에 드는지. 아주 작은 동물은 CLUE_PX만큼 보이게 하므로 범위보다 커도 그 크기 안이면 맞음 */
 /* 2026-11-02: 목표는 보이는 넓이(장면 대비 %) — 앱 GLV area. 몫이 fr 끝에 걸려 넓이를 못 맞춘 경우(아주 큰·작은 동물)는 fr 끝이면 맞음 */
 const BAND={1:[.9,2.0],2:[.28,.5],3:[.08,.15]}, FR={1:[.45,.85],2:[.16,.45],3:[.04,.2]}, TOL=.25;
 const okB=x=>{ const [lo,hi]=BAND[x.lv], a=100*x.vis/x.scene, [f0,f1]=FR[x.lv]; return (a>=lo*(1-TOL)&&a<=hi*(1+TOL))||(a<lo&&x.frac>=f1-.06)||(a>hi&&(x.frac<=f0+.03||x.vis<=330*1.6)); };
 [1,2,3].forEach(lv=>{ const a=t.filter(x=>x.lv===lv).sort((u,v)=>u.frac-v.frac), q=k=>a.length?Math.round(100*a[Math.floor(k*(a.length-1))].frac):0, inb=a.filter(okB).length;
   console.log('  '+['','쉬움','보통','어려움'][lv]+' 보이는 몫: 가장 적게 '+q(0)+'% · 아래 1/4 '+q(.25)+'% · 가운데 '+q(.5)+'% · 위 1/4 '+q(.75)+'% · 가장 많이 '+q(1)+'%  — 넓이 목표 '+BAND[lv].join('~')+'%(±25%, 몫 끝에 걸린 것 포함) 안 '+Math.round(100*inb/Math.max(1,a.length))+'%'); });
 /* 실제 크기에 맞는 소품이 없어 크기를 무시한 경우(그 곳에 그 크기의 소품을 더 그려야 함) */
 console.log('  가장자리에서 내민 찾을 동물: '+t.filter(x=>x.edge).length+' / '+t.length);
 const fr=t.filter(x=>x.free); console.log('  실제 크기(보통 높이 ±25%)에 맞는 소품이 없어 크기를 늘리거나 줄임: 찾을 동물 '+t.length+' 중 '+fr.length+' ('+Math.round(100*fr.length/Math.max(1,t.length))+'%)');
 const fm={}; fr.forEach(x=>{ const k=x.pl+' '+x.a; fm[k]=(fm[k]||0)+1; }); if(fr.length) console.log('    '+Object.entries(fm).sort((u,v)=>v[1]-u[1]).map(([k,n])=>k+' '+n).join(' · '));
 /* 보이는 넓이(장면 넓이 대비 %): 큰 동물은 몫이 작아도 넓게 보여 쉬움 — 어렵기가 실제로 느껴지는지 */
 [1,2,3].forEach(lv=>{ const a=t.filter(x=>x.lv===lv).map(x=>100*x.vis/x.scene).sort((u,v)=>u-v), q=k=>a.length?a[Math.floor(k*(a.length-1))].toFixed(2):'-';
   console.log('  '+['','쉬움','보통','어려움'][lv]+' 보이는 넓이(장면 대비 %): 아래 1/4 '+q(.25)+' · 가운데 '+q(.5)+' · 위 1/4 '+q(.75)+' · 가장 많이 '+q(1)); });
 const outB=t.filter(x=>!okB(x)).sort((u,v)=>u.frac-v.frac); if(outB.length){ console.log('  목표 밖:'); outB.slice(0,20).forEach(x=>console.log('    '+x.pl+' '+['','쉬움','보통','어려움'][x.lv]+' '+x.a+' '+Math.round(100*x.frac)+'% ('+x.vis+'점)')); }
 hid.sort((x,y)=>x.vis-y.vis).forEach(x=>console.log('  '+x.pl+' '+['','쉬움','보통','어려움'][x.lv]+' '+x.a+' · 원래 '+x.n0+'점 → 제 소품 뒤 '+x.own+' → 최종 '+x.vis)); await b.close(); })();
