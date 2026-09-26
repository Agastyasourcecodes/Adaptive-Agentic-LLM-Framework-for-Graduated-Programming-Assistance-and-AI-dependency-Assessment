import express from "express";
import ProblemAttempt from "../models/ProblemAttempt.js";
import * as hintController from "../controllers/hintController.js";
import { runAnalysisPipeline, runHintPipeline } from "../agents/orchestrator.js";
import { listProviders, DEFAULT_PROVIDER } from "../services/llmRouter.js";

const router = express.Router();

function problemKeyFor(problemText) {
  return problemText.trim().slice(0, 80).toLowerCase();
}

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

/**
 * Upsert the live ProblemAttempt row for this studentId + problemKey.
 * Only the problem statement + the scoring parameters are ever saved —
 * never the student's code. Called after every analyze/hint/submit call.
 */
async function persistLiveAttempt(studentId, key, session, solved = false) {
  const record = hintController.buildLiveRecord(studentId, key, session, solved);
  return ProblemAttempt.findOneAndUpdate(
    { studentId, problemKey: key },
    record,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

router.get("/providers", (req, res) => {
  res.json({ default: DEFAULT_PROVIDER, providers: listProviders() });
});

router.post("/analyze", async (req, res) => {
  try {
    const { studentId, problemText, code, provider } = req.body;
    if (!studentId || !problemText) {
      return res.status(400).json({ error: "studentId and problemText are required" });
    }
    const key = problemKeyFor(problemText);
    const out = await runAnalysisPipeline({ studentId, key, problemText, code, provider });

    await persistLiveAttempt(studentId, key, out.session, false);

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

router.post("/hint", async (req, res) => {
  try {
    const { studentId, problemText, code, provider } = req.body;
    if (!studentId || !problemText) {
      return res.status(400).json({ error: "studentId and problemText are required" });
    }
    const key = problemKeyFor(problemText);
    const out = await runHintPipeline({ studentId, key, problemText, code, provider });

    await persistLiveAttempt(studentId, key, out.session, false);

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

router.post("/submit", async (req, res) => {
  try {
    const { studentId, problemText, solved, giveUp } = req.body;
    if (!studentId || !problemText) {
      return res.status(400).json({ error: "studentId and problemText are required" });
    }
    const key = problemKeyFor(problemText);
    const session = hintController.getOrCreateSession(studentId, key, problemText);
    hintController.recordAttempt(session);

    const finalized = Boolean(solved) || Boolean(giveUp);
    const saved = await persistLiveAttempt(studentId, key, session, Boolean(solved));

    if (finalized) {
      hintController.clearSession(studentId, key);
    }

    res.json({
      finalized,
      record: saved,
      attempts: session.attempts,
      hintsGiven: session.hintsGiven
    });
  } catch (err) {
    console.error("[mentor/submit] error:", err);
    res.status(500).json({ error: "Submit failed." });
  }
});

export default router;