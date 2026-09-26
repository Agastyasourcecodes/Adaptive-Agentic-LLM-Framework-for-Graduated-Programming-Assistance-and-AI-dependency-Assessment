import mongoose from "mongoose";

/**
 * Only the problem statement + scoring parameters are ever stored here —
 * no student code, no LLM output. One row per (studentId, problemKey),
 * upserted on every analyze/hint/submit.
 */
const problemAttemptSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  problemKey: { type: String, required: true },
  problem: { type: String, required: true }, // the problem statement, as pasted
  attempts: { type: Number, required: true, default: 0 },
  aiIterations: { type: Number, required: true, default: 0 },
  highestHint: { type: Number, required: true, default: 0 },
  timeToFirstHelp: { type: Number, required: false, default: null },
  solved: { type: Boolean, required: true, default: false },
  timestamp: { type: Date, required: true, default: Date.now }
});

problemAttemptSchema.index({ studentId: 1, problemKey: 1 }, { unique: true });

export default mongoose.model("ProblemAttempt", problemAttemptSchema);