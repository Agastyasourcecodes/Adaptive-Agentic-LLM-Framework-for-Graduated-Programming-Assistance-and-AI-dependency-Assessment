import express from "express";
import ProblemAttempt from "../models/ProblemAttempt.js";
import * as hintController from "../controllers/hintController.js";
import { runAnalysisPipeline, runHintPipeline } from "../agents/orchestrator.js";
import { listProviders, DEFAULT_PROVIDER } from "../services/llmRouter.js";

const router = express.Router();

function problemKeyFor(problemText) {
  // Simple stable key for session lookup (first 80 chars, normalized).
  return problemText.trim().slice(0, 80).toLowerCase();
}

/** Compact provider summary attached to every LLM response. */
function providerInfo(meta) {
  return {
    requested: meta.requested,
    used: meta.provider,
    model: meta.model,
    fallback: meta.fallback,
    fallbackReason: meta.fallbackReason,
    latencyMs: meta.latencyMs
  };
}

/** GET /api/mentor/providers — which models are available (no secrets). */
router.get("/providers", (req, res) => {
  res.json({ default: DEFAULT_PROVIDER, providers: listProviders() });
});

/**
 * POST /api/mentor/analyze
 * Body: { studentId, problemText, code, provider? }
 */
router.post("/analyze", async (req, res) => {
  try {
    const { studentId, problemText, code, provider } = req.body;
    if (!studentId || !problemText) {
      return res.status(400).json({ error: "studentId and problemText are required" });
    }
    const key = problemKeyFor(problemText);
    const out = await runAnalysisPipeline({ studentId, key, problemText, code, provider });

    res.json({
      analysis: out.analysis,
      currentLevel: out.currentLevel,
      currentLevelName: out.currentLevel ? hintController.LEVELS[out.currentLevel] : null,
      attempts: out.session.attempts,
      hintsGiven: out.session.hintsGiven,
      provider: providerInfo(out.meta),
      trace: out.trace
    });
  } catch (err) {
    console.error("[mentor/analyze] error:", err);
    res.status(500).json({ error: err.message || "Analysis failed." });
  }
});

/**
 * POST /api/mentor/hint
 * Body: { studentId, problemText, code, provider? }
 * Level Controller decides the level; the selected model writes the text.
 */
router.post("/hint", async (req, res) => {
  try {
    const { studentId, problemText, code, provider } = req.body;
    if (!studentId || !problemText) {
      return res.status(400).json({ error: "studentId and problemText are required" });
    }
    const key = problemKeyFor(problemText);
    const out = await runHintPipeline({ studentId, key, problemText, code, provider });

    res.json({
      level: out.level,
      levelName: out.levelName,
      text: out.text,
      hintsGiven: out.session.hintsGiven,
      timeToFirstHelp: out.tth,
      provider: providerInfo(out.meta),
      trace: out.trace
    });
  } catch (err) {
    console.error("[mentor/hint] error:", err);
    res.status(500).json({ error: err.message || "Hint generation failed." });
  }
});

/**
 * POST /api/mentor/submit
 * Body: { studentId, problemText, solved, giveUp }
 */
router.post("/submit", async (req, res) => {
  try {
    const { studentId, problemText, solved, giveUp } = req.body;
    if (!studentId || !problemText) {
      return res.status(400).json({ error: "studentId and problemText are required" });
    }
    const key = problemKeyFor(problemText);
    const session = hintController.getOrCreateSession(studentId, key, problemText);
    hintController.recordAttempt(session);

    if (solved || giveUp) {
      const record = hintController.buildHistoryRecord(studentId, key, session, Boolean(solved));
      const saved = await ProblemAttempt.create(record);
      hintController.clearSession(studentId, key);
      return res.json({ finalized: true, record: saved });
    }

    res.json({
      finalized: false,
      attempts: session.attempts,
      hintsGiven: session.hintsGiven
    });
  } catch (err) {
    console.error("[mentor/submit] error:", err);
    res.status(500).json({ error: "Submit failed." });
  }
});

export default router;
