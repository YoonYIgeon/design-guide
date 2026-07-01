import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, login } from "./auth";
import { createUser, deleteUser, fetchUsers } from "./users";
import { getToken } from "./client";

/* ── 인증 ──────────────────────────────────────────── */

export const authKeys = {
  me: ["auth", "me"] as const,
};

/** 로그인 뮤테이션. 성공 시 토큰 저장은 호출부에서 처리합니다. */
export function useLogin() {
  return useMutation({ mutationFn: login });
}

/** 저장된 토큰이 있으면 세션 사용자를 복원합니다. */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMe,
    enabled: Boolean(getToken()),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

/* ── 사용자 ────────────────────────────────────────── */

export const userKeys = {
  all: ["users"] as const,
  list: (q: string) => ["users", { q }] as const,
};

export function useUsers(q: string) {
  return useQuery({
    queryKey: userKeys.list(q),
    queryFn: () => fetchUsers(q),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
