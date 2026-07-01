import { useMemo, useState } from "react";
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

interface User {
  id: number;
  name: string;
  email: string;
  role: "관리자" | "운영자" | "뷰어";
  status: "활성" | "정지";
  lastLogin: string;
}

const SEED: User[] = [
  { id: 1, name: "김하늘", email: "haneul.kim@corp.local", role: "관리자", status: "활성", lastLogin: "2026-06-30 14:22" },
  { id: 2, name: "이도윤", email: "doyoon.lee@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-30 09:11" },
  { id: 3, name: "박서준", email: "seojun.park@corp.local", role: "뷰어", status: "정지", lastLogin: "2026-05-18 17:40" },
  { id: 4, name: "최유나", email: "yuna.choi@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-29 21:03" },
];

export function DashboardPage() {
  const [users, setUsers] = useState<User[]>(SEED);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

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
    { key: "lastLogin", header: "최근 로그인", align: "left" },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${u.name} 삭제`}
          onClick={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))}
          className="h-8 w-8 p-0 text-text-muted hover:text-danger"
        >
          <IconTrash width={16} height={16} />
        </Button>
      ),
    },
  ];

  function handleAdd() {
    setSaving(true);
    // 실제 소비 시스템에서는 사내 API 호출로 대체합니다.
    window.setTimeout(() => {
      setUsers((prev) => [
        {
          id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
          name: form.name || "이름없음",
          email: form.email || "unknown@corp.local",
          role: "뷰어",
          status: "활성",
          lastLogin: "-",
        },
        ...prev,
      ]);
      setSaving(false);
      setModalOpen(false);
      setForm({ name: "", email: "" });
    }, 500);
  }

  const activeCount = users.filter((u) => u.status === "활성").length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* 요약 지표 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 사용자" value={users.length} icon={<IconUsers />} delta={{ value: "2", direction: "up" }} />
        <StatCard label="활성 사용자" value={activeCount} delta={{ value: "1", direction: "up" }} />
        <StatCard label="정지 사용자" value={users.length - activeCount} delta={{ value: "1", direction: "down" }} />
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
            <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>
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
            rows={filtered}
            rowKey={(u) => u.id}
            emptyText={query ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
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
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              취소
            </Button>
            <Button variant="primary" onClick={handleAdd} loading={saving}>
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
        </div>
      </Modal>
    </div>
  );
}
