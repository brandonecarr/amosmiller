import Link from "next/link";
import { format } from "date-fns";
import { RefreshCw, Users, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui";
import { getSubscriptions, getSubscriptionsDueForProcessing } from "@/lib/actions/subscriptions";
import { formatCurrency, parseLocalDate } from "@/lib/utils";

interface SubscriptionsPageProps {
  searchParams: Promise<{
    status?: string;
    frequency?: string;
    search?: string;
  }>;
}

interface AdminSubscription {
  id: string;
  name: string;
  status: string;
  frequency: string;
  next_order_date: string | null;
  fulfillment_type: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  subscription_items?: Array<{ count: number }>;
  fulfillment_locations?: { name: string } | null;
  delivery_zones?: { name: string } | null;
  shipping_zones?: { name: string } | null;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
};

export default async function AdminSubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const params = await searchParams;

  const [{ data: subscriptions, error }, { data: dueSubs }] = await Promise.all([
    getSubscriptions({
      status: params.status,
      frequency: params.frequency,
      search: params.search,
    }),
    getSubscriptionsDueForProcessing(),
  ]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading subscriptions: {error}</p>
      </div>
    );
  }

  // Calculate stats
  const typedSubscriptions = subscriptions as AdminSubscription[] | null;
  const activeCount = typedSubscriptions?.filter((s) => s.status === "active").length || 0;
  const pausedCount = typedSubscriptions?.filter((s) => s.status === "paused").length || 0;
  const dueCount = dueSubs?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Subscriptions</h1>
          <p className="text-[var(--color-muted)]">Manage customer subscriptions</p>
        </div>
        {dueCount > 0 && (
          <Link href="/admin/subscriptions/process">
            <Button>
              <RefreshCw className="w-4 h-4 mr-2" />
              Process {dueCount} Due
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-charcoal)]">{activeCount}</p>
              <p className="text-sm text-[var(--color-muted)]">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-charcoal)]">{pausedCount}</p>
              <p className="text-sm text-[var(--color-muted)]">Paused</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-charcoal)]">{dueCount}</p>
              <p className="text-sm text-[var(--color-muted)]">Due Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-100)] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[var(--color-primary-600)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-charcoal)]">
                {subscriptions?.length || 0}
              </p>
              <p className="text-sm text-[var(--color-muted)]">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <form className="flex flex-wrap gap-4">
          <select
            name="status"
            defaultValue={params.status || ""}
            className="px-3 py-2 border border-[var(--color-border)] rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            name="frequency"
            defaultValue={params.frequency || ""}
            className="px-3 py-2 border border-[var(--color-border)] rounded-lg"
          >
            <option value="">All Frequencies</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <input
            type="text"
            name="search"
            placeholder="Search by name or email..."
            defaultValue={params.search || ""}
            className="px-3 py-2 border border-[var(--color-border)] rounded-lg flex-1 min-w-[200px]"
          />
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        {subscriptions?.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-muted)]">
            No subscriptions found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                  Frequency
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                  Next Order
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                  Fulfillment
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {typedSubscriptions?.map((subscription) => (
                <tr
                  key={subscription.id}
                  className="hover:bg-[var(--color-slate-50)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[var(--color-charcoal)]">
                        {subscription.user?.full_name || "—"}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {subscription.user?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[var(--color-charcoal)]">{subscription.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[subscription.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-charcoal)]">
                    {frequencyLabels[subscription.frequency]}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-charcoal)]">
                    {subscription.subscription_items?.[0]?.count || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-charcoal)]">
                    {subscription.next_order_date
                      ? format(parseLocalDate(subscription.next_order_date), "MMM d, yyyy")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-charcoal)] capitalize">
                    {subscription.fulfillment_type}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/subscriptions/${subscription.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
