# 09. 데이터 패칭 (axios · react-query · react-markdown)

> **라이브러리는 여전히 네트워크를 모른다.** 데이터 계층은 하네스/소비 시스템의 몫이다.
> 이 문서는 그 계층을 어떻게 구성하는지, 그리고 이 저장소에 포함된 **동작 예시**를 설명한다.

[08. 프레젠테이션 전용 원칙](08-presentational-only.md)에 따라 `src/lib/**` 은 그리기만 한다.
API 호출·인증 첨부·에러 정규화는 아래 **데이터 계층**에서 관리하고,
컨테이너(pages/providers)가 `useQuery`/`useMutation` 으로 직접 패칭해 결과만 컴포넌트에 props 로 넘긴다.

## 설치된 의존성

| 패키지 | 용도 | 위치 |
| --- | --- | --- |
| `axios` | HTTP 클라이언트(인터셉터로 토큰 첨부·에러 정규화) | 하네스 데이터 계층 |
| `@tanstack/react-query` | 서버 상태 캐싱·무효화·로딩/에러 상태 | 컨테이너(pages/providers) |
| `react-markdown` | 마크다운 → React 렌더링 | `src/lib`(프레젠테이션) |

> 이 셋은 `dependencies` 로 고정되어, 다른 레포지토리에서 **포크만 하면 그대로 동작**한다.
> (격리망 원칙상 런타임에 외부 CDN/네트워크를 호출하지 않는다.)

## 파일 구성 — API 목록은 한 파일

의존(파일 간 결합)을 최소화하기 위해 리소스별 파일 분리나 커스텀 훅 계층을 두지 않는다.

```
src/
├─ api/                         # 데이터 계층 (하네스 책임 — 라이브러리 아님)
│  ├─ index.ts                  # ★ API 목록 한 파일: 타입 + 엔드포인트 함수 + 쿼리 키
│  ├─ client.ts                 # axios 인스턴스 + 인터셉터(토큰/에러)
│  ├─ queryClient.ts            # react-query QueryClient 팩토리
│  └─ demo.ts                   # 데모 모드 스캐폴드(인메모리 데이터) — 실연동 시 삭제 가능
├─ pages/
│  └─ PostsPage.tsx             # 컨테이너 페이지 예시(useQuery 직접 호출 + lib 로 그리기)
└─ lib/components/
   └─ Markdown.tsx              # 프레젠테이션 전용 마크다운 렌더러
```

- **`src/api/index.ts` 가 단일 관리 지점**이다. 어떤 엔드포인트가 있는지, 요청/응답 타입이
  무엇인지, 캐시 키가 무엇인지 모두 이 파일 하나만 보면 된다.
- 커스텀 훅(`use~~`) 계층은 두지 않는다. 컴포넌트가 `useQuery` 를 직접 호출한다.
  react-query 는 **쿼리 키로 캐시를 공유**하므로 여러 컴포넌트가 같은 쿼리를 각자 호출해도
  요청이 중복되지 않는다.

## 흐름

```
QueryClientProvider (src/main.tsx)
        │
PostsPage (컨테이너, src/pages)
        │   useQuery({ queryKey: postKeys.list(), queryFn: fetchPosts })
        │   useMutation({ mutationFn: createPost, onSuccess: invalidate(postKeys.list()) })
        │                                   │
        │                            src/api/index.ts (API 목록: fetchPosts · postKeys …)
        │                                   │
        │                            src/api/client.ts (axios + 토큰 첨부)
        │
        └─ 값은 props 로 → <Card> <Badge> <Markdown> … (src/lib, 그리기만)
```

- **인증 첨부**: `client.ts` 의 요청 인터셉터가 `src/auth.ts` 의 토큰을 읽어 `Authorization` 헤더로 붙인다.
- **에러 정규화**: 응답 인터셉터가 axios 에러를 `ApiError { status, message }` 로 바꿔 UI 가 그대로 표시할 수 있게 한다.
- **쿼리 키**: `src/api/index.ts` 의 `postKeys` 처럼 **API 목록 파일에서만 정의**한다.

### ⚠️ 쿼리 키 규칙 (중요)

컴포넌트에서 `["posts"]` 같은 **인라인 문자열 키를 쓰지 않는다.** 한 곳은 `["posts"]`,
다른 곳은 `["posts", "list"]` 처럼 어긋나는 순간 뮤테이션 후 무효화가 **에러 없이 조용히
실패**한다(화면만 안 갱신됨). 키는 항상 `src/api/index.ts` 의 `*Keys` 헬퍼로만 만든다.

## 데모 모드 (격리망에서 그대로 실행)

`VITE_API_BASE_URL` 이 **없으면** `src/api/demo.ts` 의 인메모리 예시 데이터로 동작한다(프리뷰/데모).
환경변수를 주입하면 동일한 코드가 실제 `axios` 경로(사내 게이트웨이)로 전환된다.

```bash
# 실제 API 연동 시(소비 시스템)
VITE_API_BASE_URL=https://admin-gateway.corp.local/api yarn dev
```

> 동작 분기(`import.meta.env`)는 **데이터 계층**에만 둔다. 라이브러리 컴포넌트에는 절대 넣지 않는다.
> 데모가 필요 없는 소비 시스템은 `demo.ts` 와 `index.ts` 의 `DEMO_MODE` 분기를 삭제하면 된다.

## 인증(로그인)도 같은 데이터 계층으로 (예시)

로그인 역시 "서버 상태를 바꾸는 요청"이므로 게시글과 **동일한 패턴**으로 관리한다.

```
AuthProvider (하네스, src/providers)
        │   useMutation({ mutationFn: login })
        │                                   │
        │                            src/api/index.ts (login → 응답을 토큰으로 매핑)
        │                                   │
        │                            src/api/client.ts (axios)
        │
        └─ 성공 시 saveTokens()로 쿠키 저장 + 인증 상태 전환 (src/auth.ts)
```

- `AuthProvider` 는 `QueryClientProvider` 하위에 있으므로 `useMutation` 을 그대로 쓴다(로그인 진행/에러 상태 제공).
- `App` 은 `LoginForm` 에 `loading`(`loggingIn`)·`error`(`loginError.message`)만 props 로 넘긴다(그리기만).

**소비 시스템 연결 지점은 `src/api/index.ts` 의 인증 섹션 세 곳뿐이다.**

| # | 대상 | 바꾸는 것 |
| --- | --- | --- |
| ① | `AUTH_LOGIN_PATH` | 로그인 엔드포인트 경로(URL). baseURL 은 `VITE_API_BASE_URL` |
| ② | `LoginResponse` | 서버 로그인 응답 JSON 구조(필드명/중첩) |
| ③ | `toTokens()` | 응답 → 앱 내부 `Tokens` 매핑 |

> 데모 모드(`VITE_API_BASE_URL` 미설정)에서는 실제 호출 없이 발급을 흉내낸 토큰을 돌려준다.
> 환경변수를 주입하면 동일 코드가 `AUTH_LOGIN_PATH` 로 실제 POST 한다.

## 새 리소스 추가하기 (소비 시스템)

1. `src/api/index.ts` 에 섹션을 추가한다: 타입 + 엔드포인트 함수 + 쿼리 키(`orderKeys` …).
2. 컨테이너 페이지에서 `useQuery({ queryKey: orderKeys.list(), queryFn: fetchOrders })` 를 직접 호출한다.
3. 결과를 `src/lib` 컴포넌트에 props 로 넘겨 그린다.

## 리뷰 기준

- [ ] `src/lib/**` 에는 `axios`/`react-query`/`import.meta.env` 가 없다(그리기만).
- [ ] HTTP 호출·인증 첨부·에러 정규화는 `src/api/**` 에만 있다. 컴포넌트에서 `axios` 를 직접 부르지 않는다(항상 `src/api` 의 함수 사용).
- [ ] 쿼리 키는 `src/api/index.ts` 의 `*Keys` 로만 만든다(인라인 문자열 키 금지).
- [ ] `useQuery`/`useMutation` 은 컨테이너(`src/pages/**`, `src/providers/**`)에서만 호출한다.
- [ ] 컨테이너는 값을 props 로 넘기고, 컴포넌트는 로딩/빈/에러를 props 로 받아 그린다.
- [ ] 런타임에 외부 CDN/네트워크를 호출하지 않는다(격리망).
