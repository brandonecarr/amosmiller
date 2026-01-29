import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserStoreCredits, getStoreCreditHistory } from "@/lib/actions/store-credits";
import { formatCurrency } from "@/lib/utils";
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, ShoppingBag } from "lucide-react";

interface StoreCreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  reason: string | null;
  order_id: string | null;
  created_by: string | null;
  created_at: string;
}

export const metadata = {
  title: "Store Credits | Amos Miller Farm",
  description: "View your store credit balance and history",
};

export default async function StoreCreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/store-credits");
  }

  const [balanceResult, historyResult] = await Promise.all([
    getUserStoreCredits(user.id),
    getStoreCreditHistory(user.id),
  ]);

  const balance = balanceResult.balance || 0;
  const history: StoreCreditTransaction[] = historyResult.data || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
          Store Credits
        </h1>
        <p className="text-[var(--color-muted)] mt-1">
          View your credit balance and transaction history
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] rounded-xl p-6 text-white mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm opacity-90">Available Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
          </div>
        </div>
        <p className="text-sm opacity-75">
          Store credits are automatically applied at checkout
        </p>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-charcoal)]">
            Transaction History
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)]">
              No transactions yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {history.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.amount > 0
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {transaction.amount > 0 ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-charcoal)]">
                    {transaction.reason || (transaction.amount > 0 ? "Credit Added" : "Credit Used")}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {new Date(transaction.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {transaction.order_id && (
                    <p className="text-xs text-[var(--color-muted)] flex items-center gap-1 mt-1">
                      <ShoppingBag className="w-3 h-3" />
                      Order #{transaction.order_id.slice(0, 8)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Balance: {formatCurrency(transaction.balance_after)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-[var(--color-slate-50)] rounded-lg">
        <h3 className="font-medium text-[var(--color-charcoal)] mb-2">
          How Store Credits Work
        </h3>
        <ul className="text-sm text-[var(--color-muted)] space-y-1">
          <li>• Credits are automatically applied to your next order at checkout</li>
          <li>• You can choose how much credit to apply to each order</li>
          <li>• Credits may be issued for returns, promotions, or referrals</li>
          <li>• Store credits never expire</li>
        </ul>
      </div>
    </div>
  );
}
