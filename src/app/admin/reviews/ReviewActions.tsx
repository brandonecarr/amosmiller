"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { toggleReviewApproval, adminDeleteReview } from "@/lib/actions/reviews";

export function ReviewActions({
  reviewId,
  isApproved,
}: {
  reviewId: string;
  isApproved: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    await toggleReviewApproval(reviewId);
    setOpen(false);
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setLoading(true);
    await adminDeleteReview(reviewId);
    setOpen(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded hover:bg-[var(--color-slate-100)]"
        disabled={loading}
      >
        <MoreHorizontal className="w-5 h-5 text-[var(--color-muted)]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1">
            <button
              onClick={handleToggle}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-charcoal)] hover:bg-[var(--color-slate-50)] w-full text-left"
            >
              {isApproved ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Unapprove
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" />
                  Approve
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
