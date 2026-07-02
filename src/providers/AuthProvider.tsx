import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { clearTokens, hasSession, readTokens, saveTokens, type Tokens } from "../auth";
import { login as loginRequest, type LoginCredentials } from "../api";

/**
 * 인증 프로바이더 — 하네스(컨테이너) 레벨의 인증 상태 관리.
 *
 * ⚠️ 라이브러리(src/lib)가 아니라 소비 시스템 쪽 코드입니다.
 *    인증/영속화(쿠키)는 프레젠테이션 전용 원칙상 라이브러리로 올리지 않고 여기서 다룹니다.
 *    저수준 토큰 저장/복원은 src/auth.ts 가, 그 위의 인증 상태(context)는 이 프로바이더가 담당합니다.
 *    로그인 HTTP 호출은 API 목록(src/api/index.ts)에 두고, 이 프로바이더는 useMutation 으로
 *    호출해 결과(토큰)를 쿠키에 저장하고 인증 상태로 전환하는 오케스트레이션만 담당합니다.
 *    라우팅 이동은 라우터를 아는 호출부(App)가 처리합니다.
 *    (docs/08-presentational-only.md, docs/09-data-fetching.md, src/auth.ts)
 */

export interface AuthApi {
  /** 유효한 세션 쿠키가 있어 인증된 상태인지 여부. */
  authed: boolean;
  /**
   * 로그인: 자격증명으로 인증 API 를 호출해 토큰을 발급받아 저장하고 인증 상태로 전환.
   * remember 로 지속/세션 쿠키를 결정. 실패 시 예외를 던집니다(호출부가 처리).
   */
  login: (credentials: LoginCredentials, remember: boolean) => Promise<void>;
  /** 로그아웃: 토큰 쿠키 제거 후 미인증 상태로 전환. */
  logout: () => void;
  /** 현재 저장된 토큰(없으면 null). */
  getTokens: () => Tokens | null;
  /** 로그인 요청 진행 중 여부(폼 로딩 표시용). */
  loggingIn: boolean;
  /** 마지막 로그인 요청의 에러(정규화된 ApiError/Error, 없으면 null). */
  loginError: Error | null;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 자동 로그인: 쿠키에 유효한 세션이 있으면 인증 상태로 시작합니다.
  const [authed, setAuthed] = useState(() => hasSession());

  // 로그인 HTTP 는 API 목록(src/api)의 login 을 useMutation 으로 직접 호출합니다.
  // (mutateAsync/isPending/error 는 안정 참조라 그대로 의존성에 사용합니다.)
  const { mutateAsync, isPending, error, reset } = useMutation<
    Tokens,
    Error,
    LoginCredentials
  >({ mutationFn: loginRequest });

  const login = useCallback(
    async (credentials: LoginCredentials, remember: boolean) => {
      const tokens = await mutateAsync(credentials);
      saveTokens(tokens, remember);
      setAuthed(true);
    },
    [mutateAsync],
  );

  const logout = useCallback(() => {
    clearTokens();
    reset(); // 이전 로그인 에러/상태를 비워 다음 로그인 화면을 깨끗하게.
    setAuthed(false);
  }, [reset]);

  const api = useMemo<AuthApi>(
    () => ({
      authed,
      login,
      logout,
      getTokens: readTokens,
      loggingIn: isPending,
      loginError: error,
    }),
    [authed, login, logout, isPending, error],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

/** 인증 API 훅. AuthProvider 하위에서만 사용합니다. */
export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 는 <AuthProvider> 안에서만 사용할 수 있습니다.");
  return ctx;
}
