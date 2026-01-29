import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Users, Search, Mail, Phone, Calendar, ShoppingBag, Wallet } from "lucide-react";
import { Button } from "@/components/ui";

interface CustomerData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  stripe_customer_id: string | null;
}

interface OrderCount {
  user_id: string;
}

interface StoreCredit {
  user_id: string;
  amount: number;
}

export const metadata = {
  title: "Customers | Admin | Amos Miller Farm",
  description: "Manage customers",
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const supabase = await createClient();

  // Get customers with order count and store credit balance
  let query = supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      phone,
      role,
      created_at,
      stripe_customer_id
    `, { count: "exact" })
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data: customersData, count } = await query;
  const customers: CustomerData[] = customersData || [];

  // Get order counts and store credit balances for each customer
  const customerIds = customers.map((c) => c.id);

  // Get order counts
  const { data: orderCountsData } = await supabase
    .from("orders")
    .select("user_id")
    .in("user_id", customerIds);
  const orderCounts: OrderCount[] = orderCountsData || [];

  const orderCountMap = orderCounts.reduce((acc: Record<string, number>, order) => {
    acc[order.user_id] = (acc[order.user_id] || 0) + 1;
    return acc;
  }, {});

  // Get store credit balances
  const { data: storeCreditsData } = await supabase
    .from("store_credits")
    .select("user_id, amount")
    .in("user_id", customerIds);
  const storeCredits: StoreCredit[] = storeCreditsData || [];

  const creditBalanceMap = storeCredits.reduce((acc: Record<string, number>, credit) => {
    acc[credit.user_id] = (acc[credit.user_id] || 0) + credit.amount;
    return acc;
  }, {});

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Customers
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            {count || 0} total customers
          </p>
        </div>
      </div>

      {/* Search */}
      <form className="mb-6">
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

      {/* Customers Table */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
        {customers.length > 0 ? (
          <>
            <table className="w-full">
              <thead className="bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Orders
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Store Credit
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Joined
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {customers.map((customer) => {
                  const orderCount = orderCountMap[customer.id] || 0;
                  const creditBalance = creditBalanceMap[customer.id] || 0;

                  return (
                    <tr key={customer.id} className="hover:bg-[var(--color-slate-50)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-700)] font-medium">
                            {customer.full_name?.[0]?.toUpperCase() || customer.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-charcoal)]">
                              {customer.full_name || "—"}
                            </p>
                            <p className="text-xs text-[var(--color-muted)]">
                              ID: {customer.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1 text-[var(--color-charcoal)]">
                            <Mail className="w-3 h-3 text-[var(--color-muted)]" />
                            {customer.email}
                          </p>
                          {customer.phone && (
                            <p className="text-sm flex items-center gap-1 text-[var(--color-muted)]">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </p>
                          )}
                        </div>
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
                          <span className={`font-medium ${creditBalance > 0 ? "text-green-600" : ""}`}>
                            {formatCurrency(creditBalance)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-[var(--color-muted)]">
                          <Calendar className="w-3 h-3" />
                          {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/customers/${customer.id}`}>
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
                  Showing {offset + 1} to {Math.min(offset + pageSize, count || 0)} of {count} customers
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={`/admin/customers?search=${search}&page=${page - 1}`}>
                      <Button variant="outline" size="sm">Previous</Button>
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={`/admin/customers?search=${search}&page=${page + 1}`}>
                      <Button variant="outline" size="sm">Next</Button>
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
              {search ? "No customers found matching your search" : "No customers yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
