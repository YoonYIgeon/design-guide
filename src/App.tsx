import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminShell, Button, type NavItem } from "./lib";
import {
  IconDashboard,
  IconSettings,
  IconShield,
  IconUsers,
} from "./lib/icons";
import { DashboardPage } from "./pages/DashboardPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { LoginPage } from "./pages/LoginPage";
import { useMe } from "./api/hooks";
import { getToken, setToken } from "./api/client";
import type { SessionUser } from "./api/auth";

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

export default function App() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [active, setActive] = useState("dashboard");
  const [dark, setDark] = useState(false);

  // 저장된 토큰이 있으면 세션 복원
  const me = useMe();
  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setActive("dashboard");
    queryClient.clear();
  }

  // 토큰 검증(세션 복원) 중에는 깜빡임 방지용 스플래시
  if (!user && getToken() && me.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text-muted">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  // 미인증 상태: 로그인 화면만 노출
  if (!user) {
    return <LoginPage brand="사내 관리자" onSuccess={setUser} />;
  }

  return (
    <AdminShell
      brand="사내 관리자"
      nav={NAV}
      activeKey={active}
      onNavigate={setActive}
      title={TITLES[active]}
      user={user}
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {dark ? "라이트" : "다크"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </>
      }
    >
      {active === "dashboard" ? (
        <DashboardPage />
      ) : (
        <PlaceholderPage label={TITLES[active]} />
      )}
    </AdminShell>
  );
}
