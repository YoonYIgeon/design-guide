import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * 빌드 모드 (docs/02-architecture.md, docs/03-getting-started.md)
 *
 * - 기본(`yarn build`): 라이브러리 빌드 — src/lib/index.ts 를 dist/index.{mjs,cjs} 로 번들.
 *   react 계열과 react-markdown 은 external(소비 시스템이 제공).
 *   타입 선언(dist/*.d.ts)은 tsconfig.build.json 의 tsc 가 이어서 생성합니다.
 * - 데모(`yarn build:demo` = `--mode demo`): 하네스 데모 앱을 dist-demo 로 빌드(프리뷰용).
 * - `yarn dev` 는 모드와 무관하게 데모 앱 개발 서버를 띄웁니다.
 */
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build:
    mode === "demo"
      ? { outDir: "dist-demo" }
      : {
          lib: {
            entry: "src/lib/index.ts",
            formats: ["es", "cjs"],
            fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
          },
          rollupOptions: {
            // 소비 시스템이 제공하는 peer/런타임 의존성 — 번들에 포함하지 않음.
            external: ["react", "react-dom", "react/jsx-runtime", "react-markdown"],
          },
          sourcemap: true,
        },
}));
