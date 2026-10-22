001 · 일상 속 도형 찾기 (2026-10-22 정식판)

앱 주소(학생·선생님):  https://www.charum.org/study/001/shape-finder.html
GitHub 원본:           https://shim-sung-hyun.github.io/web_app/001/shape-finder.html
  서버 study/001/ 에는 server-loader.html 을 shape-finder.html 이름으로 한 번만 올려 둔다.
  shape-finder-beta.html 은 정식판으로 넘겨 주는 페이지.

[게시판 글]  차름 갤러리
  - app_url: 위 앱 주소
  - 본문: shape-finder_manual.html 을 '소스' 모드에 붙여 넣기
  - 썸네일: shape-finder-promo.jpg

파일
  shape-finder.html          웹앱
  shape-finder_manual.html   게시판 본문 / shape-finder_guide.html  자세한 설명
  shape-finder-promo.jpg     홍보 그림(1366×768)
  shape-finder01~12.jpg      화면(설정, 오늘 할 사진, 붓, 사진을 보아요, 배우기, 칠하기, 찾기, 끝 그림, 색칠, 선생님 메뉴, 모아 보기, 학생 혼자)
  samples/                   예시 사진 · samples.json(ok=true만 앱에) · ○○-art.jpg(끝 그림) · ○○-line.png(색칠 도안)
  voice/leda/                내장 목소리(Leda, 401마디) · voice-lines.json(만든 말 목록)
  sample-maker.html          (제작자) 예시 사진 도형 확인(제작자의 Gemini 키, 이름 없는 도형은 확인되지 않음)
  art-maker.html             (제작자) 예시 끝 그림 한꺼번에 그리기(결제 Gemini 키)
  line-maker.html            (제작자) 색칠 도안 한꺼번에 그리기(결제 Gemini 키, 신발장 도안이 본보기)
  donate-review.html         (제작자) 기증 사진 확인(donate.php 맨 위 확인 글자)
  cloud-key.html             Google 음성 키 만드는 법

서버(charum.org 루트): key-relay.php · photo-relay.php · donate.php
  받는 주소: https://shim-sung-hyun.github.io, https://www.charum.org, https://charum.org

예시 사진을 늘릴 때
  sample-maker → samples.json → 새 말 목소리(만들기 화면, 쓰고 지움) → 끝 그림(Gemini) → 색칠 도안(line-maker 또는 Gemini, 같은 비율)
