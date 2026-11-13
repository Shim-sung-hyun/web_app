#!/usr/bin/env python3
"""받은 빙 연필풍 그림을 무대 베타에 한 번에 넣기(2026-11-13, 선생님: 숲을 한 번에 바꾸기 — 초원·사막·북극에서 손으로 하던 순서를 한 줄로)

    python3 tools/stage-intake.py nature/new-forest 받은폴더          # 넣기
    python3 tools/stage-intake.py nature/new-forest 받은폴더 --dry    # 무엇을 할지만 보여 줌(아무것도 안 바꿈)

받은폴더 안 파일 이름(확장자는 jpg·jpeg·png·webp 아무거나):
    bg.jpg                 배경 — 가운데를 4:3으로 잘라 1200×900
    종류-번호.jpg          소품(예: oak-1.jpg) — 종류는 그 무대 intake.json의 kinds. 그림자는 파랑(#0000FF)으로 받은 것
    동물파일이름.jpg       동물(예: saseum.jpg) — intake.json의 animals[].file

하는 일(무대 폴더 media/stage-beta/<곳>/, 설정 intake.json):
  0) 처음 한 번(stage.json에 "pencil": true가 없을 때, 배경을 받았을 때만): 옛 그림(items/·bg·standard)을 버릴 자료 상자로(tools/trash.py), stage.json을 intake.json으로 새로 짬
  1) 배경: 4:3 가운데 자르기 → bg.jpg
  2) 소품: flat-shadow.py --key blue [--plant] → defringe.py [--plant] → items/종류-번호.webp, stage.json items에 적음
     (plant·big·scalefree·baseMatch·ground는 intake.json kinds — softKinds·scalefree·compose.baseMatch가 받은 종류로 채워짐)
  3) 동물: bing-cut.py --animal → defringe.py --depth 3 → defringe.py --rim → 1024칸에 긴 쪽 91% 가운데 → media/animals/이름.webp
     (같은 이름의 옛 그림은 버릴 자료 상자로 — 008·009가 함께 바뀜). stage.json animals는 그림이 있는 동물만(hide: false는 숨기기에 안 씀)
  4) stage-beta/index.json 목록, stage-meta.py(밑동), stage-index.py(가림 목록), props-index.py(동물 모양 표)
끝에 모자란 것(2장이 안 되는 종류·안 받은 동물·모르는 파일)을 알려 줌. 받은폴더의 원본은 건드리지 않음(다 넣은 뒤 지우면 됨).
넣은 뒤: 숨기기 시험 media/stage/hide-test.html?place=<곳> 으로 보고, 지평선(horizon·groundTop)이 배경과 맞는지 확인.
"""
import glob, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT = ('.jpg', '.jpeg', '.png', '.webp')


def run(*a):
    r = subprocess.run([sys.executable] + list(a), cwd=ROOT, capture_output=True, text=True)
    if r.returncode: sys.exit('멈춤: %s\n%s' % (' '.join(a), (r.stderr or r.stdout)[-800:]))
    return r.stdout


def tool(name): return os.path.join('tools', name)


def trash(paths, why):
    paths = [p for p in paths if os.path.exists(os.path.join(ROOT, p))]
    if paths: run(tool('trash.py'), *paths, '--why', why)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; dry = '--dry' in sys.argv
    if len(args) != 2: sys.exit(__doc__)
    place, src = args[0], os.path.abspath(args[1])
    rel = os.path.join('media', 'stage-beta', place); pdir = os.path.join(ROOT, rel)
    spec = json.load(open(os.path.join(pdir, 'intake.json'), encoding='utf-8'))
    sj = os.path.join(pdir, 'stage.json'); st = json.load(open(sj, encoding='utf-8'))
    kinds, animals = spec['kinds'], {a['file']: a for a in spec['animals']}

    bg, props, anis, unknown = None, [], [], []
    for f in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(f)
        if ext.lower() not in EXT or os.path.isdir(os.path.join(src, f)): continue
        m = re.fullmatch(r'(.+)-(\d+)', stem)
        if stem == 'bg': bg = f
        elif m and m.group(1) in kinds: props.append((f, m.group(1), int(m.group(2))))
        elif stem in animals: anis.append((f, stem))
        else: unknown.append(f)
    print('받은 것: 배경 %s · 소품 %d장 · 동물 %d마리' % ('있음' if bg else '없음', len(props), len(anis)))
    if unknown: print('모르는 파일(이름을 확인해 주세요):', ', '.join(unknown))

    fresh = not st.get('pencil')
    if fresh and not bg: sys.exit('이 무대는 아직 옛 그림입니다 — 배경(bg.jpg)을 함께 받아야 새로 짭니다.')
    if dry:
        if fresh: print('처음: 옛 그림 %d개를 버릴 자료 상자로, stage.json 새로 짬' % len(glob.glob(os.path.join(pdir, 'items', '*'))))
        for f, k, n in props: print('  소품', f, '→ items/%s-%d.webp' % (k, n), '(%s)' % kinds[k]['name'])
        for f, a in anis: print('  동물', f, '→ media/animals/%s.webp' % a, '(%s)' % animals[a]['name'])
        return report(spec, st if not fresh else {'items': {}}, props, anis)

    from PIL import Image
    if fresh:
        old = [os.path.join(rel, 'items', os.path.basename(p)) for p in glob.glob(os.path.join(pdir, 'items', '*'))]
        old += [os.path.join(rel, f) for f in ('bg.jpg', 'standard.jpg')]
        trash(old, '%s를 빙 연필풍으로 다시 만듦 — 옛 만화풍 배경·소품' % spec['name'])
        gt = spec['groundTop']
        st = {'name': spec['name'], 'view': 'ground', 'horizon': spec['horizon'], 'groundTop': gt, 'unit': spec.get('unit', .2), 'avoid': [],
              'beds': {'ground': {'name': '땅', 'y': [gt, 1], 'persp': True, 'skirt': []}}, 'noSkirt': True, 'blocks': spec['blocks'], 'animals': [],
              'compose': dict(spec['compose']), 'items': {}, 'skirtMeta': {}, 'scalefree': [], 'groundTol': spec.get('groundTol', 100), 'softKinds': [], 'pencil': True}
        json.dump(st, open(sj, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)   # 가운데서 멈춰도 다시 돌리면 이어 감
    os.makedirs(os.path.join(pdir, 'items'), exist_ok=True)

    if bg:   # 1) 배경
        im = Image.open(os.path.join(src, bg)).convert('RGB'); w, h = im.size
        if w * 3 > h * 4: c = (w - h * 4 // 3) // 2; im = im.crop((c, 0, c + h * 4 // 3, h))
        elif w * 3 < h * 4: c = (h - w * 3 // 4) // 2; im = im.crop((0, c, w, c + w * 3 // 4))
        im.resize((1200, 900), Image.LANCZOS).save(os.path.join(pdir, 'bg.jpg'), quality=90); print('배경 → bg.jpg (%d×%d에서)' % (w, h))

    for f, k, n in props:   # 2) 소품
        K = kinds[k]; name = '%s-%d' % (k, n); out = os.path.join(rel, 'items', name + '.webp'); pl = ['--plant'] if K.get('plant') else []
        run(tool('flat-shadow.py'), os.path.join(src, f), out, '--key', K.get('key', 'blue'), *pl)
        run(tool('defringe.py'), out, *pl)
        it = {'name': K['name'], 'real': K['real'], 'bed': 'ground', 'kind': k, 'kindName': K['name'], 'flip': False, 'ownShadow': True}
        if K.get('big'): it['role'] = 'big'
        if K.get('ground'): it['ground'] = K['ground']
        st['items'][name] = it; print('소품 →', name)

    for f, a in anis:   # 3) 동물
        dst = os.path.join('media', 'animals', a + '.webp'); tmp = os.path.join(pdir, '_tmp-animal.webp')
        run(tool('bing-cut.py'), os.path.join(src, f), tmp, '--animal'); run(tool('defringe.py'), tmp, '--depth', '3'); run(tool('defringe.py'), tmp, '--rim')
        im = Image.open(tmp).convert('RGBA'); im = im.crop(im.getbbox()); s = 1024 * .91 / max(im.size)
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        sq = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)); sq.paste(im, ((1024 - im.width) // 2, (1024 - im.height) // 2)); os.remove(tmp)
        trash([dst], '%s 그림을 빙 연필풍으로 다시 받음' % animals[a]['name'])
        sq.save(os.path.join(ROOT, dst), quality=92, method=6); print('동물 →', dst)

    # 받은 것에 맞춰 목록들
    have = sorted({v['kind'] for v in st['items'].values()})
    st['softKinds'] = [k for k in have if kinds.get(k, {}).get('plant')]
    st['scalefree'] = [k for k in have if kinds.get(k, {}).get('scalefree')]
    st['compose']['baseMatch'] = [k for k in have if kinds.get(k, {}).get('baseMatch')]
    st['animals'] = []
    for a in spec['animals']:
        if not a.get('hide', True): continue
        srcs = ['animals/%s.webp' % a['file']] + ([a['fallback']] if a.get('fallback') else [])
        got = next((s for s in srcs if os.path.exists(os.path.join(ROOT, 'media', s))), None)
        if got: st['animals'].append({'name': a['name'], 'src': got, 'real': a['real'], 'face': a.get('face', 'L')})
    open(sj, "w", encoding="utf-8").write(json.dumps(st, ensure_ascii=False, indent=1) + "\n")

    ix = os.path.join(ROOT, 'media', 'stage-beta', 'index.json'); I = json.load(open(ix, encoding='utf-8'))
    I.setdefault(place, {'name': spec['name'], 'group': place.split('/')[0], 'view': 'ground', 'bg': ['bg'], 'used_by': [], 'ready': False, 'far': [], 'front': [], 'missing': [], 'skirt': []})
    I[place]['items'] = list(st['items']); json.dump(I, open(ix, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    run(tool('stage-meta.py')); run(tool('stage-index.py'))
    if anis: run(tool('props-index.py'))
    report(spec, st, [], [])
    print('다음: 숨기기 시험 media/stage/hide-test.html?place=%s · 지평선이 배경과 맞는지 · README 기록 · 커밋' % place)


def report(spec, st, props, anis):
    n = {}
    for v in st.get('items', {}).values(): n[v['kind']] = n.get(v['kind'], 0) + 1
    for _, k, _ in props: n[k] = n.get(k, 0) + 1
    lack = ['%s(%s) %d장' % (K['name'], k, n.get(k, 0)) for k, K in spec['kinds'].items() if n.get(k, 0) < 2]
    got = {a for _, a in anis}
    noani = [a['name'] for a in spec['animals'] if a['file'] not in got and not os.path.exists(os.path.join(ROOT, 'media', 'animals', a['file'] + '.webp'))]
    print('소품 %d종류 %d장.' % (len(n), sum(n.values())), '2장이 안 되는 종류: ' + (', '.join(lack) if lack else '없음'))
    if noani: print('그림이 없는 동물:', ', '.join(noani))


if __name__ == '__main__': main()
