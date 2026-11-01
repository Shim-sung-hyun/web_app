#!/usr/bin/env python3
"""008 숨은 동물 찾기 가림 소품 목록 만들기 — media/habitats/props/index.json

    python3 tools/props-index.py          # 소품 그림(webp)을 모두 다시 재서 index.json을 고쳐 씀

index.json 한 줄:  "bush": {"size":[480,383], "solid":[왼,위,오른,아래], "places":["ground","forest"]}
  size   그림 크기(px)
  solid  그림 안에서 빈틈 없이 꽉 찬 부분(그림 대비 0~1). 앱은 이 부분으로 동물을 가린다
         (풀잎 끝·가지 사이로 동물이 비쳐 보이지 않게). 그림을 바꾸면 이 도구로 다시 잼.
  rows   그림을 위에서 아래로 24줄로 나눠 줄마다 실제로 그려진 왼쪽·오른쪽 끝과 그 사이 칠해진 비율(0~1, 빈 줄은 null).
         앱은 이것으로 옆에서 가릴 때 삐져나온 잎·구름이 단서를 덮지 않게 맞추고, 다른 소품이 단서를 덮는지 봄(2026-11-01)
  places 이 소품을 쓰는 곳(앱의 PL 이름: ground forest grassland desert polar sky underground water sea pond wetland.
         수준 1의 '땅'(land)은 ground를 따름). 앱을 고치지 않고 이 칸만 고치면 됨.
동물 그림 줄별 폭도 함께 만듦: media/animals/rows.json — {"그림 파일 이름(확장자 빼고)": rows(위와 같은 꼴, 512 칸 기준)}.
  앱은 찾을 동물의 단서(귀·머리 끝)가 실제로 보이는지 잴 때 씀(동물 그림을 바꾸거나 새로 넣으면 이 도구를 다시 돌림).
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


def row_profile(path, n=24):
    a = np.array(Image.open(path).convert('RGBA'))[:, :, 3] > 100
    h, w = a.shape
    out = []
    for i in range(n):
        band = a[int(h * i / n):max(int(h * (i + 1) / n), int(h * i / n) + 1)].any(0)
        xs = np.where(band)[0]
        if not len(xs):
            out.append(None); continue
        blk = a[int(h * i / n):max(int(h * (i + 1) / n), int(h * i / n) + 1), xs.min():xs.max() + 1]
        out.append([round(xs.min() / w, 3), round((xs.max() + 1) / w, 3), round(float(blk.mean()), 2)])   # 왼쪽·오른쪽 끝·그 사이 칠해진 비율
    return out


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
        out[nm] = {'size': [w, h], 'solid': s, 'rows': row_profile(os.path.join(ROOT, f)), 'places': places}
        if not places:
            empty.append(nm)
    with open(IDX, 'w', encoding='utf-8') as fp:
        fp.write('{\n' + ',\n'.join('"%s": %s' % (k, json.dumps(v, ensure_ascii=False, separators=(',', ':'))) for k, v in out.items()) + '\n}\n')
    print('소품 %d개' % len(out))
    if empty:
        print('places가 비어 있는 소품(놀이에 안 나옴):', ', '.join(empty))
    animals = {}
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    import re
    app = open(os.path.join(base, '008', 'animal-home.html'), encoding='utf-8').read()
    for var, d in (('OLD', '007/pics'), ('NEW', 'media/animals')):   # 008이 쓰는 동물 그림만(앱의 OLD·NEW 표)
        body = re.search(r'const %s=\{(.*?)\};' % var, app, re.S).group(1)
        for nm in re.findall(r":'([a-z_]+)'", body):
            p = os.path.join(base, d, nm + '.webp')
            if os.path.exists(p):
                animals[nm] = row_profile(p)
    with open(os.path.join(base, 'media', 'animals', 'rows.json'), 'w', encoding='utf-8') as fp:
        fp.write('{\n' + ',\n'.join('"%s": %s' % (k, json.dumps(v, separators=(',', ':'))) for k, v in animals.items()) + '\n}\n')
    print('동물 그림 줄별 폭 %d장 → media/animals/rows.json' % len(animals))
    by = {}
    for k, v in out.items():
        for p in v['places']:
            by.setdefault(p, []).append(k)
    for p in sorted(by):
        print('  %-12s %2d  %s' % (p, len(by[p]), ' '.join(by[p])))


if __name__ == '__main__':
    sys.exit(main())
