#!/usr/bin/env python3
"""좁은 틈 마무리 — clean-edges.py로 정리한 뒤, 발톱·발가락·다리 사이처럼 좁은 틈에 남은 밝은 점을 없앤다.

    python3 tools/edge-specks.py --check 그림.webp ...   # 고치지 않고 점 수만
    python3 tools/edge-specks.py 그림.webp ...           # 그 자리에 고쳐 씀
    (numpy·Pillow·scipy가 필요)

왜(2026-10-31, 009 두더지): 틈이 좁으면 clean-edges.py의 가장자리 띠가 들어가지 못해,
  '윤곽선 + 흰 바탕'이 섞인 밝은 점이 투명한 곳 바로 옆에 남는다. 어두운 배경에서 흰 점으로 보인다.
어떻게: 투명한 곳에서 윤곽선을 넘지 않고 3점 안에 이어지고, 바로 둘레(7×7)에 어두운 윤곽선이 있는데 그보다 훨씬 밝은 점만 골라
  색은 윤곽선 색으로, 불투명도는 '윤곽선 색이 섞인 만큼'으로 바꾼다(지우지 않으므로 선은 매끈하게 남음).
  윤곽선이 없는 밝은 가장자리(구름·눈)와 그림 안쪽은 건드리지 않는다. 두 번 돌려도 바뀌지 않는다.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

NEAR = 3      # 투명한 곳에서 이만큼(점) 안
LINE = 100    # 둘레에 이보다 어두운 점이 있어야(윤곽선)
GAP = 40      # 그 윤곽선보다 이만큼 밝으면 섞인 점


def fix(path, check=False):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    rgb, a = im[..., :3], im[..., 3] / 255
    L = rgb @ [.299, .587, .114]
    clear = a < 0.08
    near = nd.distance_transform_edt(~clear) <= NEAR
    Lm = np.where(a > 0.5, L, 255.0)
    LD = nd.minimum_filter(Lm, size=7)
    # 윤곽선 바깥쪽만: 투명한 곳에서 윤곽선을 넘지 않고 이어지는 점(윤곽선 안쪽의 밝은 촉수·털은 건드리지 않음)
    line = (a > 0.5) & (L <= LD + 25)
    lab, _ = nd.label((near & ~line) | clear)
    outside = np.isin(lab, np.unique(lab[clear])) & ~clear
    m = outside & (LD < LINE) & (L > LD + GAP)
    n = int(m.sum())
    if check or not n:
        return n
    dark = (a > 0.5) & (Lm <= LD + 1)
    _, idx = nd.distance_transform_edt(~dark, return_indices=True)
    D = rgb[idx[0], idx[1]]
    k = np.clip((255 - L) / np.maximum(255 - LD, 1), 0, 1)
    out = im.copy()
    out[m, :3] = D[m]
    out[m, 3] = (a * k)[m] * 255
    out[(out[..., 3] < 15) & m, 3] = 0
    Image.fromarray(out.round().clip(0, 255).astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=95, alpha_quality=100, method=6)
    return n


if __name__ == '__main__':
    chk = '--check' in sys.argv
    for p in [x for x in sys.argv[1:] if x != '--check']:
        print(p, fix(p, chk))
