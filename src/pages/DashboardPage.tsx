import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  StatCard,
  type Column,
} from "../lib";
import { IconPlus, IconSearch, IconTrash, IconUsers } from "../lib/icons";
import { useCreateUser, useDeleteUser, useUsers } from "../api/hooks";
import { toErrorMessage } from "../api/client";
import type { User } from "../api/users";

/** 입력값 디바운스 (검색어가 바뀔 때마다 서버 호출이 폭주하지 않도록). */
function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function DashboardPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);

  // 통계는 전체 목록 기준, 테이블은 검색 결과 기준 (react-query 가 각각 캐시)
  const allUsers = useUsers("");
  const listUsers = useUsers(debouncedQuery);
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const total = allUsers.data ?? [];
  const activeCount = total.filter((u) => u.status === "활성").length;

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "이름",
      render: (u) => (
        <div>
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-text-muted">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "권한",
      render: (u) => (
        <Badge tone={u.role === "관리자" ? "info" : "neutral"}>{u.role}</Badge>
      ),
    },
    {
      key: "status",
      header: "상태",
      render: (u) => (
        <Badge tone={u.status === "활성" ? "success" : "danger"}>{u.status}</Badge>
      ),
    },
    { key: "lastLogin", header: "최근 로그인" },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${u.name} 삭제`}
          disabled={deleteUser.isPending}
          onClick={() => deleteUser.mutate(u.id)}
          className="h-8 w-8 p-0 text-text-muted hover:text-danger"
        >
          <IconTrash width={16} height={16} />
        </Button>
      ),
    },
  ];

  function openModal() {
    setForm({ name: "", email: "" });
    setFormError(null);
    setModalOpen(true);
  }

  function handleAdd() {
    setFormError(null);
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("이름과 이메일을 입력하세요.");
      return;
    }
    createUser.mutate(
      { name: form.name.trim(), email: form.email.trim() },
      {
        onSuccess: () => setModalOpen(false),
        onError: (err) => setFormError(toErrorMessage(err, "사용자 추가에 실패했습니다.")),
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* 요약 지표 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 사용자" value={allUsers.isLoading ? "…" : total.length} icon={<IconUsers />} />
        <StatCard label="활성 사용자" value={allUsers.isLoading ? "…" : activeCount} />
        <StatCard label="정지 사용자" value={allUsers.isLoading ? "…" : total.length - activeCount} />
        <StatCard label="오늘 로그인" value={12} />
      </div>

      {/* 사용자 목록 */}
      <Card
        title="사용자 관리"
        action={
          <div className="flex items-center gap-2">
            <div className="w-52">
              <Input
                aria-label="사용자 검색"
                placeholder="이름·이메일 검색"
                leading={<IconSearch width={16} height={16} />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button variant="primary" size="md" onClick={openModal}>
              <IconPlus width={16} height={16} />
              사용자 추가
            </Button>
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={listUsers.data ?? []}
            rowKey={(u) => u.id}
            loading={listUsers.isLoading}
            error={listUsers.isError ? toErrorMessage(listUsers.error, "목록을 불러오지 못했습니다.") : null}
            emptyText={debouncedQuery ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
          />
        </div>
      </Card>

      {/* 사용자 추가 모달 */}
      <Modal
        open={modalOpen}
        title="사용자 추가"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={createUser.isPending}>
              취소
            </Button>
            <Button variant="primary" onClick={handleAdd} loading={createUser.isPending}>
              추가
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="이름"
            required
            placeholder="예: 홍길동"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="이메일"
            type="email"
            required
            hint="사내 계정 도메인(@corp.local)만 허용됩니다."
            placeholder="user@corp.local"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          {formError && (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
