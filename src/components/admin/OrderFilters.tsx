"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface OrderFiltersProps {
  currentFilters: {
    status?: string;
    payment?: string;
    fulfillment?: string;
    search?: string;
    from?: string;
    to?: string;
  };
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentOptions = [
  { value: "", label: "All Payments" },
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

const fulfillmentOptions = [
  { value: "", label: "All Types" },
  { value: "pickup", label: "Pickup" },
  { value: "delivery", label: "Delivery" },
  { value: "shipping", label: "Shipping" },
];

export function OrderFilters({ currentFilters }: OrderFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentFilters.search || "");

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams();

    // Preserve current filters
    if (currentFilters.status) params.set("status", currentFilters.status);
    if (currentFilters.payment) params.set("payment", currentFilters.payment);
    if (currentFilters.fulfillment) params.set("fulfillment", currentFilters.fulfillment);
    if (currentFilters.search) params.set("search", currentFilters.search);
    if (currentFilters.from) params.set("from", currentFilters.from);
    if (currentFilters.to) params.set("to", currentFilters.to);

    // Apply updates
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = () => {
    updateFilters({ search });
  };

  const clearFilters = () => {
    setSearch("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    currentFilters.status ||
    currentFilters.payment ||
    currentFilters.fulfillment ||
    currentFilters.search ||
    currentFilters.from ||
    currentFilters.to;

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="flex gap-2">
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleSearch} disabled={isPending}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={currentFilters.status || ""}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          disabled={isPending}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Payment Filter */}
        <select
          value={currentFilters.payment || ""}
          onChange={(e) => updateFilters({ payment: e.target.value })}
          className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          disabled={isPending}
        >
          {paymentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Fulfillment Filter */}
        <select
          value={currentFilters.fulfillment || ""}
          onChange={(e) => updateFilters({ fulfillment: e.target.value })}
          className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          disabled={isPending}
        >
          {fulfillmentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <input
          type="date"
          value={currentFilters.from || ""}
          onChange={(e) => updateFilters({ from: e.target.value })}
          className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          disabled={isPending}
        />
        <span className="text-[var(--color-muted)]">to</span>
        <input
          type="date"
          value={currentFilters.to || ""}
          onChange={(e) => updateFilters({ to: e.target.value })}
          className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          disabled={isPending}
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={isPending}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
