#!/usr/bin/env python3
"""없는 파일 검사 — 앱과 자료 목록이 가리키는 GitHub 주소의 파일이 저장소에 다 있는지 본다.

    python3 tools/check-files.py          # 없는 것만 보여 줌
    python3 tools/check-files.py -v       # 어디서 몇 개를 봤는지도 보여 줌

보는 곳
  1. 모든 .html 안의 GitHub 절대 주소(github.io/web_app/…, raw.githubusercontent.com/…/main/…)
  2. 앱 안에서 주소를 이어 붙인 것: const PICS_BASE = GH+'007/pics/' 같은 대문자 상수,
     BASE+'이름.webp', BASE+표[…]+'.webp', BASE+표[…].scene+'.jpg' (표는 같은 파일의 const 표={…})
  3. media/photos/photos.json 의 files
  4. media/voice/*/index.json 의 files (파일 이름 + .mp3)
끝에 "없는 파일 0"이 나오면 통과. 하나라도 없으면 끝 상태가 1.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFIXES = ('https://shim-sung-hyun.github.io/web_app/',
            'https://raw.githubusercontent.com/Shim-sung-hyun/web_app/main/')
VERBOSE = '-v' in sys.argv

missing = {}   # 저장소 안 경로 → 처음 본 곳
seen = 0


def to_path(url):
    for p in PREFIXES:
        if url.lower().startswith(p.lower()):
            return re.split(r'[?#]', url[len(p):])[0]
    return None


def need(rel, where):
    """rel: 저장소 안 경로. 끝이 / 이면 폴더가 있어야 함."""
    global seen
    if not rel or '*' in rel or '${' in rel:
        return
    seen += 1
    full = os.path.join(ROOT, rel)
    ok = os.path.isdir(full) if rel.endswith('/') or rel == '' else os.path.exists(full)
    if not ok:
        missing.setdefault(rel, where)


STR = r"'[^'\n]*'|\"[^\"\n]*\""
NAME = r'[A-Z][A-Z0-9_]*'
TERM = rf'(?:{NAME}|{STR})'
CONCAT = rf'{TERM}(?:\s*\+\s*{TERM})*'


def resolve(expr, consts):
    out = ''
    for t in re.findall(TERM, expr):
        if t[0] in '\'"':
            out += t[1:-1]
        elif t in consts:
            out += consts[t]
        else:
            return None
    return out


def table_values(src, name, field):
    m = re.search(rf'\b{name}\s*=\s*\{{', src)
    if not m:
        return []
    i, depth = m.end() - 1, 0
    for j in range(i, len(src)):
        if src[j] == '{':
            depth += 1
        elif src[j] == '}':
            depth -= 1
            if depth == 0:
                body = src[i:j + 1]
                break
    else:
        return []
    if field:
        return re.findall(rf'\b{field}\s*:\s*[\'"]([^\'"]+)[\'"]', body)
    return re.findall(r':\s*[\'"]([^\'"]+)[\'"]', body)


def scan_html(path):
    rel_file = os.path.relpath(path, ROOT)
    src = open(path, encoding='utf-8', errors='replace').read()
    # 1. 그대로 적힌 주소
    for url in re.findall(r'https://[^\s\'"`<>()\\]+', src):
        rel = to_path(url)
        if rel is not None:
            need(rel, rel_file)
    # 2. 대문자 상수(GH, VBASE, PHOTOS …)를 풀어 둠. 조건식 A ? x : y 는 주소가 되는 쪽.
    consts = {}
    decl = re.compile(rf'\b({NAME})\s*=\s*(?:[^;?\n]*\?\s*(?:{CONCAT})\s*:\s*)?({CONCAT})\s*[;,\n)]')
    for _ in range(3):  # 서로 기대는 상수가 있으니 몇 번 돎
        for name, expr in decl.findall(src):
            v = resolve(expr, consts)
            if v is not None and to_path(v) is not None:
                consts[name] = v
    for name, v in consts.items():
        if v.endswith('/'):
            need(to_path(v), f'{rel_file} ({name})')
    # BASE + '…' (+ '…')
    for expr in re.findall(rf'\b(?:{"|".join(map(re.escape, consts)) or "$^"})\s*\+\s*(?:{STR})(?:\s*\+\s*(?:{STR}))*', src):
        v = resolve(expr, consts)
        if v and re.search(r'\.\w{2,4}$', v):
            need(to_path(v), rel_file)
    # BASE (+ '폴더/') + 표[…](.칸) + '.확장자'
    pat = rf'\b({"|".join(map(re.escape, consts)) or "$^"})\s*((?:\+\s*(?:{STR})\s*)*)\+\s*({NAME})\[[^\]]+\](?:\.(\w+))?\s*\+\s*({STR})'
    for base, mid, table, field, tail in re.findall(pat, src):
        head = consts[base] + ''.join(s[1:-1] for s in re.findall(STR, mid))
        tail = re.split(r'[\s"\'<>]', tail[1:-1])[0]   # '.jpg" alt=""> 처럼 뒤에 붙은 HTML은 버림
        if not re.fullmatch(r'\.\w{2,4}', tail):           # 뒤에 또 이어 붙이면(…+'_'+k+…) 끝을 모름
            continue
        for val in table_values(src, table, field):
            need(to_path(head + val + tail), f'{rel_file} ({table})')


for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
    for f in files:
        if f.endswith('.html'):
            scan_html(os.path.join(dirpath, f))
if VERBOSE:
    print(f'앱·설명 .html: 주소 {seen}개 봄')

# 3. 사진 모음
n0 = seen
pj = os.path.join(ROOT, 'media/photos/photos.json')
for p in json.load(open(pj, encoding='utf-8'))['photos']:
    for f in (p.get('files') or {}).values():
        if f:
            need('media/photos/' + f, f'photos.json ({p.get("id")})')
if VERBOSE:
    print(f'photos.json: 파일 {seen - n0}개 봄')

# 4. 목소리 묶음
vroot = os.path.join(ROOT, 'media/voice')
for d in sorted(os.listdir(vroot)):
    ij = os.path.join(vroot, d, 'index.json')
    if not os.path.exists(ij):
        continue
    n0 = seen
    for h in json.load(open(ij, encoding='utf-8')).get('files', []):
        need(f'media/voice/{d}/{h}.mp3', f'voice/{d}/index.json')
    if VERBOSE:
        print(f'voice/{d}: 파일 {seen - n0}개 봄')

if missing:
    print(f'없는 파일 {len(missing)}')
    for rel, where in sorted(missing.items()):
        print(f'  {rel}   ← {where}')
    sys.exit(1)
print(f'없는 파일 0 (모두 {seen}곳 확인)')
