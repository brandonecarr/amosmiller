import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CouponForm } from "../CouponForm";

export const metadata = {
  title: "Create Coupon | Admin | Amos Miller Farm",
};

export default function NewCouponPage() {
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
        Create Coupon
      </h1>

      <CouponForm />
    </div>
  );
}
