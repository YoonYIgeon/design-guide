import adminUiPreset from "./tailwind.preset.js";

/**
 * 이 레포(데모 하네스)용 Tailwind 설정.
 * 테마(토큰 매핑)는 tailwind.preset.js 에 있고, 소비 시스템도 같은 프리셋을
 * `@company/admin-ui/tailwind-preset` 으로 가져다 씁니다. (docs/03-getting-started.md)
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  presets: [adminUiPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
