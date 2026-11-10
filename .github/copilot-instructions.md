# 차름 웹앱 — GitHub Copilot이 먼저 읽는 글

발달장애 학생용 학습 웹앱 시리즈 **차름**의 저장소다. 선생님(제작자)이 VS Code의 Copilot과 Claude Code(클라우드 세션)를 함께 쓴다.
**주 조정자는 Claude Code**다(2026-11-09 선생님 결정). Copilot은 선생님 컴퓨터에서 바로 고치고 시험하는 일을 돕고, 정한 것과 바꾼 것을 아래 기록 자리에 남겨 Claude가 이어받게 한다.

## 먼저 읽을 것 (Claude와 같은 기준)
1. `CLAUDE.md` — 저장소에서 일하는 규칙(Copilot도 같은 규칙을 따른다).
2. `docs/guidelines.md` — 모든 결정의 기준(교육 원칙·화면 공통·자료 규칙).
3. 고칠 앱의 `NNN/README.txt`, 무대 일이면 `media/stage/README.txt`와 `media/stage-beta/README.txt`.

## 꼭 지킬 것
- 답은 한국어, 쉬운 말. 선생님은 전문 개발자가 아니다. 보고는 짧게(바꾼 것 + 교육학·심리학 점검).
- **비밀**: API 키·토큰·`server/charum-api/donate-config.php` 내용을 코드·저장소·대화에 넣지 않는다.
- 앱은 HTML 한 파일. 그림·소리는 `media/`에서 GitHub 절대 주소(`https://shim-sung-hyun.github.io/web_app/media/...`)로 부른다.
- **공통 모듈**: 원본은 `common/이름.js`(예: `roster.js`, `stagekit.js`). 앱 안의 `<script id="이름">` 칸은 손으로 고치지 말고, 원본을 고친 뒤 `python3 tools/sync-modules.py`.
- 007은 통합본 `007/word-learn.html`이 원본(고친 뒤 `python3 007/tools/split.py`). 편 판은 손으로 고치지 않는다.
- 안 쓰게 된 파일은 지우지 말고 `python3 tools/trash.py 경로 --why "이유"`로 `_trash/`에.
- 이미 쓰는 앱을 크게 바꿀 때, 정식판과 베타를 합칠 때, 지침을 바꿀 때는 선생님께 먼저 묻는다.

## 함께 일하는 순서 (판이 엇갈리지 않게)
- 고치기 전에 `git pull`. 올릴 때 `git push`가 거부되면 `git pull --rebase` 뒤 다시 `git push`. 충돌(conflict)이 나면 멈추고 선생님께 알린다.
- 커밋 메시지는 한국어로 무엇을 왜 바꿨는지.
- 같은 앱·같은 파일을 Claude 세션이 고치는 중이면 기다린다(최근 커밋을 `git log`로 확인).
- **일을 마치면 기록**: 그 앱의 `README.txt`(무대는 `media/stage/README.txt`)에 정한 것과 다음 할 일을 해당 줄을 고쳐 적는다. Claude는 지난 대화를 모르고 README만 읽고 이어 간다.
- 여러 앱에 걸친 결정은 `docs/guidelines.md`의 해당 줄을 고치고 맨 위 날짜를 바꾼다(바꾸기 전에 선생님께 확인).
- 이 파일(`.github/copilot-instructions.md`)과 `CLAUDE.md`는 같은 규칙을 말해야 한다. 한쪽 규칙을 바꾸면 다른 쪽도 맞춘다.

## 무대(stage) — 지금 하는 일 (2026-11-09)
- 장면은 배경·소품을 따로 그려 밑동 높이 차례로 쌓는다(만화영화 셀처럼). 모듈 `common/stagekit.js`, 원리는 `media/stage/README.txt` '장면의 원리'(1~24)와 끝의 '선생님과 맞출 것'.
- 판 하나하나를 고치지 않고 원리(모듈·stage.json)를 고친다. 선생님 글은 그대로 두고 반영한 방법을 '→'로 단다.
- 12곳을 무대 설치도구 `media/stage/install.html`로 새로 만들어 `media/stage-beta/`에 모은다(기존 `media/stage/nature/`는 다 될 때까지 그대로). 숲(new-forest)이 견본 — 끝남.
- 설치도구 1단계 '자연 장소 고르기'(`media/stage/places.json`): 배경 설명·소품·그곳 동물·블록이 미리 들어가고, 가장 큰 동물을 가릴 소품이 있는지 보여 준다.
- 새 무대는 밑동 덮개 없이, 소품 그림에 밑동의 흙·풀을 그린다. 무섭거나 훼손된 듯한 꼴(잘린 손 같은 뿌리, 무서운 얼굴)은 지운다(지침 4절).
- 밑동 스며들기: 소품 밑동 흙·모래는 그라데이션으로 바닥에 스며들게(`python3 tools/soak-base.py <곳 폴더>`, 설치도구 5단계 기본 켬). 밑동 색을 손으로 칠하지 않는다.
- 그림 늘리기는 1.2배까지(넘으면 다시 그림), 줄이기는 자유(원리 9). 큰 줄기도 배경처럼 — 소품은 뿌리 끝 앞 땅이나 뿌리 사이 움푹한 흙에만(19).
- 숨김 단계 하 50~70% · 중 25~40% · 상 8~18% · 스페셜(22). 군락(23)·블록 소품(24)은 변형(가로·세로 0.8~1.2배·뒤집기)해 다양하게.
- 보기: `media/stage/test.html?root=stage-beta`, 숨기기 시험 `media/stage/hide-test.html?place=nature/new-forest`. 만드는 순서는 `media/stage-beta/README.txt` 맨 위.
- 맥북·윈도 VS Code 함께 쓰는 법은 `docs/vscode-mac.md`(시작 전 git pull, 끝나면 커밋·push, 옮기기 전 꼭 올리기).
