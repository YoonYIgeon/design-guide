import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Button } from "./Button";
import { Input } from "./Input";
import { IconShield } from "../icons";

/** 폼이 그릴 단계. 어떤 단계인지 판단(2차 인증 필요 여부)은 소비 시스템이 합니다. */
export type LoginFormStep = "credentials" | "otp";

export interface LoginFormProps {
  /** 상단 제품명. 문자열 또는 임의의 노드(로고 등). */
  brand?: ReactNode;
  /** 제품명 아래 보조 문구. 문자열 또는 노드. */
  subtitle?: ReactNode;
  /** 상단 로고 자리. 기본 실드 아이콘을 대체합니다. */
  logo?: ReactNode;
  /**
   * 그릴 단계. `"credentials"`(기본) 는 아이디/비밀번호, `"otp"` 는 2차 인증 코드 입력을 그립니다.
   * 1차 인증 응답에 2차 인증이 필요한지 판단해 이 값을 바꾸는 것은 소비 시스템의 몫입니다.
   */
  step?: LoginFormStep;
  /** 제출 중 여부(스피너/중복 제출 차단). 소비 시스템이 제어. 두 단계 공통. */
  loading?: boolean;
  /** 표시할 에러 메시지. 값 판단은 소비 시스템이 함. 두 단계 공통. */
  error?: ReactNode;
  /**
   * 1차 인증(아이디/비밀번호) 제출. 실제 인증(HTTP 호출·쿠키 저장 등)은 소비 시스템이 담당합니다.
   * 이 컴포넌트는 입력을 그리고 값을 넘겨줄 뿐입니다.
   * (docs/08-presentational-only.md)
   */
  onSubmit: (credentials: { id: string; password: string }) => void;
  /** 제출 버튼 문구(1차 단계). */
  submitText?: ReactNode;
  /** 폼 하단 자리. */
  footer?: ReactNode;
  className?: string;

  // ── 2차 인증(OTP) 단계 ──────────────────────────────────────────────
  /** 코드 입력 영역 제목. */
  otpTitle?: ReactNode;
  /** 제목 아래 안내 문구. 기본값은 `otpLength` 를 반영합니다. */
  otpDescription?: ReactNode;
  /** 코드 입력 레이블. */
  otpLabel?: ReactNode;
  /** 코드 입력 placeholder. */
  otpPlaceholder?: string;
  /** 코드 입력 아래 힌트(예: "백업 코드도 사용할 수 있습니다"). */
  otpHint?: ReactNode;
  /** 코드 자릿수. 입력 `maxLength` 와 기본 안내 문구에 쓰입니다. `undefined` 면 길이 제한 없음. */
  otpLength?: number;
  /** 제출 버튼 문구(2차 단계). */
  otpSubmitText?: ReactNode;
  /**
   * 2차 인증 코드 제출. `step === "otp"` 일 때의 제출이 이 콜백으로 갑니다.
   * 코드 검증은 소비 시스템이 합니다.
   */
  onSubmitOtp?: (payload: { code: string }) => void;
  /** 코드 재전송. 넘기면 재전송 버튼이 보입니다(문자/이메일 방식 등). */
  onResendOtp?: () => void;
  /** 재전송 버튼 문구. 남은 시간 표기 등은 노드로 그대로 넘기세요. */
  resendText?: ReactNode;
  /** 재전송 버튼 비활성화(쿨다운 등). 카운트다운 계산은 소비 시스템이 합니다. */
  resendDisabled?: boolean;
  /** 1차 단계로 돌아가기. 넘기면 뒤로 버튼이 보입니다. */
  onBack?: () => void;
  /** 뒤로 버튼 문구. */
  backText?: ReactNode;
  /** 2차 단계의 하단 자리. 생략하면 `footer` 를 그대로 씁니다. */
  otpFooter?: ReactNode;
}

/**
 * 프레젠테이션 전용 로그인 폼.
 * - 보유 상태: 입력값(id/pw/코드) 같은 순수 UI 상태뿐.
 * - 데이터/인증 로직 없음: 단계는 `step` props 로 받고, 값은 `onSubmit`/`onSubmitOtp` 로 전달.
 */
export function LoginForm({
  brand = "Admin Console",
  subtitle = "관리자 콘솔에 로그인하세요.",
  logo,
  step = "credentials",
  loading = false,
  error,
  onSubmit,
  submitText = "로그인",
  footer,
  className,
  otpTitle = "2단계 인증",
  otpDescription,
  otpLabel = "인증 코드",
  otpPlaceholder,
  otpHint,
  otpLength = 6,
  otpSubmitText = "인증 확인",
  onSubmitOtp,
  onResendOtp,
  resendText = "코드 다시 받기",
  resendDisabled = false,
  onBack,
  backText = "이전 단계",
  otpFooter,
}: LoginFormProps) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");

  const isOtp = step === "otp";

  // 단계를 벗어나면 이전에 입력한 코드를 남기지 않습니다(순수 UI 상태 정리).
  useEffect(() => {
    if (!isOtp) setCode("");
  }, [isOtp]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isOtp) {
      onSubmitOtp?.({ code: code.trim() });
      return;
    }
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
        {isOtp ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-text">{otpTitle}</h2>
              <p className="text-sm text-text-muted">
                {otpDescription ??
                  (otpLength
                    ? `인증 앱에 표시된 ${otpLength}자리 코드를 입력하세요.`
                    : "인증 코드를 입력하세요.")}
              </p>
            </div>
            <Input
              label={otpLabel}
              hint={otpHint}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={otpLength}
              placeholder={otpPlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              required
            />
          </>
        ) : (
          <>
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
          </>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          {isOtp ? otpSubmitText : submitText}
        </Button>

        {isOtp && (onResendOtp || onBack) && (
          <div className="flex items-center justify-between gap-2">
            {onBack ? (
              <Button variant="ghost" size="sm" onClick={onBack} disabled={loading}>
                {backText}
              </Button>
            ) : (
              <span />
            )}
            {onResendOtp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResendOtp}
                disabled={resendDisabled || loading}
              >
                {resendText}
              </Button>
            )}
          </div>
        )}

        {isOtp ? (otpFooter ?? footer) : footer}
      </form>
    </div>
  );
}
