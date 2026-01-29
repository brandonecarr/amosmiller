"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

interface CustomerReportProps {
  data: {
    summary: {
      newCustomers: number;
      totalCustomers: number;
      repeatRate: number;
      avgOrdersPerCustomer: number;
    };
    acquisitionByDate: { date: string; count: number }[];
    topCustomers: {
      id: string;
      name: string;
      email: string;
      orderCount: number;
      totalSpent: number;
    }[];
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

export function CustomerReport({ data }: CustomerReportProps) {
  const { summary, acquisitionByDate, topCustomers } = data;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">New Customers</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {summary.newCustomers.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Customers</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {summary.totalCustomers.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Repeat Rate</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {summary.repeatRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Avg Orders / Customer</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {summary.avgOrdersPerCustomer.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Customer Acquisition Chart */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Customer Acquisition</CardTitle>
        </CardHeader>
        <CardContent>
          {acquisitionByDate.length === 0 ? (
            <EmptyState message="No data for this period" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={acquisitionByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [value, "New Customers"]}
                  labelFormatter={formatShortDate}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6B8E23"
                  strokeWidth={2}
                  fill="#6B8E23"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Customers Table */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topCustomers.length === 0 ? (
            <div className="p-6">
              <EmptyState message="No data for this period" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
                    <th className="px-6 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-[var(--color-muted)]">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-[var(--color-muted)]">
                      Total Spent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {topCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-[var(--color-slate-50)] transition-colors"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-[var(--color-charcoal)]">
                        {customer.name}
                      </td>
                      <td className="px-6 py-3 text-sm text-[var(--color-muted)]">
                        {customer.email}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-[var(--color-charcoal)]">
                        {customer.orderCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-[var(--color-charcoal)]">
                        {formatCurrency(customer.totalSpent)}
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
