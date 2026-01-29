"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, formatWeightPrice } from "@/lib/utils";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    inventoryWarnings,
    validateInventory,
    clearInventoryWarnings,
    isSyncing,
  } = useCart();

  // Validate inventory when page loads
  useEffect(() => {
    if (items.length > 0) {
      validateInventory();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">
          Your cart is empty
        </h1>
        <p className="text-slate-500 mb-6">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Link href="/shop">
          <Button size="lg" className="rounded-full bg-slate-900 hover:bg-slate-800 text-white">
            Start Shopping
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-slate-900">
          Shopping Cart
        </h1>
        <button
          onClick={() => validateInventory()}
          disabled={isSyncing}
          className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 disabled:opacity-50"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Check availability
        </button>
      </div>

      {/* Inventory Warnings */}
      {inventoryWarnings.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800 mb-2">
                Some items have limited availability
              </h3>
              <ul className="space-y-1 text-sm text-amber-700">
                {inventoryWarnings.map((warning) => (
                  <li key={warning.productId}>
                    <strong>{warning.name}</strong>:{" "}
                    {warning.removed
                      ? "No longer available (removed from cart)"
                      : `Only ${warning.available} available (quantity adjusted)`}
                  </li>
                ))}
              </ul>
              <button
                onClick={clearInventoryWarnings}
                className="mt-3 text-sm text-amber-600 hover:text-amber-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.salePrice ?? item.basePrice;
            const itemTotal =
              item.pricingType === "weight" && item.estimatedWeight
                ? price * item.estimatedWeight * item.quantity
                : price * item.quantity;

            const hasWarning = inventoryWarnings.some(
              (w) => w.productId === item.productId && !w.removed
            );

            return (
              <div
                key={item.id}
                className={`flex gap-4 p-4 bg-white rounded-2xl border transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
                  hasWarning
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200"
                }`}
              >
                {/* Product Image */}
                <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/${item.slug}`}
                    className="font-medium text-slate-900 hover:text-orange-500 transition-colors"
                  >
                    {item.name}
                  </Link>

                  {item.isBundle && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                      Bundle
                    </span>
                  )}

                  <div className="mt-1 text-sm text-slate-500">
                    {item.pricingType === "weight" ? (
                      <>
                        {formatWeightPrice(price, item.weightUnit)}
                        {item.estimatedWeight && (
                          <span> (~{item.estimatedWeight} {item.weightUnit})</span>
                        )}
                      </>
                    ) : (
                      formatCurrency(price)
                    )}
                  </div>

                  {hasWarning && (
                    <p className="text-xs text-amber-600 mt-1">
                      Limited stock - quantity adjusted
                    </p>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-slate-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-slate-50 transition-colors rounded-l-lg"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="w-10 text-center font-medium text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-slate-50 transition-colors rounded-r-lg"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {formatCurrency(itemTotal)}
                  </p>
                  {item.pricingType === "weight" && (
                    <p className="text-xs text-slate-500 mt-1">
                      Est. price
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="text-slate-500">
                  Calculated at checkout
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="text-slate-500">
                  Calculated at checkout
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mb-6">
              <div className="flex justify-between">
                <span className="font-bold text-slate-900">
                  Estimated Total
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Final prices for weight-based items will be determined when packed.
              </p>
            </div>

            <Link href="/checkout" className="block">
              <Button size="lg" className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white">
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link
              href="/shop"
              className="block text-center text-sm text-orange-500 hover:text-orange-600 hover:underline mt-4"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
