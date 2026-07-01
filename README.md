# Admin UI Library (design-guide)

**철저히 분리된(격리된) 외부 사내 시스템**에서 사용하는 **관리자 페이지 전용 UI 라이브러리**입니다.
공개 패키지 레지스트리(npm 등)에 의존하지 않고 **Git을 통해 수시로 배포·업데이트**되는 것을 전제로 설계·운영합니다.

> 이 저장소는 라이브러리의 **소스와 가이드 문서**를 함께 관리합니다.
> 소비 시스템(관리자 페이지를 사용하는 사내 애플리케이션)은 이 저장소를 **Git 의존성 / 서브모듈 / 배포 아티팩트** 형태로 참조합니다.

---

## 이 라이브러리가 해결하는 문제

- **격리 환경 제약**: 대상 시스템은 외부 네트워크(공용 npm 레지스트리, CDN)에 접근할 수 없거나 접근을 제한합니다. 따라서 의존성 배포는 **내부 Git**을 1차 경로로 삼습니다.
- **잦은 업데이트**: 관리자 화면은 정책·운영 요구에 따라 자주 바뀝니다. 릴리스 절차가 무겁지 않으면서도 **버전 추적과 롤백**이 가능해야 합니다.
- **일관성**: 여러 관리자 화면·시스템이 동일한 UI 규칙(컴포넌트, 토큰, 레이아웃)을 공유해 유지보수 비용을 낮춥니다.

## 핵심 원칙

1. **Git이 진실의 원천(Single Source of Truth)** — 배포·버전·롤백 모두 Git 태그/커밋 기준.
2. **외부 의존 최소화** — 런타임/빌드 의존성은 격리 환경에서 재현 가능해야 함(벤더링 또는 내부 미러 우선).
3. **하위 호환 우선** — 소비 시스템이 여러 개일 수 있으므로 파괴적 변경은 SemVer와 마이그레이션 가이드로 관리.
4. **문서가 곧 계약** — 컴포넌트 API와 디자인 규칙은 `docs/`에 명시하고, 코드와 함께 리뷰.

---

## 문서 안내

| 문서 | 내용 |
| --- | --- |
| [docs/01-overview.md](docs/01-overview.md) | 프로젝트 목표, 범위, 용어 정의 |
| [docs/02-architecture.md](docs/02-architecture.md) | 격리 환경 아키텍처, Git 기반 배포 구조 |
| [docs/03-getting-started.md](docs/03-getting-started.md) | 소비 시스템에서 설치·연동하는 방법 |
| [docs/04-ui-guidelines.md](docs/04-ui-guidelines.md) | 디자인 토큰·컴포넌트·접근성 규칙 |
| [docs/05-git-workflow.md](docs/05-git-workflow.md) | 브랜치 전략, 수시 업데이트/배포 워크플로우 |
| [docs/06-versioning-release.md](docs/06-versioning-release.md) | SemVer, 태깅, 릴리스, 롤백 |
| [docs/07-contributing.md](docs/07-contributing.md) | 기여 규칙, 커밋 컨벤션, 리뷰 |

## 빠른 시작 (소비 시스템 관점)

```bash
# 내부 Git URL을 의존성으로 추가 (예: package.json)
#   "@company/admin-ui": "git+https://git.internal.company/design-guide.git#v1.4.0"
npm install
```

자세한 연동 방법은 [docs/03-getting-started.md](docs/03-getting-started.md)를 참고하세요.

> **참고**: 기술 스택(React/Vue, 번들러, 배포 형태 등)은 팀 결정에 맞춰 조정 가능한 **권장 기본값**으로 문서에 표기했습니다. 확정 사항이 있으면 해당 문서를 갱신하세요.
