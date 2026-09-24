import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { listProviders, DEFAULT_PROVIDER } from "./services/llmRouter.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, defaultProvider: DEFAULT_PROVIDER, providers: listProviders() });
});

app.use("/api/mentor", mentorRoutes);
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] Adaptive AI Coding Mentor backend running on http://localhost:${PORT}`);
  });
});
