/**
 * @company/admin-ui Tailwind 프리셋 — 디자인 토큰(--au-*)을 Tailwind 유틸리티로 노출합니다.
 * 값의 원천은 src/lib/tokens.css 입니다. (docs/04-ui-guidelines.md)
 *
 * 소비 시스템의 tailwind.config 에서:
 *   import adminUiPreset from "@company/admin-ui/tailwind-preset";
 *   export default {
 *     presets: [adminUiPreset],
 *     content: [
 *       "./index.html",
 *       "./src/**\/*.{ts,tsx}",
 *       // 라이브러리 컴포넌트의 클래스도 함께 컴파일합니다(소스 배포).
 *       "./node_modules/@company/admin-ui/src/lib/**\/*.{ts,tsx}",
 *     ],
 *   };
 *
 * @type {import('tailwindcss').Config}
 */

/**
 * --au-* 색 토큰을 Tailwind opacity 수식어(`bg-success/10`, `ring-primary/40` 등)와
 * 호환되게 감쌉니다. 토큰 값(hex/rgb)은 그대로 두고 매핑 계층에서만 알파를 적용합니다.
 * - 수식어 없음(예: `text-primary`) → 원본 var 그대로 반환(기존 동작·직접 참조와 동일).
 * - 수식어 있음(예: `/10` → opacityValue "0.1") → color-mix 로 10% 틴트.
 * color-mix 는 런타임 var 값을 쓰므로 라이트/다크 테마 전환에도 자동으로 따라갑니다.
 */
const withAlpha = (varName) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `var(${varName})`
    : `color-mix(in srgb, var(${varName}) calc(${opacityValue} * 100%), transparent)`;

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: withAlpha("--au-color-primary"),
        "primary-hover": withAlpha("--au-color-primary-hover"),
        danger: withAlpha("--au-color-danger"),
        "danger-hover": withAlpha("--au-color-danger-hover"),
        success: withAlpha("--au-color-success"),
        warning: withAlpha("--au-color-warning"),
        info: withAlpha("--au-color-info"),
        bg: withAlpha("--au-color-bg"),
        surface: withAlpha("--au-color-surface"),
        "surface-muted": withAlpha("--au-color-surface-muted"),
        line: withAlpha("--au-color-border"),
        text: withAlpha("--au-color-text"),
        "text-muted": withAlpha("--au-color-text-muted"),
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
      // z-index 레이어(겹침 순서의 단일 원천). 값의 원천은 tokens.css 의 --au-z-*.
      // 컴포넌트는 z-modal / z-toast / z-popover / z-alert 유틸리티만 사용합니다.
      zIndex: {
        modal: "var(--au-z-modal)",
        toast: "var(--au-z-toast)",
        popover: "var(--au-z-popover)",
        alert: "var(--au-z-alert)",
      },
    },
  },
};
