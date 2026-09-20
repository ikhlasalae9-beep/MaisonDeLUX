import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-page)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
          subtle: "var(--bg-surface-subtle)",
        },
        border: {
          subtle: "var(--border-subtle)",
          medium: "var(--border-medium)",
          focus: "var(--border-focus)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          light: "var(--text-light)",
        },
        brand: {
          blue: "var(--accent-blue)",
          "blue-hover": "var(--accent-blue-hover)",
          "blue-subtle": "var(--accent-subtle)",
          
          /* Keeping legacy tokens temporarily so build doesn't break while refactoring */
          navy: "#0F172A",
          "navy-deep": "#080C15",
          "navy-surface": "#131C31",
          slate: "#64748B",
          "slate-light": "#94A3B8",
          "gray-soft": "#E2E8F0",
          "gray-border": "rgba(226, 232, 240, 0.8)",
          "off-white": "#F8FAFC",
          white: "#FFFFFF",
        },
        morocco: {
          red: "var(--accent-morocco-red)",
          green: "var(--accent-morocco-green)",
        },
        status: {
          success: "var(--success)",
          warning: "var(--warning)",
          danger: "var(--danger)",
        },
        overlay: "var(--overlay)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        arabic: ["var(--font-arabic)", "'IBM Plex Sans Arabic'", "'Tajawal'", "sans-serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        focus: "var(--shadow-focus)",
        "architectural": "0 20px 40px -15px rgba(28, 25, 23, 0.08)",
        "architectural-dark": "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
        "subtle": "0 2px 10px rgba(28, 25, 23, 0.04)",
      },
      borderRadius: {
        control: "var(--radius-control)",
        card: "var(--radius-card)",
        media: "var(--radius-media)",
        pill: "var(--radius-pill)",
      },
      spacing: {
        "section-sm": "var(--space-section-sm)",
        section: "var(--space-section)",
      },
      maxWidth: {
        page: "var(--container-page)",
      },
      fontSize: {
        display: ["var(--text-display)", { lineHeight: "1.02", letterSpacing: "-0.04em" }],
        heading: ["var(--text-heading)", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
        subheading: ["var(--text-subheading)", { lineHeight: "1.35" }],
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        standard: "var(--motion-standard)",
        slow: "var(--motion-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        emphasized: "var(--ease-emphasized)",
      },
    },
  },
  plugins: [],
};

export default config;
