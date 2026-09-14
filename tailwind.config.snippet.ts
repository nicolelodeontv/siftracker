// Merge this into the `theme.extend` of your existing tailwind.config.ts.
// Don't replace your whole config — just add these keys.
// Requires darkMode: "class" (or "selector" on Tailwind v3.4+) so `.dark`
// on <html> flips the CSS variables defined in tokens.css.

import type { Config } from "tailwindcss";

const config: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          fg: "var(--accent-fg)",
          tint: "var(--accent-tint)",
          "tint-fg": "var(--accent-tint-fg)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
      },
    },
  },
};

export default config;
