#!/usr/bin/env python3
"""그림자 고르게 깔기(2026-11-12, 선생님 방식) — 그림자가 든 소품(bing-cut.py로 자른 것)에서 그림자는 '모양'만 쓰고,
그 자리에 검정을 한 가지 진하기(기본 20%)로 고르게 채운다. 빙이 칠한 그림자 속 결·얼룩·흰 점이 따라오지 않고, 소품마다 진하기가 같아진다.

    python3 tools/flat-shadow.py 소품.webp 나갈.webp                 # 그림자 모양을 스스로 찾음
    python3 tools/flat-shadow.py 소품.webp 나갈.webp --alpha .25     # 진하기(0~1, 기본 .2)
    python3 tools/flat-shadow.py 받은.jpg 나갈.webp --key blue          # 빙에게 그림자만 파랑으로 받아 온 그림(흰 바탕): 그 색인 곳만 그림자로
    python3 tools/flat-shadow.py 받은.jpg 나갈.webp --key blue --plant  # 덤불·풀·야자처럼 가지 사이가 비치는 것
    python3 tools/flat-shadow.py 받은.jpg 나갈.webp --key red           # 소품이 파란색이면 그림자를 빨강으로 받아서(2026-11-12 선생님)
    python3 tools/flat-shadow.py 폴더/items --all                    # 폴더 안 모두 제자리에서(이미 한 것은 다시 해도 같음)

셈: 물체 = 불투명한 큰 덩어리. 그림자 모양 = 반투명 그림자 점 + 그 안에 박힌 작은 불투명 점(빙 그림자의 결이 '선'으로 잡힌 것)
  + 물체 밑동에 붙은 푸른 회색 줄 → 틈을 메우고 가장자리를 매끈하게 → 물체 자리는 뺌. 가장자리만 2점쯤 부드럽게.
받는 프롬프트·시험 결과는 media/stage/prompts/PROMPTS-shadow-key.txt. numpy·Pillow·scipy 필요(pip install scipy).
그림자 알파는 100 아래여야 함(stage-meta가 밑동을 물체로만 잼) — 진하기 .39 넘게는 못 줌.
"""
import sys, os, glob
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi


def blur(m, r):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255


def flat(src, dst, alpha=.2):
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


def from_key(src, dst, key='blue', alpha=.2, plant=False):
    """받을 때부터 테두리 색과 그림자 색을 나눈 그림(2026-11-12 선생님). 그림자 = 그 색인 곳, 물체 = 종이도 그림자도 아닌 곳.
    plant: 덤불·풀·야자처럼 가지 사이로 종이가 비치는 것 — 속을 메우지 않고, 그림자 위에 걸친 가지도 물체로 남김."""
    px = np.asarray(Image.open(src).convert('RGB')).astype(float); H, W = px.shape[:2]
    b = np.concatenate([px[:6].reshape(-1, 3), px[-6:].reshape(-1, 3), px[:, :6].reshape(-1, 3), px[:, -6:].reshape(-1, 3)])
    px = np.clip(px * (252 / np.median(b, 0)), 0, 255)        # 종이를 흰색으로
    assert key in ('blue', 'red'), '그림자 색은 blue(기본) 또는 red(소품이 파랄 때)'
    swap = key == 'red'
    if swap: px = px[..., ::-1]; key = 'blue'                 # 빨강 그림자: 빨강·파랑 자리를 바꿔 파랑과 똑같이 셈하고 끝에서 되돌림
    R, G, B = px[..., 0], px[..., 1], px[..., 2]; L = px.mean(2); sat = px.max(2) - px.min(2)
    raw = (B - R > 45) & (B - G > 20) & (B > 110)             # 그림자 색(빙은 주문보다 조금 옅게 줌)
    k = ndi.binary_opening(raw, iterations=2)                  # 가는 선 속의 우연한 점은 버림
    lab, n = ndi.label(k); sz = ndi.sum(k, lab, np.arange(n + 1)); big = sz >= max(sz.max() * .03, 1); big[0] = False
    shadow = big[lab]
    if sz.max() < H * W * .004: raise SystemExit(f'그림자 색({key})인 곳을 못 찾음 — 빙이 그 색으로 안 그린 그림: {src}')
    # 가지 사이로 비치는 그림자 조각: 파랑은 그림에서 그림자뿐이니 모두, 검정은 좀 큰 조각이거나 그림자 곁의 것만
    rl, rn = ndi.label(raw); rs = ndi.sum(raw, rl, np.arange(rn + 1))
    ok = rs >= 6; ok[0] = False
    shadow |= ok[rl]
    if not plant: shadow = ndi.binary_fill_holes(shadow)
    # 그림자 가장자리의 섞인 점(종이·선과 섞여 옅어진 그림자 색) — 물체에 남으면 파란·검은 테가 됨
    if plant: halo = ndi.binary_dilation(shadow, iterations=2) & (B - R > 28) & (B - G > 10)   # 가는 가지에 번진 그림자 색 기는 가지 것(아래에서 색만 뺌)
    else:   # 그림자와 닿은 쪽 테두리선(그림자보다 뚜렷이 어두운 점)은 물체 것 — 그림자로 먹히면 선이 잘림(2026-11-12 선생님이 찾음)
        Lsh = np.median(L[shadow])
        halo = ndi.binary_dilation(shadow, iterations=5) & (B - R > 10) & (B - G > 3) & (L > Lsh - 25)
    shadow |= halo
    paper = (L > 236) & (sat < 14)
    S8 = np.ones((3, 3), bool)
    if plant:
        obj = ~paper & ~shadow
        # 그림자 바깥 가장자리 띠에 남는 가는 점선 지우기: 그림자 색과 종이가 섞인 점(파랑은 옅은 파랑, 검정은 무채색 회색)은
        # 곁(2점 안)에 물체다운 점(가지 속 색·잎·진한 선)이 없으면 그림자 테두리의 찌꺼기 — 가지가 그림자를 건너는 곳은 곁에 가지 속이 있어 남음
        closed = ndi.binary_closing(np.pad(shadow, 10), iterations=6)[10:-10, 10:-10]
        band = ndi.binary_dilation(closed, iterations=4) & ~ndi.binary_erosion(closed, iterations=3)
        mix = (B - R > 25) | ((B - R > 4) & (L > 125)) | ((sat < 14) & (L > 150))   # 진한 그림자 색 테두리·옅은 그림자 색·밝은 무채색(압축 번짐)
        sure = obj & ~mix
        obj &= ~(band & mix & ~ndi.binary_dilation(sure, S8, iterations=1))
        lab, n = ndi.label(obj, S8); sz = ndi.sum(obj, lab, np.arange(n + 1)); keep = sz >= 30; keep[0] = False
        inside = ndi.sum(ndi.binary_dilation(closed, iterations=4), lab, np.arange(n + 1)) >= sz * .9
        onband = ndi.sum(band, lab, np.arange(n + 1)) >= sz * .5
        keep &= ~(inside & (sz < 250)) & ~(onband & (sz < 120))   # 그림자 가장자리 띠에 걸린 작은 점도                          # 그림자 속에 따로 뜬 작은 조각(줄기가 그림자 색에 묻혀 끊긴 잎·가지 끝)도 버림
        ids = np.arange(n + 1); bigm = ((sz >= 250) & keep)[lab]
        nearsh = ndi.sum(ndi.binary_dilation(closed, iterations=12), lab, ids) >= sz * .5
        alone = ndi.sum(ndi.binary_dilation(bigm, iterations=4), lab, ids) == 0
        keep &= ~(nearsh & alone & (sz < 250))                  # 그림자 끝에 따로 떨어진 작은 점(그림자 테두리 찌꺼기)
        obj = keep[lab]                                         # 종이의 티끌은 버림
    else:
        lab, n = ndi.label(np.pad(paper | shadow, 1, constant_values=True)); bg = (lab == lab[0, 0])[1:-1, 1:-1]
        obj = ndi.binary_opening(~bg, iterations=1)
        lab, n = ndi.label(obj); sz = ndi.sum(obj, lab, np.arange(n + 1)); sz[0] = 0
        obj = ndi.binary_fill_holes(lab == sz.argmax()) & ~shadow   # 가장 큰 덩어리 = 물체(종이의 티끌은 버림)
        for _ in range(12):   # 테두리선 밖에 붙은 밝은 무채색 테(종이가 덜 흰 곳)를 선이 나올 때까지 벗김 — 색 있는 몸은 안 벗겨짐
            peel = obj & ndi.binary_dilation(~obj & ~shadow, S8) & (L > 180) & (sat < 26)
            if not peel.any(): break
            obj &= ~peel
    # 물체 둘레의 흰 테 없애기: 종이와 맞닿은 가장자리 점은 '선 색이 흰 종이에 섞인 것'으로 보고 되돌림 —
    # 색은 곁의 가장 진한 색(선 색), 진하기는 섞인 만큼. 밝은 종이색이 반투명으로 남지 않음.
    out_bg = ~obj & ~shadow
    rim = (obj & ndi.binary_dilation(out_bg, S8)) | (out_bg & ndi.binary_dilation(obj, S8))
    Lmin = ndi.minimum_filter(L, 3)
    cmin = np.dstack([ndi.minimum_filter(px[..., c], 3) for c in range(3)])
    oa = np.where(obj, 1., 0.)
    oa = np.where(rim, np.clip((246 - L) / np.maximum(246 - Lmin, 60), 0, 1), oa)   # 덜 흰 종이(결 있는 종이)도 테로 남지 않게 바닥 60
    oa[rim & (oa < .08)] = 0
    col = px.copy(); col[rim] = cmin[rim]
    if plant:   # 그림자 모양: 가지가 가린 자리도 그림자(가지 밑으로 이어짐) — 그림자 덩어리의 틈을 메움
        shape = blur(closed, 1.5) > .5
        sa = blur(shape, 1.6) * alpha
    else:
        shape = (blur(shadow | obj, 2) > .5) & ~obj & ndi.binary_dilation(shadow, iterations=4)
        sa = blur(shape | obj, 1.6) * alpha
    a = oa + sa * (1 - oa)
    Rc, Gc, Bc = col[..., 0], col[..., 1], col[..., 2]          # 물체 가장자리에 번진 그림자 색 기는 빼고 따뜻한 회색으로
    tint = (oa > 0) & ndi.binary_dilation(shadow, iterations=5) & (Bc - Rc > 6)
    warm = np.array([.93, .98, 1.]) if swap else np.array([1., .98, .93])
    col[tint] = np.minimum(Rc, Gc)[tint, None] * warm
    if swap: col = col[..., ::-1]
    col = col * (oa / np.maximum(a, 1e-6))[..., None]
    out = np.dstack([col, a * 255]).clip(0, 255).astype(np.uint8); out[a < .012] = 0
    im = Image.fromarray(out, 'RGBA'); bb = im.getbbox(); pad = 6
    im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(W, bb[2] + pad), min(H, bb[3] + pad))).save(dst, 'WEBP', quality=93, alpha_quality=100, method=6)


if __name__ == '__main__':
    args = sys.argv[1:]
    opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
    alpha = float(opt('--alpha', .2)); assert alpha <= .39, '그림자 진하기는 .39까지'
    if '--key' in args: from_key(args[0], args[1], opt('--key'), alpha, '--plant' in args)
    elif '--all' in args:
        for f in sorted(glob.glob(os.path.join(args[0], '*.webp'))): flat(f, f, alpha); print(f)
    else:
        flat(args[0], args[1], alpha)
