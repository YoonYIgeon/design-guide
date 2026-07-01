import { useState } from "react";
import { AdminShell, Button, type NavItem } from "./lib";
import {
  IconDashboard,
  IconSettings,
  IconShield,
  IconUsers,
} from "./lib/icons";
import { DashboardPage } from "./pages/DashboardPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

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
  const [active, setActive] = useState("dashboard");
  const [dark, setDark] = useState(false);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
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
        <Button variant="secondary" size="sm" onClick={toggleTheme}>
          {dark ? "라이트" : "다크"}
        </Button>
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
