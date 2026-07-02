import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { createQueryClient } from "./api/queryClient";
import { AlertProvider, ToastProvider } from "./lib";
import { AuthProvider } from "./providers";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root 엘리먼트를 찾을 수 없습니다.");

// 데이터 계층(react-query)은 하네스에서 한 번 구성해 앱 전체에 주입합니다.
const queryClient = createQueryClient();

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* 하네스 레벨 프로바이더: 인증 상태 / 확인·알림 / 토스트 */}
        <AuthProvider>
          <AlertProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AlertProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
