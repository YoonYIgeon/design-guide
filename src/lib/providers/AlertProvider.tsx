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

/**
 * 알림/확인 프로바이더 — 라이브러리 제공 UI 상태 프로바이더.
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

export interface AlertApi {
  /** 단일 확인 다이얼로그. 확인을 누르면 resolve 됩니다. */
  alert: (message: ReactNode, options?: AlertOptions) => Promise<void>;
  /** 확인/취소 다이얼로그. 확인이면 true, 취소/닫기면 false 로 resolve 됩니다. */
  confirm: (message: ReactNode, options?: ConfirmOptions) => Promise<boolean>;
}

interface DialogState extends ConfirmOptions {
  message: ReactNode;
  isConfirm: boolean;
}

const AlertContext = createContext<AlertApi | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const [open, setOpen] = useState(false);
  // 확인/취소 결과를 호출부 Promise 로 되돌려줄 resolver.
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpen(false);
  }, []);

  const openDialog = useCallback(
    (message: ReactNode, options: ConfirmOptions, isConfirm: boolean) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setState({ ...options, message, isConfirm });
        setOpen(true);
      }),
    [],
  );

  const api = useMemo<AlertApi>(
    () => ({
      alert: (message, options = {}) => openDialog(message, options, false).then(() => undefined),
      confirm: (message, options = {}) => openDialog(message, options, true),
    }),
    [openDialog],
  );

  return (
    <AlertContext.Provider value={api}>
      {children}
      {state && (
        <AlertDialog
          open={open}
          tone={state.tone}
          title={state.title ?? (state.isConfirm ? "확인" : "알림")}
          confirmText={state.confirmText}
          cancelText={state.isConfirm ? (state.cancelText ?? "취소") : undefined}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        >
          {state.message}
        </AlertDialog>
      )}
    </AlertContext.Provider>
  );
}

/** 알림/확인 API 훅. AlertProvider 하위에서만 사용합니다. */
export function useAlert(): AlertApi {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert 는 <AlertProvider> 안에서만 사용할 수 있습니다.");
  return ctx;
}
