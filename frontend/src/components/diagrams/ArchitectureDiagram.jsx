import { DiagramFrame, Node, Arrow, Legend, C } from "./primitives";

export default function ArchitectureDiagram() {
  const xs = [25, 169, 313, 457, 601, 745];
  const W = 130;
  return (
    <DiagramFrame
      title="Fig. 1 — Agentic workflow & system architecture"
      viewBox="0 0 900 450"
      caption={
        <>
          <strong className="text-ink">Design principle:</strong> only the two LLM-driven agents (filled) produce text. The hint level, the
          leakage check and every metric (H, I, R, T, ADS, Coding Skill) are computed by deterministic, auditable code, so the assessment is
          independent of which model is selected.
        </>
      }
    >
      {/* I/O */}
      <Node x={25} y={8} w={200} h={30} kind="io" title="Student: problem + code" />
      <Node x={675} y={8} w={200} h={30} kind="io" title="Level-bounded hint + trace" />
      <Arrow d="M90 38 V70" color="accent" />
      <Arrow d="M810 70 V38" color="accent" />

      {/* pipeline */}
      <Node x={xs[0]} y={70} w={W} h={60} title="Session Manager" sub="per-problem state" />
      <Node x={xs[1]} y={70} w={W} h={60} kind="llm" title="Analyzer Agent" sub="LLM · diagnostic" />
      <Node x={xs[2]} y={70} w={W} h={60} title="Level Controller" sub="deterministic L1–L6" />
      <Node x={xs[3]} y={70} w={W} h={60} kind="llm" title="Hint Agent" sub="LLM · text @ level" />
      <Node x={xs[4]} y={70} w={W} h={60} title="Level Guard" sub="rules · no leakage" />
      <Node x={xs[5]} y={70} w={W} h={60} title="Telemetry Recorder" sub="attempts · hints · time" />
      {xs.slice(0, -1).map((x, i) => (
        <Arrow key={i} d={`M${x + W} 100 H${xs[i + 1] - 1}`} color="accent" />
      ))}

      {/* regenerate loop */}
      <Arrow d="M640 130 V156 H560 V132" kind="dashed" color="tan" />
      <text x="600" y="172" textAnchor="middle" fontSize="10" fill={C.tan} fontStyle="italic">
        violation → regenerate (1×)
      </text>

      {/* router */}
      <rect x="169" y="215" width="418" height="46" rx="3" fill={C.soft} stroke={C.accent} strokeWidth="1.2" />
      <text x="378" y="235" textAnchor="middle" fontSize="12" fontWeight="600" fill={C.ink}>
        LLM Router
      </text>
      <text x="378" y="250" textAnchor="middle" fontSize="10" fill={C.muted}>
        provider select · timeout · cool-down · fallback
      </text>
      <Arrow d="M234 130 V215" color="accent" />
      <Arrow d="M490 130 V215" color="accent" />

      {/* providers */}
      <Node x={169} y={300} w={126} h={54} kind="det" title="Qwen · Ollama" sub="local · DEFAULT" />
      <Node x={315} y={300} w={126} h={54} kind="det" title="Gemini API" sub="key required" />
      <Node x={461} y={300} w={126} h={54} kind="det" title="Grok API" sub="key required" />
      <Arrow d="M232 261 V300" color="accent" />
      <Arrow d="M378 261 V300" color="accent" />
      <Arrow d="M524 261 V300" color="accent" />

      {/* fallback bus */}
      <path d="M378 354 V384 M524 354 V384 H232" fill="none" stroke={C.tan} strokeWidth="1.3" strokeDasharray="5 4" />
      <path d="M232 384 V356" fill="none" stroke={C.tan} strokeWidth="1.3" strokeDasharray="5 4" markerEnd="url(#arrTan)" />
      <text x="378" y="404" textAnchor="middle" fontSize="10" fill={C.tan} fontStyle="italic">
        fallback on: no key · quota · auth · timeout · 5xx · empty
      </text>

      {/* analytics lane */}
      <Node x={640} y={215} w={235} h={46} title="Scoring Service" sub="pure JS · H I R T · ADS · Skill" />
      <Node x={640} y={300} w={235} h={54} kind="store" title="MongoDB" sub="ProblemAttempt history" />
      <Node x={640} y={385} w={235} h={46} kind="io" title="Dashboard page" sub="trends · distribution" />
      <Arrow d="M810 130 V215" color="accent" />
      <Arrow d="M757 261 V300" color="accent" />
      <Arrow d="M757 354 V385" color="accent" />

      <Legend
        x={25}
        y={215}
        items={[
          { fill: C.accent, stroke: C.accent, label: "LLM-driven" },
          { fill: "#fff", stroke: C.accent, label: "Deterministic" },
          { fill: C.tanSoft, stroke: C.tan, label: "Persistence" }
        ]}
      />
    </DiagramFrame>
  );
}
