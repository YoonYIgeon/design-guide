import { isValidElement, useEffect, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { IconChevronDown, IconShield } from "../icons";

export interface NavItem {
  key: string;
  label: string;
  icon?: ReactNode;
  /**
   * 하위 메뉴. 있으면 접기/펼치기 가능한 그룹으로 그려집니다.
   * (그룹 헤더는 이동하지 않고 펼침/접힘만 토글합니다. 이동은 자식 항목에서.)
   */
  children?: NavItem[];
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
  /**
   * 초기에 펼쳐 둘 그룹 key 목록. 지정하지 않아도 활성 항목이 속한 그룹은 자동으로 펼칩니다.
   */
  defaultOpenKeys?: string[];
  /** 상단바에 표시할 현재 페이지 제목. */
  title: ReactNode;
  /**
   * 상단바 우측 사용자 영역.
   * - 구조화 객체(`AdminShellUser`)를 주면 기본 레이아웃으로 그립니다.
   * - 완전 커스텀이 필요하면 노드를 직접 넘기면 그대로 렌더합니다.
   */
  user?: AdminShellUser | ReactNode;
  actions?: ReactNode;
  /**
   * 사이드바 하단 영역(버전·환경 표기 등). 문자열 또는 임의의 노드.
   * 값·버전 문자열은 하네스(소비 시스템)의 책임이므로 여기서 props 로 받습니다.
   * 생략하면 기본 표기를 그대로 쓰고, `null` 을 주면 영역 자체를 숨깁니다.
   */
  sidebarFooter?: ReactNode;
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

/** 어떤 항목(또는 그 하위)이 활성 key 를 포함하는지. */
function containsKey(item: NavItem, key: string): boolean {
  if (item.key === key) return true;
  return item.children?.some((child) => containsKey(child, key)) ?? false;
}

/** 활성 key 로 가는 경로상의 "조상 그룹 key" 목록(활성 항목 자신은 제외). 없으면 null. */
function ancestorKeysOf(
  items: NavItem[],
  key: string,
  trail: string[] = [],
): string[] | null {
  for (const item of items) {
    if (item.key === key) return trail;
    if (item.children?.length) {
      const found = ancestorKeysOf(item.children, key, [...trail, item.key]);
      if (found) return found;
    }
  }
  return null;
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

const ROW_BASE =
  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors";
const ROW_ACTIVE = "bg-primary/10 font-medium text-primary";
const ROW_IDLE = "text-text-muted hover:bg-surface-muted hover:text-text";

/**
 * 사이드바 내비게이션 트리.
 * - 하위 메뉴(children)가 있는 항목은 접기/펼치기 가능한 그룹으로 그립니다.
 * - 펼침/접힘은 순수 UI 상태로 이 컴포넌트가 보유합니다(활성 항목의 조상 그룹은 자동 펼침).
 *   이동 자체는 항상 onNavigate(key) 콜백으로 위임합니다(프레젠테이션 전용).
 */
function SideNav({
  nav,
  activeKey,
  onNavigate,
  defaultOpenKeys,
}: {
  nav: NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  defaultOpenKeys?: string[];
}) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    const initial = new Set(defaultOpenKeys ?? []);
    ancestorKeysOf(nav, activeKey)?.forEach((k) => initial.add(k));
    return initial;
  });

  // 활성 항목이 바뀌면 그 항목이 속한 그룹을 펼쳐 항상 보이게 합니다(수동 토글은 유지).
  useEffect(() => {
    const ancestors = ancestorKeysOf(nav, activeKey);
    if (!ancestors?.length) return;
    setOpenKeys((prev) => {
      const next = new Set(prev);
      let changed = false;
      ancestors.forEach((k) => {
        if (!next.has(k)) {
          next.add(k);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // activeKey 변화에만 반응(nav 는 매 렌더 새 배열이라 의도적으로 제외).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderItems(items: NavItem[]): ReactNode {
    return items.map((item) => {
      const hasChildren = !!item.children?.length;

      if (!hasChildren) {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
            aria-current={active ? "page" : undefined}
            className={cn(ROW_BASE, active ? ROW_ACTIVE : ROW_IDLE)}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </button>
        );
      }

      const open = openKeys.has(item.key);
      const branchActive = containsKey(item, activeKey);
      return (
        <div key={item.key}>
          <button
            type="button"
            onClick={() => toggle(item.key)}
            aria-expanded={open}
            className={cn(
              ROW_BASE,
              "font-medium",
              // 접힌 상태에서 하위에 활성 항목이 있으면 표시로 강조.
              branchActive && !open ? "text-primary" : ROW_IDLE,
            )}
          >
            {item.icon}
            <span className="flex-1 truncate text-left">{item.label}</span>
            <IconChevronDown
              width={16}
              height={16}
              aria-hidden
              className={cn(
                "shrink-0 text-text-muted transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
          {open && (
            <div className="ml-4 mt-1 space-y-1 border-l border-line pl-2">
              {renderItems(item.children!)}
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="주요 메뉴">
      {renderItems(nav)}
    </nav>
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
  defaultOpenKeys,
  title,
  user,
  actions,
  sidebarFooter = "격리망 전용 · v0.1.0",
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
        <SideNav
          nav={nav}
          activeKey={activeKey}
          onNavigate={onNavigate}
          defaultOpenKeys={defaultOpenKeys}
        />
        {sidebarFooter != null && (
          <div className="border-t border-line p-3 text-xs text-text-muted">
            {sidebarFooter}
          </div>
        )}
      </aside>

      {/* 본문 영역 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 상단바 */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4">
          <h1 className="truncate text-base font-semibold">{title}</h1>
          <div className="flex items-center gap-3">
            {actions}
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
