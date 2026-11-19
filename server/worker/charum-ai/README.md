# 차름 AI 워커 (012 팝아트 변환기용)

**복사해 붙여 넣는 원본은 `012/charum-ai-worker.js`입니다.** 이 폴더의 `src/index.js`는 같은 내용의 사본이고, `wrangler.jsonc`는 Wrangler로 배포할 때 쓰는 설정입니다. 둘 다 비밀값이 없습니다.

## 선생님이 주신 코드에서 고친 4가지 (2026-11-19)

| 것 | 원래 | 고친 뒤 | 왜 |
|---|---|---|---|
| 허용 주소 | `shim-sung-hyun.github.io`만 | 거기에 `www.charum.org`·`charum.org`·`localhost:8787` 추가 | 정식판에서 열면 Origin이 charum.org라 403이 났음 |
| 하루 3회 | `n:날짜:cartoon` (전체 합쳐서 3회) | `n:날짜:cartoon:기기번호` (기기별 3회) | 012가 보내는 `uid`(익명 기기 번호)로 세도록. 9b 모델 횟수도 기기별로 맞춤 |
| ③ 필터+AI | `guide`를 받아도 버림 | `input_image_1`로 FLUX에 넘김 | 선생님이 의심하신 그 문제가 실제로 있었음 |
| KV 바인딩 | 코드는 `env.KV`, 예전 설정은 `LIMITS` | 설정도 `binding: "KV"`로 통일 | 이름이 다르면 제한이 안 먹음 |

나머지(`/gemini` 중계, `useCloudflareVision` 분기, Gemini→CF 순서, 429 안내, 480px 이미지)는 그대로입니다.

## 012가 보내는 요청 / 받는 응답

```
POST https://charum-ai.simdoly.workers.dev/cartoon
{
  image, guide, prompt, width, height,
  uid,                       // webapp.deviceId (익명 기기 번호)
  useCloudflareVision,       // true면 CF 비전이 사진을 해석
  cloudflareAccountId?,      // 개인 계정일 때만 (ID+토큰 함께)
  cloudflareApiToken?
}
```

응답: `{ image, model, analysisModel, usedGuide }`. 012는 `image`만 쓰고, `usedGuide`는 ③이 윤곽(guide)을 반영했는지 확인용입니다. `429`를 받으면 012가 "오늘의 팝아트 변환 한도(3회)…"로 보여 줍니다.

다른 경로는 그대로입니다: `/gemini`(자동 설정·대사 추천 중계), `/tts`, `/image`, `/ping`(텍스트), `/ping/gemini`(모델 점검).

## 배포할 때

```bash
wrangler kv namespace create KV     # 나온 id를 wrangler.jsonc의 REPLACE_WITH_KV_ID 자리에
wrangler secret put GEMINI_KEY      # /gemini 중계용 (없으면 건너뛰어도 됨)
wrangler secret put TTS_KEY         # /tts 쓸 때만
wrangler deploy
```

- **Cloudflare 대시보드에 붙여 넣는다면**: `012/charum-ai-worker.js` 전체를 복사하고, KV 바인딩 변수 이름을 반드시 `KV`로 만드세요. `LIMITS`로 만들면 하루 3회가 안 먹습니다.
- AI 바인딩은 `AI` 이름으로 연결합니다. 개발자 토큰은 파일에 넣지 않습니다.
- 같은 이름(`charum-ai`)으로 배포하면 옛 주소 `https://charum-ai.simdoly.workers.dev/cartoon`이 새 코드가 됩니다. 012의 `WORKER_URL`을 바꿀 필요 없습니다.
- `/ping`는 JSON이 아니라 글입니다. `ok / AI: 있음 / KV: 있음 …`이 나오면 정상입니다.
- 사진 분석 모델(`@cf/meta/llama-3.2-11b-vision-instruct`)은 Meta 라이선스 동의가 필요합니다. 개인 Cloudflare 계정으로 처음 쓸 때는 012 설정 패널의 "모델 안내 페이지" 링크(공식 모델 문서)에서 `'prompt': 'agree'` 절차를 한 번 따라 하세요. 기본 제공 계정은 이미 동의되어 있습니다.

## 확인할 것

1. `/cartoon`에 `guide`를 붙여 보냈을 때 응답의 `usedGuide: true`인지.
2. 키 없이 4번째 요청에서 `429`가 나는지(다른 기기에서는 다시 3회 되는지).
3. `Origin: https://www.charum.org`로 붙여 보냈을 때 `403`이 아닌지.
