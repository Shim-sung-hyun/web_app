/* 차름 AI 워커 (012 팝아트 변환기용) — 원본은 이 파일 한 곳.
 *
 * 웹앱(012/popart.html)이 보내는 형식에 맞춘다.
 *   POST /cartoon  : 사진 → FLUX.2 klein 팝아트. 사진 분석은 useCloudflareVision 플래그로.
 *   POST /gemini   : Gemini 키가 없을 때 사진 분석/자동설정용 중계(개발자 GEMINI_KEY 사용).
 *   GET  /ping     : 배포 확인.
 *
 * 키 흐름 (2026-11-19 선생님 정함)
 *   - Gemini 키가 있으면 웹앱이 구글에 직접 분석/생성을 요청한다(이 워커로 안 옴).
 *   - Gemini 분석이 막히면 웹앱이 useCloudflareVision:true를 보내고, 이 워커가 CF 비전으로 분석한다.
 *   - Gemini 키가 없으면 웹앱이 useCloudflareVision:true로 보내 CF가 분석 → CF가 변환.
 *   - Cloudflare Account ID + API Token이 오면 그 개인 계정(개인 할당량)으로 실행.
 *   - 개인 CF 정보가 없으면 개발자 AI 바인딩으로 실행하고, 익명 기기 번호(uid)당 하루 3회만 허용.
 *
 * 비밀값은 파일에 두지 않는다. 개발자 AI는 wrangler AI 바인딩,
 * 개발자 Gemini 키는 wrangler secret GEMINI_KEY로 넣는다.
 * 개인 토큰은 요청 본문으로만 받아 응답에 되돌려 주지 않는다.
 */

const VERSION = '2026-11-19.2';
const DEFAULT_FLUX = '@cf/black-forest-labs/flux-2-klein-4b';
const DEFAULT_VISION = '@cf/meta/llama-3.2-11b-vision-instruct';
const VISION_FALLBACK = '@cf/llava-hf/llava-1.5-7b-hf';
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models';

// 웹앱의 makeCloudflarePromptWithGemini() 안내 문구와 같은 뜻. 고칠 때 함께 고친다.
const VISION_PROMPT = `Look carefully at the supplied photo. Write a concise visual description to append to an image-generation prompt.
Identify only clearly visible people/objects, clothing, pose, composition, colors and background.
Do not invent details, do not identify the person, and do not give advice. Preserve the source photo faithfully. Return plain text only.`;

const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }
});

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function allowedOrigin(env, request) {
  const origin = request.headers.get('Origin') || '';
  const list = (env.ALLOW || '').split(',').map(s => s.trim()).filter(Boolean);
  return origin && list.includes(origin) ? origin : '';
}

function bytes(b64) {
  const bin = atob(String(b64 || '').replace(/^data:[^,]+,/, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function makeForm({ image, guide, prompt, width, height }) {
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', String(width || 768));
  form.append('height', String(height || 768));
  form.append('input_image_0', new Blob([bytes(image)], { type: 'image/jpeg' }), 'photo.jpg');
  // ③ 필터+AI: 옛 워커는 guide를 버렸지만, 여기서는 참조 이미지 2로 FLUX에 넘긴다.
  if (guide) form.append('input_image_1', new Blob([bytes(guide)], { type: 'image/jpeg' }), 'guide.jpg');
  return form;
}

function kstDay() { return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); }
function quotaKey(uid) { return `q:${kstDay()}:${uid}`; }
function quotaLimit(env) { return Math.max(1, parseInt(env.DAILY_LIMIT || '3', 10) || 3); }

async function checkQuota(env, uid) {
  if (!env.LIMITS) return { ok: false, status: 503, message: '변환 서버에 KV(LIMITS)가 없습니다. 설정을 확인해 주세요.' };
  const used = parseInt((await env.LIMITS.get(quotaKey(uid))) || '0', 10) || 0;
  if (used >= quotaLimit(env)) return { ok: false, status: 429, message: 'daily limit' };
  return { ok: true, used };
}
async function commitQuota(env, uid, used) {
  if (!env.LIMITS) return;
  await env.LIMITS.put(quotaKey(uid), String(used + 1), { expirationTtl: 60 * 60 * 48 });
}

async function aiFetch(account, token, model, body, contentType) {
  const headers = { Authorization: 'Bearer ' + token };
  if (contentType) headers['Content-Type'] = contentType;
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai/run/${model}`, {
    method: 'POST', headers, body
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) throw new Error(j.errors?.[0]?.message || `Cloudflare AI 오류 ${r.status}`);
  return j.result ?? j ?? {};
}

async function fluxDev(env, args) {
  const form = new Response(makeForm(args));   // FormData의 boundary를 얻기 위해 Response로 감쌈
  const out = await env.AI.run(env.FLUX_MODEL || DEFAULT_FLUX, {
    multipart: { body: form.body, contentType: form.headers.get('content-type') }
  });
  return out?.image || out?.result?.image || '';
}
async function fluxPersonal(env, account, token, args) {
  const out = await aiFetch(account, token, env.FLUX_MODEL || DEFAULT_FLUX, makeForm(args));
  return out?.image || '';
}

async function visionDev(env, image) {
  const img = 'data:image/jpeg;base64,' + image;
  let last;
  for (const model of [env.VISION_MODEL || DEFAULT_VISION, VISION_FALLBACK]) {
    try {
      const out = await env.AI.run(model, { prompt: VISION_PROMPT, image: img });
      const text = out?.response || out?.result?.response || (typeof out === 'string' ? out : '');
      if (String(text || '').trim()) return String(text).trim();
    } catch (e) { last = e; }
  }
  throw last || new Error('사진을 해석하지 못했습니다.');
}
async function visionPersonal(env, account, token, image) {
  const out = await aiFetch(account, token, env.VISION_MODEL || DEFAULT_VISION,
    JSON.stringify({ prompt: VISION_PROMPT, image: 'data:image/jpeg;base64,' + image }),
    'application/json');
  const text = out?.response || (typeof out === 'string' ? out : '');
  if (!String(text || '').trim()) throw new Error('사진을 해석하지 못했습니다.');
  return String(text).trim();
}

async function geminiProxy(env, body) {
  if (!env.GEMINI_KEY) throw new Error('변환 서버에 GEMINI_KEY가 없습니다. (wrangler secret 설정 필요)');
  const model = String(body.model || 'gemini-2.5-flash');
  const r = await fetch(`${GEMINI_API}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
    body: JSON.stringify({ contents: body.contents || [], generationConfig: body.generationConfig || {} })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `Gemini 중계 오류 ${r.status}`);
  return data;
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(env, request);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (!origin) {
      return json({ error: { message: '이 주소에서는 변환 서버를 쓸 수 없어요. (Worker ALLOW 확인)' } },
        403, cors(request.headers.get('Origin') || ''));
    }

    const path = new URL(request.url).pathname;
    if (path === '/ping') {
      if (request.method === 'GET') return json({ ok: true, version: VERSION }, 200, cors(origin));
      return json({ error: { message: 'GET만 쓸 수 있습니다.' } }, 405, cors(origin));
    }
    if (request.method !== 'POST' || !['/cartoon', '/generate', '/gemini'].includes(path)) {
      return json({ error: { message: 'POST /cartoon 또는 POST /gemini 만 쓸 수 있습니다.' } }, 404, cors(origin));
    }

    try {
      const b = await request.json();

      if (path === '/gemini') return json(await geminiProxy(env, b), 200, cors(origin));

      const image = String(b.image || '');
      const guide = String(b.guide || '');
      const prompt = String(b.prompt || '');
      const uid = String(b.uid || '');
      if (!image || !prompt) throw new Error('사진이나 지시가 없습니다.');
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(uid)) throw new Error('기기 번호가 바르지 않습니다. (uid 확인)');

      const account = String(b.cloudflareAccountId || '').trim();
      const token = String(b.cloudflareApiToken || '').trim();
      if (!!account !== !!token) throw new Error('Cloudflare Account ID와 API Token을 모두 입력하거나, 두 입력란을 모두 비워 주세요.');
      const personal = !!account;

      // 개발자 키를 쓸 때만 기기별 하루 3회를 센다(개인 토큰이면 제한 없음).
      let quota = { ok: true, used: 0 };
      if (!personal) {
        quota = await checkQuota(env, uid);
        if (!quota.ok) return json({ error: { message: quota.message } }, quota.status, cors(origin));
      }

      // 1) 사진 해석: 웹앱이 Gemini로 이미 해석했으면 프롬프트에 이미 들어 있다.
      //    useCloudflareVision이면(CF 단독 또는 Gemini 분석 실패) 여기서 CF 비전으로 해석해 붙인다.
      let analysis = '';
      let analysisBy = '';
      if (b.useCloudflareVision) {
        analysis = personal ? await visionPersonal(env, account, token, image) : await visionDev(env, image);
        analysisBy = 'cloudflare';
      }

      const fullPrompt = analysis
        ? `${prompt}\n\n[사진에서 확인한 시각 정보]\n${analysis}`
        : prompt;
      const args = {
        image, guide,
        prompt: fullPrompt,
        width: Math.min(1920, Math.max(256, parseInt(b.width, 10) || 768)),
        height: Math.min(1920, Math.max(256, parseInt(b.height, 10) || 768))
      };

      // 2) 변환: 개인 계정이면 개인 할당량, 아니면 개발자 AI 바인딩.
      const out = personal ? await fluxPersonal(env, account, token, args) : await fluxDev(env, args);
      if (!out) throw new Error('서버에서 변환된 이미지를 받지 못했습니다.');

      if (!personal) await commitQuota(env, uid, quota.used);

      return json({
        image: out,
        analysis,
        engine: {
          analysis: analysisBy || 'gemini-or-webapp',
          convert: personal ? 'personal' : 'developer',
          usedDev: !personal,
          remaining: personal ? null : Math.max(0, quotaLimit(env) - quota.used - 1)
        },
        version: VERSION
      }, 200, cors(origin));
    } catch (e) {
      const message = String(e?.message || e);
      const status = /KV\(LIMITS\)/.test(message) ? 503 : 500;
      return json({ error: { message } }, status, cors(origin));
    }
  }
};
