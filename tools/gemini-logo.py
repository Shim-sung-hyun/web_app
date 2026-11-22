#!/usr/bin/env python3
"""Gemini 그림의 오른쪽 아래 반짝이 로고(흰 별) 지우기 — 2026-11-22

    python3 tools/gemini-logo.py 그림.png [그림2.png …]             # 그림.clean.png 로 따로 저장
    python3 tools/gemini-logo.py 그림.png --inplace                  # 그 자리에 덮어씀
    python3 tools/gemini-logo.py 그림.png --out 폴더                 # 폴더에 같은 이름으로
    python3 tools/gemini-logo.py 그림.png --check                    # 고치지 않고 로고를 찾았는지만

왜·어떻게
  Gemini 그림의 로고는 흰색을 일정한 투명도로 덮어 그린 것이다(어느 바탕에서나 가장 진한 곳이 약 0.31).
  그래서 덮어 그리기를 거꾸로 셈하면 원래 색이 그대로 돌아온다: 원래 = (지금 − 투명도×255) ÷ (1 − 투명도).
  주변을 흐리게 메우는 방식과 달리 결·선·무늬가 그대로 남는다.
  투명도 지도(48×48)는 tools/gemini-logo-alpha48.png — 단색 바탕 Gemini 그림 4장에서 잰 것.
  로고 자리는 그림마다 오른쪽 아래 구석 400점 안을 찾아(크기 48·96·72) 투명도 지도와 가장 닮은 곳으로 정한다.
  닮음이 낮으면(로고가 없거나 흰 바탕이라 안 보이면) 고치지 않고 알린다 — --force 로 기본 자리(오른쪽·아래에서 96점, 48 크기)에 적용.
필요: numpy, Pillow
"""
import os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ALPHA = np.asarray(Image.open(os.path.join(HERE, 'gemini-logo-alpha48.png')).convert('L')).astype(np.float64) / 255.0


def alpha_at(size):
    if size == 48:
        return ALPHA
    return np.asarray(Image.fromarray((ALPHA * 255).astype('uint8')).resize((size, size), Image.LANCZOS)).astype(np.float64) / 255.0


def est_alpha(a, x, y, s):
    """그 자리를 흰색 덮어 그리기로 보고 투명도를 거꾸로 셈(바탕 = 둘레 띠의 가운뎃값)."""
    h, w, _ = a.shape
    p = max(4, s // 6)
    if x - p < 0 or y - p < 0 or x + s + p > w or y + s + p > h:
        return None
    reg = a[y:y + s, x:x + s]
    ring = np.concatenate([a[y - p:y, x - p:x + s + p].reshape(-1, 3), a[y + s:y + s + p, x - p:x + s + p].reshape(-1, 3),
                           a[y:y + s, x - p:x].reshape(-1, 3), a[y:y + s, x + s:x + s + p].reshape(-1, 3)])
    bg = np.median(ring, 0)
    return ((reg - bg) / (255.0 - bg + 1e-6)).mean(2)


def find(a):
    h, w, _ = a.shape
    best = (-1, None)
    for s in (48, 96, 72):
        m = alpha_at(s).ravel(); m = m - m.mean()
        for off in range(s, min(420, w, h) - s, max(2, s // 12)):
            for dx in range(-s // 2, s // 2 + 1, max(2, s // 12)):
                x, y = w - off - s + dx, h - off - s
                for yy in (y - s // 4, y, y + s // 4):
                    e = est_alpha(a, x, yy, s)
                    if e is None:
                        continue
                    v = e.ravel(); v = v - v.mean()
                    den = np.sqrt((v * v).sum() * (m * m).sum())
                    if den < 1e-9:
                        continue
                    c = float((v * m).sum() / den)
                    if c > best[0]:
                        best = (c, (x, yy, s))
    return best


def clean(a, x, y, s):
    m = alpha_at(s)[..., None]
    reg = a[y:y + s, x:x + s]
    out = (reg - m * 255.0) / (1.0 - m)
    a = a.copy()
    a[y:y + s, x:x + s] = np.clip(out, 0, 255)
    return a


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__); return 1
    inplace = '--inplace' in args; check = '--check' in args; force = '--force' in args
    out = None
    if '--out' in args:
        i = args.index('--out'); out = args[i + 1]; del args[i:i + 2]; os.makedirs(out, exist_ok=True)
    files = [x for x in args if not x.startswith('--')]
    bad = 0
    for f in files:
        im = Image.open(f); mode = im.mode
        a = np.asarray(im.convert('RGB')).astype(np.float64)
        h, w, _ = a.shape
        c, pos = find(a)
        ok = c >= 0.6
        if not ok and force:
            pos = (w - 144, h - 144, 48)
        tag = ('찾음' if ok else ('못 찾음 → 기본 자리' if force else '못 찾음')) + ' 닮음 %.2f' % c
        if pos:
            tag += ' · 자리 오른쪽 %d 아래 %d 크기 %d' % (w - pos[0] - pos[2], h - pos[1] - pos[2], pos[2])
        print(os.path.basename(f), tag)
        if check or (not ok and not force):
            bad += (not ok); continue
        r = Image.fromarray(clean(a, *pos).round().astype('uint8'))
        if mode == 'RGBA':
            r.putalpha(im.getchannel('A'))
        dst = f if inplace else (os.path.join(out, os.path.basename(f)) if out else os.path.splitext(f)[0] + '.clean' + os.path.splitext(f)[1])
        r.save(dst)
    if bad:
        print('로고를 못 찾은 그림 %d장 — 흰 바탕이면 로고가 거의 안 보여 그대로 써도 됨, 아니면 --force' % bad)
    return 0


if __name__ == '__main__':
    sys.exit(main())
