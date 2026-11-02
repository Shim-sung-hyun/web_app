#!/usr/bin/env python3
"""008 숨은 동물 찾기 가림 소품 목록 만들기 — media/habitats/props/index.json

    python3 tools/props-index.py          # 소품 그림(webp)을 모두 다시 재서 index.json을 고쳐 씀

index.json 한 줄:  "bush": {"size":[480,383], "solid":[왼,위,오른,아래], "places":["ground","forest"]}
  size   그림 크기(px)
  solid  그림 안에서 빈틈 없이 꽉 찬 부분(그림 대비 0~1). 앱은 이 부분으로 동물을 가린다
         (풀잎 끝·가지 사이로 동물이 비쳐 보이지 않게). 그림을 바꾸면 이 도구로 다시 잼.
  mask   모양 표 [가로 칸, 세로 칸, base64] — 그림을 가장 긴 쪽 48칸으로 나눠 칸마다 칠해졌는지(1)·비었는지(0), 왼쪽 위부터 줄마다.
         앱은 이것으로 동물의 칠해진 칸 중 몇 %가 실제로 가려지는지 셈(2026-11-01, 별 모양이면 뾰족한 끝까지 그대로)
  real   실제 높이(m) [가장 낮게, 가장 높게] 또는 "far"(구름처럼 아주 멀리 있는 것 — 동물을 가리지 않고 빈 소품으로만).
         그 물건의 보통 높이 ±25%로 적음. 앱은 가리는 동물과 같은 거리에 있다고 보고, 그 동물의 화면 크기 ÷ 실제 크기 비율로
         이 높이를 화면 크기로 바꿔 그 범위에서만 씀 → 작은 돌을 키워 낙타를 가리는 억지가 없음(2026-11-01). 손으로 적는 칸
  anchor (있을 때만) 'left' = 왼쪽 끝이 잘린 가지(앱이 화면 옆 테두리에 붙임) · 'bottom' = 아래 끝이 잘린 꽃줄기(화면 아래 테두리에 붙임). 손으로 적는 칸
  places 이 소품을 쓰는 곳(앱의 PL 이름: ground forest grassland desert polar sky underground water sea pond wetland.
         수준 1의 '땅'(land)은 ground를 따름). 앱을 고치지 않고 이 칸만 고치면 됨.
동물 그림 모양 표도 함께 만듦: media/animals/masks.json — {"그림 파일 이름(확장자 빼고)": base64(48×48 칸, 512 그림 전체)}.
  008이 쓰는 동물(앱의 OLD·NEW 표)만. 동물 그림을 바꾸거나 새로 넣으면 이 도구를 다시 돌림.
새 소품을 넣을 때: 흰 바탕을 지운 webp(가장 긴 쪽 480)를 props/에 넣고 → tools/clean-edges.py로 가장자리 정리
  → 이 도구를 돌림 → 새 소품의 places가 비어 있다고 나오면 index.json에서 채우고 다시 돌림(재는 값만 바뀌고 places는 남음).
"""
import base64, json, os, sys
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


def mask_of(path, n=48):
    """그림을 가장 긴 쪽 n칸으로 나눠, 칸의 절반 넘게 칠해졌으면 1 → [가로 칸, 세로 칸, base64]"""
    a = (np.array(Image.open(path).convert('RGBA'))[:, :, 3] > 100).astype(float)
    h, w = a.shape
    gw, gh = (n, max(1, round(n * h / w))) if w >= h else (max(1, round(n * w / h)), n)
    m = np.zeros((gh, gw), np.uint8)
    for j in range(gh):
        for i in range(gw):
            blk = a[int(h * j / gh):max(int(h * (j + 1) / gh), int(h * j / gh) + 1), int(w * i / gw):max(int(w * (i + 1) / gw), int(w * i / gw) + 1)]
            m[j, i] = blk.mean() > .5
    return [gw, gh, base64.b64encode(np.packbits(m.ravel())).decode()]


def main():
    old = json.load(open(IDX, encoding='utf-8')) if os.path.exists(IDX) else {}
    out, empty, noreal = {}, [], []
    for f in sorted(os.listdir(ROOT)):
        if not f.endswith('.webp'):
            continue
        nm = f[:-5]
        w, h, s = solid_box(os.path.join(ROOT, f))
        o = old.get(nm)
        places = o.get('places', []) if isinstance(o, dict) else []
        real = o.get('real') if isinstance(o, dict) else None
        out[nm] = {'size': [w, h], 'solid': s, 'mask': mask_of(os.path.join(ROOT, f)), 'real': real, 'places': places}
        if isinstance(o, dict) and o.get('anchor'):
            out[nm]['anchor'] = o['anchor']
        if real is None:
            noreal.append(nm)
        if not places:
            empty.append(nm)
    with open(IDX, 'w', encoding='utf-8') as fp:
        fp.write('{\n' + ',\n'.join('"%s": %s' % (k, json.dumps(v, ensure_ascii=False, separators=(',', ':'))) for k, v in out.items()) + '\n}\n')
    print('소품 %d개' % len(out))
    if noreal:
        print('real(실제 높이)이 비어 있는 소품(앱은 0.3~1m로 봄 — index.json에 적어 넣기):', ', '.join(noreal))
    if empty:
        print('places가 비어 있는 소품(놀이에 안 나옴):', ', '.join(empty))
    animals = {}
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    import re
    apps = [open(os.path.join(base, '008', fn), encoding='utf-8').read() for fn in ('animal-home.html', 'animal-home-beta.html')
            if os.path.exists(os.path.join(base, '008', fn)) and 'const OLD=' in open(os.path.join(base, '008', fn), encoding='utf-8').read()]
    for var, d in (('OLD', '007/pics'), ('NEW', 'media/animals')):   # 008(정식판·베타)이 쓰는 동물 그림만(앱의 OLD·NEW 표)
        body = ''.join(re.search(r'const %s=\{(.*?)\};' % var, app, re.S).group(1) for app in apps)
        for nm in re.findall(r":'([a-z_]+)'", body):
            p = os.path.join(base, d, nm + '.webp')
            if os.path.exists(p):
                animals[nm] = mask_of(p)[2]   # 512×512 그림이라 48×48
    old_rows = os.path.join(base, 'media', 'animals', 'rows.json')
    if os.path.exists(old_rows):
        os.remove(old_rows)   # 줄별 폭(2026-11-01 잠깐 씀)은 모양 표로 바뀜
    with open(os.path.join(base, 'media', 'animals', 'masks.json'), 'w', encoding='utf-8') as fp:
        fp.write('{\n' + ',\n'.join('"%s": %s' % (k, json.dumps(v, separators=(',', ':'))) for k, v in animals.items()) + '\n}\n')
    print('동물 그림 모양 표 %d장 → media/animals/masks.json' % len(animals))
    by = {}
    for k, v in out.items():
        for p in v['places']:
            by.setdefault(p, []).append(k)
    for p in sorted(by):
        print('  %-12s %2d  %s' % (p, len(by[p]), ' '.join(by[p])))


if __name__ == '__main__':
    sys.exit(main())
