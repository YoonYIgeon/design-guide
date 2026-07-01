import axios, { AxiosError, type AxiosInstance } from "axios";
import { readTokens } from "../auth";

/**
 * 하네스(컨테이너) 레벨 HTTP 클라이언트 — axios 인스턴스 한 곳에서 관리.
 *
 * ⚠️ 이 파일은 라이브러리(src/lib)가 아니라 하네스의 데이터 계층입니다.
 *    프레젠테이션 전용 원칙상 네트워크/인증/에러 처리는 컴포넌트가 아닌
 *    이 계층에 둡니다. (docs/08-presentational-only.md, docs/09-data-fetching.md)
 *
 * 격리망 원칙: baseURL 은 외부 호스트가 아니라 내부 상대 경로(`/api`)를 기본값으로
 *    쓰며, 소비 시스템이 `VITE_API_BASE_URL` 로 사내 게이트웨이 주소를 주입합니다.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** UI 에 그대로 노출해도 되는 정규화된 API 에러. */
export class ApiError extends Error {
  /** HTTP 상태 코드(네트워크 오류 등으로 없으면 null). */
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;
    const serverMessage =
      (error.response?.data as { message?: string } | undefined)?.message;
    return new ApiError(serverMessage ?? error.message ?? "요청에 실패했습니다.", status);
  }
  return new ApiError("알 수 없는 오류가 발생했습니다.", null);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터: 저장된 액세스 토큰을 Authorization 헤더로 첨부.
apiClient.interceptors.request.use((config) => {
  const tokens = readTokens();
  if (tokens?.token) {
    config.headers.Authorization = `Bearer ${tokens.token}`;
  }
  return config;
});

// 응답 인터셉터: 에러를 UI 친화적인 ApiError 로 정규화.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);
