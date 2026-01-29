import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserGiftCards } from "@/lib/actions/gift-cards";
import { formatCurrency } from "@/lib/utils";
import { Gift, CreditCard, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

interface GiftCard {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  expires_at: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  personal_message: string | null;
  purchased_by_user_id: string | null;
  redeemed_by_user_id: string | null;
  created_at: string;
}

export const metadata = {
  title: "Gift Cards | Amos Miller Farm",
  description: "View and manage your gift cards",
};

export default async function GiftCardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/gift-cards");
  }

  const { data: giftCards } = await getUserGiftCards(user.id);

  // Separate into purchased and received
  const purchasedCards: GiftCard[] = giftCards?.filter((gc: GiftCard) => gc.purchased_by_user_id === user.id) || [];
  const receivedCards: GiftCard[] = giftCards?.filter((gc: GiftCard) => gc.redeemed_by_user_id === user.id && gc.purchased_by_user_id !== user.id) || [];
  const totalBalance = giftCards?.reduce((sum: number, gc: GiftCard) => sum + (gc.current_balance || 0), 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Gift Cards
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            View your purchased and received gift cards
          </p>
        </div>
        <Link href="/gift-cards">
          <Button>
            <Gift className="w-4 h-4 mr-2" />
            Buy a Gift Card
          </Button>
        </Link>
      </div>

      {/* Total Balance */}
      <div className="bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] rounded-xl p-6 text-white mb-8">
        <p className="text-sm opacity-90 mb-1">Total Gift Card Balance</p>
        <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
        <p className="text-sm opacity-75 mt-2">
          Available to use at checkout
        </p>
      </div>

      {/* Purchased Cards */}
      {purchasedCards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--color-charcoal)] mb-4">
            Cards You&apos;ve Purchased
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchasedCards.map((card) => (
              <GiftCardItem key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Received Cards */}
      {receivedCards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--color-charcoal)] mb-4">
            Cards You&apos;ve Received
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receivedCards.map((card) => (
              <GiftCardItem key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {giftCards?.length === 0 && (
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-12 text-center">
          <Gift className="w-16 h-16 mx-auto mb-4 text-[var(--color-muted)]" />
          <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">
            No gift cards yet
          </h3>
          <p className="text-[var(--color-muted)] mb-6 max-w-sm mx-auto">
            Purchase a gift card to share the gift of farm-fresh food with friends and family
          </p>
          <Link href="/gift-cards">
            <Button>
              <Gift className="w-4 h-4 mr-2" />
              Shop Gift Cards
            </Button>
          </Link>
        </div>
      )}

      {/* Check Balance Link */}
      <div className="mt-8 p-4 bg-[var(--color-slate-50)] rounded-lg">
        <p className="text-sm text-[var(--color-muted)]">
          Have a gift card code?{" "}
          <Link
            href="/gift-cards/check-balance"
            className="text-[var(--color-primary-500)] hover:underline font-medium"
          >
            Check your balance
            <ArrowRight className="w-3 h-3 inline ml-1" />
          </Link>
        </p>
      </div>
    </div>
  );
}

function GiftCardItem({ card }: { card: GiftCard }) {
  const isExpired = card.expires_at && new Date(card.expires_at) < new Date();
  const usedAmount = card.initial_balance - card.current_balance;
  const usedPercentage = (usedAmount / card.initial_balance) * 100;

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden ${
        isExpired || !card.is_active
          ? "border-[var(--color-border)] opacity-60"
          : "border-[var(--color-border)]"
      }`}
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-[var(--color-primary-100)] to-[var(--color-cream-100)] p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--color-primary-600)]" />
            <span className="font-mono text-sm font-medium text-[var(--color-primary-700)]">
              {card.code}
            </span>
          </div>
          {(isExpired || !card.is_active) && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
              {isExpired ? "Expired" : "Inactive"}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-xs text-[var(--color-muted)]">Balance</p>
            <p className="text-2xl font-bold text-[var(--color-charcoal)]">
              {formatCurrency(card.current_balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--color-muted)]">Original</p>
            <p className="text-sm text-[var(--color-muted)]">
              {formatCurrency(card.initial_balance)}
            </p>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mb-3">
          <div className="h-2 bg-[var(--color-slate-100)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary-500)] rounded-full transition-all"
              style={{ width: `${100 - usedPercentage}%` }}
            />
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            {formatCurrency(usedAmount)} used
          </p>
        </div>

        {/* Details */}
        <div className="space-y-1 text-sm">
          {card.recipient_name && (
            <p className="text-[var(--color-muted)]">
              For: <span className="text-[var(--color-charcoal)]">{card.recipient_name}</span>
            </p>
          )}
          {card.expires_at && (
            <p className="flex items-center gap-1 text-[var(--color-muted)]">
              <Calendar className="w-3 h-3" />
              Expires: {new Date(card.expires_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {card.personal_message && (
          <div className="mt-3 p-2 bg-[var(--color-slate-50)] rounded text-sm text-[var(--color-muted)] italic">
            &ldquo;{card.personal_message}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
