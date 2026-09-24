import mongoose from "mongoose";

/**
 * History record — intentionally minimal per spec.
 * Only what's needed to compute H / I / R / T and display history.
 */
const problemAttemptSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  problem: { type: String, required: true }, // short title/text of the problem
  attempts: { type: Number, required: true, default: 0 }, // total submit attempts
  aiIterations: { type: Number, required: true, default: 0 }, // attempts that used an AI hint
  highestHint: { type: Number, required: true, default: 0 }, // 0-6, highest level revealed
  timeToFirstHelp: { type: Number, required: false, default: null }, // seconds, null = never asked
  solved: { type: Boolean, required: true, default: false },
  timestamp: { type: Date, required: true, default: Date.now }
});

export default mongoose.model("ProblemAttempt", problemAttemptSchema);
