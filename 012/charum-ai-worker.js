// 차름 AI 중계 (charum-ai)
// Cloudflare Vision 사진 분석 + FLUX 팝아트 생성
// 기본 사용자는 한국 시간 기준 하루 3회
// 개인 Cloudflare 계정 사용자는 본인 계정으로 처리

const ALLOW = ["https://shim-sung-hyun.github.io"];

const DAILY = { gemini: 200, cartoon: 3, cartoon9: 4, image: 60, tts: 250 };

const TTS_VOICES = /^ko-KR-Chirp3-HD-(Leda|Aoede|Kore)$/;
const MAX_TTS_CHARS = 300;
const MAX_BODY = 6 * 1024 * 1024;

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

async function overLimit(env, kind) {
  if (!env.KV) return false;
  const key = `n:${today()}:${kind}`;
  const n = parseInt((await env.KV.get(key)) || "0", 10);
  if (n >= DAILY[kind]) return true;
  try {
    await env.KV.put(key, String(n + 1), { expirationTtl: 3 * 86400 });
  } catch (e) {}
  return false;
}

async function sha(text) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
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

function makeVisionInstruction(artDirection) {
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

// 개인 Cloudflare 계정으로 사진 분석
async function analyzeVisionWithUserAccount(accountId, token, image, artDirection) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${VISION_MODEL}`;

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: makeVisionInstruction(artDirection),
      image: imageDataUrl(image),
      max_tokens: 700,
      temperature: 0.2
    })
  });

  const result = await r.json().catch(() => ({}));

  if (!r.ok) {
    const message = result.errors?.[0]?.message || result.error?.message || `Cloudflare Vision 오류 (${r.status})`;

    if (/agree|license|acceptable use/i.test(message)) {
      throw new Error("Cloudflare Vision 모델을 처음 사용할 때 Meta 라이선스 동의가 필요합니다. Cloudflare 문서의 'Agree to Meta's license' 절차를 먼저 완료해 주세요.");
    }

    throw new Error(message);
  }

  const text = extractVisionText(result);

  if (!text) {
    throw new Error("Cloudflare Vision이 사진 분석 결과를 반환하지 않았습니다.");
  }

  return text;
}

// 제작자 Worker의 AI 바인딩으로 사진 분석
async function analyzeVisionWithWorker(env, image, artDirection) {
  if (!env.AI) {
    throw new Error("Worker의 AI 바인딩을 찾을 수 없습니다.");
  }

  let result;

  try {
    result = await env.AI.run(VISION_MODEL, {
      prompt: makeVisionInstruction(artDirection),
      image: imageDataUrl(image),
      max_tokens: 700,
      temperature: 0.2
    });
  } catch (e) {
    const message = String(e?.message || e);

    if (/agree|license|acceptable use/i.test(message)) {
      throw new Error("Cloudflare Vision 모델을 처음 사용할 때 Meta 라이선스 동의가 필요합니다. Cloudflare 문서의 'Agree to Meta's license' 절차를 먼저 완료해 주세요.");
    }

    throw e;
  }

  const text = extractVisionText(result);

  if (!text) {
    throw new Error("Cloudflare Vision이 사진 분석 결과를 반환하지 않았습니다.");
  }

  return text;
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

  let prompt = String(body.prompt || "").slice(0, 3000);

  if (body.useCloudflareVision === true || !prompt) {
    prompt = await analyzeVisionWithUserAccount(accountId, token, body.image, prompt);
  }

  if (!prompt) {
    return {
      status: 400,
      data: { error: { message: "사진 분석 프롬프트를 만들지 못했습니다." } }
  };
  }

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

      if (r.status === 401 || r.status === 403) break;
      if (![404, 429].includes(r.status) && r.status < 500) break;
    }
  }

  return {
    status: lastStatus,
    data: { error: { message: lastMessage } }
  };
}

// ---------- 제작자 계정으로 팝아트 생성 ----------
async function cartoon(env, body) {
  if (body.cloudflareAccountId || body.cloudflareApiToken) {
    return await cartoonWithUserAccount(body);
  }

  if (!body.image) {
    return { status: 400, data: { error: { message: "image" } } };
  }

  let prompt = String(body.prompt || "").slice(0, 3000);

  if (body.useCloudflareVision === true || !prompt) {
    prompt = await analyzeVisionWithWorker(env, body.image, prompt);
  }

  if (!prompt) {
    return {
      status: 400,
      data: { error: { message: "사진 분석 프롬프트를 만들지 못했습니다." } }
    };
  }

  const W = Math.min(1024, Math.max(256, Math.round(+body.width || 768)));
  const H = Math.min(1024, Math.max(256, Math.round(+body.height || 768)));

  const form = new FormData();

  form.append(
    "input_image_0",
    new Blob([b64ToBytes(body.image)], { type: "image/jpeg" }),
    "photo.jpg"
  );

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

  if (!(await overLimit(env, "cartoon9"))) {
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
        `ok\nAI: ${ok(env.AI)}\nKV: ${ok(env.KV)}\nGEMINI_KEY: ${ok(env.GEMINI_KEY)}\nTTS_KEY: ${ok(env.TTS_KEY)}`,
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

    try {
      const body = await req.json();
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

        if (await overLimit(env, "gemini")) {
          return json({ error: { message: "daily limit" } }, 429, origin);
        }

        res = await gemini(env, body);

      } else if (url.pathname === "/cartoon") {
        const hasAccount = !!String(body.cloudflareAccountId || "").trim();
        const hasToken = !!String(body.cloudflareApiToken || "").trim();

        if (hasAccount !== hasToken) {
          return json({
            error: { message: "Cloudflare Account ID와 API Token을 모두 입력해 주세요." }
          }, 400, origin);
        }

        if (!hasAccount) {
          if (!env.KV) {
            return json({
              error: {
                message: "기본 사용량 제한을 위한 KV 연결이 없습니다. Worker의 KV 바인딩을 확인해 주세요."
              }
            }, 503, origin);
          }

          if (await overLimit(env, "cartoon")) {
            return json({
              error: {
                message: "기본 제공 횟수(하루 3회)를 모두 사용했습니다. 내 Cloudflare 계정 정보를 입력하거나 내일 다시 이용해 주세요."
              }
            }, 429, origin);
          }
        }

        res = await cartoon(env, body);

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
        { error: { message: m } },
        /limit|quota|capacity|429/i.test(m) ? 429 : 502,
        origin
      );
    }
  },
}; 
