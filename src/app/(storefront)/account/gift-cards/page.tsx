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
          <h1 className="text-2xl font-bold font-heading text-slate-900">
            Gift Cards
          </h1>
          <p className="text-slate-500 mt-1">
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
      <div className="bg-slate-900 rounded-2xl p-6 text-white mb-8">
        <p className="text-sm text-slate-300 mb-1">Total Gift Card Balance</p>
        <p className="text-4xl font-bold text-white">{formatCurrency(totalBalance)}</p>
        <p className="text-sm text-slate-400 mt-2">
          Available to use at checkout
        </p>
      </div>

      {/* Purchased Cards */}
      {purchasedCards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold font-heading text-slate-900 mb-4">
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
          <h2 className="text-lg font-semibold font-heading text-slate-900 mb-4">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Gift className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold font-heading text-slate-900 mb-2">
            No gift cards yet
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
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
      <div className="mt-8 p-4 bg-slate-50 rounded-2xl">
        <p className="text-sm text-slate-500">
          Have a gift card code?{" "}
          <Link
            href="/gift-cards/check-balance"
            className="text-orange-500 hover:text-orange-600 font-medium"
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
      className={`bg-white border rounded-2xl overflow-hidden ${
        isExpired || !card.is_active
          ? "border-slate-200 opacity-60"
          : "border-slate-200"
      }`}
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-orange-50 to-slate-50 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-500" />
            <span className="font-mono text-sm font-medium text-orange-700">
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
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(card.current_balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Original</p>
            <p className="text-sm text-slate-500">
              {formatCurrency(card.initial_balance)}
            </p>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mb-3">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${100 - usedPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {formatCurrency(usedAmount)} used
          </p>
        </div>

        {/* Details */}
        <div className="space-y-1 text-sm">
          {card.recipient_name && (
            <p className="text-slate-500">
              For: <span className="text-slate-900">{card.recipient_name}</span>
            </p>
          )}
          {card.expires_at && (
            <p className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3 h-3" />
              Expires: {new Date(card.expires_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {card.personal_message && (
          <div className="mt-3 p-2 bg-slate-50 rounded text-sm text-slate-500 italic">
            &ldquo;{card.personal_message}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
