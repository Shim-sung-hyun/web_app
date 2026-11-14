#!/usr/bin/env python3
"""그림자 셈해 넣기(2026-11-10 선생님 방식 — 보관용, 지금은 안 씀): 그림자 없는 소품에 '실루엣 그림자 레이어 위에 물체'로 그림자를 만든다.
그림자 레이어 = 물체 실루엣의 땅에 닿는 줄은 제자리, 위쪽만 해 반대편(오른쪽 안쪽)으로 높이에 비례해 눕혀 누른 것. 그 위에 물체를 올림.
값은 선생님 본보기 그림에서 잰 것: 키 1에 오른쪽 .85 · 위(안쪽) .40, 밑동 가까이 또렷·멀수록 흐리게, 진하기 30%.
서 있는 것: 물체가 그림자 시작을 조금 밟게(그림자를 키의 1.5%만큼 뒤로). 누운 것: 휘어 올라가기 시작하는 곳부터, 물체 오른쪽과 그림자 사이 빈틈은 메움.
한계: 누운 것은 그림 한 장으로 어디가 땅에 닿았는지 몰라 어긋나기 쉬움 — 그림자를 그려 받는 쪽(tools/shadow-split.py)이 나음.

    python3 tools/cast-shadow.py 소품.webp 누움여부(0|1) 나갈.webp
"""
import numpy as np, math
from PIL import Image, ImageFilter
# 해(선생님 2026-11-10): 앞에서 보면 10시 30분(왼쪽 하늘), 오른쪽 옆에서 보면 10시 30분(보는 사람 머리 뒤쪽) → 두 각도가 모두 45°이니
# 왼쪽·뒤쪽·위 몫이 같음 — 실제 높이 atan(1/√2) ≈ 35.3°, 그림자는 키의 약 1.4배로 오른쪽 안쪽 45°. FORE = 땅의 앞뒤가 화면에서 눌리는 몫
EL=math.atan(1/math.sqrt(2)); AZ=math.radians(45); FORE=.32
SKEW=.85; K=.40   # 선생님 본보기 그림(2026-11-10)에서 잰 값: 키 1에 오른쪽 .85 · 위(안쪽) .40
def shadow_layer(o, lying):
    al=np.array(o.getchannel('A')).astype(float)/255; H,W=al.shape; m=al>.5
    ybcol=np.array([np.nonzero(m[:,x])[0][-1] if m[:,x].any() else -1 for x in range(W)])
    ys,xs=np.nonzero(al>.02); hgt=np.zeros(len(ys))
    if lying:   # 선생님이 보신 판: 그림자 땅 줄 = 열마다 물체 아래 가장자리, 휘어 올라가기 시작하는 곳부터
        idx=np.arange(W); yb=ybcol.astype(float); good=yb>=0; yb=np.interp(idx,idx[good],yb[good])
        yb=np.convolve(np.pad(yb,4,mode='edge'),np.ones(9)/9,'valid')
        low=int(np.argmax(yb)); after=np.nonzero((idx>low)&(yb<yb.max()-H*.05))[0]; bend=int(after[0]) if len(after) else W
        keep=xs>=bend; ys,xs=ys[keep],xs[keep]; hgt=np.maximum(0,yb[xs]-ys)
        tx=np.round(xs+hgt*SKEW).astype(int); ty=np.round(yb[xs]-hgt*K).astype(int)
        pad=int(W*SKEW*1.2)+10; out=np.zeros((H+10,W+pad)); ok=(tx>=0)&(tx<W+pad)&(ty>=0)&(ty<H+10)
        np.maximum.at(out,(ty[ok],tx[ok]),1.0)
        # 빈틈 메우기(선생님 2026-11-10 '이 부분은 그림자로 채워지겠지'): 줄마다 물체 오른쪽 끝과 그림자 왼쪽 끝 사이
        filled=0
        for y in range(min(H,out.shape[0])):
            ob=np.nonzero(m[y])[0]; sx=np.nonzero(out[y]>0)[0]
            if len(ob) and len(sx):
                xr=ob[-1]; right=sx[sx>xr]
                if len(right) and right[0]-xr>1: out[y,xr:right[0]]=1; filled+=right[0]-xr
        print('메운 점',filled)
        hm=np.zeros_like(out); np.maximum.at(hm,(ty[ok],tx[ok]),hgt[ok])
        _b=Image.fromarray((out*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
        _n=np.array(_b.filter(ImageFilter.GaussianBlur(1.2))).astype(float)/255; _f=np.array(_b.filter(ImageFilter.GaussianBlur(W*.025))).astype(float)/255
        _w=np.array(Image.fromarray((hm/max(1,hm.max())*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(W*.02))).astype(float)/255
        SH=_n*(1-_w)+_f*_w   # 밑동 가까이 또렷, 멀어질수록 흐리게
        return SH, pad
    else:
        yB=float(ybcol.max()); hgt=np.maximum(0,yB-ys)
    pad=int(W*SKEW*1.2)+10; out=np.zeros((H+10,W+pad))
    tx=np.round(xs+hgt*SKEW).astype(int); ty=np.round(ys+hgt-hgt*K).astype(int)   # 그 점 바로 밑 땅(y+높이)에서 해 반대편으로
    ok=(tx>=0)&(tx<W+pad)&(ty>=0)&(ty<H+10)
    np.maximum.at(out,(ty[ok],tx[ok]),al[ys[ok],xs[ok]])
    hm=np.zeros_like(out); np.maximum.at(hm,(ty[ok],tx[ok]),hgt[ok])
    _b=Image.fromarray((out*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
    _n=np.array(_b.filter(ImageFilter.GaussianBlur(1.2))).astype(float)/255; _f=np.array(_b.filter(ImageFilter.GaussianBlur(W*.025))).astype(float)/255
    _w=np.array(Image.fromarray((hm/max(1,hm.max())*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(W*.02))).astype(float)/255
    SH=_n*(1-_w)+_f*_w   # 밑동 가까이 또렷, 멀어질수록 흐리게
    sh=SH
    if not lying:   # 서 있는 것: 물체가 그림자 시작을 밟고 서게 — 그림자 레이어를 물체 높이의 1.5%만큼 뒤(위)로, 밑동 줄 아래는 지움
        dd=max(1,int(H*.015)); sh=np.vstack([sh[dd:],np.zeros((dd,sh.shape[1]))]); sh[int(ybcol.max())+1:,:]=0
    return sh, pad
def place(bg, obj, x, ybase, h, lying, strength=.30):
    s=h/obj.height; o=obj.resize((max(1,int(obj.width*s)),h),Image.LANCZOS)
    sh,pad=shadow_layer(o,lying); col=np.array([110,62,30],float)
    b=np.array(bg).astype(float); oy=ybase-o.height; y1=min(b.shape[0],oy+sh.shape[0]); x1=min(b.shape[1],x+sh.shape[1])
    a=(sh[:y1-oy,:x1-x]*strength)[...,None]; b[oy:y1,x:x1,:3]=b[oy:y1,x:x1,:3]*(1-a)+col*a
    bg=Image.fromarray(b.astype(np.uint8),'RGBA'); bg.alpha_composite(o,(x,oy)); return bg   # 그림자 레이어 위에 물체

if __name__=='__main__':
    import sys
    o=Image.open(sys.argv[1]).convert('RGBA'); lying=sys.argv[2]=='1'
    sh,pad=shadow_layer(o,lying); H,W=o.height,o.width
    out=Image.new('RGBA',(W+pad,H+10),(0,0,0,0)); a=(np.clip(sh,0,1)*.30*255).astype(np.uint8)
    layer=Image.new('RGBA',out.size,(110,62,30,0)); layer.putalpha(Image.fromarray(a[:out.height,:out.width])); out.alpha_composite(layer); out.alpha_composite(o,(0,0))
    out.save(sys.argv[3]); print('그림자 넣음',sys.argv[3])
