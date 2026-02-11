"use client";

import { useState, useTransition } from "react";
import { Mail, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui";
import { sendOrderConfirmationEmail } from "@/lib/email/order-emails";

interface SendEmailButtonProps {
  order: any; // Full order object
}

export function SendEmailButton({ order }: SendEmailButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [showMenu, setShowMenu] = useState(false);

  const handleSendEmail = (emailType: "confirmation" | "status") => {
    setStatus("idle");
    setShowMenu(false);

    startTransition(async () => {
      try {
        let result;

        if (emailType === "confirmation") {
          result = await sendOrderConfirmationEmail(order);
        } else {
          // For status update, we can add logic later
          result = { success: false, error: "Not implemented yet" };
        }

        if (result.success) {
          setStatus("success");
          setTimeout(() => setStatus("idle"), 3000);
        } else {
          setStatus("error");
          setTimeout(() => setStatus("idle"), 5000);
        }
      } catch (error) {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 5000);
      }
    });
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : status === "success" ? (
          <Check className="w-4 h-4 mr-2 text-green-600" />
        ) : status === "error" ? (
          <X className="w-4 h-4 mr-2 text-red-600" />
        ) : (
          <Mail className="w-4 h-4 mr-2" />
        )}
        {status === "success"
          ? "Email Sent!"
          : status === "error"
            ? "Failed"
            : "Send Email"}
      </Button>

      {showMenu && !isPending && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1 z-10 min-w-[200px]">
          <button
            onClick={() => handleSendEmail("confirmation")}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
          >
            Resend Order Confirmation
          </button>
          <button
            onClick={() => handleSendEmail("status")}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors text-gray-400"
            disabled
          >
            Send Status Update (Coming Soon)
          </button>
        </div>
      )}

      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
