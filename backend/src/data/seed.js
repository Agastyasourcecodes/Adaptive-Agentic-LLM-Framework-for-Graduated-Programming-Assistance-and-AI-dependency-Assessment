import "dotenv/config";
import { connectDB } from "../config/db.js";
import ProblemAttempt from "../models/ProblemAttempt.js";
import { sampleHistory, DEMO_STUDENT_ID } from "./sampleData.js";
import mongoose from "mongoose";

async function seed() {
  await connectDB();
  await ProblemAttempt.deleteMany({ studentId: DEMO_STUDENT_ID });
  await ProblemAttempt.insertMany(sampleHistory);
  console.log(`[seed] Inserted ${sampleHistory.length} sample problems for ${DEMO_STUDENT_ID}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
