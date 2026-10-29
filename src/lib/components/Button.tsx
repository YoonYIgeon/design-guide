import {
  forwardRef,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type Ref,
} from "react";
import { Link, type To } from "react-router-dom";
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
   * 이동할 경로. 주면 `<button>` 대신 react-router-dom 의 `<Link to={to}>` 로 그려집니다.
   * 일반 클릭은 `navigate` 와 같은 클라이언트 이동이고, Ctrl/Cmd/Shift/Alt·휠 클릭과
   * 우클릭 메뉴는 브라우저 기본 동작(새 탭·새 창·다운로드 등)을 따릅니다.
   * `<Router>` 안에서만 쓸 수 있습니다.
   */
  to?: To;
  /** `to` 일 때 히스토리를 쌓지 않고 교체합니다(`navigate(to, { replace: true })`). */
  replace?: boolean;
  /** `to` 일 때 이동과 함께 넘길 history state. */
  state?: unknown;
  /** `to` 일 때 `<a>` 의 target. */
  target?: string;
  /** `to` 일 때 `<a>` 의 rel. */
  rel?: string;
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
 * 화면 이동 버튼은 `to` 를 주세요. react-router-dom 의 `<Link>` 로 그려지므로
 * 일반 클릭은 `navigate` 와 같고, Ctrl/Cmd·Alt·휠 클릭 등은 브라우저 기본 동작을 따릅니다.
 * ```tsx
 * <Button to="/users/new">사용자 추가</Button>
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
      replace,
      state,
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
      const handleClick = (e: MouseEvent<HTMLAnchorElement>) =>
        onClick?.(e as unknown as MouseEvent<HTMLButtonElement>);
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
      const anchorProps = anchorRest as AnchorHTMLAttributes<HTMLAnchorElement>;
      // 비활성이면 href 없는 <a> 로 그려 어떤 클릭으로도 이동하지 않게 한다.
      if (isDisabled) {
        return (
          <a
            ref={ref as Ref<HTMLAnchorElement>}
            role="link"
            aria-disabled
            aria-busy={loading || undefined}
            tabIndex={-1}
            className={cn(classes, "no-underline")}
            {...anchorProps}
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          ref={ref as Ref<HTMLAnchorElement>}
          to={to}
          replace={replace}
          state={state}
          target={target}
          rel={rel}
          className={cn(classes, "no-underline")}
          onClick={handleClick}
          {...anchorProps}
        >
          {content}
        </Link>
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
