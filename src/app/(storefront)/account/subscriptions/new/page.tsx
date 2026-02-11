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
  Search,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
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
  category_id: string | null;
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

// Subscription cart storage key
const SUBSCRIPTION_CART_KEY = "subscription_cart_items";

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

  // Product browsing state
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

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
      const allProducts = productsResult.data as Product[];
      setProducts(allProducts);

      // Load existing cart from localStorage
      const savedCartItems = loadSubscriptionCart(allProducts);

      // Check if product is passed via URL params (user clicked "Subscribe" on a product page)
      const productId = searchParams.get("product");
      const qty = parseInt(searchParams.get("quantity") || "1");
      const freq = searchParams.get("frequency") as "weekly" | "biweekly" | "monthly" | null;

      let mergedItems = [...savedCartItems];

      if (productId) {
        const product = allProducts.find((p) => p.id === productId);
        if (product) {
          // Check if product already exists in cart
          const existingIndex = mergedItems.findIndex((item) => item.productId === productId);
          if (existingIndex >= 0) {
            // Update quantity
            mergedItems[existingIndex].quantity += qty;
          } else {
            // Add new item
            mergedItems.push({ productId, product, quantity: qty });
          }

          if (freq && ["weekly", "biweekly", "monthly"].includes(freq)) {
            setFrequency(freq);
          }
        }
      }

      setItems(mergedItems);
      saveSubscriptionCart(mergedItems);

      // Set recommendations based on cart items' categories
      if (mergedItems.length > 0) {
        const cartCategories = mergedItems.map((item) => item.product.category_id).filter(Boolean);
        const categoryProducts = allProducts.filter(
          (p) =>
            cartCategories.includes(p.category_id) &&
            !mergedItems.some((item) => item.productId === p.id)
        );
        const recommendedProducts =
          categoryProducts.length > 0
            ? categoryProducts.slice(0, 6)
            : allProducts.filter((p) => !mergedItems.some((item) => item.productId === p.id)).slice(0, 6);
        setRecommendations(recommendedProducts);
      } else {
        // No items in cart, show random recommendations
        setRecommendations(allProducts.slice(0, 8));
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
      const newItems = [...items, { productId: product.id, product, quantity: 1 }];
      setItems(newItems);
      saveSubscriptionCart(newItems);
    }
  };

  const removeProduct = (productId: string) => {
    const newItems = items.filter((i) => i.productId !== productId);
    setItems(newItems);
    saveSubscriptionCart(newItems);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const newItems = items.map((item) => {
      if (item.productId !== productId) return item;
      const min = item.product.min_subscription_quantity || 1;
      const max = item.product.max_subscription_quantity || 10;
      const newQty = Math.max(min, Math.min(max, quantity));
      return { ...item, quantity: newQty };
    });
    setItems(newItems);
    saveSubscriptionCart(newItems);
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

  // Save subscription cart to localStorage
  const saveSubscriptionCart = (cartItems: SubscriptionItem[]) => {
    try {
      localStorage.setItem(
        SUBSCRIPTION_CART_KEY,
        JSON.stringify(
          cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        )
      );
    } catch (error) {
      console.error("Failed to save subscription cart:", error);
    }
  };

  // Load subscription cart from localStorage
  const loadSubscriptionCart = (allProducts: Product[]): SubscriptionItem[] => {
    try {
      const saved = localStorage.getItem(SUBSCRIPTION_CART_KEY);
      if (!saved) return [];

      const savedItems = JSON.parse(saved) as { productId: string; quantity: number }[];
      return savedItems
        .map((savedItem) => {
          const product = allProducts.find((p) => p.id === savedItem.productId);
          if (!product) return null;
          return {
            productId: savedItem.productId,
            product,
            quantity: savedItem.quantity,
          };
        })
        .filter((item): item is SubscriptionItem => item !== null);
    } catch (error) {
      console.error("Failed to load subscription cart:", error);
      return [];
    }
  };

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

      // Clear subscription cart after successful creation
      localStorage.removeItem(SUBSCRIPTION_CART_KEY);
      router.push(`/account/subscriptions/${result.data?.id}`);
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500" />
        <p className="mt-4 text-slate-500">Loading...</p>
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
          <h1 className="text-2xl font-bold font-heading text-slate-900">
            New Subscription
          </h1>
          <p className="text-slate-500">
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
                  ? "bg-orange-500 text-white"
                  : s < step
                  ? "bg-orange-100 text-orange-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {s}
            </button>
            <span
              className={`text-sm ${
                s === step ? "font-medium text-slate-900" : "text-slate-500"
              }`}
            >
              {s === 1 ? "Products" : s === 2 ? "Schedule" : "Delivery"}
            </span>
            {s < 3 && <div className="w-8 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Products */}
          {step === 1 && (
            <>
              {/* Your Subscription Items */}
              {items.length > 0 && (
                <Card variant="default">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      Your Subscription Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {items.map((item) => {
                        const product = item.product;
                        return (
                          <div
                            key={item.productId}
                            className="flex items-center gap-4 p-3 rounded-2xl border border-orange-500 bg-orange-50"
                          >
                            <div className="w-16 h-16 rounded-xl bg-white overflow-hidden flex-shrink-0 relative">
                              {product.featured_image_url ? (
                                <Image
                                  src={product.featured_image_url}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-sm text-orange-500">
                                {formatCurrency(product.sale_price ?? product.base_price)}
                                {product.pricing_type === "weight" && "/lb"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(product.id, item.quantity - 1)}
                                className="p-1 hover:bg-white rounded"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(product.id, item.quantity + 1)}
                                className="p-1 hover:bg-white rounded"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeProduct(product.id)}
                                className="p-1 hover:bg-red-100 text-red-500 rounded ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Products */}
              {recommendations.length > 0 && (
                <Card variant="default">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {items.length > 0 ? "Add More Products" : "Recommended for You"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recommendations.map((product) => {
                        const inCart = items.find((i) => i.productId === product.id);
                        return (
                          <div
                            key={product.id}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                              inCart
                                ? "border-orange-500 bg-orange-50"
                                : "border-slate-200 hover:border-orange-300"
                            }`}
                          >
                            <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0 relative">
                              {product.featured_image_url ? (
                                <Image
                                  src={product.featured_image_url}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 text-sm truncate">
                                {product.name}
                              </p>
                              <p className="text-sm text-orange-500">
                                {formatCurrency(product.sale_price ?? product.base_price)}
                                {product.pricing_type === "weight" && "/lb"}
                              </p>
                            </div>
                            {!inCart && (
                              <Button variant="outline" size="sm" onClick={() => addProduct(product)}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Browse All Products (Collapsible) */}
              <Card variant="default">
                <button
                  onClick={() => setShowAllProducts(!showAllProducts)}
                  className="w-full text-left"
                >
                  <CardHeader className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Browse All Products
                      </span>
                      {showAllProducts ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </button>
                {showAllProducts && (
                  <CardContent className="p-4">
                    {/* Search Bar */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* All Products List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {products
                        .filter((product) =>
                          product.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((product) => {
                          const inCart = items.find((i) => i.productId === product.id);
                          return (
                            <div
                              key={product.id}
                              className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                                inCart
                                  ? "border-orange-500 bg-orange-50"
                                  : "border-slate-200 hover:border-orange-300"
                              }`}
                            >
                              <div className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0 relative">
                                {product.featured_image_url ? (
                                  <Image
                                    src={product.featured_image_url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 text-sm truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-orange-500">
                                  {formatCurrency(product.sale_price ?? product.base_price)}
                                  {product.pricing_type === "weight" && "/lb"}
                                </p>
                              </div>
                              {!inCart && (
                                <Button variant="outline" size="sm" onClick={() => addProduct(product)}>
                                  <Plus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                )}
              </Card>

              <div className="flex items-center justify-between">
                <Link href="/shop">
                  <Button variant="outline">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>
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
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Delivery Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Subscription Name (Optional)
                    </label>
                    <Input
                      value={subscriptionName}
                      onChange={(e) => setSubscriptionName(e.target.value)}
                      placeholder="e.g., Weekly Essentials, Monthly Box"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-3">
                      How often would you like delivery?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["weekly", "biweekly", "monthly"] as const).map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setFrequency(freq)}
                          className={`p-4 rounded-2xl border-2 transition-colors text-center ${
                            frequency === freq
                              ? "border-orange-500 bg-orange-50"
                              : "border-slate-200 hover:border-orange-300"
                          }`}
                        >
                          <RefreshCw
                            className={`w-6 h-6 mx-auto mb-2 ${
                              frequency === freq
                                ? "text-orange-500"
                                : "text-slate-500"
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
                <CardHeader className="border-b border-slate-200">
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
                        className={`p-4 rounded-2xl border-2 transition-colors text-center ${
                          fulfillmentType === type
                            ? "border-orange-500 bg-orange-50"
                            : "border-slate-200 hover:border-orange-300"
                        }`}
                      >
                        <p className="font-medium capitalize">{type}</p>
                      </button>
                    ))}
                  </div>

                  {fulfillmentType === "pickup" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-3">
                        Select Pickup Location
                      </label>
                      <div className="space-y-2">
                        {locations
                          .filter((l) => l.type === "pickup")
                          .map((location) => (
                            <label
                              key={location.id}
                              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                                fulfillmentLocationId === location.id
                                  ? "border-orange-500 bg-orange-50"
                                  : "border-slate-200 hover:border-orange-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="location"
                                value={location.id}
                                checked={fulfillmentLocationId === location.id}
                                onChange={() => setFulfillmentLocationId(location.id)}
                                className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                              />
                              <div>
                                <p className="font-medium">{location.name}</p>
                                {location.city && (
                                  <p className="text-sm text-slate-500">
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
                      <label className="block text-sm font-medium text-slate-900">
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
            <CardHeader className="border-b border-slate-200">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {items.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
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

                  <div className="border-t border-slate-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Subscription Discount (10%)</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg pt-2 border-t border-slate-200">
                      <span>Total per {frequencyLabels[frequency].toLowerCase()}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-orange-50 rounded-2xl p-4">
            <h3 className="font-medium text-slate-900 mb-2">
              Subscription Benefits
            </h3>
            <ul className="text-sm text-slate-600 space-y-1">
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
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      }
    >
      <NewSubscriptionContent />
    </Suspense>
  );
}
