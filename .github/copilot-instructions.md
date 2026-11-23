# 차름 웹앱 — GitHub Copilot이 먼저 읽는 글

발달장애 학생용 학습 웹앱 시리즈 **차름**의 저장소다. 선생님(제작자)이 VS Code의 Copilot과 Claude Code(클라우드 세션)를 함께 쓴다.
**주 조정자는 Claude Code**다(2026-11-09 선생님 결정). Copilot은 선생님 컴퓨터에서 바로 고치고 시험하는 일을 돕고, 정한 것과 바꾼 것을 아래 기록 자리에 남겨 Claude가 이어받게 한다.

## 먼저 읽을 것 (Claude와 같은 기준)
1. `CLAUDE.md` — 저장소에서 일하는 규칙(Copilot도 같은 규칙을 따른다).
2. `docs/guidelines.md` — 모든 결정의 기준(교육 원칙·화면 공통·자료 규칙).
3. 고칠 앱의 `NNN/README.txt`, 무대 일이면 `media/stage/README.txt`와 `media/stage/README-beta.txt`.

## 꼭 지킬 것
- 답은 한국어, 쉬운 말. 선생님은 전문 개발자가 아니다. 보고는 짧게(바꾼 것 + 교육학·심리학 점검).
- **비밀**: API 키·토큰·`server/charum-api/donate-config.php` 내용을 코드·저장소·대화에 넣지 않는다.
- 앱은 HTML 한 파일. 그림·소리는 `media/`에서 GitHub 절대 주소(`https://shim-sung-hyun.github.io/web_app/media/...`)로 부른다.
- **차름 홈페이지 링크**(2026-11-21): 모든 웹앱(새 앱 포함)의 선생님 화면(설정·관리 메뉴) 왼쪽 위에 차름 로고 → charum.org 새 탭. 공통 모듈 `homeLink`(지침 3절).
- **공통 모듈**: 원본은 `common/이름.js`(`roster.js`, `stagekit.js`, `keyRelay.js`, `photoRelay.js`, `adminHold.js`, `adminGate.js`, `holdBubble.js`, `homeLink.js` — 선생님 화면 왼쪽 위 차름 로고 링크, `usage.js` — 앱 사용 횟수(열림·다 함 합계만 charum.org로, 새 앱도 넣음)). 앱 안의 `<script id="이름">` 칸은 손으로 고치지 말고, 원본을 고친 뒤 `python3 tools/sync-modules.py`.
- 007은 통합본 `007/word-learn.html`이 원본(고친 뒤 `python3 007/tools/split.py`). 편 판은 손으로 고치지 않는다.
- 안 쓰게 된 파일은 지우지 말고 `python3 tools/trash.py 경로 --why "이유"`로. 그림·사진·소리는 저절로 보관함 `media/archive/`(비우지 않음)로, 나머지는 `_trash/`로(2026-11-22).
- **자료 찾기 먼저**(2026-11-22): 그림·사진·소리를 새로 구하자고 하거나 프롬프트를 쓰기 전에 `python3 tools/find-media.py 낱말`(프롬프트는 `--prompt 파일`, 목소리는 `--say "문장"`). 나온 그림 모음(`/tmp/charum-find/…jpg`)을 열어 보고 선생님께 보여 드린다. 그림·소리를 넣거나 옮기면 `python3 tools/media-index.py`(전체 목록 `media/catalog.json`), 올리기 전 `python3 tools/check-files.py`가 "목록에 없는 파일 0"인지 본다.
- **도구 창고**(2026-11-14): 그림·소리·파일 일을 하기 전에 `tools/README.txt` 맨 위 목록부터 보고 있는 도구를 쓴다(모든 세션이 같은 도구 → 같은 품질). 모자라면 그 도구에 선택지를 덧붙이고, 새 도구는 정말 다른 일일 때만 만들어 목록에 올린다. 선생님이 쓰는 브라우저 화면(html)도 도구다 — 새로 만들기 전에 목록의 [선생님 화면 도구]부터(2026-11-22). 선생님께 도구를 알려 드릴 때는 도구 모음 한 장 `https://shim-sung-hyun.github.io/web_app/tools/`(`tools/index.html`)을 드리고, 화면을 새로 만들거나 바꾸면 그 페이지도 함께 고친다(2026-11-23). 안 쓰게 된 도구는 `python3 tools/trash.py --tool 이름.py --why "이유"`로 `tools/attic/`에(6개월, `--revive`로 되살림).
- 이미 쓰는 앱을 크게 바꿀 때, 정식판과 베타를 합칠 때, 지침을 바꿀 때는 선생님께 먼저 묻는다.

## 함께 일하는 순서 (판이 엇갈리지 않게)
- **총괄 세션**(2026-11-11): Claude 세션 가운데 하나가 총괄을 맡는다 — 여러 앱에 걸친 일(공통 모듈·공용 자료·지침·README 정리·전체 점검)은 총괄이, 앱 하나의 일은 그 앱 세션이. 총괄이 할 일은 `docs/guidelines.md` 맨 끝 "총괄 할 일".
- 고치기 전에 `git pull`. 올릴 때 `git push`가 거부되면 `git pull --rebase` 뒤 다시 `git push`. 충돌(conflict)이 나면 멈추고 선생님께 알린다.
- 커밋 메시지는 한국어로 무엇을 왜 바꿨는지.
- 같은 앱·같은 파일을 Claude 세션이 고치는 중이면 기다린다(최근 커밋을 `git log`로 확인).
- **일을 마치면 기록**: 그 앱의 `README.txt`(무대는 `media/stage/README.txt`)에 정한 것과 다음 할 일을 해당 줄을 고쳐 적는다. Claude는 지난 대화를 모르고 README만 읽고 이어 간다.
- 여러 앱에 걸친 결정은 `docs/guidelines.md`의 해당 줄을 고치고 맨 위 날짜를 바꾼다(바꾸기 전에 선생님께 확인).
- 이 파일(`.github/copilot-instructions.md`)과 `CLAUDE.md`는 같은 규칙을 말해야 한다. 한쪽 규칙을 바꾸면 다른 쪽도 맞춘다.

## 무대(stage) — 지금 하는 일 (2026-11-11)
- 소품실(2026-11-16 선생님): 새 무대·새 앱은 소품을 새로 받기 전에 `media/stage/prop-room.html`부터 보고, 밑동 땅이 같은 묶음이면 `python3 tools/prop-room.py --borrow 받을무대 소품`으로 빌려 씀(그림은 옮기지 않음). 새로 받은 소품은 stage-intake가 소품실 목록에 올림. 지금 있는 무대는 그대로.
- 장면은 배경·소품을 따로 그려 밑동 높이 차례로 쌓는다(만화영화 셀처럼). 모듈 `common/stagekit.js`, 원리는 `media/stage/README.txt` '장면의 원리'(1~24)와 끝의 '선생님과 맞출 것'.
- 판 하나하나를 고치지 않고 원리(모듈·stage.json)를 고친다. 선생님 글은 그대로 두고 반영한 방법을 '→'로 단다.
- (2026-11-22 합침) 12곳 무대는 `media/stage/nature/<곳>/`(예전 stage-beta/nature/new-<곳>), 옛 덮개 방식은 `media/stage/legacy/`(008 옛 길이 씀). 아래 글의 'new-<곳>'은 지금 '<곳>'. 예전 기록: 12곳을 무대 설치도구 `media/stage/install.html`로 새로 만들어 모은다(기존 무대는 다 될 때까지 그대로). 숲(new-forest)이 견본 — 끝남.
- 설치도구 1단계 '자연 장소 고르기'(`media/stage/places.json`): 배경 설명·소품·그곳 동물·블록이 미리 들어가고, 가장 큰 동물을 가릴 소품이 있는지 보여 준다.
- 새 무대는 밑동 덮개 없이, 소품 그림에 밑동의 흙·풀을 그린다. 무섭거나 훼손된 듯한 꼴(잘린 손 같은 뿌리, 무서운 얼굴)은 지운다(지침 4절).
- 밑동 스며들기: 소품 밑동 흙·모래는 그라데이션으로 바닥에 스며들게(설치도구 5단계 기본 켬 — 이미 있는 그림에 한꺼번에 하던 `tools/soak-base.py`는 2026-11-14 보관함으로). 밑동 색을 손으로 칠하지 않는다.
- 빛: 해는 그림 밖 보는 사람 등 뒤 왼쪽 위, 그림자는 오른쪽 안쪽(원리 1-2). 곳마다: 사막만 해 방향 그림자(그림자를 파랑으로 받아 `tools/flat-shadow.py --key blue`, ownShadow), 나머지는 원본 그림 그대로(규칙 없음, noShadow). 
- 북극(옛 극지방, 펭귄 뺌): 동물·배경·소품 모두 가는 연필풍(빙). 받은 그림은 `tools/stage-intake.py`(자르기는 `tools/bing-cut.py` — 옛 `pencil-cut.py`는 2026-11-14 보관함으로). 남은 일은 `media/stage/README.txt` 끝 '남은 일'.
- 목소리: 008은 ElevenLabs(Roger) 묶음 `media/voice/elevenlabs-roger/`로 다 채움(앱 말이 다 있으면 그 묶음, 아니면 Azure — 섞지 않음). 발음이 틀리면 소리 나는 대로 적어 다시 받음(예: 잠-자리, 땅깡아지).
- 밑동 색이 땅과 비슷하면 스며들기, 다르면 묻기. 소품 선은 그 곳 동물 선 색으로 — 원리 1-1·1-3(그 일을 하던 `bury-base.py`·`line-unify.py`는 연필풍 무대에서 안 써서 2026-11-14 보관함으로, 필요하면 `--revive`).
- 그림 늘리기는 1.2배까지(넘으면 다시 그림), 줄이기는 자유(원리 9). 큰 줄기도 배경처럼 — 소품은 뿌리 끝 앞 땅이나 뿌리 사이 움푹한 흙에만(19).
- 숨김 단계 하 50~70% · 중 25~40% · 상 8~18% · 스페셜(22). 화면 밖 한도 하 50·중 70·상 80·스페셜 90%, 끝 동물은 한 장면에 하나(21). 단계별 최소 크기 하 10·중 7·상 5%, 작은 동물은 그만큼 키워 돌·풀 같은 소품 뒤에만(22). 군락(23)·블록 소품(24)은 변형(가로·세로 0.8~1.2배·뒤집기)해 다양하게.
- 보기: `media/stage/test.html?root=stage`, 숨기기 시험 `media/stage/hide-test.html?place=nature/forest`. 만드는 순서는 `media/stage/README.txt` 맨 위.
- 맥북·윈도 VS Code 함께 쓰는 법은 `docs/vscode-mac.md`(시작 전 git pull, 끝나면 커밋·push, 옮기기 전 꼭 올리기).
- 사막(2026-11-12 끝): 배경·소품·동물 모두 빙 연필풍, 소품 그림자는 파랑으로 받아 `tools/flat-shadow.py --key blue`(검정 20%), 동물은 `tools/bing-cut.py --animal`. 배치 원리는 선생님이 `media/stage/arrange.html`(배치 고치기)로 고친 JSON에서 익힘 — 무대 README '배치 고치기' ①~⑦(언덕 모서리·그림자 지평선 아래·숨은 작은 소품 빼기 등). 다른 곳도 같은 순서(stage README '사막 끝').
- 초원(2026-11-12): 사막 순서로 연필풍 — 배경·소품 17종류 38개·동물 8 넣음. 그림자 씀(선생님 확인). 다음은 나무·풀·바위 14가지 더 받기(프롬프트 파일 끝).
- 숨기기 속도(2026-11-12): `Stage.hide`를 결과 그대로 빠르게 고침 — 초원 스페셜 한 판 179초→5초, 사막 84초→3초. 셈하는 함수(visibleOf·crushOf·seeOf)를 고칠 때는 무대 README 원리 21 '걸리는 시간'의 방식(겹치는 소품만·덮인 칸 지도 한 번)을 지킨다.
- 빙에 붙일 그림 프롬프트는 장마다 2000자 안(2026-11-12 선생님, 지침 2절).
- 색이 비슷한 자리에서는 상·스페셜도 1.5배 더 드러나게(2026-11-13 선생님, 숲에서만 — stage.json에 camo가 있는 무대만, 무대 README '숲 평가').
- 단계 값은 무대마다 다를 수 있음(2026-11-13 선생님: 숲에서만 널널하게 — stage.json levels·featFree·cut, 모듈 Stage.levelOpt(lv, pl)·levelAt(v, e, pl)). 사막·북극은 공통 값 그대로.
- 소품 프롬프트에는 '전체 둘레를 한 줄로 닫아 하나의 닫힌 형태로'를 넣지 않음(2026-11-14 선생님 — 모든 소품, 지침 2절). 대신 '물건 둘레에 선·고리·테두리를 따로 그리지 말 것'. 동물의 윤곽선 닫기는 그대로.
- 프롬프트는 복사 화면으로 드림(2026-11-13 선생님, 2026-11-21 다시 — 어떤 프롬프트든 대화에 붙이지 않음): `media/prompts/`에 글(━━━ 묶음·■ 이름·▼~▲ 복사할 글)로 두고 `media/prompts/copy.html?f=파일이름` 주소를 드림. 새 글은 copy.html의 FILES에 한 줄.
- 숨은 동물 난이도(2026-11-13 선생님, 지침 2절): 크기는 기본일 뿐, 보호색·지형지물의 색·지형지물로 난이도를 더 조절. 바위 단독보다 바위+수풀·야자로 섞어 풍부하게.
- 숨기기 원리 둘(2026-11-13 선생님, 무대 README 22): 가리는 소품의 불투명 바닥은 동물 바닥보다 앞에, 스페셜이라도 특징(머리·귀·뿔·꼬리)이 조금은 보이게.
- 논·습지(new-wetland)도 연필풍으로 만듦(2026-11-14, 소품 25·동물 8 + 오리·메뚜기, 스페셜 5.6마리 — 무대 베타 README). 우렁이도 넣음.
- 무대 이어 갈 일(2026-11-13 세션 마무리): media/stage/README.txt '이어 갈 일' — 초원 스페셜은 5마리(못 채우면 4, stage.json counts — 선생님 결정)·큰 보호색 소품 13장 + 비침 한도를 무대마다(stage.json see .05 — 초원·숲)로 스페셜 6마리가 참(초원 5.8·숲 6.0), 숨기기 평가 다시, 숲은 연필풍으로 바꿈(2026-11-13, 소품 54·동물 12, 스페셜 6마리 — 무대 베타 README '■ nature/forest').
- 들판(new-ground) 만듦(2026-11-13, 소품 39·동물 15, 스페셜 6마리). 갯벌(new-mudflat) 만듦(2026-11-14, 소품 23·동물 10, 스페셜 6마리). 강·호수(new-pond) 만듦(2026-11-14, 소품 19·동물 12, 스페셜 6마리). 바닷속(new-sea) 만듦(2026-11-14, 소품 40·동물 12 — 바다 생물은 떴다 가라앉았다(swim·swimP), 그림자 없는 장면 — stage-intake.py가 bing-cut.py로, 큰 동물 한도 stage.json maxLong). 논·습지(new-wetland)도 만듦(2026-11-14). 땅속(new-underground) 만듦(2026-11-14, 그림자 없는 단면 — 줄기 있는 뿌리는 hangAt·tools/trunk-extend.py, 뿌리는 stage.json hang, 흙 꼭대기 beds.top). 물속(new-water) 만듦(2026-11-14, 소품 19·동물 10 — 수달 넣고 올챙이 뺌, 그림자 없는 장면). 남은 곳(하늘)은 프롬프트만 준비 — media/prompts/copy.html 목록, 그림을 기다림.
- 하늘(new-sky) 만듦(2026-11-14, 소품 25·동물 11 — 원근 없는 자리 air 하나, 구름·연·가지는 위·나무·지붕·전봇대는 아래에서 솟음). 기러기 그림만 기다림.
- 소품 손질(2026-11-15): `media/stage/touchup.html` — 장면을 골라 소품의 남은 흰 점을 붓으로 지우고 저장소 폴더에 바로 저장. 선생님이 손질해 올린 뒤에는 `python3 tools/stage-meta.py`·`tools/stage-index.py`를 돌림.
- 선생님이 소품 손질 화면에서 고친 파일을 주면: 이름·크기로 장면 확인 → items에 덮어쓰기 → stage-meta.py·stage-index.py → 올리기(media/stage/README.txt '소품 손질' 절).
- 008·009 연필풍(2026-11-15 선생님): 화면·게시판 본문·홍보 그림을 연필풍으로(지침 2절). 2026-11-16 008 정식 발행(정식판 = 베타 — 베타를 고치면 정식판도 통째로), 009 발행 준비 끝(목소리 ElevenLabs, 원숭이·펭귄 이름 둘만 Leda — 009 README ★).
- Gemini 그림 로고는 `python3 tools/gemini-logo.py 그림 --inplace`로 지움(2026-11-22, tools/README 목록).
- **키 안내는 서비스마다 한 페이지**(2026-11-23 선생님): Gemini(AI Studio) `gemini_guide` · Google 음성(Cloud TTS) `google-tts_guide` · Cloudflare `cloudflare_guide` · Azure 음성 `azure_guide` · ElevenLabs `elevenlabs_guide` · 빙 이미지 크리에이터 `bing_guide`(저장소 맨 위 `이름.html`, 주소 `https://www.charum.org/study/doc.html?이름`). 그 서비스가 필요한 곳(앱·설명서·게시판 글·도구 화면)은 새 안내를 만들거나 앱 안에 받는 법을 길게 쓰지 말고 이 페이지에 링크만 한다(앱에 따라 다른 "넣는 곳"은 그 페이지의 "앱에 넣기"에 한 줄 더함). 옛 `gemini-key`·`010/gemini-key`·`NNN/cloud-key`는 넘겨 주기만 함.
