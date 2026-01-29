import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { Plus, Package, Calendar, RefreshCw, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscriptions } from "@/lib/actions/subscriptions";
import { calculateSubscriptionTotal, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Subscriptions",
  description: "Manage your recurring subscription orders.",
};

interface SubscriptionItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    base_price: number;
    sale_price: number | null;
    pricing_type: string;
    estimated_weight?: number | null;
  };
  variant?: {
    price_modifier: number;
  } | null;
}

interface Subscription {
  id: string;
  name: string;
  status: string;
  frequency: string;
  next_order_date: string | null;
  cancelled_at: string | null;
  subscription_items: SubscriptionItem[];
  delivery_zones?: { delivery_fee: number } | null;
  shipping_zones?: { base_rate: number } | null;
}

const statusColors: Record<string, string> = {
  active: "bg-orange-100 text-orange-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/subscriptions");
  }

  const { data: subscriptions, error } = await getUserSubscriptions(user.id);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading subscriptions: {error}</p>
      </div>
    );
  }

  const activeSubscriptions = (subscriptions as Subscription[] | null)?.filter((s) => s.status !== "cancelled") || [];
  const cancelledSubscriptions = (subscriptions as Subscription[] | null)?.filter((s) => s.status === "cancelled") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">My Subscriptions</h1>
          <p className="text-slate-500">
            Manage your recurring orders and deliveries
          </p>
        </div>
        <Link href="/shop?subscription=true">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Subscription
          </Button>
        </Link>
      </div>

      {activeSubscriptions.length === 0 && cancelledSubscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold font-heading text-slate-900 mb-2">
            No Subscriptions Yet
          </h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Subscribe to your favorite products and never run out. We&apos;ll deliver fresh
            farm products on your schedule.
          </p>
          <Link href="/shop?subscription=true">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Start a Subscription
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Active Subscriptions */}
          {activeSubscriptions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-heading text-slate-900">
                Active Subscriptions
              </h2>
              <div className="grid gap-4">
                {activeSubscriptions.map((subscription) => {
                  const itemCount = subscription.subscription_items?.length || 0;
                  const total = calculateSubscriptionTotal(
                    subscription.subscription_items || [],
                    subscription.delivery_zones?.delivery_fee ||
                      subscription.shipping_zones?.base_rate ||
                      0
                  );

                  return (
                    <Link
                      key={subscription.id}
                      href={`/account/subscriptions/${subscription.id}`}
                      className="block"
                    >
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-orange-300 transition-colors">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-slate-900">
                                {subscription.name}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  statusColors[subscription.status]
                                }`}
                              >
                                {subscription.status === "active" && (
                                  <Play className="w-3 h-3 mr-1" />
                                )}
                                {subscription.status === "paused" && (
                                  <Pause className="w-3 h-3 mr-1" />
                                )}
                                {subscription.status.charAt(0).toUpperCase() +
                                  subscription.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                              </span>
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-4 h-4" />
                                {frequencyLabels[subscription.frequency]}
                              </span>
                              {subscription.next_order_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Next:{" "}
                                  {format(
                                    new Date(subscription.next_order_date),
                                    "MMM d, yyyy"
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(total)}
                            </p>
                            <p className="text-xs text-slate-500">
                              per {subscription.frequency === "biweekly" ? "delivery" : subscription.frequency.replace("ly", "")}
                            </p>
                          </div>
                        </div>

                        {/* Item Preview */}
                        {subscription.subscription_items?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex flex-wrap gap-2">
                              {subscription.subscription_items.slice(0, 4).map((item: {
                                id: string;
                                quantity: number;
                                product: { name: string };
                              }) => (
                                <span
                                  key={item.id}
                                  className="inline-flex items-center px-2 py-1 bg-slate-50 rounded text-xs text-slate-900"
                                >
                                  {item.product.name} &times;{item.quantity}
                                </span>
                              ))}
                              {subscription.subscription_items.length > 4 && (
                                <span className="inline-flex items-center px-2 py-1 text-xs text-slate-500">
                                  +{subscription.subscription_items.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled Subscriptions */}
          {cancelledSubscriptions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-500">
                Past Subscriptions
              </h2>
              <div className="grid gap-4">
                {cancelledSubscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900">
                            {subscription.name}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Cancelled
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          Cancelled on{" "}
                          {subscription.cancelled_at
                            ? format(new Date(subscription.cancelled_at), "MMM d, yyyy")
                            : "Unknown"}
                        </p>
                      </div>
                      <Link href={`/account/subscriptions/${subscription.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
