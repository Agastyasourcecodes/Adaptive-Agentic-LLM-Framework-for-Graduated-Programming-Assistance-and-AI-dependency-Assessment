const NAMES = ["Nudge", "Concept", "Direction", "Algorithm", "Pseudocode", "Implementation"];

export default function LevelLadder({ level }) {
  return (
    <div className="card">
      <div className="card-title">Assistance Level (this problem)</div>
      <div className="flex gap-1.5" role="img" aria-label={`Current level ${level || "none"}`}>
        {NAMES.map((n, i) => {
          const reached = level >= i + 1;
          return (
            <div key={n} className="flex-1">
              <div
                className={`h-2.5 rounded-sm border ${reached ? "bg-accent border-accent" : "bg-white border-line"} ${level === i + 1 ? "ring-2 ring-offset-1 ring-accent" : ""}`}
                style={reached ? { opacity: 0.35 + (i + 1) * 0.11 } : undefined}
              />
              <div className="text-[10px] text-muted mt-1 text-center">L{i + 1}</div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted mt-3">
        {level ? `L${level} — ${NAMES[level - 1]} revealed so far.` : "No hint requested yet — full independence preserved."}
      </p>
    </div>
  );
}
