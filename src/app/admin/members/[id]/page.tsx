import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserStoreCredits, getStoreCreditHistory } from "@/lib/actions/store-credits";
import { getUserGiftCards } from "@/lib/actions/gift-cards";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Wallet,
  Gift,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { MembershipBadge } from "@/components/admin/MembershipBadge";
import { AddStoreCreditForm } from "./AddStoreCreditForm";

interface OrderData {
  id: string;
  order_number: number;
  total: number | null;
  membership_fee: number;
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

export const metadata = {
  title: "Member Details | Admin | Amos Miller Farm",
};

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ordersPage?: string }>;
}) {
  const { id } = await params;
  const { ordersPage } = await searchParams;
  const currentOrdersPage = parseInt(ordersPage || "1");
  const ordersPageSize = 10;
  const ordersOffset = (currentOrdersPage - 1) * ordersPageSize;

  const supabase = await createClient();

  // Get member profile
  const { data: member, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("is_member", true)
    .single();

  if (error || !member) {
    notFound();
  }

  // Get ALL orders with pagination (not just last 10)
  const { data: ordersData, count: ordersCount } = await supabase
    .from("orders")
    .select("id, order_number, total, membership_fee, status, created_at", { count: "exact" })
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .range(ordersOffset, ordersOffset + ordersPageSize - 1);
  const orders: OrderData[] = ordersData || [];
  const totalOrdersPages = Math.ceil((ordersCount || 0) / ordersPageSize);

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
  const totalOrders = ordersCount || 0;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const giftCardBalance = giftCards.reduce((sum, gc) => sum + gc.current_balance, 0);

  return (
    <div>
      <Link
        href="/admin/members"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Members
      </Link>

      {/* Header with MembershipBadge */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] text-2xl font-bold">
            {member.full_name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
                {member.full_name || "Unnamed Member"}
              </h1>
              <MembershipBadge tier={member.membership_option} size="lg" />
            </div>
            <p className="text-[var(--color-muted)] flex items-center gap-1 mt-1">
              <Mail className="w-4 h-4" />
              {member.email}
            </p>
            {member.phone && (
              <p className="text-[var(--color-muted)] flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {member.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row (5 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-muted)] mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-muted)] mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Store Credit</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(creditBalance)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Gift className="w-4 h-4" />
            <span className="text-sm">Gift Cards</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(giftCardBalance)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-muted)] mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Member Since</span>
          </div>
          <p className="text-sm font-medium text-[var(--color-charcoal)]">
            {member.membership_paid_at
              ? new Date(member.membership_paid_at).toLocaleDateString()
              : new Date(member.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Section with Pagination */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">
                All Orders ({totalOrders})
              </h2>
            </div>
            {orders.length > 0 ? (
              <>
                <table className="w-full">
                  <thead className="bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                        Order #
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                        Total
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                        Membership Fee
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[var(--color-slate-50)]">
                        <td className="px-4 py-3 font-medium text-[var(--color-charcoal)]">
                          #{order.order_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              order.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : order.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(order.total || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {order.membership_fee > 0 ? (
                            <span className="text-amber-600 font-medium">
                              {formatCurrency(order.membership_fee)}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted)]">\u2014</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Orders Pagination */}
                {totalOrdersPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-muted)]">
                      Showing {ordersOffset + 1} to {Math.min(ordersOffset + ordersPageSize, ordersCount || 0)} of{" "}
                      {ordersCount} orders
                    </p>
                    <div className="flex gap-2">
                      {currentOrdersPage > 1 && (
                        <Link href={`/admin/members/${id}?ordersPage=${currentOrdersPage - 1}`}>
                          <Button variant="outline" size="sm">Previous</Button>
                        </Link>
                      )}
                      {currentOrdersPage < totalOrdersPages && (
                        <Link href={`/admin/members/${id}?ordersPage=${currentOrdersPage + 1}`}>
                          <Button variant="outline" size="sm">Next</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-[var(--color-muted)]" />
                <p className="text-[var(--color-muted)]">No orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Store Credits Section */}
        <div>
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">
                Store Credit
              </h2>
              <AddStoreCreditForm userId={id} currentBalance={creditBalance} />
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-[var(--color-muted)] mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(creditBalance)}
                </p>
              </div>
              {creditHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[var(--color-muted)] mb-3">
                    Recent Transactions
                  </p>
                  <div className="space-y-2">
                    {creditHistory.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-start justify-between py-2 border-b border-[var(--color-border)] last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-[var(--color-charcoal)]">
                            {transaction.reason || "Store credit"}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            transaction.amount >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.amount >= 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gift Cards Section */}
        <div>
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">
                Gift Cards
              </h2>
            </div>
            {giftCards.length > 0 ? (
              <div className="divide-y divide-[var(--color-border)]">
                {giftCards.map((card) => (
                  <div key={card.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-mono text-sm text-[var(--color-charcoal)]">
                          {card.code}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {card.purchased_by_user_id === id ? "Purchased" : "Received"}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-purple-600">
                      {formatCurrency(card.current_balance)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Gift className="w-10 h-10 mx-auto mb-3 text-[var(--color-muted)]" />
                <p className="text-sm text-[var(--color-muted)]">No gift cards</p>
              </div>
            )}
          </div>
        </div>

        {/* Addresses Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">
                Addresses
              </h2>
            </div>
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 rounded-lg border ${
                      address.is_default
                        ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[var(--color-muted)]" />
                        <span className="font-medium text-sm text-[var(--color-charcoal)]">
                          {address.label || "Address"}
                        </span>
                      </div>
                      {address.is_default && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-500)] text-white">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[var(--color-muted)] space-y-0.5">
                      <p>{address.full_name}</p>
                      <p>{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>
                        {address.city}, {address.state} {address.postal_code}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <MapPin className="w-10 h-10 mx-auto mb-3 text-[var(--color-muted)]" />
                <p className="text-sm text-[var(--color-muted)]">No saved addresses</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
