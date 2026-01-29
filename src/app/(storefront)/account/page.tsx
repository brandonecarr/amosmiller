import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserOrders } from "@/lib/actions/orders";
import { getUserStoreCredits } from "@/lib/actions/store-credits";
import { Package, CreditCard, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your Amos Miller Farm account, orders, and subscriptions.",
};

export default async function AccountDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch recent orders and store credit balance
  const [ordersResult, creditsResult] = await Promise.all([
    getUserOrders(user.id),
    getUserStoreCredits(user.id),
  ]);

  const recentOrders = ordersResult.data?.slice(0, 3) || [];
  const storeCredits = creditsResult.balance || 0;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    packed: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <h2 className="text-xl font-bold font-heading text-slate-900 mb-2">
          Welcome back!
        </h2>
        <p className="text-slate-500">
          {user.email}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">
                {ordersResult.data?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Store Credit</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(storeCredits)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold font-heading text-slate-900">Recent Orders</h3>
          <Link
            href="/account/orders"
            className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No orders yet</p>
            <Link
              href="/shop"
              className="inline-block mt-4 text-orange-500 hover:text-orange-600"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {recentOrders.map((order: {
              id: string;
              order_number: number;
              status: string;
              total: number;
              created_at: string;
            }) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    Order #{order.order_number}
                  </p>
                  <p className="text-sm text-slate-500">
                    {format(new Date(order.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[order.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
