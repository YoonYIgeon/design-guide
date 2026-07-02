import { isValidElement, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { IconBell, IconShield } from "../icons";

export interface NavItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

/**
 * 상단바 우측 사용자 영역의 구조화 표현.
 * 이름/역할은 문자열뿐 아니라 임의의 노드(배지, 링크 등)를 받을 수 있고,
 * `avatar` 로 기본 이니셜 원형을 원하는 컴포넌트로 대체할 수 있습니다.
 */
export interface AdminShellUser {
  name: ReactNode;
  role?: ReactNode;
  /** 기본 이니셜 아바타 대신 렌더할 노드(이미지, 아이콘 등). */
  avatar?: ReactNode;
}

export interface AdminShellProps {
  /** 사이드바 상단 제품명. 문자열 또는 임의의 노드(로고 등). */
  brand?: ReactNode;
  /** 사이드바 상단 로고 자리. 기본 실드 아이콘을 대체합니다. */
  logo?: ReactNode;
  nav: NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  /** 상단바에 표시할 현재 페이지 제목. */
  title: ReactNode;
  /**
   * 상단바 우측 사용자 영역.
   * - 구조화 객체(`AdminShellUser`)를 주면 기본 레이아웃으로 그립니다.
   * - 완전 커스텀이 필요하면 노드를 직접 넘기면 그대로 렌더합니다.
   */
  user?: AdminShellUser | ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** `user` 가 구조화 객체인지, 커스텀 노드인지 판별. */
function isUserDescriptor(user: AdminShellUser | ReactNode): user is AdminShellUser {
  return (
    typeof user === "object" &&
    user !== null &&
    !isValidElement(user) &&
    "name" in user
  );
}

/** 이니셜 아바타(이름이 문자열일 때만). 그 외에는 중립 글리프. */
function initialOf(name: ReactNode): string {
  return typeof name === "string" && name.length > 0 ? name.slice(0, 1) : "·";
}

/** 구조화 객체를 받은 기본 사용자 영역 렌더. */
function UserBadge({ name, role, avatar }: AdminShellUser) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary"
        aria-hidden
      >
        {avatar ?? initialOf(name)}
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-tight">{name}</p>
        {role && <p className="text-xs leading-tight text-text-muted">{role}</p>}
      </div>
    </div>
  );
}

/**
 * 관리자 셸: 사이드바(내비) + 상단바(컨텍스트/사용자) + 콘텐츠 영역.
 * 모든 관리자 화면의 공통 레이아웃 뼈대입니다.
 */
export function AdminShell({
  brand = "Admin Console",
  logo,
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
            {logo ?? <IconShield width={22} height={22} />}
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
            {user != null &&
              (isUserDescriptor(user) ? <UserBadge {...user} /> : user)}
          </div>
        </header>

        {/* 콘텐츠 */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
