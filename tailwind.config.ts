import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: withOpacity("--surface-base"),
          raised: withOpacity("--surface-raised"),
          overlay: withOpacity("--surface-overlay"),
          sunken: withOpacity("--surface-sunken")
        },
        text: {
          primary: withOpacity("--text-primary"),
          secondary: withOpacity("--text-secondary"),
          subtle: withOpacity("--text-subtle"),
          onAccent: withOpacity("--text-on-accent")
        },
        accent: {
          primary: withOpacity("--accent-primary"),
          secondary: withOpacity("--accent-secondary"),
          success: withOpacity("--accent-success"),
          warning: withOpacity("--accent-warning"),
          danger: withOpacity("--accent-danger"),
          info: withOpacity("--accent-info")
        },
        border: {
          default: withOpacity("--border-default"),
          subtle: withOpacity("--border-subtle"),
          strong: withOpacity("--border-strong")
        }
      },
      fontSize: {
        display: [
          "var(--font-size-display)",
          { lineHeight: "var(--line-height-display)", letterSpacing: "0" }
        ],
        h1: ["var(--font-size-h1)", { lineHeight: "var(--line-height-heading)", letterSpacing: "0" }],
        h2: ["var(--font-size-h2)", { lineHeight: "var(--line-height-heading)", letterSpacing: "0" }],
        h3: ["var(--font-size-h3)", { lineHeight: "var(--line-height-heading)", letterSpacing: "0" }],
        h4: ["var(--font-size-h4)", { lineHeight: "var(--line-height-heading)", letterSpacing: "0" }],
        body: ["var(--font-size-body)", { lineHeight: "var(--line-height-body)", letterSpacing: "0" }],
        "body-sm": [
          "var(--font-size-body-sm)",
          { lineHeight: "var(--line-height-body)", letterSpacing: "0" }
        ],
        caption: [
          "var(--font-size-caption)",
          { lineHeight: "var(--line-height-caption)", letterSpacing: "0" }
        ]
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "8px"
      },
      boxShadow: {
        focus: "0 0 0 3px hsl(var(--accent-info) / 0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;
