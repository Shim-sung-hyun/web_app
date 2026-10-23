004 · 시 암송

[GitHub에 올리기]  web_app 저장소 → Add file → Upload files
  → 이 004 폴더를 통째로 끌어다 놓기 → Commit changes

  앱 주소:   https://shim-sung-hyun.github.io/web_app/004/poem-recite.html
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
  cloud-key.html            Cloud 키 넣는 방법 안내 페이지 (앱의 관리 메뉴에서 연결)
                            주소: https://www.charum.org/study/doc.html?004/cloud-key
  poem-recite_manual.html   게시판 본문용 짧은 소개
  poem-recite_guide.html    자세한 설명 페이지
                            주소: https://www.charum.org/study/doc.html?004/poem-recite_guide
  (목소리 키는 "더 정하기"에 접혀 있음. 새로 넣은 시는 기기 목소리, 키가 있으면 Leda)
  (기본 목소리: 들어 있는 시 다섯 편을 Leda로 통째로 낭송해 줄마다 나눈 mp3 → 차름 소리 모음 ../media/voice/poem/)
                            파일 이름 = SHA-1("시|줄 번호|줄 글") 앞 16자리 (되풀이되는 줄도 그 자리의 소리)

휴대폰으로 키 받기
  키 칸 옆 "📱 휴대폰으로 받기" 단추는 중계 서버 https://charum.org/key-relay.php 를 씁니다.
  중계 서버와 보내기 페이지는 key-relay.zip을 보세요.

[내 도메인에서 열기] (2026-10-21)
- 주소: https://www.charum.org/study/004/poem-recite.html (게시판 app_url도 이 주소로)
- 서버 study/004/ 폴더에는 server-loader.html(1KB)을 poem-recite.html 이름으로 한 번만 올린다. 열릴 때마다 GitHub의 최신 poem-recite.html을 받아 그 주소에서 펼친다 → 앱을 고쳐도 GitHub에만 올리면 된다.
- 앱이 읽는 자료(목소리·예시 사진·cloud-key.html 등)는 GitHub 절대 주소로 읽는다. 상대 주소를 새로 쓰지 말 것.
- 기록·키는 그 기기 브라우저에 주소(도메인)별로 저장된다. 서버에는 아무것도 저장되지 않는다.
- 휴대폰으로 키 받기(key-relay.php)·사진 보내기·AI 중계는 받는 주소 목록에 https://www.charum.org 가 있어야 한다.
