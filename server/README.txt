charum.org 서버에 올리는 파일의 원본입니다. GitHub Pages에서는 돌지 않습니다.
(2026-10-25부터 웹앱 서버 파일은 서버 맨 위의 charum-api/ 폴더 하나에 모읍니다. 라이믹스 파일과 섞이지 않게.)

■ 서버의 자리
  /charum-api/          웹앱 서버 파일과 그 기록 폴더(아래). 폴더 이름은 게시판 이름(mid)과 겹치면 안 됨(라이믹스 403).
  /study/               앱 불러오기 파일(NNN/server-loader.html)과 설명 페이지 불러오기 doc.html — 게시판 주소가 걸려 있어 그대로.
  /addons/charum_donate/  애드온(라이믹스는 애드온을 addons 폴더에서만 찾음).
  / (맨 위)             웹앱 파일을 두지 않음(2026-10-25에 다리 파일까지 지움 — 예전 주소 /donate.php 등은 404가 정상).

■ charum-api/ (이 저장소 server/charum-api/)
  donate.php        사진 기증함(2026-10-23 판). 맨 위 $REVIEW_TOKEN 에 제작자만 아는 20자 이상 글자를 서버에서만 넣음(저장소에는 넣지 않음).
                    기록: charum-api/donate-data/ (스스로 만들고 웹에서 막음). 점검: /charum-api/donate.php → "ok": true
  donate-admin.php  기증 사진 관리자 화면(관리자 로그인으로 열림). 주소: https://www.charum.org/charum-api/donate-admin.php
                    라이믹스를 한 칸 위(맨 위 폴더)의 common/autoload.php 로 불러옴.
                    "고른 것 보내기" → 비공개 저장소 charum-inbox. 절차는 media/photos/REVIEW.md.
  donate-config.php (저장소에는 donate-config.sample.php만) GitHub 토큰(charum-inbox 하나만, Contents 읽기·쓰기). 채팅·저장소에 넣지 않음.
  puzzle-rank.php   내 그림 퍼즐(002) S·S+ 모든 학교 순위표. 기록: charum-api/puzzle-rank-data/. 점검: ?ping → "ok": true
                    잘못된 별명을 지우려면 맨 위 $ADMIN_TOKEN 에 20자 이상 글자를 서버에서만 넣고 act:"del".
  key-relay.php · photo-relay.php  휴대폰에서 키·사진 받기(잠가서 3분, 받는 순간 지움). 기록: charum-api/key-relay-data/.
                    원본은 아직 서버에만 있음(내용을 받으면 여기에 넣음).
  relay.php · relay-lib.php  차름 사진 다리(2026-10-25). 선생님들이 연수에서 만든 앱이 휴대폰 사진을 받게 중계.
                    photo-relay.php와 따로(차름 앱에 영향 없게). 연수 코드가 켜져 있어야 번호를 만듦. 한 번 찍고 여러 장(30장).
                    한도: 한 달 전송량 안전판 60GB · 한 장 4MB · IP 하루 번호 300·사진 600. 기록: charum-api/relay-data/.
                    점검: /charum-api/relay.php?ping → "ok": true
  relay-admin.php   사진 다리 관리자 화면(관리자 로그인). 연수 코드 만들기·켜고 끄기·끝나는 날·하루 한도, 이달 사용량, 부른 주소.
                    주소: https://www.charum.org/charum-api/relay-admin.php

■ addons/charum_donate/  애드온 "차름 기증 사진 탭". 관리자로 로그인하면 회원 메뉴 끝에 "기증 사진 N" · "사진 다리"(이달 전송량이 안전판 80%를 넘으면 빨간 %).
  charum-api/donate-data/ 와 charum-api/donate-config.php 를 읽음. 관리자 > 고급 > 애드온에서 PC·모바일 사용.

■ study/doc.html  설명 페이지 불러오기(2026-10-23). 서버 study 폴더에 한 번만.
  https://www.charum.org/study/doc.html?001/shape-finder_guide 처럼 열면 GitHub의 설명 페이지를 내 도메인 주소로 보여 줌.
  여는 것: 이름이 _guide · record-guide · cloud-key · gemini-key 로 끝나는 페이지.

■ study/send.html · study/get.html  사진 다리의 휴대폰 보내기·큰 화면 받기 불러오기(본문은 GitHub relay/). 서버 study 폴더에 한 번만.
  doc.html은 relay/relay_guide 도 열도록 고침(2026-10-25) — 다시 올려야 함.

■ 받는 주소(CORS): https://shim-sung-hyun.github.io · https://www.charum.org · https://charum.org (relay.php만 누구나 — 연수 코드로 막음). 오류도 200 + {"error":…}.
