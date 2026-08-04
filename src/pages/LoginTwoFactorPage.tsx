import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  LoginForm,
  useToast,
  type LoginFormStep,
} from "../lib";

/**
 * 2차 인증(OTP) 로그인 샘플 — 소비 시스템(컨테이너) 쪽 코드 예시.
 *
 * 역할 분담(docs/08-presentational-only.md, docs/09-data-fetching.md):
 * - `LoginForm` 은 그리기만 한다. 어느 단계를 그릴지는 `step` props 로 받고,
 *   값은 `onSubmit`(1차) / `onSubmitOtp`(2차) / `onSubmitOtpEnroll`(등록) 콜백으로
 *   올려보낼 뿐이다. QR 이미지도 서버가 만든 것을 props 로 받아 그리기만 한다.
 * - "2차 인증이 필요한가", "인증 앱이 이미 등록돼 있는가"의 판단, 코드 검증 호출,
 *   재전송 쿨다운 계산, 성공 후 라우팅은 전부 이 컨테이너의 몫이다.
 *
 * 실제 소비 시스템은 아래 `requestLogin`/`verifyOtp`/`resendOtp` 자리를
 * `src/api` + `useMutation` 호출로 바꾸면 된다(형태는 docs/09-data-fetching.md 참고).
 * 이 데모는 격리망 원칙에 따라 네트워크 없이 지연만 흉내낸다.
 */

/** 데모용 정답 코드 — 실제로는 서버가 검증한다. */
const DEMO_OTP_CODE = "123456";
/** 재전송 쿨다운(초). 카운트다운은 컨테이너가 센다. */
const RESEND_COOLDOWN = 30;
/** 데모용 등록 키 — 실제로는 서버가 계정별로 발급한다. */
const DEMO_OTP_SECRET = "JBSW Y3DP EHPK 3PXP";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 1차 인증. 서버가 "2차 인증이 더 필요한지"와 "인증 앱이 이미 등록됐는지"를
 * 응답으로 알려준다고 가정한다. 미등록이면 등록용 QR/키까지 함께 받는다.
 */
async function requestLogin(
  credentials: { id: string; password: string },
  enrolled: boolean,
) {
  await sleep(600);
  if (!credentials.id || !credentials.password) {
    throw new Error("아이디와 비밀번호를 모두 입력하세요.");
  }
  // 데모: 항상 2차 인증을 요구하고, 다음 단계에서 쓸 임시 토큰을 돌려준다.
  return {
    mfaRequired: true,
    mfaEnrolled: enrolled,
    mfaToken: `demo-mfa-${credentials.id}`,
    // 미등록 계정에만 내려오는 등록 정보(실제로는 서버가 QR 이미지나 otpauth URI 를 준다).
    otpauthUri: enrolled
      ? undefined
      : `otpauth://totp/사내관리자:${credentials.id}?secret=${DEMO_OTP_SECRET.replace(/ /g, "")}&issuer=사내관리자`,
    otpSecret: enrolled ? undefined : DEMO_OTP_SECRET,
  };
}

/** 2차 인증 코드 검증. 실패는 예외로 알린다(에러 문구 표시는 폼이 props 로 받아 그린다). */
async function verifyOtp(payload: { mfaToken: string; code: string }) {
  await sleep(600);
  if (payload.code !== DEMO_OTP_CODE) {
    throw new Error("인증 코드가 올바르지 않습니다. 다시 확인해 주세요.");
  }
  return { accessToken: "demo-access-token" };
}

/**
 * 등록 확인. 인증 앱에 뜬 첫 코드가 맞으면 서버가 시크릿을 계정에 확정한다.
 * 검증 엔드포인트가 로그인 검증과 다른 경우가 많아 별도 함수로 둔다.
 */
async function confirmOtpEnrollment(payload: { mfaToken: string; code: string }) {
  await sleep(600);
  if (payload.code !== DEMO_OTP_CODE) {
    throw new Error("인증 코드가 올바르지 않습니다. 인증 앱에 표시된 코드를 확인해 주세요.");
  }
  return { accessToken: "demo-access-token" };
}

/** 코드 재전송. */
async function resendOtp(_payload: { mfaToken: string }) {
  await sleep(400);
}

export function LoginTwoFactorPage() {
  const toast = useToast();

  // 단계·임시 토큰·진행/에러는 전부 컨테이너 상태다. 폼은 이 값을 props 로 받아 그리기만 한다.
  const [step, setStep] = useState<LoginFormStep>("credentials");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [done, setDone] = useState(false);
  /** 서버가 미등록 계정에만 내려주는 등록 정보(QR 원본 + 수동 입력 키). */
  const [enrollment, setEnrollment] = useState<{ uri: string; secret: string } | null>(null);
  /** 데모 조작용 — 실제로는 서버 응답(`mfaEnrolled`)이 이 값을 정한다. */
  const [enrolledAccount, setEnrolledAccount] = useState(true);

  // 재전송 쿨다운 카운트다운(1초마다 감소).
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((sec) => Math.max(0, sec - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 언마운트 후 상태 갱신을 막기 위한 플래그(데모의 지연 호출 대응).
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setStep("credentials");
    setMfaToken(null);
    setError(null);
    setCooldown(0);
    setDone(false);
    setEnrollment(null);
  }, []);

  async function handleSubmit(credentials: { id: string; password: string }) {
    setPending(true);
    setError(null);
    try {
      const res = await requestLogin(credentials, enrolledAccount);
      if (!alive.current) return;
      // 2차 인증 필요 여부도, 인증 앱 등록 여부도 "응답을 보고 컨테이너가" 판단한다.
      if (res.mfaRequired) {
        setMfaToken(res.mfaToken);
        if (res.mfaEnrolled) {
          setEnrollment(null);
          setStep("otp");
          setCooldown(RESEND_COOLDOWN);
          toast.info("인증 코드를 보냈습니다.");
          return;
        }
        // 미등록 계정 — 등록용 QR 을 그리는 단계로 보낸다(재전송 개념 없음).
        setEnrollment(
          res.otpauthUri && res.otpSecret
            ? { uri: res.otpauthUri, secret: res.otpSecret }
            : null,
        );
        setStep("otp-enroll");
        toast.info("인증 앱을 먼저 등록해 주세요.");
        return;
      }
      setDone(true);
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setPending(false);
    }
  }

  async function handleSubmitOtp({ code }: { code: string }) {
    if (!mfaToken) return;
    setPending(true);
    setError(null);
    try {
      await verifyOtp({ mfaToken, code });
      if (!alive.current) return;
      // 실제 소비 시스템은 여기서 토큰 저장(saveTokens) + 라우팅(navigate)을 한다.
      setDone(true);
      toast.success("2단계 인증에 성공했습니다.");
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setPending(false);
    }
  }

  async function handleSubmitOtpEnroll({ code }: { code: string }) {
    if (!mfaToken) return;
    setPending(true);
    setError(null);
    try {
      await confirmOtpEnrollment({ mfaToken, code });
      if (!alive.current) return;
      // 등록 확정 + 로그인 완료. 실제 시스템은 여기서 토큰 저장 + 라우팅을 한다.
      setEnrolledAccount(true);
      setDone(true);
      toast.success("인증 앱을 등록했습니다.");
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setPending(false);
    }
  }

  async function handleResendOtp() {
    if (!mfaToken) return;
    setError(null);
    setCooldown(RESEND_COOLDOWN);
    await resendOtp({ mfaToken });
    if (alive.current) toast.info("인증 코드를 다시 보냈습니다.");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <Card
        title="2차 인증 로그인 샘플"
        action={
          <Badge tone={step === "credentials" ? "info" : "warning"}>{`step: ${step}`}</Badge>
        }
      >
        <div className="flex flex-col gap-3 text-sm text-text-muted">
          <p>
            아무 아이디/비밀번호나 넣으면 2차 인증 단계로 넘어갑니다. 코드는{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-text">
              {DEMO_OTP_CODE}
            </code>{" "}
            입니다(데모 — 실제로는 서버가 검증).
          </p>
          <div className="rounded-md border border-line bg-surface-muted p-3">
            <Checkbox
              label="이 계정은 인증 앱이 이미 등록됨"
              hint={
                enrolledAccount
                  ? '체크를 풀면 미등록 계정으로 로그인해 QR 등록 단계("otp-enroll")를 볼 수 있습니다.'
                  : "미등록 상태입니다 — 로그인하면 QR 코드 등록 단계가 나옵니다."
              }
              checked={enrolledAccount}
              onChange={(e) => {
                setEnrolledAccount(e.target.checked);
                reset();
              }}
            />
          </div>
          <ul className="list-disc pl-5">
            <li>
              <code>LoginForm</code> 은 <code>step</code> 으로 받은 단계를 그리기만 합니다.
            </li>
            <li>
              등록 여부에 따라 <code>"otp"</code>(코드 입력만) 와 <code>"otp-enroll"</code>(QR +
              등록 키 + 코드 입력) 중 무엇을 그릴지 정하는 것은 이 페이지(컨테이너)입니다.
            </li>
            <li>
              서버가 준 <code>otpauth://totp/…</code> URI 를 <code>otpQrValue</code> 로 넘기면
              폼이 QR 을 직접 그립니다(인코딩은 라이브러리 안에서 — 외부 QR 생성 서비스 없음).
              이미 이미지로 받았다면 <code>otpQrImageSrc</code>, 완전히 다른 걸 그리려면{" "}
              <code>otpQrCode</code> 노드를 씁니다.
            </li>
            <li>
              2차 인증 필요 여부 판단·코드 검증·재전송 쿨다운은 이 페이지(컨테이너)가 합니다.
            </li>
            <li>
              실제 시스템에서는 <code>src/api</code> + <code>useMutation</code> 으로 바꿔 끼웁니다.
            </li>
          </ul>
        </div>
      </Card>

      <Card title="미리보기" bodyClassName="flex justify-center">
        {done ? (
          <EmptyState
            title="로그인 완료"
            description="실제 소비 시스템이라면 여기서 토큰을 저장하고 보호 경로로 이동합니다."
            action={
              <Button variant="secondary" size="sm" onClick={reset}>
                처음부터 다시
              </Button>
            }
          />
        ) : (
          <LoginForm
            brand="사내 관리자"
            subtitle="격리망 관리자 콘솔에 로그인하세요."
            step={step}
            loading={pending}
            error={error}
            onSubmit={handleSubmit}
            onSubmitOtp={handleSubmitOtp}
            onSubmitOtpEnroll={handleSubmitOtpEnroll}
            onResendOtp={handleResendOtp}
            resendDisabled={cooldown > 0}
            resendText={cooldown > 0 ? `${cooldown}초 후 다시 받기` : "코드 다시 받기"}
            onBack={reset}
            otpHint="코드를 받지 못했다면 다시 받기를 눌러 주세요."
            otpFooter={
              <p className="text-center text-xs text-text-muted">
                데모 프리뷰 — 코드는 {DEMO_OTP_CODE} 입니다.
              </p>
            }
            // ── 미등록 계정: 등록용 QR 자리 ──
            // 서버가 준 otpauth URI 를 그대로 넘기면 폼이 QR 을 그린다(외부 서비스 없음).
            otpQrValue={enrollment?.uri}
            otpSecret={enrollment?.secret}
            otpEnrollHint="Google Authenticator·Microsoft Authenticator 등에서 코드를 확인하세요."
            otpEnrollFooter={
              <p className="text-center text-xs text-text-muted">
                데모 프리뷰 — QR 은 실제로 스캔되지만 코드 검증은 흉내이고, 정답은{" "}
                {DEMO_OTP_CODE} 입니다.
              </p>
            }
            footer={
              <p className="text-center text-xs text-text-muted">
                데모 프리뷰 — 아무 값이나 입력해 다음 단계로 넘어갑니다.
              </p>
            }
          />
        )}
      </Card>
    </div>
  );
}
