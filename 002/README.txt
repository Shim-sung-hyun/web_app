002 · 그림 조각 맞추기

[GitHub에 올리기]  web_app 저장소 → Add file → Upload files
  → 이 002 폴더를 통째로 끌어다 놓기 → Commit changes

  앱 주소:   https://shim-sung-hyun.github.io/web_app/002/picture-puzzle.html
  그림 주소: https://shim-sung-hyun.github.io/web_app/002/picture-puzzle01.jpg (02~07 같은 방식)

[게시판 글]  차름 갤러리 · webapp 게시판
  - 웹앱주소(app_url): 위 앱 주소
  - 본문: picture-puzzle_manual.html 내용을 '소스' 모드에 붙여 넣기 (그림은 GitHub에서 불러옴)
  - 썸네일: picture-puzzle02.jpg 한 장만 첨부 (갤러리 카드용)

파일
  picture-puzzle.html          웹앱
  picture-puzzle01~07.jpg      화면 그림 (흩어진 시작, 조각 옮기기, 놓은 자리에 머묾·자리 보여주기, 완성·교사 모드, 학생 혼자 시작, 학생 혼자 끝, 도움말)
  semple.jpeg                  예시 사진 (1800px로 줄인 것, 약 190KB)
  picture-puzzle_manual.html   게시판 본문용 설명서

[내 도메인에서 열기] (2026-10-21)
- 주소: https://www.charum.org/study/002/picture-puzzle.html (게시판 app_url도 이 주소로)
- 서버 study/002/ 폴더에는 server-loader.html(1KB)을 picture-puzzle.html 이름으로 한 번만 올린다. 열릴 때마다 GitHub의 최신 picture-puzzle.html을 받아 그 주소에서 펼친다 → 앱을 고쳐도 GitHub에만 올리면 된다.
- 앱이 읽는 자료(목소리·예시 사진·cloud-key.html 등)는 GitHub 절대 주소로 읽는다. 상대 주소를 새로 쓰지 말 것.
- 기록·키는 그 기기 브라우저에 주소(도메인)별로 저장된다. 서버에는 아무것도 저장되지 않는다.
- 휴대폰으로 키 받기(key-relay.php)·사진 보내기·AI 중계는 받는 주소 목록에 https://www.charum.org 가 있어야 한다.
