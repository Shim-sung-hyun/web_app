#!/usr/bin/env python3
"""차름 자료 전체 목록 만들기 — media/ 의 모든 그림·사진·소리를 media/catalog.json 하나로 (2026-11-22)

    python3 tools/media-index.py           # 목록을 다시 만듦(그림·소리를 넣거나 옮긴 뒤 꼭)
    python3 tools/media-index.py --check   # 목록이 낡았는지만 봄(목록에 없는 파일·없어진 파일) — 낡았으면 1을 돌려줌

- 손으로 쓰지 않는다. 폴더마다 이미 있는 목록(낱말 pics.json · 사진 photos.json · 동물 index.json · 무대 index.json·props.json ·
  보관함 list.json · 목소리 index.json)에서 이름을 모으고, 이름이 없으면 파일 이름(영어)을 media/synonyms.json 의 "en"으로 한글로.
- 한 줄 = 파일 하나: path(media/ 뒤) · names(찾을 이름들) · kind(그림·사진·배경·소품·선 그림·원본·글꼴) · style(그림풍) ·
  group(무리) · used_by(쓰는 앱 — 앱 html이 그 폴더 주소를 부르는지로) · archived(보관함이면 true).
- 목소리는 파일마다 적지 않고 묶음(voice/<묶음>)마다 한 줄 — 같은 말이 있는지는 find-media.py --say 가 이름(SHA-1)으로 봄.
- 파일이 아닌 그림(앱 코드로 그린 도형·퍼즐 조각 등)은 media/synonyms.json 의 "code" 에서 함께 올림.
찾기는 tools/find-media.py.
"""
import glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = os.path.join(ROOT, 'media')
OUT = os.path.join(M, 'catalog.json')
SYN = os.path.join(M, 'synonyms.json')
EXT = re.compile(r'\.(webp|jpe?g|png|gif|svg|mp3|wav|ogg|m4a|mp4|ttf|otf|woff2?)$', re.I)


def J(p, d=None):
    p = os.path.join(M, p)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else d


syn = J('synonyms.json', {})
EN = syn.get('en', {})
PLACE = {k.split('/')[-1]: v.get('name', '') for k, v in (J('stage/index.json', {}) or {}).items()}
ROM = {}   # 로마자 파일 이름 → 한글(낱말·동물 목록에서): gom → 곰, tokki → 토끼
for d in ((J('words/pics.json', {}) or {}), ((J('animals/index.json', {}) or {}).get('pics') or {})):
    for name, f in d.items(): ROM.setdefault(os.path.splitext(f)[0].lower(), name)


def stem_names(stem):
    """파일 이름(영어)에서 찾을 이름 — 번호·-s·-sk 등 꼬리를 떼고 synonyms.json en으로 한글"""
    s = re.sub(r'(-s?\d+|-sk|-old|-big|-small|-s|-cartoon|-fly|-cling|_open|_yum)+$', '', stem.lower())
    s = re.sub(r'(?<=[a-z])\d$', '', s)   # cloud2 → cloud
    out = [s]
    for part in [s] + re.split(r'[-_]', s):
        if part in EN: out += EN[part] if isinstance(EN[part], list) else [EN[part]]
        if part in PLACE and PLACE[part]: out.append(PLACE[part])
        if part in ROM: out.append(ROM[part])
    return out


cat = {}


def put(path, names=(), kind='그림', style='', group='', extra=None):
    e = cat.setdefault(path, {'path': path, 'names': [], 'kind': kind, 'style': style, 'group': group})
    for n in names:
        if n and n not in e['names']: e['names'].append(n)
    if extra: e.update(extra)


# 낱말 그림
for name, f in (J('words/pics.json', {}) or {}).items():
    put('words/' + f, [name], '그림', '낱말 그림체(만화풍)', 'words')
# 동물 — 보관함에 같은 이름의 만화풍이 있으면 지금 것은 연필풍
cart = {os.path.basename(p) for p in glob.glob(os.path.join(M, 'archive', 'cartoon', 'animals', '*'))}
try:   # git 기록에서 '연필풍' 커밋이 손댄 동물 그림도 연필풍
    import subprocess
    log = subprocess.run(['git', 'log', '--format=@%s', '--name-only', '--', 'media/animals'], cwd=ROOT, capture_output=True, text=True).stdout
    pen = False
    for ln in log.splitlines():
        if ln.startswith('@'): pen = '연필풍' in ln
        elif pen and ln.strip(): cart.add(os.path.basename(ln.strip()))
except Exception: pass
for name, f in ((J('animals/index.json', {}) or {}).get('pics') or {}).items():
    put('animals/' + f, [name], '그림', '빙 연필풍' if f in cart else '낱말 그림체(만화풍)', 'animals')
# 사진 모음
ph = J('photos/photos.json', {}) or {}
for it in ph.get('photos', []):
    nm = [it.get('title', '')] + it.get('objects', []) + it.get('tags', []) + [it.get('category', '')]
    for k, f in (it.get('files') or {}).items():
        put('photos/' + f, nm, {'photo': '사진', 'art': '그림', 'line': '선 그림'}.get(k, '사진'),
            {'photo': '실제 사진', 'art': '사진을 그림으로(일상 그림)', 'line': '색칠 도안'}.get(k, ''), 'photos')
# 무대(지금) — 소품실 이름
for key, p in (J('stage/props.json', {}) or {}).items():
    put(f"stage/{p['place']}/items/{p['file']}.webp", [p.get('name', ''), p.get('kind', ''), p.get('placeName', '')] + stem_names(p['file']),
        '무대 소품', '빙 연필풍', 'stage', {'place': p.get('placeName', '')})
for key, v in (J('stage/index.json', {}) or {}).items():
    for b in v.get('bg', []):
        put(f'stage/{key}/{b}.jpg', [v.get('name', '') + ' 배경', v.get('name', ''), '배경'], '배경', '빙 연필풍', 'stage', {'place': v.get('name', '')})
for key, v in (J('stage/legacy/index.json', {}) or {}).items():
    for sub in ('items', 'front', 'far', 'skirt'):
        for f in v.get(sub, []):
            put(f'stage/legacy/{key}/{sub}/{f}.webp', stem_names(f) + [v.get('name', '')], '무대 소품', '옛 무대(덮개 방식)', 'stage-legacy', {'place': v.get('name', '')})
    for b in v.get('bg', []):
        put(f'stage/legacy/{key}/{b}.jpg', [v.get('name', '') + ' 배경', '배경'], '배경', '옛 무대(덮개 방식)', 'stage-legacy')
# 보관함
for e in (J('archive/list.json', []) or []):
    orig = e.get('from', '')
    nm = []
    base = os.path.basename(orig)
    for name, f in ((J('animals/index.json', {}) or {}).get('pics') or {}).items():
        if f == base: nm.append(name)
    nm += stem_names(os.path.splitext(base)[0])
    style = {'cartoon': '만화풍(바꾸기 전)', 'replaced': '다시 받기 전', 'unused': '안 쓰게 된 것'}.get(e.get('kind'), '')
    put('archive/' + e['file'], nm, '소리' if orig.endswith('.mp3') else '그림', style, 'archive', {'archived': True, 'why': e.get('why', '')[:120]})

STYLE = {  # 폴더마다 그림풍(목록이 없는 곳)
    'habitats/props/': ('소품', '만화풍(008·009 옛 서식지)'), 'habitats/game/': ('배경', '만화풍(008 옛 숨은 동물 찾기)'),
    'habitats/': ('배경', '만화풍(008·009 옛 서식지)'), 'play/feed/food/': ('그림', '낱말 그림체(만화풍)'),
    'play/feed/animal/': ('그림', '낱말 그림체(만화풍) — 입 벌린·먹는 동물'), 'play/body/': ('그림', '스티커 몸 그림'),
    'materials/inside/': ('그림', '속 보기(빙)'), 'materials/': ('사진', '물질 결·조각(빙 사진풍)'),
    'stage/nature/': ('원본', '받은 원본(손질용)'), 'animals/': ('그림', '낱말 그림체(만화풍)'),
    'photos/': ('사진', '실제 사진'), 'fonts/': ('글꼴', ''), 'brand/': ('그림', '차름 로고'), 'prompts/': ('그림', '빙에 같이 붙이는 그림풍 견본'),
    'words/': ('그림', '낱말 그림체(만화풍)'),
}
# 남은 파일 — 폴더 그림풍 + 파일 이름
for r, ds, fs in os.walk(M):
    rel_r = os.path.relpath(r, M).replace(os.sep, '/')
    if rel_r.startswith('voice') or rel_r.startswith('archive'): continue
    for f in fs:
        if not EXT.search(f): continue
        rel = (rel_r + '/' + f) if rel_r != '.' else f
        if rel in cat: continue
        k, st = next((v for p, v in sorted(STYLE.items(), key=lambda x: -len(x[0])) if rel.startswith(p)), ('그림', ''))
        if rel.startswith('animals/') and f in cart: st = '빙 연필풍'
        stem = os.path.splitext(f)[0]
        nm = stem_names(stem)
        m = re.match(r'stage/nature/([^/]+)/', rel)
        if m: nm.append(PLACE.get(m.group(1), ''))
        if rel.startswith('habitats/') and stem in PLACE: nm += [PLACE[stem], '배경']
        put(rel, nm, k, st, rel.split('/')[0])
# 목소리 묶음
for ij in sorted(glob.glob(os.path.join(M, 'voice', '*', 'index.json'))):
    d = os.path.basename(os.path.dirname(ij)); v = json.load(open(ij, encoding='utf-8'))
    ub = sorted({a for x in (v.get('used_by') or {}).values() for a in (x if isinstance(x, list) else [x])}) if isinstance(v.get('used_by'), dict) else []
    put(f'voice/{d}/', [d, str(v.get('voice', ''))], '소리 묶음', f"{v.get('voice', '')} 빠르기 {v.get('rate', '')}".strip(), 'voice',
        {'count': len(v.get('files', [])), 'used_by': ub})
# 코드로 그린 그림(파일 없음)
for c in syn.get('code', []):
    put('code:' + c['where'], c.get('names', []), '코드 그림', c.get('style', '앱 코드로 그림'), 'code', {'used_by': c.get('used_by', [])})

# 쓰는 앱 — 앱 html이 부르는 media 폴더(주소 꼴이 여러 가지라 폴더 단위로)
apps = sorted(glob.glob(os.path.join(ROOT, '[0-9][0-9][0-9]', '*.html')))
use = {}
for a in apps:
    app = os.path.basename(os.path.dirname(a)); s = open(a, encoding='utf-8', errors='ignore').read()
    for m in set(re.findall(r'media/([a-z0-9_-]+(?:/[a-z0-9_-]+){0,2})/', s)):
        use.setdefault(m, set()).add(app)
for e in cat.values():
    if 'used_by' in e or e['group'] in ('archive', 'code'): continue
    folders = [k for k in use if e['path'].startswith(k + '/')]
    e['used_by'] = sorted({a for k in folders for a in use[k]})

items = sorted((e for e in cat.values() if e['path'].startswith(('code:', 'voice/')) or os.path.exists(os.path.join(M, e['path']))),
               key=lambda e: e['path'])   # 차림표에만 있고 파일이 없는 것(옛 무대의 받지 못한 소품 등)은 뺌
for e in items:
    e['names'] = [n for n in e['names'] if n and n.strip()]


def write():
    head = {'about': '차름 자료 전체 목록 — tools/media-index.py가 만듦(손으로 고치지 않음). 찾기: python3 tools/find-media.py 낱말',
            'count': len(items), 'base': 'https://shim-sung-hyun.github.io/web_app/media/'}
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('{\n' + ',\n'.join(f'"{k}": {json.dumps(v, ensure_ascii=False)}' for k, v in head.items()) + ',\n"items": [\n')
        f.write(',\n'.join(json.dumps(e, ensure_ascii=False) for e in items) + '\n]}\n')


def files_on_disk():
    out = set()
    for r, ds, fs in os.walk(M):
        rel_r = os.path.relpath(r, M).replace(os.sep, '/')
        if rel_r.startswith('voice'): continue
        for f in fs:
            if EXT.search(f): out.add((rel_r + '/' + f) if rel_r != '.' else f)
    return out


if '--check' in sys.argv:
    old = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {'items': []}
    have = {e['path'] for e in old['items'] if not e['path'].startswith(('code:', 'voice/'))}
    disk = files_on_disk()
    new, gone = sorted(disk - have), sorted(have - disk)
    if new or gone:
        print(f'자료 목록이 낡았어요 — 목록에 없는 파일 {len(new)} · 없어진 파일 {len(gone)}. python3 tools/media-index.py 를 돌려 주세요.')
        for p in (new + gone)[:15]: print('  ', p)
        sys.exit(1)
    print('자료 목록 최신(목록에 없는 파일 0)')
    sys.exit()

write()
noname = [e['path'] for e in items if e['group'] not in ('voice', 'code') and e['kind'] != '소리' and not any(re.search('[가-힣]', n) for n in e['names'])]
print(f'media/catalog.json — {len(items)}줄 (한글 이름 없는 파일 {len(noname)})')
if noname and '-v' in sys.argv:
    for p in noname: print('  ', p)
