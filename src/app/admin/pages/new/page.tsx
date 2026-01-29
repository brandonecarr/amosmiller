import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageForm } from "../PageForm";

export const metadata = {
  title: "Create Page | Admin | Amos Miller Farm",
};

export default function NewPagePage() {
  return (
    <div>
      <Link
        href="/admin/pages"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pages
      </Link>

      <h1 className="text-2xl font-bold text-[var(--color-charcoal)] mb-6">
        Create Page
      </h1>

      <PageForm />
    </div>
  );
}
