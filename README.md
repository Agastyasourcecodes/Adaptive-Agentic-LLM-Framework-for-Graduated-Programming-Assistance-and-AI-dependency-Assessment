# Adaptive AI Coding Mentor

A working prototype of a graduated-hint coding mentor. A student pastes a
problem and their code; a local **Qwen** model (via **Ollama**) analyzes it
and the app decides how much help to reveal, escalating gradually:

```
L1 Nudge → L2 Concept → L3 Direction → L4 Algorithm → L5 Pseudocode → L6 Implementation
```

**Qwen (local, via Ollama) is the default and needs no key.** Gemini and Grok can be
selected in the Workspace if you add API keys; if a selected API has no key, is out of
quota, errors, or times out, the request automatically falls back to Qwen.

---

## Architecture

```
adaptive-ai-coding-mentor/
├── backend/                  Node + Express API
│   └── src/
│       ├── agents/
│       │   ├── orchestrator.js         ← agentic pipelines + per-step trace
│       │   └── levelGuard.js           ← rule-based check: no higher-level leakage
│       ├── controllers/
│       │   ├── hintController.js       ← decides WHICH level to reveal (pure logic)
│       │   └── analyticsController.js  ← builds dashboard payload from history
│       ├── services/
│       │   ├── scoringService.js       ← ALL H/I/R/T/ADS/CodingSkill math (pure, no LLM)
│       │   ├── llmRouter.js            ← Qwen / Gemini / Grok + automatic fallback to Qwen
│       │   └── mentorLLMService.js     ← prompts + parsing for the two LLM agents
│       ├── models/ProblemAttempt.js    ← minimal history schema
│       ├── routes/                     ← /api/mentor/*, /api/analytics/*
│       └── data/                       ← sample data + seed script
└── frontend/                 React + Vite + Tailwind + Recharts + React Router
    └── src/
        ├── pages/            DashboardPage (/), WorkspacePage (/workspace)
        ├── components/       Header, Dashboard, ResearchPanel, Workspace, ModelSelector,
        │                     AgentPipeline, LevelLadder, HistoryTable, charts/, diagrams/
        └── api/client.js     fetch wrapper for the backend
```

**Design principle:** the LLM never scores anything and never decides the
hint level. `hintController` makes that decision deterministically from
attempts / prior hints / detected mistake severity; `ollamaService` is then
prompted to generate text **strictly within** the assigned level. All
metrics (H, I, R, T, ADS, Coding Skill) are computed in `scoringService.js`
in plain JavaScript — auditable and swappable without touching the model.

## Pages

- **Dashboard** (`/`) — metrics, trends, hint distribution, history, research panel and the ADS composition diagram.
- **Workspace** (`/workspace`) — model selector, coding workspace, live agentic-workflow trace, assistance-level ladder,
  and research diagrams (architecture, hint-escalation state machine, model routing / fallback).

## Agentic workflow

| Step | Agent | Type | Role |
| ---- | ----- | ---- | ---- |
| 1 | Session Manager | deterministic | loads per-problem state |
| 2 | Analyzer Agent | **LLM** | diagnostic signal (status, issue type, repeated pattern) |
| 3 | Level Controller | deterministic | picks L1–L6 (stalling / repeated-mistake escalation) |
| 4 | Hint Agent | **LLM** | writes hint text strictly at the assigned level |
| 5 | Level Guard | rules | rejects code/over-length output that exceeds the level; regenerates once, then sanitizes |
| 6 | Telemetry Recorder | deterministic | records hint → feeds H, I, T |

Every API response includes a `trace` of these steps (status, latency, detail, provider used) which the Workspace renders live.

## Models & fallback

| Provider | Default model | Enabled by | Env override |
| -------- | ------------- | ---------- | ------------ |
| Qwen (Ollama) | `qwen2.5-coder:0.5b` | always | `OLLAMA_MODEL` |
| Gemini | `gemini-2.5-flash` | `GEMINI_API_KEY` | `GEMINI_MODEL` |
| Grok (xAI) | `grok-4.7` | `XAI_API_KEY` (or `GROK_API_KEY`) | `XAI_MODEL` |

Fallback to Qwen triggers on: missing key, quota/rate-limit (429/402), auth failure, 5xx, timeout, network error, or empty
response. After a quota/auth failure the provider is skipped for `PROVIDER_COOLDOWN_SECONDS` (default 60) so an exhausted
API isn't retried on every click. API keys live only in `backend/.env` and are never sent to the browser.
`GET /api/mentor/providers` reports which providers are ready (no key material).

---

## Prerequisites

1. **Node.js** 18+
2. **MongoDB** running locally (or a connection string to any MongoDB instance)
3. **Ollama** installed locally: https://ollama.com
4. A Qwen coding model pulled into Ollama, e.g.:

   ```bash
   ollama pull qwen2.5-coder:0.5b
   ```

   (Any locally available Qwen model works — set its name in `backend/.env`.
   This prototype defaults to `qwen2.5-coder:0.5b` for a small footprint
   (~400–600MB) and fast responses on modest hardware. Smaller models are
   less reliable at strictly honoring the level constraints in the hint
   prompts — watch the L1–L3 outputs and bump up to `1.5b`/`7b` if it starts
   leaking full solutions too early.)

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env       # adjust MONGO_URI / OLLAMA_MODEL if needed
npm install
npm run seed                # loads 12 sample problems for the demo student
npm run dev                 # starts the API on http://localhost:5000
```

### 2. Ollama

In a separate terminal, make sure Ollama is serving the model:

```bash
ollama serve                 # if not already running as a service
ollama pull qwen2.5-coder:0.5b # first time only
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                  # starts the app on http://localhost:5173
```

Open http://localhost:5173. The Dashboard page loads the seeded sample data
immediately; the Workspace page (`/workspace`) talks to the selected model (Qwen by default) for Analyze / Get Next Hint.

---

## Configuration

| Setting | Location | Notes |
|---|---|---|
| `OLLAMA_MODEL` | `backend/.env` | any local Qwen tag pulled into Ollama |
| `OLLAMA_BASE_URL` | `backend/.env` | default `http://127.0.0.1:11434` |
| `MONGO_URI` | `backend/.env` | local or remote MongoDB |
| `TIME_BENCHMARK_SECONDS` | `backend/.env` | default 600 (10 min), used by T |
| `EVALUATION_WINDOW` | `backend/.env` | default 10, used by R and dashboard aggregates |
| ADS weights | `backend/src/services/scoringService.js` → `CONFIG.adsWeights` | fixed per spec: 0.35/0.25/0.25/0.15 |
| Coding Skill weights | `backend/src/services/scoringService.js` → `CONFIG.codingSkillWeights` | freely tunable, shown live in the Research Panel |
| Documentation button target | `frontend/src/api/client.js` → `DOCUMENTATION_PATH` | defaults to `/docs/research-documentation.pdf`, served from `frontend/public/docs/` — replace that file with the real write-up whenever it's ready |

---

## Metrics reference

- **H — Highest Hint**: `(highest level reached / 6) × 100`, averaged over the evaluation window.
- **I — AI Interaction**: `(AI-assisted iterations / total iterations) × 100` per problem, averaged over the window.
- **R — Recent Reliance**: `(problems needing AI / last 10 problems) × 100`.
- **T — Time-to-Help**: `max(0, 1 − time_to_first_help / 10min) × 100`, averaged over the window. A problem solved without ever asking for help scores 100.
- **ADS — AI Dependency Score**: `0.35H + 0.25I + 0.25R + 0.15T`.
- **Coding Skill (0–100)**: configurable, transparent formula combining independent-solve rate and inverse hint/AI reliance — see `scoringService.computeCodingSkill` and the Research Panel in the UI.

History records store only: `problem, attempts, aiIterations, highestHint, timeToFirstHelp, solved, timestamp`.

---

## Hint escalation logic (`hintController.js`)

- The first hint requested for a problem is always **L1**.
- Each subsequent request escalates by **+1** level by default (progressive disclosure — never skip ahead unnecessarily).
- If the student is submitting attempts without engaging with hints (stalling), escalation speeds up by an extra step.
- If Qwen's diagnostic flags a **repeated mistake pattern**, one additional step of escalation is allowed.
- Level is capped at **L6** and never decreases within a problem.

## Extending

- Swap the Coding Skill formula weights in one place (`scoringService.js`) — the UI picks up the change automatically via the Research Panel.
- Multi-student support: the backend already keys everything by `studentId`; add an auth layer and pass a real ID instead of the single `demo-student-1` used in this prototype.
- Replace `docs/research-documentation.pdf` with the real methodology paper — no code changes needed.
