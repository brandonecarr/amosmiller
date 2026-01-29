import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatCard } from "@/components/admin/reports/StatCard";
import { getDashboardStats } from "@/lib/actions/reports";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default async function AdminDashboard() {
  const { stats, recentOrders } = await getDashboardStats();

  const statCards = [
    {
      label: "Revenue (This Month)",
      value: formatCurrency(stats.totalRevenue),
      change: `${stats.revenueChange >= 0 ? "+" : ""}${stats.revenueChange}%`,
      trend: (stats.revenueChange >= 0 ? "up" : "down") as "up" | "down",
      icon: DollarSign,
    },
    {
      label: "Orders (This Month)",
      value: stats.orderCount.toLocaleString(),
      change: `${stats.orderCountChange >= 0 ? "+" : ""}${stats.orderCountChange}%`,
      trend: (stats.orderCountChange >= 0 ? "up" : "down") as "up" | "down",
      icon: ShoppingCart,
    },
    {
      label: "Active Products",
      value: stats.productCount.toLocaleString(),
      change: undefined,
      trend: "neutral" as const,
      icon: Package,
    },
    {
      label: "Customers",
      value: stats.customerCount.toLocaleString(),
      change: `+${stats.newCustomerCount} this month`,
      trend: (stats.newCustomerCount > 0 ? "up" : "neutral") as "up" | "neutral",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
          Dashboard
        </h1>
        <p className="text-[var(--color-muted)]">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card variant="default" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--color-border)]">
            <CardTitle>Recent Orders</CardTitle>
            <Link
              href="/admin/orders"
              className="text-sm text-[var(--color-primary-500)] hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length > 0 ? (
              <div className="divide-y divide-[var(--color-border)]">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-slate-50)] transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[var(--color-charcoal)]">
                        #{order.orderNumber}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {order.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[var(--color-charcoal)]">
                        {formatCurrency(order.total)}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            statusColors[order.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-[var(--color-muted)]">
                No orders yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="default">
          <CardHeader className="border-b border-[var(--color-border)]">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-slate-50)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center">
                <Package className="w-5 h-5 text-[var(--color-primary-500)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--color-charcoal)]">
                  Add Product
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  Create a new product listing
                </p>
              </div>
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-slate-50)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-[var(--color-charcoal)]">
                  Process Orders
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  View and fulfill orders
                </p>
              </div>
            </Link>
            <Link
              href="/admin/customers"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-slate-50)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-[var(--color-charcoal)]">
                  Manage Customers
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  View customer accounts
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
