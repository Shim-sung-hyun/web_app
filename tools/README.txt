차름 확인 도구 — 쓰는 법
(저장소 맨 위 폴더에서 아래 글을 그대로 쳐서 돌립니다. Claude Code 세션에서는 "없는 파일 검사 돌려 줘"처럼 말하면 됩니다.)


1. 없는 파일 검사 — check-files.py

   python3 tools/check-files.py
   python3 tools/check-files.py -v      (어디서 몇 개를 봤는지도 보여 줌)

 하는 일: 앱과 설명서가 부르는 GitHub 주소(…github.io/web_app/…)의 파일이 저장소에 정말 있는지 봅니다.
   - 모든 .html 안에 적힌 주소
   - 앱 안에서 이어 붙여 만드는 주소(예: 낱말 그림 007/pics/이름.webp, 008 서식지 그림)
   - 사진 모음 목록 media/photos/photos.json
   - 목소리 묶음 목록 media/voice/(leda-0.90, leda-0.92, poem)/index.json
 결과: 맨 끝에 "없는 파일 0"이 나오면 통과입니다.
       없는 것이 있으면 "없는 파일 N"과 함께 파일 이름 ← 그 파일을 부르는 곳이 나옵니다.
 언제: 자료를 옮기거나 지운 뒤, 새 그림·소리를 넣은 뒤, 올리기 전.
 모자란 점: 학생이 고를 때 정해지는 이름(예: 먹이 놀이의 동물_자세.webp)처럼
       코드를 돌려야 알 수 있는 주소는 못 봅니다. 그런 것은 3번 캡처나 앱을 직접 열어 확인합니다.


2. 공통 모듈 검사 — check-modules.py

   python3 tools/check-modules.py
   python3 tools/check-modules.py --diff    (무엇이 다른지 줄로도 보여 줌)

 하는 일: 앱마다 똑같이 들어 있어야 하는 모듈(adminGate 관리 버튼, reportLink 오류 알리기,
   endLesson 수업 끝내기, printFit 출력, holdBubble, keyRelay, photoRelay)을 서로 비교합니다.
   앱마다 다른 것이 당연한 색·게시판 글 번호·설명 주석은 빼고 봅니다.
 결과: 모듈마다 "모두 같음" 또는 가장 많은 앱이 쓰는 판(기준)과 "다름"인 앱 이름.
 읽는 법: "다름"이 곧 잘못은 아닙니다. 앱 구조 때문에 일부러 맞춘 곳도 있습니다.
   2026-10-26 지금 알려진 것:
   - endLesson·reportLink: 007은 관리 화면 표시가 'tmode'라서, 004·005·006은 교사 전용이라서
     "선생님 화면인지" 알아보는 한 줄이 다름
   - keyRelay: 004는 키를 받는 방식이 조금 다름 / photoRelay: 001과 002가 조금 다름
   공통 모듈을 한 앱에서 고쳤다면, 이 검사로 다른 앱이 옛 판으로 남지 않았는지 봅니다.


3. 화면 캡처 — shot.js

   node tools/shot.js 008/animal-home.html
   node tools/shot.js 001/shape-finder.html --wait 3000 --step "click:#startBtn" --step "wait:1500"

 하는 일: 앱 하나를 네 가지 크기로 열어 그림으로 찍습니다.
   1366x768(전자칠판·PC) · 1024x768(태블릿 가로) · 820x1180(태블릿 세로) · phone(휴대폰 390x844)
 결과: shots/앱이름/ 폴더에 1366x768.png, 1024x768.png, 820x1180.png, phone.png
   (shots 폴더는 저장소에 올라가지 않습니다. 설명서용 캡처 앱01.jpg~는 따로 골라 넣습니다.)
 알아 둘 것:
   - 진짜 주소로 열지만 파일은 이 저장소에서 꺼내므로, 아직 올리지 않은 고친 판이 찍힙니다.
   - Gemini·Google 음성 키는 쓰지 않습니다(그 요청은 막음).
   - 글꼴을 못 받는 곳이면 --no-fonts 를 붙입니다.
   - 시작 화면 말고 다른 장면을 찍으려면 --step 을 차례대로 씁니다.
       click:선택자  tap:선택자  press:키  wait:밀리초  eval:자바스크립트
   - --full 은 화면 아래까지 길게, --only 1366x768,phone 은 고른 크기만 찍습니다.
   - 앱에서 오류가 나면 "앱 오류:", 저장소에 없는 파일을 부르면 "저장소에 없음:"이 함께 나옵니다.


4. 그림 가장자리 정리 — clean-edges.py

   python3 tools/clean-edges.py 그림.webp [그림2.webp ...]          (흰 바탕을 막 지운 그림을 그 자리에서 정리)
   python3 tools/clean-edges.py --from a555b70^ 그림.webp ...       (git의 그 판 = 정리 전 원본에서 다시 만듦)
   python3 tools/clean-edges.py --check 그림.webp ...               (고치지 않고 어두운 배경에서 보이는 흰 점 수만)

 하는 일: 흰 바탕에 그린 그림(동물·소품)을 투명 배경으로 매끈하게. 윤곽선 바깥의 '선과 흰 바탕이 섞인 점'을
   지우지 않고 선 색 + 투명도로 바꿔(섞인 만큼 투명), 흰 기운 없이 가장자리가 부드럽게 남습니다.
   그림 안에 갇힌 흰 바탕(다리·가지·풀잎 사이)도 지웁니다 — 자리는 도구 안 HOLES, 풀·나무는 ALL_WHITE_IS_BG.
   흰 털·흰 배·눈 흰자처럼 윤곽선 안의 흰색은 그대로.
 언제: 새 동물·소품 그림을 넣을 때 한 번(흰 바탕을 지운 직후 것에). 그 뒤 어두운 배경에 놓고 확대해서 보고,
   다리 사이 등에 흰 바탕이 갇혀 있으면 HOLES에 그 자리 한 점을 적고 다시 돌림.
 2026-10-31: 79장(007/pics 동물 31 · media/animals 24 · 소품 24)을 정리 전 원본(a555b70^)에서 이 방법으로 다시 만듦.
   예전 방법(밝은 점을 통째로 지움)은 가장자리가 계단처럼 거칠고 흰 점이 남았음(보이는 흰 점: 원본 23,394 → 예전 42,480 → 지금 122).


4-1. 좁은 틈 마무리 — edge-specks.py (clean-edges.py 다음에)

   python3 tools/edge-specks.py --check 그림.webp ...            (고치지 않고 점 수만)
   python3 tools/edge-specks.py 그림.webp ...                    (그 자리에 고쳐 씀)

 하는 일: 발톱·발가락·다리 사이처럼 좁은 틈에 남은 '윤곽선 + 흰 바탕' 밝은 점을 윤곽선 색으로 풀어냄(윤곽선 바깥쪽만).
 2026-10-31: 009 두더지 발톱 끝 흰 점(선생님 의견)으로 만듦. 동물 55장에 돌림.
   벌(머리와 다리 사이 흰 삼각형)·나비(몸 양옆 흰 점)는 갇힌 흰 바탕이라 그 자리만 따로 투명하게 함.
   다시 정리할 때 순서: clean-edges.py --from a555b70^ → edge-specks.py → 벌·나비는 위 자리 확인.

5. 가림 소품 목록 — props-index.py (008 숨은 동물 찾기)

   python3 tools/props-index.py

 하는 일: media/habitats/props/의 소품 그림을 모두 재서 index.json(크기·꽉 찬 부분·쓰는 곳)을 고쳐 씁니다.
 새 소품: 흰 바탕을 지운 webp를 넣고 → clean-edges.py로 가장자리 정리 → 이 도구를 돌림
   → "places가 비어 있는 소품"으로 나온 것은 index.json에서 쓰는 곳을 채우고 다시 돌림. 앱은 고치지 않아도 됩니다.
 Gemini 프롬프트와 그림체 본보기: media/habitats/props/prompts/
