import { Suspense } from "react";
import { getOrders } from "@/lib/actions/orders";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { OrderFilters } from "@/components/admin/OrderFilters";

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    fulfillment?: string;
    search?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;

  const filters = {
    status: params.status as "pending" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | undefined,
    paymentStatus: params.payment as "pending" | "authorized" | "paid" | "refunded" | undefined,
    fulfillmentType: params.fulfillment as "pickup" | "delivery" | "shipping" | undefined,
    search: params.search,
    fromDate: params.from,
    toDate: params.to,
  };

  const { data: orders, error } = await getOrders(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Orders</h1>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <OrderFilters currentFilters={params} />
      </Suspense>

      {error ? (
        <div className="bg-[var(--color-error-50)] text-[var(--color-error)] p-4 rounded-lg">
          Failed to load orders: {error}
        </div>
      ) : (
        <OrdersTable orders={orders || []} />
      )}
    </div>
  );
}
