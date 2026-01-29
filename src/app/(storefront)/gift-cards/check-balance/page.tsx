"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Search, ArrowLeft, Gift } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { checkGiftCardBalance } from "@/lib/actions/gift-cards";
import { formatCurrency } from "@/lib/utils";

export default function CheckBalancePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    balance: number | null;
    error: string | null;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const checkResult = await checkGiftCardBalance(code);
      setResult(checkResult);
    } catch {
      setResult({ balance: null, error: "Failed to check balance. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Link
        href="/gift-cards"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Gift Cards
      </Link>

      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-[var(--color-primary-600)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-charcoal)] mb-2">
          Check Gift Card Balance
        </h1>
        <p className="text-[var(--color-muted)]">
          Enter your gift card code to see your available balance
        </p>
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              Gift Card Code
            </label>
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={(e) => {
                // Auto-format with dashes
                const value = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                const formatted = value.match(/.{1,4}/g)?.join("-") || value;
                setCode(formatted.slice(0, 19)); // Max 16 chars + 3 dashes
              }}
              className="w-full px-4 py-3 text-center font-mono text-lg tracking-wider border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={loading}
            disabled={!code.trim()}
          >
            <Search className="w-4 h-4 mr-2" />
            Check Balance
          </Button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            {result.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-700">{result.error}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-[var(--color-muted)] mb-2">
                  Available Balance
                </p>
                <p className="text-4xl font-bold text-[var(--color-primary-600)]">
                  {formatCurrency(result.balance || 0)}
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-[var(--color-primary-600)] hover:underline"
                >
                  Start Shopping
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Purchase Link */}
      <div className="mt-8 text-center">
        <p className="text-[var(--color-muted)] mb-2">
          Don&apos;t have a gift card?
        </p>
        <Link href="/gift-cards">
          <Button variant="outline">
            <Gift className="w-4 h-4 mr-2" />
            Purchase a Gift Card
          </Button>
        </Link>
      </div>
    </div>
  );
}
