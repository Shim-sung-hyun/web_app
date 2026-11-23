차름 도구 창고 — tools/ (2026-11-14 정리, 선생님)

■ 규칙 — 모든 세션(Claude·Copilot)이 같은 도구를 써야 품질이 같다
 1. 그림·소리·파일 일을 하기 전에 이 목록부터 본다. 맞는 도구가 있으면 그것을 쓴다.
 2. 조금 모자라면 새로 만들지 말고 그 도구에 선택지(--무엇)를 덧붙인다. 머리글 설명과 이 목록 줄도 함께 고친다.
 3. 정말 다른 일일 때만 새 도구를 만들고, 만들면 아래 목록의 알맞은 무리에 한 줄 올린다.
    선생님이 브라우저로 쓰는 화면(html)도 도구다(2026-11-22) — 새 화면을 만들기 전에 아래 [선생님 화면 도구]를 보고,
    있으면 주소(?app= 같은 선택지)만 드리거나 그 화면에 기능을 덧붙인다. 화면 하나 새로 만드는 데 드는 사용량이 커서
    (수백~천 줄 + 시험), 있는 것을 다시 쓰는 것이 훨씬 싸고 품질도 같다. 새로 만들면 이 무리에 한 줄.
    한 번 쓰고 말 셈은 도구로 남기지 않는다(스크래치에서 돌리고 끝).
 4. 안 쓰게 된 도구는 지우지 않고 보관함으로: python3 tools/trash.py --tool 이름.py --why "이유"
    → tools/attic/ 에 6개월. 목록 tools/attic/LIST.txt 에는 계속 남음. 다시 쓰려면 --revive 이름.py,
    6개월 지나면 --empty 로 지움(목록에 되살릴 커밋이 적혀 지운 뒤에도 살릴 수 있음).
 5. 합칠 때·고칠 때는 고치기 전 결과와 같은지(또는 나아졌는지) 견주어 본 뒤 올린다. 기준은 효율과 정확성.
 그림 도구는 numpy·Pillow·scipy가 필요(없으면 pip install scipy).

■ 목록 — 무엇을 할 때 무엇을
 [자료 찾기 — 그림·소리를 새로 구하기 전에 꼭(2026-11-22)]
  find-media.py    낱말로 찾기(비슷한 말·영어 이름·보관함까지) → 번호 붙인 그림 모음 한 장(/tmp/charum-find/) · --prompt 글(■ 항목마다 있는지)
                   · --say "문장"(목소리 있는지) · --style 연필 · --all(받은 원본까지)
  media-index.py   전체 목록 media/catalog.json 만들기(폴더마다의 목록·보관함·목소리 묶음·코드 그림을 모음) · --check 낡았는지만
                   비슷한 말·파일 이름 한글은 media/synonyms.json. 그림·소리를 넣거나 옮긴 뒤 돌림
  hooks/media-guard.py  Claude Code hook(.claude/settings.json) — 세션 시작·프롬프트 글 쓸 때 위 둘을 저절로 돌려 알려 줌(사람이 돌릴 일 없음)
 [그림 자르기 — 받은 jpg에서 투명 webp로]
  gemini-logo.py   Gemini 그림 오른쪽 아래 흰 반짝이 로고 지우기(2026-11-22) — 덮어 그린 투명도를 거꾸로 셈해 원래 색으로(결·선이 그대로).
                   자리는 저절로 찾음(보통 오른쪽·아래 96점, 48 크기) · --inplace · --out 폴더 · --check · --force(흰 바탕이라 못 찾을 때 기본 자리). 투명도 지도 gemini-logo-alpha48.png
  bing-cut.py      빙 연필풍(흰 종이) 그림 자르기. 소품(기본, 회색 그림자 함께) · --animal 몸만 · --plant 가지 사이도 투명
                   · --holes 몸 안 큰 틈 · --white 흰색을 통째로 투명(가는 물풀)
  flat-shadow.py   그림자를 파랑(빨강)으로 받은 소품: 그림자 모양만 써서 검정 20%로 고르게. --key blue|red · --plant · --alpha
  bark-fill.py     flat-shadow --plant 로 자른 나무의 줄기에 뚫린 밝은 껍질을 되살림(초원 나무, flat-shadow 뒤에)
 [가장자리 정리 — 자른 뒤 흰 테두리·흰 점]
  defringe.py      빙 연필풍 그림(지금 무대): 흰 테두리·잎 사이·갇힌 종이. --plant · --gaps · --pockets · --rim · --fill · --paper(뿌리처럼 촘촘한 틈의 회백색 종이까지, --below) · --tint --bg(흰 곳을 배경색으로 물들임 — 잔뿌리·풀·수풀) · --halo(빽빽한 풀·덤불 둘레 흰 조각, 옅은 풀잎엔 쓰지 말 것) · --edge .03(가장자리 띠 안의 두꺼운 흰 종이만 — 가운데 흰 잔가지는 그대로) · --zone x0,y0,x1,y1(정한 사각형 안 갈래 사이 흰 종이 — 나무마다 구역을 눈으로)
  clean-edges.py   옛 만화풍(흰 바탕 지운 동물·낱말·008 소품·010 성): 섞인 점을 선 색 + 투명도로, 좁은 틈 마무리까지 한 번에. --check · --specks · --keep-white(흰 몸이 많은 그림 — 흰 벽이 지워지지 않게)
                   (두 도구는 그림 종류가 달라 따로 둠 — 빙 연필풍은 defringe, 굵은 윤곽선 만화풍은 clean-edges)
 [무대 — media/stage/]
  stage-intake.py  받은 폴더를 무대에 한 번에(자르기·정리·stage.json·밑동·목록까지 위 도구들을 차례로 부름). 새 무대는 이것부터
  src-align.py     받은 원본에서 소품 자리를 찾아 src/이름.jpg로(소품 손질 touchup.html의 '원본 색 붓'이 지워진 색을 되살림) · --dir 받은폴더 장소폴더(이름째 한 번에) · --paper(북극처럼 미색 종이를 눈색으로 맞춰 자른 소품 — 원본도 같게 맞추고 얼음 푸른 기는 저절로 고름). stage-intake가 넣을 때 자동으로 부름 · 줄기를 늘인 뿌리(trunk-extend)도 저절로
  trunk-extend.py  매다는 줄기+뿌리 그림의 줄기를 세로로 늘이고 hangAt 적음(땅속) · --up 줄기 길이 배 · --green 풀 포기(풀잎 끝만 잼, 안 늘임)
  prop-room.py     소품실 — 모든 무대 소품 목록(media/stage/props.json, 보기 media/stage/prop-room.html) · --borrow 받을무대 소품 [--as 새이름] 다른 무대 소품을 그림 옮기지 않고 빌려 씀(밑동 땅 묶음이 다르면 멈춤). stage-intake가 끝에 부름
  stage-meta.py    그림마다 밑동 자리를 재어 stage.json에(지금 무대 + legacy) · stage-index.py 008 옛 길 가림 목록 media/stage/legacy/hide-index.json
  props-index.py   008 가림 소품 목록·동물 모양 표(masks.json)
 [검사·캡처]
  check-files.py   앱이 부르는 파일이 저장소에 다 있는지 + 전체 목록이 최신인지("목록에 없는 파일 0") · check-modules.py 앱마다 같아야 할 모듈 비교
  shot.js          앱을 네 크기로 캡처 · hide-check.js 008 숨은 동물이 너무 가려지는지
  learn-scene.js   학습용 장면 learn.jpg(무대 소품을 채운 한 장, 동물 서는 앞 땅은 비움 — 008 학습 장면) · 곳 이름과 --seed로 다시, 고른 seed는 media/stage/learn-scene.json
  webp-slim.py     다 만든 소품·동물 webp를 마지막에 가볍게 — 색 품질 80, 알파·가로세로 그대로(밑동·모양 지도·touchup 원본 붓이 그대로 맞음), 8% 넘게 줄 때만. stage-intake가 부름, touchup 손질 뒤에도
  promo-pencil.html 연필풍 앱(008·009)의 홍보 그림 — ?app=009(캡처 폴더 cap=008/release, 대신 쓸 캡처 shots=03,05,09,11)를 1366×768로 찍어 앱-promo.jpg
 [공통 모듈·자료]
  sync-modules.py  common/의 모듈 원본을 앱마다 넣기 · voice-add.py 목소리 zip을 mp3로 넣기 · trash.py 버릴 파일(그림·사진·소리는 저절로 media/archive 보관함 — 비우지 않음)·버린 도구 보관함
  (007/tools/split.py 는 007 편 판 만들기 — 007 README)

 [선생님 화면 도구 — 브라우저로 여는 html(주소: https://shim-sung-hyun.github.io/web_app/ + 경로). 자리는 옮기지 않음(주소가 바뀌면 불편)]
  tools/index.html                  도구 모음 한 장(선생님이 열어 보는 곳, https://shim-sung-hyun.github.io/web_app/tools/) — 아래 화면을 새로 만들거나 바꾸면 여기도 함께 고침
  media/voice/voice-maker.html      목소리 만들기(?app=010처럼 앱 고르기) → 받은 zip은 voice-add.py
  media/prompts/copy.html           프롬프트 복사(?f=파일이름, 단추로 복사·복사한 장은 노랗게) — 새 글은 FILES에 한 줄
  media/photos/collect.html         사진 모으기 · snap.html 사진 넣기 · review.html 사진 검토(절차 media/photos/REVIEW.md)
  media/stage/install.html          무대 설치(장소 고르기부터 — AI로 채우기: 제미나이 키·Gemini 3.5 Flash Lite, 그림풍·AI 고르기, 내 저장소 그림 열기) · arrange.html 배치 고치기 · touchup.html 소품 손질(짝 src-align.py)
  media/stage/prop-room.html        소품실 보기(짝 prop-room.py) · test.html 무대 보기 · hide-test.html 숨기기 시험(?place=) · hide-judge.html 숨기기 평가
  charum.org/charum-api/usage-admin.php  앱 사용 횟수(관리자 로그인, 원본 server/charum-api/usage-admin.php, 2026-11-23)
  tools/promo-pencil.html           홍보 그림 찍기(위 [검사·캡처]) · tools/gemini-model-test.html Gemini 키·모델 연결 시험(사진 분석 시간·빠르기 순위, 1분 넘으면 중지, 표시된 모델 차례로)
  gemini_guide · google-tts_guide · cloudflare_guide · azure_guide · elevenlabs_guide · bing_guide .html  키·서비스 받는 법(서비스마다 하나, 저장소 맨 위) — 필요한 곳은 여기에 링크만(2026-11-23)
  (relay/·server/study/의 화면은 수업용 사진 다리 — 앱의 일부라 여기 넣지 않음)

■ 보관함(tools/attic/, 2026-11-14 넣음 — 2027-05-13 뒤 지울 수 있음): 자세한 까닭은 tools/attic/LIST.txt
  cast-shadow · shadow-split · pencil-cut(→ bing-cut·flat-shadow가 대신) · soak-base · bury-base · line-unify(연필풍 무대에서 안 씀)
  white-to-alpha(→ bing-cut --white) · edge-specks(→ clean-edges 마지막 단계)


아래는 도구마다 자세한 쓰는 법.

(저장소 맨 위 폴더에서 아래 글을 그대로 쳐서 돌립니다. Claude Code 세션에서는 "없는 파일 검사 돌려 줘"처럼 말하면 됩니다.)


1. 없는 파일 검사 — check-files.py

   python3 tools/check-files.py
   python3 tools/check-files.py -v      (어디서 몇 개를 봤는지도 보여 줌)

 하는 일: 앱과 설명서가 부르는 GitHub 주소(…github.io/web_app/…)의 파일이 저장소에 정말 있는지 봅니다.
   - 모든 .html 안에 적힌 주소
   - 앱 안에서 이어 붙여 만드는 주소(예: 낱말 그림 media/words/이름.webp, 008 서식지 그림)
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
   - keyRelay·photoRelay·adminHold·adminGate·holdBubble(관리 버튼): 2026-11-11 common/으로 옮겨 한 판이 됨(sync-modules.py가 맞춤)
   공통 모듈을 한 앱에서 고쳤다면, 이 검사로 다른 앱이 옛 판으로 남지 않았는지 봅니다.


2-1. 공통 모듈 넣기 — sync-modules.py

   python3 tools/sync-modules.py            (common/이름.js 원본을 앱의 <script id="이름"> 칸에 넣음)
   python3 tools/sync-modules.py --check    (바꾸지 않고, 원본과 다른 앱만 보여 줌)

 하는 일: 공통 모듈 원본은 common/ 한 곳에만 둡니다. 원본을 고친 뒤 이 도구를 돌리면
   그 모듈을 쓰는 모든 앱에 같은 판이 들어갑니다. 앱은 지금처럼 HTML 한 파일로 열립니다.
 새 앱에 넣을 때: 앱 본문 <script> 앞에 빈 칸 <script id="roster"></script>를 두고 돌립니다.
 지금 원본이 있는 모듈: roster(학생 명단 — 넣기·빼기, 뺀 학생 기록 6개월 보관)
 007은 통합본에 넣은 뒤 split.py도 돌립니다.


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


4-1. 좁은 틈 마무리 — 2026-11-14부터 clean-edges.py의 마지막 단계(옛 edge-specks.py)

   python3 tools/clean-edges.py --specks 그림.webp ...          (이미 정리한 그림에 이 단계만)

 하는 일: 발톱·발가락·다리 사이처럼 좁은 틈에 남은 '윤곽선 + 흰 바탕' 밝은 점을 윤곽선 색으로 풀어냄(윤곽선 바깥쪽만).
 2026-10-31: 009 두더지 발톱 끝 흰 점(선생님 의견)으로 만듦. 동물 55장에 돌림.
   벌(머리와 다리 사이 흰 삼각형)·나비(몸 양옆 흰 점)는 갇힌 흰 바탕이라 그 자리만 따로 투명하게 함.
   다시 정리할 때: clean-edges.py --from a555b70^ (좁은 틈까지 함께) → 벌·나비는 위 자리 확인.

4-2. 숨은 동물 찾기 검사 — hide-check.js (008)

   node tools/hide-check.js [몇 번=5]      (저장소 맨 위에서, playwright 필요 — 클라우드 세션엔 있음)

 하는 일: 서식지마다 쉬움·보통·어려움 장면을 실제로 만들어, 찾을 동물이 앞의 소품·다른 동물에 가려지고 남은 점 수를 셈.
   완전히 가려진(60점 미만) 동물 목록·비율과, '제 소품만으로'인지 '다른 것에'인지를 보여 줌.
 2026-11-01(009 세션, 3번씩): 쉬움 4% · 보통 16% · 어려움 9%가 완전히 가려짐. 거의 모두 제 소품이 아니라
   뒤에 놓인 다른 동물의 소품·빈 소품·다른 동물에 가려짐(사자·전갈을 못 찾은 까닭).
 2026-11-01(008 세션에서 고친 뒤, 5번씩 세 차례): 쉬움·보통·어려움 모두 0%.
 보이는 몫(동물 칠해진 점 중 보이는 %)도 셈: 목표 범위(쉬움 50~65 · 보통 25~35 · 어려움 10~18%, ±5) 안에 든 비율과 목표 밖 목록.
   2026-11-01 실제 모양 방식으로 바꾼 뒤: 세 단계 모두 100% 안(가운데 58 · 31 · 15%).

5. 가림 소품 목록 — props-index.py (008 숨은 동물 찾기)

   python3 tools/props-index.py

 하는 일: media/habitats/props/의 소품 그림을 모두 재서 index.json(크기·꽉 찬 부분·모양 표·쓰는 곳)을 고쳐 쓰고,
   008이 쓰는 동물 그림의 모양 표 media/animals/masks.json도 만듭니다(48칸, 칸마다 칠해졌는지 — 앱이 가려지는 %를 셈).
   동물·소품 그림을 바꾸거나 새로 넣으면 꼭 다시 돌림.
 새 소품: 흰 바탕을 지운 webp를 넣고 → clean-edges.py로 가장자리 정리 → 이 도구를 돌림
   → "places가 비어 있는 소품"으로 나온 것은 index.json에서 쓰는 곳을 채우고 다시 돌림. 앱은 고치지 않아도 됩니다.
 Gemini 프롬프트와 그림체 본보기: media/prompts/


6. 목소리 넣기 — voice-add.py (목소리 만들기 도구 media/voice/voice-maker.html 과 짝)

   python3 tools/voice-add.py 받은파일.zip         (--dry 로 보기만)

 하는 일: voice-maker.html에서 받은 zip(wav + voice-meta.json)을 mp3로 바꿔 media/voice/<묶음>/에 넣고 index.json(files·used_by)을 고칩니다.
   한 글자 이름("개.")은 "글자. 개."로 만든 소리라 마지막 마디만 잘라 넣습니다. 문장과 파일 이름(SHA-1 앞 16자리)이 맞지 않으면 넣지 않습니다.
   Azure로 만든 소리는 Leda와 목소리가 달라 같은 묶음에 넣지 않습니다(--pack 다른묶음).

- trash.py : 버릴 자료 상자. 안 쓰는 파일을 _trash/<날짜>/로 옮기고(--why 이유), 90일 지나면 --empty로 비움. 도구는 --tool(tools/attic/, 180일)·--revive
- defringe.py : 흰 테두리·틈 지우기(2026-11-13). 동물·소품 둘레의 흰 테두리, 가지·갈기 사이 흰 종이를 지움(안쪽 흰 곳은 남김). 풀·나무는 --plant(잎 사이 종이도, 잎 속 흰 점은 잎 색으로), 줄기가 하얗지 않은 나무는 --gaps(가지 사이 종이), 바위·흙은 --depth 3 --fill(몸 안 작은 구멍 메움). 잔뿌리 사이처럼 촘촘한 틈의 살짝 회색인 종이는 --paper [185] --below <줄기 몫>(2026-11-15 땅속 뿌리 — 흰 바위·흰 털에는 쓰지 말 것). 지우면 끊기는 잔뿌리·풀·수풀의 흰 기는 --tint --bg 배경.jpg [--band y0,y1](흰 곳을 그 무대 배경색으로 물들임). 초원(2026-11-15): 빽빽한 풀·덤불 둘레는 --halo, 회백색 잔가지 덤불처럼 가운데 흰 곳이 필요한 것은 --edge .03(바깥에서 3% 띠 안만). 제자리에서 고침, --dry는 셈만.
- stage-intake.py : 받은 빙 연필풍 그림(배경·소품·동물)을 무대 베타에 한 번에 넣기(2026-11-13). 무대 폴더의 intake.json을 읽어 옛 그림 버리기·자르기·흰 종이 지우기·stage.json·밑동·차림표까지. python3 tools/stage-intake.py nature/forest 받은폴더 [--dry]
  그림자 없이 받은 곳(땅속·물속·바닷속·하늘)은 intake.json "shadow": false — 소품을 bing-cut.py로 자름. view·beds·bed·hangTop·dim·hideWeight 같은 무대 값도 intake.json에서 stage.json으로 옮김
- trunk-extend.py : 줄기+뿌리 그림(2026-11-14 땅속). 줄기가 뿌리로 갈라지는 줄(줄기 폭이 위 끝보다 30% 넓어지는 곳)을 찾아 그 위 줄기를 세로로 늘이고(이어 붙이면 이음매가 사다리처럼 보였음) stage.json에 hangAt·hangUp·real을 적음 — 무대가 그 줄을 흙 맨 위에 붙임. 풀 포기는 --green(풀잎 끝 줄만). python3 tools/trunk-extend.py nature/underground treeroots
- bing-cut.py --white: 흰 종이를 완전히 투명하게(가늘고 촘촘한 물풀의 흰 테두리 없애기, 2026-11-14 물속 검정말·붕어마름 — 옛 white-to-alpha.py)
