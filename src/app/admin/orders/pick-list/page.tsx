import { format } from "date-fns";
import { getOrders } from "@/lib/actions/orders";
import { formatCurrency } from "@/lib/utils";

interface PickListPageProps {
  searchParams: Promise<{
    date?: string;
    fulfillment?: string;
    status?: string;
  }>;
}

interface AggregatedItem {
  productId: string;
  productName: string;
  sku: string | null;
  pricingType: string;
  unitPrice: number;
  totalQuantity: number;
  totalWeight: number;
  orders: Array<{
    orderId: string;
    orderNumber: number;
    quantity: number;
    weight: number | null;
    customerName: string;
  }>;
}

export default async function PickListPage({ searchParams }: PickListPageProps) {
  const params = await searchParams;
  const scheduledDate = params.date || format(new Date(), "yyyy-MM-dd");
  const fulfillmentType = params.fulfillment || undefined;
  const status = params.status || "processing";

  const { data: orders, error } = await getOrders({
    scheduledDate,
    fulfillmentType,
    status,
  });

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading orders: {error}</p>
      </div>
    );
  }

  // Aggregate items across all orders
  const itemMap = new Map<string, AggregatedItem>();

  orders?.forEach((order: {
    id: string;
    order_number: number;
    customer_first_name: string | null;
    customer_last_name: string | null;
    customer_email: string;
    order_items: Array<{
      product_id: string;
      product_name: string;
      sku: string | null;
      pricing_type: string;
      unit_price: number;
      quantity: number;
      estimated_weight: number | null;
      actual_weight: number | null;
    }>;
  }) => {
    const customerName =
      order.customer_first_name && order.customer_last_name
        ? `${order.customer_first_name} ${order.customer_last_name}`
        : order.customer_email;

    order.order_items?.forEach((item) => {
      const key = item.product_id + (item.sku || "");
      const weight = item.actual_weight || item.estimated_weight || 0;

      if (itemMap.has(key)) {
        const existing = itemMap.get(key)!;
        existing.totalQuantity += item.quantity;
        existing.totalWeight += weight * item.quantity;
        existing.orders.push({
          orderId: order.id,
          orderNumber: order.order_number,
          quantity: item.quantity,
          weight: weight,
          customerName,
        });
      } else {
        itemMap.set(key, {
          productId: item.product_id,
          productName: item.product_name,
          sku: item.sku,
          pricingType: item.pricing_type,
          unitPrice: item.unit_price,
          totalQuantity: item.quantity,
          totalWeight: weight * item.quantity,
          orders: [
            {
              orderId: order.id,
              orderNumber: order.order_number,
              quantity: item.quantity,
              weight: weight,
              customerName,
            },
          ],
        });
      }
    });
  });

  const aggregatedItems = Array.from(itemMap.values()).sort((a, b) =>
    a.productName.localeCompare(b.productName)
  );

  const fulfillmentLabels: Record<string, string> = {
    pickup: "Pickup",
    delivery: "Delivery",
    shipping: "Shipping",
  };

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      {/* Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
          }
        `,
        }}
      />

      {/* Header with Print Button */}
      <div className="no-print flex justify-between items-center mb-6 pb-6 border-b">
        <a href="/admin/orders" className="text-[var(--color-primary-500)] hover:underline">
          ← Back to Orders
        </a>
        <div className="flex gap-4 items-center">
          <form className="flex gap-2">
            <input
              type="date"
              name="date"
              defaultValue={scheduledDate}
              className="px-3 py-2 border rounded-lg"
            />
            <select
              name="fulfillment"
              defaultValue={fulfillmentType || ""}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Fulfillment</option>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
              <option value="shipping">Shipping</option>
            </select>
            <select
              name="status"
              defaultValue={status}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="packed">Packed</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-slate-100)] rounded-lg hover:bg-[var(--color-slate-200)]"
            >
              Filter
            </button>
          </form>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)]"
          >
            Print Pick List
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Pick List</h1>
          <p className="text-gray-600">
            {format(new Date(scheduledDate), "EEEE, MMMM d, yyyy")}
            {fulfillmentType && ` • ${fulfillmentLabels[fulfillmentType]}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {orders?.length || 0} Orders
          </p>
          <p className="text-gray-600">
            {aggregatedItems.length} Unique Items
          </p>
        </div>
      </div>

      {aggregatedItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No items to pick for the selected criteria.</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="py-2 text-left font-semibold uppercase text-sm tracking-wide w-8">
                <span className="sr-only">Check</span>
              </th>
              <th className="py-2 text-left font-semibold uppercase text-sm tracking-wide">
                Item
              </th>
              <th className="py-2 text-left font-semibold uppercase text-sm tracking-wide w-24">
                SKU
              </th>
              <th className="py-2 text-center font-semibold uppercase text-sm tracking-wide w-20">
                Total Qty
              </th>
              <th className="py-2 text-center font-semibold uppercase text-sm tracking-wide w-24">
                Total Weight
              </th>
              <th className="py-2 text-left font-semibold uppercase text-sm tracking-wide">
                Orders
              </th>
            </tr>
          </thead>
          <tbody>
            {aggregatedItems.map((item) => (
              <tr key={item.productId + item.sku} className="border-b border-gray-200">
                <td className="py-3">
                  <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                </td>
                <td className="py-3">
                  <p className="font-medium text-gray-900">{item.productName}</p>
                  {item.pricingType === "weight" && (
                    <p className="text-sm text-gray-500">
                      @ {formatCurrency(item.unitPrice)}/lb
                    </p>
                  )}
                </td>
                <td className="py-3 text-gray-600 font-mono text-sm">
                  {item.sku || "-"}
                </td>
                <td className="py-3 text-center font-bold text-lg">
                  {item.totalQuantity}
                </td>
                <td className="py-3 text-center">
                  {item.pricingType === "weight" && item.totalWeight > 0 ? (
                    <span className="text-gray-600">~{item.totalWeight.toFixed(1)} lbs</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.orders.map((order) => (
                      <span
                        key={order.orderId}
                        className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded text-xs"
                        title={`${order.customerName}: ${order.quantity}${order.weight ? ` × ${order.weight}lbs` : ""}`}
                      >
                        #{order.orderNumber} ({order.quantity})
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Summary by Order */}
      <div className="mt-12 page-break">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-900 pb-2">
          Orders Summary
        </h2>
        <div className="grid gap-4">
          {orders?.map((order: {
            id: string;
            order_number: number;
            customer_first_name: string | null;
            customer_last_name: string | null;
            customer_email: string;
            fulfillment_type: string;
            total: number;
            order_items: Array<{ quantity: number }>;
          }) => {
            const customerName =
              order.customer_first_name && order.customer_last_name
                ? `${order.customer_first_name} ${order.customer_last_name}`
                : order.customer_email;
            const itemCount = order.order_items?.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

            return (
              <div
                key={order.id}
                className="flex items-center justify-between py-2 border-b border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                  <div>
                    <span className="font-medium">#{order.order_number}</span>
                    <span className="text-gray-500 ml-2">{customerName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-600">
                    {itemCount} items
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded capitalize">
                    {order.fulfillment_type}
                  </span>
                  <span className="font-medium">{formatCurrency(order.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-400 pt-8 mt-8 border-t">
        <p>Pick List Generated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}</p>
        <p>Amos Miller Farm</p>
      </div>
    </div>
  );
}
