// 차름 AI 중계 (charum-ai)
// Cloudflare Vision 사진 분석 + FLUX 팝아트 생성
//
// [사용량 정책]
// - 개인 Cloudflare 계정(Account ID + API Token)을 보낸 사용자: 본인 계정으로 처리, 제한 없음
// - 개인 키가 없는 사용자: 개발자 계정으로 "기기별 하루 3회" (한국 시간 기준)
//   웹앱이 기기에 저장한 익명 번호(deviceId)로 구분하고, 번호가 없을 때만 IP 해시로 대신합니다.
//   번호·IP 원본은 저장하지 않고 해시만 KV 열쇠에 3일 동안 둡니다.
// - 횟수는 그림이 실제로 만들어진 뒤에만 셉니다(실패하면 깎이지 않음).
// - /analyze : 자동 설정·대사 추천용 사진 분석 (Cloudflare Vision, 사용자별 하루 10회)
//
// [모델 정책 - 무료 한도(하루 10,000 뉴런) 아끼기]
// - 개발자 계정의 그림 생성은 기본적으로 flux-2-klein-4b (가성비 모델)만 사용합니다.
//   9b는 4b보다 한 장에 약 10배의 뉴런을 쓰므로, Worker 변수 USE_9B = 1 일 때만 하루 DAILY.cartoon9 장까지 씁니다.
// - 개인 Cloudflare 계정 사용자는 본인 한도이므로 9b → 4b 순서로 시도합니다.
// - 테스트 중에는 Worker 변수 LIMIT_OFF = 1 을 넣어 제한을 끕니다.
//   정식으로 올릴 때 LIMIT_OFF 변수를 삭제(또는 0)하면 제한이 바로 적용됩니다.

const ALLOW = [
  "https://shim-sung-hyun.github.io", // 테스트용
  "https://charum.org",               // 정식판
  "https://www.charum.org",
  "http://localhost:8787",            // 로컬 시험
];

// 전체 합계 상한 (서비스 보호용)
// cartoonAll·analyze 는 Cloudflare 무료 한도(하루 10,000 뉴런)를 나눠 쓰는 값입니다.
// 4b 한 장(+사진 분석)이 약 150~200 뉴런, 사진 분석(자동 설정·대사 추천) 한 번이 약 30~60 뉴런이라는 어림값으로 잡았어요.
// 실제 사용량을 보고 조정하세요.
const DAILY = { gemini: 200, analyze: 80, cartoon9: 4, cartoonAll: 40, image: 60, tts: 250 };
// 사용자별 하루 상한 (LIMIT_OFF 가 1 이 아닐 때만 적용)
const USER_DAILY = { cartoon: 3, gemini: 10, analyze: 10 };

const TTS_VOICES = /^ko-KR-Chirp3-HD-(Leda|Aoede|Kore)$/;
const MAX_TTS_CHARS = 300;
const MAX_BODY = 6 * 1024 * 1024;

const limitOff = env => String(env.LIMIT_OFF || "") === "1";

// Cloudflare 무료 사용량(뉴런) 소진 오류 → 한국어 안내
const isNeuronLimit = m => /\b4006\b|daily free allocation|neurons/i.test(String(m || ""));

function koreanError(message, personal) {
  if (isNeuronLimit(message)) {
    return personal
      ? "내 Cloudflare 계정의 오늘 Workers AI 무료 사용량을 모두 사용했어요. 한국 시간 오전 9시 이후에 다시 이용하거나, Cloudflare 요금제를 확인해 주세요."
      : "오늘 AI 기본 제공 무료 사용량을 모두 사용했어요. 한국 시간 오전 9시 이후에 다시 이용해 주세요.";
  }
  return message;
}

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

const json = (obj, status, origin) => new Response(JSON.stringify(obj), {
  status: status || 200,
  headers: { "Content-Type": "application/json", ...cors(origin) }
});

function today() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

// who 가 있으면 사용자별 상한(USER_DAILY), 없으면 전체 합계 상한(DAILY)
const limitKey = (kind, who) => `n:${today()}:${kind}${who ? ":" + who : ""}`;

// 상한에 닿았는지 보기만 함 (세지 않음)
async function isOver(env, kind, who) {
  if (!env.KV) return false;
  const cap = who ? USER_DAILY[kind] : DAILY[kind];
  const n = parseInt((await env.KV.get(limitKey(kind, who))) || "0", 10);
  return n >= cap;
}

// 한 번 쓴 것으로 셈 (성공한 뒤에 부름)
async function addUse(env, kind, who) {
  if (!env.KV) return;
  const key = limitKey(kind, who);
  try {
    const n = parseInt((await env.KV.get(key)) || "0", 10);
    await env.KV.put(key, String(n + 1), { expirationTtl: 3 * 86400 });
  } catch (e) {}
}

// 예전 방식(보고 바로 셈): 사용자 구분이 없는 tts·image·9b 시도에만 씀
async function overLimit(env, kind, who) {
  if (await isOver(env, kind, who)) return true;
  await addUse(env, kind, who);
  return false;
}

async function sha(text) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// 사용자 구분: 웹앱이 보낸 익명 기기 번호(deviceId)의 해시.
// 번호가 없거나 모양이 이상하면 접속 IP 해시로 대신 (원본은 저장하지 않음)
async function userId(req, body) {
  const dev = String(body?.deviceId || "");
  if (/^[A-Za-z0-9-]{16,64}$/.test(dev)) return "d" + (await sha("dev:" + dev)).slice(0, 16);
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  return "i" + (await sha(ip)).slice(0, 16);
}

function b64ToBytes(b64) {
  const clean = String(b64).replace(/^data:[^,]*;base64,/, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------- Gemini 모델 선택 ----------
let MODELS = null, MODELS_AT = 0;

async function geminiModels(env) {
  if (MODELS && Date.now() - MODELS_AT < 6 * 3600 * 1000) return MODELS;

  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
    headers: { "x-goog-api-key": env.GEMINI_KEY },
  });

  const names = r.ok
    ? ((await r.json()).models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map(m => m.name.replace(/^models\//, ""))
    : [];

  const ver = n => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || "0");
  const plain = n => /^gemini-[\d.]+-flash(-latest)?$/.test(n);
  const lite = n => /^gemini-[\d.]+-flash-lite(-latest)?$/.test(n);

  const main = names.filter(plain).sort((a, b) => ver(b) - ver(a));
  const back = names.filter(lite).sort((a, b) => ver(b) - ver(a));
  const alias = ["gemini-flash-latest", "gemini-flash-lite-latest"].filter(n => names.includes(n));

  MODELS = [...new Set([...alias.slice(0, 1), ...main.slice(0, 2), ...alias.slice(1), ...back.slice(0, 2)])];

  if (!MODELS.length) {
    MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-2.5-flash-lite"];
  }

  MODELS_AT = Date.now();
  return MODELS;
}

async function gemini(env, body) {
  delete body.tools;
  delete body.deviceId;          // 기기 번호는 횟수 세기용, 구글에는 보내지 않음
  delete body.toolConfig;
  delete body.cachedContent;

  const models = await geminiModels(env);
  let last = null;

  for (const m of models) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_KEY
      },
      body: JSON.stringify(body),
    });

    if (r.ok) {
      return { status: 200, data: { ...(await r.json()), model: m } };
    }

    let msg = "";
    try {
      msg = (await r.json()).error.message || "";
    } catch (e) {}

    console.log("gemini", m, r.status, msg.slice(0, 200));
    last = { status: r.status, data: { error: { message: msg, model: m } } };

    if (r.status !== 429 && r.status !== 404 && r.status < 500) break;
  }

  if (last && last.status === 404) MODELS = null;
  return last;
}

// ---------- Google 음성 합성 ----------
async function tts(env, body) {
  const text = String(body?.input?.text || "");
  const name = String(body?.voice?.name || "");

  if (!text || text.length > MAX_TTS_CHARS) {
    return { status: 400, data: { error: { message: "text" } } };
  }

  if (!TTS_VOICES.test(name)) {
    return { status: 400, data: { error: { message: "voice" } } };
  }

  const ac = body.audioConfig || {};

  const clean = {
    input: { text },
    voice: { languageCode: "ko-KR", name },
    audioConfig: {
      audioEncoding: "LINEAR16",
      sampleRateHertz: 24000,
      ...(typeof ac.speakingRate === "number"
        ? { speakingRate: Math.min(1.2, Math.max(0.7, ac.speakingRate)) }
        : {}),
    },
  };

  const key = "tts:" + (await sha(JSON.stringify(clean)));

  if (env.KV) {
    const hit = await env.KV.get(key);
    if (hit) return { status: 200, data: { audioContent: hit, cached: true } };
  }

  if (await overLimit(env, "tts")) {
    return { status: 429, data: { error: { message: "daily limit" } } };
  }

  const r = await fetch(
    "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + encodeURIComponent(env.TTS_KEY),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    }
  );

  if (!r.ok) {
    let msg = "";
    try {
      msg = (await r.json()).error.message || "";
    } catch (e) {}
    return { status: r.status, data: { error: { message: msg } } };
  }

  const j = await r.json();

  if (env.KV && j.audioContent) {
    try {
      await env.KV.put(key, j.audioContent);
    } catch (e) {}
  }

  return { status: 200, data: { audioContent: j.audioContent } };
}

// ---------- Cloudflare Vision 사진 분석 ----------
const VISION_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";

function imageDataUrl(image) {
  const clean = String(image || "").replace(/^data:[^,]*;base64,/, "");
  return `data:image/jpeg;base64,${clean}`;
}

// describeOnly: 필터+AI(윤곽 이미지 있음)일 때는 프롬프트 전체가 아니라
// 실제 사진의 눈에 보이는 특징만 짧게 받아 기존 프롬프트 뒤에 덧붙입니다.
function makeVisionInstruction(artDirection, describeOnly, raw) {
  if (raw) return raw;

  if (describeOnly) {
    return `Look at the photograph and describe, in one short English paragraph of under 120 words, only what is clearly visible: the main subject or subjects and their approximate age appearance, hairstyle and hair color, skin tone, clothing and its colors, objects, pose, and background. Do not identify any person, do not invent details, and do not mention any art style. Return only the description.`;
  }

  return `Analyze the supplied photograph and write a concise, detailed English image-to-image editing prompt for a pop-art illustration model.

Preserve only details clearly visible in the photograph: the main subject or subjects, approximate age appearance, facial expression, hairstyle, clothing, pose, body proportions, objects, camera angle, framing, composition, lighting, and background. Do not identify any person, infer their name, or invent details. Do not change the number of people or objects. Preserve the original pose and composition.

Follow this visual art direction:
${String(artDirection || "Classic 1960s comic-book pop art, bold clean black outlines, vivid flat colors, Ben-Day halftone dots, no text or speech bubbles.").slice(0, 3000)}

Return only the final image-generation prompt in English. Do not add an explanation, heading, or quotation marks.`;
}

function extractVisionText(result) {
  return String(
    result?.result?.response || result?.response ||
    result?.result?.description || result?.description ||
    result?.result?.text || result?.text || ""
  ).trim();
}

const LICENSE_MSG = "Cloudflare Vision 모델을 처음 사용할 때 Meta 라이선스 동의가 필요합니다. Cloudflare 문서의 'Agree to Meta's license' 절차를 먼저 완료해 주세요.";

// 개인 Cloudflare 계정으로 사진 분석
async function analyzeVisionWithUserAccount(accountId, token, image, artDirection, describeOnly, raw) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${VISION_MODEL}`;

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: makeVisionInstruction(artDirection, describeOnly, raw),
      image: imageDataUrl(image),
      max_tokens: raw ? 500 : describeOnly ? 300 : 700,
      temperature: 0.2
    })
  });

  const result = await r.json().catch(() => ({}));

  if (!r.ok) {
    const message = result.errors?.[0]?.message || result.error?.message || `Cloudflare Vision 오류 (${r.status})`;

    if (/agree|license|acceptable use/i.test(message)) {
      throw new Error(LICENSE_MSG);
    }

    throw new Error(message);
  }

  const text = extractVisionText(result);

  if (!text) {
    throw new Error("Cloudflare Vision이 사진 분석 결과를 반환하지 않았습니다.");
  }

  return text;
}

// 개발자 Worker의 AI 바인딩으로 사진 분석
async function analyzeVisionWithWorker(env, image, artDirection, describeOnly, raw) {
  if (!env.AI) {
    throw new Error("Worker의 AI 바인딩을 찾을 수 없습니다.");
  }

  let result;

  try {
    result = await env.AI.run(VISION_MODEL, {
      prompt: makeVisionInstruction(artDirection, describeOnly, raw),
      image: imageDataUrl(image),
      max_tokens: raw ? 500 : describeOnly ? 300 : 700,
      temperature: 0.2
    });
  } catch (e) {
    const message = String(e?.message || e);

    if (/agree|license|acceptable use/i.test(message)) {
      throw new Error(LICENSE_MSG);
    }

    throw e;
  }

  const text = extractVisionText(result);

  if (!text) {
    throw new Error("Cloudflare Vision이 사진 분석 결과를 반환하지 않았습니다.");
  }

  return text;
}

// ---------- 필터+AI: 윤곽 이미지(guide) 처리 ----------
// 웹앱의 필터+AI 프롬프트는 "image 0 = 실제 사진, image 1 = 필터로 만든 윤곽"이라고 부릅니다.
// FLUX에는 input_image_0 = 사진, input_image_1 = 윤곽으로 보내고,
// 번호가 헷갈리지 않도록 프롬프트 앞에 대응 관계를 한 줄 적어 줍니다.
const GUIDE_NOTE = "Reference images: the first reference image is the real photo (called image 0 below) and the second reference image is the rough pop-art outline guide (called image 1 below).\n\n";

function withGuideNote(prompt) {
  return GUIDE_NOTE + prompt;
}

// 사진 분석(Cloudflare 비전) 결과를 프롬프트에 반영
// - 윤곽 없음(AI 모드): 비전이 만든 프롬프트가 기존 프롬프트를 대신함
// - 윤곽 있음(필터+AI): 기존 프롬프트는 그대로 두고, 사진 특징 설명만 뒤에 덧붙임
// keepPrompt(색칠 도안처럼 팝아트가 아닌 그림)도 같은 방식으로, 기존 프롬프트를 유지합니다.
function mergeVisionPrompt(basePrompt, visionText, keep) {
  if (!keep) return visionText;
  return `${basePrompt}\n\nVisible details of the real photo, keep them faithful: ${visionText}`;
}

// ---------- 개인 Cloudflare 계정으로 팝아트 생성 ----------
async function cartoonWithUserAccount(body) {
  const accountId = String(body.cloudflareAccountId || "").trim();
  const token = String(body.cloudflareApiToken || "").trim();

  if (!accountId || !token) {
    return {
      status: 400,
      data: { error: { message: "Cloudflare Account ID와 API Token을 모두 입력해 주세요." } }
    };
  }

  if (!/^[a-f0-9]{32}$/i.test(accountId)) {
    return {
      status: 400,
      data: { error: { message: "Account ID 형식이 올바르지 않습니다." } }
    };
  }

  if (!body.image) {
    return { status: 400, data: { error: { message: "image" } } };
  }

  const hasGuide = !!body.guide;
  const keep = hasGuide || body.keepPrompt === true;
  let prompt = String(body.prompt || "").slice(0, 3000);

  if (body.useCloudflareVision === true || !prompt) {
    const vision = await analyzeVisionWithUserAccount(accountId, token, body.image, keep ? "" : prompt, keep);
    prompt = mergeVisionPrompt(prompt, vision, keep);
  }

  if (!prompt) {
    return {
      status: 400,
      data: { error: { message: "사진 분석 프롬프트를 만들지 못했습니다." } }
    };
  }

  if (hasGuide) prompt = withGuideNote(prompt);

  const W = Math.min(1024, Math.max(256, Math.round(+body.width || 768)));
  const H = Math.min(1024, Math.max(256, Math.round(+body.height || 768)));

  const models = [
    "@cf/black-forest-labs/flux-2-klein-9b",
    "@cf/black-forest-labs/flux-2-klein-4b",
  ];

  let lastStatus = 502;
  let lastMessage = "이미지 생성 실패";

  for (const model of models) {
    const form = new FormData();

    form.append(
      "input_image_0",
      new Blob([b64ToBytes(body.image)], { type: "image/jpeg" }),
      "photo.jpg"
    );

    if (hasGuide) {
      form.append(
        "input_image_1",
        new Blob([b64ToBytes(body.guide)], { type: "image/jpeg" }),
        "guide.jpg"
      );
    }

    form.append("prompt", prompt);
    form.append("width", String(W));
    form.append("height", String(H));

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: form,
    });

    let result = {};

    try {
      result = await r.json();
    } catch (e) {}

    if (r.ok) {
      const img = result.result?.image || result.image;

      if (img) {
        return {
          status: 200,
          data: {
            image: img,
            model,
            analysisModel: body.useCloudflareVision ? VISION_MODEL : undefined
          }
        };
      }

      lastStatus = 502;
      lastMessage = "Cloudflare 응답에 이미지가 없습니다.";
    } else {
      lastStatus = r.status;
      lastMessage = result.errors?.[0]?.message || result.error?.message || "Cloudflare 이미지 생성 오류";

      if (isNeuronLimit(lastMessage)) {
        lastStatus = 429;
        lastMessage = koreanError(lastMessage, true);
        break;
      }

      if (r.status === 401 || r.status === 403) break;
      if (![404, 429].includes(r.status) && r.status < 500) break;
    }
  }

  return {
    status: lastStatus,
    data: { error: { message: lastMessage } }
  };
}

// ---------- 개발자 계정으로 팝아트 생성 ----------
async function cartoon(env, body) {
  if (body.cloudflareAccountId || body.cloudflareApiToken) {
    return await cartoonWithUserAccount(body);
  }

  if (!body.image) {
    return { status: 400, data: { error: { message: "image" } } };
  }

  const hasGuide = !!body.guide;
  const keep = hasGuide || body.keepPrompt === true;
  let prompt = String(body.prompt || "").slice(0, 3000);

  if (body.useCloudflareVision === true || !prompt) {
    const vision = await analyzeVisionWithWorker(env, body.image, keep ? "" : prompt, keep);
    prompt = mergeVisionPrompt(prompt, vision, keep);
  }

  if (!prompt) {
    return {
      status: 400,
      data: { error: { message: "사진 분석 프롬프트를 만들지 못했습니다." } }
    };
  }

  if (hasGuide) prompt = withGuideNote(prompt);

  const W = Math.min(1024, Math.max(256, Math.round(+body.width || 768)));
  const H = Math.min(1024, Math.max(256, Math.round(+body.height || 768)));

  const form = new FormData();

  form.append(
    "input_image_0",
    new Blob([b64ToBytes(body.image)], { type: "image/jpeg" }),
    "photo.jpg"
  );

  if (hasGuide) {
    form.append(
      "input_image_1",
      new Blob([b64ToBytes(body.guide)], { type: "image/jpeg" }),
      "guide.jpg"
    );
  }

  form.append("prompt", prompt);
  form.append("width", String(W));
  form.append("height", String(H));

  const run = async model => {
    const fr = new Response(form);
    return env.AI.run(model, {
      multipart: {
        body: fr.body,
        contentType: fr.headers.get("content-type")
      }
    });
  };

  let out = null;

  // 기본은 가성비 모델(4b). 9b는 USE_9B=1 일 때만, 하루 DAILY.cartoon9 장까지.
  if (String(env.USE_9B || "") === "1" && !(await overLimit(env, "cartoon9"))) {
    try {
      out = await run("@cf/black-forest-labs/flux-2-klein-9b");
    } catch (e) {
      console.log("klein-9b", String(e && e.message || e));
    }
  }

  if (!(out && (out.image || out.result?.image))) {
    out = await run("@cf/black-forest-labs/flux-2-klein-4b");
  }

  const img = out && (out.image || out.result?.image);

  if (!img) {
    return { status: 502, data: { error: { message: "no image" } } };
  }

  return {
    status: 200,
    data: {
      image: img,
      analysisModel: body.useCloudflareVision ? VISION_MODEL : undefined
    }
  };
}

// ---------- 사진 분석 (자동 설정·대사 추천) ----------
// 웹앱이 보낸 질문(prompt)과 사진(image)을 Cloudflare Vision에 그대로 전달하고,
// 답 텍스트(JSON 문자열)를 돌려줍니다. 해석은 웹앱이 합니다.
async function analyze(env, body) {
  if (!body.image) {
    return { status: 400, data: { error: { message: "image" } } };
  }

  const question = String(body.prompt || "").slice(0, 1500);

  if (!question) {
    return { status: 400, data: { error: { message: "prompt" } } };
  }

  const instruction = `Look at the image and answer the request below. Reply with ONE valid JSON object only: no markdown, no code fences, no explanation. Write any natural-language text values in simple Korean.\n\nRequest: ${question}`;

  const accountId = String(body.cloudflareAccountId || "").trim();
  const token = String(body.cloudflareApiToken || "").trim();
  let text;

  if (accountId && token) {
    if (!/^[a-f0-9]{32}$/i.test(accountId)) {
      return { status: 400, data: { error: { message: "Account ID 형식이 올바르지 않습니다." } } };
    }
    text = await analyzeVisionWithUserAccount(accountId, token, body.image, "", false, instruction);
  } else {
    text = await analyzeVisionWithWorker(env, body.image, "", false, instruction);
  }

  return { status: 200, data: { text, model: VISION_MODEL } };
}

// ---------- 별도 이미지 생성 ----------
async function image(env, body) {
  const prompt = String(body.prompt || "").slice(0, 1500);

  if (!prompt) {
    return { status: 400, data: { error: { message: "prompt" } } };
  }

  const out = await env.AI.run(
    "@cf/black-forest-labs/flux-1-schnell",
    { prompt, steps: 4 }
  );

  return { status: 200, data: { image: out.image } };
}

// ---------- Worker 요청 처리 ----------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";

    if (url.pathname === "/ping/gemini") {
      if (!env.GEMINI_KEY) {
        return new Response("GEMINI_KEY 없음", {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }

      MODELS = null;
      let list = "";

      try {
        const lr = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
          headers: { "x-goog-api-key": env.GEMINI_KEY }
        });

        list = lr.ok
          ? "목록 " + (((await lr.json()).models) || []).length + "개"
          : "목록 실패 " + lr.status + " " + (await lr.text()).slice(0, 200);
      } catch (e) {
        list = "목록 실패 " + e.message;
      }

      const models = await geminiModels(env);

      const res = await gemini(env, {
        contents: [{ parts: [{ text: "Reply with the single word OK." }] }]
      });

      const resultText = res.status === 200
        ? ((res.data.candidates || [])[0]?.content?.parts || [])
            .map(p => p.text || "").join("").trim()
        : "";

      return new Response(
        `${list}\n고른 모델: ${models.join(", ")}\n결과: ${res.status} ${res.status === 200 ? "(" + res.data.model + ") " + resultText : JSON.stringify(res.data.error)}`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    if (url.pathname === "/ping") {
      const ok = v => (v ? "있음" : "없음");

      return new Response(
        `ok\nAI: ${ok(env.AI)}\nKV: ${ok(env.KV)}\nGEMINI_KEY: ${ok(env.GEMINI_KEY)}\nTTS_KEY: ${ok(env.TTS_KEY)}\n사용자별 제한: ${limitOff(env) ? "해제됨 (테스트 중, LIMIT_OFF=1)" : "적용 중"}\n그림 모델: ${String(env.USE_9B || "") === "1" ? "klein-9b 일부 + 4b (USE_9B=1)" : "klein-4b (기본, 가성비)"}`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    if (!ALLOW.includes(origin)) {
      return new Response("forbidden", { status: 403 });
    }

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors(origin) });
    }

    if (req.method !== "POST") {
      return json({ error: { message: "POST only" } }, 405, origin);
    }

    if (+(req.headers.get("Content-Length") || 0) > MAX_BODY) {
      return json({ error: { message: "too large" } }, 413, origin);
    }

    let personal = false;

    try {
      const body = await req.json();
      personal = !!String(body?.cloudflareAccountId || "").trim();
      let res;

      if (url.pathname === "/tts") {
        if (!env.TTS_KEY) {
          return json({ error: { message: "no TTS_KEY" } }, 503, origin);
        }

        res = await tts(env, body);

      } else if (url.pathname === "/gemini") {
        if (!env.GEMINI_KEY) {
          return json({ error: { message: "no GEMINI_KEY" } }, 503, origin);
        }

        const counted = !limitOff(env);
        const who = counted ? await userId(req, body) : "";

        if (counted && (await isOver(env, "gemini", who) || await isOver(env, "gemini"))) {
          return json({
            error: { message: "오늘 사진 분석 기본 제공 횟수를 모두 사용했습니다. 내일 다시 이용해 주세요." }
          }, 429, origin);
        }

        res = await gemini(env, body);

        if (counted && res.status === 200) {
          await addUse(env, "gemini", who);
          await addUse(env, "gemini");
        }

      } else if (url.pathname === "/cartoon") {
        const hasAccount = !!String(body.cloudflareAccountId || "").trim();
        const hasToken = !!String(body.cloudflareApiToken || "").trim();

        if (hasAccount !== hasToken) {
          return json({
            error: { message: "Cloudflare Account ID와 API Token을 모두 입력해 주세요." }
          }, 400, origin);
        }

        // 개인 키가 없는 사용자만 개발자 계정 제한 대상
        const counted = !hasAccount && !limitOff(env);
        let who = "";

        if (counted) {
          if (!env.KV) {
            return json({
              error: {
                message: "기본 사용량 제한을 위한 KV 연결이 없습니다. Worker의 KV 바인딩을 확인해 주세요."
              }
            }, 503, origin);
          }

          who = await userId(req, body);

          if (await isOver(env, "cartoon", who)) {
            return json({
              error: {
                message: `기본 제공 횟수(하루 ${USER_DAILY.cartoon}회)를 모두 사용했습니다. 내 Cloudflare 계정 정보를 입력하거나 내일(한국 시간 자정 이후) 다시 이용해 주세요.`
              }
            }, 429, origin);
          }

          if (await isOver(env, "cartoonAll")) {
            return json({
              error: { message: "오늘 기본 제공 변환이 모두 소진되었습니다. 내 Cloudflare 계정 정보를 입력하거나 내일 다시 이용해 주세요." }
            }, 429, origin);
          }
        }

        res = await cartoon(env, body);

        if (counted && res.status === 200) {
          await addUse(env, "cartoon", who);
          await addUse(env, "cartoonAll");
        }

      } else if (url.pathname === "/analyze") {
        const hasAccount = !!String(body.cloudflareAccountId || "").trim();
        const hasToken = !!String(body.cloudflareApiToken || "").trim();

        if (hasAccount !== hasToken) {
          return json({
            error: { message: "Cloudflare Account ID와 API Token을 모두 입력해 주세요." }
          }, 400, origin);
        }

        const counted = !hasAccount && !limitOff(env);
        let who = "";

        if (counted) {
          if (!env.KV) {
            return json({
              error: { message: "기본 사용량 제한을 위한 KV 연결이 없습니다. Worker의 KV 바인딩을 확인해 주세요." }
            }, 503, origin);
          }

          who = await userId(req, body);

          if (await isOver(env, "analyze", who) || await isOver(env, "analyze")) {
            return json({
              error: { message: `오늘 사진 분석 기본 제공 횟수(하루 ${USER_DAILY.analyze}회)를 모두 사용했습니다. 내 Cloudflare 계정 정보를 입력하거나 내일 다시 이용해 주세요.` }
            }, 429, origin);
          }
        }

        res = await analyze(env, body);

        if (counted && res.status === 200) {
          await addUse(env, "analyze", who);
          await addUse(env, "analyze");
        }

      } else if (url.pathname === "/image") {
        if (await overLimit(env, "image")) {
          return json({ error: { message: "daily limit" } }, 429, origin);
        }

        res = await image(env, body);

      } else {
        return json({ error: { message: "not found" } }, 404, origin);
      }

      return json(res.data, res.status, origin);

    } catch (e) {
      const m = String(e && e.message || e);
      return json(
        { error: { message: koreanError(m, personal) } },
        isNeuronLimit(m) || /limit|quota|capacity|429/i.test(m) ? 429 : 502,
        origin
      );
    }
  },
};
