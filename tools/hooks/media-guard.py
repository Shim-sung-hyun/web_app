#!/usr/bin/env python3
"""자료 지킴이 hook(2026-11-22) — Claude Code가 저절로 부름(.claude/settings.json). 사람이 돌릴 일은 없음.

  SessionStart  : 자료 목록(media/catalog.json)이 낡았으면 알림 + "그림·소리는 find-media 먼저" 한 줄
  PostToolUse   : media/prompts/*.txt 를 쓰거나 고치면 find-media.py --prompt 를 돌려, 이미 있는 그림을 Claude에게 바로 보여 줌
결과는 Claude가 읽는 글(additionalContext)로만 나가고, 파일은 바꾸지 않는다. 실패해도 일을 막지 않는다(끝 상태 0).
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def say(event, text):
    print(json.dumps({'hookSpecificOutput': {'hookEventName': event, 'additionalContext': text}}, ensure_ascii=False))


def run(*a):
    r = subprocess.run([sys.executable, *a], cwd=ROOT, capture_output=True, text=True, timeout=90)
    return (r.stdout + r.stderr).strip(), r.returncode


try:
    data = json.load(sys.stdin)
except Exception:
    data = {}
ev = data.get('hook_event_name', '')
try:
    if ev == 'SessionStart':
        out, rc = run('tools/media-index.py', '--check')
        msg = '[자료 지킴이] 그림·사진·소리를 새로 구하자고 하거나 프롬프트를 쓰기 전에 python3 tools/find-media.py 낱말 (프롬프트는 --prompt 파일)부터 — 그림 모음을 Read로 보고 선생님께 보여 드림. 버릴 그림·소리는 tools/trash.py(저절로 media/archive 보관함).'
        if rc: msg += '\n' + out + ' → 지금 python3 tools/media-index.py 를 돌리고 커밋.'
        say('SessionStart', msg)
    elif ev == 'PostToolUse':
        fp = (data.get('tool_input') or {}).get('file_path', '')
        rel = os.path.relpath(fp, ROOT) if fp else ''
        if rel.startswith('media/prompts/') and rel.endswith('.txt'):
            out, rc = run('tools/find-media.py', '--prompt', rel)
            say('PostToolUse', '[자료 지킴이] 프롬프트 글의 항목을 자료 목록과 맞춰 봤어요. "있음" 항목은 그림 모음을 Read로 열어 그림풍·모양을 보고, 맞으면 프롬프트에서 빼거나 선생님께 "이미 있어요"라고 알려 드릴 것. 다르면 까닭(예: 연필풍이 필요)을 붙여 말할 것.\n' + out[-3500:])
except Exception as e:
    pass
sys.exit(0)
