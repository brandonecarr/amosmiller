import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BlogPostForm } from "../BlogPostForm";

export const metadata = {
  title: "New Blog Post | Admin | Amos Miller Farm",
};

export default function NewBlogPostPage() {
  return (
    <div>
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <h1 className="text-2xl font-bold text-[var(--color-charcoal)] mb-6">
        New Blog Post
      </h1>

      <BlogPostForm />
    </div>
  );
}
