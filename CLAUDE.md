# CLAUDE.md

이 저장소에서 작업할 때 지켜야 할 규칙입니다.

## 패키지 매니저: yarn (필수)

**이 프로젝트는 무조건 yarn 을 사용합니다. npm 을 쓰지 마세요.** 설치·빌드·테스트·프리뷰 모두 yarn 으로 실행합니다.

| 목적 | 명령 |
| --- | --- |
| 의존성 설치 | `yarn install` |
| 패키지 추가 | `yarn add <pkg>` / `yarn add -D <pkg>` |
| 개발 서버 | `yarn dev` |
| 빌드(타입체크 포함) | `yarn build` |
| 타입체크 | `yarn typecheck` |
| 프리뷰 | `yarn preview` |

- 락파일은 **`yarn.lock`** 만 사용합니다. `package-lock.json` 을 만들거나 커밋하지 마세요.
- 테스트/검증(빌드, 프리뷰 기동 등)도 yarn 스크립트로 실행합니다.

## 설계 원칙 (요약)

- **프레젠테이션 전용**: `src/lib/**` 컴포넌트는 데이터 패칭/상태/비즈니스 로직 없이 그리기만 한다.
  값은 props, 상호작용은 callback. 자세한 계약은 `docs/08-presentational-only.md`.
- **데이터/라우팅/인증은 하네스(`src/App.tsx`, `src/pages/**`, `src/auth.ts`)의 책임**이며 라이브러리로 올리지 않는다.
- **디자인 토큰 단일 원천**: 색/간격 등은 `src/lib/tokens.css` 의 `--au-*` 변수만 사용(하드코딩 금지).
- **격리망 원칙**: 외부 CDN/네트워크 호출·비밀정보 금지.

문서 전반은 `README.md` 와 `docs/` 를 참고하세요.
