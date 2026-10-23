003 · 차름 색깔 무지개 찾기 (예전 이름 무지개 색 찾기 — 파일 이름·주소·저장 칸은 그대로)

주소
  앱:      https://www.charum.org/study/003/rainbow-finder.html  (서버 study/003/에는 server-loader.html을 이 이름으로 한 번만)
  GitHub:  https://shim-sung-hyun.github.io/web_app/003/rainbow-finder.html
  게시판:  차름 webapp 59262 · app_url은 내 도메인 주소 · 본문은 rainbow-finder_manual.html(소스 모드) · 썸네일 rainbow-finder-promo.jpg

파일
  rainbow-finder.html          웹앱
  rainbow-finder01~11.jpg      화면(1366×768): 01 설정 · 02 ③ 오늘 할 단계(기록 보고 권하기) · 03 같은 색 찾기 · 04 터지는 순간 · 05 도와주기
                               · 06 물건 모양 · 07 이름 듣고 찾기 · 08 학생 혼자 고르기 · 09 끝 · 10 선생님 메뉴 · 11 교사용 기록(예시 홍길동)
  rainbow-finder-promo.jpg     홍보 그림·썸네일
  rainbow-finder_manual.html   게시판 본문
  rainbow-finder_guide.html    자세한 설명
  (내장 목소리는 차름 소리 모음 ../media/voice/leda-0.92/ — Leda 0.92, 001·005·006과 함께)
  voice-lines.json             앱이 하는 말 전체(앱 콘솔 __voiceLines()와 같음, 24마디)

목소리 (2026-10-22)
  키 없이 내장 목소리 24마디(2026-10-22 모두 넣음, 만들기 화면은 지움. 새 말이 생기면 001처럼 만들기 화면을 다시 만들어 쓰고 지움).
  말 24마디 가운데 하나라도 없으면 그 수업 전체를 기기 목소리로(섞지 않음).
  Cloud 키·휴대폰으로 키 받기·목소리 세 가지는 앱에서 뺐다.
  cloud-key.html은 이 앱에선 안 쓰지만 공통 key-send.html·photo-send.html이 링크하므로 지우지 않는다.

저장 칸
  localStorage colorFind.* (설정, rec = 기록 중 학생, log = 기록), 명단 webapp.students(다른 앱과 함께)
  기록 한 줄 = 문제 하나 {s,t,g(판),c,res(first/retry/help),wrong,way,look,n,k,sp,hp,mode}
