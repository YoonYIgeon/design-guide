import {
  forwardRef,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type Ref,
} from "react";
import { cn } from "../utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /**
   * 아이콘만 넣는 정사각형 버튼. 가로 패딩을 없애고 높이와 같은 너비를 줍니다
   * (sm: 32px, md: 40px). 텍스트 라벨이 없으므로 `aria-label` 을 반드시 주세요.
   */
  square?: boolean;
  /**
   * 이동할 경로. 주면 `<button>` 대신 `<a href={to}>` 로 그려져
   * Ctrl/Cmd/Shift/Alt·휠 클릭(새 탭·새 창·다운로드 등)과 우클릭 메뉴가 브라우저 기본대로 동작합니다.
   * 수식키 없는 일반 왼쪽 클릭만 기본 이동을 막고 `onNavigate(to)` 로 넘깁니다.
   * `onNavigate` 를 안 주면 일반 링크처럼 페이지를 이동합니다.
   */
  to?: string;
  /** `to` 의 일반 클릭 시 호출. 라우터의 `navigate` 를 연결하세요. */
  onNavigate?: (to: string) => void;
  /** `to` 일 때 `<a>` 의 target. `"_blank"` 등 다른 창이면 `onNavigate` 를 거치지 않습니다. */
  target?: string;
  /** `to` 일 때 `<a>` 의 rel. */
  rel?: string;
}

/** 수식키 없는 일반 왼쪽 클릭인지 — 아니면 새 탭 등 브라우저 기본 동작에 맡긴다. */
function isPlainLeftClick(e: MouseEvent) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover border-transparent",
  secondary:
    "bg-surface text-text hover:bg-surface-muted border-line",
  danger: "bg-danger text-white hover:bg-danger-hover border-transparent",
  ghost: "bg-transparent text-text hover:bg-surface-muted border-transparent",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

/** square 일 때의 크기. 가로 패딩 대신 높이와 같은 너비로 정사각형을 만듭니다. */
const squareSizeClass: Record<Size, string> = {
  sm: "h-8 w-8 p-0 text-sm gap-1.5",
  md: "h-10 w-10 p-0 text-sm gap-2",
};

/**
 * 액션 버튼. loading 시 중복 클릭을 차단합니다.
 *
 * 아이콘만 넣을 때는 `square` 를 켜면 가로 패딩이 사라지고 정사각형이 됩니다.
 * 이때 버튼에는 읽을 텍스트가 없으므로 `aria-label` 을 함께 주세요.
 * ```tsx
 * <Button variant="ghost" size="sm" square aria-label="삭제">
 *   <IconTrash width={16} height={16} />
 * </Button>
 * ```
 *
 * `type` 기본값은 `"button"` 입니다 — HTML 기본값(`"submit"`)을 그대로 두면
 * `<form>` 안에 놓인 모든 버튼(테이블 페이지네이션, 툴바 액션 등)이 클릭만으로
 * 폼을 제출해 버립니다. 제출 버튼은 `type="submit"` 을 명시하세요.
 *
 * 화면 이동 버튼은 `to` 와 `onNavigate` 를 주세요. 링크(`<a>`)로 그려지므로
 * 일반 클릭은 `navigate` 와 같고, Ctrl/Cmd·Alt·휠 클릭 등은 브라우저 기본 동작을 따릅니다.
 * ```tsx
 * <Button to="/users/new" onNavigate={navigate}>사용자 추가</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      square = false,
      type = "button",
      disabled,
      className,
      children,
      to,
      onNavigate,
      target,
      rel,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const classes = cn(
      "inline-flex items-center justify-center rounded-md border font-medium",
      "transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
      "aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
      variantClass[variant],
      square ? squareSizeClass[size] : sizeClass[size],
      className,
    );
    const content = (
      <>
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        )}
        {children}
      </>
    );

    if (to !== undefined) {
      // 링크 모드: 비활성이면 href 를 빼서 어떤 클릭으로도 이동하지 않게 한다.
      const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        if (isDisabled) {
          e.preventDefault();
          return;
        }
        onClick?.(e as unknown as MouseEvent<HTMLButtonElement>);
        if (e.defaultPrevented || !onNavigate) return;
        if (!isPlainLeftClick(e) || (target && target !== "_self")) return;
        e.preventDefault();
        onNavigate(to);
      };
      const {
        form: _form,
        formAction: _formAction,
        formEncType: _formEncType,
        formMethod: _formMethod,
        formNoValidate: _formNoValidate,
        formTarget: _formTarget,
        name: _name,
        value: _value,
        ...anchorRest
      } = rest;
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={isDisabled ? undefined : to}
          target={target}
          rel={rel}
          role={isDisabled ? "link" : undefined}
          aria-disabled={isDisabled || undefined}
          aria-busy={loading || undefined}
          tabIndex={isDisabled ? -1 : undefined}
          className={cn(classes, "no-underline")}
          onClick={handleClick}
          {...(anchorRest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={classes}
        onClick={onClick}
        {...rest}
      >
        {content}
      </button>
    );
  },
);
Button.displayName = "Button";
