import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  RefreshCw,
  CreditCard,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/actions/subscriptions";
import { calculateSubscriptionTotal } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionActions } from "./SubscriptionActions";
import { SubscriptionItemsList } from "./SubscriptionItemsList";

interface SubscriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

const fulfillmentLabels: Record<string, string> = {
  pickup: "Pickup",
  delivery: "Delivery",
  shipping: "Shipping",
};

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/subscriptions");
  }

  const { data: subscription, error } = await getSubscription(id);

  if (error || !subscription) {
    notFound();
  }

  // Verify ownership
  if (subscription.user_id !== user.id) {
    notFound();
  }

  const shippingFee =
    subscription.delivery_zones?.delivery_fee ||
    subscription.shipping_zones?.base_rate ||
    0;
  const total = calculateSubscriptionTotal(subscription.subscription_items || [], shippingFee);
  const isActive = subscription.status === "active";
  const isPaused = subscription.status === "paused";
  const isCancelled = subscription.status === "cancelled";

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
              {subscription.name}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[subscription.status]
              }`}
            >
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </span>
          </div>
          <p className="text-[var(--color-muted)]">
            {frequencyLabels[subscription.frequency]} •{" "}
            {fulfillmentLabels[subscription.fulfillment_type]}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Order Card */}
          {!isCancelled && subscription.next_order_date && (
            <div className="bg-[var(--color-primary-50)] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-primary-700)] mb-1">Next Order</p>
                  <p className="text-2xl font-bold text-[var(--color-primary-900)]">
                    {format(new Date(subscription.next_order_date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                {isActive && (
                  <SubscriptionActions
                    subscriptionId={subscription.id}
                    status={subscription.status}
                    showSkip
                  />
                )}
              </div>
            </div>
          )}

          {/* Subscription Items */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
                <Package className="w-5 h-5" />
                Subscription Items
              </h2>
              {!isCancelled && (
                <Link href={`/account/subscriptions/${subscription.id}/customize`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                </Link>
              )}
            </div>
            <SubscriptionItemsList items={subscription.subscription_items || []} />
            <div className="px-6 py-4 bg-[var(--color-slate-50)] border-t border-[var(--color-border)]">
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-muted)]">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(total - shippingFee)}
                </span>
              </div>
              {shippingFee > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[var(--color-muted)]">
                    {subscription.fulfillment_type === "shipping" ? "Shipping" : "Delivery Fee"}
                  </span>
                  <span className="font-medium">{formatCurrency(shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--color-border)]">
                <span className="font-semibold text-[var(--color-charcoal)]">
                  Total per {subscription.frequency === "biweekly" ? "delivery" : subscription.frequency.replace("ly", "")}
                </span>
                <span className="font-bold text-lg text-[var(--color-charcoal)]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Skipped Dates */}
          {subscription.skip_dates?.length > 0 && (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
              <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">Skipped Dates</h2>
              <div className="flex flex-wrap gap-2">
                {subscription.skip_dates.map((date: string) => (
                  <span
                    key={date}
                    className="inline-flex items-center px-3 py-1 bg-[var(--color-slate-50)] rounded-full text-sm"
                  >
                    <Calendar className="w-4 h-4 mr-1 text-[var(--color-muted)]" />
                    {format(new Date(date), "MMM d, yyyy")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription Controls */}
          {!isCancelled && (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
              <h3 className="font-semibold text-[var(--color-charcoal)] mb-4">
                Manage Subscription
              </h3>
              <SubscriptionActions
                subscriptionId={subscription.id}
                status={subscription.status}
                showAll
              />
            </div>
          )}

          {/* Schedule Info */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
            <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Schedule
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase">Frequency</p>
                <p className="font-medium text-[var(--color-charcoal)]">
                  {frequencyLabels[subscription.frequency]}
                </p>
              </div>
              {subscription.next_order_date && (
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase">Next Order</p>
                  <p className="font-medium text-[var(--color-charcoal)]">
                    {format(new Date(subscription.next_order_date), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              {subscription.last_order_date && (
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase">Last Order</p>
                  <p className="font-medium text-[var(--color-charcoal)]">
                    {format(new Date(subscription.last_order_date), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Info */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
            <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {fulfillmentLabels[subscription.fulfillment_type]}
            </h3>
            <div className="space-y-3">
              {subscription.fulfillment_locations && (
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase">Location</p>
                  <p className="font-medium text-[var(--color-charcoal)]">
                    {subscription.fulfillment_locations.name}
                  </p>
                </div>
              )}
              {subscription.shipping_address && (
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase">Address</p>
                  <p className="text-sm text-[var(--color-charcoal)]">
                    {subscription.shipping_address.line1}
                    {subscription.shipping_address.line2 && (
                      <br />
                    )}
                    {subscription.shipping_address.line2}
                    <br />
                    {subscription.shipping_address.city}, {subscription.shipping_address.state}{" "}
                    {subscription.shipping_address.postalCode}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
            <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment
            </h3>
            <p className="text-sm text-[var(--color-muted)]">
              Payment will be processed when your order is prepared.
            </p>
            {subscription.stripe_subscription_id && (
              <p className="text-xs text-[var(--color-muted)] mt-2 font-mono">
                ID: {subscription.stripe_subscription_id.slice(0, 20)}...
              </p>
            )}
          </div>

          {/* Cancellation Info */}
          {isCancelled && (
            <div className="bg-red-50 rounded-xl p-6">
              <h3 className="font-semibold text-red-800 mb-2">Subscription Cancelled</h3>
              <p className="text-sm text-red-700">
                Cancelled on{" "}
                {subscription.cancelled_at
                  ? format(new Date(subscription.cancelled_at), "MMMM d, yyyy")
                  : "Unknown date"}
              </p>
              {subscription.cancellation_reason && (
                <p className="text-sm text-red-600 mt-2 italic">
                  Reason: {subscription.cancellation_reason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
