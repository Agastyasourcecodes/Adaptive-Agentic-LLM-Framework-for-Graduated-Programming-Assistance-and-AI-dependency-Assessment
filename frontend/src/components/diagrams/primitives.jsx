// Small SVG building blocks shared by all framework diagrams.
export const C = {
  ink: "#1C1C1A",
  line: "#DEDCD5",
  muted: "#6B6A63",
  accent: "#2E4057",
  soft: "#EEF1F4",
  tan: "#B08968",
  tanSoft: "#F5EEE6",
  warn: "#9A3B3B"
};

export function Defs() {
  return (
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill={C.muted} />
      </marker>
      <marker id="arrAccent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill={C.accent} />
      </marker>
      <marker id="arrTan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill={C.tan} />
      </marker>
    </defs>
  );
}

/** kind: "llm" (filled) | "det" (outlined) | "store" (tan) | "io" (pill) */
export function Node({ x, y, w, h, title, sub, kind = "det" }) {
  const styles = {
    llm: { fill: C.accent, stroke: C.accent, t: "#fff", s: "#D6DEE8" },
    det: { fill: "#fff", stroke: C.accent, t: C.ink, s: C.muted },
    store: { fill: C.tanSoft, stroke: C.tan, t: C.ink, s: C.muted },
    io: { fill: C.soft, stroke: C.line, t: C.ink, s: C.muted }
  }[kind];
  const rx = kind === "io" ? h / 2 : 3;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={styles.fill} stroke={styles.stroke} strokeWidth="1.2" />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 4)} textAnchor="middle" fontSize="12" fontWeight="600" fill={styles.t}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize="10" fill={styles.s}>
          {sub}
        </text>
      )}
    </g>
  );
}

export function Arrow({ d, kind = "solid", color = "muted", label, lx, ly }) {
  const stroke = { muted: C.muted, accent: C.accent, tan: C.tan }[color];
  const marker = { muted: "arr", accent: "arrAccent", tan: "arrTan" }[color];
  return (
    <g>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.3" strokeDasharray={kind === "dashed" ? "5 4" : undefined} markerEnd={`url(#${marker})`} />
      {label && (
        <text x={lx} y={ly} textAnchor="middle" fontSize="10" fill={stroke} fontStyle="italic">
          {label}
        </text>
      )}
    </g>
  );
}

export function Diamond({ cx, cy, w = 100, h = 62, lines }) {
  return (
    <g>
      <polygon points={`${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`} fill="#fff" stroke={C.accent} strokeWidth="1.2" />
      {lines.map((l, i) => (
        <text key={i} x={cx} y={cy + 4 + (i - (lines.length - 1) / 2) * 12} textAnchor="middle" fontSize="10" fontWeight="600" fill={C.ink}>
          {l}
        </text>
      ))}
    </g>
  );
}

export function Legend({ items, x, y }) {
  return (
    <g>
      {items.map((it, i) => (
        <g key={i} transform={`translate(${x}, ${y + i * 20})`}>
          <rect width="14" height="12" rx="2" fill={it.fill} stroke={it.stroke} strokeWidth="1.2" />
          <text x="20" y="10" fontSize="10" fill={C.muted}>
            {it.label}
          </text>
        </g>
      ))}
    </g>
  );
}

export function DiagramFrame({ title, caption, children, viewBox }) {
  return (
    <figure className="border border-line rounded-sm bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-muted mb-2 font-medium">{title}</div>
      <div className="overflow-x-auto">
        <svg viewBox={viewBox} className="w-full min-w-[720px]" role="img" aria-label={title} fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
          <Defs />
          {children}
        </svg>
      </div>
      {caption && <figcaption className="text-xs text-muted mt-3 leading-relaxed">{caption}</figcaption>}
    </figure>
  );
}
