"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent, CardTitle, Badge } from "@/components/ui";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

interface InventoryReportProps {
  data: {
    summary: {
      totalProducts: number;
      totalStock: number;
      lowStockCount: number;
      outOfStockCount: number;
      inventoryValue: number;
    };
    products: {
      id: string;
      name: string;
      sku: string | null;
      stockQuantity: number;
      lowStockThreshold: number;
      categoryName: string;
      basePrice: number;
      status: "ok" | "low" | "out";
    }[];
    stockByCategory: { name: string; totalStock: number; productCount: number }[];
  };
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[250px] text-sm text-[var(--color-muted)]">
      {message}
    </div>
  );
}

const statusVariant: Record<string, "success" | "warning" | "error"> = {
  ok: "success",
  low: "warning",
  out: "error",
};

const statusLabel: Record<string, string> = {
  ok: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
};

export function InventoryReport({ data }: InventoryReportProps) {
  const { summary, products, stockByCategory } = data;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Products</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {summary.totalProducts.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Stock Units</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {summary.totalStock.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Low Stock Alerts</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {summary.lowStockCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {summary.outOfStockCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Inventory Value</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
            {formatCurrency(summary.inventoryValue)}
          </p>
        </div>
      </div>

      {/* Stock by Category Chart */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Stock by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {stockByCategory.length === 0 ? (
            <EmptyState message="No data for this period" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stockByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--color-charcoal)" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    Number(value).toLocaleString(),
                    name === "totalStock" ? "Stock Units" : name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="totalStock" fill="#6B8E23" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Products Inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="p-6">
              <EmptyState message="No data for this period" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
                    <th className="px-6 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-[var(--color-muted)]">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-[var(--color-muted)]">
                      Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-[var(--color-slate-50)] transition-colors"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-[var(--color-charcoal)]">
                        {product.name}
                      </td>
                      <td className="px-6 py-3 text-sm text-[var(--color-muted)]">
                        {product.sku ?? "\u2014"}
                      </td>
                      <td className="px-6 py-3 text-sm text-[var(--color-charcoal)]">
                        {product.categoryName}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-[var(--color-charcoal)]">
                        {product.stockQuantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-[var(--color-muted)]">
                        {product.lowStockThreshold.toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={statusVariant[product.status]} size="sm">
                          {statusLabel[product.status]}
                        </Badge>
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
