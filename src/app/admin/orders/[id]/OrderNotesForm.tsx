"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, StickyNote } from "lucide-react";
import { Button } from "@/components/ui";
import { addOrderNotes } from "@/lib/actions/orders";

interface OrderNotesFormProps {
  orderId: string;
  privateNotes: string | null;
  invoiceNotes: string | null;
}

export function OrderNotesForm({ orderId, privateNotes, invoiceNotes }: OrderNotesFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [private_, setPrivate] = useState(privateNotes || "");
  const [invoice, setInvoice] = useState(invoiceNotes || "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await addOrderNotes(orderId, {
        private: private_,
        invoice: invoice,
      });

      if (result.error) {
        alert(`Error saving notes: ${result.error}`);
      } else {
        setIsEditing(false);
      }
    });
  };

  const hasChanges =
    private_ !== (privateNotes || "") || invoice !== (invoiceNotes || "");

  if (!isEditing && !privateNotes && !invoiceNotes) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            Order Notes
          </h2>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Add Notes
          </Button>
        </div>
        <p className="text-sm text-[var(--color-muted)]">No notes added yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            Order Notes
          </h2>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Notes
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Private Notes */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1">
            Private Notes
            <span className="text-[var(--color-muted)] font-normal ml-2">
              (Only visible to staff)
            </span>
          </label>
          {isEditing ? (
            <textarea
              value={private_}
              onChange={(e) => setPrivate(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              placeholder="Internal notes about this order..."
            />
          ) : (
            <p className="text-sm text-[var(--color-muted)] bg-[var(--color-slate-50)] p-3 rounded-lg">
              {privateNotes || "No private notes"}
            </p>
          )}
        </div>

        {/* Invoice Notes */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1">
            Invoice Notes
            <span className="text-[var(--color-muted)] font-normal ml-2">
              (Shown on packing list/invoice)
            </span>
          </label>
          {isEditing ? (
            <textarea
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              placeholder="Notes to include on the invoice or packing list..."
            />
          ) : (
            <p className="text-sm text-[var(--color-muted)] bg-[var(--color-slate-50)] p-3 rounded-lg">
              {invoiceNotes || "No invoice notes"}
            </p>
          )}
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isPending || !hasChanges}>
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Notes
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPrivate(privateNotes || "");
                setInvoice(invoiceNotes || "");
                setIsEditing(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
