import { NavLink } from "react-router-dom";
import { DOCUMENTATION_PATH } from "../api/client";

const linkClass = ({ isActive }) =>
  `text-sm px-3 py-2 border-b-2 -mb-px transition-colors ${
    isActive ? "border-accent text-ink font-medium" : "border-transparent text-muted hover:text-ink"
  }`;

export default function Header() {
  return (
    <header className="border-b border-line bg-white">
      <div className="max-w-6xl mx-auto px-6 pt-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">Adaptive AI Coding Mentor</h1>
          <p className="text-sm text-muted mt-1">
            Adaptive Agentic LLM Framework for Graduated Programming Assistance &amp; AI-Dependency Assessment
          </p>
        </div>
        <a
          href={DOCUMENTATION_PATH}
          download
          className="btn-secondary whitespace-nowrap mt-1"
          title={`Configured to fetch: ${DOCUMENTATION_PATH}`}
        >
          Documentation ↓
        </a>
      </div>
      <nav className="max-w-6xl mx-auto px-6 mt-4 flex gap-2">
        <NavLink to="/" end className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/workspace" className={linkClass}>
          Workspace
        </NavLink>
      </nav>
    </header>
  );
}
