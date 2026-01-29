"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { getStripe } from "@/lib/stripe/client";

interface PaymentFormProps {
  clientSecret: string;
  total: number;
  onSuccess: () => void;
}

function CheckoutForm({ total, onSuccess }: { total: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
      redirect: "if_required",
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setErrorMessage(error.message || "An error occurred");
      } else {
        setErrorMessage("An unexpected error occurred");
      }
      setIsProcessing(false);
    } else {
      // Payment succeeded
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--color-primary-100)] rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[var(--color-primary-500)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-charcoal)]">
              Payment Details
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Your payment is secure and encrypted
            </p>
          </div>
        </div>

        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-[var(--color-error-50)] text-[var(--color-error)] rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-muted)]">
        <Lock className="w-4 h-4" />
        <span>Payments secured by Stripe</span>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>Pay {formatCurrency(total)}</>
        )}
      </Button>

      <p className="text-xs text-center text-[var(--color-muted)]">
        By completing this purchase, you agree to our Terms of Service and Privacy Policy.
        Your card will be authorized but not charged until your order is packed.
      </p>
    </form>
  );
}

export function PaymentForm({ clientSecret, total, onSuccess }: PaymentFormProps) {
  const stripePromise = getStripe();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2D5A3D",
            colorBackground: "#ffffff",
            colorText: "#1A1A1A",
            colorDanger: "#dc2626",
            fontFamily: "Inter, system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      }}
    >
      <CheckoutForm total={total} onSuccess={onSuccess} />
    </Elements>
  );
}
