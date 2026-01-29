import { createClient } from "@/lib/supabase/server";
import { getProductReviews, getProductReviewSummary, getUserReviewForProduct, hasUserPurchasedProduct } from "@/lib/actions/reviews";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function ProductReviews({ productId, productSlug }: ProductReviewsProps) {
  const [{ data: reviews }, summary, { data: existingReview }] = await Promise.all([
    getProductReviews(productId),
    getProductReviewSummary(productId),
    getUserReviewForProduct(productId),
  ]);

  // Check auth for the review form
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName: string | null = null;
  let hasPurchased = false;
  if (user) {
    const [{ data: profile }, purchased] = await Promise.all([
      (supabase as any)
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single(),
      hasUserPurchasedProduct(productId),
    ]);
    userName = profile?.full_name || null;
    hasPurchased = purchased;
  }

  const hasReviews = summary.totalCount > 0;

  return (
    <div>
      <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6 font-heading flex items-center gap-2">
        <MessageSquare className="w-6 h-6" />
        Customer Reviews
        {hasReviews && (
          <span className="text-base font-normal text-slate-400">
            ({summary.totalCount})
          </span>
        )}
      </h2>

      {/* Aggregate Summary */}
      {hasReviews && (
        <div className="rounded-2xl bg-slate-50 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Average Rating */}
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-4xl font-bold text-slate-900 font-heading">
                {summary.averageRating.toFixed(1)}
              </span>
              <StarRating rating={summary.averageRating} size="md" />
              <span className="text-sm text-slate-500 mt-1">
                Based on {summary.totalCount} review{summary.totalCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.ratingDistribution[star] || 0;
                const percent = summary.totalCount > 0
                  ? (count / summary.totalCount) * 100
                  : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-right text-slate-500 shrink-0">
                      {star} ★
                    </span>
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-slate-400 shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Form or Login/Purchase Prompt */}
      <div className="mb-8">
        {user ? (
          hasPurchased ? (
            <ReviewForm
              productId={productId}
              productSlug={productSlug}
              existingReview={existingReview}
              userName={userName}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
              <p className="text-slate-500">
                Only verified buyers can leave a review for this product.
              </p>
            </div>
          )
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
            <p className="text-slate-500">
              <Link
                href={`/auth/login?redirect=/shop/${productSlug}`}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Log in
              </Link>{" "}
              to write a review
            </p>
          </div>
        )}
      </div>

      {/* Review List */}
      {hasReviews ? (
        <div className="divide-y divide-slate-100">
          {reviews.map((review: any) => (
            <div key={review.id} className="py-6 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-semibold shrink-0">
                  {getInitials(review.author_name)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-slate-900 text-sm">
                      {review.author_name}
                    </span>
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-slate-400">
                      {formatDate(review.source_date || review.created_at)}
                    </span>
                  </div>

                  {/* Body */}
                  {review.review_body && (
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {review.review_body}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-400">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      )}
    </div>
  );
}
