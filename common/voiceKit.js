/* 차름 공통 모듈: 말하기 부품(voiceKit) — 원본은 common/voiceKit.js. 앱 안의 <script id="voiceKit">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   앱마다 똑같이 복사해 쓰던 말하기의 밑바탕을 한곳에(2026-11-25). 무엇을 언제 말할지·소리 고르기·끊긴 말 다시 하기는 앱마다(말하는 차례가 앱마다 달라서).
   VoiceKit.sha16(글)       미리 만든 목소리 파일 이름(문장 조각 SHA-1 앞 16자리 — media/voice/<묶음>/<이름>.mp3). https가 아니어도 됨(sha1Bytes로 셈)
   VoiceKit.splitSay(글)    문장 조각으로 나눔(. ! ? , 뒤에서)
   VoiceKit.pickKoVoice()   기기 한국어 목소리 가운데 가장 나은 것(프리미엄·향상·Google·유나 순)
   VoiceKit.fsAsk()         전체 화면을 청할 때 부름(청하기가 실패하면 fsAsk(0)) — 말 끊김 막기(2026-10-25, 003에서 옮김): 전체 화면으로 바뀌는 동안(기기에 따라 소리가 끊기거나 잠깐 "안 보임")은
   VoiceKit.fsBusy()        말을 시작하지 않음(청한 뒤 1.5초 안에 아직 안 바뀜, 또는 바뀐 지 0.6초 안이면 true)
   VoiceKit.afterFull(fn)   바뀜이 끝나면(늦어도 2초) fn */
window.VoiceKit = (function () {
  'use strict';
function sha1Bytes(msg){
  const l=msg.length, w=[], H=[0x67452301,0xEFCDAB89,0x98BADCFE,0x10325476,0xC3D2E1F0];
  const m=new Uint8Array(((l+9+63)>>6)<<6); m.set(msg); m[l]=0x80; const bl=l*8; const dv=new DataView(m.buffer); dv.setUint32(m.length-4,bl>>>0); dv.setUint32(m.length-8,Math.floor(bl/4294967296));
  for(let i=0;i<m.length;i+=64){
    for(let t=0;t<16;t++) w[t]=dv.getUint32(i+t*4);
    for(let t=16;t<80;t++){ const x=w[t-3]^w[t-8]^w[t-14]^w[t-16]; w[t]=(x<<1)|(x>>>31); }
    let [a,b,c,d,e]=H;
    for(let t=0;t<80;t++){ const f=t<20?(b&c)|(~b&d):t<40?b^c^d:t<60?(b&c)|(b&d)|(c&d):b^c^d, k=t<20?0x5A827999:t<40?0x6ED9EBA1:t<60?0x8F1BBCDC:0xCA62C1D6;
      const tmp=(((a<<5)|(a>>>27))+f+e+k+w[t])>>>0; e=d; d=c; c=(b<<30)|(b>>>2); b=a; a=tmp; }
    H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0; H[4]=(H[4]+e)>>>0;
  }
  const out=new Uint8Array(20); const ov=new DataView(out.buffer); H.forEach((h,i)=>ov.setUint32(i*4,h)); return out;
}
async function sha16(t){ const u=new TextEncoder().encode(t); const d=window.crypto&&crypto.subtle?new Uint8Array(await crypto.subtle.digest('SHA-1',u)):sha1Bytes(u); return [...d].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,16); }
function splitSay(t){ return String(t||'').split(/(?<=[.!?,])\s+/).map(x=>x.trim()).filter(Boolean); }
function pickKoVoice(){ const vs=('speechSynthesis' in window)?speechSynthesis.getVoices().filter(v=>v.lang&&v.lang.replace('_','-').toLowerCase().startsWith('ko')):[];
  if(!vs.length) return null;
  const score=v=>(/premium|프리미엄/i.test(v.name)?4:0)+(/enhanced|향상/i.test(v.name)?3:0)+(/google/i.test(v.name)?2:0)+(/yuna|유나/i.test(v.name)?1:0)+(v.localService?0.5:0);
  return vs.sort((a,b)=>score(b)-score(a))[0]; }
  var fsAskAt = 0, fsChangeAt = 0;
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) { document.addEventListener(ev, function () { fsChangeAt = performance.now(); }); });
  function fsAsk(t) { fsAskAt = t == null ? performance.now() : t; }   /* 청하기가 실패하면 fsAsk(0) */
  function fsBusy() { var now = performance.now(); return (fsAskAt > fsChangeAt && now - fsAskAt < 1500) || (fsChangeAt > 0 && now - fsChangeAt < 600); }
  function afterFull(fn) { var t0 = performance.now(); var chk = function () { if (performance.now() - t0 > 2000 || !fsBusy()) fn(); else setTimeout(chk, 100); }; chk(); }
  return { sha1Bytes: sha1Bytes, sha16: sha16, splitSay: splitSay, pickKoVoice: pickKoVoice, fsAsk: fsAsk, fsBusy: fsBusy, afterFull: afterFull };
})();
