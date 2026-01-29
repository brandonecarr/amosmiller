"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Tag } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { createCoupon, updateCoupon } from "@/lib/actions/coupons";

interface CouponFormProps {
  coupon?: {
    id: string;
    code: string;
    description: string | null;
    coupon_type: "percentage" | "fixed" | "free_shipping";
    value: number;
    min_order_amount: number | null;
    max_discount_amount: number | null;
    max_uses: number | null;
    max_uses_per_user: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
  };
}

export function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const isEditing = !!coupon;

  const [code, setCode] = useState(coupon?.code || "");
  const [description, setDescription] = useState(coupon?.description || "");
  const [couponType, setCouponType] = useState<"percentage" | "fixed" | "free_shipping">(
    coupon?.coupon_type || "percentage"
  );
  const [value, setValue] = useState(coupon?.value?.toString() || "");
  const [minOrderAmount, setMinOrderAmount] = useState(
    coupon?.min_order_amount?.toString() || ""
  );
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(
    coupon?.max_discount_amount?.toString() || ""
  );
  const [maxUses, setMaxUses] = useState(coupon?.max_uses?.toString() || "");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState(
    coupon?.max_uses_per_user?.toString() || "1"
  );
  const [validFrom, setValidFrom] = useState(
    coupon?.valid_from ? coupon.valid_from.split("T")[0] : ""
  );
  const [validUntil, setValidUntil] = useState(
    coupon?.valid_until ? coupon.valid_until.split("T")[0] : ""
  );
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = {
      code: code.toUpperCase(),
      description: description || null,
      coupon_type: couponType,
      value: parseFloat(value) || 0,
      min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : null,
      max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      max_uses_per_user: parseInt(maxUsesPerUser) || 1,
      valid_from: validFrom ? new Date(validFrom).toISOString() : null,
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      is_active: isActive,
      applies_to_products: [] as string[],
      applies_to_categories: [] as string[],
    };

    const result = isEditing
      ? await updateCoupon(coupon.id, formData)
      : await createCoupon(formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/admin/coupons");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
          Basic Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Coupon Code *
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20"
              required
              className="font-mono"
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Customers will enter this code at checkout
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internal description (not shown to customers)"
            />
          </div>
        </div>
      </div>

      {/* Discount Type */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
          Discount Type
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "percentage" as const, label: "Percentage", desc: "e.g. 20% off" },
              { value: "fixed" as const, label: "Fixed Amount", desc: "e.g. $10 off" },
              { value: "free_shipping" as const, label: "Free Shipping", desc: "Waive shipping fee" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setCouponType(type.value)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  couponType === type.value
                    ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]"
                }`}
              >
                <p className="font-medium text-[var(--color-charcoal)]">{type.label}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">{type.desc}</p>
              </button>
            ))}
          </div>

          {couponType !== "free_shipping" && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                {couponType === "percentage" ? "Discount Percentage *" : "Discount Amount *"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                  {couponType === "percentage" ? "%" : "$"}
                </span>
                <Input
                  type="number"
                  min="0"
                  step={couponType === "percentage" ? "1" : "0.01"}
                  max={couponType === "percentage" ? "100" : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>
          )}

          {couponType === "percentage" && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Maximum Discount Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="No limit"
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Cap the maximum discount (leave empty for no limit)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Restrictions */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
          Restrictions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Minimum Order Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="No minimum"
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Maximum Total Uses
            </label>
            <Input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Uses Per Customer
            </label>
            <Input
              type="number"
              min="1"
              value={maxUsesPerUser}
              onChange={(e) => setMaxUsesPerUser(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
          Valid Period
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Start Date
            </label>
            <Input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Leave empty to start immediately
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              End Date
            </label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Leave empty for no expiration
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[var(--color-charcoal)]">Active</h2>
            <p className="text-sm text-[var(--color-muted)]">
              Inactive coupons cannot be used at checkout
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary-300)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary-500)]" />
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? "Update Coupon" : "Create Coupon"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/coupons")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
