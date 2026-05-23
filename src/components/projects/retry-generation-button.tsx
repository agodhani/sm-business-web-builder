"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RetryGenerationButtonProps = {
  projectSlug: string;
};

export function RetryGenerationButton({ projectSlug }: RetryGenerationButtonProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setIsRetrying(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectSlug}/retry`, {
        method: "POST"
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(body?.message ?? "Retry failed.");
      }
      router.refresh();
      router.push(`/projects/${projectSlug}`);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Retry failed.");
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void retry()} className="secondary-button" disabled={isRetrying}>
        {isRetrying ? "Retrying..." : "Retry Generation"}
      </button>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
