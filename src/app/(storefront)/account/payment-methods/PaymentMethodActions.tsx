"use client";

import { useState, useTransition } from "react";
import { Star, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui";
import { setDefaultPaymentMethod, deletePaymentMethod } from "@/lib/actions/payment-methods";

interface PaymentMethodActionsProps {
  paymentMethodId: string;
  userId: string;
  isDefault: boolean;
}

export function PaymentMethodActions({
  paymentMethodId,
  userId,
  isDefault,
}: PaymentMethodActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSetDefault = () => {
    startTransition(async () => {
      await setDefaultPaymentMethod(userId, paymentMethodId);
      setShowMenu(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePaymentMethod(userId, paymentMethodId);
      if (result.error) {
        alert(result.error);
      }
      setShowDeleteConfirm(false);
      setShowMenu(false);
    });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isPending}
      >
        <MoreHorizontal className="w-5 h-5" />
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--color-border)] z-20">
            {!isDefault && (
              <button
                onClick={handleSetDefault}
                disabled={isPending}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-slate-50)] flex items-center gap-2 disabled:opacity-50"
              >
                <Star className="w-4 h-4" />
                Set as Default
              </button>
            )}
            <button
              onClick={() => {
                setShowMenu(false);
                setShowDeleteConfirm(true);
              }}
              disabled={isPending}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">
              Delete Payment Method?
            </h3>
            <p className="text-[var(--color-muted)] mb-6">
              Are you sure you want to delete this payment method? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
