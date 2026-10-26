# [차름 국어] 낱말 익히기 — 편마다 나눈 판 만들기 (2026-10-23, 저장소로 옮김 2026-10-26)
# 통합본 007/word-learn.html 을 읽어 공개한 편(OPEN_BOOKS)마다
#   007/word-learn-N.html     그 편만 보이는 판(ONLY_BOOK = N, 저장 칸은 통합본과 같음)
#   007/server-loader-N.html  내 도메인 study/007/word-learn-N.html 로 올릴 불러오기 파일
# 을 만든다. 쓰는 법: 저장소 맨 위에서  python3 007/tools/split.py
# 통합본 word-learn.html 이 원본이다. 편 판은 손으로 고치지 않는다.
import re, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/'
s = open(D + 'word-learn.html', encoding='utf-8').read()
names = dict(re.findall(r"(\d):'([^']+)'", re.search(r"const PNAMES = \{(.*?)\};", s).group(1)))
opened = [int(x) for x in re.search(r"const OPEN_BOOKS = \[([\d, ]*)\]", s).group(1).split(',') if x.strip()]
loader = open(D + 'server-loader.html', encoding='utf-8').read()
def R(t, a, b):
    assert t.count(a) == 1, a; return t.replace(a, b)
for n in opened:
    full = f'[차름 국어] 낱말 익히기 {n}편 · {names[str(n)]}'
    t = R(s, 'const ONLY_BOOK = 0;', f'const ONLY_BOOK = {n};')
    t = R(t, '<title>[차름 국어] 낱말 익히기</title>', f'<title>{full}</title>')
    t = R(t, '<h1><small class="kick">차름 국어</small>낱말 익히기</h1>', f'<h1><small class="kick">차름 국어</small>낱말 익히기<small class="ed">{n}편 · {names[str(n)]}</small></h1>')
    open(D + f'word-learn-{n}.html', 'w', encoding='utf-8').write(t)
    l = R(loader, "007/word-learn.html'", f"007/word-learn-{n}.html'")
    l = R(l, '<title>[차름 국어] 낱말 익히기</title>', f'<title>{full}</title>')
    open(D + f'server-loader-{n}.html', 'w', encoding='utf-8').write(l)
    print('ok', n, full)
