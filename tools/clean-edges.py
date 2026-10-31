#!/usr/bin/env python3
"""그림 가장자리 정리 — 흰 바탕에 그린 그림(동물·소품)을 투명 배경으로 매끈하게.

    python3 tools/clean-edges.py 그림.webp [그림2.webp ...]           # 흰 바탕을 막 지운 그림을 그 자리에서 정리
    python3 tools/clean-edges.py --from a555b70^ 그림.webp ...        # git의 그 판(정리 전 원본)에서 다시 만들어 그 자리에 씀
    python3 tools/clean-edges.py --check 그림.webp ...                # 고치지 않고 '어두운 배경에서 보이는 흰 점' 수만

왜(2026-10-31 다시 씀):
  흰 바탕을 지우면 윤곽선 바깥의 '선과 흰 바탕이 섞인 점'(회색·연한 갈색)이 불투명하게 남아,
  어두운 배경 위에서 윤곽선 둘레에 흰 점이 톡톡 보인다. 예전 방법(밝은 점을 지움)은 점을 통째로 지워
  가장자리가 계단처럼 거칠어지고, 지우다 남은 점이 그대로 보였다.
어떻게:
  1. 원래 흰 바탕 위 모습으로 되돌린다(반투명 점도 흰 바탕과 섞어 봄).
  2. 바깥과 이어진 '거의 흰' 점, 그림 안에 갇힌 흰 바탕(다리 사이·가지 사이, 아래 HOLES)도 바깥으로.
  3. 가장자리 띠(바깥에서 윤곽선을 넘지 않고 5점 안)의 점마다 가까운 윤곽선 색 F를 찾고,
     '점 색 = F와 흰색을 섞은 것'으로 보고 섞인 비율을 불투명도로 삼는다(색은 F).
     → 흰 기운은 사라지고 윤곽선의 부드러운 가장자리는 그대로 남는다.
     F와 흰색을 섞은 색이 아닌 점(가는 다리의 밝은 줄, 분홍 촉수)과, 윤곽선보다 안쪽 점은 그림이므로 그대로.
  4. 윤곽선 없이 밝은 몸이 바로 바깥과 닿는 곳은 계단 없이 살짝 부드럽게, 외톨이 점은 지움.
  흰 털·흰 배·눈 흰자처럼 윤곽선 안의 흰색은 건드리지 않는다.
새 그림을 넣을 때: 이 도구로 정리 → 어두운 배경 위에서 확대해 보고, 다리·가지 사이에 흰 바탕이 갇혀 있으면
  그 자리 한 점을 HOLES에 적고 다시 돌린다. 풀·나무처럼 흰 곳이 전혀 없는 그림은 ALL_WHITE_IS_BG에 이름을 적는다.
"""
import sys, os, io, subprocess
import numpy as np
from PIL import Image

BAND = 5          # 바깥에서 이만큼(점) 안까지를 가장자리 띠로 봄
LINE_R = 5        # 이 반경 안에서 가장 어두운 점을 그 가장자리의 윤곽선으로 봄
MIX_TOL = 40      # 'F와 흰색을 섞은 색'에서 이만큼(0~255)까지 벗어나도 섞인 점으로 봄

# 그림 안에 갇힌 흰 바탕(이 점에서 이어진 흰 곳을 바깥으로) — 어두운 배경에 놓고 확대해 보며 고른 자리
HOLES = {
    '007/pics/chamsae.webp': [(286, 398)],
    '007/pics/doksuri.webp': [(235, 428)],
    '007/pics/goyangi.webp': [(198, 415)],
    '007/pics/kkachi.webp': [(305, 389)],
    '007/pics/saeu.webp': [(335, 269)],
    'media/animals/baengno.webp': [(222, 412)],
    'media/animals/bidulgi.webp': [(305, 427)],
    'media/animals/bueongi.webp': [(255, 434)],
    'media/animals/jeongal.webp': [(191, 277), (182, 311)],
    'media/animals/ojingeo.webp': [(169, 359), (224, 402)],
    'media/animals/haepari.webp': [(177, 268), (265, 277)],
    'media/animals/sangmagyeou.webp': [(263, 423)],
    'media/animals/ttanggangaji.webp': [(109, 273)],
    'media/animals/bukgeukgom.webp': [(328, 367), (134, 373)],
    'media/habitats/props/acacia.webp': [(213, 175), (360, 153), (248, 170), (148, 161), (230, 159), (301, 170)],
    'media/habitats/props/coral.webp': [(310, 113), (261, 130), (360, 191)],
}
# 흰 곳이 전혀 없는 그림(풀·나무): 거의 흰 점은 모두 바탕
ALL_WHITE_IS_BG = {'grass', 'goldgrass', 'rice', 'reeds', 'seaweed', 'marsh', 'fern', 'bush', 'acacia', 'coral', 'lilypads'}

N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
N8 = N4 + ((1, 1), (1, -1), (-1, 1), (-1, -1))


def sh(m, dx, dy, fill):
    """m을 (dx,dy)만큼 민 것(밖은 fill)"""
    H, W = m.shape[:2]; o = np.full_like(m, fill)
    ys, yd = (slice(0, H - dy), slice(dy, H)) if dy >= 0 else (slice(-dy, H), slice(0, H + dy))
    xs, xd = (slice(0, W - dx), slice(dx, W)) if dx >= 0 else (slice(-dx, W), slice(0, W + dx))
    o[yd, xd] = m[ys, xs]; return o


def grow(seed, allowed):
    """seed에서 allowed 안으로 4방향으로 끝까지 번짐"""
    cur = seed.copy()
    while True:
        g = np.zeros_like(cur)
        for dx, dy in N4: g |= sh(cur, dx, dy, False)
        new = g & allowed & ~cur
        if not new.any(): return cur
        cur |= new


def key_of(path):
    p = os.path.relpath(os.path.abspath(path), os.getcwd()).replace(os.sep, '/')
    return p


def matte(im, key=''):
    """RGBA 배열(흰 바탕을 지운 그림) → 정리한 RGBA 배열"""
    im = im.astype(float)
    a = im[..., 3:] / 255
    C = im[..., :3] * a + 255 * (1 - a)                 # 원래 흰 바탕 위 모습
    L = C @ [0.299, 0.587, 0.114]
    obj = im[..., 3] > 8
    white = (C.min(-1) > 238) & (np.ptp(C, -1) < 14)
    # 바깥과 이어진 거의 흰 점, 갇힌 흰 바탕
    bg = grow(~obj, obj & white)
    name = os.path.splitext(os.path.basename(key))[0]
    if name in ALL_WHITE_IS_BG:   # 풀 사이에 갇힌 바탕은 살짝 누렇게 바랜 것도 있음
        bg |= obj & (L > 232) & (np.ptp(C, -1) < 40)
    seeds = np.zeros_like(obj)
    for x, y in HOLES.get(key, []): seeds[y, x] = True
    if seeds.any():
        bg |= grow(seeds, obj & (C.min(-1) > 225) & (np.ptp(C, -1) < 25))
    obj &= ~bg
    # 바깥까지 거리 D(점, 9까지)
    D = np.where(obj, 9., 0.); reach = ~obj
    for k in range(1, 9):
        g = np.zeros_like(obj)
        for dx, dy in N8: g |= sh(reach, dx, dy, False)
        new = g & ~reach; D[new] = k; reach |= new
    # 가까운 곳에서 가장 어두운 불투명 점 = 그 가장자리의 윤곽선(색 F, 밝기 LF, 거리 DF)
    Lm = np.where(obj, L, 999.); LF = Lm.copy(); F = C.copy(); DF = D.copy()
    for r in range(1, LINE_R + 1):
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                if max(abs(dx), abs(dy)) != r: continue
                l2 = sh(Lm, dx, dy, 999.)
                k = l2 < LF
                LF[k] = l2[k]; F[k] = sh(C, dx, dy, 255.)[k]; DF[k] = sh(D, dx, dy, 0.)[k]
    # 가장자리 띠: 바깥에서 윤곽선을 넘지 않고 BAND점 안
    passable = obj & (L > LF + 25)
    band = np.zeros_like(obj); front = ~obj
    for _ in range(BAND):
        g = np.zeros_like(obj)
        for dx, dy in N4: g |= sh(front, dx, dy, False)
        new = g & passable & ~band; band |= new; front = new
    t = np.clip((255 - L) / np.maximum(255 - LF, 1), 0, 1)   # F가 섞인 비율
    mix = t[..., None] * F + (1 - t[..., None]) * 255
    ok = band & (LF < 200) & (np.abs(C - mix).max(-1) < MIX_TOL) & (DF >= D)
    al = np.ones(L.shape); al[ok] = t[ok]; al[~obj] = 0
    al[al < 0.06] = 0
    rgb = C.copy(); rgb[ok] = F[ok]
    # 윤곽선 없이 밝은 몸이 바로 바깥과 닿는 곳: 둘레 비율만큼 살짝 부드럽게
    on = (al > 0).astype(float); cnt = on.copy()
    for dx, dy in N8: cnt += sh(on, dx, dy, 0.)
    edge = (al > 0) & ~ok & (cnt < 9)
    al[edge] = np.minimum(al[edge], (cnt[edge] + 1) / 10)
    # 외톨이 점
    nb = np.zeros(L.shape)
    for dx, dy in N8: nb += sh(al, dx, dy, 0.)
    al[(nb < 1.0) & (al < 0.9)] = 0
    rgb[al == 0] = 0
    return np.dstack([rgb, al * 255]).round().clip(0, 255).astype(np.uint8)


def light_rim(arr):
    """어두운 배경에 놓았을 때 둘레에서 보이는 흰 점 수(가까운 윤곽선보다 훨씬 밝은 가장자리 점)"""
    im = arr.astype(float); a = im[..., 3] / 255; L = im[..., :3] @ [0.299, 0.587, 0.114]
    tr = a < 0.03; nt = np.zeros_like(tr)
    for dx, dy in N8: nt |= sh(tr, dx, dy, False)
    m = np.where(a > 0.9, L, 999.); b = m.copy()
    for dx in range(-3, 4):
        for dy in range(-3, 4): b = np.minimum(b, sh(m, dx, dy, 999.))
    return int(((~tr) & nt & (L * a > 140) & (L - b > 80)).sum())


if __name__ == '__main__':
    args = sys.argv[1:]; rev = None; check = False
    if '--check' in args: check = True; args.remove('--check')
    if '--from' in args:
        i = args.index('--from'); rev = args[i + 1]; del args[i:i + 2]
    for p in args:
        if check:
            print(p, '보이는 흰 점', light_rim(np.array(Image.open(p).convert('RGBA')))); continue
        key = key_of(p)
        if rev:
            data = subprocess.run(['git', 'show', f'{rev}:{key}'], capture_output=True, check=True).stdout
            src = Image.open(io.BytesIO(data))
        else:
            src = Image.open(p)
        out = matte(np.array(src.convert('RGBA')), key)
        Image.fromarray(out, 'RGBA').save(p, 'WEBP', quality=95, alpha_quality=100, method=6)
        print(p, '정리함 · 보이는 흰 점', light_rim(out))
