import Link from "next/link";
import { getBlogPosts } from "@/lib/actions/blog";
import { format } from "date-fns";
import { FileText, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui";
import { BlogPostActions } from "./BlogPostActions";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  author_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: { full_name: string | null } | null;
}

export const metadata = {
  title: "Blog | Admin | Amos Miller Farm",
  description: "Manage blog posts",
};

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter;

  const filters: { is_published?: boolean } = {};
  if (filter === "published") filters.is_published = true;
  if (filter === "draft") filters.is_published = false;

  const { data: postsData } = await getBlogPosts(filters);
  const posts: BlogPostData[] = postsData || [];

  // Stats
  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.is_published).length;
  const draftPosts = posts.filter((p) => !p.is_published).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Blog
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            Create and manage blog posts
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Posts</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{totalPosts}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Published</p>
          <p className="text-2xl font-bold text-green-600">{publishedPosts}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Draft</p>
          <p className="text-2xl font-bold text-[var(--color-muted)]">{draftPosts}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-[var(--color-muted)]" />
        <Link
          href="/admin/blog"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            !filter
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/blog?filter=published"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filter === "published"
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          Published
        </Link>
        <Link
          href="/admin/blog?filter=draft"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filter === "draft"
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          Draft
        </Link>
      </div>

      {/* Blog Posts Table */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        {posts.length > 0 ? (
          <table className="w-full">
            <thead className="bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Author
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Tags
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Published Date
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-[var(--color-slate-50)]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-[var(--color-charcoal)]">
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate max-w-[300px]">
                          {post.excerpt.length > 80
                            ? post.excerpt.substring(0, 80) + "..."
                            : post.excerpt}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-charcoal)]">
                      {post.author?.full_name || "Unknown"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {post.is_published ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(post.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--color-slate-100)] text-[var(--color-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                      {(post.tags || []).length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--color-slate-100)] text-[var(--color-muted)]">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-muted)]">
                      {post.published_at
                        ? format(new Date(post.published_at), "MMM d, yyyy")
                        : "--"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BlogPostActions
                      postId={post.id}
                      isPublished={post.is_published}
                      slug={post.slug}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)] mb-4">No blog posts found</p>
            <Link href="/admin/blog/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
