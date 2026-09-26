import { Link } from "react-router-dom";
import TrendChart from "./charts/TrendChart";
import HintDistributionChart from "./charts/HintDistributionChart";
import HistoryTable from "./HistoryTable";

function Metric({ label, value, suffix = "" }) {
  return (
    <div className="card">
      <div className="card-title">{label}</div>
      <div className="metric-value">
        {value}
        {suffix}
      </div>
    </div>
  );
}

export default function Dashboard({ data, loading }) {
  if (loading) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted">No data available. Is the API server running?</p>;
  }

  const { scores, problemsSolved, totalProblems, distribution, trends, history } = data;

  if (totalProblems === 0) {
    return (
      <div className="card text-center py-10">
        <div className="card-title mb-2">No problems recorded yet</div>
        <p className="text-sm text-ink max-w-md mx-auto mb-5">
          Solve — or just attempt — a problem in the Workspace and your Coding Skill, AI Dependency
          (ADS), and H / I / R / T scores will appear here automatically.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/workspace" className="btn-primary">
            Open Workspace →
          </Link>
          <Link to="/" className="btn-secondary">
            What do these metrics mean?
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Coding Skill" value={scores.codingSkill} />
        <Metric label="AI Dependency (ADS)" value={scores.ADS} />
        <Metric label="Independent Solve" value={scores.independentSolvePercent} suffix="%" />
        <Metric label="Problems Solved" value={`${problemsSolved} / ${totalProblems}`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="H — Highest Hint" value={scores.H} />
        <Metric label="I — AI Interaction" value={scores.I} />
        <Metric label="R — Recent Reliance" value={scores.R} />
        <Metric label="T — Time-to-Help" value={scores.T} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">AI Dependency Trend</div>
          <TrendChart data={trends.ads} lines={[{ key: "ADS", name: "ADS" }]} />
        </div>
        <div className="card">
          <div className="card-title">Coding Skill Trend</div>
          <TrendChart
            data={trends.skill}
            lines={[{ key: "CodingSkill", name: "Coding Skill", color: "#B08968" }]}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">H / I / R / T Trends</div>
          <TrendChart
            data={trends.hirt}
            lines={[
              { key: "H", name: "H" },
              { key: "I", name: "I", color: "#8A8D91" },
              { key: "R", name: "R", color: "#B08968" },
              { key: "T", name: "T", color: "#607D8B" }
            ]}
          />
        </div>
        <div className="card">
          <div className="card-title">L1–L6 Hint Distribution</div>
          <HintDistributionChart distribution={distribution} />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Recent Problem History</div>
        <HistoryTable history={history} />
      </div>
    </div>
  );
}