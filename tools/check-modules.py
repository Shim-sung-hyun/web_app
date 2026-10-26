#!/usr/bin/env python3
"""공통 모듈 검사 — 앱마다 들어 있는 <script id="adminGate"> 같은 공통 모듈이 서로 같은 판인지 본다.

    python3 tools/check-modules.py            # 모듈마다 "모두 같음" 또는 다른 앱 이름
    python3 tools/check-modules.py --diff     # 다른 앱은 무엇이 다른지 줄로도 보여 줌

앱마다 달라야 하는 것은 비교에서 뺀다: 색(#17766F 같은 것), 게시판 글 번호(webapp/59784),
/* 설명 */ 주석, 줄 앞뒤 빈칸. 그래서 "다름"이면 실제 동작이 다른 것이다.
가장 많은 앱이 쓰는 판을 기준으로 삼고, 기준과 다른 앱만 적는다.
007의 편 판(word-learn-1.html 등)은 split.py가 만든 것이라 함께 보면 통합본과 같아야 한다.
"""
import difflib, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOW_DIFF = '--diff' in sys.argv


def norm(code):
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.S)
    code = re.sub(r'#[0-9A-Fa-f]{3,8}\b', '#색', code)
    code = re.sub(r'(webapp/)\d+', r'\1번호', code)
    lines = [l.strip() for l in code.splitlines()]
    return [l for l in lines if l]


mods = {}   # 모듈 이름 → {파일: 줄 목록}
for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
    for f in sorted(files):
        if not f.endswith('.html'):
            continue
        path = os.path.join(dirpath, f)
        src = open(path, encoding='utf-8', errors='replace').read()
        for name, code in re.findall(r'<script id="([^"]+)">(.*?)</script>', src, flags=re.S):
            mods.setdefault(name, {})[os.path.relpath(path, ROOT)] = norm(code)

bad = 0
for name in sorted(mods):
    byfile = mods[name]
    groups = {}
    for f, lines in byfile.items():
        groups.setdefault('\n'.join(lines), []).append(f)
    ranked = sorted(groups.items(), key=lambda kv: -len(kv[1]))
    if len(ranked) == 1:
        print(f'{name}: 모두 같음 ({len(byfile)}곳)')
        continue
    bad += 1
    base_key, base_files = ranked[0]
    print(f'{name}: 다른 판 {len(ranked) - 1}가지 — 기준({len(base_files)}곳): {", ".join(sorted(base_files))}')
    for key, files in ranked[1:]:
        print(f'  다름: {", ".join(sorted(files))}')
        if SHOW_DIFF:
            for l in difflib.unified_diff(base_key.splitlines(), key.splitlines(), '기준', files[0], n=0, lineterm=''):
                if not l.startswith('@@'):
                    print('    ' + l[:200])
sys.exit(1 if bad else 0)
