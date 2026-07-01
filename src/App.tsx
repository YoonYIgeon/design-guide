import { useMemo, useState } from "react";
import { AdminShell, Button, LoginForm, type NavItem } from "./lib";
import {
  IconDashboard,
  IconSettings,
  IconShield,
  IconUsers,
} from "./lib/icons";
import { DashboardPage, type UserRow } from "./pages/DashboardPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

/**
 * 데모/프리뷰 하네스.
 * - 라이브러리(src/lib)는 프레젠테이션 전용이므로 데이터를 모릅니다.
 * - 이 파일은 컴포넌트가 어떻게 보이는지 확인하기 위한 껍데기이며,
 *   아래 값은 네트워크/영속화가 아닌 "정적 예시 데이터"일 뿐입니다.
 *   실제 소비 시스템은 이 자리에서 자체 데이터 계층(react-query 등)을 연결합니다.
 *   (docs/08-presentational-only.md)
 */

const NAV: NavItem[] = [
  { key: "dashboard", label: "대시보드", icon: <IconDashboard width={18} height={18} /> },
  { key: "users", label: "사용자", icon: <IconUsers width={18} height={18} /> },
  { key: "audit", label: "감사 로그", icon: <IconShield width={18} height={18} /> },
  { key: "settings", label: "설정", icon: <IconSettings width={18} height={18} /> },
];

const TITLES: Record<string, string> = {
  dashboard: "대시보드",
  users: "사용자",
  audit: "감사 로그",
  settings: "설정",
};

// 표시용 정적 예시 데이터 (프리뷰 전용)
const EXAMPLE_USERS: UserRow[] = [
  { id: 1, name: "김하늘", email: "haneul.kim@corp.local", role: "관리자", status: "활성", lastLogin: "2026-06-30 14:22" },
  { id: 2, name: "이도윤", email: "doyoon.lee@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-30 09:11" },
  { id: 3, name: "박서준", email: "seojun.park@corp.local", role: "뷰어", status: "정지", lastLogin: "2026-05-18 17:40" },
  { id: 4, name: "최유나", email: "yuna.choi@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-29 21:03" },
];

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [dark, setDark] = useState(false);

  const [users, setUsers] = useState<UserRow[]>(EXAMPLE_USERS);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "활성").length,
      suspended: users.filter((u) => u.status === "정지").length,
      todayLogins: 12,
    }),
    [users],
  );

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm">
          <LoginForm
            brand="사내 관리자"
            subtitle="격리망 관리자 콘솔에 로그인하세요."
            onSubmit={() => setAuthed(true)}
            footer={
              <p className="text-center text-xs text-text-muted">
                데모 프리뷰 — 아무 값이나 입력해 진입할 수 있습니다.
              </p>
            }
          />
          <p className="mt-4 text-center text-xs text-text-muted">
            외부망과 분리된 사내 전용 시스템입니다. · v0.1.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      brand="사내 관리자"
      nav={NAV}
      activeKey={active}
      onNavigate={setActive}
      title={TITLES[active]}
      user={{ name: "관리자", role: "시스템 관리자" }}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {dark ? "라이트" : "다크"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAuthed(false)}>
            로그아웃
          </Button>
        </>
      }
    >
      {active === "dashboard" ? (
        <DashboardPage
          users={filtered}
          stats={stats}
          query={query}
          onQueryChange={setQuery}
          onCreateUser={(payload) =>
            setUsers((prev) => [
              {
                id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
                name: payload.name || "이름없음",
                email: payload.email || "unknown@corp.local",
                role: "뷰어",
                status: "활성",
                lastLogin: "-",
              },
              ...prev,
            ])
          }
          onDeleteUser={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))}
        />
      ) : (
        <PlaceholderPage label={TITLES[active]} />
      )}
    </AdminShell>
  );
}
