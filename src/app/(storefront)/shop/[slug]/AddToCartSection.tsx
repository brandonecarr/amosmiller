"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Heart, Share2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { trackAddToCart, trackViewItem } from "@/components/analytics/GoogleAnalytics";
import { fbTrackAddToCart, fbTrackViewContent } from "@/components/analytics/FacebookPixel";

interface Product {
  id: string;
  name: string;
  slug: string;
  stock_quantity: number;
  pricing_type: "fixed" | "weight";
  base_price: number;
  sale_price: number | null;
  weight_unit: "lb" | "oz" | "kg" | "g";
  estimated_weight: number | null;
  featured_image_url: string | null;
  tags?: string[];
  is_subscribable?: boolean;
  subscription_frequencies?: ("weekly" | "biweekly" | "monthly")[];
  min_subscription_quantity?: number;
  max_subscription_quantity?: number;
}

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

export function AddToCartSection({ product }: { product: Product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<"weekly" | "biweekly" | "monthly">(
    product.subscription_frequencies?.[0] || "monthly"
  );
  const { addItem } = useCart();
  const isOutOfStock = product.stock_quantity === 0;
  const isSubscribable = product.is_subscribable && (product.subscription_frequencies?.length ?? 0) > 0;

  useEffect(() => {
    const price = product.sale_price ?? product.base_price;
    trackViewItem({
      id: product.id,
      name: product.name,
      price,
    });
    fbTrackViewContent({
      contentName: product.name,
      value: price,
    });
  }, [product.id, product.name, product.sale_price, product.base_price]);

  const incrementQuantity = () => {
    if (quantity < product.stock_quantity) {
      setQuantity((q) => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAddToCart = () => {
    const price = product.sale_price ?? product.base_price;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      pricingType: product.pricing_type,
      basePrice: product.base_price,
      salePrice: product.sale_price,
      weightUnit: product.weight_unit,
      estimatedWeight: product.estimated_weight,
      quantity,
      imageUrl: product.featured_image_url,
      isCoopItem: product.tags?.includes("co-op") ?? false,
    });
    trackAddToCart({ id: product.id, name: product.name, price, quantity });
    fbTrackAddToCart({ value: price * quantity, contentName: product.name });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleSubscribe = () => {
    const params = new URLSearchParams({
      product: product.id,
      quantity: quantity.toString(),
      frequency: selectedFrequency,
    });
    router.push(`/account/subscriptions/new?${params.toString()}`);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isOutOfStock
              ? "bg-red-500"
              : product.stock_quantity < 10
              ? "bg-orange-500"
              : "bg-emerald-500"
          }`}
        />
        <span className="text-sm text-slate-600">
          {isOutOfStock
            ? "Out of Stock"
            : product.stock_quantity < 10
            ? `Only ${product.stock_quantity} left`
            : "In Stock"}
        </span>
      </div>

      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700">Quantity:</span>
          <div className="flex items-center border border-slate-200 rounded-xl">
            <button
              type="button"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="p-3 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-xl"
            >
              <Minus className="w-4 h-4 text-slate-600" />
            </button>
            <span className="w-12 text-center font-medium text-slate-900">{quantity}</span>
            <button
              type="button"
              onClick={incrementQuantity}
              disabled={quantity >= product.stock_quantity}
              className="p-3 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-xl"
            >
              <Plus className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {/* Purchase Type Toggle */}
      {isSubscribable && !isOutOfStock && (
        <div className="flex rounded-xl border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => setShowSubscribe(false)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              !showSubscribe
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            One-time
          </button>
          <button
            type="button"
            onClick={() => setShowSubscribe(true)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              showSubscribe
                ? "bg-orange-500 text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Subscribe
          </button>
        </div>
      )}

      {/* Subscription Frequency Selector */}
      {showSubscribe && isSubscribable && !isOutOfStock && (
        <div className="space-y-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <p className="text-sm font-medium text-slate-900">
            Delivery Frequency
          </p>
          <div className="flex flex-wrap gap-2">
            {product.subscription_frequencies?.map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setSelectedFrequency(freq)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedFrequency === freq
                    ? "border-orange-500 bg-white text-orange-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-orange-300"
                }`}
              >
                {frequencyLabels[freq]}
              </button>
            ))}
          </div>
          <p className="text-xs text-orange-600">
            Save 10% on all subscription orders. Skip or cancel anytime.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {showSubscribe && isSubscribable ? (
          <Button
            size="lg"
            className="flex-1"
            disabled={isOutOfStock}
            onClick={handleSubscribe}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Subscribe & Save 10%
          </Button>
        ) : (
          <Button
            size="lg"
            className="flex-1"
            disabled={isOutOfStock || justAdded}
            onClick={handleAddToCart}
          >
            {justAdded ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </>
            )}
          </Button>
        )}
        <Button variant="secondary" size="lg">
          <Heart className="w-5 h-5" />
        </Button>
        <Button variant="secondary" size="lg">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {product.pricing_type === "weight" && !isOutOfStock && (
        <p className="text-sm text-slate-400">
          Note: Final price will be calculated based on actual weight when your order is packed.
        </p>
      )}
    </div>
  );
}
