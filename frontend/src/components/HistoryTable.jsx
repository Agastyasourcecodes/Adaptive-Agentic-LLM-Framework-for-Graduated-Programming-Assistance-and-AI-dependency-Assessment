export default function HistoryTable({ history }) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-muted italic">No problems recorded yet.</p>;
  }

  const rows = [...history].reverse(); // most recent first

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-line">
            <th className="py-2 pr-4 font-medium">Problem</th>
            <th className="py-2 pr-4 font-medium">Attempts</th>
            <th className="py-2 pr-4 font-medium">Highest Hint</th>
            <th className="py-2 pr-4 font-medium">Dependency</th>
            <th className="py-2 pr-4 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="py-2 pr-4">{h.problem}</td>
              <td className="py-2 pr-4">{h.attempts}</td>
              <td className="py-2 pr-4">{h.highestHint > 0 ? `L${h.highestHint}` : "—"}</td>
              <td className="py-2 pr-4">{h.dependency}</td>
              <td className="py-2 pr-4">
                <span
                  className={
                    h.solved
                      ? "text-accent"
                      : "text-muted"
                  }
                >
                  {h.solved ? "Solved" : "Unresolved"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
