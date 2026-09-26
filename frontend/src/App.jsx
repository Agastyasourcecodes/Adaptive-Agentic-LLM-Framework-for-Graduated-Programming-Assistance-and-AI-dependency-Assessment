import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import WorkspacePage from "./pages/WorkspacePage";

export default function App() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="border-t border-line mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted">
          Adaptive AI Coding Mentor — Qwen (local, via Ollama) by default; Gemini and Grok optional via API keys, with automatic fallback to Qwen.
        </div>
      </footer>
    </div>
  );
}