#!/usr/bin/env python3
"""차름 자료 찾기 — 그림·소리를 새로 구하기 전에 꼭 먼저 (2026-11-22)

    python3 tools/find-media.py 컵                 # 낱말로 찾기(비슷한 말·영어 이름까지). 여러 낱말: 컵 의자
    python3 tools/find-media.py 컵 --style 연필    # 그림풍으로 좁히기(연필·만화·사진 …)
    python3 tools/find-media.py --prompt media/prompts/PROMPTS-….txt   # 프롬프트 글의 ■ 항목마다 이미 있는지
    python3 tools/find-media.py --say "잘했어요."  # 이 말의 목소리가 이미 있는지(묶음마다)
    선택: --sheet 그림.jpg  찾은 그림을 번호 붙인 한 장으로(기본: 스크래치 /tmp/charum-find/낱말.jpg) · --no-sheet
          --all  받은 원본(src/·in/)도 · --max 60  한 장에 넣을 수

- 목록은 media/catalog.json(tools/media-index.py가 만듦). 목록이 낡았으면 먼저 알려 줌.
- 결과는 '지금 쓰는 것'과 '보관함(media/archive — 옛 그림풍·다시 받기 전·안 쓰게 된 것)'으로 나눠 보여 줌.
- 그림 모음 한 장(번호 = 목록 번호)을 Read로 열어 눈으로 검토하고 선생님께 보여 드린다. 그림을 하나하나 여는 것보다 훨씬 싸다.
- 찾았는데 그림풍이 다르면 "이런 그림은 있는데 이 앱은 ○○풍이 필요해서 새로 받아요"처럼 까닭을 붙여 말한다.
"""
import hashlib, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = os.path.join(ROOT, 'media')
args = sys.argv[1:]


def opt(name, default=None, flag=False):
    global args
    if name not in args: return default
    i = args.index(name)
    if flag: args = args[:i] + args[i + 1:]; return True
    v = args[i + 1]; args = args[:i] + args[i + 2:]; return v


SAY = opt('--say'); PROMPT = opt('--prompt'); STYLE = opt('--style'); SHEET = opt('--sheet')
NOSHEET = opt('--no-sheet', False, True); ALL = opt('--all', False, True); MAX = int(opt('--max', '60'))
if not (args or SAY or PROMPT):
    print(__doc__); sys.exit()

# 목록이 낡았는지 먼저
chk = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'media-index.py'), '--check'], capture_output=True, text=True)
if chk.returncode:
    print('※ ' + chk.stdout.splitlines()[0] + '\n  → 지금 다시 만듦'); subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'media-index.py')])
cat = json.load(open(os.path.join(M, 'catalog.json'), encoding='utf-8'))['items']
syn = json.load(open(os.path.join(M, 'synonyms.json'), encoding='utf-8'))

# ── 목소리
if SAY:
    h = hashlib.sha1(SAY.encode('utf-8')).hexdigest()[:16]
    print(f'"{SAY}" → 이름 {h}.mp3')
    for e in cat:
        if e['group'] != 'voice': continue
        p = os.path.join(M, e['path'], h + '.mp3')
        print(f"  {'있음' if os.path.exists(p) else '없음'}  {e['path']}  ({e['style']}, {e.get('count', '?')}개)")
    print('  (poem/ 은 sha1("시|줄 번호|줄 글"), 한 글자는 "글자. ○." 속에서 만든 것 — media/voice/README.txt)')
    if not (args or PROMPT): sys.exit()


def expand(q):
    """찾을 말 → 비슷한 말·영어 이름까지"""
    out = {q.lower()}
    for g in syn.get('groups', []):
        if any(q == w or q in w.split() for w in g): out |= {w.lower() for w in g}
    for k, vs in syn.get('en', {}).items():
        if any(q == v or q in v.split() for v in vs): out.add(k.lower())
    return out


def hit(e, terms):
    if not ALL and ('/src/' in e['path'] or '/in/' in e['path']): return False
    if STYLE and STYLE not in e.get('style', ''): return False
    if e['group'] == 'voice': return False
    names = [n.lower() for n in e['names']]
    base = os.path.splitext(os.path.basename(e['path']))[0].lower()
    for t in terms:
        if re.search('[가-힣]', t):
            if any(t == n or t in n.split() or (len(t) >= 2 and t in n) for n in names): return True
        elif len(t) >= 3 and (t == base or re.split(r'[-_]', base)[0] == t or t in names): return True
    return False


def find(q):
    terms = expand(q)
    return [e for e in cat if hit(e, terms)]


def show(found, label):
    now = [e for e in found if not e.get('archived')]; old = [e for e in found if e.get('archived')]
    print(f'■ {label} — 지금 쓰는 것 {len(now)} · 보관함 {len(old)}')
    for i, e in enumerate(now + old, 1):
        if i > 40: print(f'  … {len(found) - 40}개 더'); break
        tag = '보관 ' if e.get('archived') else ''
        ub = ','.join(e.get('used_by', [])) or '-'
        print(f"  {i:>2}. {tag}{e['path']}  [{e.get('style', '')}] {'/'.join(e['names'][:3])}  쓰는 앱 {ub}")
    return now + old


def sheet(found, out):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print('  (그림 모음은 Pillow가 있어야 — pip install Pillow)'); return
    imgs = [e for e in found if re.search(r'\.(webp|jpe?g|png|gif)$', e['path'], re.I)][:MAX]
    if not imgs: return
    T, C = 150, 8
    rows = (len(imgs) + C - 1) // C
    S = Image.new('RGB', (C * T, rows * (T + 18)), 'white'); D = ImageDraw.Draw(S)
    fp = next((os.path.join(M, 'fonts', f) for f in sorted(os.listdir(os.path.join(M, 'fonts'))) if re.search(r'\.(ttf|otf|woff2?)$', f, re.I)), None)
    try: FN = ImageFont.truetype(fp, 13) if fp else None
    except Exception: FN = None
    for i, e in enumerate(imgs):
        try:
            im = Image.open(os.path.join(M, e['path'])); im.thumbnail((T - 6, T - 6))
            bg = Image.new('RGB', im.size, (235, 235, 235) if e.get('archived') else 'white')
            bg.paste(im, mask=im.convert('RGBA').split()[3]); im = bg
        except Exception:
            continue
        x, y = (i % C) * T, (i // C) * (T + 18)
        S.paste(im, (x + (T - im.width) // 2, y + (T - im.height) // 2))
        D.text((x + 3, y + T + 2), f"{found.index(e) + 1}{' 보관' if e.get('archived') else ''}", fill=(200, 0, 0), font=FN)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    S.save(out, quality=82)
    print(f'  그림 모음: {out}  ({len(imgs)}장, 번호 = 위 목록 번호, 회색 바탕 = 보관함)')


def outname(tag):
    return SHEET or os.path.join('/tmp/charum-find', re.sub(r'[^\w가-힣-]+', '_', tag)[:40] + '.jpg')


if PROMPT:
    txt = open(PROMPT, encoding='utf-8').read()
    items = []
    for ln in txt.splitlines():
        m = re.match(r'\s*■\s*(?:\d+\s*)?([^(（]+?)\s*(?:[(（]([^)）]*)[)）])?\s*$', ln)
        if not m: continue
        ko = m.group(1).strip(); en = (m.group(2) or '').split('·')[0].strip()
        en = os.path.splitext(en.split()[0])[0] if en else ''
        items.append((ko, en))
    print(f'프롬프트 {os.path.basename(PROMPT)} — 항목 {len(items)}개를 목록과 맞춰 봄')
    have = 0; allfound = []
    for ko, en in items:
        f = find(ko)
        if not f and ' ' in ko: f = find(ko.split()[-1])   # '잠긴 큰 통나무' → '통나무'
        if en: f += [e for e in find(en) if e not in f]
        now = [e for e in f if not e.get('archived')]
        have += bool(f)
        print(f"  {'있음' if now else '보관함에만' if f else '없음':<6} {ko}{' (' + en + ')' if en else ''}"
              + (f" — {len(now)}장: " + ', '.join(f"{e['path']}[{e.get('style', '')}]" for e in now[:3]) if now else '')
              + (f" · 보관 {len(f) - len(now)}" if len(f) > len(now) else ''))
        allfound += [e for e in f if e not in allfound]
    print(f'→ {len(items)}개 중 {have}개는 비슷한 그림이 이미 있음. 그림풍·모양이 맞는지 그림 모음으로 보고, 맞으면 그 항목은 받지 않는다.')
    if not NOSHEET and allfound: sheet(allfound, outname('prompt-' + os.path.basename(PROMPT)))
    if not args: sys.exit()

for q in args:
    found = show(find(q), q)
    if found and not NOSHEET: sheet(found, outname(q))
    if not found: print('  없음 — 새로 구해도 됨(비슷한 말이 있으면 media/synonyms.json groups에 더하기)')
