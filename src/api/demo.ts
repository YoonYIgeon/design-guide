import type {
  CreatePostInput,
  LoginCredentials,
  LoginResponse,
  Post,
  UploadOptions,
  UploadResult,
} from "./index";

/**
 * 데모 모드 스캐폴드 — `VITE_API_BASE_URL` 이 없으면(=프리뷰) 실제 네트워크 대신
 * 인메모리 예시 데이터를 사용합니다. 격리망 원칙상 외부 호출을 하지 않으면서도
 * API 목록(src/api/index.ts)의 axios 사용 코드를 그대로 남겨 두기 위한 파일입니다.
 *
 * 소비 시스템에서 VITE_API_BASE_URL 을 주입하면 이 파일은 전혀 실행되지 않고,
 * index.ts 의 apiClient 경로로 동작합니다. 실제 연동만 할 거라면 이 파일과
 * index.ts 의 DEMO_MODE 분기를 삭제해도 됩니다.
 */
export const DEMO_MODE = import.meta.env.VITE_API_BASE_URL == null;

/** 데모용 지연(네트워크 왕복을 흉내내 로딩 상태를 확인할 수 있게 함). */
function demoDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 400));
}

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

export function fetchPosts(): Promise<Post[]> {
  return demoDelay([...demoPosts]);
}

export function fetchPost(id: number): Promise<Post> {
  const found = demoPosts.find((p) => p.id === id);
  if (!found) throw new Error(`게시글 #${id} 을(를) 찾을 수 없습니다.`);
  return demoDelay(found);
}

export function createPost(input: CreatePostInput): Promise<Post> {
  const created: Post = {
    id: demoPosts.reduce((max, p) => Math.max(max, p.id), 0) + 1,
    createdAt: new Date().toISOString().slice(0, 10),
    ...input,
  };
  demoPosts = [created, ...demoPosts];
  return demoDelay(created);
}

/**
 * 파일 업로드 흉내: 실제 네트워크 대신 진행률을 몇 단계로 흘려보낸 뒤,
 * 브라우저 로컬 objectURL 을 접근 URL 로 돌려줍니다(외부 호출 없음 = 격리망 준수).
 * 실제 연동에서는 index.ts 의 apiClient 경로가 서버 URL 을 돌려줍니다.
 */
export function uploadFile(file: File, opts: UploadOptions = {}): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    let percent = 0;
    const timer = setInterval(() => {
      if (opts.signal?.aborted) {
        clearInterval(timer);
        reject(new DOMException("업로드가 취소되었습니다.", "AbortError"));
        return;
      }
      percent = Math.min(100, percent + 20);
      opts.onProgress?.(percent);
      if (percent >= 100) {
        clearInterval(timer);
        resolve({
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
        });
      }
    }, 120);
  });
}

/** 로그인 흉내: 아무 값이나 받아 발급된 것처럼 응답합니다(비밀번호 검증 없음). */
export function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return demoDelay({
    accessToken: `demo-access-${credentials.id || "user"}`,
    refreshToken: "demo-refresh-token",
  });
}
