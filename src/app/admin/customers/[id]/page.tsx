import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserStoreCredits, getStoreCreditHistory } from "@/lib/actions/store-credits";
import { getUserGiftCards } from "@/lib/actions/gift-cards";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Wallet,
  Gift,
  MapPin,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { AddStoreCreditForm } from "./AddStoreCreditForm";

interface StoreCreditTransaction {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

interface GiftCardData {
  id: string;
  code: string;
  current_balance: number;
  purchased_by_user_id: string | null;
}

interface OrderData {
  id: string;
  order_number: number;
  total: number | null;
  status: string;
  created_at: string;
}

interface AddressData {
  id: string;
  label: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

export const metadata = {
  title: "Customer Details | Admin | Amos Miller Farm",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get customer
  const { data: customer, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  // Get orders
  const { data: ordersData } = await supabase
    .from("orders")
    .select("id, order_number, total, status, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(10);
  const orders: OrderData[] = ordersData || [];

  // Get addresses
  const { data: addressesData } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", id)
    .order("is_default", { ascending: false });
  const addresses: AddressData[] = addressesData || [];

  // Get store credit balance and history
  const [creditBalanceResult, creditHistoryResult] = await Promise.all([
    getUserStoreCredits(id),
    getStoreCreditHistory(id),
  ]);

  const creditBalance = creditBalanceResult.balance || 0;
  const creditHistory: StoreCreditTransaction[] = creditHistoryResult.data || [];

  // Get gift cards
  const { data: giftCardsData } = await getUserGiftCards(id);
  const giftCards: GiftCardData[] = giftCardsData || [];

  // Calculate stats
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] text-2xl font-bold">
            {customer.full_name?.[0]?.toUpperCase() || customer.email[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
              {customer.full_name || "Unnamed Customer"}
            </h1>
            <p className="text-[var(--color-muted)] flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {customer.email}
            </p>
            {customer.phone && (
              <p className="text-[var(--color-muted)] flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {customer.phone}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <Calendar className="w-4 h-4" />
          Customer since {new Date(customer.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-muted)] mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-muted)] mb-1">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-muted)] mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Store Credit</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(creditBalance)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-muted)] mb-1">
            <Gift className="w-4 h-4" />
            <span className="text-sm">Gift Cards</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{giftCards?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Credit Section */}
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-charcoal)]">
              Store Credits
            </h2>
            <AddStoreCreditForm userId={id} currentBalance={creditBalance} />
          </div>

          {creditHistory.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)] max-h-80 overflow-auto">
              {creditHistory.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.amount > 0
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-charcoal)] truncate">
                      {transaction.reason || (transaction.amount > 0 ? "Credit Added" : "Credit Used")}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--color-muted)]">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No credit history</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-charcoal)]">
              Recent Orders
            </h2>
          </div>

          {orders && orders.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)] max-h-80 overflow-auto">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="p-4 flex items-center gap-3 hover:bg-[var(--color-slate-50)]"
                >
                  <div className="flex-1">
                    <p className="font-medium text-[var(--color-charcoal)]">
                      Order #{order.order_number}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.total || 0)}</p>
                    <p
                      className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--color-muted)]">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>

        {/* Addresses */}
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-charcoal)]">
              Saved Addresses
            </h2>
          </div>

          {addresses && addresses.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {addresses.map((address) => (
                <div key={address.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-[var(--color-primary-500)]" />
                    <span className="font-medium text-[var(--color-charcoal)]">
                      {address.label}
                    </span>
                    {address.is_default && (
                      <span className="text-xs px-2 py-0.5 bg-[var(--color-primary-100)] text-[var(--color-primary-700)] rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">
                    {address.full_name}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--color-muted)]">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No saved addresses</p>
            </div>
          )}
        </div>

        {/* Gift Cards */}
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-charcoal)]">
              Gift Cards
            </h2>
          </div>

          {giftCards && giftCards.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {giftCards.map((card) => (
                <div key={card.id} className="p-4 flex items-center gap-3">
                  <Gift className="w-5 h-5 text-[var(--color-primary-500)]" />
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">
                      {card.code.match(/.{1,4}/g)?.join("-")}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {card.purchased_by_user_id === id ? "Purchased" : "Received"}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(card.current_balance)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--color-muted)]">
              <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No gift cards</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
