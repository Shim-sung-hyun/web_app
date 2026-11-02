#!/usr/bin/env python3
"""목소리 넣기 — media/voice/voice-maker.html 에서 받은 zip을 소리 모음에 넣는다.

    python3 tools/voice-add.py 받은파일.zip            # 넣기
    python3 tools/voice-add.py 받은파일.zip --dry      # 무엇을 넣을지 보기만

하는 일
  1. zip 안의 <이름>.wav 를 mp3(24kHz·한 채널·64k)로 바꿔 media/voice/<묶음>/<이름>.mp3 로 넣음
     (이름 = 문장 SHA-1 앞 16자리 — voice-meta.json의 문장으로 다시 맞춰 봄, 틀리면 넣지 않음)
  2. 한 글자 이름("개." 등)은 "글자. 개." 로 만든 소리라 마지막 마디만 잘라 넣음
  3. 앞뒤 조용한 곳을 다듬지는 않음(앱의 cleanF가 재생할 때 다듬음)
  4. media/voice/<묶음>/index.json 의 files·used_by 에 더함(이미 있으면 used_by에 앱만 더함)
Azure로 만든 소리는 azure-로 시작하는 묶음(예: azure-sunhi-0.92)에만, Google 소리는 leda- 묶음에만 넣는다(목소리를 섞지 않음).
"""
import hashlib, io, json, os, re, subprocess, sys, tempfile, zipfile
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


def sha16(t):
    return hashlib.sha1(t.encode()).hexdigest()[:16]


def wav_to_f32(data):
    r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', '-', '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'],
                       input=data, capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32)


def last_phrase(x, rate=24000):
    """'글자. 개.' 에서 마지막 마디: 0.15초 넘는 마지막 조용한 틈 뒤부터"""
    W = rate // 100
    e = np.array([np.sqrt((x[i * W:(i + 1) * W] ** 2).mean()) for i in range(len(x) // W)])
    th = e.max() * .03
    loud = np.where(e > th)[0]
    if not len(loud):
        return x
    end = loud[-1]
    gap_start = None
    i = end
    while i > 0:
        if e[i] <= th:
            j = i
            while j > 0 and e[j] <= th:
                j -= 1
            if i - j >= 15:
                gap_start = i
                break
            i = j
        else:
            i -= 1
    if gap_start is None:
        return x
    return x[max(0, (gap_start - 4) * W):]


def to_mp3(x, path):
    with tempfile.NamedTemporaryFile(suffix='.raw', delete=False) as f:
        f.write(x.astype(np.float32).tobytes())
        tmp = f.name
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', '24000', '-ac', '1', '-i', tmp,
                    '-c:a', 'libmp3lame', '-b:a', '64k', path], check=True)
    os.remove(tmp)


def add_to_index(idx_path, names, app):
    """index.json을 줄 단위로 고침(나머지 줄과 순서는 그대로 — 큰 diff가 나지 않게)"""
    s = open(idx_path, encoding='utf-8').read()
    d = json.loads(s)
    for h in names:
        if h not in d['files']:
            s = s.replace('"files": [\n', '"files": [\n"%s",\n' % h, 1)
        users = d.get('used_by', {}).get(h)
        if users is None:
            m = re.search(r'"used_by": \{\n', s)
            s = s[:m.end()] + '"%s": ["%s"],\n' % (h, app) + s[m.end():]
        elif app not in users:
            new = sorted(set(users + [app]))
            s = re.sub(r'"%s": \[[^\]]*\]' % h, '"%s": %s' % (h, json.dumps(new)), s, count=1)
    json.loads(s)   # 깨지지 않았는지
    open(idx_path, 'w', encoding='utf-8').write(s)


def main():
    args = sys.argv[1:]
    dry = '--dry' in args
    pack = None
    if '--pack' in args:
        i = args.index('--pack'); pack = args[i + 1]; del args[i:i + 2]
    args = [a for a in args if not a.startswith('--')]
    if not args:
        print(__doc__); return 1
    z = zipfile.ZipFile(args[0])
    meta = json.loads(z.read('voice-meta.json'))
    pack = pack or meta['pack']
    if (meta.get('service') == 'azure') != pack.startswith('azure-'):
        print('서비스(%s)와 묶음(%s)이 맞지 않습니다 — 한 묶음에 다른 목소리를 섞지 않습니다.' % (meta.get('service'), pack)); return 1
    app = meta.get('app') or '???'
    d = os.path.join(ROOT, 'media', 'voice', pack)
    os.makedirs(d, exist_ok=True)
    idx = os.path.join(d, 'index.json')
    if not os.path.exists(idx):
        open(idx, 'w', encoding='utf-8').write('{\n"voice": "%s",\n"files": [\n],\n"used_by": {\n}\n}\n' % meta.get('voice', ''))
    done = []
    for L in meta['lines']:
        t, h = L['t'], L['h']
        if sha16(t) != h:
            print('이름이 맞지 않아 건너뜀:', t); continue
        x = wav_to_f32(z.read(h + '.wav'))
        if L.get('oneSyl'):
            x = last_phrase(x)
        print(('(보기만) ' if dry else '') + '%s  %.2f초  %s' % (h, len(x) / 24000, t))
        if not dry:
            to_mp3(x, os.path.join(d, h + '.mp3'))
            done.append(h)
    if done:
        add_to_index(idx, done, app)
    print('넣음 %d개 → media/voice/%s (앱 %s)' % (len(done), pack, app))
    return 0


if __name__ == '__main__':
    sys.exit(main())
