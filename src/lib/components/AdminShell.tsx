import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { IconBell, IconShield } from "../icons";

export interface NavItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

export interface AdminShellProps {
  /** 사이드바 상단 제품명. */
  brand?: string;
  nav: NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  /** 상단바에 표시할 현재 페이지 제목. */
  title: ReactNode;
  /** 상단바 우측 사용자 영역. */
  user?: { name: string; role?: string };
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * 관리자 셸: 사이드바(내비) + 상단바(컨텍스트/사용자) + 콘텐츠 영역.
 * 모든 관리자 화면의 공통 레이아웃 뼈대입니다.
 */
export function AdminShell({
  brand = "Admin Console",
  nav,
  activeKey,
  onNavigate,
  title,
  user,
  actions,
  children,
}: AdminShellProps) {
  return (
    <div className="flex h-full min-h-screen bg-bg text-text">
      {/* 사이드바 */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <span className="text-primary">
            <IconShield width={22} height={22} />
          </span>
          <span className="text-sm font-semibold">{brand}</span>
        </div>
        <nav className="flex-1 space-y-1 p-2" aria-label="주요 메뉴">
          {nav.map((item) => {
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-text-muted hover:bg-surface-muted hover:text-text",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-line p-3 text-xs text-text-muted">
          격리망 전용 · v0.1.0
        </div>
      </aside>

      {/* 본문 영역 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 상단바 */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4">
          <h1 className="truncate text-base font-semibold">{title}</h1>
          <div className="flex items-center gap-3">
            {actions}
            <button
              className="rounded-md p-2 text-text-muted hover:bg-surface-muted hover:text-text"
              aria-label="알림"
            >
              <IconBell width={18} height={18} />
            </button>
            {user && (
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  aria-hidden
                >
                  {user.name.slice(0, 1)}
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium leading-tight">{user.name}</p>
                  {user.role && (
                    <p className="text-xs leading-tight text-text-muted">{user.role}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 콘텐츠 */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
