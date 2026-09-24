/**
 * llmRouter.js
 * ------------
 * Provider-agnostic text generation with automatic fallback to local Qwen.
 *
 *   requested provider ──► [ready?] ──► call API ──► ok ──► return
 *                              │            │
 *                              └── no ──────┴── error/quota/timeout ──► Qwen (Ollama)
 *
 * Providers:
 *   qwen    Local Ollama (default, always the fallback target)
 *   gemini  Google Gemini API  (GEMINI_API_KEY)
 *   grok    xAI Grok API       (XAI_API_KEY or GROK_API_KEY)
 *
 * The router never throws for a cloud-provider problem — it falls back to
 * Qwen and reports what happened so the UI / trace can show it. It only
 * throws if Qwen itself is unreachable.
 */

const env = (k, d) => process.env[k] || d;

class ProviderError extends Error {
  constructor(kind, message, status = null) {
    super(message);
    this.kind = kind; // missing_key | cooldown | quota | auth | server | timeout | network | empty | bad_request
    this.status = status;
  }
}

/* ---------- cool-down after quota exhaustion (avoids hammering a dead API) ---------- */
const cooldownUntil = new Map(); // providerId -> epoch ms

function cooldownSeconds() {
  return Number(env("PROVIDER_COOLDOWN_SECONDS", 60));
}
function remainingCooldown(id) {
  const until = cooldownUntil.get(id) || 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

/* ---------- helpers ---------- */
async function fetchWithTimeout(url, options, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (e) {
    if (e.name === "AbortError") throw new ProviderError("timeout", `Timed out after ${ms}ms`);
    throw new ProviderError("network", e.message);
  } finally {
    clearTimeout(t);
  }
}

async function classifyHttpError(res) {
  const body = await res.text().catch(() => "");
  const lower = body.toLowerCase();
  const quotaWords = ["quota", "resource_exhausted", "rate limit", "rate_limit", "credits", "billing", "exhausted"];
  if (res.status === 429 || res.status === 402 || quotaWords.some((w) => lower.includes(w))) {
    return new ProviderError("quota", `Quota/rate limit (${res.status})`, res.status);
  }
  if (res.status === 401 || res.status === 403) {
    return new ProviderError("auth", `Authentication failed (${res.status})`, res.status);
  }
  if (res.status >= 500) return new ProviderError("server", `Provider error (${res.status})`, res.status);
  return new ProviderError("bad_request", `Request rejected (${res.status}): ${body.slice(0, 160)}`, res.status);
}

/* ---------- provider implementations ---------- */
const PROVIDERS = {
  qwen: {
    id: "qwen",
    label: "Qwen (Local)",
    vendor: "Ollama",
    model: () => env("OLLAMA_MODEL", "qwen2.5-coder:0.5b"),
    configured: () => true,
    async call(prompt) {
      const base = env("OLLAMA_BASE_URL", "http://127.0.0.1:11434");
      const res = await fetchWithTimeout(
        `${base}/api/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: PROVIDERS.qwen.model(),
            prompt,
            stream: false,
            options: { temperature: 0.2 }
          })
        },
        Number(env("OLLAMA_TIMEOUT_MS", 120000))
      );
      if (!res.ok) throw await classifyHttpError(res);
      const data = await res.json();
      return (data.response || "").trim();
    }
  },

  gemini: {
    id: "gemini",
    label: "Gemini",
    vendor: "Google",
    model: () => env("GEMINI_MODEL", "gemini-2.5-flash"),
    configured: () => Boolean(env("GEMINI_API_KEY")),
    async call(prompt) {
      const base = env("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta");
      const res = await fetchWithTimeout(
        `${base}/models/${PROVIDERS.gemini.model()}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env("GEMINI_API_KEY") },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
          })
        },
        Number(env("PROVIDER_TIMEOUT_MS", 30000))
      );
      if (!res.ok) throw await classifyHttpError(res);
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
      if (!text) throw new ProviderError("empty", "Gemini returned no text (possibly blocked)");
      return text;
    }
  },

  grok: {
    id: "grok",
    label: "Grok",
    vendor: "xAI",
    model: () => env("XAI_MODEL", "grok-4.7"),
    configured: () => Boolean(env("XAI_API_KEY") || env("GROK_API_KEY")),
    async call(prompt) {
      const base = env("XAI_BASE_URL", "https://api.x.ai/v1");
      const key = env("XAI_API_KEY") || env("GROK_API_KEY");
      const res = await fetchWithTimeout(
        `${base}/chat/completions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: PROVIDERS.grok.model(),
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            stream: false
          })
        },
        Number(env("PROVIDER_TIMEOUT_MS", 30000))
      );
      if (!res.ok) throw await classifyHttpError(res);
      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || "").trim();
      if (!text) throw new ProviderError("empty", "Grok returned no text");
      return text;
    }
  }
};

export const DEFAULT_PROVIDER = "qwen";

/** Public status of all providers — never includes key material. */
export function listProviders() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    vendor: p.vendor,
    model: p.model(),
    configured: p.configured(),
    cooldownSeconds: remainingCooldown(p.id),
    isDefault: p.id === DEFAULT_PROVIDER
  }));
}

const REASON_TEXT = {
  missing_key: "API key not configured",
  cooldown: "recently exhausted — cooling down",
  quota: "quota exhausted / rate-limited",
  auth: "authentication failed (check API key)",
  server: "provider server error",
  timeout: "request timed out",
  network: "network error",
  empty: "empty response",
  bad_request: "request rejected"
};

/**
 * generate(prompt, requestedId)
 * @returns {{ text, provider, model, requested, fallback, fallbackReason, fallbackKind, latencyMs }}
 */
export async function generate(prompt, requestedId = DEFAULT_PROVIDER) {
  const requested = PROVIDERS[requestedId] ? requestedId : DEFAULT_PROVIDER;
  const started = Date.now();

  let fallbackReason = null;
  let fallbackKind = null;

  if (requested !== "qwen") {
    const p = PROVIDERS[requested];
    try {
      if (!p.configured()) throw new ProviderError("missing_key", "no key");
      if (remainingCooldown(requested) > 0) throw new ProviderError("cooldown", "cooling down");

      const text = await p.call(prompt);
      return {
        text,
        provider: requested,
        model: p.model(),
        requested,
        fallback: false,
        fallbackReason: null,
        fallbackKind: null,
        latencyMs: Date.now() - started
      };
    } catch (err) {
      const kind = err instanceof ProviderError ? err.kind : "network";
      if (kind === "quota" || kind === "auth") cooldownUntil.set(requested, Date.now() + cooldownSeconds() * 1000);
      fallbackKind = kind;
      fallbackReason = `${p.label}: ${REASON_TEXT[kind] || err.message}`;
      console.warn(`[llmRouter] ${requested} failed (${kind}) → falling back to Qwen. ${err.message}`);
    }
  }

  // Qwen: the default provider and the universal fallback.
  try {
    const q = PROVIDERS.qwen;
    const text = await q.call(prompt);
    return {
      text,
      provider: "qwen",
      model: q.model(),
      requested,
      fallback: requested !== "qwen",
      fallbackReason,
      fallbackKind,
      latencyMs: Date.now() - started
    };
  } catch (err) {
    const e = new Error(
      `Qwen (Ollama) is unreachable${fallbackReason ? ` and ${fallbackReason}` : ""}. Is "ollama serve" running with the configured model?`
    );
    e.cause = err;
    throw e;
  }
}

export default { generate, listProviders, DEFAULT_PROVIDER };
