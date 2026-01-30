"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Truck,
  Package,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Tag,
  Gift,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { FulfillmentSelector } from "./FulfillmentSelector";
import { DateSelector } from "./DateSelector";
import { PaymentForm } from "./PaymentForm";
import { validateCoupon } from "@/lib/actions/coupons";
import { validateGiftCard } from "@/lib/actions/gift-cards";
import { createOrder, validateInventory } from "@/lib/actions/orders";
import { calculateTax } from "@/lib/actions/tax";
import { MEMBERSHIP_FEE } from "@/lib/constants";
import { trackBeginCheckout, trackPurchase } from "@/components/analytics/GoogleAnalytics";
import { fbTrackInitiateCheckout, fbTrackPurchase } from "@/components/analytics/FacebookPixel";

interface Location {
  id: string;
  name: string;
  type: "pickup" | "delivery" | "shipping";
  is_coop: boolean;
  description: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  instructions: string | null;
}

interface DeliveryZone {
  id: string;
  name: string;
  description: string | null;
  zip_codes: string[];
  delivery_fee: number;
  free_delivery_minimum: number | null;
  min_order_amount: number | null;
}

interface ShippingZone {
  id: string;
  name: string;
  description: string | null;
  states: string[];
  base_rate: number;
  per_lb_rate: number;
  free_shipping_minimum: number | null;
  min_order_amount: number | null;
}

interface CheckoutContentProps {
  locations: Location[];
  deliveryZones: DeliveryZone[];
  shippingZones: ShippingZone[];
  userId?: string | null;
  userEmail?: string | null;
  userFullName?: string | null;
  userPhone?: string | null;
  storeCreditBalance?: number;
  isMember?: boolean;
}

type Step = "fulfillment" | "details" | "payment";

export function CheckoutContent({
  locations,
  deliveryZones,
  shippingZones,
  userId: initialUserId,
  userEmail,
  userFullName,
  userPhone,
  storeCreditBalance: initialStoreCreditBalance = 0,
  isMember = false,
}: CheckoutContentProps) {
  const router = useRouter();
  const { items, subtotal, fulfillment, setFulfillment, clearCart, hasCoopItems } = useCart();
  const [currentStep, setCurrentStep] = useState<Step>("fulfillment");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [orderError, setOrderError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  // Customer details state - pre-fill from logged in user
  const [customerDetails, setCustomerDetails] = useState(() => {
    const nameParts = userFullName?.split(" ") || [];
    return {
      email: userEmail || "",
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      phone: userPhone || "",
    };
  });

  // Shipping address state (for delivery/shipping)
  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  // Customer notes
  const [customerNotes, setCustomerNotes] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount: number;
    freeShipping: boolean;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    id: string;
    code: string;
    balance: number;
    amountToUse: number;
  } | null>(null);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  // Store credit state - pre-fill from server
  const [storeCreditBalance] = useState(initialStoreCreditBalance);
  const [useStoreCredit, setUseStoreCredit] = useState(false);
  const [storeCreditAmount, setStoreCreditAmount] = useState(0);

  // Tax state
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxDescription, setTaxDescription] = useState<string | null>(null);

  // Calculate fees
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);

  // Membership fee: $35 one-time fee for non-members
  const membershipFee = isMember ? 0 : MEMBERSHIP_FEE;

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderId) {
      router.push("/cart");
    }
  }, [items.length, router, orderId]);

  // Calculate delivery fee when zone is selected
  useEffect(() => {
    if (fulfillment.type === "delivery" && fulfillment.zoneId) {
      const zone = deliveryZones.find((z) => z.id === fulfillment.zoneId);
      if (zone) {
        // Check if coupon gives free shipping
        if (appliedCoupon?.freeShipping) {
          setDeliveryFee(0);
        } else if (zone.free_delivery_minimum && subtotal >= zone.free_delivery_minimum) {
          setDeliveryFee(0);
        } else {
          setDeliveryFee(zone.delivery_fee);
        }
      }
    } else {
      setDeliveryFee(0);
    }
  }, [fulfillment.type, fulfillment.zoneId, subtotal, deliveryZones, appliedCoupon]);

  // Calculate shipping fee when zone is selected
  useEffect(() => {
    if (fulfillment.type === "shipping" && fulfillment.zoneId) {
      const zone = shippingZones.find((z) => z.id === fulfillment.zoneId);
      if (zone) {
        // Check if coupon gives free shipping
        if (appliedCoupon?.freeShipping) {
          setShippingFee(0);
        } else if (zone.free_shipping_minimum && subtotal >= zone.free_shipping_minimum) {
          setShippingFee(0);
        } else {
          // Estimate weight from cart items
          const estimatedWeight = items.reduce((sum, item) => {
            if (item.pricingType === "weight" && item.estimatedWeight) {
              return sum + item.estimatedWeight * item.quantity;
            }
            return sum + item.quantity; // Assume 1 lb per unit for fixed items
          }, 0);
          setShippingFee(zone.base_rate + zone.per_lb_rate * estimatedWeight);
        }
      }
    } else {
      setShippingFee(0);
    }
  }, [fulfillment.type, fulfillment.zoneId, subtotal, items, shippingZones, appliedCoupon]);

  // Calculate store credit amount to use
  useEffect(() => {
    if (useStoreCredit && storeCreditBalance > 0) {
      const remainingAfterDiscounts = subtotal + deliveryFee + shippingFee + membershipFee - (appliedCoupon?.discount || 0) - (appliedGiftCard?.amountToUse || 0);
      const amountToUse = Math.min(storeCreditBalance, Math.max(0, remainingAfterDiscounts));
      setStoreCreditAmount(amountToUse);
    } else {
      setStoreCreditAmount(0);
    }
  }, [useStoreCredit, storeCreditBalance, subtotal, deliveryFee, shippingFee, membershipFee, appliedCoupon, appliedGiftCard]);

  // Calculate tax when shipping state is set
  useEffect(() => {
    const calculateTaxAmount = async () => {
      const shippingState = fulfillment.type !== "pickup" ? shippingAddress.state : undefined;
      if (shippingState || fulfillment.type === "pickup") {
        const result = await calculateTax({
          subtotal: subtotal - (appliedCoupon?.discount || 0),
          shippingState,
        });
        setTaxAmount(result.taxAmount);
        setTaxDescription(result.taxDescription);
      }
    };
    calculateTaxAmount();
  }, [subtotal, shippingAddress.state, fulfillment.type, appliedCoupon]);

  // Calculate totals
  const discountAmount = appliedCoupon?.discount || 0;
  const giftCardAmount = appliedGiftCard?.amountToUse || 0;
  const totalBeforeCredits = subtotal + deliveryFee + shippingFee + membershipFee + taxAmount - discountAmount;
  const totalBeforeGiftCard = totalBeforeCredits - storeCreditAmount;
  const total = Math.max(0, totalBeforeGiftCard - giftCardAmount);

  const pickupLocations = locations.filter((l) => l.type === "pickup");

  const canProceedFromFulfillment = () => {
    if (!fulfillment.type) return false;
    if (fulfillment.type === "pickup" && !fulfillment.locationId) return false;
    if (fulfillment.type === "delivery" && !fulfillment.zoneId) return false;
    if (fulfillment.type === "shipping" && !fulfillment.zoneId) return false;
    if (!fulfillment.scheduledDate) return false;
    return true;
  };

  const canProceedFromDetails = () => {
    if (!customerDetails.email || !customerDetails.firstName || !customerDetails.lastName)
      return false;
    if (fulfillment.type === "delivery" || fulfillment.type === "shipping") {
      if (
        !shippingAddress.line1 ||
        !shippingAddress.city ||
        !shippingAddress.state ||
        !shippingAddress.postalCode
      )
        return false;
    }
    return true;
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    startTransition(async () => {
      const result = await validateCoupon(
        couponCode,
        subtotal,
        items.map((i) => i.productId),
        []
      );

      if (result.valid && result.coupon) {
        setAppliedCoupon({
          id: result.coupon.id,
          code: result.coupon.code,
          discount: result.discount,
          freeShipping: result.freeShipping,
        });
        setCouponCode("");
      } else {
        setCouponError(result.error || "Invalid coupon");
      }
      setCouponLoading(false);
    });
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Apply gift card
  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;

    setGiftCardLoading(true);
    setGiftCardError(null);

    startTransition(async () => {
      const result = await validateGiftCard(giftCardCode);

      if (result.valid && result.giftCard) {
        // Calculate how much to use from gift card
        const remaining = totalBeforeGiftCard - (appliedGiftCard?.amountToUse || 0);
        const amountToUse = Math.min(result.availableBalance, remaining);

        setAppliedGiftCard({
          id: result.giftCard.id,
          code: result.giftCard.code,
          balance: result.giftCard.current_balance,
          amountToUse,
        });
        setGiftCardCode("");
      } else {
        setGiftCardError(result.error || "Invalid gift card");
      }
      setGiftCardLoading(false);
    });
  };

  // Remove gift card
  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardError(null);
  };

  // Create order and get payment intent
  const handleProceedToPayment = async () => {
    setIsProcessing(true);
    setOrderError(null);

    // Validate inventory first
    const inventoryCheck = await validateInventory(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
    );

    if (!inventoryCheck.valid) {
      setOrderError(inventoryCheck.errors.join("; "));
      setIsProcessing(false);
      return;
    }

    // Track begin checkout
    trackBeginCheckout({ value: subtotal, itemCount: items.length });
    fbTrackInitiateCheckout({ value: subtotal, numItems: items.length });

    // Create order
    const orderResult = await createOrder({
      email: customerDetails.email,
      firstName: customerDetails.firstName,
      lastName: customerDetails.lastName,
      phone: customerDetails.phone || undefined,
      fulfillmentType: fulfillment.type!,
      fulfillmentLocationId: fulfillment.locationId,
      deliveryZoneId: fulfillment.type === "delivery" ? fulfillment.zoneId : null,
      shippingZoneId: fulfillment.type === "shipping" ? fulfillment.zoneId : null,
      scheduledDate: fulfillment.scheduledDate!,
      shippingAddress:
        fulfillment.type !== "pickup"
          ? {
              line1: shippingAddress.line1,
              line2: shippingAddress.line2 || undefined,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postalCode: shippingAddress.postalCode,
              country: "US",
            }
          : null,
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        sku: null,
        quantity: item.quantity,
        unitPrice: item.salePrice ?? item.basePrice,
        pricingType: item.pricingType,
        estimatedWeight: item.estimatedWeight,
      })),
      subtotal,
      shippingFee: deliveryFee + shippingFee,
      membershipFee,
      taxAmount,
      discountAmount,
      couponCode: appliedCoupon?.code,
      giftCardCode: appliedGiftCard?.code,
      giftCardId: appliedGiftCard?.id,
      giftCardAmountUsed: giftCardAmount,
      storeCreditUsed: storeCreditAmount,
      customerNotes: customerNotes || undefined,
    });

    if (orderResult.error) {
      setOrderError(orderResult.error);
      setIsProcessing(false);
      return;
    }

    setOrderId(orderResult.data?.order?.id || null);
    setOrderNumber(orderResult.data?.order?.order_number || null);

    // If total is 0, order is complete (fully paid with credits/gift cards)
    if (total === 0 || !orderResult.data?.clientSecret) {
      // Track purchase
      trackPurchase({
        transactionId: String(orderResult.data?.order?.order_number || orderResult.data?.order?.id),
        value: total,
        items: items.map((item) => ({
          id: item.productId,
          name: item.name,
          price: item.salePrice ?? item.basePrice,
          quantity: item.quantity,
        })),
      });
      fbTrackPurchase({ value: total });

      clearCart();
      router.push(`/order-confirmation?orderId=${orderResult.data?.order?.id}`);
      return;
    }

    // Set client secret for Stripe
    setClientSecret(orderResult.data.clientSecret);
    setCurrentStep("payment");
    setIsProcessing(false);
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    // Track purchase
    trackPurchase({
      transactionId: String(orderNumber || orderId),
      value: total,
      items: items.map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.salePrice ?? item.basePrice,
        quantity: item.quantity,
      })),
    });
    fbTrackPurchase({ value: total });

    clearCart();
    router.push(`/order-confirmation?orderId=${orderId}`);
  };

  if (items.length === 0 && !orderId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center text-sm text-slate-500 hover:text-orange-500 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Cart
        </Link>
        <h1 className="text-3xl font-heading font-bold text-slate-900">Checkout</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {["fulfillment", "details", "payment"].map((step, index) => (
          <div key={step} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-slate-400 mx-2" />
            )}
            <button
              onClick={() => {
                if (step === "fulfillment") setCurrentStep("fulfillment");
                if (step === "details" && canProceedFromFulfillment())
                  setCurrentStep("details");
                // Can't go back to payment step once created
              }}
              disabled={step === "payment"}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                currentStep === step
                  ? "bg-slate-900 text-white"
                  : step === "fulfillment" ||
                    (step === "details" && canProceedFromFulfillment())
                  ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  currentStep === step
                    ? "bg-white text-slate-900"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {index + 1}
              </span>
              {step === "fulfillment" && "Delivery"}
              {step === "details" && "Details"}
              {step === "payment" && "Payment"}
            </button>
          </div>
        ))}
      </div>

      {orderError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-600 rounded-2xl">
          {orderError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Fulfillment Selection */}
          {currentStep === "fulfillment" && (
            <div className="space-y-8">
              <FulfillmentSelector
                pickupLocations={pickupLocations}
                deliveryZones={deliveryZones}
                shippingZones={shippingZones}
                fulfillment={fulfillment}
                setFulfillment={setFulfillment}
                shippingAddress={shippingAddress}
                setShippingAddress={setShippingAddress}
                hasCoopItems={hasCoopItems}
                subtotal={subtotal}
              />

              {/* Date Selection */}
              {(fulfillment.type === "pickup" && fulfillment.locationId) ||
              (fulfillment.type === "delivery" && fulfillment.zoneId) ||
              (fulfillment.type === "shipping" && fulfillment.zoneId) ? (
                <DateSelector
                  fulfillmentType={fulfillment.type}
                  locationId={fulfillment.locationId}
                  zoneId={fulfillment.zoneId}
                  selectedDate={fulfillment.scheduledDate}
                  onSelectDate={(date) => setFulfillment({ scheduledDate: date })}
                />
              ) : null}

              <div className="flex justify-end">
                <Button
                  size="lg"
                  disabled={!canProceedFromFulfillment()}
                  onClick={() => setCurrentStep("details")}
                  className="rounded-full bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Continue to Details
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Customer Details */}
          {currentStep === "details" && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-heading font-bold text-slate-900 mb-6">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, email: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, phone: e.target.value })
                    }
                  />
                  <Input
                    label="First Name"
                    value={customerDetails.firstName}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, firstName: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Last Name"
                    value={customerDetails.lastName}
                    onChange={(e) =>
                      setCustomerDetails({ ...customerDetails, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {(fulfillment.type === "delivery" || fulfillment.type === "shipping") && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-lg font-heading font-bold text-slate-900 mb-6">
                    {fulfillment.type === "delivery" ? "Delivery Address" : "Shipping Address"}
                  </h2>
                  <div className="space-y-4">
                    <Input
                      label="Address Line 1"
                      value={shippingAddress.line1}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, line1: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Address Line 2"
                      value={shippingAddress.line2}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, line2: e.target.value })
                      }
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Input
                        label="City"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                        required
                        className="col-span-2"
                      />
                      <Input
                        label="State"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, state: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="ZIP Code"
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">
                  Order Notes (Optional)
                </h2>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-slate-900 placeholder:text-slate-400"
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep("fulfillment")} className="rounded-full border-slate-200 text-slate-900 hover:bg-slate-50">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  size="lg"
                  disabled={!canProceedFromDetails() || isProcessing}
                  onClick={handleProceedToPayment}
                  className="rounded-full bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === "payment" && clientSecret && (
            <div className="space-y-8">
              <PaymentForm
                clientSecret={clientSecret}
                total={total}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">
              Order Summary
            </h2>

            {/* Membership Fee Notice */}
            {membershipFee > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-medium">
                  Private Membership Association
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  A one-time ${MEMBERSHIP_FEE} lifetime membership fee is
                  included with your first order. This grants you lifetime
                  access to all farm products.
                </p>
              </div>
            )}

            {/* Cart Items Preview */}
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const price = item.salePrice ?? item.basePrice;
                const itemTotal =
                  item.pricingType === "weight" && item.estimatedWeight
                    ? price * item.estimatedWeight * item.quantity
                    : price * item.quantity;

                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          No Img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{formatCurrency(itemTotal)}</p>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code */}
            {currentStep !== "payment" && (
              <div className="border-t border-slate-200 pt-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">Coupon Code</span>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{appliedCoupon.code}</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-1 hover:bg-white rounded-lg"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || isPending}
                      className="rounded-full border-slate-200"
                    >
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-red-500 mt-1">{couponError}</p>
                )}
              </div>
            )}

            {/* Gift Card */}
            {currentStep !== "payment" && (
              <div className="border-t border-slate-200 pt-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">Gift Card</span>
                </div>
                {appliedGiftCard ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {appliedGiftCard.code.slice(0, 4)}...
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Using {formatCurrency(appliedGiftCard.amountToUse)} of{" "}
                        {formatCurrency(appliedGiftCard.balance)}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveGiftCard}
                      className="p-1 hover:bg-white rounded-lg"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleApplyGiftCard}
                      disabled={giftCardLoading || isPending}
                      className="rounded-full border-slate-200"
                    >
                      {giftCardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
                {giftCardError && (
                  <p className="text-xs text-red-500 mt-1">{giftCardError}</p>
                )}
              </div>
            )}

            {/* Store Credit */}
            {currentStep !== "payment" && storeCreditBalance > 0 && (
              <div className="border-t border-slate-200 pt-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useStoreCredit"
                      checked={useStoreCredit}
                      onChange={(e) => setUseStoreCredit(e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-200 focus:ring-orange-500"
                    />
                    <label htmlFor="useStoreCredit" className="text-sm font-medium text-slate-900">
                      Use Store Credit
                    </label>
                  </div>
                  <span className="text-sm text-slate-500">
                    {formatCurrency(storeCreditBalance)} available
                  </span>
                </div>
                {useStoreCredit && storeCreditAmount > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    Applying {formatCurrency(storeCreditAmount)} in store credit
                  </p>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              {fulfillment.type === "delivery" && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Delivery</span>
                  <span className="font-medium text-slate-900">
                    {deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}
                  </span>
                </div>
              )}

              {fulfillment.type === "shipping" && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Shipping</span>
                  <span className="font-medium text-slate-900">
                    {shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}
                  </span>
                </div>
              )}

              {membershipFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Membership Fee (one-time)</span>
                  <span className="font-medium text-slate-900">{formatCurrency(membershipFee)}</span>
                </div>
              )}

              {appliedCoupon && appliedCoupon.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{formatCurrency(appliedCoupon.discount)}</span>
                </div>
              )}

              {appliedGiftCard && appliedGiftCard.amountToUse > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Gift Card</span>
                  <span>-{formatCurrency(appliedGiftCard.amountToUse)}</span>
                </div>
              )}

              {storeCreditAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Store Credit</span>
                  <span>-{formatCurrency(storeCreditAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium text-slate-900">
                  {taxAmount > 0 ? formatCurrency(taxAmount) : taxDescription || "Tax exempt"}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Fulfillment Summary */}
            {fulfillment.type && (
              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex items-start gap-3">
                  {fulfillment.type === "pickup" && (
                    <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  )}
                  {fulfillment.type === "delivery" && (
                    <Truck className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  )}
                  {fulfillment.type === "shipping" && (
                    <Package className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {fulfillment.type === "shipping" && "FedEx/UPS"}
                      {fulfillment.type === "pickup" && fulfillment.locationId && (() => {
                        const loc = pickupLocations.find((l) => l.id === fulfillment.locationId);
                        return loc?.is_coop ? "Co-Op Pickup" : "Farm Pickup";
                      })()}
                      {fulfillment.type === "pickup" && !fulfillment.locationId && "Pickup"}
                      {fulfillment.type === "delivery" && "Local Delivery"}
                    </p>
                    {fulfillment.scheduledDate && (
                      <p className="text-sm text-slate-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {parseLocalDate(fulfillment.scheduledDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
