012 팝아트 변환기 (차름 AI · 제작자/교사용 도구, 학생용 앱 아님) — 2026-11-19 정리
사진 한 장을 ① AI 변환 ② 필터 ③ 필터+AI로 그려 보고, 워홀 4칸·색칠 도안·말풍선·대사 추천·전시판까지 만드는 화면.

파일
- index.html        : popart.html로 보내는 안내 페이지
- server-loader.html: 정식판 서버 study/012/에 올리는 불러오기 파일(GitHub의 popart.html을 이 주소에서 펼침)
- popart.html       : 앱 한 파일. 필터는 브라우저에서, AI 해석·변환은 아래 워커/구글에 요청
- charum-ai-worker.js : **워커 복사용 원본**. 선생님이 Cloudflare에 붙여 넣을 코드(012와 맞춤, 2026-11-19 고침)
- wrangler.jsonc    : 워커 Wrangler 설정. KV 바인딩 이름은 "KV" (코드가 env.KV를 씀)
- server/worker/charum-ai/ : 위 두 파일의 사본 + 배포 안내(README.md). 원본은 012/ 파일들
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
- 계정이 없으면 개발자 AI 바인딩. 웹앱이 기기에 저장한 익명 번호(webapp.deviceId, uid)로 KV에 한국 날짜별 **기기당** 하루 3회.
  IP·학생 이름은 저장하지 않고 72시간 뒤 KV 기록 삭제. 9b 모델 시도도 기기당 하루 4회로 제한.
  429를 받으면 "오늘의 한도(3회)"로 안내. (선생님이 처음 주신 워커는 전역 3회였는데 기기별로 고침)
- ③ 필터+AI: 윤곽 이미지(guide)를 워커가 input_image_1로 FLUX에 넘겨 실제로 반영한다.
  원래 워커는 guide를 받아도 버렸고, 012/charum-ai-worker.js에서 고쳤다(응답의 usedGuide로 확인).
  FLUX 참조 이미지는 512px 미만이라 사진·윤곽 모두 480px로 보낸다.
- "사진 보고 자동 설정"·"대사 추천"은 Gemini 키가 있으면 직접, 없으면 워커의 /gemini 중계(개발자 GEMINI_KEY)를 쓴다.

주소·배포
- 지금 WORKER_URL은 https://charum-ai.simdoly.workers.dev/cartoon. 같은 이름(charum-ai)으로 배포하면 이 주소가 새 코드가 되므로 popart.html을 바꿀 필요 없다.
- 선생님이 대시보드에 붙여 넣을 때: 012/charum-ai-worker.js 전체를 복사. **KV 바인딩 변수 이름을 "KV"로** 만들 것(LIMITS로 만들면 제한 안 먹음).
  AI 바인딩은 "AI". GEMINI_KEY는 /gemini 중계용, TTS_KEY는 /tts용 시크릿으로 각각 넣는다.
- Wrangler로 배포할 때는 012/wrangler.jsonc의 REPLACE_WITH_KV_ID를 실제 id로 바꾼 뒤 wrangler deploy.
- 코드 맨 위 ALLOW에 https://shim-sung-hyun.github.io · https://www.charum.org · https://charum.org · http://localhost:8787이 들어 있다(정식판 403 방지).
- /ping은 JSON이 아니라 글이다: "ok / AI: 있음 / KV: 있음 / GEMINI_KEY: …"이 나오면 정상.
- 사진 분석 모델(@cf/meta/llama-3.2-11b-vision-instruct)은 Meta 라이선스 동의가 필요하다. 개인 계정으로 처음 쓸 때 popart.html 설정 패널의 "모델 안내 페이지" 링크(공식 모델 문서, 'agree' 절차 있음)로 안내한다(기본 제공 계정은 이미 동의됨).

다음 할 일
1. 선생님: 012/charum-ai-worker.js를 워커에 붙여 넣고(KV 바인딩 "KV") 배포 → /ping에서 "KV: 있음" 확인.
2. ①②③ 각각 돌려 보기. 특히 ③ 응답의 usedGuide가 true인지(윤곽 반영), 키 없이 4번째에 3회 한도가 뜨는지,
   다른 기기에서 다시 3회 되는지(기기별 제한 확인), charum.org에서 403이 안 나는지.
3. Gemini 키를 넣고 해석 모델이 다 막혔을 때 Cloudflare 해석으로 넘어가는지 확인.
4. 캡처(1366×768)와 게시판 본문·자세한 설명 만들기. 만들면 오류 알리기 글 번호도 함께 넣기.
