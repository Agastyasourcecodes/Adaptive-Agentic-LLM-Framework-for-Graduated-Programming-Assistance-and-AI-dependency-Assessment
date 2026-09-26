import "dotenv/config";
import { connectDB } from "../config/db.js";
import ProblemAttempt from "../models/ProblemAttempt.js";
import { DEMO_STUDENT_ID } from "./sampleData.js";
import mongoose from "mongoose";

/**
 * No longer inserts hardcoded sample problems — real history is now saved
 * automatically as the student uses the app (analyze/hint/submit all
 * persist). This script just clears any old demo-student data (including
 * legacy rows from before the problemKey unique index existed) so you can
 * start clean.
 */
async function reset() {
  await connectDB();
  const { deletedCount } = await ProblemAttempt.deleteMany({ studentId: DEMO_STUDENT_ID });
  console.log(
    `[seed] Cleared ${deletedCount} existing record(s) for ${DEMO_STUDENT_ID}. ` +
      "No hardcoded data inserted — use the app (Analyze / Get Next Hint / Submit) to generate real history."
  );
  await mongoose.disconnect();
  process.exit(0);
}

reset().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});