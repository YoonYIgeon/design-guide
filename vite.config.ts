import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 개발용 데모 앱과 라이브러리 빌드를 함께 지원합니다.
// 라이브러리 빌드가 필요하면 별도 lib 설정으로 확장하세요(docs/02-architecture.md).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
