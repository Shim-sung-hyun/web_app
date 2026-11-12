#!/usr/bin/env python3
"""나무 줄기 구멍 메우기(2026-11-12 초원) — flat-shadow.py --plant 로 자른 나무에서 옅은 나무껍질·바오바브 밝은 면이 종이로 보여 뚫린 것을 되살림.

    python3 tools/bark-fill.py 받은.jpg 자른.webp 줄기선     # 자른.webp(= flat-shadow.py 받은.jpg 자른.webp --key blue --plant 의 결과)를 제자리에서 고침

줄기선: 그림 높이 중 이 몫 아래(줄기)는 밝은 구멍도 결(빗금)이 있으면 되살림 — 아카시아 .55 · 바오바브 .38 · 마룰라 .62 · 모파네 .6 · 마른 나무 .35 · 나무 무리 .62.
셈: 같은 원본을 --plant 없이 한 번 더 잘라(안을 다 채운 그림) 맞춰 놓고,
  1) 몸 안에 갇힌 투명 구멍 중 작은 것(60점 아래)은 종이색(밝기 244)이 아니면, 큰 것은 확실히 어둡거나(215 아래) 결이 있으면(밝기 흩어짐 7 넘게) 되살림.
  2) 그림자 속 흰 점(물체에서 떨어진 작은 밝은 덩어리, 아래 20%)을 지움.
  3) 갈래 사이에 남은 매끈한 흰 종이(결 없음, 150점 넘게)는 다시 투명하게.
가지 사이 빈 종이는 매끈하고 밝아 그대로 투명. 덤불·풀은 쓰지 않음(가지 사이 종이가 결처럼 보일 수 있음).
"""
import sys, subprocess, tempfile, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, plant = sys.argv[1], sys.argv[2]
tmp = os.path.join(tempfile.mkdtemp(), 'solid.webp')
subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'flat-shadow.py'), src, tmp, '--key', 'blue'], check=True)
P=np.array(Image.open(plant).convert('RGBA')); Q=np.array(Image.open(tmp).convert('RGBA'))
H,W=P.shape[:2]; Qp=np.zeros((H+40,W+40,4),np.uint8); Qp[20:20+Q.shape[0],20:20+Q.shape[1]]=Q[:H+20,:W+20][:min(Q.shape[0],H+20),:min(Q.shape[1],W+20)]
m=P[...,3]>250; best=None
for dy in range(0,41):
    for dx in range(0,41):
        q=Qp[dy:dy+H,dx:dx+W]; d=np.abs(q[...,:3][m][::7].astype(int)-P[...,:3][m][::7]).mean()
        if best is None or d<best[0]: best=(d,dy,dx)
Q=Qp[best[1]:best[1]+H,best[2]:best[2]+W]
A=P[...,3]>128
inside=ndi.binary_fill_holes(ndi.binary_closing(A,iterations=2))&~A
lum=Q[...,:3].mean(2)
low=np.zeros_like(A); low[int(H*float(sys.argv[3] if len(sys.argv)>3 else 2)):]=True   # 이 줄 아래(줄기)는 밝은 구멍도 — 단 결(빗금)이 있는 것만(빈 종이는 매끈)
cand=inside&(Q[...,3]>200)
fix=np.zeros_like(A)
lab,n=ndi.label(cand)
for i in range(1,n+1):
    r=lab==i; z=r.sum(); m=lum[r].mean(); sd=lum[r].std()
    # 작은 구멍(줄기 결 사이 밝은 점)은 종이색이 아니면, 큰 구멍은 결(빗금)이 있거나 확실히 어두울 때만 — 가지 사이 빈 종이(매끈·밝음)는 그대로 투명
    if (z<60 and m<244) or m<215 or (sd>7 and (low[r].mean()>.5 or m<235)): fix|=r
fix=ndi.binary_dilation(fix,iterations=1)&inside&(Q[...,3]>200)
P[fix]=Q[fix]
# 그림자 속 흰 점(물체에서 떨어진 작은 불투명 덩어리, 아래 20%) 지우기
B=P[...,3]>60; lab,n=ndi.label(B,structure=np.ones((3,3))); sz=ndi.sum(B,lab,range(1,n+1)); mx=np.argmax(sz)+1
for i,z in enumerate(sz,1):
    if i!=mx and z<H*W*.002:
        ys,xs=np.where(lab==i)
        if ys.mean()>H*.8 and P[ys,xs,:3].mean()>150: P[ys,xs,3]=np.minimum(P[ys,xs,3],0)


# 3) 갈래 사이 매끈한 흰 종이
L=P[...,:3].astype(float).mean(2)
L=P[...,:3].astype(float).mean(2)
mean=ndi.uniform_filter(L,5); sd=np.sqrt(np.maximum(ndi.uniform_filter(L*L,5)-mean**2,0))
smooth=(L>226)&(sd<5)&(P[...,3]>200)
lab,n=ndi.label(smooth); clear=P[...,3]<30; near=ndi.binary_dilation(clear,iterations=3)
k=0
for i in range(1,n+1):
    r=lab==i
    if r.sum()>150 and ((near&r).any() or (L[r].mean()>244 and np.median(sd[r])<2)):
        rr=ndi.binary_dilation(r,iterations=1)&(L>215); P[rr,3]=0; k+=int(rr.sum())

Image.fromarray(P).save(plant,'WEBP',quality=93,alpha_quality=100,method=6)
print(os.path.basename(plant), '되살림', int(fix.sum()), '종이 지움', k)
