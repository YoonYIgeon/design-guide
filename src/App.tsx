import { useMemo, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
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
 * - 라우팅·인증·데이터는 이 하네스(컨테이너)의 책임입니다.
 * - 라이브러리(src/lib)는 라우터/데이터를 모르는 프레젠테이션 전용이며,
 *   AdminShell 은 activeKey/onNavigate props 로 라우터와 연결됩니다.
 *   (docs/08-presentational-only.md)
 */

// 내비게이션 키를 라우트 경로로 사용
const NAV: NavItem[] = [
  { key: "/", label: "대시보드", icon: <IconDashboard width={18} height={18} /> },
  { key: "/users", label: "사용자", icon: <IconUsers width={18} height={18} /> },
  { key: "/audit", label: "감사 로그", icon: <IconShield width={18} height={18} /> },
  { key: "/settings", label: "설정", icon: <IconSettings width={18} height={18} /> },
];

const TITLES: Record<string, string> = {
  "/": "대시보드",
  "/users": "사용자",
  "/audit": "감사 로그",
  "/settings": "설정",
};

// 표시용 정적 예시 데이터 (프리뷰 전용)
const EXAMPLE_USERS: UserRow[] = [
  { id: 1, name: "김하늘", email: "haneul.kim@corp.local", role: "관리자", status: "활성", lastLogin: "2026-06-30 14:22" },
  { id: 2, name: "이도윤", email: "doyoon.lee@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-30 09:11" },
  { id: 3, name: "박서준", email: "seojun.park@corp.local", role: "뷰어", status: "정지", lastLogin: "2026-05-18 17:40" },
  { id: 4, name: "최유나", email: "yuna.choi@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-29 21:03" },
];

/** 로그인 화면 (경로: /login). */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <LoginForm
          brand="사내 관리자"
          subtitle="격리망 관리자 콘솔에 로그인하세요."
          onSubmit={onLogin}
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

/** 인증된 사용자용 셸 레이아웃. 라우터 상태를 AdminShell props 로 연결. */
function ProtectedLayout({
  dark,
  onToggleTheme,
  onLogout,
}: {
  dark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AdminShell
      brand="사내 관리자"
      nav={NAV}
      activeKey={location.pathname}
      onNavigate={(key) => navigate(key)}
      title={TITLES[location.pathname] ?? ""}
      user={{ name: "관리자", role: "시스템 관리자" }}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={onToggleTheme}>
            {dark ? "라이트" : "다크"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            로그아웃
          </Button>
        </>
      }
    >
      <Outlet />
    </AdminShell>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
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

  function handleLogin() {
    setAuthed(true);
    navigate("/", { replace: true });
  }

  function handleLogout() {
    setAuthed(false);
    navigate("/login", { replace: true });
  }

  const dashboard = (
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
  );

  return (
    <Routes>
      {/* 로그인 (인증 상태면 대시보드로) */}
      <Route
        path="/login"
        element={authed ? <Navigate to="/" replace /> : <LoginScreen onLogin={handleLogin} />}
      />

      {/* 보호 경로 (미인증이면 로그인으로) */}
      <Route
        element={
          authed ? (
            <ProtectedLayout dark={dark} onToggleTheme={toggleTheme} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/" element={dashboard} />
        <Route path="/users" element={<PlaceholderPage label="사용자" />} />
        <Route path="/audit" element={<PlaceholderPage label="감사 로그" />} />
        <Route path="/settings" element={<PlaceholderPage label="설정" />} />
      </Route>

      {/* 그 외 경로 */}
      <Route path="*" element={<Navigate to={authed ? "/" : "/login"} replace />} />
    </Routes>
  );
}
