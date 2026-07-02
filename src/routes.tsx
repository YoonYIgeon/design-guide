import type { ReactNode } from "react";
import type { NavItem } from "./lib";
import {
  IconDashboard,
  IconFileText,
  IconInbox,
  IconSettings,
  IconShield,
  IconUsers,
} from "./lib/icons";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { PostsPage } from "./pages/PostsPage";
import { FormsPage } from "./pages/FormsPage";

/**
 * 앱 라우트 정의 — 라우팅의 단일 원천(single source of truth).
 *
 * 사이드바 내비게이션(NavItem), 상단 페이지 타이틀, <Route> 목록을 모두
 * 이 "객체 배열" 하나에서 파생합니다. 라우트를 추가/삭제/변경할 때는
 * createAppRoutes() 의 배열만 수정하면 됩니다.
 * (라우팅은 하네스의 책임 — docs/08-presentational-only.md)
 */
export interface AppRoute {
  /** 라우트 경로이자 내비게이션 키. */
  path: string;
  /** 사이드바 라벨 겸 상단 타이틀. */
  label: string;
  /** 사이드바 아이콘(내비게이션에 노출될 때 사용). */
  icon?: ReactNode;
  /** 사이드바 내비게이션 노출 여부(기본 true). false 면 라우트만 등록. */
  nav?: boolean;
  /** 렌더링할 요소. */
  element: ReactNode;
}

/**
 * 라우트 요소 중 App 상태에 의존하는 것을 주입받기 위한 슬롯.
 * (대시보드는 사용자 목록/통계/핸들러를 App 이 만들어 넘겨줍니다.)
 */
export interface RouteSlots {
  dashboard: ReactNode;
}

const ICON_SIZE = { width: 18, height: 18 } as const;

/** 보호 경로(로그인 후 진입) 정의 배열. */
export function createAppRoutes({ dashboard }: RouteSlots): AppRoute[] {
  return [
    { path: "/", label: "대시보드", icon: <IconDashboard {...ICON_SIZE} />, element: dashboard },
    {
      path: "/users",
      label: "사용자",
      icon: <IconUsers {...ICON_SIZE} />,
      element: <PlaceholderPage label="사용자" />,
    },
    {
      path: "/posts",
      label: "게시글",
      icon: <IconFileText {...ICON_SIZE} />,
      element: <PostsPage />,
    },
    {
      path: "/forms",
      label: "입력 폼",
      icon: <IconInbox {...ICON_SIZE} />,
      element: <FormsPage />,
    },
    {
      path: "/audit",
      label: "감사 로그",
      icon: <IconShield {...ICON_SIZE} />,
      element: <PlaceholderPage label="감사 로그" />,
    },
    {
      path: "/settings",
      label: "설정",
      icon: <IconSettings {...ICON_SIZE} />,
      element: <PlaceholderPage label="설정" />,
    },
  ];
}

/** 라우트 배열 → 사이드바 NavItem 배열(nav !== false 인 항목만). */
export function toNavItems(routes: AppRoute[]): NavItem[] {
  return routes
    .filter((r) => r.nav !== false)
    .map((r) => ({ key: r.path, label: r.label, icon: r.icon }));
}

/** 라우트 배열 → 경로별 타이틀 맵. */
export function toTitleMap(routes: AppRoute[]): Record<string, string> {
  return Object.fromEntries(routes.map((r) => [r.path, r.label]));
}
