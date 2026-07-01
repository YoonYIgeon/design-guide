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
