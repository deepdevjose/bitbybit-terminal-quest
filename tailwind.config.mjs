/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        abyss: "#05070d",
        panel: "#0d111c",
        line: "rgba(148, 163, 184, 0.18)",
        mint: "#40f5b0",
        cyan: "#54d8ff",
        amber: "#f7c948"
      },
      boxShadow: {
        glow: "0 0 32px rgba(64, 245, 176, 0.14)",
        panel: "0 18px 60px rgba(0, 0, 0, 0.35)"
      },
      fontFamily: {
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
