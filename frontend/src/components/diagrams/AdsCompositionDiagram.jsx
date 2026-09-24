import { C } from "./primitives";

const PARTS = [
  { k: "H", name: "Highest Hint", color: C.accent },
  { k: "I", name: "AI Interaction", color: "#5B7189" },
  { k: "R", name: "Recent Reliance", color: C.tan },
  { k: "T", name: "Time-to-Help", color: "#8A8D91" }
];

export default function AdsCompositionDiagram({ research }) {
  if (!research) return null;
  const { weights, substituted } = research;
  let acc = 0;
  return (
    <figure className="card">
      <div className="card-title">ADS composition (weight × current value)</div>

      <div className="flex h-9 w-full border border-line rounded-sm overflow-hidden" role="img" aria-label="ADS weight composition">
        {PARTS.map((p) => (
          <div key={p.k} style={{ width: `${weights[p.k] * 100}%`, background: p.color }} className="flex items-center justify-center text-white text-xs font-medium">
            {p.k} · {Math.round(weights[p.k] * 100)}%
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {PARTS.map((p) => {
          const value = Number(substituted[p.k]) || 0;
          const contribution = weights[p.k] * value;
          acc += contribution;
          return (
            <div key={p.k}>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>
                  <span className="text-ink font-medium">{p.k}</span> — {p.name}
                </span>
                <span className="font-mono">
                  {weights[p.k]} × {value.toFixed(1)} = <span className="text-ink">{contribution.toFixed(1)}</span>
                </span>
              </div>
              <div className="h-2 bg-accentSoft rounded-sm overflow-hidden">
                <div style={{ width: `${Math.min(100, value)}%`, background: p.color }} className="h-full" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-line flex justify-between text-sm">
        <span className="text-muted">Σ contributions = ADS</span>
        <span className="font-serif text-xl text-ink">{acc.toFixed(1)}</span>
      </div>
      <figcaption className="text-xs text-muted mt-2">
        Bars show each component's 0–100 value; the sum of weighted contributions equals the AI Dependency Score. All values are computed in
        <code className="mx-1">scoringService.js</code>, never by an LLM.
      </figcaption>
    </figure>
  );
}
