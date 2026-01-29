import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCoupon } from "@/lib/actions/coupons";
import { CouponForm } from "../CouponForm";

export const metadata = {
  title: "Edit Coupon | Admin | Amos Miller Farm",
};

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: coupon, error } = await getCoupon(id);

  if (error || !coupon) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/coupons"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Coupons
      </Link>

      <h1 className="text-2xl font-bold text-[var(--color-charcoal)] mb-6">
        Edit Coupon: {coupon.code}
      </h1>

      <CouponForm coupon={coupon} />
    </div>
  );
}
