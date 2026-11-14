#!/usr/bin/env python3
"""흰 테두리·틈 지우기(2026-11-13 선생님: 동물·소품 안쪽 흰 곳은 괜찮고, 가장자리 흰 테두리·나무와 덤불이 갈라진 사이·사자 갈기 사이의 흰 종이가 남음).

    python3 tools/defringe.py 그림.webp [그림2.webp …]           # 제자리에서 고침
    python3 tools/defringe.py 그림.webp --out 고친.webp            # 다른 파일로
    python3 tools/defringe.py 폴더/*.webp --plant                  # 풀·나무: 몸 안에 갇힌 매끈한 흰 종이 조각도 지움
    python3 tools/defringe.py 그림.webp --dry                      # 지울 점 수만 셈

셈: 종이색 = 밝고(가장 어두운 채널 > --light, 기본 235 — 밝은 나무껍질(220~235)은 남게) 색이 거의 없음(채널 차 < 28).
 ① 바깥(투명)에서 종이색 점만 밟고 들어갈 수 있는 곳을 --depth(기본 그림 긴 쪽의 1.2%)까지 지움 — 연필 테두리선(어두운 점)에서 멈추므로
    선으로 둘러싼 안쪽 흰 곳(얼룩말 흰 줄·타조 흰 깃·흰 바위)은 안 닿음. 바깥에서 3점 넘게 들어간 곳은 밝기 245 넘는(거의 종이 그대로) 점만. 반투명한 가장자리 점(알파 255 미만)은 더 넓게(밝기 180까지) 봄.
 ② --plant: 바깥과 안 이어졌어도 매끈하고(5×5 표준편차 < 9) 흰(> 215) 조각이 15점 넘고 둘레의 절반 넘게 잎(초록)이면 지움(잎 사이로 보이는 종이).
    줄기·껍질의 밝은 곳(바오바브·마른 나무)은 둘레가 회색이라 남음.
 ③ --plant: 잎이 빽빽한 곳(둘레 15점 안에 잎 25% 넘게) 안의 밝은(> 228) 흰 점은 둘레 잎 색으로 칠함(지우면 덤불에 구멍).
 ⑦ --pockets: 몸에 갇힌 매끈한 흰 종이 조각(다리와 몸 사이 등)을 지움 — 몸이 흰 동물에는 쓰지 말 것.
 ⑥ --rim: 둘레 6점 띠의 점이 몸 안쪽(8~20점)보다 눈에 띄게 밝으면 바깥일수록 안쪽 색에 가깝게, 맨 바깥 한 줄은 조금 옅게(테두리선 없는 연한 털끝이 흰 선처럼 보일 때 — 동물).
 ⑤ --fill: 몸 안에 갇힌 작은 투명 구멍(3000점 이하)을 가장 가까운 색으로 메움 — 바위·흙에만(풀·나무는 잎 사이가 비어야 함).
 ⑧ --halo: 가장자리(바깥에서 그림 긴 쪽의 4% 안)에 걸친 흰 조각(밝기 > 212, 4점 넘게)과 둘레 회백색(> 185) 3점까지 + 몸 안의 매끈한(표준편차 < 8) 흰(> 228) 조각을 지움
    (2026-11-14 선생님: 덤불 둘레·풀숲 위 흰 조각, 풀 사이 흰 점). 그림 넓이 0.12% 넘는 흰 덩어리와 둘레 31점 안 칠해진 점의 40% 넘게 밝은 회색인 곳(통나무·바위·껍질)은 남김.
    빽빽한 덤불·풀숲·풀 덮인 둔덕에만 — 잎이 듬성한 키 큰 풀·가는 줄기·뿌리·흰 껍질 나무는 잎·줄기의 밝은 결이 뚫리니 쓰지 말 것.
 ⑨ --outline: 몸(알파 > 200) 둘레의 진한 바깥 선을 옅게(옆·위는 안쪽 색 쪽으로 70%), 밑변은 선과 그 위 흰 띠(5점)를 7점 위의 결로 칠하고 투명과 닿은 맨 끝 2점은 옅게
    (2026-11-14 선생님: 풀 덮인 둔덕 바깥 검정 선이 너무 진해 떠 있는 듯함, 아래쪽은 선을 지움) — 몸 넓이는 그대로라 밑동 자리(stage.json)는 안 바뀜.
 ④ --gaps: 아주 흰(> 240) 색 없는 덩어리 40점 넘는 것을 모두 지움(가지 사이 종이) — 줄기가 하얗지 않은 나무·덤불에만(바오바브·마른 나무·마룰라 빼고).
지운 곳 가장자리는 알파를 1점 부드럽게. numpy·Pillow·scipy 필요.
"""
import argparse, numpy as np
from PIL import Image
from scipy import ndimage as ndi


def fix(src, dst, light=235, depth=None, plant=False, dry=False, gaps=False, fill=False, rimfix=False, pockets=False, halo=False, outline=False):
    im = Image.open(src).convert('RGBA'); a = np.asarray(im).astype(np.int32).copy()
    rgb, A = a[..., :3].copy(), a[..., 3]; H, W = A.shape
    tint = np.zeros(A.shape, bool)
    mn, mx = rgb.min(2), rgb.max(2)
    paper = (mx - mn < 28) & (A > 0) & ((mn > light) | ((A < 255) & (mn > 180)))
    tr = A <= 8; lt, nt = ndi.label(tr)
    edge = np.unique(np.concatenate([lt[0], lt[-1], lt[:, 0], lt[:, -1]])); edge = edge[edge > 0]
    out = np.isin(lt, edge) | (tr & (ndi.sum(tr, lt, np.arange(nt + 1)) > 400)[lt])   # 바깥 = 그림 테두리와 이어진 투명 + 큰 틈(400점 넘는 투명 — 가지 사이). 몸 안의 작은 투명 점은 바깥이 아님
    d = depth or max(4, int(max(H, W) * .012))
    reach = out.copy(); kill = np.zeros_like(out)
    st = ndi.generate_binary_structure(2, 1)
    deep = (mx - mn < 20) & (mn > 245)                                  # 3점 넘게 들어가면 거의 종이 그대로인 것만(밝은 껍질·털은 남게)
    for k in range(d):   # 바깥에서 종이색만 밟고 한 점씩
        grow = ndi.binary_dilation(reach, st) & (paper if k < 3 else paper & deep) & ~reach
        if not grow.any(): break
        reach |= grow; kill |= grow
    if plant:
        g = rgb.mean(2).astype(float); sd = np.sqrt(np.maximum(ndi.uniform_filter(g * g, 5) - ndi.uniform_filter(g, 5) ** 2, 0))
        flat = (mn > 215) & (mx - mn < 22) & (sd < 9) & (A > 0)
        R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        leaf = (G >= R - 6) & (G > B + 16) & (mx - mn > 18) & (A > 0)     # 잎(누른 초록·올리브) — 살짝 초록빛인 회색 껍질은 빼려고 초록이 짙어야
        lab, n = ndi.label(flat); sz = ndi.sum(flat, lab, np.arange(n + 1))
        ring = ndi.binary_dilation(flat, st, iterations=3) & ~flat & (A > 0)   # 조각마다 둘레 3점
        rl = ndi.maximum_filter(lab, 7) * ring                            # 둘레 점이 어느 조각 옆인지(가까운 것)
        tot = np.bincount(rl.ravel(), minlength=n + 1); lf = np.bincount(rl.ravel(), weights=leaf.ravel(), minlength=n + 1)
        ok = (sz > 15) & (lf > tot * .5); ok[0] = False                  # 둘레의 절반 넘게 잎이면 잎 사이 종이 — 줄기·껍질의 밝은 곳은 둘레가 회색이라 안 지움
        kill |= ok[lab]
        # ③ 잎 무더기 안의 흰 점(2026-11-13 선생님: 아카시아 잎 사이 흰 종이가 얼룩말 줄처럼 보여 찾기를 방해): 둘레 15점 안에 잎이 25% 넘는 곳의
        #    밝고(> 228) 색 없는 점 — 줄기·굵은 가지는 둘레에 잎이 적어 남음
        dens = ndi.uniform_filter(leaf.astype(float), 15)
        tint = (mn > 228) & (mx - mn < 20) & (A > 0) & (dens > .25) & ~kill   # 지우면 빽빽한 덤불에 구멍이 나므로 둘레 잎 색으로 칠함
    if gaps:   # ④ 가지 사이 큰 흰 종이(줄기가 하얗지 않은 나무·덤불에만 — 바오바브·마른 나무·마룰라처럼 흰 껍질에는 쓰지 말 것)
        blob = (mn > 240) & (mx - mn < 12) & (A > 0)
        lb, nb = ndi.label(blob); szb = ndi.sum(blob, lb, np.arange(nb + 1)); okb = szb > 40; okb[0] = False
        kill |= okb[lb]
    if pockets:   # ⑦ --pockets: 몸에 갇힌 매끈한 흰 종이(다리와 몸 사이 등, 2026-11-13 선생님: 낙타·전갈) — 밝고(> 232) 색 없고(< 16) 매끈한(표준편차 < 6) 30점 넘는 덩어리
        g2 = rgb.mean(2).astype(float); sd2 = np.sqrt(np.maximum(ndi.uniform_filter(g2 * g2, 5) - ndi.uniform_filter(g2, 5) ** 2, 0))
        pk = (mn > 232) & (mx - mn < 16) & (sd2 < 6) & (A > 0); lp, npk = ndi.label(pk); spk = ndi.sum(pk, lp, np.arange(npk + 1)); okp = spk > 30; okp[0] = False
        kill |= ndi.binary_dilation(okp[lp], st) & (mn > 215) & (mx - mn < 22)
    if halo:   # ⑧ --halo: 가장자리에 걸친 흰 조각 + 둘레 회백색, 몸 안의 매끈한 흰 점(빽빽한 덤불·풀숲)
        dd8 = ndi.distance_transform_edt(~out); R8 = max(6, int(max(H, W) * .04)); cap8 = max(150, H * W * .0012)
        body8 = ndi.uniform_filter(((A > 8) & (mn > 165) & (mx - mn < 34)).astype(float), 31) > .4 * ndi.uniform_filter((A > 8).astype(float), 31)   # 둘레 31점 안 칠해진 점이 거의 밝은 회색이면 몸(통나무·바위·흰 껍질)
        wh = (A > 8) & (mn > 212) & (mx - mn < 26) & ~body8; lw8, nw8 = ndi.label(wh, np.ones((3, 3)))
        sw8 = ndi.sum(wh, lw8, np.arange(nw8 + 1)); dm8 = ndi.minimum(dd8, lw8, np.arange(nw8 + 1))
        ok8 = (sw8 >= 4) & (sw8 <= cap8) & (dm8 <= R8); ok8[0] = False; k8 = ok8[lw8]
        g8 = rgb.mean(2).astype(float); sd8 = np.sqrt(np.maximum(ndi.uniform_filter(g8 * g8, 5) - ndi.uniform_filter(g8, 5) ** 2, 0))
        pk8 = (A > 8) & (mn > 228) & (mx - mn < 22) & (sd8 < 8) & ~body8; lp8, np8 = ndi.label(pk8, np.ones((3, 3)))
        sp8 = ndi.sum(pk8, lp8, np.arange(np8 + 1)); okp8 = (sp8 >= 4) & (sp8 <= cap8); okp8[0] = False; k8 |= okp8[lp8]
        grey8 = (A > 8) & (mn > 185) & (mx - mn < 32) & ~body8
        for _ in range(3): k8 |= ndi.binary_dilation(k8) & grey8
        kill |= k8
    line = np.zeros(A.shape, bool)
    if outline:   # ⑨ --outline: 진한 바깥 선 옅게, 밑변은 선 지움
        body9 = A > 200; d9 = ndi.distance_transform_edt(body9)
        inn9 = (body9 & (d9 > 4) & (d9 <= 14)).astype(float); w9 = ndi.uniform_filter(inn9, 31) + 1e-6
        mean9 = np.stack([ndi.uniform_filter(rgb[..., c] * inn9, 31) / w9 for c in range(3)], -1)
        below = np.zeros(A.shape, bool)
        for k in range(1, 10): below[:-k] |= ~body9[k:]                 # 아래 9점 안에 몸 밖이 있으면 밑변
        bot9 = (A > 0) & (d9 <= 5) & below & (w9 > .01)
        side9 = (A > 0) & (d9 <= 3) & ~bot9 & (rgb.mean(2) < mean9.mean(2) - 35) & (w9 > .01)
        line = bot9 | side9
    holes = np.zeros(A.shape, bool)
    if fill:   # ⑤ --fill: 몸 안에 갇힌 작은 구멍(자를 때 생긴 것, 3000점 이하)을 둘레 색으로 메움 — 바위·흙처럼 단단한 것에만
        semi = A < 230; ls, ns = ndi.label(semi)   # 반투명 구멍까지 — 그림 테두리와 이어지지 않은 덩어리만
        es = np.unique(np.concatenate([ls[0], ls[-1], ls[:, 0], ls[:, -1]])); es = es[es > 0]
        ss = ndi.sum(semi, ls, np.arange(ns + 1)); holes = semi & ~np.isin(ls, es) & (ss <= 3000)[ls]
    rim = np.zeros(A.shape, bool)
    if rimfix:   # ⑥ --rim: 둘레 2점 안에서 바로 안쪽(3~8점)보다 눈에 띄게 밝은 점은 안쪽 색으로(2026-11-13 선생님: 하이에나 둘레 흰 선 — 테두리선 없는 연한 털끝)
        dd = ndi.distance_transform_edt(~out); inn = ((dd > 8) & (dd <= 20) & (A > 200)).astype(float); w = ndi.uniform_filter(inn, 41) + 1e-6
        mean = np.stack([ndi.uniform_filter(rgb[..., c] * inn, 41) / w for c in range(3)], -1)
        rim = (dd <= 6) & (A > 0) & (rgb.mean(2) > mean.mean(2) + 10) & (w > .003)   # 둘레 6점 띠의 밝은 털 — 몸 안쪽(8~20점) 색과 견줌
        rimk = np.clip((7 - dd) / 6, 0, 1)                                            # 바깥일수록 안쪽 색에 가깝게
    n = int(kill.sum()) + (int(tint.sum()) if plant else 0) + int(holes.sum()) + int(rim.sum()) + int(line.sum())
    if dry or not n: return n
    if holes.any():
        idx = ndi.distance_transform_edt(holes | (A < 230), return_distances=False, return_indices=True)
        for c in range(3): a[..., c][holes] = rgb[..., c][idx[0][holes], idx[1][holes]]
        a[..., 3][holes] = 255; A = a[..., 3]
    if plant and tint.any():
        lw = ndi.uniform_filter(leaf.astype(float), 9) + 1e-6
        for c in range(3): a[..., c][tint] = (ndi.uniform_filter(rgb[..., c] * leaf, 9) / lw)[tint].astype(np.int32)
    if rim.any():
        for c in range(3): a[..., c][rim] = (rgb[..., c][rim] * (1 - rimk[rim]) + mean[..., c][rim] * .97 * rimk[rim]).astype(np.int32)
        edge1 = (dd <= 1) & (A > 0); a[..., 3][edge1] = (a[..., 3][edge1] * .7).astype(np.int32); A = a[..., 3]
    if line.any():
        for c in range(3):
            up = np.roll(rgb[..., c], 7, 0); a[..., c][bot9] = (up[bot9] * .6 + mean9[..., c][bot9] * .35).astype(np.int32)   # 7점 위 결을 빌려 옴
            a[..., c][side9] = (rgb[..., c][side9] * .3 + mean9[..., c][side9] * .7).astype(np.int32)
        clear9 = ndi.binary_dilation(A <= 8, iterations=3)               # 그림자(반투명) 위는 그대로, 투명과 닿은 끝만 옅게
        e9 = bot9 & (d9 <= 2) & clear9; a[..., 3][e9] = (a[..., 3][e9] * np.where(d9[e9] <= 1, .45, .8)).astype(np.int32); A = a[..., 3]
    A2 = A.copy(); A2[kill] = 0
    soft = ndi.binary_dilation(kill, st) & ~kill & (A2 > 0)          # 지운 곳 바로 옆은 조금 옅게
    A2[soft] = (A2[soft] * .6).astype(np.int32)
    a[..., 3] = A2
    Image.fromarray(a.astype(np.uint8)).save(dst, quality=92, method=6)
    return n


if __name__ == '__main__':
    p = argparse.ArgumentParser(); p.add_argument('files', nargs='+'); p.add_argument('--out'); p.add_argument("--light", type=int, default=235)
    p.add_argument('--depth', type=int); p.add_argument('--plant', action='store_true'); p.add_argument('--dry', action='store_true'); p.add_argument('--gaps', action='store_true'); p.add_argument('--fill', action='store_true'); p.add_argument('--rim', action='store_true'); p.add_argument('--pockets', action='store_true'); p.add_argument('--halo', action='store_true'); p.add_argument('--outline', action='store_true')
    o = p.parse_args()
    for f in o.files:
        n = fix(f, o.out or f, o.light, o.depth, o.plant, o.dry, o.gaps, o.fill, o.rim, o.pockets, o.halo, o.outline); print(f'{n:7d}  {f}')
