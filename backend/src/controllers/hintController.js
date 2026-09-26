/**
 * hintController.js
 * ------------------
 * Decides WHICH hint level (1-6) the student should receive next.
 * Pure application logic — no LLM call happens here.
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
      attempts: 0,
      aiIterations: 0,
      hintsGiven: [],
      firstHelpAt: null,
      lastAnalysis: null
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

export function explainNextLevel(session, { repeatedMistake = false } = {}) {
  const highestSoFar = session.hintsGiven.length
    ? Math.max(...session.hintsGiven)
    : 0;

  if (highestSoFar === 0) {
    return { level: 1, highestSoFar, stalled: false, repeatedMistake: false, step: 1 };
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

export function recordHintGiven(session, level) {
  session.hintsGiven.push(level);
  session.aiIterations += 1;
  if (session.firstHelpAt === null) {
    session.firstHelpAt = Date.now();
  }
}

export function recordAttempt(session) {
  session.attempts += 1;
}

export function timeToFirstHelpSeconds(session) {
  if (session.firstHelpAt === null) return null;
  return Math.round((session.firstHelpAt - session.startedAt) / 1000);
}

/**
 * Row persisted to MongoDB. Intentionally minimal — ONLY the problem
 * statement (`problem`) and the scoring parameters (attempts, aiIterations,
 * highestHint, timeToFirstHelp, solved). The student's code is never
 * persisted.
 */
export function buildLiveRecord(studentId, problemKey, session, solved = false) {
  const highestHint = session.hintsGiven.length ? Math.max(...session.hintsGiven) : 0;
  return {
    studentId,
    problemKey,
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
  buildLiveRecord
};