#!/usr/bin/env python3
"""그림자 고르게 깔기(2026-11-12, 선생님 방식) — 그림자가 든 소품(bing-cut.py로 자른 것)에서 그림자는 '모양'만 쓰고,
그 자리에 검정을 한 가지 진하기(기본 20%)로 고르게 채운다. 빙이 칠한 그림자 속 결·얼룩·흰 점이 따라오지 않고, 소품마다 진하기가 같아진다.

    python3 tools/flat-shadow.py 소품.webp 나갈.webp                 # 그림자 모양을 스스로 찾음
    python3 tools/flat-shadow.py 소품.webp 나갈.webp --alpha .25     # 진하기(0~1, 기본 .2)
    python3 tools/flat-shadow.py 소품.webp 나갈.webp --mask 칠한.png  # 자동이 틀릴 때: 김프에서 그림자 자리를 검게 칠한 그림(소품과 같은 크기, 나머지는 투명이나 흰색)
    python3 tools/flat-shadow.py 받은.jpg 나갈.webp --key black      # 빙에게 그림자만 다른 색으로 받아 온 그림(흰 바탕): 테두리는 진한 회색·그림자만 검정
    python3 tools/flat-shadow.py 받은.jpg 나갈.webp --key blue       # 그림자만 파랑 — 그 색인 곳만 그림자로(색으로 가름, 어림 없음). 덤불·풀·야자는 --plant 를 붙임
    python3 tools/flat-shadow.py 받은.jpg 나갈.webp --black          # 테두리도 그림자도 검정으로 나온 그림(굵기로 어림해 가름)
    python3 tools/flat-shadow.py 폴더/items --all                    # 폴더 안 모두 제자리에서(이미 한 것은 다시 해도 같음)

셈: 물체 = 불투명한 큰 덩어리. 그림자 모양 = 반투명 그림자 점 + 그 안에 박힌 작은 불투명 점(빙 그림자의 결이 '선'으로 잡힌 것)
  + 물체 밑동에 붙은 푸른 회색 줄 → 틈을 메우고 가장자리를 매끈하게 → 물체 자리는 뺌. 가장자리만 2점쯤 부드럽게.
그림자 알파는 100 아래여야 함(stage-meta가 밑동을 물체로만 잼) — 진하기 .39 넘게는 못 줌.
"""
import sys, os, glob
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi


def blur(m, r):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255


def flat(src, dst, alpha=.2, mask=None):
    im = Image.open(src).convert('RGBA'); px = np.asarray(im).astype(float)
    H, W = px.shape[:2]; A = px[..., 3]; R, G, B = px[..., 0], px[..., 1], px[..., 2]
    solid = A >= 100
    lab, n = ndi.label(solid)
    size = ndi.sum(solid, lab, np.arange(n + 1))
    scol = np.abs(px[..., :3] - np.array([70, 58, 52.])).max(2) < 30   # bing-cut이 칠한 그림자 색(식물 가지 사이 옅은 종이는 밝아서 빠짐)
    old = (A > 8) & ~solid & scol                             # 옛 반투명 그림자
    near_old = ndi.binary_dilation(old, iterations=6)
    # 작은 불투명 점: 그림자에 닿아 있으면 그림자의 결(물체에서 떨어진 잔돌은 그림자에 안 닿거나 큼)
    touch = ndi.sum(near_old & solid, lab, np.arange(n + 1)) / np.maximum(size, 1)
    speck_id = (size < H * W * .0006) & (touch > .25); speck_id[0] = False
    speck = speck_id[lab]
    obj = solid & ~speck
    # 물체 밑동에 붙은 푸른 회색 줄(빙 그림자가 선으로 잡힌 것): 푸르고, 그림자 바로 곁
    bluish = obj & (B - R > 3) & (B >= G - 2) & ndi.binary_dilation(old | speck, iterations=8)
    obj &= ~bluish
    obj = ndi.binary_opening(obj, iterations=1) | (obj & ~ndi.binary_dilation(old | speck | bluish, iterations=2))
    if mask:
        mk = Image.open(mask).convert('RGBA').resize((W, H)); m = np.asarray(mk).astype(float)
        shape = (m[..., 3] > 127) & (m[..., :3].mean(2) < 128)
    else:
        # 또렷한 그림자(알파 40 넘게)가 든 큰 덩어리만 — 옅은 끝자락은 이어져 있으면 살리고, 식물 속에 따로 떨어진 옅은 자국은 버림
        weak = ndi.binary_opening(old & (A > 14), iterations=1)
        cl, cn = ndi.label(weak); idx = np.arange(cn + 1)
        strong = ndi.sum(old & (A > 40), cl, idx); big = strong >= max(strong.max() * .05, 1); big[0] = False
        core = ndi.binary_dilation(big[cl], iterations=6)
        shape = (old & (A > 14) | speck | bluish) & core
        shape = ndi.binary_closing(np.pad(shape, 12), iterations=5)[12:-12, 12:-12]   # 틈 메움
        seen = ndi.binary_dilation(shape, iterations=6)                               # 그림자가 실제로 있던 곳 곁에서만(식물 가지 사이를 다 채우지 않게)
        shape = ndi.binary_fill_holes(shape | obj) & ~obj & seen
        shape = ndi.binary_opening(shape, iterations=2)                               # 흩어진 점 버림
        shape = (blur(shape | obj, 4) > .5) & seen                                     # 가장자리 매끈하게
    sa = blur(shape | obj, 1.6) * alpha                       # 물체 밑으로 이어지게(둘 사이 틈 없음)
    oa = np.where(obj, A / 255, 0)
    keep = (A > 0) & ~solid & ~old & ~shape                   # 그림자가 아닌 반투명(물체 둘레 1점, 식물 가지 사이)은 그대로
    oa = np.where(keep, A / 255, oa)
    a = oa + sa * (1 - oa)                                    # 그림자(검정) 위에 물체
    col = px[..., :3] * (oa / np.maximum(a, 1e-6))[..., None]
    out = np.dstack([col, a * 255]).clip(0, 255).astype(np.uint8)
    out[a < .012] = 0
    Image.fromarray(out, 'RGBA').save(dst, 'WEBP', quality=93, alpha_quality=100, method=6)


def from_key(src, dst, key='black', alpha=.2, plant=False):
    """받을 때부터 테두리 색과 그림자 색을 나눈 그림(2026-11-12 선생님). 그림자 = 그 색인 곳, 물체 = 종이도 그림자도 아닌 곳.
    plant: 덤불·풀·야자처럼 가지 사이로 종이가 비치는 것 — 속을 메우지 않고, 그림자 위에 걸친 가지도 물체로 남김."""
    px = np.asarray(Image.open(src).convert('RGB')).astype(float); H, W = px.shape[:2]
    b = np.concatenate([px[:6].reshape(-1, 3), px[-6:].reshape(-1, 3), px[:, :6].reshape(-1, 3), px[:, -6:].reshape(-1, 3)])
    px = np.clip(px * (252 / np.median(b, 0)), 0, 255)        # 종이를 흰색으로
    R, G, B = px[..., 0], px[..., 1], px[..., 2]; L = px.mean(2); sat = px.max(2) - px.min(2)
    if key == 'blue':
        raw = (B - R > 45) & (B - G > 20) & (B > 110); wide = (B - R > 18) & (B - G > 8)   # wide = 가장자리의 옅은 파랑(종이·선과 섞인 점)
    else:
        raw = L < 40; wide = (L < 150) & (sat < 25)
    k = ndi.binary_opening(raw, iterations=2)                  # 가는 선 속의 우연한 점은 버림
    lab, n = ndi.label(k); sz = ndi.sum(k, lab, np.arange(n + 1)); big = sz >= max(sz.max() * .03, 1); big[0] = False
    shadow = big[lab]
    if sz.max() < H * W * .004: raise SystemExit(f'그림자 색({key})인 곳을 못 찾음 — 빙이 그 색으로 안 그린 그림: {src}')
    # 가지 사이로 비치는 그림자 조각: 파랑은 그림에서 그림자뿐이니 모두, 검정은 좀 큰 조각이거나 그림자 곁의 것만
    rl, rn = ndi.label(raw); rs = ndi.sum(raw, rl, np.arange(rn + 1))
    near = ndi.sum(raw & ndi.binary_dilation(shadow, iterations=12), rl, np.arange(rn + 1)) > 0
    ok = (rs >= 6) if key == 'blue' else ((rs >= 25) | near); ok[0] = False
    shadow |= ok[rl]
    if not plant: shadow = ndi.binary_fill_holes(shadow)
    # 그림자 가장자리의 섞인 점(종이·선과 섞여 옅어진 그림자 색) — 물체에 남으면 파란·검은 테가 됨
    if key == 'blue' and plant: halo = ndi.binary_dilation(shadow, iterations=2) & (B - R > 28) & (B - G > 10)   # 가는 가지에 번진 파랑 기는 가지 것(아래에서 색만 뺌)
    elif key == 'blue': halo = ndi.binary_dilation(shadow, iterations=5) & (B - R > 10) & (B - G > 3)
    elif plant: halo = ndi.binary_dilation(shadow, iterations=2) & (L < 60)
    else: halo = ndi.binary_dilation(shadow, iterations=3) & wide
    shadow |= halo
    paper = (L > 236) & (sat < 14)
    if plant:
        obj = ~paper & ~shadow
        lab, n = ndi.label(obj, np.ones((3, 3))); sz = ndi.sum(obj, lab, np.arange(n + 1)); keep = sz >= 30; keep[0] = False
        obj = keep[lab]                                         # 종이의 티끌은 버림
        oa = np.where(obj, np.clip((252 - L) / 30, 0, 1), 0.)  # 옅은 가장자리는 옅은 만큼(흰 테 없이)
        oa = np.where(obj & (sat > 20), np.maximum(oa, np.clip(sat / 40, 0, 1)), oa)
    else:
        lab, n = ndi.label(np.pad(paper | shadow, 1, constant_values=True)); bg = (lab == lab[0, 0])[1:-1, 1:-1]
        obj = ndi.binary_opening(~bg, iterations=1)
        lab, n = ndi.label(obj); sz = ndi.sum(obj, lab, np.arange(n + 1)); sz[0] = 0
        obj = ndi.binary_fill_holes(lab == sz.argmax()) & ~shadow   # 가장 큰 덩어리 = 물체(종이의 티끌은 버림)
        oa = np.where(obj, 1., 0.)
        ring = ndi.binary_dilation(obj, iterations=1) & ~obj & ~shadow          # 둘레 1점: 원본 진하기만큼(계단 없게)
        oa = np.where(ring, np.clip((250 - L) / 90, 0, 1), oa)
    if plant:   # 그림자 모양: 가지가 가린 자리도 그림자(가지 밑으로 이어짐) — 그림자 덩어리의 틈을 메움
        shape = ndi.binary_closing(np.pad(shadow, 10), iterations=6)[10:-10, 10:-10]
        shape = blur(shape, 1.5) > .5
        sa = blur(shape, 1.6) * alpha
    else:
        shape = (blur(shadow | obj, 2) > .5) & ~obj & ndi.binary_dilation(shadow, iterations=4)
        sa = blur(shape | obj, 1.6) * alpha
    a = oa + sa * (1 - oa)
    col = px.copy()
    if key == 'blue':   # 물체 가장자리에 번진 파랑 기는 빼 줌
        tint = obj & ndi.binary_dilation(shadow, iterations=5) & (B - R > 6)
        col[tint] = np.minimum(R, G)[tint, None] * np.array([1., .98, .93])   # 파랑을 빼고 따뜻한 회색으로
    col = col * (oa / np.maximum(a, 1e-6))[..., None]
    out = np.dstack([col, a * 255]).clip(0, 255).astype(np.uint8); out[a < .012] = 0
    im = Image.fromarray(out, 'RGBA'); bb = im.getbbox(); pad = 6
    im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(W, bb[2] + pad), min(H, bb[3] + pad))).save(dst, 'WEBP', quality=93, alpha_quality=100, method=6)


def from_black(src, dst, alpha=.2):
    """흰 바탕 + 물체 + 검정 그림자. 그림자 = 굵은 검정 덩어리(테두리선은 가늘어서 빠짐), 물체 = 색 있는 속 + 둘레 선."""
    px = np.asarray(Image.open(src).convert('RGB')).astype(float); H, W = px.shape[:2]
    L = px.mean(2); sat = px.max(2) - px.min(2)
    black = L < 60
    t = max(4, round(min(H, W) * .008))                       # 테두리선보다 굵은 것만 그림자
    blob = ndi.binary_dilation(ndi.binary_opening(black, iterations=t), iterations=t + 2) & black
    body = (L < 243) & ~blob | (sat > 14)                     # 색 있는 속·속의 가는 선
    body = ndi.binary_fill_holes(ndi.binary_closing(np.pad(body, 8), iterations=3)[8:-8, 8:-8])
    lab, n = ndi.label(body); sz = ndi.sum(body, lab, np.arange(n + 1)); sz[0] = 0
    body = lab == sz.argmax()                                 # 가장 큰 덩어리 = 물체
    body &= ~ndi.binary_dilation(blob, iterations=1)
    line = max(2, round(min(H, W) * .003))                    # 테두리선 굵기쯤
    obj = ndi.binary_dilation(body, iterations=line) & (L < 200) | body   # 그림자와 닿은 쪽 테두리선은 물체 것으로 되찾음(선 굵기만큼만)
    shape = ndi.binary_fill_holes(blob | obj) & ~obj & ndi.binary_dilation(blob, iterations=3)
    shape = (blur(shape | obj, 2) > .5) & ~obj
    oa = blur(obj, .7); oa = np.where(ndi.binary_erosion(obj, iterations=2), 1, oa)
    sa = blur(shape | obj, 1.6) * alpha
    a = oa + sa * (1 - oa)
    col = px * (oa / np.maximum(a, 1e-6))[..., None]
    edge = obj & ~ndi.binary_erosion(obj, iterations=2)       # 둘레는 선 색으로(흰 줄 안 남게)
    dark = np.dstack([ndi.minimum_filter(px[..., c], 3) for c in range(3)]); col[edge] = dark[edge] * (oa / np.maximum(a, 1e-6))[edge][..., None]
    out = np.dstack([col, a * 255]).clip(0, 255).astype(np.uint8); out[a < .012] = 0
    im = Image.fromarray(out, 'RGBA'); bb = im.getbbox(); pad = 6
    im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(W, bb[2] + pad), min(H, bb[3] + pad))).save(dst, 'WEBP', quality=93, alpha_quality=100, method=6)


if __name__ == '__main__':
    args = sys.argv[1:]
    opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
    alpha = float(opt('--alpha', .2)); assert alpha <= .39, '그림자 진하기는 .39까지'
    if '--key' in args: from_key(args[0], args[1], opt('--key'), alpha, '--plant' in args)
    elif '--black' in args: from_black(args[0], args[1], alpha)
    elif '--all' in args:
        for f in sorted(glob.glob(os.path.join(args[0], '*.webp'))): flat(f, f, alpha); print(f)
    else:
        flat(args[0], args[1], alpha, opt('--mask'))
