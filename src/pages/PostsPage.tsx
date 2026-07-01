import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Markdown, Modal } from "../lib";
import { IconFileText, IconPlus } from "../lib/icons";
import { usePost, usePosts, useCreatePost } from "../api/posts.queries";

/**
 * 컨테이너 페이지 예시 — axios + react-query + react-markdown 사용법 데모.
 *
 * 역할 분담(docs/08-presentational-only.md, docs/09-data-fetching.md):
 * - 데이터 패칭/상태는 이 하네스 페이지가 react-query 훅(../api/*)으로 관리한다.
 * - 그리기는 라이브러리(src/lib)의 프레젠테이션 컴포넌트에 위임한다.
 *   (본문 마크다운은 <Markdown> 이 렌더링)
 *
 * 소비 시스템은 이 파일을 포크해 자신의 리소스/화면에 맞게 고쳐 씁니다.
 */
export function PostsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", body: "" });

  const list = usePosts();
  const detail = usePost(selectedId);
  const createPost = useCreatePost();

  function openModal() {
    setForm({ title: "", author: "", body: "" });
    setModalOpen(true);
  }

  function submitModal() {
    createPost.mutate(
      {
        title: form.title.trim() || "제목 없음",
        author: form.author.trim() || "익명",
        body: form.body,
      },
      {
        onSuccess: (created) => {
          setModalOpen(false);
          setSelectedId(created.id);
        },
      },
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
      {/* 목록 */}
      <Card
        title="게시글"
        action={
          <Button variant="primary" size="sm" onClick={openModal}>
            <IconPlus width={16} height={16} />
            새 글
          </Button>
        }
        bodyClassName="p-0"
      >
        {list.isLoading && (
          <p className="p-4 text-sm text-text-muted">불러오는 중…</p>
        )}
        {list.isError && (
          <p className="p-4 text-sm text-danger">
            목록을 불러오지 못했습니다: {list.error.message}
          </p>
        )}
        {list.data && list.data.length === 0 && (
          <div className="p-4">
            <EmptyState
              title="게시글이 없습니다"
              description="오른쪽 위 ‘새 글’ 로 첫 글을 추가해 보세요."
            />
          </div>
        )}
        {list.data && list.data.length > 0 && (
          <ul className="divide-y divide-line">
            {list.data.map((post) => {
              const active = post.id === selectedId;
              return (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(post.id)}
                    className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors hover:bg-surface-muted ${
                      active ? "bg-surface-muted" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-text">{post.title}</span>
                    <span className="text-xs text-text-muted">
                      {post.author} · {post.createdAt}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* 상세 (마크다운 렌더링) */}
      <Card title="본문" bodyClassName="min-h-[16rem]">
        {selectedId == null && (
          <EmptyState
            icon={<IconFileText width={28} height={28} />}
            title="게시글을 선택하세요"
            description="왼쪽 목록에서 글을 고르면 마크다운 본문이 여기 표시됩니다."
          />
        )}
        {selectedId != null && detail.isLoading && (
          <p className="text-sm text-text-muted">불러오는 중…</p>
        )}
        {selectedId != null && detail.isError && (
          <p className="text-sm text-danger">
            본문을 불러오지 못했습니다: {detail.error.message}
          </p>
        )}
        {detail.data && (
          <article>
            <header className="mb-4 border-b border-line pb-3">
              <h2 className="text-lg font-semibold text-text">{detail.data.title}</h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                <Badge tone="neutral">{detail.data.author}</Badge>
                <span>{detail.data.createdAt}</span>
              </div>
            </header>
            <Markdown>{detail.data.body}</Markdown>
          </article>
        )}
      </Card>

      {/* 새 글 작성 모달 */}
      <Modal
        open={modalOpen}
        title="새 게시글"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={submitModal} disabled={createPost.isPending}>
              {createPost.isPending ? "저장 중…" : "저장"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="제목"
            required
            placeholder="예: 릴리스 노트 v0.2.0"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            label="작성자"
            placeholder="예: 홍길동"
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">
              본문 <span className="text-text-muted">(마크다운)</span>
            </span>
            <textarea
              className="min-h-[8rem] rounded-md border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
              placeholder={"## 소제목\n- 항목 1\n- 항목 2"}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
          </label>
          {createPost.isError && (
            <p className="text-sm text-danger">
              저장에 실패했습니다: {createPost.error.message}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
