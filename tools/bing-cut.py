#!/usr/bin/env python3
"""빙 연필풍 그림 자르기 — 원본 모양·테두리는 그대로, 그림자는 소품만(2026-11-12, 선생님)

    python3 tools/bing-cut.py 받은.jpg 나갈.webp            # 소품: 물체 + 그림자(반투명, 알파 92까지)
    python3 tools/bing-cut.py 받은.jpg 나갈.webp --animal   # 동물: 그림자·바닥 자국 없이 몸만
    python3 tools/bing-cut.py 받은.jpg 나갈.webp --animal --holes   # 뱀 똬리처럼 몸 안 큰 흰 틈도 지움
    python3 tools/bing-cut.py 받은.jpg 나갈.webp --plant    # 덤불·풀·야자·회전초·가지: 가지 사이 옅은 종이도 투명
    python3 tools/bing-cut.py 받은.jpg 나갈.webp --white    # 가늘고 촘촘한 물풀(검정말·붕어마름): 흰색을 통째로 투명으로(옛 white-to-alpha.py, 2026-11-14)

shadow-split.py·pencil-cut.py로 자르니(2026-11-12 선생님): 낙타에 흰 줄·그림자가 남고, 야자수·풀이 반투명해지고, 돌 테두리가 흐려짐.
까닭: 옅은 잎·마른 가지·돌의 회색 그늘을 '색이 옅으니 그림자'로 봄, 바깥 종이를 밝기만큼 반투명으로 남김.
가르는 법(색과 결):
  1) 종이색(테두리 중앙값)을 흰색으로 맞춤 → 종이는 회색 0, 빙 그림자는 살짝 푸른 회색, 물체(모래색·돌·잎·가지)는 따뜻하거나 푸른 잎색.
  2) 물체 = 진한 테두리선(밝기<150)으로 둘러싸인 안쪽(돌·줄기·몸 — 테두리가 원본 그대로) + 둘레보다 진한 가는 선(가지·잎맥·풀잎)
     + 푸른 잎색. 빙 그림자는 종이의 따뜻한 기가 섞여 색만으로는 못 가름 → 테두리 밖의 매끈한 면 = 그림자.
     조각들을 2점 이어 붙이고 둘러싸인 안쪽을 채움.
  3) 채운 안쪽에서도 종이(밝기≥246·회색, 큰 덩어리)는 뚫음(덤불 가지 사이·야자 잎 사이). 동물은 흰 털이 있어 매끈한 종이(다리 사이)만 뚫음, 뱀 똬리는 --holes.
  4) 물체 밖: 소품은 매끈한 회색 = 그림자(진하기만큼, 알파 92까지, 색은 회갈색), 동물은 모두 투명.
     물체 둘레 1점만 원본 그대로 반투명(계단 없게) — 바깥 흰 테두리는 남기지 않음.
"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

import os
DEBUG = os.environ.get('CUTDEBUG')
SHADOW_COL = np.array([70, 58, 52.]); SHADOW_MAX = 92


def flood(free, seeds_border=True):
    """가장자리에서 free를 따라 이어진 곳"""
    H, W = free.shape; out = np.zeros_like(free); q = deque()
    for x in range(W):
        for y in (0, H - 1):
            if free[y, x] and not out[y, x]: out[y, x] = 1; q.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if free[y, x] and not out[y, x]: out[y, x] = 1; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            a, b = y + dy, x + dx
            if 0 <= a < H and 0 <= b < W and free[a, b] and not out[a, b]: out[a, b] = 1; q.append((a, b))
    return out.astype(bool)


def comps_big(m, min_px):
    """m에서 min_px보다 큰 이어진 덩어리만"""
    H, W = m.shape; seen = np.zeros_like(m); keep = np.zeros_like(m)
    for y0, x0 in zip(*np.nonzero(m)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = 1; pts = []
        while q:
            y, x = q.popleft(); pts.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = y + dy, x + dx
                if 0 <= a < H and 0 <= b < W and m[a, b] and not seen[a, b]: seen[a, b] = 1; q.append((a, b))
        if len(pts) >= min_px:
            ys, xs = zip(*pts); keep[list(ys), list(xs)] = 1
    return keep.astype(bool)


def outlined(m, dark, frac=0.04):
    """m의 덩어리 가운데 둘레(바깥 3점)의 frac 넘게 진한 선인 것만"""
    H, W = m.shape; seen = np.zeros_like(m); keep = np.zeros_like(m)
    for y0, x0 in zip(*np.nonzero(m)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = 1; pts = []
        while q:
            y, x = q.popleft(); pts.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = y + dy, x + dx
                if 0 <= a < H and 0 <= b < W and m[a, b] and not seen[a, b]: seen[a, b] = 1; q.append((a, b))
        ys, xs = map(np.array, zip(*pts)); y0_, y1_, x0_, x1_ = max(0, ys.min() - 4), ys.max() + 5, max(0, xs.min() - 4), xs.max() + 5
        sub = np.zeros((y1_ - y0_, x1_ - x0_), bool); sub[ys - y0_, xs - x0_] = True
        ring = morph(sub, 7, 'grow') & ~sub
        dk = dark[y0_:y1_, x0_:x1_]; ring = ring[:dk.shape[0], :dk.shape[1]]
        f = dk[ring].mean() if ring.any() else 0
        if DEBUG: print('  틈', len(pts), (int(ys.mean()), int(xs.mean())), round(float(f), 2))
        if f > frac:
            keep[ys, xs] = 1
    return keep.astype(bool)


def morph(m, n, op):
    im = Image.fromarray((m * 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.MaxFilter(n) if op == 'grow' else ImageFilter.MinFilter(n))) > 127


def cut(src, dst, animal=False, holes=False, plant=False):
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(float)
    H, W, _ = rgb.shape
    b = np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3), rgb[:, :6].reshape(-1, 3), rgb[:, -6:].reshape(-1, 3)])
    paper = np.median(b, 0)
    wb = np.clip(rgb * (252 / paper), 0, 255)
    R, G, B = wb[..., 0], wb[..., 1], wb[..., 2]; L = wb.mean(2)
    Li = Image.fromarray(L.astype(np.uint8))
    m1 = np.asarray(Li.filter(ImageFilter.BoxBlur(2))).astype(float)
    m2 = np.asarray(Image.fromarray(np.clip(L * L / 255, 0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(2))).astype(float) * 255
    std = np.sqrt(np.clip(m2 - m1 * m1, 0, None))
    warm = ((R - B) > 5) | ((G - B) > 5)
    med = np.asarray(Li.filter(ImageFilter.MedianFilter(9))).astype(float)
    walls = morph((L < 150) & ~((B - R) > 3), 3, 'grow')          # 진한 테두리선(밑의 푸른 그림자 줄은 빼고)
    enclosed = ~flood(~walls)                                     # 선으로 둘러싸인 안쪽(돌·줄기·몸)
    strokes = (med - L > 12) & (L < 225)                          # 둘레보다 진한 가는 선(가지·잎맥·풀잎 테두리)
    green = ((G - B) > 12) & (G >= R - 4) & (L < 240)             # 잎(푸른 잎색) — 그림자는 회색·회갈색
    obj = enclosed | strokes | green
    if animal:
        obj |= warm & (L < 247)                                    # 동물 털은 선 안에 다 들어 있지 않을 수 있음
    obj = morph(morph(obj, 5, 'grow'), 5, 'shrink')            # 조각을 이어 붙임(2점)
    obj = ~flood(~obj)                                            # 둘러싸인 안쪽 채움
    paperish = (L >= 246) & (np.abs(R - B) < 6) & (np.abs(G - B) < 6)
    soft = np.zeros_like(L)
    if not animal or holes:
        inner_paper = obj & paperish
        obj &= ~comps_big(inner_paper, int(H * W * 0.002) if animal else 12)   # 가지·잎 사이 종이
    if plant:   # 식물: 가지 사이 옅은 종이(회색·밝음, 선 아님)는 밝기만큼 투명
        gap = obj & ~strokes & ~green & (L >= 230) & (std < 4)      # 매끈하고 밝은 곳 = 종이(빙 종이는 자리마다 미색이 달라 색으로는 못 가름)
        soft = np.where(gap, np.clip((L - 230) / 14, 0, 1), 0)
    else:   # 동물: 다리 사이처럼 매끈하고 밝은 종이 덩어리만(흰 털은 결이 있어 남음)
        cand = comps_big(obj & (std < 2.5) & (L >= 243) & ~strokes, int(H * W * 0.0002))
        obj &= ~morph(outlined(cand, L < 150), 3, 'grow')   # 둘레가 진한 선인 흰 틈만(오릭스·여우 흰 털은 둘레가 옅은 털 결이라 남음)
    a = obj.astype(float) * (1 - soft)
    # 둘레 1점: 원본 진하기만큼, 색은 곁의 선 색(밝은 종이색이 흰 줄로 남지 않게)
    ring = morph(obj, 3, 'grow') & ~obj
    a = np.where(ring, np.clip((252 - L) / 70, 0, 1) * 0.9, a)
    col = wb.copy()
    dark = np.dstack([np.asarray(Image.fromarray(wb[..., c].astype(np.uint8)).filter(ImageFilter.MinFilter(3))) for c in range(3)]).astype(float)
    col[ring] = dark[ring]
    if not animal:   # 그림자: 물체 밖의 어두운 정도(흐리게 고른 밝기)만큼, 알파 92까지 — 경계가 계단지지 않게
        Lb = np.asarray(Image.fromarray(L.astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(float)
        sa = np.clip((248 - Lb) / 50, 0, 1) * (SHADOW_MAX / 255)
        put = ~obj & ~ring & (sa > .03)
        a = np.where(put, sa, a)
        col[put] = SHADOW_COL
    out = Image.fromarray(np.dstack([col, np.clip(a, 0, 1) * 255]).astype(np.uint8), 'RGBA')
    bb = out.split()[-1].point(lambda v: 255 if v > 40 else 0).getbbox()
    pad = 6
    out = out.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(W, bb[2] + pad), min(H, bb[3] + pad)))
    out.save(dst, 'WEBP', quality=93, alpha_quality=100, method=6)
    return out.size


def white(src, dst):
    """--white: 종이색을 순백으로 맞춘 뒤 '흰색을 투명으로'(밝을수록 투명, 색은 흰 바탕을 뺀 잉크 색) — 흰 테두리가 남을 수 없음.
    잎 사이·가장자리에 흰 종이가 남는 가는 물풀용(2026-11-14 선생님: 흰색이 따로 논다). 연한 잎은 조금 비쳐 바탕과 섞임."""
    a = np.asarray(Image.open(src).convert('RGB')).astype(float)
    b = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    a = np.clip(a * (255 / np.median(b, 0)), 0, 255)              # 종이를 순백으로
    al = np.clip((np.max((255 - a) / 255, axis=2) - .06) / .94, 0, 1)   # 흰색을 투명으로, 종이 결 옅은 얼룩은 0
    c = np.clip(np.where(al[..., None] > 0, (a - 255 * (1 - al[..., None])) / np.maximum(al[..., None], 1e-3), 0), 0, 255)
    im = Image.fromarray(np.dstack([c, al * 255]).astype(np.uint8), 'RGBA')
    bb = im.split()[3].point(lambda v: 255 if v > 30 else 0).getbbox(); im = im.crop((max(0, bb[0] - 4), max(0, bb[1] - 4), bb[2] + 4, bb[3] + 4))
    im.save(dst, 'WEBP', quality=93, alpha_quality=100, method=6)
    return im.size


if __name__ == '__main__':
    if '--white' in sys.argv[3:]: print(white(sys.argv[1], sys.argv[2])); sys.exit()
    print(cut(sys.argv[1], sys.argv[2], animal='--animal' in sys.argv[3:], holes='--holes' in sys.argv[3:], plant='--plant' in sys.argv[3:]))
