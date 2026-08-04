import { useMemo, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { encodeQr, type QrErrorCorrection } from "../utils/qr";

export interface QrCodeProps {
  /** 인코딩할 문자열. 예: `otpauth://totp/발급자:계정?secret=…&issuer=발급자` */
  value: string;
  /**
   * 오류 정정 수준. 높을수록 더 잘 복원되지만 코드가 커집니다.
   * `"L"` 7% · `"M"` 15%(기본) · `"Q"` 25% · `"H"` 30%.
   */
  level?: QrErrorCorrection;
  /** 코드 둘레 여백(모듈 수). 스캔 안정성을 위해 기본 4를 권장합니다. */
  quietZone?: number;
  /** 스크린리더용 설명. */
  alt?: string;
  /**
   * 인코딩에 실패했을 때(담을 수 없을 만큼 긴 값 등) 대신 그릴 내용.
   * 넘기지 않으면 아무것도 그리지 않습니다.
   */
  fallback?: ReactNode;
  className?: string;
}

/** 인코딩 실패를 값당 한 번만 알립니다(렌더마다 쌓이지 않게). */
const warnedValues = new Set<string>();

/**
 * 문자열을 QR 코드 SVG 로 그립니다. 프레젠테이션 전용 — 값은 props 로만 받습니다.
 *
 * 인코딩은 `utils/qr.ts` 가 라이브러리 안에서 직접 합니다(격리망: 외부 QR 생성 서비스 금지).
 * 색은 테마와 무관한 고정 토큰을 씁니다 — 다크 테마에서 밝고 어두운 색이 뒤집히면
 * 스캔이 되지 않기 때문입니다. 바꾸려면 `--au-color-surface-fixed`/`--au-color-text-fixed`
 * 를 재정의하세요(대비는 소비 시스템 책임).
 *
 * 컨테이너 크기를 그대로 채웁니다. 크기는 바깥에서 정하세요(예: `className="h-44 w-44"`).
 */
export function QrCode({
  value,
  level = "M",
  quietZone = 4,
  alt,
  fallback,
  className,
}: QrCodeProps) {
  const matrix = useMemo(() => {
    try {
      return encodeQr(value, level);
    } catch (e) {
      if (!warnedValues.has(value)) {
        warnedValues.add(value);
        console.warn(`[QrCode] QR 코드를 만들지 못했습니다: ${(e as Error).message}`);
      }
      return null;
    }
  }, [value, level]);

  if (!matrix) return <>{fallback}</>;

  const size = matrix.length;
  const total = size + quietZone * 2;

  // 이웃한 어두운 모듈을 한 줄로 합쳐 <rect> 수를 줄입니다(SVG 크기·렌더 비용 절감).
  const runs: { x: number; y: number; width: number }[] = [];
  for (let y = 0; y < size; y += 1) {
    let start = -1;
    for (let x = 0; x <= size; x += 1) {
      const dark = x < size && matrix[y][x];
      if (dark && start < 0) start = x;
      else if (!dark && start >= 0) {
        runs.push({ x: start + quietZone, y: y + quietZone, width: x - start });
        start = -1;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      className={cn("h-full w-full", className)}
      shapeRendering="crispEdges"
      role="img"
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
    >
      <rect width={total} height={total} fill="var(--au-color-surface-fixed)" />
      {runs.map((run) => (
        <rect
          key={`${run.y}-${run.x}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
          fill="var(--au-color-text-fixed)"
        />
      ))}
    </svg>
  );
}
