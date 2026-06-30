"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.18)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
        CRM unavailable
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-rose-950">
        We couldn&apos;t load the CRM workspace.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-700">
        {error.message || "An unexpected error interrupted the CRM request."}
      </p>
      <Button
        type="button"
        onClick={reset}
        className="mt-5 rounded-full"
      >
        Try again
      </Button>
    </div>
  );
}
