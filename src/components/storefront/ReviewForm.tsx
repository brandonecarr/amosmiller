"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarRatingInput } from "./StarRatingInput";
import { createReview, updateReview } from "@/lib/actions/reviews";

interface ReviewFormProps {
  productId: string;
  productSlug: string;
  existingReview?: {
    id: string;
    rating: number;
    review_body: string | null;
    author_name: string;
  } | null;
  userName?: string | null;
}

export function ReviewForm({
  productId,
  productSlug,
  existingReview,
  userName,
}: ReviewFormProps) {
  const router = useRouter();
  const isEditing = !!existingReview;

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [reviewBody, setReviewBody] = useState(existingReview?.review_body || "");
  const [authorName, setAuthorName] = useState(
    existingReview?.author_name || userName || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isEditing);

  if (success) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
        <p className="text-green-800 font-medium">
          {isEditing ? "Your review has been updated!" : "Thank you for your review!"}
        </p>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-300 p-6 text-center transition-colors"
      >
        <p className="text-slate-500 font-medium">
          {isEditing ? "Edit your review" : "Write a review"}
        </p>
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }
    if (!authorName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = isEditing
        ? await updateReview(existingReview!.id, {
            rating,
            review_body: reviewBody || null,
            author_name: authorName.trim(),
          })
        : await createReview({
            product_id: productId,
            rating,
            review_body: reviewBody || null,
            author_name: authorName.trim(),
          });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 font-heading mb-4">
        {isEditing ? "Edit Your Review" : "Write a Review"}
      </h3>

      <div className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Rating
          </label>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        {/* Author Name */}
        <div>
          <label htmlFor="author_name" className="block text-sm font-medium text-slate-700 mb-1">
            Your Name
          </label>
          <input
            id="author_name"
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-slate-300 transition-colors"
          />
        </div>

        {/* Review Body */}
        <div>
          <label htmlFor="review_body" className="block text-sm font-medium text-slate-700 mb-1">
            Your Review <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="review_body"
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            maxLength={2000}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-slate-300 transition-colors resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting
              ? "Submitting..."
              : isEditing
                ? "Update Review"
                : "Submit Review"}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="rounded-full px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
