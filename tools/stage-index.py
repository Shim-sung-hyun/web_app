#!/usr/bin/env python3
"""무대 요소를 008 숨은 동물 찾기 가림 소품으로 쓰기 위한 목록 — media/stage/hide-index.json

    python3 tools/stage-index.py      # 무대 그림을 넣거나 바꾼 뒤 돌림

꼴은 media/habitats/props/index.json 과 같음(size·solid·mask·real·places, tools/props-index.py의 재는 법을 그대로 씀).
이름은 media/stage/ 아래 경로(확장자 뺌): "nature/desert/items/saguaro". places 는 008의 곳 이름(무대 장소 폴더 이름과 같음).
- real: stage.json 의 real. 구름처럼 뜬 것(float)은 "far". 가까운 줄기(role frame)는 숨기는 데 쓰지 않아 뺌.
- scalefree: 크기를 드러내지 않는 것(돌·풀·흙 더미) — 008이 아주 작은 동물을 키웠을 때 이것만 씀(SCALEFREE).
- 끝 검사(2026-11-04): 좌우 끝이 세로로 잘린 그림(흙 단면·잘린 덤불)은 쓰지 않기로 함(선생님). 잘린 끝이 높이의 40% 넘게 곧게 서 있으면
  '잘린 끝?'으로 알려 줌 — 그림을 보고 정말 잘렸으면 빼거나 다시 받음. 통나무처럼 원래 끝이 반듯한 것은 CUT_OK에 이름을 적음.
"""
import importlib.util, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('pi', os.path.join(ROOT, 'tools', 'props-index.py'))
PI = importlib.util.module_from_spec(spec); spec.loader.exec_module(PI)
ST = os.path.join(ROOT, 'media', 'stage')
SCALEFREE = {'rocks', 'stones', 'pebbles', 'drygrass', 'grassclump', 'clover', 'tussock', 'sedge', 'seagrass', 'waterweed', 'hornwort',
             'mudmound', 'saltreeds', 'glasswort', 'snowmound', 'snowdrift', 'icechunks', 'gravel', 'clod', 'slate', 'clay', 'tallgrass', 'mossrock', 'rock', 'bush', 'lowshrub'}

CUT_OK = {'log', 'sunkenlog', 'mudlog', 'deadtrunk', 'rottenlog', 'fallengiant', 'oaktrunk', 'pinetrunk'}


def cut_edge(path):
    import numpy as np
    from PIL import Image
    a = np.array(Image.open(path).convert('RGBA'))[..., 3] > 128
    ys, xs = np.where(a)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h = a.shape[0]
    def run(c):
        best = cur = 0
        for v in c.any(1):
            cur = cur + 1 if v else 0; best = max(best, cur)
        return best / h
    return max(run(a[:, :4]), run(a[:, -4:]))


out = {}
idx = json.load(open(os.path.join(ST, 'index.json'), encoding='utf-8'))
for pid in idx:
    place = pid.split('/')[-1]
    cfg = json.load(open(os.path.join(ST, pid, 'stage.json'), encoding='utf-8'))
    for k, it in cfg.get('items', {}).items():
        if it.get('role') == 'frame':
            continue
        nm = (it.get('from') or pid) + '/items/' + k
        path = os.path.join(ST, nm + '.webp')
        if not os.path.exists(path):
            continue
        if k not in CUT_OK and cut_edge(path) > .4:
            print('  잘린 끝?', nm)
        if nm not in out:
            w, h, solid = PI.solid_box(path)
            out[nm] = {'size': [w, h], 'solid': solid, 'mask': PI.mask_of(path), 'real': 'far' if it.get('float') else it.get('real', [.3, 1]), 'places': []}
            if k in SCALEFREE:
                out[nm]['scalefree'] = 1
        if place not in out[nm]['places']:
            out[nm]['places'].append(place)
with open(os.path.join(ST, 'hide-index.json'), 'w', encoding='utf-8') as f:
    f.write('{\n' + ',\n'.join(json.dumps(k, ensure_ascii=False) + ': ' + json.dumps(v, ensure_ascii=False, separators=(',', ':')) for k, v in out.items()) + '\n}\n')
for pid in idx:   # 밑동 덮개도 끝 검사
    for k in json.load(open(os.path.join(ST, pid, 'stage.json'), encoding='utf-8')).get('skirt', []):
        f = os.path.join(ST, pid, 'skirt', k + '.webp')
        if os.path.exists(f) and cut_edge(f) > .4:
            print('  잘린 끝?', pid + '/skirt/' + k)
print('무대 가림 소품', len(out), '→ media/stage/hide-index.json')
