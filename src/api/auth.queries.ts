import { useMutation } from "@tanstack/react-query";
import { login, type LoginCredentials } from "./auth.api";
import type { Tokens } from "../auth";

/**
 * 인증 리소스의 react-query 훅 모음.
 *
 * 로그인은 "서버 상태를 바꾸는 요청"이므로 useMutation 으로 다룹니다.
 * 컴포넌트/프로바이더는 이 훅만 호출하고, "언제/어떻게 호출하는지"는 여기서 관리합니다.
 * (docs/09-data-fetching.md)
 */

/**
 * 로그인 뮤테이션.
 * 성공하면 정규화된 Tokens 를 돌려줍니다(쿠키 저장/상태 전환은 AuthProvider 가 담당).
 */
export function useLoginMutation() {
  return useMutation<Tokens, Error, LoginCredentials>({
    mutationFn: (credentials) => login(credentials),
  });
}
