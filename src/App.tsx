import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AdminShell, Button, LoginForm, useAlert, useToast, type NavItem } from "./lib";
import { DashboardPage, type UserRow } from "./pages/DashboardPage";
import { useAuth } from "./providers";
import { createAppRoutes, toNavItems, toTitleMap } from "./routes";

/**
 * 데모/프리뷰 하네스.
 * - 라우팅·인증·데이터는 이 하네스(컨테이너)의 책임입니다.
 * - 라우트 정의는 src/routes.tsx 의 "객체 배열"에 모아두고, 여기서는 그 배열로부터
 *   내비게이션·타이틀·<Route> 목록을 파생합니다.
 * - 라이브러리(src/lib)는 라우터/데이터를 모르는 프레젠테이션 전용이며,
 *   AdminShell 은 activeKey/onNavigate props 로 라우터와 연결됩니다.
 *   (docs/08-presentational-only.md)
 */

// 테마(다크/라이트) 선택을 저장하는 localStorage 키
const THEME_STORAGE_KEY = "au-theme";

// 표시용 정적 예시 데이터 (프리뷰 전용)
const EXAMPLE_USERS: UserRow[] = [
  { id: 1, name: "김하늘", email: "haneul.kim@corp.local", role: "관리자", status: "활성", lastLogin: "2026-06-30 14:22" },
  { id: 2, name: "이도윤", email: "doyoon.lee@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-30 09:11" },
  { id: 3, name: "박서준", email: "seojun.park@corp.local", role: "뷰어", status: "정지", lastLogin: "2026-05-18 17:40" },
  { id: 4, name: "최유나", email: "yuna.choi@corp.local", role: "운영자", status: "활성", lastLogin: "2026-06-29 21:03" },
];

/** 로그인 화면 (경로: /login). */
function LoginScreen({
  onLogin,
  loading,
  error,
}: {
  onLogin: (payload: { id: string; password: string; remember: boolean }) => void;
  loading?: boolean;
  error?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <LoginForm
          brand="사내 관리자"
          subtitle="격리망 관리자 콘솔에 로그인하세요."
          onSubmit={onLogin}
          loading={loading}
          error={error}
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
  nav,
  titles,
  dark,
  onToggleTheme,
  onLogout,
}: {
  nav: NavItem[];
  titles: Record<string, string>;
  dark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AdminShell
      brand="사내 관리자"
      nav={nav}
      activeKey={location.pathname}
      onNavigate={(key) => navigate(key)}
      title={titles[location.pathname] ?? ""}
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
  // 인증 상태·토큰 저장/복원·로그인 API 호출은 AuthProvider(하네스)가 담당합니다.
  const { authed, login, logout, loggingIn, loginError } = useAuth();
  const toast = useToast();
  const { confirm } = useAlert();
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
    } catch {
      return false;
    }
  });

  // dark 상태를 문서 속성과 localStorage 에 동기화합니다.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // localStorage 사용 불가(프라이빗 모드 등) 시 무시합니다.
    }
  }, [dark]);

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
    setDark((prev) => !prev);
  }

  async function handleLogin(payload: { id: string; password: string; remember: boolean }) {
    // 로그인 API 호출·토큰 저장은 AuthProvider(→ src/api/auth.*)가 담당합니다.
    // 여기서는 성공 시 라우팅/토스트, 실패 시 토스트만 처리합니다(에러 메시지는 loginError 로 폼에 표시).
    try {
      await login({ id: payload.id, password: payload.password }, payload.remember);
      navigate("/", { replace: true });
      toast.success("로그인되었습니다.");
    } catch {
      toast.error("로그인에 실패했습니다.");
    }
  }

  async function handleLogout() {
    const ok = await confirm("로그아웃하시겠습니까?", {
      title: "로그아웃",
      confirmText: "로그아웃",
    });
    if (!ok) return;
    logout();
    navigate("/login", { replace: true });
    toast.info("로그아웃되었습니다.");
  }

  const dashboard = (
    <DashboardPage
      users={filtered}
      stats={stats}
      query={query}
      onQueryChange={setQuery}
      onCreateUser={(payload) => {
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
        ]);
        toast.success("사용자를 추가했습니다.");
      }}
      onDeleteUser={async (id) => {
        const target = users.find((u) => u.id === id);
        const ok = await confirm(
          `'${target?.name ?? "이 사용자"}' 계정을 삭제하시겠습니까? 되돌릴 수 없습니다.`,
          { title: "사용자 삭제", tone: "danger", confirmText: "삭제" },
        );
        if (!ok) return;
        setUsers((prev) => prev.filter((u) => u.id !== id));
        toast.success("사용자를 삭제했습니다.");
      }}
    />
  );

  // 라우트 단일 원천(src/routes.tsx)에서 내비게이션·타이틀·<Route> 목록을 파생.
  const routes = createAppRoutes({ dashboard });
  const nav = toNavItems(routes);
  const titles = toTitleMap(routes);

  return (
    <Routes>
      {/* 로그인 (인증 상태면 대시보드로) */}
      <Route
        path="/login"
        element={
          authed ? (
            <Navigate to="/" replace />
          ) : (
            <LoginScreen
              onLogin={handleLogin}
              loading={loggingIn}
              error={loginError?.message}
            />
          )
        }
      />

      {/* 보호 경로 (미인증이면 로그인으로) */}
      <Route
        element={
          authed ? (
            <ProtectedLayout
              nav={nav}
              titles={titles}
              dark={dark}
              onToggleTheme={toggleTheme}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>

      {/* 그 외 경로 */}
      <Route path="*" element={<Navigate to={authed ? "/" : "/login"} replace />} />
    </Routes>
  );
}
