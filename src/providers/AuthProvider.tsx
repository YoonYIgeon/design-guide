import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearTokens, hasSession, readTokens, saveTokens, type Tokens } from "../auth";

/**
 * 인증 프로바이더 — 하네스(컨테이너) 레벨의 인증 상태 관리.
 *
 * ⚠️ 라이브러리(src/lib)가 아니라 소비 시스템 쪽 코드입니다.
 *    인증/영속화(쿠키)는 프레젠테이션 전용 원칙상 라이브러리로 올리지 않고 여기서 다룹니다.
 *    저수준 토큰 저장/복원은 src/auth.ts 가, 그 위의 인증 상태(context)는 이 프로바이더가 담당합니다.
 *    라우팅 이동은 라우터를 아는 호출부(App)가 처리합니다.
 *    (docs/08-presentational-only.md, src/auth.ts)
 */

export interface AuthApi {
  /** 유효한 세션 쿠키가 있어 인증된 상태인지 여부. */
  authed: boolean;
  /** 로그인: 토큰을 저장하고 인증 상태로 전환. remember 로 지속/세션 쿠키를 결정. */
  login: (tokens: Tokens, remember: boolean) => void;
  /** 로그아웃: 토큰 쿠키 제거 후 미인증 상태로 전환. */
  logout: () => void;
  /** 현재 저장된 토큰(없으면 null). */
  getTokens: () => Tokens | null;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 자동 로그인: 쿠키에 유효한 세션이 있으면 인증 상태로 시작합니다.
  const [authed, setAuthed] = useState(() => hasSession());

  const login = useCallback((tokens: Tokens, remember: boolean) => {
    saveTokens(tokens, remember);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAuthed(false);
  }, []);

  const api = useMemo<AuthApi>(
    () => ({ authed, login, logout, getTokens: readTokens }),
    [authed, login, logout],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

/** 인증 API 훅. AuthProvider 하위에서만 사용합니다. */
export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 는 <AuthProvider> 안에서만 사용할 수 있습니다.");
  return ctx;
}
