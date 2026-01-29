"use client";

import { useState, useTransition } from "react";
import { Loader2, Scale, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { updateOrderItemWeight, recalculateOrderTotal } from "@/lib/actions/orders";
import { formatCurrency } from "@/lib/utils";

interface WeightEntryFormProps {
  itemId: string;
  orderId: string;
  productName: string;
  estimatedWeight: number | null;
  quantity: number;
  unitPrice: number;
}

export function WeightEntryForm({
  itemId,
  orderId,
  productName,
  estimatedWeight,
  quantity,
  unitPrice,
}: WeightEntryFormProps) {
  const [weight, setWeight] = useState(estimatedWeight?.toString() || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const parsedWeight = parseFloat(weight) || 0;
  const calculatedPrice = unitPrice * parsedWeight * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (parsedWeight <= 0) {
      alert("Please enter a valid weight");
      return;
    }

    startTransition(async () => {
      const result = await updateOrderItemWeight(itemId, parsedWeight);

      if (result.error) {
        alert(`Error saving weight: ${result.error}`);
        return;
      }

      // Recalculate order total
      await recalculateOrderTotal(orderId);

      setSaved(true);
    });
  };

  if (saved) {
    return (
      <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
        <Check className="w-4 h-4" />
        <span className="text-sm">Weight recorded: {parsedWeight} lbs</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-3 bg-yellow-50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Scale className="w-4 h-4 text-yellow-700" />
        <span className="text-sm font-medium text-yellow-800">Enter Actual Weight</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-yellow-700 mb-1">Weight (lbs)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={estimatedWeight?.toString() || "0.00"}
            className="w-24 px-2 py-1.5 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
            disabled={isPending}
          />
        </div>
        <div className="text-sm text-[var(--color-muted)]">
          {quantity > 1 && <span>× {quantity} = </span>}
          <span className="font-medium text-[var(--color-charcoal)]">
            {formatCurrency(calculatedPrice)}
          </span>
        </div>
        <Button type="submit" size="sm" disabled={isPending || parsedWeight <= 0}>
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>
      {estimatedWeight && parsedWeight > 0 && Math.abs(parsedWeight - estimatedWeight) > 0.5 && (
        <p className="mt-2 text-xs text-yellow-700">
          Differs from estimate by{" "}
          {Math.abs(parsedWeight - estimatedWeight).toFixed(2)} lbs
        </p>
      )}
    </form>
  );
}
