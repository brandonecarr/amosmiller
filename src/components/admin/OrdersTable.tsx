"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Printer, Check, Loader2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { updateOrderStatus } from "@/lib/actions/orders";

interface Order {
  id: string;
  order_number: number;
  status: string;
  payment_status: string;
  fulfillment_type: string;
  customer_email: string;
  customer_first_name: string | null;
  customer_last_name: string | null;
  total: number;
  created_at: string;
  scheduled_date: string | null;
  order_items: Array<{ quantity: number }>;
}

interface OrdersTableProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  authorized: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-gray-100 text-gray-800",
  failed: "bg-red-100 text-red-800",
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedOrders.length === 0) return;

    startTransition(async () => {
      for (const orderId of selectedOrders) {
        await updateOrderStatus(orderId, status as "pending" | "processing" | "packed" | "shipped" | "delivered" | "cancelled");
      }
      setSelectedOrders([]);
    });
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center">
        <p className="text-[var(--color-muted)]">No orders found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="px-4 py-3 bg-[var(--color-primary-50)] border-b border-[var(--color-border)] flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--color-primary-700)]">
            {selectedOrders.length} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate("processing")}
              disabled={isPending}
            >
              Mark Processing
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate("packed")}
              disabled={isPending}
            >
              Mark Packed
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate("shipped")}
              disabled={isPending}
            >
              Mark Shipped
            </Button>
          </div>
          {isPending && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary-500)]" />}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === orders.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[var(--color-border)]"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                Order
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                Fulfillment
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                Total
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                Date
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {orders.map((order) => {
              const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              const customerName = order.customer_first_name && order.customer_last_name
                ? `${order.customer_first_name} ${order.customer_last_name}`
                : order.customer_email;

              return (
                <tr
                  key={order.id}
                  className="hover:bg-[var(--color-slate-50)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                      className="w-4 h-4 rounded border-[var(--color-border)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-[var(--color-charcoal)] hover:text-[var(--color-primary-500)]"
                    >
                      #{order.order_number}
                    </Link>
                    <p className="text-xs text-[var(--color-muted)]">{itemCount} items</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-charcoal)]">{customerName}</p>
                    <p className="text-xs text-[var(--color-muted)]">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[order.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        paymentColors[order.payment_status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--color-charcoal)] capitalize">
                      {order.fulfillment_type}
                    </span>
                    {order.scheduled_date && (
                      <p className="text-xs text-[var(--color-muted)]">
                        {format(parseLocalDate(order.scheduled_date), "MMM d")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[var(--color-charcoal)]">
                      {formatCurrency(order.total)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--color-charcoal)]">
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </span>
                    <p className="text-xs text-[var(--color-muted)]">
                      {format(new Date(order.created_at), "h:mm a")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/orders/${order.id}/packing-list`}>
                        <Button variant="ghost" size="sm">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
