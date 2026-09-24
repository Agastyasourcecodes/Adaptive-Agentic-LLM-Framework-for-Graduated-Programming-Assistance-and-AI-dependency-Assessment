import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#2E4057", "#8A8D91", "#B08968", "#607D8B"];

export default function TrendChart({ data, lines, height = 220 }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted italic">No history yet — solve a few problems to see trends.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#EAE8E1" vertical={false} />
        <XAxis dataKey="index" tick={{ fontSize: 11, fill: "#6B6A63" }} tickLine={false} axisLine={{ stroke: "#DEDCD5" }} />
        <YAxis tick={{ fontSize: 11, fill: "#6B6A63" }} tickLine={false} axisLine={{ stroke: "#DEDCD5" }} domain={[0, 100]} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 2, border: "1px solid #DEDCD5" }}
          labelFormatter={(v, payload) => (payload?.[0]?.payload?.problem ? `#${v} — ${payload[0].payload.problem}` : `#${v}`)}
        />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines.map((l, i) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name || l.key}
            stroke={l.color || COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
