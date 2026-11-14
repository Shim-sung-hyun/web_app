#!/usr/bin/env python3
"""버릴 자료 상자 — 지금 안 쓰는 그림·파일을 바로 지우지 않고 _trash/<날짜>/ 에 3개월 두었다가 비운다.

    python3 tools/trash.py 경로 [경로…] --why "이유"   # 옮겨 넣기(git mv). 원래 자리 그대로 _trash/오늘날짜/ 아래로
    python3 tools/trash.py                              # 상자 보기: 날짜 폴더마다 몇 날 지났는지, 비울 때가 된 것
    python3 tools/trash.py --empty                      # 넣은 지 90일이 지난 날짜 폴더를 지움(git rm)

- 날짜 폴더마다 WHY.txt 에 '원래 자리 — 이유'가 한 줄씩 남는다. 되살릴 때는 그 자리로 git mv 하면 된다.
- 앱·도구는 _trash 안을 보지 않는다(check-files·sync-modules·check-modules가 건너뜀). 앱에서 아직 부르는 파일은 넣지 않는다.
- 세션을 시작할 때 한 번 그냥 돌려 보고, 비울 때가 된 것이 있으면 --empty 로 비운 뒤 커밋한다.

버린 도구 보관함(2026-11-14 선생님) — 안 쓰게 된 도구는 tools/attic/ 에 6개월(180일) 두고, 목록 tools/attic/LIST.txt 에는 계속 남긴다.
    python3 tools/trash.py --tool 이름.py --why "이유"   # tools/이름.py → tools/attic/ (목록에 '날짜 · 이름 · 이유' 한 줄)
    python3 tools/trash.py --revive 이름.py              # 다시 살림(tools/ 로 되돌리고 목록에 되살린 날 적음)
  --empty 는 보관 180일이 지난 도구도 지운다. 목록 줄은 남기고 '지움 + 되살릴 커밋'을 적어 두므로, 지운 뒤에도
  git show 커밋:tools/attic/이름.py > tools/이름.py 로 되살릴 수 있다.
"""
import datetime, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOX = os.path.join(ROOT, '_trash')
DAYS = 90
ATTIC = os.path.join(ROOT, 'tools', 'attic'); LIST = os.path.join(ATTIC, 'LIST.txt'); TOOL_DAYS = 180
today = datetime.date.today()


def git(*a):
    subprocess.run(['git', *a], cwd=ROOT, check=True)


def folders():
    out = []
    for d in sorted(os.listdir(BOX)) if os.path.isdir(BOX) else []:
        try:
            out.append((d, (today - datetime.date.fromisoformat(d)).days))
        except ValueError:
            pass
    return out


def attic():
    """목록에서 아직 보관함에 있는 도구: [(줄 번호, 날짜, 이름, 지난 날)]"""
    out = []
    lines = open(LIST, encoding='utf-8').read().splitlines() if os.path.exists(LIST) else []
    for i, ln in enumerate(lines):
        if ln.startswith('#') or ' · 되살림 ' in ln or ' · 지움 ' in ln: continue
        f = [x.strip() for x in ln.split(' · ', 2)]
        if len(f) == 3 and os.path.exists(os.path.join(ATTIC, f[1])):
            try: out.append((i, f[0], f[1], (today - datetime.date.fromisoformat(f[0])).days))
            except ValueError: pass
    return out, lines


def mark(lines, i, note):
    lines[i] += ' · ' + note
    open(LIST, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')


args = sys.argv[1:]
why = ''
if '--why' in args:
    i = args.index('--why'); why = ' '.join(args[i + 1:i + 2]); args = args[:i] + args[i + 2:]
if '--tool' in args:
    names = [a for a in args if a != '--tool']
    if not why: sys.exit('--why "이유" 를 꼭 적어 주세요.')
    os.makedirs(ATTIC, exist_ok=True)
    if not os.path.exists(LIST):
        open(LIST, 'w', encoding='utf-8').write('# 버린 도구 목록 — 날짜 · 이름 · 이유 [· 되살림/지움]. 다시 쓰려면 python3 tools/trash.py --revive 이름\n')
    for n in names:
        n = os.path.basename(n)
        git('mv', os.path.join('tools', n), os.path.join('tools', 'attic', n))
        with open(LIST, 'a', encoding='utf-8') as f: f.write(f'{today.isoformat()} · {n} · {why}\n')
        print('보관함에 넣음:', n)
    print(f'{(today + datetime.timedelta(days=TOOL_DAYS)).isoformat()} 뒤에 --empty 로 지울 수 있어요(목록 줄은 남음).')
    sys.exit()
if '--revive' in args:
    names = [os.path.basename(a) for a in args if a != '--revive']; got, lines = attic()
    for n in names:
        hit = [g for g in got if g[2] == n]
        if not hit: sys.exit(f'보관함에 없어요: {n} (지운 도구는 LIST.txt의 커밋에서 git show 로)')
        git('mv', os.path.join('tools', 'attic', n), os.path.join('tools', n))
        mark(lines, hit[-1][0], f'되살림 {today.isoformat()}'); print('되살림:', n)
    git('add', os.path.relpath(LIST, ROOT)); sys.exit()
if '--empty' in args:
    got, lines = attic()
    head = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    for i, d, n, age in got:
        if age >= TOOL_DAYS:
            git('rm', '-q', os.path.join('tools', 'attic', n))
            mark(lines, i, f'지움 {today.isoformat()} — 되살리기: git show {head}:tools/attic/{n} > tools/{n}'); print('도구 지움:', n)
    if os.path.exists(LIST): git('add', os.path.relpath(LIST, ROOT))
    gone = [d for d, age in folders() if age >= DAYS]
    for d in gone:
        git('rm', '-rq', os.path.join('_trash', d))
        print('비움:', d)
    print('비운 폴더', len(gone))
elif args:
    if not why:
        sys.exit('--why "이유" 를 꼭 적어 주세요.')
    day = os.path.join(BOX, today.isoformat())
    for p in args:
        rel = os.path.relpath(os.path.abspath(p), ROOT)
        if rel.startswith('..') or rel.startswith('_trash'):
            sys.exit('저장소 안의 파일만 넣을 수 있어요: ' + p)
        dst = os.path.join(day, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        git('mv', rel, os.path.relpath(dst, ROOT))
        with open(os.path.join(day, 'WHY.txt'), 'a', encoding='utf-8') as f:
            f.write(f'{rel} — {why}\n')
        print('넣음:', rel, '→', os.path.relpath(dst, ROOT))
    print(f'{(today + datetime.timedelta(days=DAYS)).isoformat()} 뒤에 --empty 로 비울 수 있어요.')
else:
    fs = folders()
    if not fs:
        print('상자가 비었어요.')
    for d, age in fs:
        print(f'{d}  {age}일 지남' + ('  ← 비울 때 됨(--empty)' if age >= DAYS else f'  ({DAYS - age}일 남음)'))
    got, _ = attic()
    if got: print('버린 도구 보관함(tools/attic/):')
    for i, d, n, age in got:
        print(f'  {n}  {d}부터 {age}일' + ('  ← 지울 때 됨(--empty)' if age >= TOOL_DAYS else f'  ({TOOL_DAYS - age}일 남음)'))
