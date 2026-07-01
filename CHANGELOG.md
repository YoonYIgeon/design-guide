# Changelog

이 프로젝트의 모든 주목할 변경 사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/) 를, 버전은 [SemVer](https://semver.org/lang/ko/) 를 따릅니다.

## [Unreleased]
### Added
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
