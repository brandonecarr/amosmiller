import Link from "next/link";
import { getPages } from "@/lib/actions/pages";
import { format } from "date-fns";
import { FileText, Plus, Eye, EyeOff, Navigation } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { PageActions } from "./PageActions";

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: unknown[];
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  show_in_nav: boolean;
  nav_label: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const metadata = {
  title: "Pages | Admin | Amos Miller Farm",
  description: "Manage site pages",
};

export default async function AdminPagesPage() {
  const { data: pagesData } = await getPages();
  const pages: PageData[] = pagesData || [];

  // Stats
  const totalPages = pages.length;
  const publishedPages = pages.filter((p) => p.is_published).length;
  const draftPages = pages.filter((p) => !p.is_published).length;
  const navPages = pages.filter((p) => p.show_in_nav).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Pages
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            Create and manage site pages
          </p>
        </div>
        <Link href="/admin/pages/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Page
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Pages</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{totalPages}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Published</p>
          <p className="text-2xl font-bold text-green-600">{publishedPages}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Draft</p>
          <p className="text-2xl font-bold text-[var(--color-muted)]">{draftPages}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">In Nav</p>
          <p className="text-2xl font-bold text-blue-600">{navPages}</p>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        {pages.length > 0 ? (
          <table className="w-full">
            <thead className="bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Nav
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Sort Order
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Updated
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-[var(--color-slate-50)]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-[var(--color-charcoal)]">
                        {page.title}
                      </p>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        /{page.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {page.is_published ? (
                      <Badge variant="success" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {page.show_in_nav && (
                      <Badge variant="info" size="sm">
                        <Navigation className="w-3 h-3 mr-1" />
                        {page.nav_label || "Nav"}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-charcoal)]">
                      {page.sort_order}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-muted)]">
                      {format(new Date(page.updated_at), "MMM d, yyyy")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PageActions
                      pageId={page.id}
                      isPublished={page.is_published}
                      slug={page.slug}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)] mb-4">No pages found</p>
            <Link href="/admin/pages/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Page
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
