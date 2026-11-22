#!/usr/bin/env python3
"""소품실 — 무대 소품을 한 목록으로 모으고, 다른 무대의 소품을 빌려 쓰기(2026-11-16 선생님)

    python3 tools/prop-room.py                                   # 목록 다시 짜기 → media/stage/props.json
    python3 tools/prop-room.py --borrow nature/wetland nature/pond/reeds-1          # 빌려 쓰기
    python3 tools/prop-room.py --borrow nature/wetland nature/pond/reeds-1 --as reeds-pond   # 이름이 겹치면 새 이름
    python3 tools/prop-room.py --borrow ... --force              # 밑동 땅이 달라도(보통은 하지 말 것)

왜: 무대마다 소품을 따로 그려 같은 종류(통나무·돌·갈대…)가 여러 번 그려졌음. 그림 파일은 옮기지 않고(소품 손질·원본 색 붓·stage.json 주소가 묶여 있음)
  목록(소품실)으로 모아 보고, 밑동 땅이 같은 무대끼리는 그림을 옮기지 않고 가져다 씀 — stage.json items에 {"from": "nature/pond", "file": "reeds-1"}.
  모듈(stagekit load)·stage-meta가 from·file을 따라 그림을 찾음. 소품 손질(touchup)은 원래 무대에서 하면 빌린 무대에도 함께 바뀜.
밑동 땅: 소품 그림 밑동에 그 무대의 땅(낙엽 흙·모래·진흙…)이 그려져 있어, 땅이 다른 무대에 놓으면 오려 붙인 티가 남. 무대마다 GROUND(아래)나 stage.json "groundKind".
보기: media/stage/prop-room.html (그림으로 둘러보기 — 밑동 땅·종류·무대로 고르기)
새 무대·새 앱: 그림을 새로 받기 전에 소품실부터 보고, 밑동 땅이 같은 것이 있으면 빌림. 없거나 땅이 다를 때만 새로 받고, 받으면 stage-intake가 이 목록을 다시 짬.
"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BETA = os.path.join(ROOT, 'media', 'stage')
GROUND = {'forest': '흙·풀', 'grassland': '흙·풀', 'ground': '흙·풀', 'desert': '모래', 'polar': '눈·얼음',   # 비슷한 땅끼리 한 묶음 — 묶음 안에서는 빌려 씀
          'mudflat': '진흙·물가', 'wetland': '진흙·물가', 'pond': '진흙·물가', 'sea': '물속 바닥', 'water': '물속 바닥',
          'underground': '흙 속(단면)', 'sky': '하늘(땅 없음)'}


def load(p): return json.load(open(p, encoding='utf-8'))


def save(p, j): json.dump(j, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def places():
    idx = load(os.path.join(BETA, 'index.json'))
    return [k for k in idx if os.path.exists(os.path.join(BETA, k, 'stage.json'))]


def ground_of(pid, st=None):
    st = st or load(os.path.join(BETA, pid, 'stage.json'))
    return st.get('groundKind') or GROUND.get(pid.split('/')[-1], '?')


def build():
    out, used = {}, {}
    for pid in places():
        st = load(os.path.join(BETA, pid, 'stage.json'))
        sp = os.path.join(BETA, pid, 'intake.json'); names = {k: v.get('name', k) for k, v in (load(sp).get('kinds', {}) if os.path.exists(sp) else {}).items()}
        shade = '그림자 없음' if st.get('noShadow') else None
        for k, it in st.get('items', {}).items():
            if it.get('from'):   # 빌려 쓴 것 — 원래 소품에 '쓰는 무대'로만 적음
                used.setdefault(it['from'] + '/' + it.get('file', k), []).append(pid); continue
            f = os.path.join(BETA, pid, 'items', k + '.webp')
            if not os.path.exists(f): continue
            kind = it.get('kind') or k.rsplit('-', 1)[0]
            out[pid + '/' + k] = {'place': pid, 'placeName': st.get('name', pid), 'file': k, 'kind': kind, 'name': names.get(kind) or it.get('kindName') or it.get('name') or kind,
                                  'real': it.get('real'), 'ground': ground_of(pid, st), 'plant': bool(it.get('plant')),
                                  'shadow': shade or ('해 그림자(그림에 듦)' if it.get('ownShadow') else '무대가 그림'),
                                  'size': list(Image.open(f).size), 'usedBy': [pid]}
    for key, ps in used.items():
        if key in out: out[key]['usedBy'] += [p for p in ps if p not in out[key]['usedBy']]
    p = os.path.join(BETA, 'props.json')
    with open(p, 'w', encoding='utf-8') as fh:
        fh.write('{\n' + ',\n'.join(json.dumps(k, ensure_ascii=False) + ': ' + json.dumps(v, ensure_ascii=False, separators=(',', ':')) for k, v in sorted(out.items())) + '\n}\n')
    kinds = {}
    for v in out.values(): kinds.setdefault(v['kind'], set()).add(v['place'])
    print('소품실', len(out), '장 ·', len(kinds), '종류 · 여러 무대에 그린 종류', sum(1 for s in kinds.values() if len(s) > 1), '→ media/stage/props.json')


def borrow(to, item, as_name=None, force=False):
    src_pid, k = item.rsplit('/', 1)
    S = load(os.path.join(BETA, src_pid, 'stage.json')); T_p = os.path.join(BETA, to, 'stage.json'); T = load(T_p)
    it = S['items'].get(k)
    if not it or it.get('from'): sys.exit('없는 소품(또는 빌려 온 것 — 원래 무대 이름으로): ' + item)
    g1, g2 = ground_of(src_pid, S), ground_of(to, T)
    if g1 != g2 and not force: sys.exit('밑동 땅이 다름: %s(%s) → %s(%s). 오려 붙인 티가 나므로 새로 받는 것이 좋음(꼭 쓰려면 --force)' % (item, g1, to, g2))
    name = as_name or k
    if name in T['items']: sys.exit('이름이 겹침: %s — --as 새이름' % name)
    e = {x: y for x, y in it.items() if x not in ('id', 'src', 'img')}
    e.update({'from': src_pid, 'file': k})
    if e.get('bed') not in T.get('beds', {}): e['bed'] = next(iter(T.get('beds', {'ground': 0})))
    T['items'][name] = e; save(T_p, T)
    ix = os.path.join(BETA, 'index.json'); I = load(ix)
    if to in I and name not in I[to].get('items', []): I[to].setdefault('items', []).append(name); save(ix, I)
    print('빌림', item, '→', to, 'items/' + name, '(그림은 원래 자리 그대로)')
    print('  stage.json의 softKinds·scalefree·blocks 같은 목록에 그 종류(%s)가 없으면 필요한 곳에 더할 것' % e.get('kind', name.rsplit('-', 1)[0]))


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--borrow':
        if len(a) < 3: sys.exit(__doc__)
        borrow(a[1], a[2], a[a.index('--as') + 1] if '--as' in a else None, '--force' in a)
    build()
