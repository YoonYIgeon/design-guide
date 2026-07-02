/**
 * 하네스(컨테이너) 레벨 프로바이더 모음.
 * 인증처럼 데이터·영속화와 엮인 로직만 여기(하네스)에 남습니다.
 * 순수 UI 상태 프로바이더(Toast/Alert)는 라이브러리(src/lib)로 승격되었습니다.
 * (docs/08-presentational-only.md)
 */
export { AuthProvider, useAuth, type AuthApi } from "./AuthProvider";
