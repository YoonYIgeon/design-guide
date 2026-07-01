import { api } from "./client";

export type UserRole = "관리자" | "운영자" | "뷰어";
export type UserStatus = "활성" | "정지";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
}

/** 사용자 목록 조회 (검색어는 서버에 위임). */
export async function fetchUsers(q?: string): Promise<User[]> {
  const { data } = await api.get<User[]>("/users", { params: q ? { q } : undefined });
  return data;
}

/** 사용자 생성. */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<User>("/users", payload);
  return data;
}

/** 사용자 삭제. */
export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}
