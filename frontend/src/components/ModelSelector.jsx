const FALLBACK_LIST = [
  { id: "qwen", label: "Qwen (Local)", vendor: "Ollama", model: "qwen2.5-coder", configured: true, cooldownSeconds: 0, isDefault: true },
  { id: "gemini", label: "Gemini", vendor: "Google", model: "gemini", configured: false, cooldownSeconds: 0 },
  { id: "grok", label: "Grok", vendor: "xAI", model: "grok", configured: false, cooldownSeconds: 0 }
];

function status(p) {
  if (p.id === "qwen") return { text: "Local · no key needed", tone: "ok" };
  if (!p.configured) return { text: "No API key — falls back to Qwen", tone: "off" };
  if (p.cooldownSeconds > 0) return { text: `Quota hit — cooling ${p.cooldownSeconds}s`, tone: "warn" };
  return { text: "API key set", tone: "ok" };
}

const DOT = { ok: "bg-emerald-600", warn: "bg-amber-600", off: "bg-[#B9B7AE]" };

export default function ModelSelector({ providers, value, onChange, disabled }) {
  const list = providers?.length ? providers : FALLBACK_LIST;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="card-title mb-0">Model</div>
        <span className="text-xs text-muted">Auto-fallback to Qwen if the selected API is unavailable or exhausted</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Select model">
        {list.map((p) => {
          const s = status(p);
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(p.id)}
              className={`text-left border rounded-sm px-4 py-3 transition-colors disabled:opacity-50 ${
                selected ? "border-accent bg-accentSoft" : "border-line bg-white hover:border-ink"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{p.label}</span>
                {p.isDefault && <span className="text-[10px] uppercase tracking-wide text-accent border border-accent px-1.5 py-0.5 rounded-sm">Default</span>}
              </div>
              <div className="font-mono text-[11px] text-muted mt-0.5 truncate">{p.vendor} · {p.model}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                <span className={`inline-block w-2 h-2 rounded-full ${DOT[s.tone]}`} />
                {s.text}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
