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


def soak(path, band=.16, feat=.05, tol=100, ground=None):
    a = np.array(Image.open(path).convert('RGBA')).astype(float)
    al = a[..., 3] / 255; op = al > .4; H, W = op.shape
    ys = np.nonzero(op.any(1))[0]; yt, yb = ys[0], ys[-1]; hh = yb - yt + 1
    # 밑동 흙 색: 아래 20% 줄에서 투명한 바깥에 맞닿은 점들(흙 받침의 가장자리 — 몸통이 섞이지 않게)의 가운데 색
    lo = max(yt, yb - int(hh * .2)); edge = op.copy(); inner = op.copy()
    inner[1:] &= op[:-1]; inner[:-1] &= op[1:]; inner[:, 1:] &= op[:, :-1]; inner[:, :-1] &= op[:, 1:]; edge &= ~inner
    for _ in range(3): g = edge.copy(); g[1:] |= edge[:-1]; g[:-1] |= edge[1:]; g[:, 1:] |= edge[:, :-1]; g[:, :-1] |= edge[:, 1:]; edge = g & op
    sel = edge.copy(); sel[:lo] = False
    px = a[..., :3][sel]; px = px[px.max(1) - px.min(1) > 25] if (px.max(1) - px.min(1) > 25).sum() > 50 else px   # 테두리 선(어두운 무채색)은 빼고
    if len(px) < 20: px = a[lo:yb + 1, :, :3][op[lo:yb + 1]]   # 받침 가장자리가 거의 없으면(밑동이 이미 반투명) 아래 띠 전체에서
    if len(px) < 20: return False                              # 잴 밑동이 없으면 그대로 둠
    ref = np.median(px[px.sum(1) >= np.percentile(px.sum(1), 40)], 0)   # 어두운 선을 덜 타게 밝은 쪽 60%
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
    rim = (e * N < 2.5) & (y > yb - B)   # 스며들기 띠 안의 바깥 2~3점만(2026-11-11: 아래쪽 절반 전체로 하면 원래 진한 테두리 선까지 지워짐)
    fade = np.where(rim, np.maximum(fade, .85), fade)
    a[..., 3] = al * (1 - fade) * 255
    if ground is not None:   # 남는 밑동 흙의 색을 그 곳 배경 땅 색 쪽으로 옮김(명암은 그대로) — 반쯤 투명한 곳이 연한 얼룩으로 보이지 않게
        a[..., :3] += (s * np.clip(v * 1.5 + (1 - e), 0, 1) * vb)[..., None] * (np.asarray(ground, float) - ref)   # 스며들기 띠 안에서만(2026-11-11: 띠 밖 테두리 선까지 땅 색이 되던 것)
    Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=95, alpha_quality=100, method=6)
    return True


if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    band = float(sys.argv[sys.argv.index('--band') + 1]) if '--band' in sys.argv else .16
    if '--band' in sys.argv: args.remove(sys.argv[sys.argv.index('--band') + 1])
    place = args[0]; sj = os.path.join(place, 'stage.json'); c = json.load(open(sj, encoding='utf-8'))
    bgf = os.path.join(place, 'bg.jpg'); ground = None
    if os.path.exists(bgf):   # 배경 맨 아래 15%의 가운데 색 = 그 곳 앞쪽 땅 색
        g = np.array(Image.open(bgf).convert('RGB')).astype(float); ground = np.median(g[int(g.shape[0] * .85):].reshape(-1, 3), 0)
    names = args[1:] or list(c['items'])
    done = 0
    for k in names:
        it = c['items'].get(k)
        if not it or it.get('from') or it.get('role') == 'frame' or (it.get('soak') and '--force' not in sys.argv):
            continue
        f = os.path.join(place, 'items', k + '.webp')
        if os.path.exists(f):
            if soak(f, band, ground=ground): it['soak'] = band; done += 1
    open(sj, 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1) + '\n')
    print('밑동 스며들기', done, '개 —', place)
