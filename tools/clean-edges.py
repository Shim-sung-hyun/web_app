#!/usr/bin/env python3
"""그림 가장자리 정리 — 흰 바탕을 지워 만든 그림(동물·소품)의 가장자리에 남은 흰 테두리를 없앤다.

    python3 tools/clean-edges.py 그림.webp [그림2.webp ...]          # 그 자리에 고쳐 씀
    python3 tools/clean-edges.py --check 그림.webp ...                # 고치지 않고 테두리 점 수만 보여 줌
    (numpy·Pillow·scipy가 필요: pip install scipy)

어두운 배경(숲·바다) 위에 놓으면 이 테두리가 흰 점선처럼 드러나 "오려 붙인 티"가 난다.

2026-10-31 새로 짬: 첫 판(밝은 점을 지움)은 검은 윤곽선의 부드러운 가장자리까지 갉아 먹어,
흰 바탕 위에서 윤곽선이 들쭉날쭉하고 흰 점이 콕콕 박힌 것처럼 보였다. 그래서 지우지 않고 '풀어낸다'.
  1. 바깥(투명한 곳)에서 밝은 점을 따라 들어가다 윤곽선(둘레에서 가장 어두운 색에 가까운 점)에서 멈춤
     → 그 사이의 점 = 윤곽선 색과 흰 바탕이 섞인 점
  2. 그 점은 "윤곽선 색 × 얼마 + 흰색 × 나머지"로 보고, 색은 윤곽선 색으로, 불투명도는 '얼마'만큼으로 바꿈
     → 흰 기운만 빠지고 윤곽선의 매끈한 가장자리(안티에일리어싱)는 그대로 남음
  윤곽선 안쪽은 건드리지 않음. 윤곽선이 없는 그림(구름·눈처럼 가장자리가 흰 것)은 그대로 둠.
  같은 그림에 두 번 돌려도 바뀌지 않음.
원본은 정리하기 전 그림(흰 테두리가 있는 것)이어야 가장 곱다 — 첫 판으로 이미 갉아 먹힌 그림은 git의 그 전 판에서 꺼내 돌림.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

NEAR = 6        # 투명한 곳에서 이만큼(점) 안까지만 테두리로 봄
LINE_NEAR = 4   # 윤곽선에서 이만큼 안의 점만 풀어냄(윤곽선 없는 그림은 그대로)
LINE_GAP = 28   # 둘레(7×7)의 가장 어두운 색보다 이만큼 안 밝으면 윤곽선
LIGHT = 12      # 윤곽선 색보다 이만큼 밝아야 '흰 기운'으로 셈(--check)


def fix(path, check=False):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    rgb, a = im[..., :3], im[..., 3] / 255
    L = rgb @ [.299, .587, .114]
    clear = a < 0.04
    dist = nd.distance_transform_edt(~clear)
    Lm = np.where(a > 0.5, L, 255.0)
    dark = (a > 0.5) & (L <= np.minimum(nd.minimum_filter(Lm, size=7) + LINE_GAP, 150))
    if not dark.any():
        return 0
    dd, idx = nd.distance_transform_edt(~dark, return_indices=True)
    # 바깥에서 윤곽선이 아닌 점을 따라 들어감(NEAR 안에서만 — 윤곽선 틈으로 안쪽까지 새지 않게)
    lab, _ = nd.label(((~dark) & (dist <= NEAR)) | clear)
    outside = np.isin(lab, np.unique(lab[clear])) & ~clear
    m = (outside | ((a < 0.98) & (dist <= 2))) & (dd <= LINE_NEAR) & ~clear
    D = rgb[idx[0], idx[1]]
    LD = L[idx[0], idx[1]]
    k = np.clip((255 - L) / np.maximum(255 - LD, 1), 0, 1)
    n = int((m & (L > LD + LIGHT) & (a * (1 - k) > 0.08)).sum())
    if check:
        return n
    na, nrgb = a.copy(), rgb.copy()
    na[m] = (a * k)[m]
    nrgb[m] = D[m]
    out = np.dstack([nrgb, na * 255]).clip(0, 255).round().astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(path, 'WEBP', quality=92, method=6)
    return n


if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if x != '--check']
    chk = '--check' in sys.argv
    for p in args:
        print(p, fix(p, chk))
