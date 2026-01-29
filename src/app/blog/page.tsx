import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Calendar, User, Tag } from "lucide-react";
import { Badge } from "@/components/ui";
import { getBlogPosts, getAllBlogTags } from "@/lib/actions/blog";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Farm Blog",
  description:
    "News, recipes, and updates from Amos Miller Farm.",
};

interface BlogPageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag: activeTag } = await searchParams;

  const [postsResult, tagsResult] = await Promise.all([
    getBlogPosts({
      is_published: true,
      tag: activeTag || undefined,
    }),
    getAllBlogTags(),
  ]);

  const posts = postsResult.data || [];
  const tags = (tagsResult.data || []) as string[];

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-[var(--color-charcoal)] mb-3">
          Farm Blog
        </h1>
        <p className="text-lg text-[var(--color-muted)]">
          News, recipes, and updates from our farm
        </p>
      </div>

      {/* Tags Filter */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/blog"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeTag
                ? "bg-[var(--color-primary-500)] text-white"
                : "bg-[var(--color-slate-100)] text-[var(--color-charcoal)] hover:bg-[var(--color-slate-200)]"
            }`}
          >
            All
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTag === tag
                  ? "bg-[var(--color-primary-500)] text-white"
                  : "bg-[var(--color-slate-100)] text-[var(--color-charcoal)] hover:bg-[var(--color-slate-200)]"
              }`}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-[var(--color-muted)]">
            {activeTag
              ? `No posts found with tag "${activeTag}".`
              : "No blog posts yet. Check back soon!"}
          </p>
          {activeTag && (
            <Link
              href="/blog"
              className="inline-block mt-4 text-[var(--color-primary-500)] hover:underline"
            >
              View all posts
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(
            (post: {
              id: string;
              title: string;
              slug: string;
              excerpt: string | null;
              featured_image_url: string | null;
              published_at: string | null;
              tags: string[];
              author: { full_name: string | null } | null;
            }) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group"
              >
                <article className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                  {/* Featured Image */}
                  <div className="aspect-[16/10] bg-[var(--color-cream-100)] overflow-hidden relative">
                    {post.featured_image_url ? (
                      <Image
                        src={post.featured_image_url}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl text-[var(--color-muted)]">
                          ✍
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="text-lg font-semibold text-[var(--color-charcoal)] group-hover:text-[var(--color-primary-500)] transition-colors mb-2">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-sm text-[var(--color-muted)] mb-4 flex-1 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-[var(--color-muted)] mt-auto pt-3 border-t border-[var(--color-border)]">
                      {post.author?.full_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {post.author.full_name}
                        </span>
                      )}
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(
                            new Date(post.published_at),
                            "MMM d, yyyy"
                          )}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" size="sm">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
