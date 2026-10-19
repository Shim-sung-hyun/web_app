007 글자 익히기 (word-learn) · 버전 1 (2026-10-19)

[파일]
- word-learn.html          웹앱 (버전 1)
- word-learn-v0.html       예전 판(버전 0) — 따로 남겨 둠, 게시판에는 걸지 않음
- word-learn-beta.html     베타 주소로 들어오면 word-learn.html로 넘겨 줌
- word-learn01~20.jpg      화면 캡처 1366×768 (설명서 그림)
- word-learn_manual.html   게시판 본문용 설명서 (에디터 소스 모드에 붙여 넣기)
- cloud-key.html           Cloud 키 넣는 방법 (앱에서 연결)
- pics/                    낱말 그림 349개 (webp)
- game/                    놀이 그림(먹이 주기·스티커)
- fonts/                   학교안심 바른바탕 B (woff2)
- voice/leda/              기본 목소리(Google Leda, 미리 만든 mp3 + index.json, 3,331개)
- voice/fixes.json         고쳐 만든 소리 기록(다시 만들 때 참고)
- words-*.txt, words-frequency.csv, word-games.html   예전 판 자료(버전 1에서는 쓰지 않음)

[주소]
앱:   https://shim-sung-hyun.github.io/web_app/007/word-learn.html
그림: https://shim-sung-hyun.github.io/web_app/007/word-learn01.jpg ~ word-learn20.jpg

[게시판]
- 확장 변수 app_url: https://shim-sung-hyun.github.io/web_app/007/word-learn.html
- 본문: word-learn_manual.html 내용을 소스 모드에 붙여 넣기
- 썸네일: word-learn05.jpg (그림이 붓이 되어 쓰는 장면) 한 장

[저장 칸]
- 학생 명단: webapp.students (다른 앱과 함께 씀, 학생 칸 wl = 수준)
- 기록·설정: wl007b_* (log, prog, mine, level …) / 사진·목소리: IndexedDB wordlearn007beta
  (이름은 베타 때 그대로 둠 — 베타로 쓴 기록이 그대로 이어짐)
- 예전 판(wl007_log, wl007_words, IndexedDB wordlearn007)은 처음 열 때 한 번 옮김(migV0)
- 키: wordLearn.cloudKey (+ webapp.cloudKey)

[낱말]
- 1편 나와 우리 집 98 · 2편 안전하게 69 · 3편 학교에서 36 · 4편 마을에서 111 · 5편 일터에서 35 (모두 349)
- 수준 1·2·3 = 묶음 4·6·10낱말, 모자란 묶음은 비슷한 주제 낱말로 채움(TOPUP)
- 헷갈리는 짝(PAIRS)은 서로 보기로 나오지 않음

[기본 목소리를 다시 만들 때]
- 미리 만든 소리는 한 번 만든 것을 계속 씀. 다시 만들거나 고칠 땐 Claude에게 요청
  (만들기 화면을 그때 다시 만듦. 고친 내용은 voice/fixes.json 참고)
