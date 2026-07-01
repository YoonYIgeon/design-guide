import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toast, ToastViewport, type ToastPosition, type ToastTone } from "../lib";

/**
 * 토스트 프로바이더 — 하네스(컨테이너) 레벨의 상태/큐 관리.
 *
 * ⚠️ 라이브러리(src/lib)가 아니라 소비 시스템 쪽 코드입니다.
 *    프레젠테이션 전용 원칙상 큐·타이머 같은 상태 로직은 컴포넌트가 아닌 여기에 둡니다.
 *    라이브러리는 그리기만(<Toast>/<ToastViewport>) 담당합니다.
 *    (docs/08-presentational-only.md)
 */

export interface ToastOptions {
  tone?: ToastTone;
  title?: ReactNode;
  /** 자동 사라짐 시간(ms). 0 이면 수동 닫기 전까지 유지. 기본 4000. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  message: ReactNode;
}

export interface ToastApi {
  /** 토스트를 띄우고 id 를 반환합니다. */
  show: (message: ReactNode, options?: ToastOptions) => number;
  success: (message: ReactNode, options?: Omit<ToastOptions, "tone">) => number;
  error: (message: ReactNode, options?: Omit<ToastOptions, "tone">) => number;
  warning: (message: ReactNode, options?: Omit<ToastOptions, "tone">) => number;
  info: (message: ReactNode, options?: Omit<ToastOptions, "tone">) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 4000;

export function ToastProvider({
  children,
  position = "top-right",
}: {
  children: ReactNode;
  position?: ToastPosition;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: ReactNode, options: ToastOptions = {}) => {
      const id = ++idRef.current;
      const { duration = DEFAULT_DURATION, ...rest } = options;
      setToasts((prev) => [...prev, { id, message, ...rest }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, options) => show(message, { ...options, tone: "success" }),
      error: (message, options) => show(message, { ...options, tone: "danger" }),
      warning: (message, options) => show(message, { ...options, tone: "warning" }),
      info: (message, options) => show(message, { ...options, tone: "info" }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport position={position}>
        {toasts.map((t) => (
          <Toast key={t.id} tone={t.tone} title={t.title} onDismiss={() => dismiss(t.id)}>
            {t.message}
          </Toast>
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

/** 토스트 API 훅. ToastProvider 하위에서만 사용합니다. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast 는 <ToastProvider> 안에서만 사용할 수 있습니다.");
  return ctx;
}
