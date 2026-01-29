"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";

const COLORS = ["#6B8E23", "#8B7D6B", "#D2B48C", "#4A90D9", "#E88E5A", "#7BC67E"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

interface SalesReportProps {
  data: {
    summary: {
      totalRevenue: number;
      totalOrders: number;
      avgOrderValue: number;
      totalItemsSold: number;
    };
    revenueByDate: { date: string; revenue: number; orders: number }[];
    salesByCategory: { name: string; revenue: number; items: number }[];
    salesByFulfillment: { type: string; count: number; revenue: number }[];
    topProducts: { name: string; revenue: number; quantity: number }[];
  };
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[250px] text-sm text-[var(--color-muted)]">
      {message}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatShortDate(dateStr: any) {
  const d = new Date(String(dateStr));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCustomPieLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, name, percent } = props;
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="var(--color-charcoal)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
}

export function SalesReport({ data }: SalesReportProps) {
  const { summary, revenueByDate, salesByCategory, salesByFulfillment, topProducts } = data;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Revenue</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Orders</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {summary.totalOrders.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Avg Order Value</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {formatCurrency(summary.avgOrderValue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Items Sold</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {summary.totalItemsSold.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Revenue Over Time */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueByDate.length === 0 ? (
            <EmptyState message="No data for this period" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                  labelFormatter={formatShortDate}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6B8E23"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#6B8E23" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Sales by Category + Sales by Fulfillment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <Card variant="default">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByCategory.length === 0 ? (
              <EmptyState message="No data for this period" />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(250, salesByCategory.length * 40)}>
                <BarChart data={salesByCategory} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 12, fill: "var(--color-charcoal)" }}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6B8E23" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales by Fulfillment Type */}
        <Card variant="default">
          <CardHeader>
            <CardTitle>Sales by Fulfillment Type</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByFulfillment.length === 0 ? (
              <EmptyState message="No data for this period" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesByFulfillment}
                    dataKey="revenue"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={renderCustomPieLabel}
                    labelLine={{ stroke: "var(--color-muted)", strokeWidth: 1 }}
                  >
                    {salesByFulfillment.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topProducts.length === 0 ? (
            <div className="p-6">
              <EmptyState message="No data for this period" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
                    <th className="px-6 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                      Product
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-[var(--color-muted)]">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-[var(--color-muted)]">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {topProducts.map((product, i) => (
                    <tr key={i} className="hover:bg-[var(--color-slate-50)] transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-[var(--color-charcoal)]">
                        {product.name}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-[var(--color-charcoal)]">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-[var(--color-charcoal)]">
                        {product.quantity.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
