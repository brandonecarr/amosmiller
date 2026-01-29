"use client";

import { useState, useTransition } from "react";
import { Loader2, DollarSign, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface PaymentActionsProps {
  orderId: string;
  paymentIntentId: string;
  paymentStatus: string;
  stripeStatus: string;
  amountAuthorized: number; // in cents
  currentTotal: number; // in cents
  canCapture: boolean;
  hasUnweighedItems: boolean;
}

export function PaymentActions({
  orderId,
  paymentIntentId,
  paymentStatus,
  stripeStatus,
  amountAuthorized,
  currentTotal,
  canCapture,
  hasUnweighedItems,
}: PaymentActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [captureAmount, setCaptureAmount] = useState((currentTotal / 100).toFixed(2));
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const parsedAmount = Math.round(parseFloat(captureAmount) * 100);
  const amountDiff = parsedAmount - amountAuthorized;

  const handleCapture = () => {
    setShowConfirm(true);
  };

  const confirmCapture = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/orders/capture-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            paymentIntentId,
            amount: parsedAmount,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Failed to capture payment");
          setShowConfirm(false);
          return;
        }

        setSuccess(true);
        setShowConfirm(false);
      } catch (e) {
        setError("An unexpected error occurred");
        setShowConfirm(false);
      }
    });
  };

  if (success) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Payment Captured</h3>
            <p className="text-sm text-green-700">
              {formatCurrency(parsedAmount / 100)} has been charged to the customer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === "paid") {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-800">Payment Complete</h3>
            <p className="text-sm text-green-700">
              This order has been paid in full.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (stripeStatus !== "requires_capture") {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-700">Payment Status: {stripeStatus}</h3>
            <p className="text-sm text-gray-600">
              {stripeStatus === "canceled" && "This payment has been canceled."}
              {stripeStatus === "succeeded" && "This payment has been captured."}
              {stripeStatus === "processing" && "This payment is still processing."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
        <h2 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Payment Capture
        </h2>
      </div>

      <div className="p-6 space-y-4">
        {hasUnweighedItems && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-800">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Some items need weighing</p>
              <p className="text-sm">
                Please enter actual weights for all weight-based items before capturing payment.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-800">
            <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-[var(--color-muted)] uppercase mb-1">Authorized</p>
            <p className="text-lg font-semibold text-[var(--color-charcoal)]">
              {formatCurrency(amountAuthorized / 100)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)] uppercase mb-1">Current Total</p>
            <p className="text-lg font-semibold text-[var(--color-charcoal)]">
              {formatCurrency(currentTotal / 100)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)] uppercase mb-1">Amount to Capture</p>
            <div className="flex items-center gap-1">
              <span className="text-lg text-[var(--color-muted)]">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={(amountAuthorized / 100).toFixed(2)}
                value={captureAmount}
                onChange={(e) => setCaptureAmount(e.target.value)}
                className="w-28 px-2 py-1.5 text-lg font-semibold border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                disabled={isPending || !canCapture}
              />
            </div>
          </div>
        </div>

        {amountDiff !== 0 && (
          <p className="text-sm text-[var(--color-muted)]">
            {amountDiff > 0 ? (
              <span className="text-yellow-600">
                Note: You cannot capture more than the authorized amount. The customer
                may need to be recharged for the difference ({formatCurrency(amountDiff / 100)}).
              </span>
            ) : (
              <span className="text-green-600">
                Capturing {formatCurrency(Math.abs(amountDiff) / 100)} less than authorized.
                The remaining amount will be released.
              </span>
            )}
          </p>
        )}

        <Button
          onClick={handleCapture}
          disabled={isPending || !canCapture || parsedAmount <= 0 || parsedAmount > amountAuthorized}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <DollarSign className="w-4 h-4 mr-2" />
          )}
          Capture {formatCurrency(parsedAmount / 100)}
        </Button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">
              Confirm Payment Capture
            </h3>
            <p className="text-[var(--color-muted)] mb-4">
              You are about to charge the customer{" "}
              <strong className="text-[var(--color-charcoal)]">
                {formatCurrency(parsedAmount / 100)}
              </strong>
              . This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={confirmCapture} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirm Capture
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
