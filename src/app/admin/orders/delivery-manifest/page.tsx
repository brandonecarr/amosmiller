import { format } from "date-fns";
import { getOrders } from "@/lib/actions/orders";
import { formatCurrency } from "@/lib/utils";
import { Phone, MapPin, Package, MessageSquare } from "lucide-react";

interface DeliveryManifestPageProps {
  searchParams: Promise<{
    date?: string;
    zone?: string;
    status?: string;
  }>;
}

interface DeliveryOrder {
  id: string;
  order_number: number;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  total: number;
  payment_status: string;
  customer_notes: string | null;
  invoice_notes: string | null;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    pricing_type: string;
    actual_weight: number | null;
    estimated_weight: number | null;
  }>;
  delivery_zones?: {
    name: string;
  } | null;
}

export default async function DeliveryManifestPage({ searchParams }: DeliveryManifestPageProps) {
  const params = await searchParams;
  const scheduledDate = params.date || format(new Date(), "yyyy-MM-dd");
  const status = params.status || "packed";

  const { data: allOrders, error } = await getOrders({
    scheduledDate,
    fulfillmentType: "delivery",
    status,
  });

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading orders: {error}</p>
      </div>
    );
  }

  // Filter by zone if specified
  let orders = allOrders as DeliveryOrder[] | null;
  if (params.zone && orders) {
    orders = orders.filter(
      (order) => order.delivery_zones?.name === params.zone
    );
  }

  // Sort orders by address for efficient routing
  // Simple sort by zip code, then street address
  orders?.sort((a, b) => {
    const zipA = a.shipping_address?.postalCode || "";
    const zipB = b.shipping_address?.postalCode || "";
    if (zipA !== zipB) return zipA.localeCompare(zipB);

    const addrA = a.shipping_address?.line1 || "";
    const addrB = b.shipping_address?.line1 || "";
    return addrA.localeCompare(addrB);
  });

  // Get unique zones for filter dropdown
  const zones = new Set<string>();
  allOrders?.forEach((order: DeliveryOrder) => {
    if (order.delivery_zones?.name) {
      zones.add(order.delivery_zones.name);
    }
  });

  // Calculate totals
  const totalOrders = orders?.length || 0;
  const totalItems = orders?.reduce(
    (sum, order) =>
      sum + (order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0),
    0
  ) || 0;
  const totalValue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const unpaidOrders = orders?.filter((o) => o.payment_status !== "paid").length || 0;

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
            .avoid-break { page-break-inside: avoid; }
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
              name="zone"
              defaultValue={params.zone || ""}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Zones</option>
              {Array.from(zones).map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="processing">Processing</option>
              <option value="packed">Packed</option>
              <option value="shipped">Out for Delivery</option>
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
            Print Manifest
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Delivery Manifest</h1>
          <p className="text-gray-600">
            {format(new Date(scheduledDate), "EEEE, MMMM d, yyyy")}
            {params.zone && ` • ${params.zone}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">Amos Miller Farm</p>
          <p className="text-sm text-gray-600">
            Generated: {format(new Date(), "MMM d, h:mm a")}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500 uppercase">Stops</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 uppercase">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 uppercase">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 uppercase">Collect Payment</p>
          <p className="text-2xl font-bold text-orange-600">{unpaidOrders}</p>
        </div>
      </div>

      {totalOrders === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No deliveries scheduled for the selected criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders?.map((order, index) => {
            const customerName =
              order.customer_first_name && order.customer_last_name
                ? `${order.customer_first_name} ${order.customer_last_name}`
                : order.customer_email;

            return (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg overflow-hidden avoid-break"
              >
                {/* Stop Header */}
                <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Order #{order.order_number}
                      </p>
                      <p className="text-sm text-gray-600">{customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {order.payment_status !== "paid" && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        Collect: {formatCurrency(order.total)}
                      </span>
                    )}
                    <div className="w-6 h-6 border-2 border-gray-400 rounded" />
                  </div>
                </div>

                <div className="p-4 grid md:grid-cols-2 gap-4">
                  {/* Address & Contact */}
                  <div className="space-y-3">
                    {order.shipping_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.shipping_address.line1}
                          </p>
                          {order.shipping_address.line2 && (
                            <p className="text-gray-600">{order.shipping_address.line2}</p>
                          )}
                          <p className="text-gray-600">
                            {order.shipping_address.city}, {order.shipping_address.state}{" "}
                            {order.shipping_address.postalCode}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="text-gray-900 hover:underline"
                        >
                          {order.customer_phone}
                        </a>
                      </div>
                    )}
                    {(order.customer_notes || order.invoice_notes) && (
                      <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                        <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          {order.customer_notes && (
                            <p className="text-yellow-800">{order.customer_notes}</p>
                          )}
                          {order.invoice_notes && (
                            <p className="text-yellow-700 italic">{order.invoice_notes}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Items</span>
                    </div>
                    <ul className="space-y-1">
                      {order.order_items?.map((item) => {
                        const weight = item.actual_weight || item.estimated_weight;
                        return (
                          <li key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-900">{item.product_name}</span>
                            <span className="text-gray-600">
                              ×{item.quantity}
                              {item.pricing_type === "weight" && weight && (
                                <span className="text-gray-400 ml-1">({weight}lb)</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Signature Line */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Signature:</span>
                    <div className="flex-1 border-b border-gray-300 h-6" />
                    <span className="text-sm text-gray-500">Time:</span>
                    <div className="w-24 border-b border-gray-300 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-400 pt-8 mt-8 border-t">
        <p>Delivery Manifest • {format(new Date(), "MMM d, yyyy")}</p>
        <p>Amos Miller Farm</p>
      </div>
    </div>
  );
}
