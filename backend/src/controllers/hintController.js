/**
 * hintController.js
 * ------------------
 * Decides WHICH hint level (1-6) the student should receive next.
 * This is pure application logic — no LLM call happens here. The chosen
 * level is then passed to ollamaService, which is prompted to STRICTLY
 * stay at that level and never leak higher-level information.
 *
 * Levels:
 *  L1 Nudge          - a question/observation pointing at the problem area
 *  L2 Concept        - names the relevant concept/data structure/pattern
 *  L3 Direction      - suggests a general strategy/approach
 *  L4 Algorithm      - describes the algorithm steps in plain language
 *  L5 Pseudocode     - structured pseudocode, no real syntax
 *  L6 Implementation - concrete code-level fix/implementation
 */

export const LEVELS = {
  1: "Nudge",
  2: "Concept",
  3: "Direction",
  4: "Algorithm",
  5: "Pseudocode",
  6: "Implementation"
};

const MAX_LEVEL = 6;

/**
 * In-memory session store keyed by `${studentId}:${problemKey}`.
 * Holds ephemeral working state for the CURRENT problem only.
 * Once submitted (solved or abandoned), the final summary is persisted to
 * MongoDB via ProblemAttempt and the session is cleared.
 */
const sessions = new Map();

function sessionKey(studentId, problemKey) {
  return `${studentId}:${problemKey}`;
}

export function getOrCreateSession(studentId, problemKey, problemText) {
  const key = sessionKey(studentId, problemKey);
  if (!sessions.has(key)) {
    sessions.set(key, {
      problemText,
      startedAt: Date.now(),
      attempts: 0, // submit attempts
      aiIterations: 0, // attempts that involved an AI hint
      hintsGiven: [], // ordered list of levels already revealed, e.g. [1,2,2,3]
      firstHelpAt: null, // Date.now() of first hint request
      lastAnalysis: null // last Qwen "mistake analysis" summary, used to gauge severity
    });
  }
  return sessions.get(key);
}

export function getSession(studentId, problemKey) {
  return sessions.get(sessionKey(studentId, problemKey)) || null;
}

export function clearSession(studentId, problemKey) {
  sessions.delete(sessionKey(studentId, problemKey));
}

/**
 * Core decision function: given the current session state (+ optional
 * signal about repeated/severe mistakes from the analysis step), return the
 * hint level that should be revealed next.
 *
 * Rules:
 * 1. Never reveal a level the student hasn't earned yet — escalate by at most
 *    +1 per request under normal conditions (progressive disclosure).
 * 2. If the student keeps submitting without making progress relative to
 *    hints already given (attempts pulling ahead of hints), escalate by +2
 *    to avoid stalling them indefinitely at a level that isn't helping.
 * 3. If Qwen's analysis flags a severe/repeated mistake (same bug persists
 *    after a hint was already given), allow one extra step of escalation.
 * 4. Level is capped at 6 and never decreases within a problem.
 */
export function explainNextLevel(session, { repeatedMistake = false } = {}) {
  const highestSoFar = session.hintsGiven.length
    ? Math.max(...session.hintsGiven)
    : 0;

  if (highestSoFar === 0) {
    return { level: 1, highestSoFar, stalled: false, repeatedMistake: false, step: 1 }; // first hint is always the gentlest nudge
  }

  const stalled = session.attempts - session.hintsGiven.length >= 2;
  let step = 1;
  if (stalled) step += 1;
  if (repeatedMistake) step += 1;

  return {
    level: Math.min(MAX_LEVEL, highestSoFar + step),
    highestSoFar,
    stalled,
    repeatedMistake,
    step
  };
}

export function decideNextLevel(session, opts = {}) {
  return explainNextLevel(session, opts).level;
}

/** Record that a hint at `level` was just given. */
export function recordHintGiven(session, level) {
  session.hintsGiven.push(level);
  session.aiIterations += 1;
  if (session.firstHelpAt === null) {
    session.firstHelpAt = Date.now();
  }
}

/** Record a submit attempt (independent of whether a hint was requested for it). */
export function recordAttempt(session) {
  session.attempts += 1;
}

/** Seconds between problem start and the first hint request, or null if no hint used. */
export function timeToFirstHelpSeconds(session) {
  if (session.firstHelpAt === null) return null;
  return Math.round((session.firstHelpAt - session.startedAt) / 1000);
}

/** Build the final history record to persist when a problem is submitted/solved. */
export function buildHistoryRecord(studentId, problemKey, session, solved) {
  const highestHint = session.hintsGiven.length ? Math.max(...session.hintsGiven) : 0;
  return {
    studentId,
    problem: session.problemText || problemKey,
    attempts: session.attempts,
    aiIterations: session.aiIterations,
    highestHint,
    timeToFirstHelp: timeToFirstHelpSeconds(session),
    solved,
    timestamp: new Date()
  };
}

export default {
  LEVELS,
  getOrCreateSession,
  getSession,
  clearSession,
  decideNextLevel,
  explainNextLevel,
  recordHintGiven,
  recordAttempt,
  timeToFirstHelpSeconds,
  buildHistoryRecord
};
