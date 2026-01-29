"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { getSubscribableProducts } from "@/lib/actions/products";
import { getFulfillmentLocations } from "@/lib/actions/fulfillment-locations";
import { createSubscription } from "@/lib/actions/subscriptions";
import { formatCurrency } from "@/lib/utils";

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

interface FulfillmentLocation {
  id: string;
  name: string;
  type: string;
  city: string | null;
  state: string | null;
}

interface SubscriptionItem {
  productId: string;
  product: Product;
  quantity: number;
}

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

function NewSubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<FulfillmentLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [subscriptionName, setSubscriptionName] = useState("");
  const [items, setItems] = useState<SubscriptionItem[]>([]);
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery" | "shipping">("pickup");
  const [fulfillmentLocationId, setFulfillmentLocationId] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [productsResult, locationsResult] = await Promise.all([
      getSubscribableProducts(),
      getFulfillmentLocations(),
    ]);

    if (productsResult.data) {
      setProducts(productsResult.data as Product[]);

      // If product is passed via URL params, add it
      const productId = searchParams.get("product");
      const qty = parseInt(searchParams.get("quantity") || "1");
      const freq = searchParams.get("frequency") as "weekly" | "biweekly" | "monthly" | null;

      if (productId) {
        const product = (productsResult.data as Product[]).find((p) => p.id === productId);
        if (product) {
          setItems([{ productId, product, quantity: qty }]);
          if (freq && ["weekly", "biweekly", "monthly"].includes(freq)) {
            setFrequency(freq);
          }
        }
      }
    }

    if (locationsResult.data) {
      setLocations(locationsResult.data as FulfillmentLocation[]);
    }

    setLoading(false);
  };

  const addProduct = (product: Product) => {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      setItems([...items, { productId: product.id, product, quantity: 1 }]);
    }
  };

  const removeProduct = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems(
      items.map((item) => {
        if (item.productId !== productId) return item;
        const min = item.product.min_subscription_quantity || 1;
        const max = item.product.max_subscription_quantity || 10;
        const newQty = Math.max(min, Math.min(max, quantity));
        return { ...item, quantity: newQty };
      })
    );
  };

  const calculateItemPrice = (item: SubscriptionItem) => {
    const price = item.product.sale_price ?? item.product.base_price;
    if (item.product.pricing_type === "weight") {
      return price * (item.product.estimated_weight || 1) * item.quantity;
    }
    return price * item.quantity;
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  const discount = subtotal * 0.1; // 10% subscription discount
  const total = subtotal - discount;

  const handleSubmit = async () => {
    if (items.length === 0) return;

    startTransition(async () => {
      const result = await createSubscription({
        name: subscriptionName || `Subscription - ${new Date().toLocaleDateString()}`,
        frequency,
        fulfillmentType,
        fulfillmentLocationId: fulfillmentType === "pickup" ? fulfillmentLocationId : undefined,
        shippingAddress: fulfillmentType !== "pickup" ? shippingAddress : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      router.push(`/account/subscriptions/${result.data?.id}`);
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--color-primary-500)]" />
        <p className="mt-4 text-[var(--color-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/subscriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            New Subscription
          </h1>
          <p className="text-[var(--color-muted)]">
            Set up recurring delivery of your favorite products
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => s < step && setStep(s)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? "bg-[var(--color-primary-500)] text-white"
                  : s < step
                  ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
                  : "bg-[var(--color-slate-100)] text-[var(--color-muted)]"
              }`}
            >
              {s}
            </button>
            <span
              className={`text-sm ${
                s === step ? "font-medium text-[var(--color-charcoal)]" : "text-[var(--color-muted)]"
              }`}
            >
              {s === 1 ? "Products" : s === 2 ? "Schedule" : "Delivery"}
            </span>
            {s < 3 && <div className="w-8 h-px bg-[var(--color-border)]" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Products */}
          {step === 1 && (
            <>
              <Card variant="default">
                <CardHeader className="border-b border-[var(--color-border)]">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Select Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {products.map((product) => {
                      const inCart = items.find((i) => i.productId === product.id);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary-300)] transition-colors"
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
                          {inCart ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(product.id, inCart.quantity - 1)}
                                className="p-1 hover:bg-[var(--color-slate-100)] rounded"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center">{inCart.quantity}</span>
                              <button
                                onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
                                className="p-1 hover:bg-[var(--color-slate-100)] rounded"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeProduct(product.id)}
                                className="p-1 hover:bg-red-50 text-red-500 rounded ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => addProduct(product)}>
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={items.length === 0}>
                  Continue to Schedule
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <>
              <Card variant="default">
                <CardHeader className="border-b border-[var(--color-border)]">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Delivery Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
                      Subscription Name (Optional)
                    </label>
                    <Input
                      value={subscriptionName}
                      onChange={(e) => setSubscriptionName(e.target.value)}
                      placeholder="e.g., Weekly Essentials, Monthly Box"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-3">
                      How often would you like delivery?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["weekly", "biweekly", "monthly"] as const).map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setFrequency(freq)}
                          className={`p-4 rounded-lg border-2 transition-colors text-center ${
                            frequency === freq
                              ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                              : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]"
                          }`}
                        >
                          <RefreshCw
                            className={`w-6 h-6 mx-auto mb-2 ${
                              frequency === freq
                                ? "text-[var(--color-primary-500)]"
                                : "text-[var(--color-muted)]"
                            }`}
                          />
                          <p className="font-medium">{frequencyLabels[freq]}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>Continue to Delivery</Button>
              </div>
            </>
          )}

          {/* Step 3: Delivery */}
          {step === 3 && (
            <>
              <Card variant="default">
                <CardHeader className="border-b border-[var(--color-border)]">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    {(["pickup", "delivery", "shipping"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFulfillmentType(type)}
                        className={`p-4 rounded-lg border-2 transition-colors text-center ${
                          fulfillmentType === type
                            ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                            : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]"
                        }`}
                      >
                        <p className="font-medium capitalize">{type}</p>
                      </button>
                    ))}
                  </div>

                  {fulfillmentType === "pickup" && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-3">
                        Select Pickup Location
                      </label>
                      <div className="space-y-2">
                        {locations
                          .filter((l) => l.type === "pickup")
                          .map((location) => (
                            <label
                              key={location.id}
                              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                fulfillmentLocationId === location.id
                                  ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                                  : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]"
                              }`}
                            >
                              <input
                                type="radio"
                                name="location"
                                value={location.id}
                                checked={fulfillmentLocationId === location.id}
                                onChange={() => setFulfillmentLocationId(location.id)}
                                className="w-4 h-4 text-[var(--color-primary-500)]"
                              />
                              <div>
                                <p className="font-medium">{location.name}</p>
                                {location.city && (
                                  <p className="text-sm text-[var(--color-muted)]">
                                    {location.city}, {location.state}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}

                  {(fulfillmentType === "delivery" || fulfillmentType === "shipping") && (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-[var(--color-charcoal)]">
                        Delivery Address
                      </label>
                      <Input
                        placeholder="Address Line 1"
                        value={shippingAddress.line1}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, line1: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Address Line 2 (optional)"
                        value={shippingAddress.line2}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, line2: e.target.value })
                        }
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          placeholder="City"
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, city: e.target.value })
                          }
                        />
                        <Input
                          placeholder="State"
                          value={shippingAddress.state}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, state: e.target.value })
                          }
                        />
                        <Input
                          placeholder="ZIP Code"
                          value={shippingAddress.postalCode}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  isLoading={isPending}
                  disabled={
                    (fulfillmentType === "pickup" && !fulfillmentLocationId) ||
                    (fulfillmentType !== "pickup" && !shippingAddress.line1)
                  }
                >
                  Create Subscription
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {items.length === 0 ? (
                <p className="text-[var(--color-muted)] text-sm text-center py-4">
                  No items selected
                </p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>
                        {item.product.name} x{item.quantity}
                      </span>
                      <span>{formatCurrency(calculateItemPrice(item))}</span>
                    </div>
                  ))}

                  <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Subscription Discount (10%)</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg pt-2 border-t border-[var(--color-border)]">
                      <span>Total per {frequencyLabels[frequency].toLowerCase()}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-[var(--color-primary-50)] rounded-xl p-4">
            <h3 className="font-medium text-[var(--color-primary-800)] mb-2">
              Subscription Benefits
            </h3>
            <ul className="text-sm text-[var(--color-primary-700)] space-y-1">
              <li>10% off every order</li>
              <li>Skip or pause anytime</li>
              <li>Modify items before each delivery</li>
              <li>Priority fulfillment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--color-primary-500)]" />
          <p className="mt-4 text-[var(--color-muted)]">Loading...</p>
        </div>
      }
    >
      <NewSubscriptionContent />
    </Suspense>
  );
}
