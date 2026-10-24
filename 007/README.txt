007 · [차름 국어] 낱말 익히기 (word-learn, 예전 이름 "글자 익히기"·"차름 한글", 제목 2026-10-25) · 버전 1 · 지금 1편
   편 판: [차름 국어] 낱말 익히기 1편 · 나와 우리 집 (2편부터 "낱말 익히기 2편 · 편 이름") · 통합본은 편 없이
   파일 이름·주소·저장 칸(wl007b_*)은 그대로
   차름은 '처음'이라는 뜻으로 백기완 선생이 즐겨 쓰던 우리말입니다. 글자를 처음 배우는 학생들의 첫걸음이 되기를 바라며 지었습니다.

[파일]
- word-learn.html          웹앱 (버전 1)
- word-learn-1.html        편마다 나눈 판: 1편 나와 우리 집만 보임(2026-10-23). 2편부터는 공개할 때 word-learn-2.html …
                           통합본(word-learn.html)과 저장 칸이 같아(wl007b_*) 기록·멈춘 곳·마친 묶음이 이어짐.
                           묶음은 통합본과 똑같음(채우는 낱말은 같은 편·앞 편에서만). 어려운 낱말 다시 넣기는 앞 편 낱말도 섞음.
                           만들기: /home/claude/beta 에서 build.py → word-learn.html로 복사 → split.py (OPEN_BOOKS 편마다 만듦)
- server-loader-1.html     내 도메인 study/007/word-learn-1.html 로 올릴 불러오기 파일(편마다 하나)
- word-learn-beta.html     베타 주소로 들어오면 word-learn.html로 넘겨 줌 (2026-10-21 진행 막대·견본 테두리를 정식판에 합침)
- word-learn01~20.jpg      화면 캡처 1366×768 (설명서 그림)
- word-learn_manual.html   게시판 본문용 짧은 설명서 (에디터 소스 모드에 붙여 넣기)
- word-learn_guide.html    자세한 설명 페이지 (짧은 설명서의 "자세한 설명 보기"에서 열림)
- word-learn-promo.jpg     게시판 맨 위 홍보 그림 (1366×768)
- record-guide.html        기록 활용법(가상의 학생 홍길동의 한 달 기록 예시, 설정 화면·교사용 기록에서 연결)
- word-learn-rec1~2.jpg   기록 활용법 그림(한 장 요약 · 수준 알림과 다시 넣은 낱말)
- cloud-key.html           Cloud 키 넣는 방법 (앱에서 연결)
- pics/                    낱말 그림 350개 (webp)
                           몸 부위(손·발·눈·코·입·귀·머리·이·다리, 2편 얼굴·배·팔·무릎·손톱·발톱)는 같은 틀로 다시 그림(Gemini, 2026-10-20).
                           보기에서 그 부위만 비춤(스포트라이트, 한 번), 고르기·놀이에서는 비추지 않음.
- game/                    놀이 그림(먹이 주기·스티커)
- fonts/                   학교안심 바른바탕 B (woff2)
- 기본 목소리(Google Leda, 빠르기 0.90, 3,339개)는 차름 소리 모음 ../media/voice/leda-0.90/ 에서 읽음(2026-10-22부터)
  (mp3 + index.json, 고쳐 만든 소리 기록 fixes.json 도 거기에)
- 옛 voice/leda/ · voice/fixes.json 은 2026-10-23 지움(fixes.json 은 media/voice/leda-0.90/ 에)
- words-*.txt, words-frequency.csv   예전 판 자료(버전 1에서는 쓰지 않음)
  (예전 판 word-learn-v0.html·word-games.html은 2026-10-22에 지움 — 미리 만든 소리를 쓰지 않던 판)

[주소]
앱:   https://www.charum.org/study/007/word-learn.html (2026-10-21부터, 자료는 GitHub) · GitHub 주소 https://shim-sung-hyun.github.io/web_app/007/word-learn.html 도 그대로 열림
그림: https://shim-sung-hyun.github.io/web_app/007/word-learn01.jpg ~ word-learn20.jpg

[게시판]
- 확장 변수 app_url: https://www.charum.org/study/007/word-learn-1.html (1편 판, 2026-10-23부터. 통합본은 word-learn.html)
- 본문: word-learn_manual.html 내용을 소스 모드에 붙여 넣기
- 썸네일: word-learn-promo.jpg 한 장

[저장 칸]
- 학생 명단: webapp.students (다른 앱과 함께 씀, 학생 칸 wl = 수준)
- 기록·설정: wl007b_* (log, prog, resume=학생마다 멈춘 곳, mine, level …) / 사진·목소리: IndexedDB wordlearn007beta
  (이름은 베타 때 그대로 둠 — 베타로 쓴 기록이 그대로 이어짐)
- 예전 판(wl007_log, wl007_words, IndexedDB wordlearn007)은 처음 열 때 한 번 옮김(migV0)
- 키: wordLearn.cloudKey (+ webapp.cloudKey)

[편 차례 공개]
- 앱 파일은 하나. word-learn.html 안 OPEN_BOOKS = [1] → 공개한 편(1편판). 다음 판은 [1, 2] → 1_2편판 …
- 준비 중인 편은 설정 화면에 흐리게 "준비 중"(누를 수 없음), 그 편 낱말은 보기·채우기에도 안 나옴
- 제작자 미리 보기: word-learn.html?all=1 (모든 편)
- 공개된 편을 다 마치면 "다음 편은 준비 중이에요"만 알리고, 복습할 묶음은 선생님이 고름
- 준비 중인 편의 기록·학생 수준·마친 묶음은 지우지 않음(다시 열리면 이어짐)

[낱말]
- 1편 나와 우리 집 98 · 2편 안전하게 70 · 3편 학교에서 36 · 4편 마을에서 111 · 5편 일터에서 35 (모두 349)
- 수준 1·2·3 = 묶음 4·6·10낱말, 모자란 묶음은 비슷한 주제 낱말로 채움(TOPUP)
- 헷갈리는 짝(PAIRS)은 서로 보기로 나오지 않음

[기본 목소리를 다시 만들 때]
- 미리 만든 소리는 한 번 만든 것을 계속 씀. 다시 만들거나 고칠 땐 Claude에게 요청
  (만들기 화면을 그때 다시 만듦. 고친 내용은 media/voice/leda-0.90/fixes.json 참고)

[기록으로 학습 돕기] (2026-10-20)
- 기록 한 줄: 학생·시각·낱말·단계(2 같은 글자 3 낱말 고르기 4 그림 고르기 5 쓰기 7 묶음 끝 정리)·결과(바로/도움)·수준·쓰기 방식·헷갈린 보기(x, 정답 대신 누른 보기).
  묶음 끝 정리에서 다른 것을 먼저 누르고 맞히면 도움 받아 맞힘으로 봄.
- 교사용 기록 맨 위 한 장 요약: 단계별(처음 절반 ↔ 최근 절반) · 주별 흐름 · 도움이 더 필요한 낱말(최근 10번 중 도움 2번 이상, 최근 3번 모두 바로면 뺌) · 자주 헷갈린 짝 · 다음에 해 볼 것.
- 어려운 낱말 다시 넣기(기본 하기): 묶음대로 고를 때 1개(수준 1·2)·2개(수준 3)를 더 넣음, 점선 "다시" 표시. 짝·같은 그림은 넣지 않음.
- 수준 알림: 그 수준 5번 이상 + 최근 3번 80% 이상 → 올려 보기 / 45% 이하 → 낮추어 보기. 단추를 눌러야 바뀜.
- 예시 기록: 교사용 기록 → 예시 보기(홍길동). 2026-09-21~10-20, 월~목, 날짜 고정(활용법 글의 숫자와 같음), 이 기기 기록에는 넣지 않음.

[내 도메인에서 열기] (2026-10-21)
- word-learn.html 하나만 내 서버(예: https://charum.org/<폴더>/word-learn.html)에 올리면 된다. 그림·목소리·놀이 그림·글꼴·안내 페이지는 GitHub Pages(https://shim-sung-hyun.github.io/web_app/007/)에서 읽는다(DBASE).
- GitHub Pages나 제작자 시험 서버(localhost의 /web_app/007/)에서 열릴 때만 같은 폴더에서 읽는다.
- 서버 폴더 이름은 게시판 이름(mid, 예: webapp)과 같게 하지 않는다(라이믹스 403).
- 기록·학생 명단은 주소(도메인)마다 따로 저장된다: 옮길 때 교사용 기록 → 내보내기(CSV) → 새 주소에서 불러오기.
- 앱을 고치면 GitHub의 word-learn.html과 내 서버의 word-learn.html을 함께 바꾼다.
- 지금 내 도메인: https://www.charum.org/study/007/word-learn.html (https). 혹시 http 주소에서 열려도 SHA-1을 직접 계산해 미리 만든 목소리를 찾는다(sha1Bytes). 휴대폰으로 키 받기(ECDH)는 https에서만 된다.
- 내 서버에는 server-loader.html(약 1KB)을 word-learn.html 이름으로 한 번만 올려 둔다(2026-10-21). 열릴 때마다 GitHub의 최신 word-learn.html을 받아 그 주소에서 펼치므로, 앞으로 앱을 고쳐도 서버에 다시 올릴 필요가 없다(GitHub에 올리면 몇 분 안에 반영). 주소창은 내 도메인, 기록은 이 기기 브라우저(내 도메인 주소)에, 서버에는 아무것도 저장되지 않는다.
