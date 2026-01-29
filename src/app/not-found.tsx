import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-primary-100)] flex items-center justify-center mb-6">
          <Home className="w-8 h-8 text-[var(--color-primary-500)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-charcoal)] mb-2">
          Page Not Found
        </h1>
        <p className="text-[var(--color-muted)] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-[var(--color-primary-500)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-600)] transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/shop"
            className="px-6 py-2.5 border border-[var(--color-border)] rounded-lg font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-slate-50)] transition-colors"
          >
            Browse Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
