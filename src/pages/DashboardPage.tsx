import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  StatCard,
  type Column,
  type DataTablePagination,
} from "../lib";
import { IconPencil, IconPlus, IconSearch, IconTrash, IconUsers } from "../lib/icons";

/** 데모 표시용 행 모양. 실제 데이터 형태는 소비 시스템이 정합니다. */
export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: "관리자" | "운영자" | "뷰어";
  status: "활성" | "정지";
  lastLogin: string;
}

export interface DashboardStats {
  total: number;
  active: number;
  suspended: number;
  todayLogins: number;
}

export interface DashboardPageProps {
  /** 그릴 사용자 목록(이미 검색/정렬/페이징이 끝난 "현재 페이지" 행만 전달받음). */
  users: UserRow[];
  stats: DashboardStats;
  loading?: boolean;
  error?: string | null;
  /** 검색어(제어값). 필터링 자체는 컨테이너 책임. */
  query: string;
  onQueryChange: (q: string) => void;
  /** 사용자 추가/삭제 의도 전달만. 실제 반영은 컨테이너가 처리. */
  onCreateUser: (payload: { name: string; email: string }) => void;
  onDeleteUser: (id: number) => void;
  /** 사용자 이름 변경 의도 전달만. 값 입력·반영은 컨테이너가 처리. */
  onRenameUser: (id: number) => void;
  /** 페이지네이션(controlled). 페이지·페이지 크기 상태는 컨테이너가 보유합니다. */
  pagination?: DataTablePagination;
}

/**
 * 프레젠테이션 전용 대시보드 뷰.
 * - 데이터 패칭/전역 상태/비즈니스 로직 없음.
 * - 보유 상태: 모달 열림 여부·폼 입력값 같은 순수 UI 상태뿐.
 * - 값은 props 로 받고, 사용자 의도는 callback 으로 내보냅니다.
 *   (docs/08-presentational-only.md)
 */
export function DashboardPage({
  users,
  stats,
  loading = false,
  error = null,
  query,
  onQueryChange,
  onCreateUser,
  onDeleteUser,
  onRenameUser,
  pagination,
}: DashboardPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });

  const columns: Column<UserRow>[] = [
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
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${u.name} 이름 변경`}
            onClick={() => onRenameUser(u.id)}
            className="h-8 w-8 p-0 text-text-muted hover:text-text"
          >
            <IconPencil width={16} height={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${u.name} 삭제`}
            onClick={() => onDeleteUser(u.id)}
            className="h-8 w-8 p-0 text-text-muted hover:text-danger"
          >
            <IconTrash width={16} height={16} />
          </Button>
        </div>
      ),
    },
  ];

  function openModal() {
    setForm({ name: "", email: "" });
    setModalOpen(true);
  }

  function submitModal() {
    onCreateUser({ name: form.name.trim(), email: form.email.trim() });
    setModalOpen(false);
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-6">
      {/* 요약 지표 */}
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 사용자" value={stats.total} icon={<IconUsers />} />
        <StatCard label="활성 사용자" value={stats.active} />
        <StatCard label="정지 사용자" value={stats.suspended} />
        <StatCard label="오늘 로그인" value={stats.todayLogins} />
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
                onChange={(e) => onQueryChange(e.target.value)}
              />
            </div>
            <Button variant="primary" size="md" onClick={openModal}>
              <IconPlus width={16} height={16} />
              사용자 추가
            </Button>
          </div>
        }
        bodyClassName="flex min-h-0 flex-1 flex-col p-0"
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <DataTable
            columns={columns}
            rows={users}
            rowKey={(u) => u.id}
            loading={loading}
            error={error}
            emptyText={query ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
            pagination={pagination}
            fillHeight
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
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={submitModal}>
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
