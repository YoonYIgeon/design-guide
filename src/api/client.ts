import axios from "axios";
import { mockAdapter } from "./mock";

/**
 * 사내 API 클라이언트 (axios).
 * - baseURL 은 환경변수로 주입합니다(격리망 내부 API 주소).
 * - 백엔드 없이 데모를 돌릴 때는 axios 어댑터 레벨의 목(mock)을 사용합니다.
 *   실서비스에서는 VITE_ENABLE_MOCK=false 로 두면 실제 HTTP 어댑터가 동작합니다.
 */
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK !== "false";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

if (USE_MOCK) {
  // 실제 호출 경로(api.get/post/...)는 그대로 두고, 응답만 목이 대신합니다.
  api.defaults.adapter = mockAdapter;
}

/* ── 액세스 토큰 관리 ───────────────────────────────── */

const TOKEN_KEY = "au.access-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/* ── 인터셉터 ──────────────────────────────────────── */

// 요청마다 Bearer 토큰 부착
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 이면 토큰 폐기 (상위에서 로그인 화면으로 전환)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) setToken(null);
    return Promise.reject(error);
  },
);

/** axios 에러에서 사람이 읽을 메시지를 뽑아냅니다. */
export function toErrorMessage(error: unknown, fallback = "요청 처리 중 오류가 발생했습니다."): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message ?? fallback;
  }
  return fallback;
}
