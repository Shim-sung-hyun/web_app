#!/usr/bin/env python3
"""그림자 든 소품 가르기(2026-11-10, 사막 베타) — 빙 등이 '물체 + 회색 그림자'를 흰 바탕에 그린 그림을
투명 바탕 한 장(아래에 반투명 그림자, 위에 물체)으로 만든다. 무대에서는 stage.json 그 소품에 ownShadow:true·flip:false.

    python3 tools/shadow-split.py 판.jpg 나갈이름 grid   # 3×3 판 → 나갈이름-1.webp … -8.webp (칸 줄 자동으로 찾음)
    python3 tools/shadow-split.py 큰그림.jpg 나갈이름     # 한 장에 하나

가르는 법: 색이 뚜렷하거나(채도 .2·색 차이 40 넘게) 진한 선인 점 = 물체, 선으로 둘러싸인 안쪽(회색 돌)도 물체.
물체 밖의 회색 = 그림자(빙 그림자는 살짝 푸른 회색이라 물체 기준을 엄격하게), 물체로 잡혔지만 그림자와 이어진 회색은 그림자로 되돌림.
그림자 진하기는 알파 92/255까지(stage-meta가 밑동을 물체로만 재게 100 아래). 칸 줄·가지 사이 흰 틈은 지움.
식물 밑의 연한 모래 자국은 따로 지워야 함(media/stage-beta/README.txt 사막 절).
"""
import numpy as np, sys
from collections import deque
from PIL import Image, ImageFilter
SHADOW_COL=np.array([62,42,28.]); SHADOW_MAX=92   # 그림자 진하기 상한(알파 92/255 — stage-meta가 밑동을 물체로만 재게 100보다 낮게)
def flood_bg(free):   # 가장자리에서 free(빈 곳)를 따라 이어진 곳
    H,W=free.shape; bg=np.zeros_like(free); q=deque()
    for x in range(W):
        for y in (0,H-1):
            if free[y,x] and not bg[y,x]: bg[y,x]=1; q.append((y,x))
    for y in range(H):
        for x in (0,W-1):
            if free[y,x] and not bg[y,x]: bg[y,x]=1; q.append((y,x))
    while q:
        y,x=q.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            a,b=y+dy,x+dx
            if 0<=a<H and 0<=b<W and free[a,b] and not bg[a,b]: bg[a,b]=1; q.append((a,b))
    return bg.astype(bool)
def grow(m,n):
    im=Image.fromarray((m*255).astype(np.uint8)); return np.array(im.filter(ImageFilter.MaxFilter(n)))>128
def shrink(m,n):
    im=Image.fromarray((m*255).astype(np.uint8)); return np.array(im.filter(ImageFilter.MinFilter(n)))>128
def split(rgb):
    a=rgb.astype(float); L=a.mean(-1); mx=a.max(-1); mn=a.min(-1); sat=(mx-mn)/(mx+1e-6)
    nonwhite=(mn<236)|(mx-mn>16)
    strong=((sat>.2)&((mx-mn)>40)&(L<238))|(L<105)   # 색이 뚜렷하거나 진한 선 = 물체(빙 그림자는 살짝 푸른 회색이라 엄격하게)
    dk=L<150; H0,W0=L.shape                              # 칸 줄(가로·세로로 길게 이어진 진한 선)은 물체가 아님
    E=16   # 칸 가장자리 16점 안에서만, 줄의 70% 넘게 진하면 칸 줄
    for y in [y for y in np.nonzero(dk.mean(1)>.7)[0] if y<E or y>H0-E]: strong[max(0,y-2):y+3,:]=False; nonwhite[max(0,y-2):y+3,:]=False
    for x in [x for x in np.nonzero(dk.mean(0)>.7)[0] if x<E or x>W0-E]: strong[:,max(0,x-2):x+3]=False; nonwhite[:,max(0,x-2):x+3]=False
    obj=shrink(grow(strong,5),5)                        # 선 사이 틈 닫기
    obj=~flood_bg(~obj)                                 # 선으로 둘러싸인 안쪽(회색 돌 포함) 채우기
    obj&=nonwhite|grow(strong,3)
    obj&=~((L>238)&((mx-mn)<14))                         # 물체 안의 흰 틈(가지 사이)은 비움
    sh=nonwhite&~grow(obj,3)&((mx-mn)<40)               # 물체 밖의 회색 = 그림자
    neutral=((mx-mn)<42)&(L>110)&(L<240)&~strong        # 물체로 잡혔지만 그림자와 이어진 회색은 그림자로
    for _ in range(12):
        add=grow(sh,3)&obj&neutral
        if not add.any(): break
        sh|=add; obj&=~add
    return obj, sh, L
def make(rgb, pad=10):
    obj,sh,L=split(rgb); H,W=obj.shape
    oa=np.array(Image.fromarray((obj*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.6))).astype(float)
    oa=np.where(obj,np.maximum(oa,200),0)   # 물체 밖 둘레(흰·회색이 섞인 점)는 버림
    sa=np.clip((246-L)/(246-150),0,1)*SHADOW_MAX*sh
    sa=np.array(Image.fromarray(sa.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))).astype(float)*~obj
    out=np.zeros((H,W,4)); out[...,:3]=SHADOW_COL; out[...,3]=sa
    oaf=oa[...,None]/255; out[...,:3]=rgb*oaf+out[...,:3]*(1-oaf); out[...,3]=np.maximum(oa,sa)
    im=Image.fromarray(out.clip(0,255).astype(np.uint8),'RGBA'); bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
    if not bb: return None
    x0,y0,x1,y1=bb; return im.crop((max(0,x0-pad),max(0,y0-pad),min(W,x1+pad),min(H,y1+pad)))
def cells(rgb):   # 칸 줄(진한 가는 선)을 찾아 3×3 칸
    a=rgb.astype(float).mean(-1); H,W=a.shape; dark=a<150
    def lines(prof,n):
        c=[i for i in range(n) if prof[i]>.55]; g=[]
        for i in c:
            if g and i-g[-1][-1]<=3: g[-1].append(i)
            else: g.append([i])
        return [int(np.mean(x)) for x in g]
    xs=lines(dark.mean(0),W); ys=lines(dark.mean(1),H)
    def three(ls,n):
        inner=[v for v in ls if n*.15<v<n*.85]
        if len(inner)>=2: inner=sorted(inner,key=lambda v:min(abs(v-n/3),abs(v-2*n/3)))[:2]; inner.sort()
        else: inner=[round(n/3),round(2*n/3)]
        return [0]+inner+[n]
    return three(xs,W), three(ys,H)
if __name__=='__main__':
    rgb=np.array(Image.open(sys.argv[1]).convert('RGB')); out=sys.argv[2]
    if len(sys.argv)>3 and sys.argv[3]=='grid':
        X,Y=cells(rgb); print('칸',X,Y)
        for i in range(8):
            r,c=divmod(i,3); m=6; cell=rgb[Y[r]+m:Y[r+1]-m, X[c]+m:X[c+1]-m]
            im=make(cell)
            if im: im.save(f'{out}-{i+1}.webp','WEBP',quality=95,alpha_quality=100,method=6); print(i+1,im.size)
    else:
        im=make(rgb); im.save(out+'.webp','WEBP',quality=95,alpha_quality=100,method=6); print(im.size)
