import { Link } from "react-router-dom";
import { DiagramFrame, Node, Arrow } from "../components/diagrams/primitives";

const STEPS = [
  { title: "Paste a problem", sub: "+ your code, in Workspace", kind: "io" },
  { title: "Analyze", sub: "Qwen mentor reviews it", kind: "llm" },
  { title: "Get a Hint", sub: "L1 → L6, graduated", kind: "llm" },
  { title: "Submit", sub: "Solved, or not yet", kind: "det" },
  { title: "Saved", sub: "Updates your metrics", kind: "store" }
];
const SW = 150, SH = 56, SY = 40, SGAP = 40;
const sx = (i) => 10 + i * (SW + SGAP);

const METRICS = [
  { k: "H", label: "Highest Hint", weight: 0.35, blurb: "How deep the hints went on a problem — from L1 (a nudge) up to L6 (full implementation). Higher = you needed more explicit help." },
  { k: "I", label: "AI Interaction", weight: 0.25, blurb: "What share of your submit attempts on a problem involved an AI hint. Higher = AI was part of more of your attempts." },
  { k: "R", label: "Recent Reliance", weight: 0.25, blurb: "Out of your last 10 problems, how many needed any AI help at all. Higher = AI is showing up more often lately." },
  { k: "T", label: "Time-to-Help", weight: 0.15, blurb: "How quickly you asked for a hint, relative to a 10-minute benchmark. Higher = you tried longer on your own first." }
];
const MW = 210, MH = 44, MGAP = 16;
const my = (i) => 8 + i * (MH + MGAP);
const ADS_X = 300, ADS_Y = 66, ADS_W = 220, ADS_H = 96;

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      <section className="max-w-2xl">
        <h2 className="font-serif text-2xl text-ink mb-3">What this is</h2>
        <p className="text-sm text-ink leading-relaxed">
          You paste a coding problem and your current attempt. An AI mentor gives you the smallest hint
          that could plausibly help — never the answer outright — and only escalates to more direct help
          (concept → strategy → pseudocode → full solution) if you're still stuck. Every problem you work
          through is scored, so over time you can see whether you're leaning on AI more or less, and
          whether your independent coding skill is improving.
        </p>
        <div className="flex gap-3 mt-5">
          <Link to="/workspace" className="btn-primary">Open Workspace →</Link>
          <Link to="/dashboard" className="btn-secondary">View Dashboard</Link>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg text-ink mb-4">How the site works</h2>
        <DiagramFrame
          title="Fig. 1 — One problem, start to finish"
          viewBox={`0 0 ${sx(STEPS.length - 1) + SW + 10} 150`}
          caption="Every step here happens in the Workspace. Nothing is saved until you Submit — at that point the problem statement and its scoring numbers are written to your history (never your code)."
        >
          {STEPS.map((s, i) => (
            <Node key={s.title} x={sx(i)} y={SY} w={SW} h={SH} title={s.title} sub={s.sub} kind={s.kind} />
          ))}
          {STEPS.slice(0, -1).map((_, i) => (
            <Arrow key={i} d={`M${sx(i) + SW} ${SY + SH / 2} H${sx(i + 1) - 1}`} color="accent" />
          ))}
        </DiagramFrame>
      </section>

      <section>
        <h2 className="font-serif text-lg text-ink mb-4">What H / I / R / T / ADS mean</h2>
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <DiagramFrame
            title="Fig. 2 — How ADS is built"
            viewBox="0 0 540 230"
            caption="H, I, R and T are each 0–100 scores computed from your problem history. ADS blends them with fixed weights into a single AI-dependency number, also 0–100."
          >
            {METRICS.map((m, i) => (
              <g key={m.k}>
                <Node x={10} y={my(i)} w={MW} h={MH} title={`${m.k} — ${m.label}`} kind="det" />
                <Arrow
                  d={`M${10 + MW} ${my(i) + MH / 2} L${ADS_X - 1} ${ADS_Y + ADS_H / 2}`}
                  color="accent"
                  label={`${Math.round(m.weight * 100)}%`}
                  lx={(10 + MW + ADS_X) / 2 + 10}
                  ly={my(i) + MH / 2 - 8}
                />
              </g>
            ))}
            <Node x={ADS_X} y={ADS_Y} w={ADS_W} h={ADS_H} title="ADS" sub="AI Dependency Score" kind="llm" />
          </DiagramFrame>

          <div className="space-y-3">
            {METRICS.map((m) => (
              <div key={m.k} className="card">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-serif text-ink text-base">
                    {m.k} — {m.label}
                  </span>
                  <span className="text-xs text-muted">weight {Math.round(m.weight * 100)}%</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{m.blurb}</p>
              </div>
            ))}
            <div className="card bg-accentSoft">
              <span className="font-serif text-ink text-base">ADS — AI Dependency Score</span>
              <p className="text-xs text-muted leading-relaxed mt-1">
                0.35H + 0.25I + 0.25R + 0.15T. The single number on the Dashboard — higher means you're
                relying on AI more; lower means you're solving more independently.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}