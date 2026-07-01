# 09. 데이터 패칭 (axios · react-query · react-markdown)

> **라이브러리는 여전히 네트워크를 모른다.** 데이터 계층은 하네스/소비 시스템의 몫이다.
> 이 문서는 그 계층을 어떻게 구성하는지, 그리고 이 저장소에 포함된 **동작 예시**를 설명한다.

[08. 프레젠테이션 전용 원칙](08-presentational-only.md)에 따라 `src/lib/**` 은 그리기만 한다.
패칭·캐싱·인증 첨부·에러 정규화는 아래 **데이터 계층**에서 관리하고, 그린 결과만 컴포넌트에 props 로 넘긴다.

## 설치된 의존성

| 패키지 | 용도 | 위치 |
| --- | --- | --- |
| `axios` | HTTP 클라이언트(인터셉터로 토큰 첨부·에러 정규화) | 하네스 데이터 계층 |
| `@tanstack/react-query` | 서버 상태 캐싱·무효화·로딩/에러 상태 | 하네스 데이터 계층 |
| `react-markdown` | 마크다운 → React 렌더링 | `src/lib`(프레젠테이션) |

> 이 셋은 `dependencies` 로 고정되어, 다른 레포지토리에서 **포크만 하면 그대로 동작**한다.
> (격리망 원칙상 런타임에 외부 CDN/네트워크를 호출하지 않는다.)

## 파일 구성

```
src/
├─ api/                         # 데이터 계층 (하네스 책임 — 라이브러리 아님)
│  ├─ client.ts                 # axios 인스턴스 + 인터셉터(토큰/에러)
│  ├─ queryClient.ts            # react-query QueryClient 팩토리
│  ├─ posts.api.ts             # 예시 리소스: 타입 + 엔드포인트 함수
│  ├─ posts.queries.ts          # 예시 리소스: react-query 훅 + 쿼리 키
│  ├─ auth.api.ts              # 예시 리소스: 로그인 엔드포인트 + 응답→토큰 매핑
│  └─ auth.queries.ts           # 예시 리소스: 로그인 useMutation 훅
├─ pages/
│  └─ PostsPage.tsx             # 컨테이너 페이지 예시(훅 사용 + lib 로 그리기)
└─ lib/components/
   └─ Markdown.tsx              # 프레젠테이션 전용 마크다운 렌더러
```

한 파일은 한 가지 관심사만 담는다(컴포넌트 파일은 컴포넌트 하나).

## 흐름

```
QueryClientProvider (src/main.tsx)
        │
PostsPage (컨테이너, src/pages)  ── usePosts()/usePost()/useCreatePost()
        │                                   │
        │                            posts.queries.ts (react-query)
        │                                   │
        │                            posts.api.ts (fetchPosts …)
        │                                   │
        │                            client.ts (axios + 토큰 첨부)
        │
        └─ 값은 props 로 → <Card> <Badge> <Markdown> … (src/lib, 그리기만)
```

- **인증 첨부**: `client.ts` 의 요청 인터셉터가 `src/auth.ts` 의 토큰을 읽어 `Authorization` 헤더로 붙인다.
- **에러 정규화**: 응답 인터셉터가 axios 에러를 `ApiError { status, message }` 로 바꿔 UI 가 그대로 표시할 수 있게 한다.
- **쿼리 키**: `postKeys` 한 곳에서 관리해 생성 성공 시 목록 캐시를 정확히 무효화한다.

## 데모 모드 (격리망에서 그대로 실행)

`posts.api.ts` 는 `VITE_API_BASE_URL` 이 **없으면** 인메모리 예시 데이터로 동작한다(프리뷰/데모).
환경변수를 주입하면 동일한 코드가 실제 `axios` 경로(사내 게이트웨이)로 전환된다.

```bash
# 실제 API 연동 시(소비 시스템)
VITE_API_BASE_URL=https://admin-gateway.corp.local/api yarn dev
```

> 동작 분기(`import.meta.env`)는 **데이터 계층**에만 둔다. 라이브러리 컴포넌트에는 절대 넣지 않는다.

## 인증(로그인)도 같은 데이터 계층으로 (예시)

로그인 역시 "서버 상태를 바꾸는 요청"이므로 게시글과 **동일한 패턴**으로 관리한다.

```
AuthProvider (하네스, src/providers)  ── useLoginMutation()
        │                                   │
        │                            auth.queries.ts (react-query useMutation)
        │                                   │
        │                            auth.api.ts (login → 응답을 토큰으로 매핑)
        │                                   │
        │                            client.ts (axios)
        │
        └─ 성공 시 saveTokens()로 쿠키 저장 + 인증 상태 전환 (src/auth.ts)
```

- `AuthProvider` 는 `QueryClientProvider` 하위에 있으므로 react-query 훅을 그대로 쓴다(로그인 진행/에러 상태 제공).
- `App` 은 `LoginForm` 에 `loading`(`loggingIn`)·`error`(`loginError.message`)만 props 로 넘긴다(그리기만).

**소비 시스템 연결 지점은 `auth.api.ts` 의 세 곳뿐이다.**

| # | 대상 | 바꾸는 것 |
| --- | --- | --- |
| ① | `AUTH_LOGIN_PATH` | 로그인 엔드포인트 경로(URL). baseURL 은 `VITE_API_BASE_URL` |
| ② | `LoginResponse` | 서버 로그인 응답 JSON 구조(필드명/중첩) |
| ③ | `toTokens()` | 응답 → 앱 내부 `Tokens` 매핑 |

> 데모 모드(`VITE_API_BASE_URL` 미설정)에서는 실제 호출 없이 발급을 흉내낸 토큰을 돌려준다.
> 환경변수를 주입하면 동일 코드가 `AUTH_LOGIN_PATH` 로 실제 POST 한다.

## 새 리소스 추가하기 (소비 시스템)

1. `posts.api.ts` 를 복제해 `orders.api.ts` 로 만들고 타입/엔드포인트를 바꾼다.
2. `posts.queries.ts` 를 복제해 `orders.queries.ts` 로 만들고 쿼리 키/훅을 바꾼다.
3. 컨테이너 페이지에서 훅을 호출하고, 결과를 `src/lib` 컴포넌트에 props 로 넘겨 그린다.

## 리뷰 기준

- [ ] `src/lib/**` 에는 `axios`/`react-query`/`import.meta.env` 가 없다(그리기만).
- [ ] HTTP·캐싱·인증·에러 정규화는 `src/api/**` 에만 있다.
- [ ] 컨테이너는 값을 props 로 넘기고, 컴포넌트는 로딩/빈/에러를 props 로 받아 그린다.
- [ ] 런타임에 외부 CDN/네트워크를 호출하지 않는다(격리망).
