/**
 * mentorLLMService.js
 * -------------------
 * Prompt construction + response parsing for the two LLM-driven agents:
 *   1. Analyzer Agent   — diagnostic summary of the submission (a signal, not a score)
 *   2. Hint Agent       — hint TEXT for a level chosen by the Level Controller
 * The transport (Qwen / Gemini / Grok, fallback, timeouts) lives in llmRouter.js.
 * The model never decides the level and never computes any metric.
 */
import { generate } from "./llmRouter.js";

const LEVEL_INSTRUCTIONS = {
  1: `L1 - NUDGE ONLY. Ask a single short guiding question or point out (in general terms)
where the student's attention should go. Do NOT name the concept, algorithm, or data
structure. Do NOT mention specific lines of code or fixes. 2-3 sentences max.`,
  2: `L2 - CONCEPT. Name the relevant concept, data structure, or pattern the problem
involves (e.g. "this is a two-pointer problem" or "think about hash maps"). Explain
briefly why that concept is relevant. Do NOT describe steps or give an approach yet.`,
  3: `L3 - DIRECTION. Suggest a general strategy or approach at a high level (e.g. "try
sorting first, then scan from both ends"). Do NOT give step-by-step algorithm details
or pseudocode.`,
  4: `L4 - ALGORITHM. Describe the algorithm's steps in plain language, in order, so the
student could implement it themselves. Do NOT write pseudocode or real code.`,
  5: `L5 - PSEUDOCODE. Provide structured pseudocode (no real programming language syntax)
that lays out the full logic. Do NOT provide runnable code in any language.`,
  6: `L6 - IMPLEMENTATION. Provide a concrete corrected implementation in the same
language as the student's code, with a short explanation of the fix.`
};

const LEVEL_SHORT = { 1: "Nudge", 2: "Concept", 3: "Direction", 4: "Algorithm", 5: "Pseudocode", 6: "Implementation" };

function buildHintPrompt({ level, problemText, studentCode, priorHints, reinforce }) {
  const priorHintsBlock = priorHints.length
    ? `Hints already given at lower levels (do not repeat them verbatim, build on them):\n${priorHints
        .map((h) => `- L${h.level}: ${h.text}`)
        .join("\n")}`
    : "No hints have been given yet.";

  const reinforcement = reinforce
    ? `\nCORRECTION: your previous attempt violated the level constraints (${reinforce}). Rewrite it so it strictly obeys level ${level}. Contain NO code unless the level explicitly allows it.\n`
    : "";

  return `You are a coding mentor using GRADUATED assistance. You must respond at
EXACTLY level ${level} and NEVER reveal information belonging to a higher level.

${LEVEL_INSTRUCTIONS[level]}

STRICT RULES:
- Never jump ahead of level ${level}, even if it would be faster to just solve it.
- Never include a full working solution unless level is 6.
- Keep the tone encouraging and academic, not casual.
- Output plain text only (markdown for code/pseudocode blocks is fine at L5/L6).
${reinforcement}
Problem:
"""
${problemText}
"""

Student's current code:
"""
${studentCode || "(no code submitted yet)"}
"""

${priorHintsBlock}

Reminder: you must respond at level ${level} ONLY. Do not reveal information
belonging to a higher level, even if it seems more helpful. Now provide the
level ${level} (${LEVEL_SHORT[level]}) hint.`;
}

function buildAnalysisPrompt({ problemText, studentCode }) {
  return `You are analyzing a student's code submission for a coding mentor tool.
Do NOT provide a solution or hints here — only a short diagnostic summary.

Problem:
"""
${problemText}
"""

Student's code:
"""
${studentCode || "(no code submitted yet)"}
"""

Respond in this exact format, nothing else:
STATUS: <one of CORRECT, PARTIALLY_CORRECT, INCORRECT, EMPTY>
ISSUE_TYPE: <one of LOGIC, SYNTAX, EDGE_CASE, APPROACH, NONE>
REPEATED_PATTERN: <YES or NO — YES only if the same category of mistake looks like it recurred>
SUMMARY: <one short sentence, no code, no solution>`;
}

function parseAnalysis(raw) {
  const get = (key) => {
    const match = raw.match(new RegExp(`${key}:\\s*(.+)`, "i"));
    return match ? match[1].trim().replace(/^\*+|\*+$/g, "") : null;
  };
  return {
    status: get("STATUS") || "UNKNOWN",
    issueType: get("ISSUE_TYPE") || "NONE",
    repeatedPattern: (get("REPEATED_PATTERN") || "NO").toUpperCase().startsWith("Y"),
    summary: get("SUMMARY") || raw.slice(0, 200),
    raw
  };
}

/** @returns {{ analysis, meta }} meta = router metadata (provider, fallback, latency…) */
export async function analyzeSubmission({ problemText, studentCode, provider }) {
  const { text, ...meta } = await generate(buildAnalysisPrompt({ problemText, studentCode }), provider);
  return { analysis: parseAnalysis(text), meta };
}

/** @returns {{ text, meta }} */
export async function generateHint({ level, problemText, studentCode, priorHints, provider, reinforce }) {
  const prompt = buildHintPrompt({ level, problemText, studentCode, priorHints, reinforce });
  const { text, ...meta } = await generate(prompt, provider);
  return { text, meta };
}

export default { analyzeSubmission, generateHint };
