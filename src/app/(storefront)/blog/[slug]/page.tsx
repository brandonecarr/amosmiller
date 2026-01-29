import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { Badge } from "@/components/ui";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/actions/blog";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { format } from "date-fns";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await getBlogPostBySlug(slug);

  if (!post) return {};

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      images: post.featured_image_url
        ? [post.featured_image_url]
        : undefined,
      type: "article",
      publishedTime: post.published_at || undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post } = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Fetch related posts (latest 3, excluding current)
  const { data: relatedPosts } = await getBlogPosts({
    is_published: true,
    limit: 4,
  });
  const related = (relatedPosts || [])
    .filter((p: { id: string }) => p.id !== post.id)
    .slice(0, 3);

  return (
    <article>
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center text-sm text-slate-500 hover:text-orange-500 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Blog
      </Link>

      {/* Article Header */}
      <header className="mb-8">
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {post.author?.full_name && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author.full_name}
            </span>
          )}
          {post.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(post.published_at), "MMMM d, yyyy")}
            </span>
          )}
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag: string) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                <Badge variant="outline" size="sm">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="mb-8 rounded-2xl overflow-hidden">
          <Image
            src={post.featured_image_url}
            alt={post.title}
            width={1200}
            height={675}
            className="w-full max-h-[500px] object-cover rounded-2xl"
          />
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div
          className="tiptap max-w-3xl prose prose-slate prose-a:text-orange-500 prose-a:hover:text-orange-600 text-slate-600"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />
      )}

      {/* Related Posts */}
      {related.length > 0 && (
        <div className="mt-16 pt-8 border-t border-slate-200">
          <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">
            More from Our Blog
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map(
              (relPost: {
                id: string;
                title: string;
                slug: string;
                excerpt: string | null;
                featured_image_url: string | null;
                published_at: string | null;
              }) => (
                <Link
                  key={relPost.id}
                  href={`/blog/${relPost.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-[16/10] bg-slate-50 overflow-hidden relative">
                      {relPost.featured_image_url ? (
                        <Image
                          src={relPost.featured_image_url}
                          alt={relPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl text-slate-500">
                            ✍
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-semibold text-slate-900 group-hover:text-orange-500 transition-colors mb-1">
                        {relPost.title}
                      </h3>
                      {relPost.published_at && (
                        <p className="text-xs text-slate-500">
                          {format(
                            new Date(relPost.published_at),
                            "MMM d, yyyy"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </article>
  );
}
