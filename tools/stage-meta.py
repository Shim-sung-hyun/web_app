#!/usr/bin/env python3
"""무대 그림의 실제 밑동 자리를 재어 stage.json 에 적음 — 요소·덮개가 떠 보이지 않게(2026-11-04)

    python3 tools/stage-meta.py      # 무대 그림을 넣거나 바꾼 뒤(stage-index.py 와 함께) 돌림

그림에는 둘레에 투명한 여백이 있어 그림 맨 아래가 곧 밑동이 아님. 그래서 그림마다
  base  그림 높이 중 밑동 줄의 몫(가장 아래 불투명 줄, 0~1)
  foot  밑동 줄 둘레(아래 6%)에서 칠해진 가로 범위 [왼, 오른](0~1) — 그림자·덮개 폭
  shadowTop  그림자가 그려진 소품(ownShadow)만: 그림자가 시작하는 높이 몫(2026-11-12) — 무대가 그림자를 지평선 아래로
을 재어 items[이름] 과 skirtMeta[이름] 에 적는다. 앞가림·먼 띠(front·far)도 frontMeta·farMeta 에 base 를 적음.
"""
import glob, json, os
import numpy as np
from PIL import Image

ST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'media', 'stage')


def meta(path):
    a = np.array(Image.open(path).convert('RGBA'))[..., 3] > 100
    h, w = a.shape
    rows = np.where(a.any(1))[0]
    b = rows[-1]
    band = a[max(0, b - int(h * .06)):b + 1]
    xs = np.where(band.any(0))[0]
    return {'base': round((b + 1) / h, 4), 'foot': [round(xs[0] / w, 3), round((xs[-1] + 1) / w, 3)]}


def bottom_line(path, n=24):
    a = np.array(Image.open(path).convert('RGBA'))[..., 3] > 200; H, W = a.shape; out = []
    for i in range(n):
        x0, x1 = int(i * W / n), max(int(i * W / n) + 1, int((i + 1) * W / n)); col = a[:, x0:x1].any(1); r = np.where(col)[0]
        out.append(round(float(r[-1] + 1) / H, 3) if len(r) else -1)
    return out


def shadow_top(path):
    """그림자(검정 반투명, flat-shadow.py 알파 .2쯤)가 처음 나오는 줄의 몫(0~1). 물체 테두리의 반투명 점은 빼려고 한 줄에 폭의 1%(6점) 넘게 있는 줄만"""
    p = np.array(Image.open(path).convert('RGBA')).astype(int); a = p[..., 3]; L = p[..., :3].max(-1)
    sh = (a > 35) & (a < 70) & (L < 40); rows = np.where(sh.sum(1) >= max(6, a.shape[1] * .01))[0]
    return round(float(rows[0]) / a.shape[0], 4) if len(rows) else None


n = 0
BETA = os.path.join(os.path.dirname(ST), 'stage-beta')
for sj in sorted(glob.glob(os.path.join(ST, '*', '*', 'stage.json')) + glob.glob(os.path.join(BETA, '*', '*', 'stage.json'))):
    d = os.path.dirname(sj)
    c = json.load(open(sj, encoding='utf-8'))
    for k, it in c.get('items', {}).items():
        src = os.path.join(ST, it['from'], 'items', k + '.webp') if it.get('from') else os.path.join(d, 'items', k + '.webp')
        if os.path.exists(src) and not it.get('soak'):   # 밑동 스며들기 한 것은 스며들기 전에 잰 밑동을 지킴(tools/soak-base.py)
            it.update(meta(src)); n += 1
            if it.get('role') == 'big':   # 밑동 선(2026-11-12): 가로 24칸마다 가장 아래 불투명 줄의 몫 — 무대가 겹친 큰 소품의 밑동을 맞춤(stagekit settle)
                it['bottom'] = bottom_line(src)
            if it.get('ownShadow'):   # 그림자 꼭대기(2026-11-12): 그림 속 그림자가 시작하는 높이 몫 — 무대가 그림자를 지평선 아래로(stagekit settle)
                st = shadow_top(src)
                if st is None: it.pop('shadowTop', None)
                else: it['shadowTop'] = st
    for key, sub in (('skirtMeta', 'skirt'),):
        old = c.get(key, {})
        c[key] = {}
        names = set(c.get('skirt', []))
        for b in c.get('beds', {}).values():
            names |= set(b.get('skirt', []))
        for k in sorted(names):
            f = os.path.join(d, sub, k + '.webp')
            if os.path.exists(f):
                c[key][k] = dict(meta(f), name=old.get(k, {}).get('name', k)); n += 1
    for f in c.get('front', []) + c.get('far', []):
        p = os.path.join(d, 'front' if f in c.get('front', []) else 'far', f['src'] + '.webp')
        if os.path.exists(p):
            f['base'] = meta(p)['base']
    open(sj, 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1) + '\n')
print('밑동 잰 그림', n)
