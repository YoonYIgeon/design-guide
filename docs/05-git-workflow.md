# 05. Git 워크플로우 (수시 업데이트 & 배포)

이 라이브러리는 **Git을 배포·버전 관리의 진실의 원천**으로 삼습니다.
잦은 업데이트를 안전하게 반영하기 위한 브랜치 전략과 절차입니다.

## 브랜치 전략

권장: **트렁크 기반 + 짧은 기능 브랜치**.

| 브랜치 | 역할 |
| --- | --- |
| `main` | 항상 배포 가능한 안정 상태. 태그의 기준. 직접 push 금지, PR로만 병합. |
| `feature/*`, `fix/*` | 단위 작업 브랜치. 짧게 유지하고 PR로 병합. |
| `release/*` (선택) | 여러 변경을 묶어 릴리스를 준비할 때만 사용. |

- 소비 시스템은 **브랜치가 아니라 태그**를 참조합니다(재현성).
- `main`은 초록 상태(빌드·린트·테스트 통과)를 유지합니다.

## 일상 개발 흐름

```bash
# 1. 최신 main 에서 분기
git fetch origin main
git switch -c feature/data-table-sort origin/main

# 2. 작업 + 커밋 (커밋 컨벤션은 07 문서 참고)
git add -A
git commit -m "feat(data-table): 컬럼 정렬 지원"

# 3. 푸시 후 PR 생성
git push -u origin feature/data-table-sort
```

- PR에는 **변경 요약 / 스크린샷(해당 시) / 파괴적 변경 여부 / 마이그레이션 노트**를 포함.
- 리뷰·CI 통과 후 `main`에 병합.

## 수시 업데이트를 안전하게 만드는 규칙

1. **작게, 자주**: 큰 변경을 쌓지 말고 작은 PR로 자주 병합.
2. **파괴적 변경 격리**: API 변경/삭제는 별도 PR로 분리하고 라벨(`breaking`)을 붙임.
3. **하위 호환 우선**: 가능한 한 deprecate → 다음 major에서 제거(즉시 삭제 금지).
4. **문서 동시 갱신**: 컴포넌트/토큰 변경 시 `docs/`와 CHANGELOG를 같은 PR에서 수정.
5. **불변 참조 배포**: 배포는 항상 태그로. `main` HEAD를 소비 시스템이 직접 물지 않게.

## 릴리스로 넘어가기

`main`에 병합된 변경을 배포 가능한 버전으로 만드는 절차는
[06-versioning-release.md](06-versioning-release.md)를 참고하세요. 요약:

```bash
git switch main && git pull origin main
# 버전 결정(SemVer) 후
git tag -a v1.5.0 -m "release: v1.5.0"
git push origin v1.5.0
```

## 핫픽스

운영 중 긴급 수정:

```bash
git switch -c fix/modal-focus origin/main
# 수정 + 커밋
git push -u origin fix/modal-focus   # PR → 리뷰 → main 병합
# 병합 후 패치 태그
git tag -a v1.5.1 -m "fix: 모달 포커스 트랩" && git push origin v1.5.1
```

소비 시스템은 태그만 `v1.5.1`로 올리면 됩니다.

## 커밋 위생

- 하나의 커밋/PR은 **하나의 논리적 변경**.
- 생성 산출물(`dist/`)을 커밋하는 정책이면 **릴리스 커밋에서만** 갱신(리뷰 노이즈 최소화). 자세한 정책은 07 문서.
- 비밀정보·내부 호스트명·모델 식별자 등은 커밋하지 않음.
