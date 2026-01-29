import Link from "next/link";
import { getGiftCards } from "@/lib/actions/gift-cards";
import { formatCurrency } from "@/lib/utils";
import { Gift, Plus, Filter, CreditCard, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui";
import { GiftCardActions } from "./GiftCardActions";

interface GiftCardData {
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
  title: "Gift Cards | Admin | Amos Miller Farm",
  description: "Manage gift cards",
};

export default async function AdminGiftCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter;

  const filters: { is_active?: boolean; has_balance?: boolean } = {};
  if (filter === "active") filters.is_active = true;
  if (filter === "inactive") filters.is_active = false;
  if (filter === "has_balance") filters.has_balance = true;

  const { data: giftCardsData } = await getGiftCards(filters);
  const giftCards: GiftCardData[] = giftCardsData || [];

  // Stats
  const totalCards = giftCards.length;
  const activeCards = giftCards.filter((gc) => gc.is_active).length;
  const totalValue = giftCards.reduce((sum, gc) => sum + (gc.current_balance || 0), 0);
  const issuedValue = giftCards.reduce((sum, gc) => sum + (gc.initial_balance || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Gift Cards
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            Create and manage gift cards
          </p>
        </div>
        <Link href="/admin/gift-cards/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Gift Card
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Cards</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{totalCards}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Active Cards</p>
          <p className="text-2xl font-bold text-green-600">{activeCards}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Issued</p>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{formatCurrency(issuedValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-muted)]">Outstanding Balance</p>
          <p className="text-2xl font-bold text-[var(--color-primary-600)]">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-[var(--color-muted)]" />
        <Link
          href="/admin/gift-cards"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            !filter
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/gift-cards?filter=active"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filter === "active"
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          Active
        </Link>
        <Link
          href="/admin/gift-cards?filter=has_balance"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filter === "has_balance"
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          With Balance
        </Link>
        <Link
          href="/admin/gift-cards?filter=inactive"
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filter === "inactive"
              ? "bg-[var(--color-primary-500)] text-white"
              : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
          }`}
        >
          Inactive
        </Link>
      </div>

      {/* Gift Cards Table */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        {giftCards.length > 0 ? (
          <table className="w-full">
            <thead className="bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Code
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Balance
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Recipient
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Created
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {giftCards.map((card) => {
                const usedAmount = card.initial_balance - card.current_balance;
                const usedPercentage = (usedAmount / card.initial_balance) * 100;
                const isExpired = card.expires_at && new Date(card.expires_at) < new Date();

                return (
                  <tr key={card.id} className="hover:bg-[var(--color-slate-50)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[var(--color-primary-500)]" />
                        <span className="font-mono text-sm font-medium">
                          {card.code.match(/.{1,4}/g)?.join("-")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--color-charcoal)]">
                          {formatCurrency(card.current_balance)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-[var(--color-slate-100)] rounded-full max-w-[100px]">
                            <div
                              className="h-full bg-[var(--color-primary-500)] rounded-full"
                              style={{ width: `${100 - usedPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--color-muted)]">
                            of {formatCurrency(card.initial_balance)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {card.recipient_email ? (
                        <div>
                          <p className="text-sm text-[var(--color-charcoal)]">
                            {card.recipient_name || "—"}
                          </p>
                          <p className="text-xs text-[var(--color-muted)] flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {card.recipient_email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--color-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-[var(--color-charcoal)]">
                          {new Date(card.created_at).toLocaleDateString()}
                        </p>
                        {card.expires_at && (
                          <p className="text-xs text-[var(--color-muted)] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires {new Date(card.expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isExpired ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          Expired
                        </span>
                      ) : card.is_active ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <GiftCardActions giftCard={card} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <Gift className="w-12 h-12 mx-auto mb-4 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)] mb-4">No gift cards found</p>
            <Link href="/admin/gift-cards/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Gift Card
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
