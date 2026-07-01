import { api } from "./client";

export interface SessionUser {
  id: string;
  name: string;
  role: string;
}

export interface LoginPayload {
  id: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: SessionUser;
}

/** 로그인: 사내 인증 서버에 자격 증명을 전송하고 토큰/사용자를 받습니다. */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

/** 저장된 토큰으로 현재 세션 사용자를 조회합니다(세션 복원용). */
export async function fetchMe(): Promise<SessionUser> {
  const { data } = await api.get<SessionUser>("/auth/me");
  return data;
}
