# Changelog

이 프로젝트의 모든 주목할 변경 사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/) 를, 버전은 [SemVer](https://semver.org/lang/ko/) 를 따릅니다.

## [Unreleased]
### Fixed
- `RadioGroup` 이 `readOnly` 일 때 `(필수)` 표시가 사라지던 문제 수정 — 읽기 전용 표시에도 `required` 를 전달해 항상 노출.
- `RadioGroup` 옵션 영역의 높이가 다른 입력(`h-10`)보다 낮던 문제 수정 — 최소 높이(`2.5rem`) 확보 후 세로 가운데 정렬로 맞춤.

### Added
- `Dropdown` 에 `onOpenChange?: (open: boolean) => void` prop 추가 — 패널이 열리거나
  닫힐 때(열림=`true`, 닫힘=`false`) 호출된다. 열림 상태는 컴포넌트가 내부에서 관리하는
  비제어 방식 그대로이며, 이 콜백은 상태 변화만 알려 준다(추적·포커스 이동 등 부수효과는 컨테이너 책임).
  최초 마운트에는 발화하지 않으며 실제 상태 전환일 때만 호출한다.
- `DataTable` 에 `fillHeight` prop 추가 — `true` 면 상위 컨테이너 높이를 꽉 채우고,
  헤더(`sticky`)와 푸터(페이지네이션)를 고정한 채 본문(`tbody`)만 세로 스크롤한다.
  기본 `false`(내용 높이만큼 차지)로 기존 동작과 하위 호환. 부모가 높이를 제한해야 동작한다.
- `AdminShell` 에 `sidebarFooter` prop 추가 — 사이드바 하단 표기(버전·환경 등)를 상위(하네스)에서 넘길 수 있게 함.
  `ReactNode` 를 받아 문자열도 그대로 동작하며, 생략 시 기존 기본 표기를 쓰고 `null` 을 주면 영역을 숨긴다.
  하네스(`src/App.tsx`)가 `"격리망 전용 · v0.1.0"` 을 직접 넘기도록 연결.
- 데모 하네스에서 `DataTable` 페이지네이션을 실제로 연결 — 페이지 크기 선택(20/50/100)을
  `pageSizeOptions`/`onPageSizeChange` 로 노출. 페이지·페이지 크기 상태와 행 슬라이싱은 컨테이너가 소유.
- `Dropdown` 추가 — 트리거 클릭 시 카드형 패널이 뜨는 프레젠테이션 전용 컴포넌트.
  `Select`와 같은 flip 로직(패널 실측 높이 기준으로 아래 공간이 부족하면 위로 뒤집기)을 쓰고,
  `Tooltip`처럼 portal(`document.body`) + fixed 좌표로 그려 조상 `overflow`에 잘리지 않음.
  트리거는 `children`(단일 요소)으로 자유롭게 구성하며, 두 모드를 지원:
  단순 액션 목록은 `items`/`onSelect`(role="menu"), 필터 폼처럼 임의 구성이 필요하면
  `content`(함수로 주면 `{ close }` 를 받아 "적용" 버튼 등에서 직접 닫을 수 있음) —
  이 경우 패널 내부 클릭으로는 자동으로 닫히지 않는다. `Icons.IconMoreVertical` 아이콘 추가.

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
