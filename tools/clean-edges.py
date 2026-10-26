#!/usr/bin/env python3
"""그림 가장자리 정리 — 흰 바탕을 지워 만든 그림(동물·소품)의 가장자리에 남은 흰 테두리를 없앤다.

    python3 tools/clean-edges.py 그림.webp [그림2.webp ...]          # 그 자리에 고쳐 씀
    python3 tools/clean-edges.py --check 그림.webp ...                # 고치지 않고 테두리 점 수만 보여 줌

어두운 배경(숲·바다) 위에 놓으면 이 테두리가 흰 점선처럼 드러나 "오려 붙인 티"가 난다.
하는 일(그림 안쪽의 불투명한 곳은 건드리지 않음):
  1. 가장자리(투명한 곳에서 4점 안)에서 깊은 안쪽 색보다 훨씬 밝은 점 = 흰 테두리 → 지움
     (반투명한 흰 기운과, 그림에 그려 넣은 불투명한 흰 선 모두)
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


def clean(path, check=False):
    im = Image.open(path).convert('RGBA')
    a = np.array(im).astype(float); rgb, A = a[..., :3], a[..., 3]
    solid = A >= 250
    near = box((A < 8).astype(float), NEAR) > 0                     # 투명한 곳에서 NEAR점 안
    core = box(solid.astype(float), CORE) >= (2 * CORE + 1) ** 2 - .5  # 둘레가 모두 불투명한 깊은 안쪽
    fill, have = inner_color(rgb, core)
    lum = rgb.mean(-1); flum = fill.mean(-1)
    fringe = (A > 0) & near & ~core & have & (lum - flum > LIGHTER)  # 안쪽보다 훨씬 밝은 가장자리 = 흰 테두리(반투명이든 불투명이든)
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
