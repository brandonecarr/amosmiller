"use client";

import { useState } from "react";
import { Gift, Mail, User, MessageSquare, Check } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { purchaseGiftCard } from "@/lib/actions/gift-cards";
import { formatCurrency } from "@/lib/utils";

const PRESET_AMOUNTS = [25, 50, 75, 100, 150, 200];

export function GiftCardPurchase() {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setIsCustom(true);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 10 && num <= 500) {
      setAmount(num);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await purchaseGiftCard({
        amount,
        recipientName,
        recipientEmail,
        senderName,
        personalMessage: personalMessage || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setGiftCardCode(result.data.code);
        setSuccess(true);
      }
    } catch (err) {
      setError("Failed to purchase gift card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success && giftCardCode) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-xl border border-[var(--color-border)] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">
          Gift Card Sent!
        </h2>
        <p className="text-[var(--color-muted)] mb-6">
          A {formatCurrency(amount)} gift card has been sent to {recipientEmail}
        </p>
        <div className="bg-[var(--color-slate-50)] rounded-lg p-4 mb-6">
          <p className="text-sm text-[var(--color-muted)] mb-1">Gift Card Code</p>
          <p className="text-2xl font-mono font-bold text-[var(--color-primary-600)]">
            {giftCardCode}
          </p>
        </div>
        <Button onClick={() => {
          setSuccess(false);
          setGiftCardCode(null);
          setRecipientName("");
          setRecipientEmail("");
          setPersonalMessage("");
        }}>
          Send Another Gift Card
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Preview */}
        <div className="bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] p-8 text-white">
          <div className="max-w-sm mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="w-8 h-8" />
                <span className="font-semibold text-lg">Amos Miller Farm</span>
              </div>
              <p className="text-4xl font-bold mb-2">{formatCurrency(amount)}</p>
              <p className="text-sm opacity-75">Digital Gift Card</p>
              {recipientName && (
                <p className="mt-4 pt-4 border-t border-white/20">
                  For: {recipientName}
                </p>
              )}
              {personalMessage && (
                <p className="mt-2 text-sm italic opacity-90">
                  &ldquo;{personalMessage}&rdquo;
                </p>
              )}
              {senderName && (
                <p className="mt-2 text-sm opacity-75">
                  From: {senderName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-3">
                Select Amount
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PRESET_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleAmountSelect(value)}
                    className={`py-3 px-4 rounded-lg border font-medium transition-colors ${
                      amount === value && !isCustom
                        ? "bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]"
                        : "bg-white text-[var(--color-charcoal)] border-[var(--color-border)] hover:border-[var(--color-primary-500)]"
                    }`}
                  >
                    ${value}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Custom amount ($10 - $500)"
                  value={customAmount}
                  onChange={(e) => handleCustomAmount(e.target.value)}
                  min={10}
                  max={500}
                  className={`w-full pl-7 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] ${
                    isCustom
                      ? "border-[var(--color-primary-500)]"
                      : "border-[var(--color-border)]"
                  }`}
                />
              </div>
            </div>

            {/* Recipient Info */}
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                <Input
                  label="Recipient Name"
                  placeholder="Who is this gift for?"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-[38px] w-4 h-4 text-[var(--color-muted)]" />
                <Input
                  label="Recipient Email"
                  type="email"
                  placeholder="Where should we send it?"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sender Info */}
            <Input
              label="Your Name"
              placeholder="So they know who it's from"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
            />

            {/* Personal Message */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Personal Message (optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-[var(--color-muted)]" />
                <textarea
                  placeholder="Add a personal note..."
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  rows={3}
                  maxLength={200}
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-1 text-right">
                {personalMessage.length}/200
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
              disabled={amount < 10 || amount > 500}
            >
              <Gift className="w-4 h-4 mr-2" />
              Purchase Gift Card - {formatCurrency(amount)}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
