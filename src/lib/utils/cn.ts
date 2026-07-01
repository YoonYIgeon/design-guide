/**
 * 조건부 className 병합 헬퍼.
 * 외부 의존성을 줄이기 위해 clsx 대신 최소 구현을 사용합니다.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
