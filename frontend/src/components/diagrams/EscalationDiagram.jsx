import { DiagramFrame, Arrow, C } from "./primitives";

const LEVELS = [
  ["L1", "Nudge"],
  ["L2", "Concept"],
  ["L3", "Direction"],
  ["L4", "Algorithm"],
  ["L5", "Pseudocode"],
  ["L6", "Implementation"]
];
const X = (i) => 110 + i * 136;
const CY = 150;
const R = 26;

export default function EscalationDiagram({ currentLevel = 0 }) {
  return (
    <DiagramFrame
      title="Fig. 2 — Graduated hint-escalation state machine"
      viewBox="0 0 900 262"
      caption={
        <>
          Level is never chosen by the model. The controller starts at L1, advances <strong className="text-ink">+1</strong> per request, adds
          <strong className="text-ink"> +1</strong> if the student is stalling (attempts − hints ≥ 2) and <strong className="text-ink">+1</strong> if the
          Analyzer flags a repeated mistake. The level is capped at L6 and never decreases within a problem.
          {currentLevel > 0 && <> Current state: <strong className="text-ink">L{currentLevel}</strong>.</>}
        </>
      }
    >
      {/* start */}
      <circle cx="30" cy={CY} r="6" fill={C.ink} />
      <Arrow d={`M36 ${CY} H${X(0) - R - 1}`} color="accent" label="first hint" lx={62} ly={CY - 10} />

      {/* skip arcs */}
      <path d={`M${X(0)} ${CY - R} Q${X(1)} 40 ${X(2)} ${CY - R}`} fill="none" stroke={C.tan} strokeWidth="1.3" strokeDasharray="5 4" markerEnd="url(#arrTan)" />
      <path d={`M${X(3)} ${CY - R} Q${X(4)} 40 ${X(5)} ${CY - R}`} fill="none" stroke={C.tan} strokeWidth="1.3" strokeDasharray="5 4" markerEnd="url(#arrTan)" />
      <path d={`M${X(1)} ${CY - R} Q${(X(1) + X(4)) / 2} -70 ${X(4)} ${CY - R}`} fill="none" stroke={C.tan} strokeWidth="1.3" strokeDasharray="5 4" markerEnd="url(#arrTan)" />
      <text x={X(1)} y="74" textAnchor="middle" fontSize="10" fill={C.tan} fontStyle="italic">+2 stalled OR repeated</text>
      <text x={X(4)} y="74" textAnchor="middle" fontSize="10" fill={C.tan} fontStyle="italic">+2</text>
      <text x={(X(1) + X(4)) / 2} y="20" textAnchor="middle" fontSize="10" fill={C.tan} fontStyle="italic">+3 stalled AND repeated</text>

      {/* forward arrows */}
      {LEVELS.slice(0, -1).map((_, i) => (
        <Arrow key={i} d={`M${X(i) + R} ${CY} H${X(i + 1) - R - 1}`} color="accent" label={i < 5 ? "+1" : ""} lx={(X(i) + X(i + 1)) / 2} ly={CY - 8} />
      ))}

      {/* states */}
      {LEVELS.map(([id, name], i) => {
        const active = currentLevel === i + 1;
        const op = 0.12 + i * 0.16;
        return (
          <g key={id}>
            <circle cx={X(i)} cy={CY} r={R} fill={active ? C.accent : "#fff"} stroke={C.accent} strokeWidth={active ? 2.5 : 1.2} />
            <circle cx={X(i)} cy={CY} r={R - 4} fill={C.accent} opacity={active ? 0 : op} />
            <text x={X(i)} y={CY + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill={active || i > 2 ? "#fff" : C.ink}>
              {id}
            </text>
            <text x={X(i)} y={CY + R + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill={C.ink}>
              {name}
            </text>
          </g>
        );
      })}

      {/* cap */}
      <text x={X(5) + R + 8} y={CY + 4} fontSize="10" fill={C.muted}>cap</text>

      {/* information bands */}
      {[
        [0, 2, "Conceptual scaffolding — no code", C.accent, 0.18],
        [3, 4, "Procedural — plain language / pseudocode", C.accent, 0.4],
        [5, 5, "Full solution", C.accent, 0.75]
      ].map(([a, b, label, col, op], i) => (
        <g key={i}>
          <rect x={X(a) - R} y={CY + 62} width={X(b) - X(a) + 2 * R} height="8" rx="2" fill={col} opacity={op} />
          <text x={(X(a) + X(b)) / 2} y={CY + 88} textAnchor="middle" fontSize="10" fill={C.muted}>
            {label}
          </text>
        </g>
      ))}
    </DiagramFrame>
  );
}
