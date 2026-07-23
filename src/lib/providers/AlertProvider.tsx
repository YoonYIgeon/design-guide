import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertDialog, type AlertTone } from "../components/AlertDialog";
import { PromptDialog } from "../components/PromptDialog";

/**
 * 알림/확인/입력 프로바이더 — 라이브러리 제공 UI 상태 프로바이더.
 *
 * 프레젠테이션 전용 원칙의 명시적 예외(승격)입니다: 다이얼로그 열림 상태·Promise 해소는
 * 데이터/비즈니스 로직이 아닌 **순수 UI 상태**이므로 라이브러리가 관리하고,
 * 소비 시스템은 <AlertProvider> 로 감싼 뒤 useAlert() 만 호출합니다.
 * 네트워크·인증·영속화는 여전히 다루지 않습니다. (docs/08-presentational-only.md)
 */

export interface AlertOptions {
  tone?: AlertTone;
  title?: ReactNode;
  confirmText?: string;
}

export interface ConfirmOptions extends AlertOptions {
  cancelText?: string;
}

export interface PromptOptions {
  title?: ReactNode;
  /** 입력 레이블. */
  label?: ReactNode;
  placeholder?: string;
  /** input type (text/email/number 등). 기본 "text". */
  inputType?: string;
  /** 빈 값이면 확인 버튼 비활성(기본 false). */
  required?: boolean;
  /** 입력 아래 힌트. */
  hint?: ReactNode;
  confirmText?: string;
  cancelText?: string;
}

export interface AlertApi {
  /** 단일 확인 다이얼로그. 확인을 누르면 resolve 됩니다. */
  alert: (message: ReactNode, options?: AlertOptions) => Promise<void>;
  /** 확인/취소 다이얼로그. 확인이면 true, 취소/닫기면 false 로 resolve 됩니다. */
  confirm: (message: ReactNode, options?: ConfirmOptions) => Promise<boolean>;
  /**
   * 값 하나를 입력받는 다이얼로그. 확인이면 입력한 문자열, 취소/닫기면 null 로 resolve 됩니다.
   * @param defaultValue 열릴 때 채워질 초기값.
   */
  prompt: (
    message: ReactNode,
    defaultValue?: string,
    options?: PromptOptions,
  ) => Promise<string | null>;
}

interface AlertState extends ConfirmOptions {
  kind: "alert" | "confirm";
  message: ReactNode;
}

interface PromptState extends PromptOptions {
  kind: "prompt";
  message: ReactNode;
  defaultValue: string;
}

type DialogState = AlertState | PromptState;

const AlertContext = createContext<AlertApi | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const [open, setOpen] = useState(false);
  // 확인/취소·입력 결과를 호출부 Promise 로 되돌려줄 resolver.
  const resolver = useRef<((value: boolean | string | null) => void) | null>(null);

  const settle = useCallback((result: boolean | string | null) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpen(false);
  }, []);

  const openDialog = useCallback(
    (next: DialogState) =>
      new Promise<boolean | string | null>((resolve) => {
        resolver.current = resolve;
        setState(next);
        setOpen(true);
      }),
    [],
  );

  const api = useMemo<AlertApi>(
    () => ({
      alert: (message, options = {}) =>
        openDialog({ ...options, kind: "alert", message }).then(() => undefined),
      confirm: (message, options = {}) =>
        openDialog({ ...options, kind: "confirm", message }).then((r) => r === true),
      prompt: (message, defaultValue = "", options = {}) =>
        openDialog({ ...options, kind: "prompt", message, defaultValue }).then((r) =>
          typeof r === "string" ? r : null,
        ),
    }),
    [openDialog],
  );

  return (
    <AlertContext.Provider value={api}>
      {children}
      {state?.kind === "prompt" ? (
        <PromptDialog
          open={open}
          title={state.title ?? "입력"}
          description={state.message}
          label={state.label}
          placeholder={state.placeholder}
          defaultValue={state.defaultValue}
          inputType={state.inputType}
          required={state.required}
          hint={state.hint}
          confirmText={state.confirmText}
          cancelText={state.cancelText}
          onSubmit={(value) => settle(value)}
          onCancel={() => settle(null)}
        />
      ) : (
        state && (
          <AlertDialog
            open={open}
            tone={state.tone}
            title={state.title ?? (state.kind === "confirm" ? "확인" : "알림")}
            confirmText={state.confirmText}
            cancelText={state.kind === "confirm" ? (state.cancelText ?? "취소") : undefined}
            onConfirm={() => settle(true)}
            onCancel={() => settle(false)}
          >
            {state.message}
          </AlertDialog>
        )
      )}
    </AlertContext.Provider>
  );
}

/** 알림/확인/입력 API 훅. AlertProvider 하위에서만 사용합니다. */
export function useAlert(): AlertApi {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert 는 <AlertProvider> 안에서만 사용할 수 있습니다.");
  return ctx;
}
