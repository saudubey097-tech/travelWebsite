"use client";

import { TriangleAlert, RotateCw } from "lucide-react";

export function ErrorState({
  message = "Something went wrong loading this.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
      <TriangleAlert className="mx-auto h-5 w-5 text-red-600" aria-hidden />
      <p className="mt-2 font-body text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 font-body text-sm text-red-700 underline"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </button>
      )}
    </div>
  );
}
