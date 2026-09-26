import ProblemAttempt from "../models/ProblemAttempt.js";
import scoringService, { CONFIG } from "../services/scoringService.js";
import { LEVELS } from "./hintController.js";

/** Fetch full chronological history for a student. */
export async function getHistory(studentId) {
  return ProblemAttempt.find({ studentId }).sort({ timestamp: 1 }).lean();
}

/**
 * Per-problem H / I / R / T / ADS breakdown, alongside the original problem
 * statement the student pasted (stored verbatim in `problem` at submit time —
 * see hintController.buildHistoryRecord). Unlike the dashboard's aggregate
 * scores (which average over the evaluation window), every number here is
 * computed for that ONE attempt only, so a student or reviewer can see
 * exactly which problem drove the aggregate up or down.
 *
 * R is aggregate-shaped by definition ("problems needing AI in last N"), so
 * its per-problem value is a binary indicator (100 if this attempt used any
 * AI iteration, else 0) — the same predicate aggregateR averages over the
 * window.
 */
function perProblemMetrics(record) {
  const H = scoringService.highestHintScore(record);
  const I = scoringService.aiInteractionScore(record);
  const T = scoringService.timeToHelpScore(record);
  const R = record.aiIterations > 0 ? 100 : 0;
  const { H: wH, I: wI, R: wR, T: wT } = CONFIG.adsWeights;
  const ADS = Math.round((wH * H + wI * I + wR * R + wT * T) * 100) / 100;
  return {
    H: Math.round(H * 100) / 100,
    I: Math.round(I * 100) / 100,
    R,
    T: Math.round(T * 100) / 100,
    ADS
  };
}

function toProblemPayload(record) {
  return {
    id: String(record._id),
    problemStatement: record.problem, // full text as pasted by the student
    attempts: record.attempts,
    aiIterations: record.aiIterations,
    highestHint: record.highestHint,
    highestHintLabel: record.highestHint > 0 ? `L${record.highestHint} — ${LEVELS[record.highestHint]}` : "None",
    timeToFirstHelp: record.timeToFirstHelp,
    solved: record.solved,
    timestamp: record.timestamp,
    metrics: perProblemMetrics(record)
  };
}

/** GET-able list: every problem attempt for a student, most recent first. */
export async function getProblemMetrics(studentId) {
  const history = await getHistory(studentId);
  return {
    weights: CONFIG.adsWeights,
    count: history.length,
    problems: history.map(toProblemPayload).reverse()
  };
}

/** GET-able single record, by its Mongo _id, for a detail/expanded view. */
export async function getProblemMetricById(studentId, id) {
  const record = await ProblemAttempt.findOne({ _id: id, studentId }).lean();
  if (!record) return null;
  return toProblemPayload(record);
}

/**
 * Build the full dashboard payload: current scores, trends (per-problem
 * series so the frontend can chart progression), distribution, and history.
 */
export async function getDashboard(studentId) {
  const history = await getHistory(studentId);

  const { ADS, H, I, R, T } = scoringService.computeADS(history);
  const codingSkill = scoringService.computeCodingSkill(history);
  const independentSolvePercent = scoringService.independentSolvePercent(history);
  const distribution = scoringService.hintDistribution(history);

  // Trend series: recompute ADS/CodingSkill as of each point in history so
  // charts show real progression, not just the final snapshot.
  const adsTrend = [];
  const skillTrend = [];
  const hirtTrend = [];
  for (let i = 0; i < history.length; i++) {
    const slice = history.slice(0, i + 1);
    const s = scoringService.computeADS(slice);
    adsTrend.push({ index: i + 1, problem: history[i].problem, ADS: s.ADS });
    skillTrend.push({
      index: i + 1,
      problem: history[i].problem,
      CodingSkill: scoringService.computeCodingSkill(slice)
    });
    hirtTrend.push({ index: i + 1, problem: history[i].problem, H: s.H, I: s.I, R: s.R, T: s.T });
  }

  const problemsSolved = history.filter((p) => p.solved).length;

  return {
    scores: { ADS, H, I, R, T, codingSkill, independentSolvePercent },
    problemsSolved,
    totalProblems: history.length,
    distribution,
    trends: { ads: adsTrend, skill: skillTrend, hirt: hirtTrend },
    history: history.map((h) => ({
      problem: h.problem,
      attempts: h.attempts,
      highestHint: h.highestHint,
      aiIterations: h.aiIterations,
      timeToFirstHelp: h.timeToFirstHelp,
      solved: h.solved,
      timestamp: h.timestamp,
      // per-problem ADS contribution, purely for display/explainability
      dependency: Math.round(
        (0.35 * scoringService.highestHintScore(h) +
          0.25 * scoringService.aiInteractionScore(h) +
          0.15 * scoringService.timeToHelpScore(h)) *
          100
      ) / 100
    })),
    research: {
      formula: "ADS = 0.35H + 0.25I + 0.25R + 0.15T",
      weights: CONFIG.adsWeights,
      codingSkillWeights: CONFIG.codingSkillWeights,
      evaluationWindow: CONFIG.evaluationWindow,
      timeBenchmarkSeconds: CONFIG.timeBenchmarkSeconds,
      substituted: { H, I, R, T, ADS }
    }
  };
}

export default { getHistory, getDashboard, getProblemMetrics, getProblemMetricById };
