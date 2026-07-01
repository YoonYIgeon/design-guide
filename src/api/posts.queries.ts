import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPost,
  fetchPost,
  fetchPosts,
  type CreatePostInput,
  type Post,
} from "./posts.api";

/**
 * 게시글 리소스의 react-query 훅 모음.
 *
 * 컴포넌트는 이 훅만 호출하고, "언제/어떻게 패칭하는지"는 여기서 관리합니다.
 * 쿼리 키를 한 곳(postKeys)에 모아 무효화(invalidate) 대상을 명확히 합니다.
 * (docs/09-data-fetching.md)
 */
export const postKeys = {
  all: ["posts"] as const,
  list: () => [...postKeys.all, "list"] as const,
  detail: (id: number) => [...postKeys.all, "detail", id] as const,
};

/** 게시글 목록 조회. */
export function usePosts() {
  return useQuery({ queryKey: postKeys.list(), queryFn: fetchPosts });
}

/** 단일 게시글 조회. id 가 null 이면 요청하지 않습니다(enabled). */
export function usePost(id: number | null) {
  return useQuery({
    queryKey: postKeys.detail(id ?? -1),
    queryFn: () => fetchPost(id as number),
    enabled: id != null,
  });
}

/** 게시글 생성. 성공 시 목록 캐시를 무효화해 자동 갱신합니다. */
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation<Post, Error, CreatePostInput>({
    mutationFn: (input) => createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.list() });
    },
  });
}
