const PLANNED = {
  hint: [
    ["Session Manager", "deterministic"],
    ["Level Controller", "deterministic"],
    ["Hint Agent", "llm"],
    ["Level Guard", "rules"],
    ["Telemetry Recorder", "deterministic"]
  ],
  analyze: [
    ["Session Manager", "deterministic"],
    ["Analyzer Agent", "llm"],
    ["Signal Parser", "deterministic"]
  ]
};

const KIND_LABEL = { llm: "LLM", rules: "rules", deterministic: "deterministic" };
const PROVIDER_NAME = { qwen: "Qwen", gemini: "Gemini", grok: "Grok" };

function Dot({ status }) {
  const cls = {
    done: "bg-accent border-accent",
    warn: "bg-amber-600 border-amber-600",
    fallback: "bg-amber-600 border-amber-600",
    running: "bg-white border-accent animate-pulse",
    queued: "bg-white border-line"
  }[status];
  return <span className={`relative z-10 mt-1 w-3 h-3 rounded-full border-2 shrink-0 ${cls}`} />;
}

export default function AgentPipeline({ running, trace, kind }) {
  let steps;
  if (running) {
    const planned = PLANNED[running];
    steps = planned.map(([agent, k], i) => ({
      agent,
      kind: k,
      status: k === "llm" ? "running" : "queued",
      detail: k === "llm" ? "waiting for model…" : "queued"
    }));
  } else if (trace?.length) {
    steps = trace;
  } else {
    steps = PLANNED.hint.map(([agent, k]) => ({ agent, kind: k, status: "queued", detail: null }));
  }

  const totalMs = !running && trace?.length ? trace.reduce((s, t) => s + t.ms, 0) : null;
  const idle = !running && !trace?.length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <div className="card-title mb-0">Agentic Workflow</div>
        {totalMs !== null && <span className="text-xs text-muted font-mono">{totalMs} ms total</span>}
      </div>
      <p className="text-xs text-muted mb-4">
        {idle
          ? "Run Analyze or Get Next Hint to see the live agent trace."
          : running
          ? `Running ${running === "hint" ? "hint" : "analysis"} pipeline…`
          : `Last run: ${kind === "hint" ? "hint" : "analysis"} pipeline`}
      </p>

      <ol className="relative">
        <span className="absolute left-[5px] top-2 bottom-2 w-px bg-line" aria-hidden />
        {steps.map((s, i) => (
          <li key={`${s.id || s.agent}-${i}`} className={`relative flex gap-3 pb-4 last:pb-0 ${s.status === "queued" ? "opacity-50" : ""}`}>
            <Dot status={s.status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-ink font-medium">{s.agent}</span>
                <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm border ${s.kind === "llm" ? "border-accent text-accent" : "border-line text-muted"}`}>
                  {KIND_LABEL[s.kind]}
                </span>
                {typeof s.ms === "number" && !running && <span className="text-[11px] text-muted font-mono ml-auto">{s.ms} ms</span>}
              </div>
              {s.detail && <p className="text-xs text-muted mt-0.5 break-words">{s.detail}</p>}
              {s.kind === "llm" && s.provider && (
                <p className={`text-[11px] mt-1 font-mono ${s.status === "fallback" ? "text-amber-700" : "text-accent"}`}>
                  {s.status === "fallback"
                    ? `↩ ${PROVIDER_NAME[s.requested]} → ${PROVIDER_NAME[s.provider]} (${s.fallbackReason})`
                    : `via ${PROVIDER_NAME[s.provider]} · ${s.model}`}
                </p>
              )}
              {s.status === "warn" && s.kind === "rules" && <p className="text-[11px] text-amber-700 mt-1">Guard intervened</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
