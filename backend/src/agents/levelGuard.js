/**
 * levelGuard.js
 * -------------
 * Rule-based verifier (no LLM). Checks that generated hint text respects the
 * information ceiling of its assigned level, so a small model that "leaks" a
 * solution too early is caught before the student ever sees it.
 *
 *   L1-L3  conceptual: no code blocks, no code-like lines, length-capped
 *   L4     plain-language algorithm: no code blocks / code-like lines
 *   L5     pseudocode: no language-tagged fences, no runnable-syntax density
 *   L6     implementation: unrestricted
 */

const MAX_WORDS = { 1: 80, 2: 130, 3: 170 };

const LANG_FENCE = /```\s*(python|py|javascript|js|typescript|ts|java|c\+\+|cpp|c#|csharp|c|go|rust|ruby|php|kotlin|swift)\b/i;
const STRONG_CODE_LINE =
  /^\s*(def\s+\w+\(|class\s+\w+|function\s+\w+\(|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|#include|import\s+\w+|public\s+(static\s+)?\w+|for\s*\(.*;.*\)|.*;\s*$|.*\{\s*$)/;

function stripFences(text) {
  return text.replace(/```[\s\S]*?```/g, "[code withheld by Level Guard — not yet earned at this level]");
}

export function checkLevelCompliance(level, text) {
  const violations = [];
  const words = text.trim().split(/\s+/).length;
  const hasFence = /```/.test(text);
  const codeLines = text.split("\n").filter((l) => STRONG_CODE_LINE.test(l)).length;

  if (level <= 4) {
    if (hasFence) violations.push("code block at a conceptual level");
    if (codeLines >= 2) violations.push("code-like lines at a conceptual level");
  }
  if (level === 5) {
    if (LANG_FENCE.test(text)) violations.push("language-tagged code at pseudocode level");
    if (codeLines >= 4) violations.push("runnable-syntax density at pseudocode level");
  }
  if (MAX_WORDS[level] && words > MAX_WORDS[level]) {
    violations.push(`too long for L${level} (${words} > ${MAX_WORDS[level]} words)`);
  }

  return { ok: violations.length === 0, violations, words, codeLines };
}

/** Last-resort sanitizer if a regeneration still violates the level. */
export function sanitize(level, text) {
  if (level <= 5) return stripFences(text);
  return text;
}

export default { checkLevelCompliance, sanitize };
