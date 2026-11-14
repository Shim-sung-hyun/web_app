#!/usr/bin/env python3
"""줄기 늘이기(2026-11-14 땅속, 선생님: 뿌리만 덩그러니 — 땅 위로 나가는 줄기가 없음)

    python3 tools/trunk-extend.py <곳> 종류 [--up 2]      예) python3 tools/trunk-extend.py nature/new-underground treeroots

빙이 준 '줄기+뿌리' 그림은 줄기가 위 끝에서 잘리지만 짧아서, 그대로 매달면 뿌리 갈라지는 자리가 흙 위로 올라감.
그 종류의 items/*.webp마다:
  1) 줄기 폭이 위 끝보다 30% 넘게 넓어지는 줄 = 뿌리가 갈라지는 자리(밑동)
  2) 위 끝 아래부터 밑동 조금 위까지의 줄기를 세로로 늘임(나무껍질 결이 세로라 자연스러움 — 띠를 이어 붙이면 이음매가 사다리처럼 보였음) — 밑동 위 줄기가 밑동 아래 뿌리 높이의 --up배(기본 2)가 되게
  3) stage.json items: hangAt(그림 위에서 밑동까지 몫) — 무대가 밑동을 hangTop(흙 맨 위)에 붙임(stagekit hangTo),
     real은 뿌리 부분의 실제 크기가 그대로이게 늘어난 높이만큼 키움. 다시 돌려도 이미 늘인 그림(hangAt 있음)은 건너뜀.
끝에 stage-meta.py를 돌림(밑동·foot 다시 잼).
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
if len(args) != 2: sys.exit(__doc__)
up = float(sys.argv[sys.argv.index('--up') + 1]) if '--up' in sys.argv else 2.0
pdir = os.path.join(ROOT, 'media', 'stage-beta', args[0]); sj = os.path.join(pdir, 'stage.json'); st = json.load(open(sj, encoding='utf-8'))
for name, it in st['items'].items():
    if it.get('kind') != args[1] or it.get('hangAt') is not None: continue
    p = os.path.join(pdir, 'items', name + '.webp'); im = Image.open(p).convert('RGBA'); im = im.crop(im.getbbox()); a = np.asarray(im)
    H, W = a.shape[:2]; A = a[..., 3] > 128
    def span(y):
        xs = np.nonzero(A[y])[0]; return (xs[0], xs[-1]) if len(xs) else None
    top = [span(y) for y in range(int(H * .04))]; top = [s for s in top if s]
    w0 = np.median([s[1] - s[0] for s in top]); flare = next(y for y in range(H) if span(y) and span(y)[1] - span(y)[0] > w0 * 1.3)
    need = int(max(0, (H - flare) * up - flare)); s0, s1 = int(H * .04), int(flare * .85)   # 위 끝(닫는 선이 있을 수 있음)과 밑동 바로 위는 그대로
    seg = Image.fromarray(a[s0:s1]).resize((W, s1 - s0 + need), Image.LANCZOS)   # 나무껍질 결이 세로라 세로로 늘여도 자연스러움(이어 붙이면 이음매가 사다리처럼 보였음)
    ext = np.concatenate([np.asarray(seg), a[s1:]])
    Image.fromarray(ext).save(p, quality=92, method=6)
    Hn = ext.shape[0]; it['hangAt'] = round((flare - s0 + need) / Hn, 4)
    it['real'] = [round(r * Hn / H, 2) for r in it['real']]
    print('%s: 밑동 %d/%d줄 → %d줄로 늘림, hangAt %.3f, real %s' % (name, flare, H, Hn, it['hangAt'], it['real']))
open(sj, 'w', encoding='utf-8').write(json.dumps(st, ensure_ascii=False, indent=1) + '\n')
subprocess.run([sys.executable, os.path.join('tools', 'stage-meta.py')], cwd=ROOT, check=True, capture_output=True)
