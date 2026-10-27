#!/usr/bin/env python3
"""그림 가장자리 정리 — 흰 바탕을 지워 만든 그림(동물·소품)의 가장자리에 남은 흰 테두리를 없앤다.

    python3 tools/clean-edges.py 그림.webp [그림2.webp ...]          # 그 자리에 고쳐 씀
    python3 tools/clean-edges.py --check 그림.webp ...                # 고치지 않고 테두리 점 수만 보여 줌

어두운 배경(숲·바다) 위에 놓으면 이 테두리가 흰 점선처럼 드러나 "오려 붙인 티"가 난다.
하는 일(그림 안쪽의 불투명한 곳은 건드리지 않음):
  1. 가장자리(투명한 곳에서 4점 안)에서 깊은 안쪽 색보다 훨씬 밝은 점 = 흰 테두리 → 지움
     (반투명한 흰 기운과, 그림에 그려 넣은 불투명한 흰 선 모두)
     + 검은 윤곽선 바깥에 붙은 밝은 점도 지움(2026-10-27: 소·북극곰처럼 몸이 흰 그림은 위 방법으로 걸리지 않았음)
  2. 남은 반투명 가장자리는 색을 안쪽 색으로, 새로 드러난 가장자리는 살짝 부드럽게
  구름·눈처럼 원래 가장자리가 흰 그림은 안쪽도 희므로 그대로 남는다.
같은 그림에 두 번 돌려도 거의 바뀌지 않는다.
"""
import sys
import numpy as np
from PIL import Image

LIGHTER = 35      # 안쪽보다 이만큼(0~255) 밝으면 테두리로 봄
NEAR = 4          # 투명한 곳에서 이만큼(점) 안까지를 가장자리로 봄
CORE = 5          # 이만큼 둘레가 모두 불투명해야 '깊은 안쪽'


def box(x, r):
    """(2r+1)×(2r+1) 상자 합"""
    p = np.pad(x, ((r + 1, r), (r + 1, r)) + ((0, 0),) * (x.ndim - 2))
    c = p.cumsum(0).cumsum(1)
    k = 2 * r + 1
    return c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]


def inner_color(rgb, solid):
    """불투명한 곳의 색을 바깥으로 번지게 해 가장자리마다 '바로 안쪽 색'을 구함(가까운 것부터)"""
    w = solid.astype(float)
    acc = rgb * w[..., None]
    out = np.zeros_like(rgb); have = np.zeros(w.shape, bool)
    for r in (1, 2, 3, 5, 8):
        num, den = box(acc, r), box(w, r)
        ok = (den > 1e-3) & ~have
        out[ok] = num[ok] / den[ok][:, None]
        have |= ok
    return out, have


def shift(m, dx, dy):
    """m을 (dx,dy)만큼 민 것(밖은 False)"""
    out = np.zeros_like(m); H, W = m.shape
    ys, yd = (slice(0, H - dy), slice(dy, H)) if dy >= 0 else (slice(-dy, H), slice(0, H + dy))
    xs, xd = (slice(0, W - dx), slice(dx, W)) if dx >= 0 else (slice(-dx, W), slice(0, W + dx))
    out[yd, xd] = m[ys, xs]; return out


def outside_rim(lum, A, steps=3):
    """밝은 점 P에서 한쪽으로 가면(어두운 선을 넘지 않고) 곧 투명한 곳, 반대쪽으로 가면 곧 어두운 윤곽선
    → P는 윤곽선 바깥의 흰 테두리. 윤곽선 안쪽의 흰 털·흰 몸은 투명한 곳으로 가려면 윤곽선을 넘어야 하므로 남음"""
    light = (A > 0) & (lum > 195)
    dark = (A > 200) & (lum < 120)
    trans = A < 40
    rim = np.zeros_like(light)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
        reach = np.zeros_like(light); blocked = np.zeros_like(light); back = np.zeros_like(light)
        for k in range(1, steps + 1):
            # P에서 (dx,dy)로 k걸음 간 자리의 값을 P 자리로 가져옴 → shift(m, -k*dx, -k*dy)
            reach |= shift(trans, -k * dx, -k * dy) & ~blocked
            blocked |= shift(dark, -k * dx, -k * dy)
            back |= shift(dark, k * dx, k * dy)
        rim |= reach & back
    return light & rim


def clean(path, check=False):
    im = Image.open(path).convert('RGBA')
    a = np.array(im).astype(float); rgb, A = a[..., :3], a[..., 3]
    solid = A >= 250
    near = box((A < 8).astype(float), NEAR) > 0                     # 투명한 곳에서 NEAR점 안
    core = box(solid.astype(float), CORE) >= (2 * CORE + 1) ** 2 - .5  # 둘레가 모두 불투명한 깊은 안쪽
    fill, have = inner_color(rgb, core)
    lum = rgb.mean(-1); flum = fill.mean(-1)
    fringe = (A > 0) & near & ~core & have & (lum - flum > LIGHTER)  # 안쪽보다 훨씬 밝은 가장자리 = 흰 테두리(반투명이든 불투명이든)
    fringe |= outside_rim(lum, A)   # 검은 윤곽선 바깥에 붙은 밝은 점(소·북극곰처럼 몸이 흰 그림도)
    if check:
        return int(fringe.sum())
    out = a.copy()
    A2 = A.copy(); A2[fringe] = 0
    # 남은 반투명 가장자리는 색을 안쪽 색으로(흰 기운 없앰)
    soft = (A2 > 0) & (A2 < 250) & near & have
    out[soft, :3] = fill[soft]
    # 테두리를 지워 새로 드러난 가장자리는 살짝 부드럽게(계단 없이)
    touched = box(fringe.astype(float), 1) > 0
    edge = (A2 > 0) & touched
    avg = box(A2, 1) / 9
    A2[edge] = np.minimum(A2[edge], (A2[edge] + avg[edge]) / 2 + 40)
    out[..., 3] = A2
    Image.fromarray(np.clip(out + .5, 0, 255).astype('uint8'), 'RGBA').save(path, 'WEBP', quality=95, alpha_quality=100, method=6)
    return int(fringe.sum())


if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if x != '--check']
    chk = '--check' in sys.argv
    for p in args:
        print(p, '흰 테두리 점', clean(p, chk), '(확인만)' if chk else '→ 고침')
