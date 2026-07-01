import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { User } from "./users";

/**
 * 데모용 목 백엔드 (axios 어댑터).
 * 실제 격리망 배포 시에는 VITE_ENABLE_MOCK=false 로 비활성화하고
 * 사내 API 서버로 실제 요청이 나갑니다. (docs/02-architecture.md)
 *
 * 호출 코드(api.get/post/delete)와 react-query 훅은 목/실서버에 관계없이 동일합니다.
 */

const DEMO_CRED = { id: "admin", password: "admin1234" };

let users: User[] = [
  { id: 1, name: "김하늘", email: "haneul.kim@corp.local", role: "관리자", status: "활성", lastLogin: "2026-06-30 14:22" },
  { id: 2, name: "이도윤", email: "doyoon.lee@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-30 09:11" },
  { id: 3, name: "박서준", email: "seojun.park@corp.local", role: "뷰어", status: "정지", lastLogin: "2026-05-18 17:40" },
  { id: 4, name: "최유나", email: "yuna.choi@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-29 21:03" },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return { data, status, statusText: "OK", headers: {}, config };
}

function fail(config: InternalAxiosRequestConfig, status: number, message: string): never {
  // axios 인터셉터/에러 핸들러가 기대하는 형태로 reject
  throw {
    isAxiosError: true,
    message,
    config,
    response: { status, statusText: "Error", headers: {}, config, data: { message } },
  };
}

function parseBody<T>(config: InternalAxiosRequestConfig): T {
  const raw = config.data;
  if (!raw) return {} as T;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await delay(450);
  const method = (config.method ?? "get").toLowerCase();
  const url = (config.url ?? "").replace(/\?.*$/, "");
  const authed = Boolean(config.headers?.Authorization);

  // ── 인증 ──────────────────────────────────────────
  if (url === "/auth/login" && method === "post") {
    const body = parseBody<{ id: string; password: string }>(config);
    if (body.id === DEMO_CRED.id && body.password === DEMO_CRED.password) {
      return ok(config, {
        token: "mock-access-token",
        user: { id: "u-admin", name: "관리자", role: "시스템 관리자" },
      });
    }
    fail(config, 401, "아이디 또는 비밀번호가 올바르지 않습니다.");
  }

  if (url === "/auth/me" && method === "get") {
    if (!authed) fail(config, 401, "인증이 필요합니다.");
    return ok(config, { id: "u-admin", name: "관리자", role: "시스템 관리자" });
  }

  // 이하 리소스는 인증 필요
  if (!authed) fail(config, 401, "인증이 필요합니다.");

  // ── 사용자 목록 ───────────────────────────────────
  if (url === "/users" && method === "get") {
    const q = String(config.params?.q ?? "").trim().toLowerCase();
    const rows = q
      ? users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      : users;
    return ok(config, rows);
  }

  // ── 사용자 생성 ───────────────────────────────────
  if (url === "/users" && method === "post") {
    const body = parseBody<{ name: string; email: string }>(config);
    if (!body.name?.trim() || !body.email?.trim()) {
      fail(config, 400, "이름과 이메일은 필수입니다.");
    }
    const created: User = {
      id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      name: body.name,
      email: body.email,
      role: "뷰어",
      status: "활성",
      lastLogin: "-",
    };
    users = [created, ...users];
    return ok(config, created, 201);
  }

  // ── 사용자 삭제 ───────────────────────────────────
  const delMatch = url.match(/^\/users\/(\d+)$/);
  if (delMatch && method === "delete") {
    const id = Number(delMatch[1]);
    users = users.filter((u) => u.id !== id);
    return ok(config, { id }, 200);
  }

  return fail(config, 404, `목 핸들러 없음: ${method.toUpperCase()} ${url}`);
};
