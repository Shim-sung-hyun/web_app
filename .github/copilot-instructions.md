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
- 장면은 배경·소품을 따로 그려 밑동 높이 차례로 쌓는다(만화영화 셀처럼). 모듈 `common/stagekit.js`, 차림표 `media/stage/index.json`.
- **새 무대는 밑동 덮개 없이**, 소품 그림 자체에 밑동의 흙·풀을 그려 양옆으로 엷어지며 땅과 만나게 한다. 기존 덮개 방식은 폐기.
- 제작자용 **무대 설치도구** `media/stage/install.html`로 12곳을 새로 만들어 **`media/stage-beta/`**에 모은다. 기존 `media/stage/nature/`는 다 될 때까지 건드리지 않는다.
- 보기: `media/stage/test.html?root=stage-beta`. 시험 페이지에서 선생님이 번호로 멘트를 달고 '멘트 모아 복사'를 하면, 그 글을 Claude 대화에 붙여 고친다.
- 크게 쓰일 소품은 판에서 자르지 말고 한 장에 하나씩 큰 그림으로 받는다(설치도구가 셈해 알려 줌). 좌우 끝이 세로로 잘린 그림·네모 받침은 쓰지 않는다.
