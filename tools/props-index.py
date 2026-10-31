#!/usr/bin/env python3
"""008 숨은 동물 찾기 가림 소품 목록 만들기 — media/habitats/props/index.json

    python3 tools/props-index.py          # 소품 그림(webp)을 모두 다시 재서 index.json을 고쳐 씀

index.json 한 줄:  "bush": {"size":[480,383], "solid":[왼,위,오른,아래], "places":["ground","forest"]}
  size   그림 크기(px)
  solid  그림 안에서 빈틈 없이 꽉 찬 부분(그림 대비 0~1). 앱은 이 부분으로 동물을 가린다
         (풀잎 끝·가지 사이로 동물이 비쳐 보이지 않게). 그림을 바꾸면 이 도구로 다시 잼.
  places 이 소품을 쓰는 곳(앱의 PL 이름: ground forest grassland desert polar sky underground water sea pond wetland.
         수준 1의 '땅'(land)은 ground를 따름). 앱을 고치지 않고 이 칸만 고치면 됨.
새 소품을 넣을 때: 흰 바탕을 지운 webp(가장 긴 쪽 480)를 props/에 넣고 → tools/clean-edges.py로 가장자리 정리
  → 이 도구를 돌림 → 새 소품의 places가 비어 있다고 나오면 index.json에서 채우고 다시 돌림(재는 값만 바뀌고 places는 남음).
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'media', 'habitats', 'props')
IDX = os.path.join(ROOT, 'index.json')


def solid_box(path):
    a = np.array(Image.open(path).convert('RGBA'))[:, :, 3] > 100
    h, w = a.shape

    def xr(r0, r1, th=.85):
        cols = a[r0:r1, :].mean(0)
        ok = np.where(cols >= th)[0]
        return (ok.min(), ok.max()) if len(ok) else (w // 2, w // 2)
    x0, x1 = xr(int(h * .55), int(h * .95))
    rows = a[:, x0:x1 + 1].mean(1)
    ys = np.where(rows >= .85)[0]
    if not len(ys):
        return w, h, [.3, .4, .7, .9]
    y0, y1 = ys.min(), ys.max()
    x0, x1 = xr(y0, y1 + 1)
    return w, h, [round(x0 / w, 2), round(y0 / h, 2), round((x1 + 1) / w, 2), round((y1 + 1) / h, 2)]


def main():
    old = json.load(open(IDX, encoding='utf-8')) if os.path.exists(IDX) else {}
    out, empty = {}, []
    for f in sorted(os.listdir(ROOT)):
        if not f.endswith('.webp'):
            continue
        nm = f[:-5]
        w, h, s = solid_box(os.path.join(ROOT, f))
        o = old.get(nm)
        places = o.get('places', []) if isinstance(o, dict) else []
        out[nm] = {'size': [w, h], 'solid': s, 'places': places}
        if not places:
            empty.append(nm)
    with open(IDX, 'w', encoding='utf-8') as fp:
        fp.write('{\n' + ',\n'.join('"%s": %s' % (k, json.dumps(v, ensure_ascii=False, separators=(',', ':'))) for k, v in out.items()) + '\n}\n')
    print('소품 %d개' % len(out))
    if empty:
        print('places가 비어 있는 소품(놀이에 안 나옴):', ', '.join(empty))
    by = {}
    for k, v in out.items():
        for p in v['places']:
            by.setdefault(p, []).append(k)
    for p in sorted(by):
        print('  %-12s %2d  %s' % (p, len(by[p]), ' '.join(by[p])))


if __name__ == '__main__':
    sys.exit(main())
