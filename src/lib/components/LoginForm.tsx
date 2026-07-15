import { useState, type FormEvent, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Button } from "./Button";
import { Input } from "./Input";
import { IconShield } from "../icons";

export interface LoginFormProps {
  /** 상단 제품명. 문자열 또는 임의의 노드(로고 등). */
  brand?: ReactNode;
  /** 제품명 아래 보조 문구. 문자열 또는 노드. */
  subtitle?: ReactNode;
  /** 상단 로고 자리. 기본 실드 아이콘을 대체합니다. */
  logo?: ReactNode;
  /** 제출 중 여부(스피너/중복 제출 차단). 소비 시스템이 제어. */
  loading?: boolean;
  /** 표시할 에러 메시지. 값 판단은 소비 시스템이 함. */
  error?: ReactNode;
  /**
   * 제출 이벤트. 실제 인증(HTTP 호출·쿠키 저장 등)은 소비 시스템이 담당합니다.
   * 이 컴포넌트는 입력을 그리고 값을 넘겨줄 뿐입니다.
   * (docs/08-presentational-only.md)
   */
  onSubmit: (credentials: { id: string; password: string }) => void;
  footer?: ReactNode;
  className?: string;
}

/**
 * 프레젠테이션 전용 로그인 폼.
 * - 보유 상태: 입력값(id/pw) 같은 순수 UI 상태뿐.
 * - 데이터/인증 로직 없음: onSubmit 으로 값만 전달.
 */
export function LoginForm({
  brand = "Admin Console",
  subtitle = "관리자 콘솔에 로그인하세요.",
  logo,
  loading = false,
  error,
  onSubmit,
  footer,
  className,
}: LoginFormProps) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ id: id.trim(), password: pw });
  }

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        {logo ?? (
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
            <IconShield width={26} height={26} />
          </span>
        )}
        <h1 className="text-lg font-semibold text-text">{brand}</h1>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 shadow-2"
        noValidate
      >
        <Input
          label="아이디"
          autoComplete="username"
          placeholder="사내 계정 아이디"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
        />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
        />

        {error && (
          <div
            role="alert"
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          로그인
        </Button>

        {footer}
      </form>
    </div>
  );
}
