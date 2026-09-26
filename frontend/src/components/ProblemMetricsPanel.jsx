import { useEffect, useState, useCallback } from "react";
import api from "../api/client";

function MetricChip({ label, value }) {
  return (
    <div className="flex flex-col items-center border border-line rounded-sm px-3 py-2 min-w-[64px]">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      <span className="font-serif text-lg text-ink">{value}</span>
    </div>
  );
}

function ProblemRow({ record }) {
  const [expanded, setExpanded] = useState(false);
  const { metrics } = record;

  return (
    <div className="border border-line rounded-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={
                record.solved
                  ? "text-accent text-xs font-medium"
                  : "text-muted text-xs font-medium"
              }
            >
              {record.solved ? "Solved" : "Unresolved"}
            </span>
            <span className="text-xs text-muted">
              {new Date(record.timestamp).toLocaleString()}
            </span>
            <span className="level-badge">{record.highestHintLabel}</span>
          </div>

          {/* Original problem statement, as pasted by the student */}
          <p
            className={
              "text-sm text-ink whitespace-pre-wrap " + (expanded ? "" : "line-clamp-2")
            }
          >
            {record.problemStatement}
          </p>
          {record.problemStatement && record.problemStatement.length > 140 && (
            <button
              className="text-xs text-accent underline mt-1"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? "Show less" : "Show full problem statement"}
            </button>
          )}

          <div className="text-xs text-muted mt-2">
            {record.attempts} attempt{record.attempts === 1 ? "" : "s"} · {record.aiIterations} AI
            iteration{record.aiIterations === 1 ? "" : "s"}
            {record.timeToFirstHelp !== null && ` · first help at ${record.timeToFirstHelp}s`}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 shrink-0">
          <MetricChip label="H" value={metrics.H} />
          <MetricChip label="I" value={metrics.I} />
          <MetricChip label="R" value={metrics.R} />
          <MetricChip label="T" value={metrics.T} />
          <MetricChip label="ADS" value={metrics.ADS} />
        </div>
      </div>
    </div>
  );
}

export default function ProblemMetricsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.getProblemMetrics());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="card-title mb-0">Per-Problem Dependency Breakdown</div>
        <button className="text-xs text-accent underline" onClick={load}>
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">
          Could not reach backend: {error}. Is the API server running?
        </p>
      )}
      {!loading && !error && (!data || data.problems.length === 0) && (
        <p className="text-sm text-muted italic">No problems recorded yet.</p>
      )}

      {!loading && !error && data && data.problems.length > 0 && (
        <>
          <p className="text-xs text-muted mb-3">
            ADS = {data.weights.H}H + {data.weights.I}I + {data.weights.R}R + {data.weights.T}T, computed
            per attempt (not averaged over the evaluation window like the dashboard totals).
          </p>
          <div className="space-y-3">
            {data.problems.map((record) => (
              <ProblemRow key={record.id} record={record} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
