#!/usr/bin/env python3
"""빙 연필풍 소품 그림을 무대 요소로 자름(2026-11-11)

    python3 tools/pencil-cut.py 받은그림.jpg 나갈.webp [--ice]

빙이 주는 종이는 미색(베이지)이라 새 북극 배경 눈(거의 253 흰색)과 다름 →
  1) 종이색(테두리 중앙값)을 253으로 맞추는 색 보정(그림 전체 — 안쪽 흰 면도 배경 눈과 같아짐)
  2) 진한 선(밝기<200)을 굵혀 벽으로 삼고, 테두리부터 밝은 종이를 채워 바깥 종이를 찾음(선 안쪽 흰 면은 안 지움)
  3) 바깥 종이는 밝기만큼 반투명(흐린 바닥 연필 줄은 옅게 남음)
  3-1) 눈 언덕처럼 선이 흐리거나 끊긴 그림은 채우기가 몸 안으로 새어 몸이 비침 → 흐린 선(밝기<228)을 크게 굵혀
       다시 채워 몸 모양을 구하고, 굵힌 만큼 줄인 안쪽은 모두 불투명(뒤 동물이 비치지 않게)
  3-2) --ice: 얼음 소품만 옅은 푸른 기(2026-11-11, 선생님: 회색 빗금만이면 콘크리트·암벽 같음 → 가운데 세기로 정함).
       그늘(어두운 곳)일수록 푸르게, 거의 흰 곳(밝기≥250 — 눈·바닥 줄)은 그대로
  4) 칠해진 둘레로 잘라 webp. 다른 규칙(스며들기·묻기 등)은 적용하지 않음
"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

def flood(L, wall, fill_lum):
    h, w = L.shape
    bg = np.zeros((h, w), bool)
    q = deque([(y, x) for x in range(w) for y in (0, h - 1)] + [(y, x) for y in range(h) for x in (0, w - 1)])
    while q:
        y, x = q.popleft()
        if bg[y, x] or wall[y, x] or L[y, x] < fill_lum:
            continue
        bg[y, x] = True
        if y > 0: q.append((y - 1, x))
        if y < h - 1: q.append((y + 1, x))
        if x > 0: q.append((y, x - 1))
        if x < w - 1: q.append((y, x + 1))
    return bg

def grow(m, k, shrink=False):
    im = Image.fromarray(m.astype(np.uint8) * 255)
    return np.asarray(im.filter(ImageFilter.MinFilter(k) if shrink else ImageFilter.MaxFilter(k))) > 0

def ice_tint(rgb):
    L = rgb.mean(2)
    sh = np.clip((250 - L) / 120, 0, 1)
    lt = np.clip((250 - L) / 30, 0, 1) * 8
    return np.dstack([L - sh * 55 - lt, L - sh * 22 - lt * 0.4, np.minimum(255, L + sh * 8)]).clip(0, 255)

def cut(src, dst, white=253, wall_lum=200, fill_lum=238, soft=40, heavy=17, ice=False):
    im = np.asarray(Image.open(src).convert('RGB')).astype(float)
    h, w, _ = im.shape
    b = np.concatenate([im[:8].reshape(-1, 3), im[-8:].reshape(-1, 3), im[:, :8].reshape(-1, 3), im[:, -8:].reshape(-1, 3)])
    paper = np.median(b, 0)
    wb = np.clip(im * (white / paper), 0, 255)
    L = wb.mean(2)
    wall = grow(L < wall_lum, 5)
    bg = flood(L, wall, fill_lum)
    body = ~flood(L, grow(L < 228, heavy), fill_lum)          # 몸 모양(흐린 선까지 크게 굵혀 막음)
    inner = grow(body, heavy + 4, shrink=True)                 # 굵힌 만큼 줄임 → 확실한 안쪽
    a = np.where(bg, np.clip((white - L) / soft, 0, 1), 1.0)
    a = np.maximum(a, inner.astype(float))
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))) / 255.0
    a[a < 0.03] = 0
    if ice:
        wb = ice_tint(wb)
    out = Image.fromarray(np.dstack([wb, a * 255]).astype(np.uint8), 'RGBA')
    # 둘레는 확실히 칠해진 곳(알파>128)으로 재고 조금(긴 변의 3%) 넓힘 — 종이 결·흐린 점이 멀리 있어도 그림이 커지지 않게
    bb = out.split()[-1].point(lambda v: 255 if v > 128 else 0).getbbox()
    pad = int(0.03 * max(bb[2] - bb[0], bb[3] - bb[1]))
    out = out.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(w, bb[2] + pad), min(h, bb[3] + pad)))
    out.save(dst, quality=92)
    return paper, out.size, bg.mean()

if __name__ == '__main__':
    print(cut(sys.argv[1], sys.argv[2], ice='--ice' in sys.argv[3:]))
