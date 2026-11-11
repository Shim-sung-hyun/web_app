# 차름 웹앱 — Claude가 먼저 읽는 글

발달장애 학생용 학습 웹앱 시리즈 **차름**의 저장소다. 모든 결정의 기준은 **`docs/guidelines.md`**(프로젝트 지침 요약)이다. 일을 시작하기 전에 그 글을 읽고, 고칠 앱의 `NNN/README.txt`도 읽는다. 이 파일에는 저장소에서 일할 때만 필요한 것을 적는다.

## 꼭 지킬 것
- 답은 한국어. 이 프로젝트의 선생님은 전문 개발자가 아니다 — 쉬운 말로, 보고는 짧게(바꾼 것 + 교육학·심리학 점검).
- "답만" 하라고 하면 파일을 바꾸지 않는다. 이상하면 멈춰서 묻는다. 큰 수정은 고칠 목록을 먼저 보여 주고 확인받는다.
- **비밀**: API 키·`$REVIEW_TOKEN`·`$ADMIN_TOKEN`·GitHub 토큰을 코드·저장소·대화에 넣지 않는다. `server/charum-api/donate-config.php`는 서버에만 있다(저장소에는 `.sample`만).
- 사용량이 넉넉하지 않다. 큰 파일은 필요한 부분만 읽고(Grep으로 자리를 찾은 뒤 offset/limit), 확인도 고친 부분만.

## Copilot과 함께 (2026-11-09)
- 선생님은 VS Code의 GitHub Copilot도 쓴다. **주 조정자는 Claude**다. Copilot은 `.github/copilot-instructions.md`를 읽고 같은 규칙(이 파일·지침·README 기록)을 따른다.
- 규칙을 바꾸면 이 파일과 `.github/copilot-instructions.md`를 함께 맞춘다(무대 등 지금 하는 일 요약도 그 파일 끝을 고쳐 둔다).
- 세션을 시작하면 `git log`로 Copilot(선생님 컴퓨터)이 올린 커밋이 있는지 보고, 그 앱 README에 남긴 기록을 읽고 이어 간다.
- **총괄 세션**(2026-11-11): Claude 세션 가운데 하나가 총괄을 맡는다 — 여러 앱에 걸친 일(공통 모듈·공용 자료·지침·README 정리·전체 점검)은 총괄이, 앱 하나의 일은 그 앱 세션이. 총괄이 할 일은 `docs/guidelines.md` 맨 끝 "총괄 할 일".

## 저장소 지도
- `NNN/` 앱 하나씩(001~010). `앱.html`이 앱, `앱_manual.html`이 게시판 본문, `앱_guide.html`이 자세한 설명, `앱01.jpg~`가 캡처, `README.txt`가 그 앱의 세부.
- `media/` 여러 앱이 함께 쓰는 자료는 모두 여기 한곳에(사진 `photos/`, 목소리 `voice/`, 낱말 그림 `words/`, 놀이 그림 `play/`, 동물 `animals/`, 서식지 `habitats/`, 무대 `stage/`, 글꼴 `fonts/` — 지도는 `media/README.txt`). 앱 폴더에는 그 앱의 html·캡처·설명서만 두고, 그림·소리는 media/에서 GitHub 절대 주소로 가져다 쓴다.
- `common/` 공통 모듈 원본(`roster.js` 학생 명단, `keyRelay.js` 휴대폰으로 키 받기, `photoRelay.js` 휴대폰에서 사진 받기, `stagekit.js` 무대, `adminHold.js`·`adminGate.js`·`holdBubble.js` 관리 버튼). 고친 뒤 `python3 tools/sync-modules.py`로 앱마다 넣는다. 앱 안의 모듈 칸은 손으로 고치지 않는다.
- `server/` charum.org 서버에 올리는 파일의 원본(토큰 칸은 비움). `relay/` 사진 다리.
- `교과-과학/` 과학 교과서·지도서 정리(기본교육과정: 초5, 중·고 과학② Ⅲ단원 / 공통교육과정: 초3-1 2단원). 폴더 이름으로 기본/공통교육과정을 나눈다. 앱 내용을 교과와 맞출 때 `README.md` 색인부터 본다.
- `media/stage/` 무대(빈 배경·요소를 장소별로, 차림표 `index.json`, 모듈 `common/stagekit.js`). `_trash/` 버릴 자료 상자(3개월 뒤 비움, `tools/trash.py`) — 세션 시작 때 `python3 tools/trash.py`로 비울 때가 됐는지 본다.
- `docs/` 지침. `guidelines.md`가 기준, `guidelines-full.md`는 앱마다의 자세한 사정·저장 칸·기록 꼴(필요한 절만 찾아 읽음).

## 007 낱말 익히기 만드는 법
통합본 `007/word-learn.html`이 원본이다. 고친 뒤 `python3 007/tools/split.py`를 돌리면 공개한 편(`OPEN_BOOKS`)마다 `word-learn-N.html`과 `server-loader-N.html`이 다시 만들어진다. 편 판은 손으로 고치지 않는다.

## 올리기
1. 올리기 전 `git fetch` → `git merge --ff-only origin/main`.
2. 같은 앱을 다른 세션이 고치고 있으면 기다린다.
3. 커밋 메시지는 한국어로 무엇을 왜 바꿨는지.
4. 화면이 바뀌면 캡처와 설명서도 함께 올린다.
5. 일이 다 끝나면 묻지 않고 `main`에 합쳐 올린다(작업 브랜치에 먼저 올린 뒤 `main`으로 fast-forward). **선생님이 따로 말하지 않으면 베타를 만들지 않고 정식판에 바로 적용한다**(2026-11-04, 비영리라서). 이미 있는 베타(`-beta.html`)는 그대로 두고, 베타를 정식판에 합치기 전에는 선생님께 묻는다.
6. **일을 마칠 때마다 그 앱의 `README.txt`에 정한 것과 다음 할 일을 짧게 고쳐 적는다**(덧붙이기보다 해당 줄을 고쳐 씀). 다음 세션은 지난 대화를 모르고 README만 읽고 이어 가기 때문이다. 여러 앱에 걸친 일이면 `docs/guidelines.md`의 해당 줄을 고친다.

## 지침을 고칠 때
`docs/guidelines.md`를 고치고 맨 위 날짜를 바꾼다. 선생님은 claude.ai 프로젝트를 쓰지 않고 Claude Code만 쓴다(2026-11-11) — 프로젝트 문서나 "지침" 칸은 맞추지 않는다.
