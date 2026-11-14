#!/usr/bin/env python3
"""밑동 묻기(2026-11-11 선생님: 흰 눈 위 어두운 바위처럼 땅과 색이 크게 다른 소품은 떠 보임 — 스며들기는 밑동 흙이 땅과 비슷할 때만 통함)

    python3 tools/bury-base.py media/stage-beta/nature/new-polar          # 밑동 색이 땅과 다른 것만 골라서
    python3 tools/bury-base.py media/stage-beta/nature/new-polar 이름…   # 몇 개만(색이 비슷해도)
    --diff 55  땅 색과 밑동 색이 이만큼(RGB 거리) 넘게 다르면 묻음 · --depth 0.07  묻는 깊이(밑동 높이 몫)

원리: 밑동 색이 땅과 비슷하면 스며들기(tools/soak-base.py), 다르면 묻기. 그 곳 땅 색(bg 맨 아래 15%)으로 밑동 아래 몇 %를
들쭉날쭉하고 부드러운 윗선으로 덮어 '박혀 있는' 모습으로. 덮인 선 바로 위 물체는 조금 어둡게(닿는 그늘 — 해가 왼쪽 위라 오른쪽이 조금 더).
모양(알파)은 안 바꾸니 밑동 높이는 그대로. stage.json 에 buried 표시.
"""
import sys, os, json, math, zlib
import numpy as np
from PIL import Image

def bury(path, G, depth=.07, seed=0):
    a = np.array(Image.open(path).convert('RGBA')).astype(float); H, W = a.shape[:2]; m = a[..., 3] > 128
    ys = np.nonzero(m.any(1))[0]; yt, yb = ys[0], ys[-1]; hh = yb - yt + 1; D = max(4.0, hh * depth)
    xs = np.arange(W); rnd = np.random.RandomState(seed)
    wave = sum(np.sin(xs / W * math.pi * 2 * f + rnd.rand() * 6.3) / f for f in (1.3, 2.9, 6.1, 11.7))   # 들쭉날쭉한 눈 윗선
    top = yb - D * (0.62 + 0.38 * wave / np.abs(wave).max())
    yy = np.arange(H)[:, None]
    cover = np.clip((yy - top[None, :]) / 2.5 + 0.5, 0, 1) * m                # 윗선 2~3점 부드럽게
    shade = np.clip(1 - (top[None, :] - yy) / (D * .6), 0, 1) * (yy < top[None, :]) * m * (0.55 + 0.45 * xs[None, :] / W)
    rgb = a[..., :3] * (1 - 0.22 * shade[..., None])                          # 닿는 그늘
    snowtone = np.clip(1 - (yy - top[None, :]) / D, 0, 1)[..., None]          # 묻힌 땅의 윗부분은 살짝 그늘진 땅 색
    Gc = G * (1 - 0.06 * snowtone)
    a[..., :3] = rgb * (1 - cover[..., None]) + Gc * cover[..., None]
    Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=95, alpha_quality=100, method=6)

def base_color(path):
    a = np.array(Image.open(path).convert('RGBA')).astype(float); op = a[..., 3] > 200
    ys = np.nonzero(op.any(1))[0]; yt, yb = ys[0], ys[-1]; lo = int(yb - (yb - yt) * .15)
    px = a[lo:yb + 1, :, :3][op[lo:yb + 1]]; L = px.mean(1)
    return np.median(px[L > np.percentile(L, 25)], 0)                          # 테두리 선은 덜 타게

if __name__ == '__main__':
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    opt = lambda k, d: float(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
    for k in ('--diff', '--depth'):
        if k in sys.argv: args.remove(sys.argv[sys.argv.index(k) + 1])
    place = args[0]; names = args[1:]; sj = os.path.join(place, 'stage.json'); c = json.load(open(sj, encoding='utf-8'))
    g = np.array(Image.open(os.path.join(place, 'bg.jpg')).convert('RGB')).astype(float); G = np.median(g[int(g.shape[0] * .85):].reshape(-1, 3), 0)
    done = []
    for k in names or list(c['items']):
        it = c['items'].get(k)
        if not it or it.get('from') or it.get('role') == 'frame' or it.get('buried'): continue
        f = os.path.join(place, 'items', k + '.webp')
        if not os.path.exists(f): continue
        dist = float(np.linalg.norm(base_color(f) - G))
        if names or dist > opt('--diff', 55):
            bury(f, G, opt('--depth', .07), zlib.crc32(k.encode())); it['buried'] = round(opt('--depth', .07), 3); done.append(f'{k}({dist:.0f})')
    open(sj, 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1) + '\n')
    print('땅 색', G.round(), '· 묻음', len(done), done)
