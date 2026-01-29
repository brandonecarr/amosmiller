"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, CreditCard, X, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui";
import { createSetupIntent, savePaymentMethod } from "@/lib/actions/payment-methods";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodButtonProps {
  userId: string;
}

function AddCardForm({
  userId,
  clientSecret,
  onSuccess,
  onCancel,
}: {
  userId: string;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setIsProcessing(false);
      return;
    }

    const { error: setupError, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (setupError) {
      setError(setupError.message || "Failed to add card");
      setIsProcessing(false);
      return;
    }

    if (setupIntent?.payment_method) {
      startTransition(async () => {
        const result = await savePaymentMethod(
          userId,
          setupIntent.payment_method as string,
          setAsDefault
        );

        if (result.error) {
          setError(result.error);
          setIsProcessing(false);
          return;
        }

        onSuccess();
        router.refresh();
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
          Card Details
        </label>
        <div className="border border-[var(--color-border)] rounded-lg p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1a1a1a",
                  "::placeholder": {
                    color: "#888",
                  },
                },
                invalid: {
                  color: "#ef4444",
                },
              },
            }}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
        />
        <span className="text-sm">Set as default payment method</span>
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isProcessing || isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || isProcessing || isPending}
        >
          {isProcessing || isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Card"
          )}
        </Button>
      </div>
    </form>
  );
}

export function AddPaymentMethodButton({ userId }: AddPaymentMethodButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    setIsLoading(true);
    setError(null);

    const result = await createSetupIntent(userId);

    if (result.error || !result.data?.clientSecret) {
      setError(result.error || "Failed to initialize");
      setIsLoading(false);
      return;
    }

    setClientSecret(result.data.clientSecret);
    setShowModal(true);
    setIsLoading(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setClientSecret(null);
  };

  return (
    <>
      <Button onClick={handleOpen} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        Add Payment Method
      </Button>

      {error && !showModal && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm z-50">
          {error}
        </div>
      )}

      {showModal && clientSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[var(--color-primary-600)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">
                  Add Payment Method
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Your card will be securely saved
                </p>
              </div>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <AddCardForm
                userId={userId}
                clientSecret={clientSecret}
                onSuccess={handleClose}
                onCancel={handleClose}
              />
            </Elements>
          </div>
        </div>
      )}
    </>
  );
}
