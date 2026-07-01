/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // 디자인 토큰(--au-*)을 Tailwind 유틸리티로 노출합니다.
      // 값의 원천은 src/lib/tokens.css 입니다. (docs/04-ui-guidelines.md)
      colors: {
        primary: "var(--au-color-primary)",
        "primary-hover": "var(--au-color-primary-hover)",
        danger: "var(--au-color-danger)",
        "danger-hover": "var(--au-color-danger-hover)",
        success: "var(--au-color-success)",
        warning: "var(--au-color-warning)",
        info: "var(--au-color-info)",
        bg: "var(--au-color-bg)",
        surface: "var(--au-color-surface)",
        "surface-muted": "var(--au-color-surface-muted)",
        line: "var(--au-color-border)",
        text: "var(--au-color-text)",
        "text-muted": "var(--au-color-text-muted)",
      },
      borderRadius: {
        sm: "var(--au-radius-sm)",
        DEFAULT: "var(--au-radius-md)",
        md: "var(--au-radius-md)",
        lg: "var(--au-radius-lg)",
      },
      boxShadow: {
        1: "var(--au-shadow-1)",
        2: "var(--au-shadow-2)",
        3: "var(--au-shadow-3)",
      },
      fontFamily: {
        sans: "var(--au-font-sans)",
      },
    },
  },
  plugins: [],
};
