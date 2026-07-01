import { apiClient } from "./client";
import type { Tokens } from "../auth";

/**
 * 예시 리소스: 인증(Auth) API 모듈.
 *
 * posts.api.ts 와 동일한 "리소스별 API 관리" 패턴을 인증에 적용한 예시입니다.
 * 로그인 자격증명을 서버로 보내 토큰을 발급받는 흐름을 담습니다.
 * (docs/08-presentational-only.md, docs/09-data-fetching.md)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 소비 시스템은 아래 세 곳만 자신의 인증 서버에 맞게 바꾸면 그대로 동작합니다.
 *   ① AUTH_LOGIN_PATH  — 로그인 엔드포인트 경로(URL)
 *   ② LoginResponse    — 서버가 내려주는 응답 JSON 구조
 *   ③ toTokens()       — 응답 구조 → 앱 내부 토큰(Tokens) 매핑
 * ─────────────────────────────────────────────────────────────────────────
 */

/** 로그인 요청 파라미터(폼에서 입력받은 값). */
export interface LoginCredentials {
  id: string;
  password: string;
}

/**
 * ② 연결 지점 — 서버 로그인 응답의 원본 구조.
 *
 * 실제 인증 서버가 내려주는 JSON 형태에 맞게 이 타입만 수정하세요.
 * 예) `{ data: { token, refresh_token } }` 처럼 감싸져 있다면 그 형태로 바꾸고
 *     아래 toTokens() 에서 꺼내면 됩니다.
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * ① 연결 지점 — 로그인 엔드포인트 경로.
 *
 * baseURL 은 client.ts 의 `VITE_API_BASE_URL`(사내 게이트웨이)이 담당하므로
 * 여기서는 그 뒤에 붙는 상대 경로만 지정합니다.
 */
export const AUTH_LOGIN_PATH = "/auth/login";

/**
 * ③ 연결 지점 — 응답 구조 → 앱 내부 토큰(Tokens) 매핑.
 *
 * 서버 응답 필드명이 다르면(예: `access_token`) 이 함수 한 곳만 고치면 됩니다.
 * 앱의 나머지 코드는 항상 정규화된 Tokens 타입만 다룹니다.
 */
function toTokens(res: LoginResponse): Tokens {
  return { token: res.accessToken, refreshToken: res.refreshToken };
}

/**
 * 데모 모드: `VITE_API_BASE_URL` 이 없으면(=프리뷰) 실제 네트워크 대신
 * 발급을 흉내낸 토큰을 반환합니다. 격리망 원칙상 외부 호출을 하지 않으면서도
 * axios 사용 코드를 그대로 남겨 두기 위한 스캐폴드입니다.
 * (posts.api.ts 와 동일한 분기 규칙)
 */
const DEMO_MODE = import.meta.env.VITE_API_BASE_URL == null;

/** 데모용 지연(네트워크 왕복을 흉내내 로딩 상태를 확인할 수 있게 함). */
function demoDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 400));
}

/**
 * 로그인: 자격증명을 서버로 보내 토큰을 발급받습니다.
 * 반환값은 항상 정규화된 Tokens — 소비 시스템은 응답 구조를 toTokens() 로만 흡수합니다.
 */
export async function login(credentials: LoginCredentials): Promise<Tokens> {
  if (DEMO_MODE) {
    // 데모: 아무 값이나 받아 발급을 흉내냄(비밀번호 검증 없음).
    return demoDelay(
      toTokens({
        accessToken: `demo-access-${credentials.id || "user"}`,
        refreshToken: "demo-refresh-token",
      }),
    );
  }
  const { data } = await apiClient.post<LoginResponse>(AUTH_LOGIN_PATH, credentials);
  return toTokens(data);
}
