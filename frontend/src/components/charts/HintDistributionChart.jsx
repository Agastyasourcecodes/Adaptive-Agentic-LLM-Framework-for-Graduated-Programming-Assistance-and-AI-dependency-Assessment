import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const LEVEL_COLORS = ["#C9D6E3", "#A9BDD1", "#8AA3BE", "#6B8AAB", "#4C7098", "#2E4057"];

export default function HintDistributionChart({ distribution, height = 220 }) {
  const data = Object.entries(distribution || {}).map(([level, count]) => ({ level, count }));
  const allZero = data.every((d) => d.count === 0);

  if (allZero) {
    return <p className="text-sm text-muted italic">No hints requested yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#EAE8E1" vertical={false} />
        <XAxis dataKey="level" tick={{ fontSize: 11, fill: "#6B6A63" }} tickLine={false} axisLine={{ stroke: "#DEDCD5" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B6A63" }} tickLine={false} axisLine={{ stroke: "#DEDCD5" }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2, border: "1px solid #DEDCD5" }} />
        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
