import { QueryClient } from "@tanstack/react-query";

/**
 * react-query 클라이언트 팩토리.
 * 앱 진입점(src/main.tsx)에서 한 번 생성해 QueryClientProvider 로 주입합니다.
 * (docs/09-data-fetching.md)
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 30초 동안은 캐시를 신선한 것으로 간주(불필요한 재요청 방지).
        staleTime: 30_000,
        // 격리망에서는 무한 재시도가 오히려 방해가 되므로 1회만.
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
