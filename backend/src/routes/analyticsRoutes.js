import express from "express";
import * as analyticsController from "../controllers/analyticsController.js";

const router = express.Router();

/** GET /api/analytics/dashboard?studentId=demo-student-1 */
router.get("/dashboard", async (req, res) => {
  try {
    const studentId = req.query.studentId || process.env.DEMO_STUDENT_ID || "demo-student-1";
    const data = await analyticsController.getDashboard(studentId);
    res.json(data);
  } catch (err) {
    console.error("[analytics/dashboard] error:", err);
    res.status(500).json({ error: "Failed to load dashboard data." });
  }
});

/**
 * GET /api/analytics/problems?studentId=demo-student-1
 * Per-problem H / I / R / T / ADS breakdown + the original problem statement
 * for every attempt on record, most recent first.
 */
router.get("/problems", async (req, res) => {
  try {
    const studentId = req.query.studentId || process.env.DEMO_STUDENT_ID || "demo-student-1";
    const data = await analyticsController.getProblemMetrics(studentId);
    res.json(data);
  } catch (err) {
    console.error("[analytics/problems] error:", err);
    res.status(500).json({ error: "Failed to load problem metrics." });
  }
});

/**
 * GET /api/analytics/problems/:id?studentId=demo-student-1
 * Same breakdown for a single attempt, for an expanded/detail view.
 */
router.get("/problems/:id", async (req, res) => {
  try {
    const studentId = req.query.studentId || process.env.DEMO_STUDENT_ID || "demo-student-1";
    const data = await analyticsController.getProblemMetricById(studentId, req.params.id);
    if (!data) return res.status(404).json({ error: "Problem attempt not found." });
    res.json(data);
  } catch (err) {
    console.error("[analytics/problems/:id] error:", err);
    res.status(500).json({ error: "Failed to load problem detail." });
  }
});

export default router;
