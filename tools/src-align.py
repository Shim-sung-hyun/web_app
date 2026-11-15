#!/usr/bin/env python3
"""받은 원본 맞춰 두기(2026-11-15 선생님: 소품 손질에서 지워진 색을 '원래 색으로 복원'하고 싶음).

    python3 tools/src-align.py 받은.jpg 장소폴더/items/이름.webp        # → 장소폴더/src/이름.jpg
    python3 tools/src-align.py --dir 받은폴더 장소폴더                    # 폴더째: 이름.jpg ↔ items/이름.webp, 맞춘 원본은 받은 폴더에서 지움

잘라 낸 소품(items/이름.webp)이 받은 원본 그림(빙 jpg)의 어디에서 잘렸는지 찾아(불투명한 곳의 밝기 차이가 가장 작은 자리, FFT로),
소품과 같은 크기로 원본을 잘라 src/이름.jpg로 둔다. media/stage/touchup.html(소품 손질)의 '원본 색 붓'이 이 그림의 색으로 구멍을 칠함.
줄기를 늘인 소품(trunk-extend.py — stage.json hangUp)은 원본보다 길어서, 밑동 아래 뿌리로 자리를 찾고 위 줄기는 원본 줄기를 세로로 늘여 붙임(2026-11-15 땅속).
--paper: 북극처럼 자를 때 미색 종이를 배경 눈색(253)으로 맞춘 소품(옛 pencil-cut.py, 얼음은 --ice 푸른 기)은
  받은 원본도 똑같이 맞춘 뒤 잘라 둠 — 그래야 원본 색 붓의 색이 소품 색과 같음. 푸른 기는 소품 색에 더 가까운 쪽을 저절로 고름.
    python3 tools/src-align.py --paper --dir 받은폴더 장소폴더
맞춘 뒤 차이(밝기 평균)가 8 넘으면 '의심'으로 알림 — 다른 원본이거나 크기가 바뀐 그림. 새 소품을 넣을 때 받은 원본과 함께 돌려 두면 좋음.
"""
import sys, os
import numpy as np
from PIL import Image


def paper_fix(O):
    """미색 종이 → 253(옛 pencil-cut.py와 같은 셈). 돌려줌: (종이만 맞춘 것, 얼음 푸른 기까지 넣은 것)"""
    b = np.concatenate([O[:8].reshape(-1, 3), O[-8:].reshape(-1, 3), O[:, :8].reshape(-1, 3), O[:, -8:].reshape(-1, 3)])
    wb = np.clip(O * (253 / np.median(b, 0)), 0, 255)
    L = wb.mean(2); sh = np.clip((250 - L) / 120, 0, 1); lt = np.clip((250 - L) / 30, 0, 1) * 8
    ice = np.dstack([L - sh * 55 - lt, L - sh * 22 - lt * 0.4, np.minimum(255, L + sh * 8)]).clip(0, 255)
    return wb, ice


def hang_at(item):
    """줄기를 늘인 소품(tools/trunk-extend.py)이면 stage.json의 hangAt(그림 위에서 밑동까지 몫), 아니면 None"""
    sj = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(item))), 'stage.json')
    if not os.path.exists(sj): return None
    import json
    it = json.load(open(sj, encoding='utf-8')).get('items', {}).get(os.path.splitext(os.path.basename(item))[0], {})
    return it.get('hangAt') if it.get('hangUp') else None


def default_dst(item):
    d = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(item))), 'src'); os.makedirs(d, exist_ok=True)
    return os.path.join(d, os.path.splitext(os.path.basename(item))[0] + '.jpg')


def align(src, item, dst=None, paper=False):
    it = np.array(Image.open(item).convert('RGBA')).astype(float); O = np.array(Image.open(src).convert('RGB')).astype(float)
    alt = None
    if paper: O, alt = paper_fix(O)
    h, w = it.shape[:2]; H, W = O.shape[:2]
    ha = hang_at(item) if h > H else None
    if ha and w <= W:   # 줄기를 늘인 그림(2026-11-15 땅속 나무뿌리): 밑동 아래(뿌리 — 늘이지 않은 곳)로 자리를 찾고, 위 줄기는 원본 줄기를 소품 높이만큼 세로로 늘임
        fl = int(round(ha * h)); hb = h - fl; og = O.mean(2); m = (it[fl:, :, 3] > 250).astype(float); g = it[fl:, :, :3].mean(2) * m
        def corr2(a, b):
            F = np.fft.rfft2(a); K = np.fft.rfft2(b[::-1, ::-1], s=a.shape); return np.fft.irfft2(F * K, s=a.shape)[hb - 1:H, w - 1:W]
        y, x = np.unravel_index(np.argmin(corr2(og * og, m) - 2 * corr2(og, g)), (H - hb + 1, W - w + 1))
        B = O[y:y + hb, x:x + w]; err = float(np.abs(B.mean(2) - it[fl:, :, :3].mean(2))[m > 0].mean())
        col = O[:y, x:x + w].min(2); rows = np.nonzero((col < 200).any(1))[0]; y0 = int(rows[0]) if len(rows) else 0   # 원본에서 줄기 꼭대기
        top = np.array(Image.fromarray(O[y0:max(y0 + 1, y), x:x + w].astype(np.uint8)).resize((w, fl), Image.LANCZOS))
        dst = dst or default_dst(item); Image.fromarray(np.concatenate([top, B.astype(np.uint8)])).save(dst, quality=88)
        return dst, err
    if h > H or w > W: raise SystemExit(f'소품이 원본보다 커요: {item}')
    m = (it[..., 3] > 250).astype(float); g = it[..., :3].mean(2) * m; og = O.mean(2)

    def corr(a, b):
        F = np.fft.rfft2(a); K = np.fft.rfft2(b[::-1, ::-1], s=a.shape); return np.fft.irfft2(F * K, s=a.shape)[h - 1:H, w - 1:W]
    y, x = np.unravel_index(np.argmin(corr(og * og, m) - 2 * corr(og, g)), (H - h + 1, W - w + 1))
    crop = O[y:y + h, x:x + w]
    if alt is not None:                                             # 얼음 푸른 기: 소품의 푸른 정도(B-R)에 더 가까운 쪽
        c2 = alt[y:y + h, x:x + w]; mm = m > 0; blue = lambda a: float((a[..., 2] - a[..., 0])[mm].mean())
        if abs(blue(c2) - blue(it[..., :3])) < abs(blue(crop) - blue(it[..., :3])): crop = c2
    err = float(np.abs(crop.mean(2) - it[..., :3].mean(2))[m > 0].mean())
    if dst is None:
        d = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(item))), 'src'); os.makedirs(d, exist_ok=True)
        dst = os.path.join(d, os.path.splitext(os.path.basename(item))[0] + '.jpg')
    Image.fromarray(crop.astype(np.uint8)).save(dst, quality=88)
    return dst, err


def align_dir(srcdir, place, paper=False):
    """받은 폴더의 이름.jpg/png를 장소폴더/items/이름.webp에 맞춤(2026-11-15 숲 — 소품이 많을 때 한 번에). 잘 맞은 원본만 지움."""
    items = os.path.join(place, 'items'); done = bad = 0
    for f in sorted(os.listdir(srcdir)):
        n, e = os.path.splitext(f)
        if e.lower() not in ('.jpg', '.jpeg', '.png', '.webp'): continue
        it = os.path.join(items, n + '.webp')
        if not os.path.exists(it): print(f'  {f}: items/{n}.webp 없음 — 이름 확인'); continue
        dst, err = align(os.path.join(srcdir, f), it, paper=paper); ok = err <= 8
        print(f'  {n}  차이 {err:.1f}' + ('' if ok else '  ← 의심(다른 원본?) — 받은 파일은 남겨 둠'))
        if ok: os.remove(os.path.join(srcdir, f)); done += 1
        else: bad += 1
    have = {os.path.splitext(x)[0] for x in os.listdir(os.path.join(place, 'src'))} if os.path.isdir(os.path.join(place, 'src')) else set()
    miss = sorted(os.path.splitext(x)[0] for x in os.listdir(items) if x.endswith('.webp') and os.path.splitext(x)[0] not in have)
    print(f'맞춤 {done}, 의심 {bad}. 아직 원본 없는 소품 {len(miss)}' + (': ' + ' '.join(miss) if miss else ''))


if __name__ == '__main__':
    paper = '--paper' in sys.argv; a = [x for x in sys.argv[1:] if x != '--paper']
    if len(a) == 3 and a[0] == '--dir': align_dir(a[1], a[2], paper); sys.exit(0)
    if len(a) < 2: print(__doc__); sys.exit(1)
    dst, err = align(a[0], a[1], a[2] if len(a) > 2 else None, paper)
    print(f'{dst}  차이 {err:.1f}' + ('  ← 의심(다른 원본?)' if err > 8 else ''))
