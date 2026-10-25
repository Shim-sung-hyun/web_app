charum.org 서버(라이믹스와 같은 맨 위 폴더)에 올리는 파일의 원본입니다. GitHub Pages에서는 돌지 않습니다.

  donate.php  사진 기증함(2026-10-23 판). 올린 뒤 서버에서 맨 위 $REVIEW_TOKEN 따옴표 안에
              제작자만 아는 20자 이상 글자를 넣으세요. 이 저장소의 원본에는 절대 넣지 않습니다.
              점검: 주소창에서 https://charum.org/donate.php → "token_set": true · "version": "2026-10-23" 이면 확인 화면이 열림.
              확인 화면: 관리자 로그인 → donate-admin.php(아래). 확인 글자로 여는 예전 화면 review.html도 그대로 씀.

donate-admin.php  기증 사진 관리자 화면(2026-10-25). donate.php와 같은 곳(맨 위 폴더)에 올림.
              charum.org에 "관리자"로 로그인한 사람만 열림(확인 글자 필요 없음). 기증 사진 보기 · 골라 zip · 서버에서 지우기.
              주소: https://www.charum.org/donate-admin.php  (로그인 안 했으면 "로그인" 단추가 나옴)

addons/charum_donate/  애드온 "차름 기증 사진 탭"(2026-10-25). 폴더째 서버의 addons/ 안에 올림
              → 관리자 화면 > 고급 > 애드온 > "차름 기증 사진 탭"을 PC·모바일 모두 사용으로.
              관리자로 로그인하면 회원 메뉴(회원정보 보기 · 스크랩 보기 · 저장함 보기 …) 끝에 "기증 사진 N" 탭이 붙음
              (N = 기다리는 장 수, 빨간 숫자 — 0장이면 숫자 없음). 누르면 donate-admin.php.

study/doc.html  설명 페이지 불러오기(2026-10-23). 서버 study 폴더에 한 번만 올림.
              https://www.charum.org/study/doc.html?001/shape-finder_guide 처럼 열면 GitHub의 설명 페이지를
              가져와 내 도메인 주소로 보여 줌. 여는 것: 이름이 _guide · record-guide · cloud-key · gemini-key 로 끝나는 페이지.
              설명 페이지는 그림·링크를 GitHub 절대 주소로 쓴다(상대 주소 금지). 새 설명 페이지도 이 주소로 링크.

key-relay.php · photo-relay.php 원본은 아직 여기 없습니다(서버에만 있음).
