"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toggleCouponActive, deleteCoupon } from "@/lib/actions/coupons";

export function CouponActions({
  couponId,
  isActive,
}: {
  couponId: string;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    await toggleCouponActive(couponId);
    setOpen(false);
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    setLoading(true);
    await deleteCoupon(couponId);
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
            <Link
              href={`/admin/coupons/${couponId}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-charcoal)] hover:bg-[var(--color-slate-50)]"
              onClick={() => setOpen(false)}
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handleToggle}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-charcoal)] hover:bg-[var(--color-slate-50)] w-full text-left"
            >
              {isActive ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" />
                  Activate
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
