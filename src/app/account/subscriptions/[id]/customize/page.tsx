"use client";

import { useState, useEffect, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, Trash2, Save, RefreshCw } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getSubscription, updateSubscriptionItems } from "@/lib/actions/subscriptions";
import { getSubscribableProducts } from "@/lib/actions/products";
import { formatCurrency, calculateSubscriptionTotal } from "@/lib/utils";

interface SubscriptionItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    base_price: number;
    sale_price: number | null;
    pricing_type: string;
    estimated_weight: number | null;
    featured_image_url: string | null;
  };
  variant?: {
    id: string;
    name: string;
    price_modifier: number;
  } | null;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  sale_price: number | null;
  pricing_type: string;
  estimated_weight: number | null;
  featured_image_url: string | null;
  subscription_frequencies: ("weekly" | "biweekly" | "monthly")[] | null;
  min_subscription_quantity: number | null;
  max_subscription_quantity: number | null;
}

interface Subscription {
  id: string;
  name: string;
  status: string;
  frequency: string;
  subscription_items: SubscriptionItem[];
  delivery_zones?: { delivery_fee: number } | null;
  shipping_zones?: { base_rate: number } | null;
}

export default function CustomizeSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [subResult, productsResult] = await Promise.all([
      getSubscription(id),
      getSubscribableProducts(),
    ]);

    if (subResult.data) {
      const sub = subResult.data as Subscription;
      setSubscription(sub);

      // Initialize items map from existing subscription items
      const itemsMap = new Map<string, number>();
      sub.subscription_items.forEach((item) => {
        itemsMap.set(item.product_id, item.quantity);
      });
      setItems(itemsMap);
    }

    if (productsResult.data) {
      setProducts(productsResult.data as Product[]);
    }

    setLoading(false);
  };

  const updateQuantity = (productId: string, quantity: number, product?: Product) => {
    const min = product?.min_subscription_quantity || 1;
    const max = product?.max_subscription_quantity || 10;

    setItems((prev) => {
      const next = new Map(prev);
      if (quantity <= 0) {
        next.delete(productId);
      } else {
        next.set(productId, Math.max(min, Math.min(max, quantity)));
      }
      return next;
    });
    setHasChanges(true);
  };

  const addProduct = (product: Product) => {
    const existing = items.get(product.id);
    if (existing) {
      updateQuantity(product.id, existing + 1, product);
    } else {
      updateQuantity(product.id, 1, product);
    }
  };

  const removeProduct = (productId: string) => {
    setItems((prev) => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!subscription) return;

    startTransition(async () => {
      const itemsArray = Array.from(items.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

      const result = await updateSubscriptionItems(subscription.id, itemsArray);

      if (result.error) {
        alert(result.error);
        return;
      }

      router.push(`/account/subscriptions/${subscription.id}`);
    });
  };

  const calculateItemPrice = (product: Product, quantity: number) => {
    const price = product.sale_price ?? product.base_price;
    if (product.pricing_type === "weight") {
      return price * (product.estimated_weight || 1) * quantity;
    }
    return price * quantity;
  };

  const getItemsForTotal = () => {
    return Array.from(items.entries()).map(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return null;
      return {
        quantity,
        product: {
          base_price: product.base_price,
          sale_price: product.sale_price,
          pricing_type: product.pricing_type,
          estimated_weight: product.estimated_weight,
        },
        variant: null,
      };
    }).filter(Boolean) as Array<{
      quantity: number;
      product: {
        base_price: number;
        sale_price: number | null;
        pricing_type: string;
        estimated_weight?: number | null;
      };
      variant?: { price_modifier: number } | null;
    }>;
  };

  const shippingFee =
    subscription?.delivery_zones?.delivery_fee ||
    subscription?.shipping_zones?.base_rate ||
    0;
  const total = calculateSubscriptionTotal(getItemsForTotal(), shippingFee);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--color-primary-500)]" />
        <p className="mt-4 text-[var(--color-muted)]">Loading...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-8 text-center">
        <p className="text-[var(--color-muted)]">Subscription not found</p>
      </div>
    );
  }

  // Get current items (those in the subscription)
  const currentProductIds = new Set(items.keys());
  const currentProducts = products.filter((p) => currentProductIds.has(p.id));
  const availableProducts = products.filter((p) => !currentProductIds.has(p.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/account/subscriptions/${subscription.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Customize Subscription
          </h1>
          <p className="text-[var(--color-muted)]">{subscription.name}</p>
        </div>
        <Button onClick={handleSave} isLoading={isPending} disabled={!hasChanges || items.size === 0}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Current Items</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {currentProducts.length === 0 ? (
                <p className="text-center text-[var(--color-muted)] py-8">
                  No items in subscription. Add products below.
                </p>
              ) : (
                <div className="space-y-3">
                  {currentProducts.map((product) => {
                    const quantity = items.get(product.id) || 0;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)]"
                      >
                        <div className="w-16 h-16 rounded-lg bg-[var(--color-cream-100)] overflow-hidden flex-shrink-0 relative">
                          {product.featured_image_url ? (
                            <Image
                              src={product.featured_image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--color-charcoal)] truncate">
                            {product.name}
                          </p>
                          <p className="text-sm text-[var(--color-primary-500)]">
                            {formatCurrency(product.sale_price ?? product.base_price)}
                            {product.pricing_type === "weight" && "/lb"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1, product)}
                            className="p-2 hover:bg-[var(--color-slate-100)] rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-medium">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1, product)}
                            className="p-2 hover:bg-[var(--color-slate-100)] rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="font-medium">
                            {formatCurrency(calculateItemPrice(product, quantity))}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add More Items */}
          {availableProducts.length > 0 && (
            <Card variant="default">
              <CardHeader className="border-b border-[var(--color-border)]">
                <CardTitle>Add More Products</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary-300)] transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[var(--color-cream-100)] overflow-hidden flex-shrink-0 relative">
                        {product.featured_image_url ? (
                          <Image
                            src={product.featured_image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] text-xs">
                            IMG
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[var(--color-charcoal)] truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-[var(--color-primary-500)]">
                          {formatCurrency(product.sale_price ?? product.base_price)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addProduct(product)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">Items</span>
                  <span>{items.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">Subtotal</span>
                  <span>{formatCurrency(total - shippingFee)}</span>
                </div>
                {shippingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-muted)]">Delivery</span>
                    <span>{formatCurrency(shippingFee)}</span>
                  </div>
                )}
                <div className="border-t border-[var(--color-border)] pt-3 flex justify-between font-medium">
                  <span>Total per delivery</span>
                  <span className="text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasChanges && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                You have unsaved changes. Click &quot;Save Changes&quot; to apply them to your
                subscription.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
