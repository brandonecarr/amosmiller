import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBlogPost } from "@/lib/actions/blog";
import { BlogPostForm } from "../BlogPostForm";

export const metadata = {
  title: "Edit Blog Post | Admin | Amos Miller Farm",
};

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: post, error } = await getBlogPost(id);

  if (error || !post) {
    notFound();
  }

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
        Edit Post: {post.title}
      </h1>

      <BlogPostForm post={post} />
    </div>
  );
}
