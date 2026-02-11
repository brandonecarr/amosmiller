"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { addStoreCredit } from "@/lib/actions/store-credits";
import { formatCurrency } from "@/lib/utils";

interface AddStoreCreditFormProps {
  userId: string;
  currentBalance: number;
}

export function AddStoreCreditForm({ userId, currentBalance }: AddStoreCreditFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    try {
      const result = await addStoreCredit({
        userId,
        amount: parseFloat(amount),
        reason: reason || "Admin credit",
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      setOpen(false);
      setAmount("");
      setReason("");
      router.refresh();
    } catch (error) {
      console.error("Error adding store credit:", error);
      alert("Failed to add store credit");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" />
        Add Credit
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Store Credit</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[var(--color-muted)] mb-4">
          Current balance: <span className="font-medium text-green-600">{formatCurrency(currentBalance)}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-7 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              placeholder="e.g., Refund for order #123, Promotional credit"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={loading} disabled={!amount}>
              Add Credit
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
