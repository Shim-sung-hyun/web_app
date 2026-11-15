#!/usr/bin/env python3
"""받은 원본 맞춰 두기(2026-11-15 선생님: 소품 손질에서 지워진 색을 '원래 색으로 복원'하고 싶음).

    python3 tools/src-align.py 받은.jpg 장소폴더/items/이름.webp        # → 장소폴더/src/이름.jpg

잘라 낸 소품(items/이름.webp)이 받은 원본 그림(빙 jpg)의 어디에서 잘렸는지 찾아(불투명한 곳의 밝기 차이가 가장 작은 자리, FFT로),
소품과 같은 크기로 원본을 잘라 src/이름.jpg로 둔다. media/stage/touchup.html(소품 손질)의 '원본 색 붓'이 이 그림의 색으로 구멍을 칠함.
맞춘 뒤 차이(밝기 평균)가 8 넘으면 '의심'으로 알림 — 다른 원본이거나 크기가 바뀐 그림. 새 소품을 넣을 때 받은 원본과 함께 돌려 두면 좋음.
"""
import sys, os
import numpy as np
from PIL import Image


def align(src, item, dst=None):
    it = np.array(Image.open(item).convert('RGBA')).astype(float); O = np.array(Image.open(src).convert('RGB')).astype(float)
    h, w = it.shape[:2]; H, W = O.shape[:2]
    if h > H or w > W: raise SystemExit(f'소품이 원본보다 커요: {item}')
    m = (it[..., 3] > 250).astype(float); g = it[..., :3].mean(2) * m; og = O.mean(2)

    def corr(a, b):
        F = np.fft.rfft2(a); K = np.fft.rfft2(b[::-1, ::-1], s=a.shape); return np.fft.irfft2(F * K, s=a.shape)[h - 1:H, w - 1:W]
    y, x = np.unravel_index(np.argmin(corr(og * og, m) - 2 * corr(og, g)), (H - h + 1, W - w + 1))
    crop = O[y:y + h, x:x + w]; err = float(np.abs(crop.mean(2) - it[..., :3].mean(2))[m > 0].mean())
    if dst is None:
        d = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(item))), 'src'); os.makedirs(d, exist_ok=True)
        dst = os.path.join(d, os.path.splitext(os.path.basename(item))[0] + '.jpg')
    Image.fromarray(crop.astype(np.uint8)).save(dst, quality=88)
    return dst, err


if __name__ == '__main__':
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    dst, err = align(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    print(f'{dst}  차이 {err:.1f}' + ('  ← 의심(다른 원본?)' if err > 8 else ''))
