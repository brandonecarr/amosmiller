import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPage } from "@/lib/actions/pages";
import { PageForm } from "../PageForm";

export const metadata = {
  title: "Edit Page | Admin | Amos Miller Farm",
};

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: page, error } = await getPage(id);

  if (error || !page) {
    notFound();
  }

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
        Edit Page: {page.title}
      </h1>

      <PageForm page={page} />
    </div>
  );
}
