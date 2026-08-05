import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Button } from "./Button";
import { Input, type InputProps } from "./Input";
import { QrCode } from "./QrCode";
import { IconShield } from "../icons";
import type { QrErrorCorrection } from "../utils/qr";

/**
 * 폼이 그릴 단계. 어떤 단계인지 판단(2차 인증 필요 여부, 인증 앱 등록 여부)은
 * 소비 시스템이 합니다.
 *
 * - `"credentials"` — 아이디/비밀번호
 * - `"otp"` — 인증 앱이 이미 등록된 경우. 코드 입력만 그립니다.
 * - `"otp-enroll"` — 인증 앱이 아직 등록되지 않은 경우. QR 코드와 등록 키를 함께 그립니다.
 */
export type LoginFormStep = "credentials" | "otp" | "otp-enroll";

/** 그릴 수 있는 단계 목록. 아래 미지의 값 경고에만 쓰입니다. */
const KNOWN_STEPS: readonly string[] = ["credentials", "otp", "otp-enroll"];

/** 같은 값으로 렌더마다 경고가 쌓이지 않게, 값당 한 번만 알립니다. */
const warnedSteps = new Set<string>();

/**
 * 모르는 `step` 값은 1차 인증 화면으로 폴백되는데, 조용히 폴백되면 "폼이 안 바뀐다"로만
 * 보여 원인을 찾기 어렵습니다. 그래서 한 번은 콘솔로 알립니다.
 *
 * 프로덕션에서도 켜 둡니다 — 값당 한 번이라 비용이 없고, 빌드 환경 감지(`import.meta.env`)는
 * 라이브러리에 두지 않기 때문입니다(docs/09-data-fetching.md 리뷰 기준).
 */
function warnUnknownStep(step: string) {
  if (warnedSteps.has(step)) return;
  warnedSteps.add(step);
  console.warn(
    `[LoginForm] 알 수 없는 step 값입니다: ${JSON.stringify(step)}. ` +
      `${KNOWN_STEPS.map((s) => `"${s}"`).join(" | ")} 중 하나여야 합니다. ` +
      "1차 인증(아이디/비밀번호) 화면으로 그립니다 — " +
      "라이브러리 사본이 오래됐거나 값에 오타가 있는지 확인하세요.",
  );
}

/**
 * 1차 인증 입력에 덧씌울 수 있는 props.
 *
 * `Input` 이 받는 것은 거의 그대로 열려 있습니다 — `label`·`placeholder`·`autoComplete`·
 * `hint`·`error`·`leading`·`type`·`required` 등. 폼이 정한 기본값 위에 덮어씁니다.
 *
 * 다만 입력값은 폼이 보유하는 순수 UI 상태이므로 `value`/`onChange` 는 열지 않습니다.
 * 값은 제출 시 `onSubmit` 으로 올라갑니다. (docs/08-presentational-only.md)
 */
export type LoginFormInputProps = Omit<InputProps, "value" | "onChange">;

export interface LoginFormProps {
  /** 상단 제품명. 문자열 또는 임의의 노드(로고 등). */
  brand?: ReactNode;
  /** 제품명 아래 보조 문구. 문자열 또는 노드. */
  subtitle?: ReactNode;
  /** 상단 로고 자리. 기본 실드 아이콘을 대체합니다. */
  logo?: ReactNode;
  /**
   * 그릴 단계. `"credentials"`(기본) 는 아이디/비밀번호, `"otp"` 는 2차 인증 코드 입력,
   * `"otp-enroll"` 은 QR 코드 등록 + 첫 코드 입력을 그립니다.
   * 1차 인증 응답을 보고 2차 인증이 필요한지, 인증 앱이 이미 등록돼 있는지 판단해
   * 이 값을 바꾸는 것은 소비 시스템의 몫입니다.
   */
  step?: LoginFormStep;
  /**
   * 아이디 입력에 덮어쓸 props. 기본값은
   * `{ label: "아이디", placeholder: "사내 계정 아이디", autoComplete: "username", required: true }`.
   * 예: `idInput={{ label: "사번", placeholder: "10자리 사번" }}`
   */
  idInput?: LoginFormInputProps;
  /**
   * 비밀번호 입력에 덮어쓸 props. 기본값은
   * `{ label: "비밀번호", placeholder: "비밀번호", type: "password", autoComplete: "current-password", required: true }`.
   * `type` 도 열려 있어 "비밀번호 표시" 토글 같은 것을 소비 시스템이 만들 수 있습니다.
   */
  passwordInput?: LoginFormInputProps;
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

  // ── 2차 인증 등록(`step === "otp-enroll"`) 단계 ──────────────────────
  /** 등록 영역 제목. */
  otpEnrollTitle?: ReactNode;
  /** 등록 안내 문구. 기본값은 `otpLength` 를 반영합니다. */
  otpEnrollDescription?: ReactNode;
  /**
   * TOTP 등록용 `otpauth://totp/…` URI. 넘기면 폼이 QR 코드를 직접 그립니다
   * (인코딩은 라이브러리 안에서 하므로 외부 QR 생성 서비스가 필요 없습니다).
   *
   * 서버가 주는 URI 를 그대로 넘기면 됩니다:
   * `otpauth://totp/발급자:계정?secret=BASE32&issuer=발급자`
   */
  otpQrValue?: string;
  /** `otpQrValue` 의 오류 정정 수준. 기본 `"M"`(약 15% 복원). */
  otpQrLevel?: QrErrorCorrection;
  /**
   * QR 코드 자리를 통째로 대체하는 노드(`<svg>`·`<img>`·커스텀 컴포넌트 등).
   * 셋 다 넘기면 `otpQrCode` → `otpQrImageSrc` → `otpQrValue` 순으로 우선합니다
   * (직접 만든 것이 먼저, 없으면 라이브러리가 URI 로 그림).
   */
  otpQrCode?: ReactNode;
  /**
   * 이미 이미지로 만들어진 QR 의 주소. 서버가 만든 QR 을 data URI(`data:image/png;base64,…`) 나
   * `URL.createObjectURL` 로 넘기세요. 격리망 원칙상 외부 QR 생성 서비스 URL 은 쓰지 않습니다.
   * URI 만 있다면 `otpQrValue` 를 쓰는 편이 간단합니다.
   */
  otpQrImageSrc?: string;
  /** QR 이미지 대체 텍스트(`otpQrImageSrc` 로 그릴 때). */
  otpQrAlt?: string;
  /** QR 이 아직 없을 때 그 자리에 그릴 문구(발급 대기 등). */
  otpQrPlaceholder?: ReactNode;
  /** QR 을 스캔할 수 없을 때 인증 앱에 직접 입력하는 등록 키. 넘긴 경우에만 보입니다. */
  otpSecret?: ReactNode;
  /** 등록 키 레이블. */
  otpSecretLabel?: ReactNode;
  /** 등록 단계 코드 입력 힌트. 생략하면 `otpHint` 를 씁니다. */
  otpEnrollHint?: ReactNode;
  /** 등록 단계 제출 버튼 문구. */
  otpEnrollSubmitText?: ReactNode;
  /**
   * 등록 확인 코드 제출. 생략하면 `onSubmitOtp` 로 갑니다.
   * 등록 완료 처리(서버에 시크릿 확정 등)는 소비 시스템이 합니다.
   */
  onSubmitOtpEnroll?: (payload: { code: string }) => void;
  /** 등록 단계의 하단 자리. 생략하면 `otpFooter ?? footer` 를 씁니다. */
  otpEnrollFooter?: ReactNode;
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
  idInput,
  passwordInput,
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
  otpEnrollTitle = "2단계 인증 등록",
  otpEnrollDescription,
  otpQrValue,
  otpQrLevel = "M",
  otpQrCode,
  otpQrImageSrc,
  otpQrAlt = "2단계 인증 등록용 QR 코드",
  otpQrPlaceholder = "QR 코드를 준비하고 있습니다.",
  otpSecret,
  otpSecretLabel = "QR 을 못 읽는다면, 이 키를 직접 입력하세요",
  otpEnrollHint,
  otpEnrollSubmitText = "등록하고 인증",
  onSubmitOtpEnroll,
  otpEnrollFooter,
}: LoginFormProps) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");

  const isEnroll = step === "otp-enroll";
  const isOtp = step === "otp";
  /** 코드 입력을 그리는 단계(등록/일반 공통). */
  const isCodeStep = isOtp || isEnroll;

  // 단계가 바뀌면 이전에 입력한 코드를 남기지 않습니다(순수 UI 상태 정리).
  useEffect(() => {
    setCode("");
    if (!KNOWN_STEPS.includes(step)) warnUnknownStep(step);
  }, [step]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isEnroll) {
      // 등록 전용 콜백이 없으면 일반 코드 제출로 보냅니다.
      (onSubmitOtpEnroll ?? onSubmitOtp)?.({ code: code.trim() });
      return;
    }
    if (isOtp) {
      onSubmitOtp?.({ code: code.trim() });
      return;
    }
    onSubmit({ id: id.trim(), password: pw });
  }

  // QR 자리: 커스텀 노드 > 이미지 주소 > otpauth URI 인코딩 > 자리표시자.
  const qrPlaceholder = (
    <span className="px-2 text-center text-xs text-text-muted">{otpQrPlaceholder}</span>
  );
  const qr =
    otpQrCode ??
    (otpQrImageSrc ? (
      <img src={otpQrImageSrc} alt={otpQrAlt} className="h-full w-full object-contain" />
    ) : otpQrValue ? (
      <QrCode value={otpQrValue} level={otpQrLevel} alt={otpQrAlt} fallback={qrPlaceholder} />
    ) : null);

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
        {isCodeStep ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-text">
                {isEnroll ? otpEnrollTitle : otpTitle}
              </h2>
              <p className="text-sm text-text-muted">
                {isEnroll
                  ? (otpEnrollDescription ??
                    (otpLength
                      ? `인증 앱으로 QR 코드를 스캔한 뒤, 앱에 표시된 ${otpLength}자리 코드를 입력하세요.`
                      : "인증 앱으로 QR 코드를 스캔한 뒤, 앱에 표시된 코드를 입력하세요."))
                  : (otpDescription ??
                    (otpLength
                      ? `인증 앱에 표시된 ${otpLength}자리 코드를 입력하세요.`
                      : "인증 코드를 입력하세요."))}
              </p>
            </div>

            {isEnroll && (
              <div className="flex flex-col items-center gap-3">
                <div
                  className={cn(
                    "flex h-44 w-44 items-center justify-center overflow-hidden rounded-lg border p-2",
                    // QR 은 테마와 무관하게 밝은 바탕이어야 스캔됩니다(surface-fixed).
                    qr ? "border-line bg-surface-fixed" : "border-dashed border-line bg-surface-muted",
                  )}
                >
                  {qr ?? qrPlaceholder}
                </div>
                {otpSecret && (
                  <div className="w-full rounded-md border border-line bg-surface-muted px-3 py-2 text-center">
                    <p className="text-xs text-text-muted">{otpSecretLabel}</p>
                    <p className="mt-0.5 break-all font-mono text-sm font-medium text-text">
                      {otpSecret}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Input
              label={otpLabel}
              hint={isEnroll ? (otpEnrollHint ?? otpHint) : otpHint}
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
            {/*
              폼 기본값 → 소비 시스템 덮어쓰기 → 폼이 소유한 값/핸들러 순서로 놓습니다.
              value/onChange 를 마지막에 둬, 어떤 props 를 넘겨도 입력 상태는 폼이 지킵니다.
            */}
            <Input
              label="아이디"
              placeholder="사내 계정 아이디"
              autoComplete="username"
              required
              {...idInput}
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
            <Input
              label="비밀번호"
              placeholder="비밀번호"
              type="password"
              autoComplete="current-password"
              required
              {...passwordInput}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
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
          {isEnroll ? otpEnrollSubmitText : isOtp ? otpSubmitText : submitText}
        </Button>

        {/* 재전송은 코드를 "받는" 방식(문자/이메일)에만 해당하므로 등록 단계에는 그리지 않습니다. */}
        {isCodeStep && (onBack || (isOtp && onResendOtp)) && (
          <div className="flex items-center justify-between gap-2">
            {onBack ? (
              <Button variant="ghost" size="sm" onClick={onBack} disabled={loading}>
                {backText}
              </Button>
            ) : (
              <span />
            )}
            {isOtp && onResendOtp && (
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

        {isEnroll
          ? (otpEnrollFooter ?? otpFooter ?? footer)
          : isOtp
            ? (otpFooter ?? footer)
            : footer}
      </form>
    </div>
  );
}
