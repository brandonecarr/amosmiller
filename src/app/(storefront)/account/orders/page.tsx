import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserOrders } from "@/lib/actions/orders";
import { Package, ChevronRight, Calendar, MapPin, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View your order history from Amos Miller Farm.",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: orders, error } = await getUserOrders(user.id);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    packed: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const fulfillmentIcons: Record<string, typeof Package> = {
    pickup: MapPin,
    delivery: Truck,
    shipping: Package,
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center">
        <p className="text-[var(--color-error)]">Failed to load orders</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center">
        <Package className="w-16 h-16 text-[var(--color-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--color-charcoal)] mb-2">
          No orders yet
        </h2>
        <p className="text-[var(--color-muted)] mb-6">
          When you place an order, it will appear here.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center px-6 py-3 bg-[var(--color-primary-500)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-600)] transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--color-charcoal)]">Order History</h2>

      {orders.map((order: {
        id: string;
        order_number: number;
        status: string;
        payment_status: string;
        fulfillment_type: string;
        total: number;
        created_at: string;
        scheduled_date: string | null;
        order_items: Array<{ name: string; quantity: number }>;
      }) => {
        const FulfillmentIcon = fulfillmentIcons[order.fulfillment_type] || Package;
        const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        return (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="block bg-white rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary-300)] transition-colors"
          >
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-[var(--color-charcoal)]">
                      Order #{order.order_number}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[order.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-muted)] flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(order.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--color-charcoal)]">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">{itemCount} items</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <FulfillmentIcon className="w-4 h-4" />
                  <span className="capitalize">{order.fulfillment_type}</span>
                  {order.scheduled_date && (
                    <>
                      <span className="text-[var(--color-border)]">|</span>
                      <span>{format(new Date(order.scheduled_date), "MMM d")}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[var(--color-primary-500)]">
                  <span className="text-sm font-medium">View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
