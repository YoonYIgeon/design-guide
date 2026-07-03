# Changelog

이 프로젝트의 모든 주목할 변경 사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/) 를, 버전은 [SemVer](https://semver.org/lang/ko/) 를 따릅니다.

## [Unreleased]
### Added
- `DataTable` **페이지네이션(controlled)** 지원 — `pagination` prop 추가.
  - `DataTablePagination`: `page`/`pageSize`/`total`/`onPageChange` (+ 선택 `pageSizeOptions`·`onPageSizeChange`).
  - 행을 직접 자르지 않음(프레젠테이션 전용): `rows` 에는 항상 현재 페이지 행만 전달하고, 이동/크기 변경은 콜백으로만 냄. 하단에 "총 N건 · 범위", 페이지당 셀렉트(선택), 이전/다음, `X / Y` 표시.
  - `DataTablePagination` 타입 export.

## [0.3.0] - 2026-07-03
### Added
- `AdminShell` 사이드바 내비게이션 **중첩 메뉴(children) + 접기/펼치기** 지원.
  - `NavItem` 에 `children?: NavItem[]` 추가 — 하위 메뉴가 있으면 접기/펼치기 가능한 그룹으로 렌더.
  - 그룹 헤더는 이동하지 않고 펼침/접힘만 토글(이동은 자식 항목의 `onNavigate`). 펼침 상태는 순수 UI 상태로 보유하며, 활성 항목이 속한 그룹은 자동으로 펼침.
  - `AdminShellProps.defaultOpenKeys?: string[]` 추가 — 초기에 펼쳐 둘 그룹 지정.

## [0.2.0] - 2026-07-02
### Added
- `PromptDialog` 추가 — Modal + Input 위에 확인/취소를 얹은 프레젠테이션 전용 입력 다이얼로그.
  입력값은 순수 UI 상태로만 보유하고 `onSubmit(value)` 로 전달하며, 표시 자리(title/description/label/hint/error)는 `ReactNode` 로 받음.
- **유연한 합성 가이드** `docs/11-flexible-composition.md` 추가 — 표시용 자리는 `string` 대신 `ReactNode` 로 받고,
  기본 렌더가 있는 자리는 대체 슬롯을 연다는 방침. README·CLAUDE.md 설계 원칙에 반영.
- `AdminShell` 헤더 유연화: `brand` 를 `ReactNode` 로, 로고 자리 `logo` 슬롯 추가,
  `user` 를 구조화 객체(`AdminShellUser`) 또는 커스텀 노드로 받도록 확장(`avatar` 로 이니셜 아바타 대체).
- `LoginForm` `brand`·`subtitle` 을 `ReactNode` 로, 로고 자리 `logo` 슬롯 추가.
- 프로젝트 초기 가이드 문서 세트 추가 (개요/아키텍처/시작하기/UI 가이드/Git 워크플로우/버저닝/기여).
- React + TypeScript + Tailwind 기반 관리자 UI 라이브러리 및 데모 앱 추가.
  - 컴포넌트: `AdminShell`, `DataTable`, `Button`, `Input`, `Modal`, `Card`, `StatCard`, `Badge`, `EmptyState`, 인라인 `Icons`.
  - 디자인 토큰(`--au-*`) 기반 테마, 라이트/다크 지원.
  - 데모 대시보드(지표 카드 + 사용자 관리 테이블 + 추가 모달).
- 로그인 페이지 추가: 아이디/비밀번호 입력, 검증·에러 표시, 로딩 상태.
  인증 상태에 따라 로그인 ↔ 관리자 콘솔 전환 및 로그아웃 버튼 연결.
### Changed
- **프레젠테이션 전용 원칙 확립**: 라이브러리 컴포넌트는 데이터와 분리하고 그리기만 담당.
  - axios + react-query 데이터 계층(`src/api`)·목 백엔드·`.env.example` 제거.
  - `LoginForm`을 프레젠테이션 전용 컴포넌트로 추가(값은 props, 제출은 `onSubmit`).
  - `DashboardPage`를 props/callback 기반 뷰로 리팩터링(데이터·패칭 없음).
  - `src/App.tsx`는 정적 예시 데이터만 주입하는 프리뷰 하네스로 정리.
  - 원칙 문서 `docs/08-presentational-only.md` 추가, README·UI 가이드·기여 가이드에 반영.
- primary 색상을 브랜드 값 `rgb(0, 72, 77)`로 변경(다크 테마는 대비를 위한 밝은 틴트).
- 라우팅 추가(react-router-dom): 로그인 `/login`, 대시보드 `/`, `/users`·`/audit`·`/settings`.
  - 미인증 시 보호 경로 접근/딥링크를 `/login` 으로 리다이렉트, 로그인/로그아웃 시 경로 전환.
  - 라우팅은 프리뷰 하네스(`src/App.tsx`)에만 두고, `AdminShell` 은 `activeKey`/`onNavigate`
    props 로만 라우터와 연결(프레젠테이션 전용 원칙 유지).
- 로그인 자동 로그인 + 쿠키 세션 추가.
  - `LoginForm` 에 "자동 로그인" 체크박스 추가(값은 `onSubmit` 의 `remember` 로 전달, 로직 없음).
  - 하네스 `src/auth.ts`: `token`/`refreshToken` 쿠키 저장·복원. 앱 로드 시 쿠키가 있으면 자동 로그인,
    로그아웃 시 쿠키 제거. `remember` 로 지속(30일)/세션 쿠키 결정.
- 패키지 매니저를 **yarn 전용**으로 전환: `packageManager` 지정, `package-lock.json` 제거·gitignore,
  문서 명령을 yarn 으로 변경, 규칙을 `CLAUDE.md` 에 명문화.
- **UI 상태 프로바이더를 라이브러리로 승격**: `ToastProvider`(`useToast`)·`AlertProvider`(`useAlert`)를
  하네스(`src/providers`)에서 라이브러리(`src/lib/providers`)로 이동해 패키지에서 바로 사용 가능.
  토스트 큐·다이얼로그 열림 상태는 순수 UI 상태로 보고 프레젠테이션 전용 원칙의
  명시적 예외로 docs/08 에 명문화(HTTP·영속화·라우팅 금지는 유지). 하네스에는 `AuthProvider` 만 남음.
- **패키지 소비 체계 구축(포크 대신 의존성 설치)**: 소비 시스템이 내부 Git 태그로
  `yarn add` 해 사용하는 흐름을 실제로 동작하게 정비.
  - vite 라이브러리 빌드 추가: `yarn build` 가 `src/lib/index.ts` → `dist/index.{mjs,cjs}` 번들
    (+ `tsconfig.build.json` 으로 타입 선언 생성). 데모 앱 빌드는 `yarn build:demo`(dist-demo)로 분리.
  - `prepare` 스크립트 추가 — git 의존성 설치 시점에 dist 자동 빌드(dist 는 gitignore, 커밋 안 함).
  - Tailwind 테마(토큰 매핑)를 `tailwind.preset.js` 로 분리하고
    `@company/admin-ui/tailwind-preset` 으로 export. `./styles`(=`./tokens`)는 `src/lib/tokens.css` 를 가리킴.
  - 패키지 경계 정리: `files` 를 `dist`/`src/lib`/`tailwind.preset.js` 로 축소(하네스는 미포함),
    하네스 전용 의존성(axios·react-query·react-router-dom)을 devDependencies 로 이동
    (라이브러리 runtime 의존성은 react-markdown 만 유지).
  - 문서 갱신: 시작하기(03)를 "패키지 설치 + 하네스 템플릿 최초 1회 복사" 흐름으로 재작성,
    아키텍처(02)·릴리스(06)·기여(07)의 dist 정책을 "커밋 안 함 + 설치 시 빌드"로 확정.
- **API 관리를 한 파일로 단순화**: 리소스별 `*.api.ts`/`*.queries.ts` 4개 파일을
  `src/api/index.ts`(타입 + 엔드포인트 함수 + 쿼리 키) 하나로 통합, 데모 스캐폴드는
  `src/api/demo.ts` 로 분리. 커스텀 훅 계층을 제거하고 컨테이너(pages/providers)가
  `useQuery`/`useMutation` 을 직접 호출하도록 변경(쿼리 키는 `*Keys` 헬퍼로만 생성).
  `docs/09-data-fetching.md` 를 새 컨벤션으로 갱신.
