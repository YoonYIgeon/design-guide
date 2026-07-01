/**
 * 하네스(컨테이너) 레벨 인증 유틸 — 쿠키 기반 토큰 저장/복원.
 *
 * ⚠️ 이 파일은 라이브러리(src/lib)가 아니라 프리뷰 하네스의 코드입니다.
 *    프레젠테이션 전용 원칙상 인증/데이터 로직은 컴포넌트가 아닌 여기(컨테이너)에 둡니다.
 *    실제 소비 시스템에서는 사내 인증 서버가 발급한 token/refreshToken 을 이 자리에서
 *    쿠키에 저장·복원하고, 만료 시 refreshToken 으로 재발급합니다.
 *    (docs/08-presentational-only.md)
 */

export interface Tokens {
  token: string;
  refreshToken: string;
}

const TOKEN_KEY = "token";
const REFRESH_KEY = "refreshToken";
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30일

function setCookie(name: string, value: string, maxAgeSec?: number): void {
  const parts = [`${name}=${encodeURIComponent(value)}`, "path=/", "SameSite=Lax"];
  if (maxAgeSec != null) parts.push(`Max-Age=${maxAgeSec}`);
  if (typeof location !== "undefined" && location.protocol === "https:") parts.push("Secure");
  document.cookie = parts.join("; ");
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * 로그인 성공 시 토큰을 쿠키에 저장.
 * @param remember 자동 로그인 여부. true 면 지속 쿠키(30일), false 면 세션 쿠키(브라우저 종료 시 만료).
 */
export function saveTokens(tokens: Tokens, remember: boolean): void {
  const maxAge = remember ? REMEMBER_MAX_AGE : undefined;
  setCookie(TOKEN_KEY, tokens.token, maxAge);
  setCookie(REFRESH_KEY, tokens.refreshToken, maxAge);
}

/** 로그아웃 시 토큰 쿠키 제거. */
export function clearTokens(): void {
  deleteCookie(TOKEN_KEY);
  deleteCookie(REFRESH_KEY);
}

/** 저장된 토큰을 반환(없으면 null). */
export function readTokens(): Tokens | null {
  const token = getCookie(TOKEN_KEY);
  const refreshToken = getCookie(REFRESH_KEY);
  return token && refreshToken ? { token, refreshToken } : null;
}

/** 자동 로그인 가능 여부(유효한 세션 쿠키 존재). */
export function hasSession(): boolean {
  return readTokens() != null;
}
