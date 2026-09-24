export const DEMO_STUDENT_ID = process.env.DEMO_STUDENT_ID || "demo-student-1";

/**
 * 12 sample problems showing a realistic arc: heavy reliance early on,
 * gradually becoming more independent. timeToFirstHelp is in seconds
 * (10 min benchmark = 600s). null means the student never asked for help.
 */
export const sampleHistory = [
  { problem: "Two Sum", attempts: 4, aiIterations: 4, highestHint: 6, timeToFirstHelp: 45, solved: true },
  { problem: "Reverse Linked List", attempts: 5, aiIterations: 4, highestHint: 5, timeToFirstHelp: 90, solved: true },
  { problem: "Valid Parentheses", attempts: 3, aiIterations: 3, highestHint: 5, timeToFirstHelp: 60, solved: true },
  { problem: "Binary Search", attempts: 3, aiIterations: 2, highestHint: 4, timeToFirstHelp: 150, solved: true },
  { problem: "Merge Intervals", attempts: 4, aiIterations: 3, highestHint: 4, timeToFirstHelp: 180, solved: true },
  { problem: "Longest Substring Without Repeating Characters", attempts: 3, aiIterations: 2, highestHint: 3, timeToFirstHelp: 240, solved: true },
  { problem: "Course Schedule (Topological Sort)", attempts: 4, aiIterations: 2, highestHint: 3, timeToFirstHelp: 300, solved: true },
  { problem: "Climbing Stairs", attempts: 2, aiIterations: 1, highestHint: 2, timeToFirstHelp: 360, solved: true },
  { problem: "Kth Largest Element", attempts: 2, aiIterations: 1, highestHint: 2, timeToFirstHelp: 420, solved: true },
  { problem: "Word Break", attempts: 2, aiIterations: 0, highestHint: 0, timeToFirstHelp: null, solved: true },
  { problem: "Number of Islands", attempts: 1, aiIterations: 0, highestHint: 0, timeToFirstHelp: null, solved: true },
  { problem: "LRU Cache", attempts: 3, aiIterations: 1, highestHint: 1, timeToFirstHelp: 480, solved: true }
].map((p, i) => ({
  studentId: DEMO_STUDENT_ID,
  ...p,
  timestamp: new Date(Date.now() - (12 - i) * 86400000) // spread over the last 12 days
}));

export default { DEMO_STUDENT_ID, sampleHistory };
