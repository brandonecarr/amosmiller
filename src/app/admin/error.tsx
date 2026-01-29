"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <Card variant="default" className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-charcoal)] mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-[var(--color-muted)] mb-2">
            An error occurred while loading this page.
          </p>
          {error.message && (
            <p className="text-xs text-[var(--color-muted)] bg-[var(--color-slate-50)] rounded-lg p-3 mb-6 font-mono break-all">
              {error.message}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2 bg-[var(--color-primary-500)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-600)] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/admin"
              className="px-5 py-2 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-slate-50)] transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
