import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center py-16">
      <Card variant="default" className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-slate-100)] flex items-center justify-center mb-6">
            <FileQuestion className="w-7 h-7 text-[var(--color-muted)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-charcoal)] mb-2">
            Page Not Found
          </h1>
          <p className="text-sm text-[var(--color-muted)] mb-6">
            The admin page you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
          <Link
            href="/admin"
            className="inline-flex px-5 py-2 bg-[var(--color-primary-500)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-600)] transition-colors"
          >
            Back to Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
