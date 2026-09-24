import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Workspace from "../components/Workspace";
import ModelSelector from "../components/ModelSelector";
import AgentPipeline from "../components/AgentPipeline";
import LevelLadder from "../components/LevelLadder";
import ArchitectureDiagram from "../components/diagrams/ArchitectureDiagram";
import EscalationDiagram from "../components/diagrams/EscalationDiagram";
import FallbackDiagram from "../components/diagrams/FallbackDiagram";
import api from "../api/client";

const STORAGE_KEY = "mentor.provider";
const TABS = [
  { id: "arch", label: "Architecture" },
  { id: "esc", label: "Hint Escalation" },
  { id: "route", label: "Model Routing" }
];

function loadProvider() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "qwen"; // Qwen is the default
  } catch {
    return "qwen";
  }
}

export default function WorkspacePage() {
  const [provider, setProvider] = useState(loadProvider);
  const [providers, setProviders] = useState(null);
  const [running, setRunning] = useState(null); // "analyze" | "hint" | null
  const [trace, setTrace] = useState(null);
  const [traceKind, setTraceKind] = useState(null);
  const [level, setLevel] = useState(0);
  const [tab, setTab] = useState("arch");

  const refreshProviders = useCallback(async () => {
    try {
      const res = await api.getProviders();
      setProviders(res.providers);
    } catch {
      setProviders(null); // backend unreachable — selector shows static defaults
    }
  }, []);

  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  function choose(id) {
    setProvider(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage unavailable — selection just isn't persisted */
    }
  }

  function handleRunStart(kind) {
    setRunning(kind);
  }

  function handleRunResult({ kind, trace: t, level: l }) {
    setRunning(null);
    if (kind === null) {
      setTrace(null);
      setTraceKind(null);
      setLevel(0);
      return;
    }
    if (t) {
      setTrace(t);
      setTraceKind(kind);
    }
    if (typeof l === "number") setLevel(l);
    refreshProviders(); // pick up cool-down state after quota errors
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-ink">Workspace</h2>
          <Link to="/" className="btn-secondary">
            ← Dashboard
          </Link>
        </div>
        <div className="card">
          <ModelSelector providers={providers} value={provider} onChange={choose} disabled={running !== null} />
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Workspace provider={provider} onRunStart={handleRunStart} onRunResult={handleRunResult} />
        </div>
        <div className="space-y-6">
          <AgentPipeline running={running} trace={trace} kind={traceKind} />
          <LevelLadder level={level} />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg text-ink mb-1">Framework</h2>
        <p className="text-sm text-muted mb-4">How the agents, the level controller and the model router fit together.</p>
        <div className="flex gap-2 border-b border-line mb-4" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`text-sm px-3 py-2 border-b-2 -mb-px transition-colors ${
                tab === t.id ? "border-accent text-ink font-medium" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "arch" && <ArchitectureDiagram />}
        {tab === "esc" && <EscalationDiagram currentLevel={level} />}
        {tab === "route" && <FallbackDiagram />}
      </section>
    </main>
  );
}
