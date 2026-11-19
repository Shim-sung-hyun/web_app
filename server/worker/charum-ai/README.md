# 차름 AI 워커 (012 팝아트 변환기용)

원본은 이 폴더(`server/worker/charum-ai/`)입니다. 비밀값은 여기에 절대 넣지 않습니다.

## 하는 일

웹앱(012/popart.html)이 보내는 요청을 받아 이렇게 일합니다.

| 상황 | 사진 해석 | 그림 변환 | 하루 3회 제한 |
|---|---|---|---|
| Gemini 키 있음 | 웹앱이 구글에 직접 (1순위 `gemma-4-26b-a4b-it`) | 웹앱이 Gemini 이미지 생성 먼저, 막히면 CF | 개인 CF 토큰이 없으면 적용 |
| Gemini 분석이 막힘 | 이 워커가 CF 비전으로 해석 (`useCloudflareVision:true`) | CF FLUX.2 klein | 적용 |
| Gemini 키 없음 | 이 워커가 CF 비전으로 해석 | CF FLUX.2 klein | 적용 |
| 개인 CF 계정 입력 | 위와 같되 개인 토큰으로 | 개인 할당량 | 없음 |

- Gemini 키와 CF 토큰은 **웹앱 페이지가 열려 있는 동안 메모리에만** 있습니다. 서버에 저장하지 않고, 개인 CF 토큰은 변환 요청 본문으로만 옵니다(응답에 되돌려 주지 않음).
- 3회 제한은 **개발자 Cloudflare 키로 팝아트를 변환할 때만** 셉니다. `/gemini` 중계(자동 설정·대사 추천)는 개발자 Gemini 키를 쓰며 이 3회에 포함되지 않습니다. 비용이 걱정되면 개발자 Gemini 키 대신 웹앱에서 개인 Gemini 키를 넣어 쓰도록 안내하세요.
- CF 정보가 없으면 개발자 AI 바인딩으로 실행합니다. 이때만 웹앱이 기기에 저장한 익명 번호(`webapp.deviceId`)로 KV에 하루 3회를 셉니다. IP·학생 이름은 저장하지 않고, 기록은 48시간 뒤 사라집니다.
- **③ 필터+AI**: 웹앱이 만든 윤곽 이미지(`guide`)를 `input_image_1`로 FLUX에 넘깁니다. 옛 워커는 이 값을 버렸지만 여기서는 실제 참조 이미지로 씁니다. 참조 이미지는 512px 미만이라 웹앱이 480px로 보냅니다.

## 주소

- `POST /cartoon` (또는 `/generate`) — 사진 변환. 본문:
  `{ image, guide, prompt, width, height, useCloudflareVision, uid, cloudflareAccountId?, cloudflareApiToken? }`
- `POST /gemini` — Gemini 키가 없을 때 자동 설정·대사 추천용 중계. 개발자 `GEMINI_KEY` 시크릿 사용.
- `GET /ping` — `{ ok, version }`. `Origin` 헤더가 필요합니다.

응답(`/cartoon`): `{ image, analysis, engine:{analysis, convert, usedDev, remaining}, version }`.
웹앱은 `image`만 쓰고 나머지는 상태 표시용입니다.

`Origin`이 `ALLOW`에 없으면 `403`, 개발자 키 3회를 넘으면 `429` + `{"error":{"message":"daily limit"}}`입니다. 웹앱은 429를 "오늘의 팝아트 변환 한도(3회)…"로 보여 줍니다.

## 모델

- 변환: `@cf/black-forest-labs/flux-2-klein-4b`
- 해석: `@cf/meta/llama-3.2-11b-vision-instruct` → 실패 시 `@cf/llava-hf/llava-1.5-7b-hf`
- `/gemini` 중계 모델: 기본 `gemini-2.5-flash` (요청에 `model`을 보내면 그 모델)

## 배포 (선생님 컴퓨터에서)

```bash
cd server/worker/charum-ai
npm install -g wrangler
wrangler login
wrangler kv namespace create LIMITS      # 나온 id를 wrangler.jsonc의 REPLACE_WITH_KV_ID 자리에 넣기
wrangler secret put GEMINI_KEY           # /gemini 중계용 개발자 키 (없으면 이 줄은 건너뛰어도 됨)
wrangler deploy
```

`wrangler deploy`가 알려 주는 주소를 **`012/popart.html`의 `WORKER_URL`** 에 넣습니다. 같은 이름(`charum-ai`)으로 배포하면 옛 주소 `https://charum-ai.simdoly.workers.dev`가 새 코드로 바뀝니다.

정식판은 `charum.org`에서 불러오므로 `wrangler.jsonc`의 `ALLOW`에 `https://www.charum.org`·`https://charum.org`가 있어야 합니다(없으면 403). 서버 `study/012/`에는 저장소의 `012/server-loader.html`을 올립니다.

개발자 Cloudflare AI는 AI 바인딩(`env.AI`)이라 별도 시크릿이 필요 없습니다. 옛 워커의 `TTS_KEY`는 이 워커에서 쓰지 않습니다.

## 확인

```bash
wrangler tail
curl -H 'Origin: https://charum.org' https://<워커주소>/ping
```

`Origin` 없이 요청하면 403이 정상입니다. 배포 후 `/ping`의 `version`이 `2026-11-19.2`인지 확인합니다.

## 고칠 때

- 사진 해석 안내 글은 이 파일의 `VISION_PROMPT`와 `012/popart.html`의 `makeCloudflarePromptWithGemini()` 안내문이 같은 뜻이어야 합니다.
- gemma-4 모델 1순위 설정은 `012/popart.html`의 `GEMINI_TEXT_MODELS` 첫 값입니다(워커가 고치는 부분 아님).
