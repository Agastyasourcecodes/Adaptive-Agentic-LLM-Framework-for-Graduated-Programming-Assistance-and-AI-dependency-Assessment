/**
 * scoringService.js
 * ------------------
 * All quantitative scoring for the Adaptive AI Coding Mentor lives here.
 * The LLM (Qwen) NEVER computes scores — it only generates hint text.
 * Every function is pure (input -> output) so it's easy to test and audit.
 */

const MAX_HINT_LEVEL = 6;

export const CONFIG = {
  timeBenchmarkSeconds: Number(process.env.TIME_BENCHMARK_SECONDS) || 600, // 10 min
  evaluationWindow: Number(process.env.EVALUATION_WINDOW) || 10, // last N problems
  // ADS weights (must sum to 1.0)
  adsWeights: { H: 0.35, I: 0.25, R: 0.25, T: 0.15 },
  // Coding Skill weights — transparent & configurable, shown in the UI as-is.
  // CodingSkill rewards independent solving and penalizes heavy hint/AI reliance.
  codingSkillWeights: {
    independentSolveRate: 0.5, // weight on % of recent problems solved with little/no AI
    lowHintUsage: 0.3, // weight on (100 - H): shallower hints => higher skill
    lowAiReliance: 0.2 // weight on (100 - I): fewer AI-assisted iterations => higher skill
  }
};

/** Take only the most recent N problems (already sorted ascending by time expected). */
function windowed(problems, n = CONFIG.evaluationWindow) {
  return problems.slice(Math.max(0, problems.length - n));
}

/**
 * H — Highest Hint
 * Per-problem: (highestLevelReached / 6) * 100
 * Aggregate (dashboard): mean of per-problem H over the evaluation window.
 */
export function highestHintScore(problem) {
  const level = Math.min(MAX_HINT_LEVEL, Math.max(0, problem.highestHint || 0));
  return (level / MAX_HINT_LEVEL) * 100;
}

export function aggregateH(problems) {
  const w = windowed(problems);
  if (w.length === 0) return 0;
  const total = w.reduce((sum, p) => sum + highestHintScore(p), 0);
  return total / w.length;
}

/**
 * I — AI Interaction
 * Per-problem: (aiIterations / totalIterations) * 100
 * Aggregate: mean of per-problem I over the evaluation window.
 */
export function aiInteractionScore(problem) {
  if (!problem.attempts) return 0;
  return (Math.min(problem.aiIterations, problem.attempts) / problem.attempts) * 100;
}

export function aggregateI(problems) {
  const w = windowed(problems);
  if (w.length === 0) return 0;
  const total = w.reduce((sum, p) => sum + aiInteractionScore(p), 0);
  return total / w.length;
}

/**
 * R — Recent Reliance
 * (problems needing AI / last 10 problems) * 100
 * "needing AI" = at least one AI-assisted iteration (aiIterations > 0).
 */
export function aggregateR(problems) {
  const w = windowed(problems);
  if (w.length === 0) return 0;
  const needingAI = w.filter((p) => p.aiIterations > 0).length;
  return (needingAI / w.length) * 100;
}

/**
 * T — Time-to-Help
 * max(0, 1 - time_to_first_help / 10min) * 100
 * A student who never asked for help (timeToFirstHelp === null) is treated as the
 * best case (100) for that problem — they didn't need help at all.
 * Aggregate: mean over the evaluation window.
 */
export function timeToHelpScore(problem) {
  if (problem.timeToFirstHelp === null || problem.timeToFirstHelp === undefined) return 100;
  const ratio = problem.timeToFirstHelp / CONFIG.timeBenchmarkSeconds;
  return Math.max(0, 1 - ratio) * 100;
}

export function aggregateT(problems) {
  const w = windowed(problems);
  if (w.length === 0) return 0;
  const total = w.reduce((sum, p) => sum + timeToHelpScore(p), 0);
  return total / w.length;
}

/**
 * ADS — AI Dependency Score
 * ADS = 0.35H + 0.25I + 0.25R + 0.15T
 */
export function computeADS(problems) {
  const H = aggregateH(problems);
  const I = aggregateI(problems);
  const R = aggregateR(problems);
  const T = aggregateT(problems);
  const { H: wH, I: wI, R: wR, T: wT } = CONFIG.adsWeights;
  const ADS = wH * H + wI * I + wR * R + wT * T;
  return { ADS: round2(ADS), H: round2(H), I: round2(I), R: round2(R), T: round2(T) };
}

/**
 * Coding Skill Score (0-100)
 * Transparent, configurable formula combining independent-solve rate and
 * inverse hint/AI reliance. Weights come from CONFIG.codingSkillWeights so the
 * UI can display the exact formula being used.
 */
export function computeCodingSkill(problems) {
  const w = windowed(problems);
  const { H, I } = computeADS(problems);
  const independentSolveRate = independentSolvePercent(problems);
  const weights = CONFIG.codingSkillWeights;
  const score =
    weights.independentSolveRate * independentSolveRate +
    weights.lowHintUsage * (100 - H) +
    weights.lowAiReliance * (100 - I);
  return round2(Math.min(100, Math.max(0, score)));
}

/** % of recent problems solved with zero AI iterations (fully independent). */
export function independentSolvePercent(problems) {
  const w = windowed(problems);
  if (w.length === 0) return 0;
  const independent = w.filter((p) => p.solved && p.aiIterations === 0).length;
  return round2((independent / w.length) * 100);
}

export function hintDistribution(problems) {
  const dist = { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0 };
  for (const p of problems) {
    const lvl = Math.min(MAX_HINT_LEVEL, Math.max(0, p.highestHint || 0));
    if (lvl >= 1) dist[`L${lvl}`] += 1;
  }
  return dist;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export default {
  CONFIG,
  computeADS,
  computeCodingSkill,
  independentSolvePercent,
  hintDistribution,
  highestHintScore,
  aiInteractionScore,
  timeToHelpScore,
  aggregateH,
  aggregateI,
  aggregateR,
  aggregateT
};
