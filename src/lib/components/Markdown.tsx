import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "../utils/cn";

export interface MarkdownProps {
  /** 렌더링할 마크다운 원문(제어값). */
  children: string;
  className?: string;
}

/**
 * 프레젠테이션 전용 마크다운 렌더러.
 * - 값(마크다운 문자열)은 props 로만 받고, 데이터 패칭/상태 없음.
 * - 스타일은 디자인 토큰(--au-*) 기반 Tailwind 유틸리티만 사용(하드코딩 금지).
 * - 링크는 새 탭 + noopener 로 안전하게 엽니다.
 *   (docs/08-presentational-only.md)
 *
 * 참고: 기본 CommonMark 만 지원합니다. 표·취소선 등 GFM 문법이 필요하면
 * 소비 시스템에서 remark-gfm 을 추가해 이 컴포넌트를 확장하세요.
 */
const components: Components = {
  h1: ({ node: _node, ...p }) => (
    <h1 className="mb-3 mt-6 text-xl font-semibold text-text first:mt-0" {...p} />
  ),
  h2: ({ node: _node, ...p }) => (
    <h2 className="mb-2 mt-5 text-lg font-semibold text-text first:mt-0" {...p} />
  ),
  h3: ({ node: _node, ...p }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-text first:mt-0" {...p} />
  ),
  p: ({ node: _node, ...p }) => <p className="my-3 leading-relaxed" {...p} />,
  a: ({ node: _node, ...p }) => (
    <a
      className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
      target="_blank"
      rel="noopener noreferrer"
      {...p}
    />
  ),
  ul: ({ node: _node, ...p }) => <ul className="my-3 list-disc space-y-1 pl-5" {...p} />,
  ol: ({ node: _node, ...p }) => <ol className="my-3 list-decimal space-y-1 pl-5" {...p} />,
  li: ({ node: _node, ...p }) => <li className="leading-relaxed" {...p} />,
  blockquote: ({ node: _node, ...p }) => (
    <blockquote
      className="my-3 border-l-2 border-line pl-4 text-text-muted"
      {...p}
    />
  ),
  hr: ({ node: _node, ...p }) => <hr className="my-5 border-line" {...p} />,
  strong: ({ node: _node, ...p }) => <strong className="font-semibold text-text" {...p} />,
  code: ({ node: _node, ...p }) => (
    <code
      className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.85em] text-text"
      {...p}
    />
  ),
  pre: ({ node: _node, ...p }) => (
    <pre
      className="my-3 overflow-x-auto rounded-md bg-surface-muted p-4 text-[0.85em] leading-relaxed [&_code]:bg-transparent [&_code]:p-0"
      {...p}
    />
  ),
};

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("text-sm text-text", className)}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
