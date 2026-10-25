차름 사진 다리 (2026-10-25)
선생님들이 연수에서 만든 웹앱이 "휴대폰 사진 → 전자칠판·태블릿"을 받도록 charum.org 서버가 중계한다.

  charum-relay.js   선생님 앱에 넣는 모듈(한 줄). CharumRelay.receive / pick / button / toDataURL
  send.html         휴대폰 보내기 화면 → 서버 www.charum.org/study/send.html(불러오기)로 연다. QR: …/study/send.html#c=번호6자리(&one=1)
  get.html          앱 없이 받기 페이지(크게 보기·복사·내려받기) → www.charum.org/study/get.html. 연수 코드 "get"
  example.html      연수 실습용 예시 앱(우리 반 사진 카드). 연수 코드 "demo"
  relay_guide.html  선생님 안내 + Claude에 붙여 넣을 문장 → www.charum.org/study/doc.html?relay/relay_guide

서버: server/charum-api/relay.php · relay-lib.php · relay-admin.php (관리자 화면에서 연수 코드를 켜고 끔)
잠금: ECDH P-256 → HKDF(salt "charum-relay|번호", info "v1") → AES-GCM. 내용 "CRL1"+머리 길이 4바이트+머리 JSON+사진.
차름 앱(001·002)의 photo-relay.php와는 따로 둔다.
