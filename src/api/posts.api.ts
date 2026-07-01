import { apiClient } from "./client";

/**
 * 예시 리소스: 게시글(Post) API 모듈.
 *
 * 한 리소스의 엔드포인트/타입을 한 파일에 모아 "API 관리" 패턴을 보여줍니다.
 * 소비 시스템은 이 파일을 리소스별로 복제해(posts.api.ts → orders.api.ts …)
 * 자신의 도메인에 맞게 수정합니다. (docs/09-data-fetching.md)
 */

/** 서버가 내려주는 게시글 형태. body 는 마크다운 원문입니다. */
export interface Post {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  /** 마크다운 본문 — lib 의 <Markdown> 으로 렌더링합니다. */
  body: string;
}

export interface CreatePostInput {
  title: string;
  author: string;
  body: string;
}

/**
 * 데모 모드: `VITE_API_BASE_URL` 이 없으면(=프리뷰) 실제 네트워크 대신
 * 인메모리 예시 데이터를 사용합니다. 격리망 원칙상 외부 호출을 하지 않으면서도
 * axios 사용 코드를 그대로 남겨 두기 위한 스캐폴드입니다.
 * 소비 시스템에서 VITE_API_BASE_URL 을 주입하면 아래 apiClient 경로로 동작합니다.
 */
const DEMO_MODE = import.meta.env.VITE_API_BASE_URL == null;

let demoPosts: Post[] = [
  {
    id: 1,
    title: "관리자 UI 라이브러리 배포 가이드",
    author: "김하늘",
    createdAt: "2026-06-30",
    body: [
      "# 배포 가이드",
      "",
      "이 라이브러리는 **Git** 을 통해 배포됩니다. 공용 npm 레지스트리에 의존하지 않습니다.",
      "",
      "## 절차",
      "",
      "1. 변경 사항을 브랜치에 커밋합니다.",
      "2. `yarn build` 로 타입체크와 빌드를 확인합니다.",
      "3. 태그를 붙여 릴리스합니다.",
      "",
      "> 롤백은 이전 태그로 되돌리는 것으로 충분합니다.",
      "",
      "자세한 내용은 `docs/06-versioning-release.md` 를 참고하세요.",
    ].join("\n"),
  },
  {
    id: 2,
    title: "프레젠테이션 전용 원칙 요약",
    author: "이도윤",
    createdAt: "2026-06-28",
    body: [
      "## 프레젠테이션 전용(UI-only)",
      "",
      "- 컴포넌트는 **그리는 역할**만 합니다.",
      "- 값은 `props`, 상호작용은 `callback` 으로 주고받습니다.",
      "- 데이터 패칭·전역 상태·비즈니스 로직은 하네스가 책임집니다.",
      "",
      "```tsx",
      "<Markdown>{post.body}</Markdown>",
      "```",
      "",
      "이렇게 하면 다른 레포지토리에서 포크해도 UI 계약이 그대로 유지됩니다.",
    ].join("\n"),
  },
];

/** 데모용 지연(네트워크 왕복을 흉내내 로딩 상태를 확인할 수 있게 함). */
function demoDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 400));
}

export async function fetchPosts(): Promise<Post[]> {
  if (DEMO_MODE) return demoDelay([...demoPosts]);
  const { data } = await apiClient.get<Post[]>("/posts");
  return data;
}

export async function fetchPost(id: number): Promise<Post> {
  if (DEMO_MODE) {
    const found = demoPosts.find((p) => p.id === id);
    if (!found) throw new Error(`게시글 #${id} 을(를) 찾을 수 없습니다.`);
    return demoDelay(found);
  }
  const { data } = await apiClient.get<Post>(`/posts/${id}`);
  return data;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  if (DEMO_MODE) {
    const created: Post = {
      id: demoPosts.reduce((max, p) => Math.max(max, p.id), 0) + 1,
      createdAt: new Date().toISOString().slice(0, 10),
      ...input,
    };
    demoPosts = [created, ...demoPosts];
    return demoDelay(created);
  }
  const { data } = await apiClient.post<Post>("/posts", input);
  return data;
}
