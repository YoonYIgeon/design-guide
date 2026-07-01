import { Card, EmptyState } from "../lib";

export function PlaceholderPage({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card title={label}>
        <EmptyState
          title={`${label} 화면 준비 중`}
          description="이 화면은 데모 스캐폴드입니다. 각 소비 시스템에서 도메인 로직을 채웁니다."
        />
      </Card>
    </div>
  );
}
