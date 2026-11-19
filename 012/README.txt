012 팝아트 변환기 (차름 AI · 제작자/교사용 도구, 학생용 앱 아님) — 2026-11-19 정리
사진 한 장을 ① AI 변환 ② 필터 ③ 필터+AI로 그려 보고, 워홀 4칸·색칠 도안·말풍선·대사 추천·전시판까지 만드는 화면.

파일
- index.html        : popart.html로 보내는 안내 페이지
- server-loader.html: 정식판 서버 study/012/에 올리는 불러오기 파일(GitHub의 popart.html을 이 주소에서 펼침)
- popart.html       : 앱 한 파일. 필터는 브라우저에서, AI 해석·변환은 아래 워커/구글에 요청
- server/worker/charum-ai/ : 워커 원본(src/index.js) · 설정(wrangler.jsonc) · 배포 안내(README.md)
- tools/gemini-model-test.html : 제작자가 해석 모델을 고른 테스트 화면
- 설명서(_manual·_guide)와 캡처는 아직 없음(2026-11-19). 화면이 바뀌었으므로 다음에 찍어 올릴 것.

AI 키·할당량 구조 (2026-11-19 선생님 정함, 오늘 작동 확인)
- 화면 조절판의 "API 자격 증명" 칸에서 ① Cloudflare Account ID ② Cloudflare API Token ③ Gemini API Key를 받는다.
  키는 localStorage/cookie에 넣지 않고 **페이지가 열려 있는 동안 메모리에만** 둔다(pagehide에서 지움).
- Gemini 키가 있을 때
  1. Gemini 이미지 생성(gemini-3.1-flash-image)으로 먼저 그려 본다.
  2. 한도·오류로 막히면 사진 해석 모델을 순서대로 시도한다:
     GEMINI_TEXT_MODELS = [gemma-4-26b-a4b-it(1순위), gemma-4-31b-it, gemini-3.1-flash-lite-preview, gemini-3.5-flash-lite, gemini-flash-lite-latest].
     해석글이 위 프롬프트에 붙고, 최종 그림은 Cloudflare AI가 만든다.
  3. **해석 모델이 다 막히면 useCloudflareVision:true를 보내 Cloudflare 비전이 사진을 해석**한 뒤 그림을 만든다(2026-11-19 보완).
- Gemini 키가 없을 때: useCloudflareVision:true로 워커에 보내 Cloudflare가 해석 → Cloudflare가 변환.
- 개인 Cloudflare 계정(ID+토큰 모두 입력)이 있으면 그 계정의 Workers AI 할당량으로 해석·변환(제한 없음).
- 계정이 없으면 개발자 AI 바인딩. 웹앱이 기기에 저장한 익명 번호(webapp.deviceId)로 KV에 한국 날짜별 하루 3회.
  IP·학생 이름은 저장하지 않고 48시간 뒤 KV 기록 삭제. 429를 받으면 "오늘의 한도(3회)"로 안내.
- ③ 필터+AI: 윤곽 이미지(guide)를 워커가 input_image_1로 FLUX에 넘겨 실제로 반영한다(옛 워커는 버림).
  FLUX 참조 이미지는 512px 미만이라 사진·윤곽 모두 480px로 보낸다.
- "사진 보고 자동 설정"·"대사 추천"은 Gemini 키가 있으면 직접, 없으면 워커의 /gemini 중계(개발자 GEMINI_KEY)를 쓴다.

주소·배포
- 지금 WORKER_URL은 옛 주소 https://charum-ai.simdoly.workers.dev/cartoon (새 워커도 같은 경로를 처리).
- 새 워커 배포: server/worker/charum-ai/README.md 참고. KV(LIMITS) id 넣고, 필요하면 GEMINI_KEY 시크릿 넣고, wrangler deploy.
  같은 이름(charum-ai)으로 배포하면 옛 주소가 새 코드가 된다.
- 정식판은 charum.org에서 불러오므로 Worker ALLOW에 https://www.charum.org · https://charum.org가 필수(없으면 403).
- 새 주소로 바꿨다면 popart.html의 WORKER_URL만 고치면 됨(서버 study/012/의 불러오기 파일도 최신 HTML을 가리켜야 함).

다음 할 일
1. 선생님: 워커 배포 → /ping에서 version 2026-11-19.2 확인.
2. 배포 후 ①②③ 각각 돌려 보기. 특히 ③이 윤곽을 따르는지, 키 없이 4번째에 3회 한도가 뜨는지,
   Gemini 키를 넣고 해석 모델이 다 막혔을 때 Cloudflare 해석으로 넘어가는지.
3. gemma-4 이미지 요청이 400으로 막히는 날이 있으면 다음 모델(gemma-4-31b-it)로 넘어가는지 확인.
4. 캡처(1366×768)와 게시판 본문·자세한 설명 만들기. 만들면 오류 알리기 글 번호도 함께 넣기.
