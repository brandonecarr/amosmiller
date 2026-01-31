import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Wallet,
  Shield,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui";
import { MembershipBadge } from "@/components/admin/MembershipBadge";
import { getMemberStats } from "@/lib/actions/membership";

interface MemberData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_member: boolean;
  membership_option: "standard" | "preserve-america" | null;
  membership_paid_at: string | null;
  created_at: string;
}

interface OrderCount {
  user_id: string;
}

interface StoreCredit {
  user_id: string;
  amount: number;
}

export const metadata = {
  title: "Members | Admin | Amos Miller Farm",
  description: "Manage members",
};

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    tier?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const tier = params.tier || "";
  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const supabase = await createClient();

  // Get member stats
  const stats = await getMemberStats();

  // Build members query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("profiles")
    .select(
      "id, email, full_name, phone, is_member, membership_option, membership_paid_at, created_at",
      { count: "exact" }
    )
    .eq("is_member", true)
    .order("membership_paid_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  if (tier === "standard" || tier === "preserve-america") {
    query = query.eq("membership_option", tier);
  }

  const { data: membersData, count } = await query;
  const members: MemberData[] = membersData || [];

  // Get order counts and store credit balances for each member
  const memberIds = members.map((m) => m.id);

  const { data: orderCountsData } = await supabase
    .from("orders")
    .select("user_id")
    .in("user_id", memberIds);
  const orderCounts: OrderCount[] = orderCountsData || [];

  const orderCountMap = orderCounts.reduce(
    (acc: Record<string, number>, order) => {
      acc[order.user_id] = (acc[order.user_id] || 0) + 1;
      return acc;
    },
    {}
  );

  const { data: storeCreditsData } = await supabase
    .from("store_credits")
    .select("user_id, amount")
    .in("user_id", memberIds);
  const storeCredits: StoreCredit[] = storeCreditsData || [];

  const creditBalanceMap = storeCredits.reduce(
    (acc: Record<string, number>, credit) => {
      acc[credit.user_id] = (acc[credit.user_id] || 0) + credit.amount;
      return acc;
    },
    {}
  );

  const totalPages = Math.ceil((count || 0) / pageSize);

  // Build query string for pagination (preserving search + tier)
  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tier) params.set("tier", tier);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/members${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Members
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            {count || 0} total members
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-muted)] mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Members</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">
            {stats.totalMembers}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Standard Members</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">
            {stats.standardMembers}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Crown className="w-4 h-4" />
            <span className="text-sm">Preserve America</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-charcoal)]">
            {stats.preserveAmericaMembers}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <Link href="/admin/members">
          <Button variant={!tier ? "primary" : "outline"} size="sm">
            All
          </Button>
        </Link>
        <Link href="/admin/members?tier=standard">
          <Button
            variant={tier === "standard" ? "primary" : "outline"}
            size="sm"
          >
            Standard
          </Button>
        </Link>
        <Link href="/admin/members?tier=preserve-america">
          <Button
            variant={tier === "preserve-america" ? "primary" : "outline"}
            size="sm"
          >
            Preserve America
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form className="mb-6">
        {tier && <input type="hidden" name="tier" value={tier} />}
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
          </div>
          <Button type="submit">Search</Button>
        </div>
      </form>

      {/* Members Table */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        {members.length > 0 ? (
          <>
            <table className="w-full">
              <thead className="bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Member
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Membership
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Orders
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Store Credit
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Member Since
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {members.map((member) => {
                  const orderCount = orderCountMap[member.id] || 0;
                  const creditBalance = creditBalanceMap[member.id] || 0;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-[var(--color-slate-50)]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-medium">
                            {member.full_name?.[0]?.toUpperCase() ||
                              member.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-charcoal)]">
                              {member.full_name || "\u2014"}
                            </p>
                            <p className="text-xs text-[var(--color-muted)]">
                              ID: {member.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1 text-[var(--color-charcoal)]">
                            <Mail className="w-3 h-3 text-[var(--color-muted)]" />
                            {member.email}
                          </p>
                          {member.phone && (
                            <p className="text-sm flex items-center gap-1 text-[var(--color-muted)]">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MembershipBadge
                          tier={member.membership_option}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4 text-[var(--color-muted)]" />
                          <span className="font-medium">{orderCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Wallet className="w-4 h-4 text-[var(--color-muted)]" />
                          <span
                            className={`font-medium ${
                              creditBalance > 0 ? "text-green-600" : ""
                            }`}
                          >
                            {formatCurrency(creditBalance)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-[var(--color-muted)]">
                          <Calendar className="w-3 h-3" />
                          {member.membership_paid_at
                            ? new Date(
                                member.membership_paid_at
                              ).toLocaleDateString()
                            : new Date(
                                member.created_at
                              ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/members/${member.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-muted)]">
                  Showing {offset + 1} to{" "}
                  {Math.min(offset + pageSize, count || 0)} of {count} members
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={buildUrl(page - 1)}>
                      <Button variant="outline" size="sm">
                        Previous
                      </Button>
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={buildUrl(page + 1)}>
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)]">
              {search
                ? "No members found matching your search"
                : "No members yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
