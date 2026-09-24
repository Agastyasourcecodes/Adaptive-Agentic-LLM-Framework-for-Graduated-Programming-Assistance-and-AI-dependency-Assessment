import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/adaptive_ai_coding_mentor";
  try {
    await mongoose.connect(uri);
    console.log(`[db] connected to MongoDB at ${uri}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    console.error("[db] Is MongoDB running? Start it locally or set MONGO_URI in .env");
    process.exit(1);
  }
}
