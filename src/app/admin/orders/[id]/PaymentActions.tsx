"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, AlertTriangle, Check, X, RotateCcw } from "lucide-react";
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
  totalRefunded?: number; // in cents
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
  totalRefunded = 0,
}: PaymentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [captureAmount, setCaptureAmount] = useState((currentTotal / 100).toFixed(2));
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Refund state
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState(false);

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

        // Refresh the page to show updated payment status
        router.refresh();
      } catch (e) {
        setError("An unexpected error occurred");
        setShowConfirm(false);
      }
    });
  };

  const handleRefund = () => {
    setShowRefundConfirm(true);
  };

  const confirmRefund = () => {
    setRefundError(null);
    startTransition(async () => {
      try {
        const refundAmountInCents = Math.round(parseFloat(refundAmount) * 100);

        const response = await fetch("/api/orders/refund-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            paymentIntentId,
            amount: refundAmountInCents,
            reason: refundReason || "requested_by_customer",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setRefundError(result.error || "Failed to process refund");
          setShowRefundConfirm(false);
          return;
        }

        setRefundSuccess(true);
        setShowRefundConfirm(false);
        setRefundAmount("");
        setRefundReason("");

        // Refresh the page to show updated payment status
        router.refresh();
      } catch (e) {
        setRefundError("An unexpected error occurred");
        setShowRefundConfirm(false);
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

  if (paymentStatus === "paid" || paymentStatus === "partially_refunded") {
    const amountPaid = currentTotal;
    const amountRefundable = amountPaid - totalRefunded;
    const parsedRefundAmount = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : 0;

    return (
      <>
        <div className={`${paymentStatus === "paid" ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"} rounded-xl border p-6 mb-6`}>
          <div className="flex items-center gap-3">
            <DollarSign className={`w-5 h-5 ${paymentStatus === "paid" ? "text-green-600" : "text-orange-600"}`} />
            <div>
              <h3 className={`font-semibold ${paymentStatus === "paid" ? "text-green-800" : "text-orange-800"}`}>
                {paymentStatus === "paid" ? "Payment Complete" : "Partially Refunded"}
              </h3>
              <p className={`text-sm ${paymentStatus === "paid" ? "text-green-700" : "text-orange-700"}`}>
                {paymentStatus === "paid"
                  ? "This order has been paid in full."
                  : `${formatCurrency(totalRefunded / 100)} has been refunded.`}
              </p>
            </div>
          </div>
        </div>

        {refundSuccess && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Refund Processed</h3>
                <p className="text-sm text-green-700">
                  {formatCurrency(parsedRefundAmount / 100)} has been refunded to the customer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Refund Section */}
        {amountRefundable > 0 && (
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
              <h2 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Process Refund
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {refundError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-800">
                  <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>{refundError}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase mb-1">Total Paid</p>
                  <p className="text-lg font-semibold text-[var(--color-charcoal)]">
                    {formatCurrency(amountPaid / 100)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase mb-1">Total Refunded</p>
                  <p className="text-lg font-semibold text-[var(--color-charcoal)]">
                    {formatCurrency(totalRefunded / 100)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase mb-1">Available to Refund</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(amountRefundable / 100)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
                  Refund Amount
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-lg text-[var(--color-muted)]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={(amountRefundable / 100).toFixed(2)}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-32 px-3 py-2 text-lg font-semibold border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    disabled={isPending}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefundAmount((amountRefundable / 100).toFixed(2))}
                    disabled={isPending}
                  >
                    Full Amount
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
                  Reason (Optional)
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  disabled={isPending}
                >
                  <option value="">Select a reason...</option>
                  <option value="requested_by_customer">Requested by customer</option>
                  <option value="duplicate">Duplicate order</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Button
                onClick={handleRefund}
                disabled={isPending || !refundAmount || parsedRefundAmount <= 0 || parsedRefundAmount > amountRefundable}
                variant="outline"
                className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Refund {refundAmount ? formatCurrency(parsedRefundAmount / 100) : formatCurrency(0)}
              </Button>

              {parsedRefundAmount > 0 && parsedRefundAmount < amountRefundable && (
                <p className="text-sm text-[var(--color-muted)]">
                  This is a partial refund. {formatCurrency((amountRefundable - parsedRefundAmount) / 100)} will remain paid.
                </p>
              )}
            </div>

            {/* Refund Confirmation Modal */}
            {showRefundConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md mx-4">
                  <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">
                    Confirm Refund
                  </h3>
                  <p className="text-[var(--color-muted)] mb-4">
                    You are about to refund{" "}
                    <strong className="text-[var(--color-charcoal)]">
                      {formatCurrency(parsedRefundAmount / 100)}
                    </strong>
                    {" "}to the customer. This action cannot be undone.
                    {refundReason && (
                      <span className="block mt-2 text-sm">
                        Reason: <strong>{refundReason.replace(/_/g, " ")}</strong>
                      </span>
                    )}
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowRefundConfirm(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmRefund}
                      disabled={isPending}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Confirm Refund
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </>
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
          {!canCapture && (
            <span className="ml-auto text-xs font-normal text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
              Capture Disabled
            </span>
          )}
        </h2>
      </div>

      <div className="p-6 space-y-4">
        {/* Diagnostic information when capture is disabled */}
        {!canCapture && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-900 mb-2">Capture Requirements:</p>
            <ul className="text-sm space-y-1">
              <li className={paymentStatus === "authorized" ? "text-green-700" : "text-red-700"}>
                {paymentStatus === "authorized" ? "✓" : "✗"} Payment Status: {paymentStatus}
                {paymentStatus !== "authorized" && " (must be 'authorized')"}
              </li>
              <li className={!hasUnweighedItems ? "text-green-700" : "text-red-700"}>
                {!hasUnweighedItems ? "✓" : "✗"} All weight-based items weighed
                {hasUnweighedItems && " (weight entry required)"}
              </li>
              <li className={stripeStatus === "requires_capture" ? "text-green-700" : "text-red-700"}>
                {stripeStatus === "requires_capture" ? "✓" : "✗"} Stripe Status: {stripeStatus}
                {stripeStatus !== "requires_capture" && " (must be 'requires_capture')"}
              </li>
            </ul>
          </div>
        )}

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
