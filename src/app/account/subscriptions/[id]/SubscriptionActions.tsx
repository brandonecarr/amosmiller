"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SkipForward, Pause, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import {
  skipNextOrder,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from "@/lib/actions/subscriptions";

interface SubscriptionActionsProps {
  subscriptionId: string;
  status: string;
  showSkip?: boolean;
  showAll?: boolean;
}

export function SubscriptionActions({
  subscriptionId,
  status,
  showSkip = false,
  showAll = false,
}: SubscriptionActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionType, setActionType] = useState<string | null>(null);

  const handleSkip = () => {
    setActionType("skip");
    startTransition(async () => {
      const result = await skipNextOrder(subscriptionId);
      if (result.error) {
        alert(`Error: ${result.error}`);
      }
      setActionType(null);
      router.refresh();
    });
  };

  const handlePause = () => {
    setActionType("pause");
    startTransition(async () => {
      const result = await pauseSubscription(subscriptionId);
      if (result.error) {
        alert(`Error: ${result.error}`);
      }
      setActionType(null);
      router.refresh();
    });
  };

  const handleResume = () => {
    setActionType("resume");
    startTransition(async () => {
      const result = await resumeSubscription(subscriptionId);
      if (result.error) {
        alert(`Error: ${result.error}`);
      }
      setActionType(null);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setActionType("cancel");
    startTransition(async () => {
      const result = await cancelSubscription(subscriptionId, cancelReason);
      if (result.error) {
        alert(`Error: ${result.error}`);
      }
      setShowCancelModal(false);
      setCancelReason("");
      setActionType(null);
      router.refresh();
    });
  };

  const isActive = status === "active";
  const isPaused = status === "paused";

  if (showSkip && isActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSkip}
        disabled={isPending}
      >
        {isPending && actionType === "skip" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <SkipForward className="w-4 h-4 mr-2" />
        )}
        Skip This Order
      </Button>
    );
  }

  if (showAll) {
    return (
      <>
        <div className="space-y-3">
          {isActive && (
            <>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSkip}
                disabled={isPending}
              >
                {isPending && actionType === "skip" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <SkipForward className="w-4 h-4 mr-2" />
                )}
                Skip Next Order
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handlePause}
                disabled={isPending}
              >
                {isPending && actionType === "pause" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Pause className="w-4 h-4 mr-2" />
                )}
                Pause Subscription
              </Button>
            </>
          )}

          {isPaused && (
            <Button
              className="w-full justify-start"
              onClick={handleResume}
              disabled={isPending}
            >
              {isPending && actionType === "resume" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Resume Subscription
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowCancelModal(true)}
            disabled={isPending}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Subscription
          </Button>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4 w-full">
              <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">
                Cancel Subscription?
              </h3>
              <p className="text-[var(--color-muted)] mb-4">
                Are you sure you want to cancel this subscription? You can always
                resubscribe later.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1">
                  Reason for cancelling (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Let us know why you're cancelling..."
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  disabled={isPending}
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  {isPending && actionType === "cancel" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
