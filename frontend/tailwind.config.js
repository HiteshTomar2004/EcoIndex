/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Measured, natural greens with enough contrast for product data.
        lime: "#d9e7c7",
        limeSoft: "#edf4e7",
        fresh: "#77a960",
        leaf: "#2f7d4c",
        forest: "#215c3b",
        deep: "#173b2a",
        cream: "#f6f8f4",
        sun: "#bb8428",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        paper: "0 8px 24px -18px rgba(23, 59, 42, 0.35)",
        paperLg: "0 20px 42px -28px rgba(23, 59, 42, 0.42)",
      },
      borderRadius: {
        organic: "0.875rem",
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        sway: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-12px)" },
        },
        drawScore: {
          from: { strokeDashoffset: "var(--circumference)" },
        },
      },
      animation: {
        floatUp: "floatUp 0.5s ease-out both",
        pulseSoft: "pulseSoft 1.6s ease-in-out infinite",
        sway: "sway 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
