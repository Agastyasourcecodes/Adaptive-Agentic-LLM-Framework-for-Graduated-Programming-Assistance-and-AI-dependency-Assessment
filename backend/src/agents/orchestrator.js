/**
 * orchestrator.js
 * ---------------
 * Agentic workflow. Each call returns a `trace` — an ordered list of agent
 * steps with status, latency and a human-readable detail — which the
 * Workspace page renders as a live pipeline. Only the two LLM agents call a
 * model; everything else is deterministic and auditable.
 *
 *  HINT PIPELINE
 *   1 Session Manager     (deterministic)  load/create per-problem session
 *   2 Level Controller    (deterministic)  decide L1..L6
 *   3 Hint Agent          (LLM)            generate text at that level
 *   4 Level Guard         (rules)          verify no higher-level leakage
 *   4b Hint Agent retry   (LLM, optional)  regenerate once if guard fails
 *   5 Telemetry Recorder  (deterministic)  record hint → feeds H, I, T
 *
 *  ANALYSIS PIPELINE
 *   1 Session Manager → 2 Analyzer Agent (LLM) → 3 Signal Parser
 */
import * as hintController from "../controllers/hintController.js";
import * as mentorLLM from "../services/mentorLLMService.js";
import { checkLevelCompliance, sanitize } from "./levelGuard.js";

const now = () => Date.now();

function step(id, agent, kind, status, startedAt, detail, extra = {}) {
  return { id, agent, kind, status, ms: now() - startedAt, detail, ...extra };
}

function llmStep(id, agent, meta, startedAt, detail) {
  return step(id, agent, "llm", meta.fallback ? "fallback" : "done", startedAt, detail, {
    provider: meta.provider,
    model: meta.model,
    requested: meta.requested,
    fallbackReason: meta.fallbackReason
  });
}

export async function runAnalysisPipeline({ studentId, key, problemText, code, provider }) {
  const trace = [];

  let t = now();
  const session = hintController.getOrCreateSession(studentId, key, problemText);
  trace.push(
    step("session", "Session Manager", "deterministic", "done", t,
      `attempts=${session.attempts}, hints so far=[${session.hintsGiven.join(", ") || "—"}]`)
  );

  t = now();
  const { analysis, meta } = await mentorLLM.analyzeSubmission({ problemText, studentCode: code, provider });
  trace.push(llmStep("analyzer", "Analyzer Agent", meta, t, `status=${analysis.status}, issue=${analysis.issueType}`));

  t = now();
  session.lastAnalysis = analysis;
  trace.push(
    step("signal", "Signal Parser", "deterministic", "done", t,
      `repeatedPattern=${analysis.repeatedPattern ? "YES" : "NO"} → available to Level Controller`)
  );

  const currentLevel = session.hintsGiven.length ? Math.max(...session.hintsGiven) : 0;
  return { session, analysis, currentLevel, trace, meta };
}

export async function runHintPipeline({ studentId, key, problemText, code, provider }) {
  const trace = [];

  let t = now();
  const session = hintController.getOrCreateSession(studentId, key, problemText);
  trace.push(
    step("session", "Session Manager", "deterministic", "done", t,
      `attempts=${session.attempts}, hints so far=[${session.hintsGiven.join(", ") || "—"}]`)
  );

  t = now();
  const repeatedMistake = Boolean(session.lastAnalysis?.repeatedPattern);
  const decision = hintController.explainNextLevel(session, { repeatedMistake });
  trace.push(
    step("controller", "Level Controller", "deterministic", "done", t,
      `L${decision.highestSoFar || 0} → L${decision.level}  (step +${decision.level - decision.highestSoFar}; stalled=${decision.stalled ? "Y" : "N"}, repeated=${decision.repeatedMistake ? "Y" : "N"})`)
  );
  const level = decision.level;

  const priorHints = session.hintsGiven.map((lvl, idx) => ({
    level: lvl,
    text: session[`hintText_${idx}`] || ""
  }));

  t = now();
  let { text, meta } = await mentorLLM.generateHint({ level, problemText, studentCode: code, priorHints, provider });
  trace.push(llmStep("hint", "Hint Agent", meta, t, `generated L${level} ${hintController.LEVELS[level]} hint`));
  let finalMeta = meta;

  t = now();
  let check = checkLevelCompliance(level, text);
  trace.push(
    step("guard", "Level Guard", "rules", check.ok ? "done" : "warn", t,
      check.ok ? `compliant with L${level} (${check.words} words)` : `violation: ${check.violations.join("; ")}`)
  );

  if (!check.ok) {
    t = now();
    const retry = await mentorLLM.generateHint({
      level, problemText, studentCode: code, priorHints, provider,
      reinforce: check.violations.join("; ")
    });
    text = retry.text;
    finalMeta = retry.meta;
    trace.push(llmStep("retry", "Hint Agent (retry)", retry.meta, t, "regenerated with reinforced constraint"));

    t = now();
    check = checkLevelCompliance(level, text);
    if (check.ok) {
      trace.push(step("guard2", "Level Guard", "rules", "done", t, "retry compliant"));
    } else {
      text = sanitize(level, text);
      trace.push(step("guard2", "Level Guard", "rules", "warn", t, `still violating (${check.violations.join("; ")}) → sanitized`));
    }
  }

  t = now();
  hintController.recordHintGiven(session, level);
  session[`hintText_${session.hintsGiven.length - 1}`] = text;
  const tth = hintController.timeToFirstHelpSeconds(session);
  trace.push(
    step("telemetry", "Telemetry Recorder", "deterministic", "done", t,
      `aiIterations=${session.aiIterations}, timeToFirstHelp=${tth ?? "—"}s`)
  );

  return { level, levelName: hintController.LEVELS[level], text, session, tth, trace, meta: finalMeta, decision };
}

export default { runAnalysisPipeline, runHintPipeline };
