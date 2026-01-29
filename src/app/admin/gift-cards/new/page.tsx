"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gift, Check } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { createGiftCard, generateGiftCardCode } from "@/lib/actions/gift-cards";
import { formatCurrency } from "@/lib/utils";

export default function NewGiftCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdCard, setCreatedCard] = useState<{ code: string; amount: number } | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    code: "",
    recipientName: "",
    recipientEmail: "",
    personalMessage: "",
    expiresAt: "",
  });

  const handleGenerateCode = async () => {
    const code = await generateGiftCardCode();
    setFormData({ ...formData, code: code.replace(/-/g, "") });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createGiftCard({
        code: formData.code || undefined,
        initial_balance: parseFloat(formData.amount),
        current_balance: parseFloat(formData.amount),
        recipient_name: formData.recipientName || null,
        recipient_email: formData.recipientEmail || null,
        personal_message: formData.personalMessage || null,
        expires_at: formData.expiresAt || null,
        is_active: true,
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      setCreatedCard({
        code: result.data.code,
        amount: parseFloat(formData.amount),
      });
      setSuccess(true);
    } catch (error) {
      console.error("Error creating gift card:", error);
      alert("Failed to create gift card");
    } finally {
      setLoading(false);
    }
  };

  if (success && createdCard) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">
            Gift Card Created!
          </h2>
          <p className="text-[var(--color-muted)] mb-6">
            {formatCurrency(createdCard.amount)} gift card is ready
          </p>
          <div className="bg-[var(--color-slate-50)] rounded-lg p-4 mb-6">
            <p className="text-sm text-[var(--color-muted)] mb-1">Gift Card Code</p>
            <p className="text-2xl font-mono font-bold text-[var(--color-primary-600)]">
              {createdCard.code.match(/.{1,4}/g)?.join("-")}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSuccess(false);
                setCreatedCard(null);
                setFormData({
                  amount: "",
                  code: "",
                  recipientName: "",
                  recipientEmail: "",
                  personalMessage: "",
                  expiresAt: "",
                });
              }}
            >
              Create Another
            </Button>
            <Link href="/admin/gift-cards" className="flex-1">
              <Button className="w-full">View All Cards</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin/gift-cards"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Gift Cards
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center">
          <Gift className="w-5 h-5 text-[var(--color-primary-600)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Create Gift Card
          </h1>
          <p className="text-[var(--color-muted)]">
            Generate a new gift card for a customer
          </p>
        </div>
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full pl-7 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Code (auto-generated if empty)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] font-mono uppercase"
                placeholder="AUTO-GENERATED"
              />
              <Button type="button" variant="outline" onClick={handleGenerateCode}>
                Generate
              </Button>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6">
            <h3 className="font-medium text-[var(--color-charcoal)] mb-4">
              Recipient Information (Optional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Recipient Name"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                placeholder="John Doe"
              />
              <Input
                label="Recipient Email"
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Personal Message
              </label>
              <textarea
                value={formData.personalMessage}
                onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                placeholder="Add a personal message..."
              />
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Leave empty for no expiration
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={loading} disabled={!formData.amount}>
              Create Gift Card
            </Button>
            <Link href="/admin/gift-cards">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
