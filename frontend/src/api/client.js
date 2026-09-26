const BASE = "/api";

export const STUDENT_ID = "demo-student-1";

// Configurable placeholder for the documentation file — replace with the
// real research write-up whenever it's ready. Can also point to a full URL.
export const DOCUMENTATION_PATH = "/docs/research-documentation.pdf";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${path}`);
  return data;
}

export const api = {
  // provider: "qwen" | "gemini" | "grok" — the backend falls back to Qwen if a cloud model fails.
  analyze: (problemText, code, provider) =>
    request("/mentor/analyze", {
      method: "POST",
      body: JSON.stringify({ studentId: STUDENT_ID, problemText, code, provider })
    }),

  getHint: (problemText, code, provider) =>
    request("/mentor/hint", {
      method: "POST",
      body: JSON.stringify({ studentId: STUDENT_ID, problemText, code, provider })
    }),

  submitAttempt: (problemText, solved, giveUp = false) =>
    request("/mentor/submit", {
      method: "POST",
      body: JSON.stringify({ studentId: STUDENT_ID, problemText, solved, giveUp })
    }),

  getProviders: () => request("/mentor/providers"),

  getDashboard: () => request(`/analytics/dashboard?studentId=${STUDENT_ID}`),

  // Per-problem H / I / R / T / ADS breakdown + original problem statement.
  getProblemMetrics: () => request(`/analytics/problems?studentId=${STUDENT_ID}`),

  getProblemMetricById: (id) => request(`/analytics/problems/${id}?studentId=${STUDENT_ID}`)
};

export default api;
