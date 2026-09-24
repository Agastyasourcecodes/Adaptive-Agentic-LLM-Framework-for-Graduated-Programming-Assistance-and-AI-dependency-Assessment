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

export default router;
