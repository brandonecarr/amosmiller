import Link from "next/link";
import { format } from "date-fns";
import { MessageSquare, Filter, Star } from "lucide-react";
import { getAdminReviews } from "@/lib/actions/reviews";
import { StarRating } from "@/components/storefront/StarRating";
import { ReviewActions } from "./ReviewActions";

interface ReviewData {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  review_body: string | null;
  is_approved: boolean;
  is_imported: boolean;
  source_date: string | null;
  created_at: string;
  updated_at: string;
  products: { name: string } | null;
}

export const metadata = {
  title: "Reviews | Admin | Amos Miller Farm",
  description: "Manage product reviews",
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter;

  const filters: { is_approved?: boolean; is_imported?: boolean } = {};
  if (filter === "approved") filters.is_approved = true;
  if (filter === "pending") filters.is_approved = false;
  if (filter === "imported") filters.is_imported = true;

  const { data: reviewsData } = await getAdminReviews(filters);
  const reviews: ReviewData[] = reviewsData || [];

  const totalReviews = reviews.length;
  const approvedReviews = reviews.filter((r) => r.is_approved).length;
  const pendingReviews = reviews.filter((r) => !r.is_approved).length;
  const importedReviews = reviews.filter((r) => r.is_imported).length;
  const averageRating =
    totalReviews > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10
        ) / 10
      : 0;

  const filterTabs = [
    { label: "All", value: undefined, href: "/admin/reviews" },
    { label: "Approved", value: "approved", href: "/admin/reviews?filter=approved" },
    { label: "Pending", value: "pending", href: "/admin/reviews?filter=pending" },
    { label: "Imported", value: "imported", href: "/admin/reviews?filter=imported" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Reviews
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            Manage product reviews and ratings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Reviews</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">
            {totalReviews}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {approvedReviews}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            {pendingReviews}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Avg Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-[var(--color-charcoal)]">
              {averageRating}
            </p>
            <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Imported</p>
          <p className="text-2xl font-bold text-[var(--color-muted)]">
            {importedReviews}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-[var(--color-muted)]" />
        {filterTabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === tab.value
                ? "bg-[var(--color-primary-500)] text-white"
                : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        {reviews.length > 0 ? (
          <table className="w-full">
            <thead className="bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Author
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Rating
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Review
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {reviews.map((review) => (
                <tr
                  key={review.id}
                  className="hover:bg-[var(--color-slate-50)]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-charcoal)] truncate max-w-[180px]">
                      {review.products?.name || "Unknown Product"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-charcoal)]">
                      {review.author_name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StarRating rating={review.rating} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-muted)] truncate max-w-[250px]">
                      {review.review_body
                        ? review.review_body.length > 80
                          ? review.review_body.substring(0, 80) + "..."
                          : review.review_body
                        : "\u2014"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {review.is_approved ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                          Pending
                        </span>
                      )}
                      {review.is_imported && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          Imported
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-muted)]">
                      {format(
                        new Date(review.source_date || review.created_at),
                        "MMM d, yyyy"
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ReviewActions
                      reviewId={review.id}
                      isApproved={review.is_approved}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)]">No reviews found</p>
          </div>
        )}
      </div>
    </div>
  );
}
