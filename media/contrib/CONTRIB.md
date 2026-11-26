# 선생님들이 보낸 자료 정리 절차 (Claude가 따름) — 2026-11-26

차름 자료실(`media/library.html`)의 **자료 보내기**로 다른 선생님이 그림·소리를 보내면 이렇게 돈다.

1. 보낸 자료는 charum.org 서버 `donate-data/m_*.json`에 쌓인다(`server/charum-api/donate.php`의 `give-media`).
   받을 때 서버가 보는 것: 파일 속 종류(png·webp·jpg·mp3만), 크기(그림 3MB·소리 1MB), 확인 세 칸(권리·CC BY-NC 나눔·개인 정보 없음), 하루 30개.
2. 제작자가 기증 화면(`https://www.charum.org/charum-api/donate-admin.php`)의 **새로 온 자료**에서 보고 듣고 고른다
   → **고른 것 보내기** → 비공개 저장소 `Shim-sung-hyun/charum-inbox`의 `inbox-media/<sid>/`(`file.확장자` · `meta.json`).
3. 제작자가 "자료 정리해 줘"라고 하면 Claude가:
   - `inbox-media/`의 자료마다 **직접 보고(그림은 Read, 소리는 길이·크기·문장 확인)** 아래 검토를 한다.
   - **문제 없음** → 다듬어서(아래) `media/contrib/<종류 폴더>/<이름>.<확장자>`에 넣고 `media/contrib/list.json`에 한 줄 → `python3 tools/media-index.py` → 자료실에 저절로 나옴. inbox-media에서 지운다.
   - **걸림** → 넣지 않고 제작자에게 까닭을 말한다(사진처럼 다시 볼 자료 칸은 아직 없음 — 늘면 만든다).
   - 처리한 것은 `inbox-media/log.json`에 한 줄씩(sid → 넣은 파일 또는 "뺌", 날짜, 까닭).

## 검토 (하나라도 걸리면 넣지 않음)
| 볼 것 | 걸리는 경우 |
|---|---|
| 저작권 | 유명 캐릭터·상표·로고, 남의 그림·책 그림을 찍거나 베낀 것, 워터마크·서명이 남의 것 |
| 초상권·개인 정보 | 사람 얼굴·몸(알아볼 수 있으면), 이름표·전화번호·차 번호판·학교 이름 |
| 학생 작품 | 학생이 그린 그림·글씨(동의를 확인할 수 없음) |
| 알맞음 | 무섭거나 훼손된 꼴, 폭력·혐오, 수업에 맞지 않는 것(지침 4절) |
| 소리 | 사람 이름·개인 정보를 말함, 문장과 소리가 다름, 잡음이 심함. ElevenLabs 무료 요금제 소리면 출처 "elevenlabs.io"를 style에 |

## 다듬기 (도구 창고 `tools/README.txt`의 도구로)
- 흰 바탕 그림 → 투명: 연필풍은 `bing-cut.py`·`defringe.py`, 굵은 윤곽선 만화풍은 `clean-edges.py`. Gemini 로고는 `gemini-logo.py`.
- 크기: 긴 쪽 1024 넘으면 줄이고 webp로(`webp-slim.py`). 배경은 jpg 그대로 둬도 됨.
- 소리: 그대로(mp3). 앞뒤 긴 조용함만 다듬어도 됨.

## media/contrib/list.json 한 줄
```json
{"file": "pics/칫솔.webp", "names": ["칫솔", "toothbrush"], "kind": "그림", "style": "연필풍", "by": "김○○ 선생님", "made": "AI", "tool": "빙", "say": "", "added": "2026-11-26", "sid": "m2611…"}
```
- `by`는 보낸 분이 **자료실에 이름 표시**를 고른 때만(meta.json의 `showBy`가 true). 아니면 `""`.
- 이름은 한글 낱말을 먼저, 찾기 좋게 비슷한 말·영어도. 파일 이름은 한글이어도 됨.
- 소리는 `kind: "소리"`, `say`에 읽는 문장 — 자료실 '목소리' 탭의 "선생님들이 보낸 소리"에 나옴.
