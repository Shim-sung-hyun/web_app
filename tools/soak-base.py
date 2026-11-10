#!/usr/bin/env python3
"""밑동 스며들기(2026-11-10 선생님 — '밑동의 일정 부분까지 그라데이션 지우기'): 소품 밑동의 흙·모래가 바닥에 서서히 스며들게

    python3 tools/soak-base.py media/stage-beta/nature/new-desert            # 그 곳 items/ 모두(이미 soak 인 것은 건너뜀)
    python3 tools/soak-base.py media/stage-beta/nature/new-desert item-06-1  # 몇 개만
    --band 0.16  밑동 띠 높이(그림 높이 몫, 기본 .16) · --force 이미 한 것도 다시(원본에서 다시 하려면 git에서 되돌린 뒤)

그림 맨 아래 5%에서 밑동 흙 색을 재고, 그 색과 비슷한 점만 아래로 갈수록·가장자리에 가까울수록 투명하게(몸통은 그대로).
밑동 끝의 가는 테두리 선도 함께 옅게. 밑동 높이(base·foot)는 스며들기 전에 잰 값을 지키도록 stage.json에 soak 를 적음
(tools/stage-meta.py는 soak 가 있는 소품의 base·foot를 다시 재지 않음). 설치도구 5단계 '밑동 스며들기'와 같은 셈.
"""
import sys, os, json
import numpy as np
from PIL import Image


def soak(path, band=.16, feat=.05, tol=70):
    a = np.array(Image.open(path).convert('RGBA')).astype(float)
    al = a[..., 3] / 255; op = al > .4; H, W = op.shape
    ys = np.nonzero(op.any(1))[0]; yt, yb = ys[0], ys[-1]; hh = yb - yt + 1
    lo = max(yt, yb - int(hh * .05)); ref = np.median(a[lo:yb + 1][..., :3][op[lo:yb + 1]], 0)
    s = np.clip(1 - np.sqrt(((a[..., :3] - ref) ** 2).sum(-1)) / tol, 0, 1)      # 밑동 흙다움
    # 밑동 띠: 기본 band, 납작한 소품처럼 흙이 더 높이 퍼졌으면 그 높이까지(아래에서 줄마다 흙다운 점이 절반 넘는 데까지, 그림 높이의 45%까지)
    top = yb
    while top > yt and op[top].any() and (s[top][op[top]] > .5).mean() > .5: top -= 1
    y = np.arange(H)[:, None]; B = min(hh * .45, max(hh * band, (yb - top) * 1.15))
    v = np.clip((y - (yb - B)) / B, 0, 1)                                        # 아래로 갈수록 1
    vb = np.where(y >= yb - B, 1.0, 0.0) * np.ones((1, W))
    N = max(3, int(W * feat)); e = np.zeros((H, W)); cur = op.copy()
    for _ in range(N):                                                           # 투명한 바깥에서 몇 점 들어왔나
        e += cur; n = cur.copy(); n[1:] &= cur[:-1]; n[:-1] &= cur[1:]; n[:, 1:] &= cur[:, :-1]; n[:, :-1] &= cur[:, 1:]; cur = n
    e = np.clip(e / N, 0, 1)
    fade = np.clip(s * (.95 * v + .85 * (1 - e) * vb) + (1 - s) * (1 - e) * np.maximum(v, .9 * vb), 0, 1)
    a[..., 3] = al * (1 - fade) * 255
    Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=95, alpha_quality=100, method=6)


if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    band = float(sys.argv[sys.argv.index('--band') + 1]) if '--band' in sys.argv else .16
    if '--band' in sys.argv: args.remove(sys.argv[sys.argv.index('--band') + 1])
    place = args[0]; sj = os.path.join(place, 'stage.json'); c = json.load(open(sj, encoding='utf-8'))
    names = args[1:] or list(c['items'])
    done = 0
    for k in names:
        it = c['items'].get(k)
        if not it or it.get('from') or it.get('role') == 'frame' or (it.get('soak') and '--force' not in sys.argv):
            continue
        f = os.path.join(place, 'items', k + '.webp')
        if os.path.exists(f):
            soak(f, band); it['soak'] = band; done += 1
    open(sj, 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1) + '\n')
    print('밑동 스며들기', done, '개 —', place)
