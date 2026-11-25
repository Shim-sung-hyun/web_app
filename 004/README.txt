004 · [차름 국어] 시 외우기 (예전 이름 시 암송 — 파일 이름·주소·저장 칸은 그대로)

[GitHub에 올리기]  web_app 저장소 → Add file → Upload files
  → 이 004 폴더를 통째로 끌어다 놓기 → Commit changes

  앱 주소:   https://www.charum.org/study/004/poem-recite.html  (학생·선생님 — 게시판 app_url도 이 주소)
  GitHub 원본: https://shim-sung-hyun.github.io/web_app/004/poem-recite.html
  그림 주소: https://shim-sung-hyun.github.io/web_app/004/poem-recite01.jpg (02~10 같은 방식)

[게시판 글]  차름 갤러리 · webapp 게시판
  - 웹앱주소(app_url): 위 앱 주소
  - 본문: poem-recite_manual.html 내용을 '소스' 모드에 붙여 넣기 (짧은 소개, 그림은 GitHub에서 불러옴)
  - 썸네일: poem-recite-promo.jpg 한 장만 첨부 (갤러리 카드용)
  - 자세한 설명은 따로 있는 poem-recite_guide.html (소개 글의 "자세한 설명 보기"에서 열림)

파일
  poem-recite.html          웹앱
  poem-recite01~10.jpg      화면 그림 1366×768 (첫 화면, 첫 화면 위 관리 메뉴, 시 전체, 반 가리기, 낱말 첫 글자, 들려주기,
                            따라 읽기, 둥근 글씨, 줄 첫 글자, 새 시 넣기)
  poem-recite-promo.jpg     게시판 맨 위 홍보 그림 (1366×768)
  cloud-key.html            옛 주소 — google-tts_guide.html로 넘겨 줌(2026-11-23)
                            키 안내: https://www.charum.org/study/doc.html?google-tts_guide
  poem-recite_manual.html   게시판 본문용 짧은 소개
  poem-recite_guide.html    자세한 설명 페이지
                            주소: https://www.charum.org/study/doc.html?004/poem-recite_guide
  (목소리 키는 "더 정하기"에 접혀 있음. 새로 넣은 시는 기기 목소리, 키가 있으면 Leda)
  (기본 목소리: 들어 있는 시 다섯 편을 Leda로 통째로 낭송해 줄마다 나눈 mp3 → 차름 소리 모음 ../media/voice/poem/)
                            파일 이름 = SHA-1("시|줄 번호|줄 글") 앞 16자리 (되풀이되는 줄도 그 자리의 소리)

휴대폰으로 키 받기
  키 칸 옆 "📱 휴대폰으로 받기" 단추는 중계 서버 https://charum.org/charum-api/key-relay.php 를 씁니다.
  보내기 페이지는 저장소 맨 위 key-send.html. 중계 서버 key-relay.php는 서버 charum-api/에만 있음(원본은 아직 저장소에 없음 — 지침 끝 "선생님 할 일" ②).
  앱 안 <script id="keyRelay">는 2026-11-11부터 공통 모듈(원본 common/) — 손으로 고치지 않고 원본을 고친 뒤 tools/sync-modules.py.

[내 도메인에서 열기] (2026-10-21)
- 주소: https://www.charum.org/study/004/poem-recite.html (게시판 app_url도 이 주소로)
- 서버 study/004/ 폴더에는 server-loader.html(1KB)을 poem-recite.html 이름으로 한 번만 올린다. 열릴 때마다 GitHub의 최신 poem-recite.html을 받아 그 주소에서 펼친다 → 앱을 고쳐도 GitHub에만 올리면 된다.
- 앱이 읽는 자료(목소리·예시 사진·키 안내 *_guide.html 등)는 GitHub 절대 주소로 읽는다. 상대 주소를 새로 쓰지 말 것.
- 기록·키는 그 기기 브라우저에 주소(도메인)별로 저장된다. 학생 기록은 서버에 저장하지 않는다(서버에는 앱 사용 횟수 합계만 — usage 모듈).
- 휴대폰으로 키 받기(key-relay.php)·사진 보내기·AI 중계는 받는 주소 목록에 https://www.charum.org 가 있어야 한다.

관리 버튼(2026-11-11)
  누르는 동작은 공통 모듈 adminHold(원본 common/adminHold.js, 앱 안 <script id="adminHold"> — 손으로 고치지 않음, tools/sync-modules.py).
  눌리는 자리가 버튼에서 화면 오른쪽 아래 구석까지 넓어짐(전자칠판에서 잘 안 눌리던 것 때문). 버튼 모양·색·자리도 이제 공통 모듈 adminButton(2026-11-25).
  공통 모듈로 옮김(2026-11-25 총괄): adminButton(한 번 누르기 AdminButton.tap)·reportLink·endLesson·printFit·voiceKit. 앱 안 그 칸들은 손으로 고치지 않음(common/ 원본 → tools/sync-modules.py). 이 앱만 다른 것은 endLesson 칸 바로 뒤 한 줄 ReportLink.set·EndLesson.set(게시판 글 주소·영역 색·보일 때).
  AI 키 칸은 공통 모듈 aiKey(2026-11-25): Google 음성(관리 메뉴 → 더 정하기 → Google (키)일 때). "이 기기에 키 저장" 고르기는 없앰 — 키는 늘 이 기기·브라우저에 기억. 키는 webapp.* 칸이라 다른 차름 앱과 함께 씀(옛 앱 칸에만 있던 키는 열 때 옮김).

- 사용 횟수(2026-11-23): 공통 모듈 usage. 열 때 Usage.open('004'), 다 함 = step() 끝(시를 끝까지 들음)에서 Usage.done(). 보기: charum.org/charum-api/usage-admin.php
