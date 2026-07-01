# 06. 버저닝 & 릴리스 (Versioning & Release)

소비 시스템이 여러 개일 수 있으므로, **예측 가능한 버전 규칙과 롤백**이 핵심입니다.

## SemVer

`MAJOR.MINOR.PATCH` (예: `1.5.0`)

| 자리 | 올리는 경우 | 예 |
| --- | --- | --- |
| MAJOR | **파괴적 변경**: 컴포넌트 props 제거/이름 변경, 토큰 삭제, 동작 비호환 변경 | `1.x → 2.0.0` |
| MINOR | **하위 호환 기능 추가**: 새 컴포넌트/토큰/옵션 | `1.4 → 1.5.0` |
| PATCH | **하위 호환 버그 수정**: 시각/동작 결함 수정 | `1.5.0 → 1.5.1` |

- `0.y.z` 단계에서는 `y`를 파괴적 변경 자리로 취급(안정화 전).
- **파괴적 변경은 항상 마이그레이션 노트**를 CHANGELOG에 남깁니다.

## CHANGELOG

- 저장소 루트의 `CHANGELOG.md`에 릴리스별로 기록.
- 권장 포맷: [Keep a Changelog](https://keepachangelog.com) 스타일.

```md
## [1.5.0] - 2026-07-01
### Added
- DataTable 컬럼 정렬 지원
### Changed
- Button loading 시 아이콘 정렬 개선
### Deprecated
- `Modal.closable` → `Modal.dismissible` (다음 major에서 제거)
### Fixed
- Toast 중복 표시 문제
```

## 릴리스 절차

1. `main`이 초록 상태인지 확인(CI 통과).
2. 버전 결정(SemVer) 및 `package.json` `version` 갱신.
3. `CHANGELOG.md` 갱신(파괴적 변경·마이그레이션 포함).
4. (사전 빌드 배포 정책이면) `dist/` 빌드 산출물 갱신.
5. 릴리스 커밋 → 병합.
6. **주석 태그** 생성·푸시:

```bash
git tag -a v1.5.0 -m "release: v1.5.0"
git push origin v1.5.0
```

7. (폐쇄망 대비) `yarn pack` 산출물(tgz)을 릴리스 아티팩트로 보관.

## 태깅 규칙

- 태그는 `vMAJOR.MINOR.PATCH` 형식, **불변**(재사용/이동 금지).
- 릴리스는 반드시 태그에서 나옵니다. 소비 시스템은 태그만 참조.

## 롤백

문제가 생기면 **소비 시스템의 참조 태그를 이전 버전으로 되돌립니다.**

```jsonc
// 되돌리기: v1.5.0 → v1.4.0
"@company/admin-ui": "git+https://git.internal.company/design-guide.git#v1.4.0"
```

- 라이브러리 자체를 revert 하기보다, **소비 시스템이 안정 태그를 가리키게** 하는 것이 가장 빠르고 안전.
- 잘못된 릴리스는 CHANGELOG에 사유를 남기고 후속 패치로 정정.

## 지원 정책 (권장)

- **최신 MAJOR의 최신 MINOR**를 기본 지원.
- 이전 MAJOR는 보안·심각 버그에 한해 한시적 패치(팀 합의로 기간 명시).
- deprecate된 API는 최소 한 번의 MINOR 동안 유지 후 다음 MAJOR에서 제거.
