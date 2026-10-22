005 · 숫자 익히기 (자릿값 읽기)

[GitHub에 올리기]  web_app 저장소 → Add file → Upload files
  → 이 005 폴더를 통째로 끌어다 놓기 → Commit changes

  앱 주소:   https://shim-sung-hyun.github.io/web_app/005/place-value.html
  그림 주소: https://shim-sung-hyun.github.io/web_app/005/place-value01.jpg (02~06 같은 방식)

[게시판 글]  차름 갤러리 · webapp 게시판
  - 웹앱주소(app_url): 위 앱 주소
  - 본문: place-value_manual.html 내용을 '소스' 모드에 붙여 넣기 (그림은 GitHub에서 불러옴)
  - 썸네일: 첨부 파일이 없으면 본문 첫 그림(홍보 그림)이 저절로 썸네일. 옛 그림이 남으면 place-value-promo.jpg를 첨부해 다시 등록

파일
  place-value.html          웹앱
  place-value01~06.jpg      화면 그림 1366×768 (01 자리 고르기, 02 수 화면, 03 0이 들어간 수, 04 사용법 말풍선, 05 학생 기록, 06 큰 수)
  place-value-promo.jpg     홍보 그림·썸네일 (수학 청록)
  place-value_manual.html   게시판 본문용 설명서 (짧게: 안내 → 홍보 그림 → 바로 열기 → 세 단계 → 선생님 메뉴·학생 기록 → 자세한 설명)
  place-value_guide.html    자세한 설명 (수업 흐름, 자리 칩과 모양, 기록 읽는 법, 알아 둘 점)
  place-value-beta.html     정식판으로 넘겨 주는 주소 (2026-10-22 합침)
  voice/leda/               목소리(미리 만든 Google Leda 조각, mp3 + index.json). 키 없이 씀
                            수를 자리마다 조각(예: 삼만 / 이천·오백·칠)으로 이어 읽음

[내 도메인에서 열기] (2026-10-21)
- 주소: https://www.charum.org/study/005/place-value.html (게시판 app_url도 이 주소로)
- 서버 study/005/ 폴더에는 server-loader.html(1KB)을 place-value.html 이름으로 한 번만 올린다. 열릴 때마다 GitHub의 최신 place-value.html을 받아 그 주소에서 펼친다 → 앱을 고쳐도 GitHub에만 올리면 된다.
- 앱이 읽는 자료(목소리·예시 사진·cloud-key.html 등)는 GitHub 절대 주소로 읽는다. 상대 주소를 새로 쓰지 말 것.
- 기록·키는 그 기기 브라우저에 주소(도메인)별로 저장된다. 서버에는 아무것도 저장되지 않는다.
- 휴대폰으로 키 받기(key-relay.php)·사진 보내기·AI 중계는 받는 주소 목록에 https://www.charum.org 가 있어야 한다.

[2026-10-22 고침]
- 수학 영역 색: 청록 #1B6E87, 연한 모눈 바탕, 흰 카드 왼쪽 띠, 제목 옆 1·0·0 네모. 숫자는 늘 한 색(자리마다 색을 바꾸지 않음).
- 한 수업은 한 목소리(소리 조각을 하나라도 못 받으면 처음 화면으로 갈 때까지 기기 목소리 + 아래에 알림).
- http 주소에서도 내장 목소리(SHA-1 직접 계산). 전자칠판 터치(수 화면은 닿는 순간, 단추는 60px·취소도 누름). 휴대폰 위 줄 좌우 밀기.
