차름 사진 다리 (2026-10-25)
선생님들이 연수에서 만든 웹앱이 "휴대폰 사진 → 전자칠판·태블릿"을 받도록 charum.org 서버가 중계한다.

  charum-relay.js   선생님 앱에 넣는 모듈(한 줄). CharumRelay.receive / pick / button / toDataURL
  send.html         휴대폰 보내기 화면(보낸 뒤 "이 사진, 나눠 주실래요?" — 고른 사진만 donate.php로, app 900, 관리자 화면에서 검수)
                    → 서버 www.charum.org/study/send.html(불러오기)로 연다. QR: …/study/send.html#c=번호6자리(&one=1)
  get.html          앱 없이 받기 페이지(크게 보기·복사·내려받기) → www.charum.org/study/get.html. 연수 코드 "get"
  example.html      연수 실습용 예시 앱(우리 반 사진 카드). 연수 코드 "demo"
  relay_guide.html  선생님 안내 + Claude에 붙여 넣을 문장 → www.charum.org/study/doc.html?relay/relay_guide

서버: server/charum-api/relay.php · relay-lib.php · relay-admin.php (관리자 화면에서 연수 코드를 켜고 끔)
잠금: ECDH P-256 → HKDF(salt "charum-relay|번호", info "v1") → AES-GCM. 내용 "CRL1"+머리 길이 4바이트+머리 JSON+사진.
차름 앱(001·002)의 photo-relay.php와는 따로 둔다.
  relay_manual.html 차름 게시판 본문(소스 모드로) · 썸네일 relay-promo.jpg · 캡처 relay01~05.jpg
  relay-handout.html 연수용 A4 안내지(?code=연수코드&until=2026-11-30 으로 채워 인쇄, 비우면 손으로 쓰는 칸)
연수 코드는 연수마다 새로 만들고 끝나는 날을 정한다(2026-10-25 선생님 결정). 쓰임새가 쌓이면 늘 쓰는 코드를 따로 연다.

■ 파일 보내기 (2026-10-29) — 사진 다리와 따로, 연수 코드 없이 누구나
  file.html         한 페이지에 두 역할: 그냥 열면 받는 쪽(QR·번호 6자리, 받은 파일 열기·내려받기), #c=번호 또는 #send면 보내는 쪽.
                    → 서버 www.charum.org/study/file.html(불러오기, 원본 server/study/file.html)로 연다.
  서버: server/charum-api/file-relay.php (기록 file-relay-data/). 파일마다 ECDH P-256 → HKDF(salt "charum-file|번호") → AES-GCM,
        이름·크기도 잠금, 1MB씩 나눠 올림, 받는 쪽이 다 풀면(ack) 지움. 영상은 보내는 화면에서 막음(MIME·확장자).
  번호: 처음 5분, 파일 조각이 올 때마다 다시 5분, 길어도 30분(끝나면 "새 번호 받기", 받은 목록은 남음). 받는 화면에 두 길(휴대폰 QR / 다른 컴퓨터는 같은 주소 → "이 컴퓨터에서 보내기" → 번호, 끌어다 놓기).
  한도: 파일 하나 10MB, 기기마다 하루 20개(보내는 화면 localStorage charumFile.day), 서버는 IP 하루 100개·이달 30GB 안전판(?ping에 이달 사용량).
  색: 먹빛 남보라 #4A5A8C, 접힌 모서리 무늬(사진 다리 #3F6A86과 다르게).
