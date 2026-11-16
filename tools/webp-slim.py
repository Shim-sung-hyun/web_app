#!/usr/bin/env python3
"""webp 줄이기 — 다 만든 소품·동물 그림을 마지막에 한 번 가볍게(2026-11-16, 008 학교 와이파이에서 무대 그림 100MB가 목소리를 밀어냄)
    python3 tools/webp-slim.py media/stage-beta/nature/new-*/items/*.webp     # 제자리에서
    python3 tools/webp-slim.py 그림.webp --dry                                  # 줄어들 크기만
    python3 tools/webp-slim.py 그림.webp --q 85                                 # 품질(기본 80)

하는 일
  - 색은 품질 80(손실)로, 투명(알파)은 손실 없이 다시 저장 — 가장자리·반투명 그림자·밑동 모양이 그대로라
    stage.json 밑동 자리·모양 지도·touchup 원본 붓(src/ 같은 크기)이 그대로 맞음. 그림 크기(가로·세로)는 바꾸지 않음
    (4K 전자칠판 200%에서 큰 소품은 지금 크기보다도 크게 그려짐 — 줄이면 흐려짐).
  - ICC 색 프로필(sRGB)은 뺌.
  - 이미 줄인 그림을 또 줄여 화질이 깎이지 않게: 8% 넘게 작아질 때만 바꿈.
시험(2026-11-16, 소품 24장): 품질 90쯤 → 80에 크기 67%, 바탕에 얹은 화질 PSNR 최저 36.5dB(2배 확대에서 눈으로 차이 거의 없음).
언제: stage-intake.py가 마지막에 부름. touchup.html로 손질해 올린 뒤에도 그 장면 items에 한 번.
"""
import io, os, sys
from PIL import Image

args = [a for a in sys.argv[1:] if not a.startswith('--')]
dry = '--dry' in sys.argv
q = int(sys.argv[sys.argv.index('--q') + 1]) if '--q' in sys.argv else 80
if '--q' in sys.argv: args.remove(str(q))
if not args: print(__doc__); sys.exit(1)
before = after = changed = 0
for p in args:
    if not p.endswith('.webp'): continue
    old = os.path.getsize(p); im = Image.open(p); im.load()
    mode = 'RGBA' if ('A' in im.getbands() or im.info.get('transparency') is not None) else 'RGB'
    buf = io.BytesIO(); im.convert(mode).save(buf, 'WEBP', quality=q, alpha_quality=100, method=6)
    new = buf.tell(); before += old
    if new < old * .92:
        after += new; changed += 1
        if not dry:
            with open(p, 'wb') as f: f.write(buf.getvalue())
    else: after += old
print(f'{len(args)}장 중 {changed}장 {"줄일 수 있음" if dry else "줄임"}: {before/1e6:.1f}MB → {after/1e6:.1f}MB ({after/max(before,1)*100:.0f}%)')
