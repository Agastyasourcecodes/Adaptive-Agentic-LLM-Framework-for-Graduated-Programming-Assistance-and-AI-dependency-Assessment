export const DEMO_STUDENT_ID = process.env.DEMO_STUDENT_ID || "demo-student-1";

// Hardcoded sample problems removed. The app now persists a real
// ProblemAttempt row automatically every time a student analyzes, requests
// a hint, or submits — so the dashboard and metrics panel reflect actual
// usage instead of fake seeded data. Nothing to seed anymore.
export const sampleHistory = [];