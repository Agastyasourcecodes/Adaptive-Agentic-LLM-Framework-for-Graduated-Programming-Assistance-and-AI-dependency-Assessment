import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import ResearchPanel from "../components/ResearchPanel";
import AdsCompositionDiagram from "../components/diagrams/AdsCompositionDiagram";
import api from "../api/client";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    try {
      setDashboard(await api.getDashboard());
      setLoadError(null);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-ink">Analytics Dashboard</h2>
          <Link to="/workspace" className="btn-primary">
            Open Workspace →
          </Link>
        </div>
        {loadError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-sm mb-4">
            Could not reach backend: {loadError}. Is the API server running?
          </p>
        )}
        <Dashboard data={dashboard} loading={loading} />
      </section>

      <section>
        <h2 className="font-serif text-lg text-ink mb-4">Research</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ResearchPanel research={dashboard?.research} />
          <AdsCompositionDiagram research={dashboard?.research} />
        </div>
      </section>
    </main>
  );
}
