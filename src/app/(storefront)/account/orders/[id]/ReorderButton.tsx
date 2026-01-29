"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { reorderItems } from "@/lib/actions/orders";
import { useCart } from "@/contexts/CartContext";

interface ReorderButtonProps {
  orderId: string;
}

export function ReorderButton({ orderId }: ReorderButtonProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleReorder = () => {
    setError(null);

    startTransition(async () => {
      const result = await reorderItems(orderId);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.items) {
        // Add items to cart
        for (const item of result.items) {
          addItem({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            slug: item.slug,
            pricingType: item.pricingType as "fixed" | "weight",
            basePrice: item.basePrice,
            salePrice: item.salePrice,
            weightUnit: item.weightUnit as "lb" | "oz" | "kg" | "g",
            estimatedWeight: item.estimatedWeight,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          });
        }

        // Redirect to cart
        router.push("/cart");
      }
    });
  };

  return (
    <div>
      <Button
        variant="outline"
        onClick={handleReorder}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-2" />
        )}
        Reorder
      </Button>
      {error && <p className="text-xs text-[var(--color-error)] mt-1">{error}</p>}
    </div>
  );
}
