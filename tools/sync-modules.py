#!/usr/bin/env python3
"""공통 모듈 넣기 — common/이름.js 원본을 앱 안의 <script id="이름"> 칸에 그대로 복사해 넣는다.

    python3 tools/sync-modules.py           # 바꾸고, 바뀐 앱을 적음
    python3 tools/sync-modules.py --check   # 바꾸지 않고, 원본과 다른 앱만 적음(올리기 전 확인)

앱은 지금처럼 HTML 한 파일로 열리고(다른 파일을 부르지 않음), 원본은 한 곳에만 있다.
새 앱에 모듈을 넣으려면 그 앱 <head> 끝이나 앱 본문 <script> 앞에 빈 칸 <script id="이름"></script>를 두고 이 도구를 돌린다.
007 편 판(word-learn-N.html)은 split.py가 통합본에서 다시 만들므로 함께 바뀐다.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECK = '--check' in sys.argv
SRC = os.path.join(ROOT, 'common')

mods = {}
for f in sorted(os.listdir(SRC)):
    if f.endswith('.js'):
        mods[f[:-3]] = open(os.path.join(SRC, f), encoding='utf-8').read().strip('\n')

changed, same = {}, {}
for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', 'common', '_trash')]
    for f in sorted(files):
        if not f.endswith('.html'):
            continue
        path = os.path.join(dirpath, f)
        src = open(path, encoding='utf-8').read()
        out = src
        for name, code in mods.items():
            pat = re.compile(r'(<script id="' + re.escape(name) + r'">)(.*?)(</script>)', re.S)
            if not pat.search(out):
                continue
            new = pat.sub(lambda m: m.group(1) + '\n' + code + '\n' + m.group(3), out)
            rel = os.path.relpath(path, ROOT)
            (changed if new != out else same).setdefault(name, []).append(rel)
            out = new
        if out != src and not CHECK:
            open(path, 'w', encoding='utf-8').write(out)

for name in mods:
    c, s = changed.get(name, []), same.get(name, [])
    if not c and not s:
        print(f'{name}: 넣은 앱 없음')
        continue
    if c:
        print(f'{name}: {"원본과 다름" if CHECK else "새로 넣음"} {len(c)} — ' + ', '.join(c))
    if s:
        print(f'{name}: 원본과 같음 {len(s)} — ' + ', '.join(s))
if CHECK and changed:
    sys.exit(1)
