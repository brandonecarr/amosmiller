"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { updateOrderStatus } from "@/lib/actions/orders";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === currentStatus) return;

    // Show confirmation for destructive actions
    if (newStatus === "cancelled") {
      setPendingStatus(newStatus);
      setShowConfirm(true);
      return;
    }

    applyStatusChange(newStatus);
  };

  const applyStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setShowConfirm(false);
    setPendingStatus(null);

    startTransition(async () => {
      const result = await updateOrderStatus(
        orderId,
        newStatus as "pending" | "confirmed" | "processing" | "packed" | "shipped" | "delivered" | "cancelled"
      );

      if (result.error) {
        setStatus(currentStatus);
        alert(`Error updating status: ${result.error}`);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--color-muted)]">Update to:</span>
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isPending}
        className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] disabled:opacity-50"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {isPending && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary-500)]" />}

      {/* Confirmation Modal for Cancel */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">
              Cancel Order?
            </h3>
            <p className="text-[var(--color-muted)] mb-4">
              This will mark the order as cancelled. If the payment has been captured,
              you may need to issue a refund separately.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setPendingStatus(null);
                }}
              >
                Keep Order
              </Button>
              <Button
                variant="danger"
                onClick={() => pendingStatus && applyStatusChange(pendingStatus)}
              >
                Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
