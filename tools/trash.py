#!/usr/bin/env python3
"""버릴 자료 상자 — 지금 안 쓰는 그림·파일을 바로 지우지 않고 _trash/<날짜>/ 에 3개월 두었다가 비운다.

    python3 tools/trash.py 경로 [경로…] --why "이유"   # 옮겨 넣기(git mv). 원래 자리 그대로 _trash/오늘날짜/ 아래로
    python3 tools/trash.py                              # 상자 보기: 날짜 폴더마다 몇 날 지났는지, 비울 때가 된 것
    python3 tools/trash.py --empty                      # 넣은 지 90일이 지난 날짜 폴더를 지움(git rm)

- 날짜 폴더마다 WHY.txt 에 '원래 자리 — 이유'가 한 줄씩 남는다. 되살릴 때는 그 자리로 git mv 하면 된다.
- 앱·도구는 _trash 안을 보지 않는다(check-files·sync-modules·check-modules가 건너뜀). 앱에서 아직 부르는 파일은 넣지 않는다.
- 세션을 시작할 때 한 번 그냥 돌려 보고, 비울 때가 된 것이 있으면 --empty 로 비운 뒤 커밋한다.
"""
import datetime, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOX = os.path.join(ROOT, '_trash')
DAYS = 90
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


args = sys.argv[1:]
if '--empty' in args:
    gone = [d for d, age in folders() if age >= DAYS]
    for d in gone:
        git('rm', '-rq', os.path.join('_trash', d))
        print('비움:', d)
    print('비운 폴더', len(gone))
elif args:
    why = ''
    if '--why' in args:
        i = args.index('--why'); why = ' '.join(args[i + 1:i + 2]); args = args[:i] + args[i + 2:]
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
