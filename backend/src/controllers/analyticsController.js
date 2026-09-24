import ProblemAttempt from "../models/ProblemAttempt.js";
import scoringService, { CONFIG } from "../services/scoringService.js";

/** Fetch full chronological history for a student. */
export async function getHistory(studentId) {
  return ProblemAttempt.find({ studentId }).sort({ timestamp: 1 }).lean();
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

export default { getHistory, getDashboard };
