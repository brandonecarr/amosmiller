"use client";

import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

interface SubscriptionItem {
  id: string;
  quantity: number;
  is_customizable: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price: number | null;
    pricing_type: string;
    weight_unit?: string;
    estimated_weight?: number | null;
    featured_image_url?: string | null;
  };
  variant?: {
    id: string;
    name: string;
    price_modifier: number;
  } | null;
}

interface SubscriptionItemsListProps {
  items: SubscriptionItem[];
}

export function SubscriptionItemsList({ items }: SubscriptionItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-[var(--color-muted)]">
        No items in this subscription
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {items.map((item) => {
        const price = item.product.sale_price ?? item.product.base_price;
        const variantMod = item.variant?.price_modifier || 0;
        const unitPrice = price + variantMod;
        const isWeightBased = item.product.pricing_type === "weight";
        const totalPrice = isWeightBased
          ? unitPrice * (item.product.estimated_weight || 1) * item.quantity
          : unitPrice * item.quantity;

        return (
          <div key={item.id} className="px-6 py-4 flex items-center gap-4">
            {/* Product Image */}
            <div className="w-16 h-16 rounded-lg bg-[var(--color-slate-50)] overflow-hidden flex-shrink-0">
              {item.product.featured_image_url ? (
                <Image
                  src={item.product.featured_image_url}
                  alt={item.product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">
                  <span className="text-2xl">🥩</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-[var(--color-charcoal)] truncate">
                {item.product.name}
              </h4>
              <div className="text-sm text-[var(--color-muted)]">
                {item.variant && (
                  <span className="mr-2">{item.variant.name}</span>
                )}
                <span>Qty: {item.quantity}</span>
                {isWeightBased && item.product.estimated_weight && (
                  <span className="ml-2">
                    (~{item.product.estimated_weight} {item.product.weight_unit || "lb"} each)
                  </span>
                )}
              </div>
              {item.is_customizable && (
                <span className="inline-flex items-center px-2 py-0.5 mt-1 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] rounded text-xs">
                  Customizable
                </span>
              )}
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className="font-medium text-[var(--color-charcoal)]">
                {formatCurrency(totalPrice)}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {formatCurrency(unitPrice)}
                {isWeightBased ? `/${item.product.weight_unit || "lb"}` : " each"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
