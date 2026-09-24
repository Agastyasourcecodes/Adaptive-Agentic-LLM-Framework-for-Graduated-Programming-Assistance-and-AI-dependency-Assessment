/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Iowan Old Style", "Palatino Linotype", "Georgia", "Cambria", "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      },
      colors: {
        paper: "#FAFAF8",
        ink: "#1C1C1A",
        line: "#DEDCD5",
        muted: "#6B6A63",
        accent: "#2E4057",
        accentSoft: "#EEF1F4"
      },
      boxShadow: {
        none: "none"
      }
    }
  },
  plugins: []
};
