#!/usr/bin/env python3
"""소품 선을 동물 선에 맞추기(2026-11-11 선생님: 극지 소품은 회색 선, 동물은 진한 선 — 찾기의 단서가 되고, 흰 바탕을 지울 때 위쪽 테두리가 탈색됨)

    python3 tools/line-unify.py media/stage-beta/nature/new-polar            # 그 곳 items/ 모두(이미 lined 인 것은 건너뜀)
    python3 tools/line-unify.py media/stage-beta/nature/new-polar iceberg    # 몇 개만

1) 선 색 = 그 곳 stage.json animals 그림들의 진한 선 가운데 색(stage.json lineColor 로 적음 — 있으면 그것을 씀)
2) 바깥 테두리 다시 긋기: 소품 모양 안쪽 가장자리에 그림 크기의 0.5%(2점 이상) 굵기로. 밑동 스며들기 띠(soak)에는 긋지 않음(밑동이 다시 딱딱해지지 않게)
3) 안쪽 회색 선(바위 금·얼음 면 경계): 소품 가운데 밝기보다 많이 어두운 무채색 점을 선 색 쪽으로
모양(알파)은 바꾸지 않으니 밑동 높이(base·foot)는 그대로. stage.json 에 lined 표시.
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter

def line_color(place, c):
    if c.get('lineColor'): return np.array(c['lineColor'], float)
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(place))))   # media/
    px = []
    for a in c.get('animals', []):
        f = os.path.join(root, a['src'])
        if not os.path.exists(f): continue
        im = np.array(Image.open(f).convert('RGBA')).astype(float); op = im[..., 3] > 200; L = im[..., :3].mean(-1)
        px.append(im[..., :3][op & (L < 110)])
    return np.median(np.concatenate(px), 0) if px else np.array([66., 46, 38])

def unify(path, T, soak=0.0):
    a = np.array(Image.open(path).convert('RGBA')).astype(float); H, W = a.shape[:2]
    al = a[..., 3]; m = al > 128
    ys = np.nonzero(m.any(1))[0]; yt, yb = ys[0], ys[-1]; hh = yb - yt + 1
    w = max(2, round(max(H, W) * .005))
    er = np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * w + 1))) > 128
    band = m & ~er                                                     # 안쪽 가장자리 띠
    # 띠 안에서 바깥에 가까울수록 진하게(가장 바깥 = 1)
    d = np.zeros((H, W)); cur = m.copy()
    for k in range(w):
        d += cur; n = np.array(Image.fromarray((cur * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))) > 128; cur = n
    f = np.clip(1.25 - d / w, 0, 1) * band
    if soak: f[int(yb - hh * max(soak, .12) * 1.2) + 1:, :] = 0   # 스며들기 띠는 그대로
    f[al < 200] = 0
    rgb = a[..., :3]; L = rgb.mean(-1); mx = rgb.max(-1); mn = rgb.min(-1); sat = (mx - mn) / (mx + 1e-6)
    med = np.median(L[m & ~band]) if (m & ~band).any() else np.median(L[m])
    inner = m & ~band & (sat < .3) & (L < med - 35)
    g = np.clip((med - 35 - L) / 45, 0, 1) * inner * .9                 # 많이 어두울수록 선 색에 가깝게
    if soak: g[int(yb - hh * max(soak, .12) * 1.2) + 1:, :] = 0
    k = np.maximum(f, g)[..., None]
    a[..., :3] = rgb * (1 - k) + T * k
    Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=95, alpha_quality=100, method=6)

if __name__ == '__main__':
    place = sys.argv[1]; names = sys.argv[2:]; sj = os.path.join(place, 'stage.json'); c = json.load(open(sj, encoding='utf-8'))
    T = line_color(place, c); c['lineColor'] = [int(v) for v in T]
    done = 0
    for k in names or list(c['items']):
        it = c['items'].get(k)
        if not it or it.get('from') or it.get('role') == 'frame' or it.get('lined'): continue
        f = os.path.join(place, 'items', k + '.webp')
        if os.path.exists(f): unify(f, T, it.get('soak', 0)); it['lined'] = True; done += 1
    open(sj, 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1) + '\n')
    print('선 맞춤', done, '개 · 선 색', c['lineColor'])
