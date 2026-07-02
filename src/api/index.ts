import { apiClient } from "./client";
import type { Tokens } from "../auth";
import * as demo from "./demo";

/**
 * API 목록 — 앱이 호출하는 모든 엔드포인트(타입 + 함수 + 쿼리 키)를 이 한 파일에서 관리합니다.
 *
 * ⚠️ 하네스의 데이터 계층입니다(라이브러리 src/lib 아님).
 *    - HTTP 인스턴스/인터셉터는 client.ts, 데모 스캐폴드는 demo.ts 가 담당합니다.
 *    - 컴포넌트(pages/providers)는 여기서 export 한 함수·쿼리 키로 useQuery/useMutation 을
 *      직접 호출합니다. 별도 훅 계층을 두지 않습니다. (docs/09-data-fetching.md)
 *    - 쿼리 키는 반드시 이 파일의 *Keys 만 사용하세요. 컴포넌트에 인라인 문자열 키를 쓰면
 *      뮤테이션 후 무효화(invalidate)가 조용히 어긋납니다.
 *
 * 소비 시스템은 이 파일에 자신의 리소스(타입/함수/쿼리 키)를 추가해 확장합니다.
 */

/* ──────────────────────────── 게시글(Posts) ──────────────────────────── */

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

/** 게시글 쿼리 키 — 컴포넌트의 useQuery/invalidateQueries 는 항상 이 키를 사용합니다. */
export const postKeys = {
  all: ["posts"] as const,
  list: () => [...postKeys.all, "list"] as const,
  detail: (id: number) => [...postKeys.all, "detail", id] as const,
};

export async function fetchPosts(): Promise<Post[]> {
  if (demo.DEMO_MODE) return demo.fetchPosts();
  const { data } = await apiClient.get<Post[]>("/posts");
  return data;
}

export async function fetchPost(id: number): Promise<Post> {
  if (demo.DEMO_MODE) return demo.fetchPost(id);
  const { data } = await apiClient.get<Post>(`/posts/${id}`);
  return data;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  if (demo.DEMO_MODE) return demo.createPost(input);
  const { data } = await apiClient.post<Post>("/posts", input);
  return data;
}

/* ──────────────────────────── 파일 업로드(Uploads) ──────────────────────────── */

/**
 * 서버 업로드 결과 — 업로드가 끝나면 접근 URL 과 파일명을 객체로 돌려줍니다.
 * FileUpload 컴포넌트의 FileItem 은 이 값을 그대로 채워 넣습니다.
 * (소비 시스템의 응답 필드명이 다르면 uploadFile() 매핑 한 곳만 고치면 됩니다.)
 */
export interface UploadResult {
  /** 업로드된 파일의 접근 URL. */
  url: string;
  /** 저장된(혹은 원본) 파일명. */
  name: string;
  /** 바이트 크기. */
  size: number;
}

export interface UploadOptions {
  /** 업로드 진행률 콜백(0~100). 진행 막대 표시에 사용. */
  onProgress?: (percent: number) => void;
  /** 취소용 AbortSignal. */
  signal?: AbortSignal;
}

/**
 * 파일 한 건을 multipart/form-data 로 업로드하고 { url, name, size } 를 받습니다.
 * 컨테이너(pages)는 FileUpload.onSelect 로 받은 File 을 이 함수로 업로드하고,
 * 결과를 FileItem(status: "done", url, name)으로 반영합니다. (docs/09-data-fetching.md)
 */
export async function uploadFile(
  file: File,
  opts: UploadOptions = {},
): Promise<UploadResult> {
  if (demo.DEMO_MODE) return demo.uploadFile(file, opts);
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<UploadResult>("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
    signal: opts.signal,
    onUploadProgress: (e) => {
      if (opts.onProgress && e.total) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
}

/* ──────────────────────────── 인증(Auth) ──────────────────────────── */

/*
 * 소비 시스템은 아래 세 곳만 자신의 인증 서버에 맞게 바꾸면 그대로 동작합니다.
 *   ① AUTH_LOGIN_PATH  — 로그인 엔드포인트 경로(URL)
 *   ② LoginResponse    — 서버가 내려주는 응답 JSON 구조
 *   ③ toTokens()       — 응답 구조 → 앱 내부 토큰(Tokens) 매핑
 */

/** 로그인 요청 파라미터(폼에서 입력받은 값). */
export interface LoginCredentials {
  id: string;
  password: string;
}

/**
 * ② 연결 지점 — 서버 로그인 응답의 원본 구조.
 *
 * 실제 인증 서버가 내려주는 JSON 형태에 맞게 이 타입만 수정하세요.
 * 예) `{ data: { token, refresh_token } }` 처럼 감싸져 있다면 그 형태로 바꾸고
 *     아래 toTokens() 에서 꺼내면 됩니다.
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * ① 연결 지점 — 로그인 엔드포인트 경로.
 *
 * baseURL 은 client.ts 의 `VITE_API_BASE_URL`(사내 게이트웨이)이 담당하므로
 * 여기서는 그 뒤에 붙는 상대 경로만 지정합니다.
 */
export const AUTH_LOGIN_PATH = "/auth/login";

/**
 * ③ 연결 지점 — 응답 구조 → 앱 내부 토큰(Tokens) 매핑.
 *
 * 서버 응답 필드명이 다르면(예: `access_token`) 이 함수 한 곳만 고치면 됩니다.
 * 앱의 나머지 코드는 항상 정규화된 Tokens 타입만 다룹니다.
 */
function toTokens(res: LoginResponse): Tokens {
  return { token: res.accessToken, refreshToken: res.refreshToken };
}

/**
 * 로그인: 자격증명을 서버로 보내 토큰을 발급받습니다.
 * 반환값은 항상 정규화된 Tokens — 소비 시스템은 응답 구조를 toTokens() 로만 흡수합니다.
 */
export async function login(credentials: LoginCredentials): Promise<Tokens> {
  if (demo.DEMO_MODE) return toTokens(await demo.login(credentials));
  const { data } = await apiClient.post<LoginResponse>(AUTH_LOGIN_PATH, credentials);
  return toTokens(data);
}
