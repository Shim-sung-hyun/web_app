#!/usr/bin/env python3
"""흰 종이를 완전히 투명하게(2026-11-14, 선생님: 물속 검정말의 흰 테두리가 따로 논다)

    python3 tools/white-to-alpha.py 받은.jpg 나갈.webp

잎이 가늘고 촘촘한 물풀(검정말·붕어마름)은 bing-cut.py로 자르면 잎 사이·가장자리에 흰 종이가 남아 바탕 위에서 희끗하게 뜸.
이 도구는 종이색을 순백으로 맞춘 뒤 '흰색을 투명으로'(밝을수록 투명, 색은 흰 바탕을 뺀 원래 잉크 색) 바꿈 — 흰 테두리가 남을 수 없음.
연한 잎은 조금 비쳐 바탕과 섞임(물속에 어울림). 짙은 그림은 넣은 뒤 색만 밝힘(알파는 그대로).
"""
import sys, numpy as np
from PIL import Image
src,dst=sys.argv[1],sys.argv[2]
a=np.asarray(Image.open(src).convert('RGB')).astype(float)
b=np.concatenate([a[:8].reshape(-1,3),a[-8:].reshape(-1,3),a[:,:8].reshape(-1,3),a[:,-8:].reshape(-1,3)])
paper=np.median(b,0); a=np.clip(a*(255/paper),0,255)          # 종이를 순백으로
al=np.max((255-a)/255,axis=2)                                   # 흰색을 투명으로(color to alpha)
al=np.clip((al-.06)/.94,0,1)                                    # 종이 결 옅은 얼룩은 0
c=np.where(al[...,None]>0, (a-255*(1-al[...,None]))/np.maximum(al[...,None],1e-3), 0)
c=np.clip(c,0,255)
im=Image.fromarray(np.dstack([c,al*255]).astype(np.uint8),'RGBA')
bb=im.split()[3].point(lambda v:255 if v>30 else 0).getbbox(); im=im.crop((max(0,bb[0]-4),max(0,bb[1]-4),bb[2]+4,bb[3]+4))
im.save(dst,'WEBP',quality=93,alpha_quality=100,method=6); print(im.size)
