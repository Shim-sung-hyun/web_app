002 · 그림 조각 맞추기

[GitHub에 올리기]  web_app 저장소 → Add file → Upload files
  → 이 002 폴더를 통째로 끌어다 놓기 → Commit changes

  앱 주소:   https://shim-sung-hyun.github.io/web_app/002/picture-puzzle.html
  그림 주소: https://shim-sung-hyun.github.io/web_app/002/picture-puzzle01.jpg (02~09 같은 방식)

[게시판 글]  차름 갤러리 · webapp 게시판
  - 웹앱주소(app_url): 위 앱 주소
  - 본문: picture-puzzle_manual.html 내용을 '소스' 모드에 붙여 넣기 (그림은 GitHub에서 불러옴)
  - 썸네일: picture-puzzle-promo.jpg 한 장만 첨부 (갤러리 카드파일 (2026-10-22 정식판: 설정 ①누구와 ②어떤 그림 ③오늘 할 단계, 오늘 할 그림 10장, 학생 기록)
  picture-puzzle.html          웹앱
  picture-puzzle-beta.html     예전 베타 주소 → 정식판으로 넘겨 줌
  picture-puzzle01~09.jpg      화면 그림 (01 설정, 02 오늘 할 그림, 03 그림 고르기 창, 04 조각 맞추기, 05 다 맞춤,
                               06 선생님 메뉴·이번 수업, 07 교사용 기록(예시 홍길동), 08 다 했어요, 09 학생 혼자)
  picture-puzzle-promo.jpg     홍보 그림·썸네일
  picture-puzzle_manual.html   게시판 본문용 설명서
  picture-puzzle_guide.html    자세한 설명
  semple.jpeg                  예시 사진
  server-loader.html           내 도메인용 불러오기 파일
  일상 그림은 001/samples/samples.json 의 끝 그림(art)을 GitHub 절대 주소로 불러옴.
  휴대폰 사진은 photo-send.html + photo-relay.php(001과 같음). 002에서 열면 안내 문장이 퍼즐용으로 바뀜(#app=puzzle).
  저장 칸: picturePuzzle.*(설정·list·log), webapp.students(명단), IndexedDB picturePuzzleMine(보관한 사진 60장).

명서

[내 도메인에서 열기] (2026-10-21)
- 주소: https://www.charum.org/study/002/picture-puzzle.html (게시판 app_url도 이 주소로)
- 서버 study/002/ 폴더에는 server-loader.html(1KB)을 picture-puzzle.html 이름으로 한 번만 올린다. 열릴 때마다 GitHub의 최신 picture-puzzle.html을 받아 그 주소에서 펼친다 → 앱을 고쳐도 GitHub에만 올리면 된다.
- 앱이 읽는 자료(목소리·예시 사진·cloud-key.html 등)는 GitHub 절대 주소로 읽는다. 상대 주소를 새로 쓰지 말 것.
- 기록·키는 그 기기 브라우저에 주소(도메인)별로 저장된다. 서버에는 아무것도 저장되지 않는다.
- 휴대폰으로 키 받기(key-relay.php)·사진 보내기·AI 중계는 받는 주소 목록에 https://www.charum.org 가 있어야 한다.
