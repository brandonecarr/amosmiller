"use client";

import { useState } from "react";
import { MoreHorizontal, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { toggleGiftCardActive } from "@/lib/actions/gift-cards";
import { useRouter } from "next/navigation";

interface GiftCard {
  id: string;
  code: string;
  is_active: boolean;
  current_balance: number;
}

export function GiftCardActions({ giftCard }: { giftCard: GiftCard }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      await toggleGiftCardActive(giftCard.id);
      router.refresh();
    } catch (error) {
      console.error("Error toggling gift card:", error);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-20 py-1">
            <button
              onClick={handleToggleActive}
              disabled={loading}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-[var(--color-slate-50)] disabled:opacity-50"
            >
              <Power className="w-4 h-4" />
              {giftCard.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
