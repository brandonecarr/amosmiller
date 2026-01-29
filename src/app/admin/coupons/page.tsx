import Link from "next/link";
import { getCoupons } from "@/lib/actions/coupons";
import { formatCurrency } from "@/lib/utils";
import { Tag, Plus, Filter, Calendar, Percent, DollarSign, Truck } from "lucide-react";
import { Button } from "@/components/ui";
import { CouponActions } from "./CouponActions";

interface CouponData {
  id: string;
  code: string;
  description: string | null;
  coupon_type: "percentage" | "fixed" | "free_shipping";
  value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  max_uses: number | null;
  used_count: number;
  max_uses_per_user: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export const metadata = {
  title: "Coupons | Admin | Amos Miller Farm",
  description: "Manage discount coupons",
};

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter;

  const filters: { is_active?: boolean } = {};
  if (filter === "active") filters.is_active = true;
  if (filter === "inactive") filters.is_active = false;

  const { data: couponsData } = await getCoupons(filters);
  const coupons: CouponData[] = couponsData || [];

  // Stats
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.is_active).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
  const expiredCoupons = coupons.filter(
    (c) => c.valid_until && new Date(c.valid_until) < new Date()
  ).length;

  const couponTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="w-4 h-4" />;
      case "fixed":
        return <DollarSign className="w-4 h-4" />;
      case "free_shipping":
        return <Truck className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const couponTypeLabel = (type: string, value: number) => {
    switch (type) {
      case "percentage":
        return `${value}% off`;
      case "fixed":
        return `${formatCurrency(value)} off`;
      case "free_shipping":
        return "Free shipping";
      default:
        return type;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Coupons
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            Create and manage discount coupons
          </p>
        </div>
        <Link href="/admin/coupons/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Coupons</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{totalCoupons}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCoupons}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Uses</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{totalUses}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Expired</p>
          <p className="text-2xl font-bold text-[var(--color-muted)]">{expiredCoupons}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-[var(--color-muted)]" />
        <Link
          href="/admin/coupons"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            !filter
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/coupons?filter=active"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filter === "active"
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          Active
        </Link>
        <Link
          href="/admin/coupons?filter=inactive"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filter === "inactive"
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          Inactive
        </Link>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        {coupons.length > 0 ? (
          <table className="w-full">
            <thead className="bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Code
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Discount
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Usage
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Valid Period
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {coupons.map((coupon) => {
                const isExpired =
                  coupon.valid_until && new Date(coupon.valid_until) < new Date();
                const isMaxedOut =
                  coupon.max_uses && coupon.used_count >= coupon.max_uses;

                return (
                  <tr key={coupon.id} className="hover:bg-[var(--color-slate-50)]">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-mono font-semibold text-[var(--color-charcoal)]">
                          {coupon.code}
                        </p>
                        {coupon.description && (
                          <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate max-w-[200px]">
                            {coupon.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)]">
                          {couponTypeIcon(coupon.coupon_type)}
                        </span>
                        <div>
                          <p className="font-medium text-[var(--color-charcoal)]">
                            {couponTypeLabel(coupon.coupon_type, coupon.value)}
                          </p>
                          {coupon.min_order_amount && (
                            <p className="text-xs text-[var(--color-muted)]">
                              Min. {formatCurrency(coupon.min_order_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-charcoal)]">
                        {coupon.used_count}
                        {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {coupon.valid_from || coupon.valid_until ? (
                          <div className="flex items-center gap-1 text-[var(--color-muted)]">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {coupon.valid_from
                                ? new Date(coupon.valid_from).toLocaleDateString()
                                : "No start"}
                              {" - "}
                              {coupon.valid_until
                                ? new Date(coupon.valid_until).toLocaleDateString()
                                : "No end"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--color-muted)]">No restrictions</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isExpired ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          Expired
                        </span>
                      ) : isMaxedOut ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                          Maxed Out
                        </span>
                      ) : coupon.is_active ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CouponActions couponId={coupon.id} isActive={coupon.is_active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 mx-auto mb-4 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)] mb-4">No coupons found</p>
            <Link href="/admin/coupons/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Coupon
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
