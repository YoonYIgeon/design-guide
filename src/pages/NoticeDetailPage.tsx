import type { ReactNode } from "react";
import { Badge, Button, Card } from "../lib";
import {
  IconBell,
  IconExternalLink,
  IconFileText,
  IconSettings,
  IconTrash,
} from "../lib/icons";

/**
 * 공지 상세 화면 — 프레젠테이션 전용 예시(docs/08-presentational-only.md).
 *
 * - 값은 `notice` prop 으로만 받고, 상호작용은 callback 으로 위로 올린다.
 * - 데이터 패칭/상태/라우팅은 이 컴포넌트가 아니라 하네스 페이지의 책임이다.
 * - 색/간격은 tokens 기반 유틸 클래스만 사용(하드코딩 금지).
 */
export interface Notice {
  notiNo: string;
  useYn: string;
  imprtcGbCd: string;
  notiNm: string;
  notiCn: string;
  atchFileNm?: string;
  atchWords?: string;
  atchFileUrl?: string;
  crtNm: string;
  crtDtime: string;
  lastUpdateNm?: string;
  lastUpdateDtime?: string;
}

export interface NoticeDetailProps {
  notice: Notice;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

/** 라벨 + 값 한 줄(메타 정보 그리드용). */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className="text-sm text-text">{children}</dd>
    </div>
  );
}

export function NoticeDetail({ notice, onEdit, onDelete, onBack }: NoticeDetailProps) {
  const important = notice.imprtcGbCd === "중요";
  const active = notice.useYn === "Y";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* 헤더: 배지 + 제목 + 액션 */}
      <Card
        bodyClassName="flex flex-col gap-4"
        title={
          <span className="flex items-center gap-2 text-text-muted">
            <IconBell width={16} height={16} />
            공지사항 상세
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                목록
              </Button>
            )}
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                <IconSettings width={16} height={16} />
                수정
              </Button>
            )}
            {onDelete && (
              <Button variant="danger" size="sm" onClick={onDelete}>
                <IconTrash width={16} height={16} />
                삭제
              </Button>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {important && <Badge tone="danger">{notice.imprtcGbCd}</Badge>}
          <Badge tone={active ? "success" : "neutral"}>
            {active ? "사용" : "미사용"}
          </Badge>
          <Badge tone="neutral">No. {notice.notiNo}</Badge>
        </div>

        <h1 className="text-xl font-semibold leading-snug text-text">
          {notice.notiNm}
        </h1>

        {/* 작성/수정 메타 */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-4">
          <Field label="작성자">{notice.crtNm}</Field>
          <Field label="작성일시">{notice.crtDtime}</Field>
          <Field label="최종 수정자">{notice.lastUpdateNm ?? "-"}</Field>
          <Field label="최종 수정일시">{notice.lastUpdateDtime ?? "-"}</Field>
        </dl>
      </Card>

      {/* 본문 — 줄바꿈 보존 */}
      <Card title="내용">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text">
          {notice.notiCn.trim()}
        </p>
      </Card>

      {/* 첨부파일 */}
      {notice.atchFileNm && (
        <Card title="첨부파일">
          <a
            href={notice.atchFileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-muted px-3 py-2.5 transition-colors hover:border-primary"
          >
            <span className="flex min-w-0 items-center gap-2">
              <IconFileText width={18} height={18} className="shrink-0 text-text-muted" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-text">
                  {notice.atchFileNm}
                </span>
                {notice.atchWords && (
                  <span className="text-xs text-text-muted">
                    검색어: {notice.atchWords}
                  </span>
                )}
              </span>
            </span>
            <IconExternalLink width={16} height={16} className="shrink-0 text-text-muted" />
          </a>
        </Card>
      )}
    </div>
  );
}

/**
 * 하네스 데모 페이지 — 위 프레젠테이션 컴포넌트에 샘플 데이터를 주입한다.
 * 실제 소비 시스템에서는 이 자리에서 useQuery 등으로 데이터를 받아 넘긴다.
 */
const sampleNotice: Notice = {
  notiNo: "87",
  useYn: "Y",
  imprtcGbCd: "중요",
  notiNm: "주류데이터센터 휴무일 공지",
  notiCn:
    "    주류데이터센터 6.6~6.10일까지 휴무입니다.\n신청된 주류데이터는 6.11일 이후로 순차 승인됩니다.\n\n감사합니다 :)\nDSAĐÂS\n436278432942637\n\n\n123213",
  atchFileNm: "[Remy Martin] VSOP new.png",
  atchWords: "Remy",
  atchFileUrl:
    "https://liquor-datacenter-dev.s3.ap-northeast-2.amazonaws.com/todo/20240603_155316.png",
  crtNm: "핑크플로이드(pinkfloyd)",
  crtDtime: "2024.06.03 15:53",
  lastUpdateNm: "핑크플로이드(pinkfloyd)",
  lastUpdateDtime: "2024.06.21 15:37",
};

export function NoticeDetailPage() {
  return (
    <NoticeDetail
      notice={sampleNotice}
      onBack={() => console.log("back")}
      onEdit={() => console.log("edit")}
      onDelete={() => console.log("delete")}
    />
  );
}
