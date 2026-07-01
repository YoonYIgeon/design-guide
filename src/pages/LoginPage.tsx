import { useState, type FormEvent } from "react";
import { Button, Input } from "../lib";
import { IconShield } from "../lib/icons";
import { useLogin } from "../api/hooks";
import { setToken, toErrorMessage } from "../api/client";
import type { SessionUser } from "../api/auth";

export interface LoginPageProps {
  brand?: string;
  onSuccess: (user: SessionUser) => void;
}

export function LoginPage({ brand = "사내 관리자", onSuccess }: LoginPageProps) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useLogin();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!id.trim() || !pw) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    mutate(
      { id: id.trim(), password: pw },
      {
        onSuccess: (res) => {
          setToken(res.token);
          onSuccess(res.user);
        },
        onError: (err) => setError(toErrorMessage(err, "로그인에 실패했습니다.")),
      },
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* 브랜드 */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconShield width={26} height={26} />
          </span>
          <h1 className="text-lg font-semibold text-text">{brand}</h1>
          <p className="text-sm text-text-muted">격리망 관리자 콘솔에 로그인하세요.</p>
        </div>

        {/* 로그인 카드 */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 shadow-2"
          noValidate
        >
          <Input
            label="아이디"
            autoComplete="username"
            placeholder="사내 계정 아이디"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setError(null);
            }}
            required
          />
          <Input
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(null);
            }}
            required
          />

          {error && (
            <div
              role="alert"
              className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" loading={isPending} className="w-full">
            로그인
          </Button>

          <p className="text-center text-xs text-text-muted">
            데모 계정: <code className="font-mono">admin</code> /{" "}
            <code className="font-mono">admin1234</code>
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-text-muted">
          외부망과 분리된 사내 전용 시스템입니다. · v0.1.0
        </p>
      </div>
    </div>
  );
}
