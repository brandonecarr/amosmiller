import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getOrder } from "@/lib/actions/orders";
import { formatCurrency } from "@/lib/utils";

interface PackingListPageProps {
  params: Promise<{ id: string }>;
}

export default async function PackingListPage({ params }: PackingListPageProps) {
  const { id } = await params;
  const { data: order, error } = await getOrder(id);

  if (error || !order) {
    notFound();
  }

  const fulfillmentLabels: Record<string, string> = {
    pickup: "Pickup",
    delivery: "Delivery",
    shipping: "Shipping",
  };

  const customerName =
    order.customer_first_name && order.customer_last_name
      ? `${order.customer_first_name} ${order.customer_last_name}`
      : order.customer_email;

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
        <a
          href={`/admin/orders/${order.id}`}
          className="text-[var(--color-primary-500)] hover:underline"
        >
          ← Back to Order
        </a>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)]"
        >
          Print Packing List
        </button>
      </div>

      {/* Packing List Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Packing List</h1>
          <p className="text-xl text-gray-600">Order #{order.order_number}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">Amos Miller Farm</p>
          <p className="text-sm text-gray-600">
            {format(new Date(order.created_at), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Customer Info */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2 uppercase text-sm tracking-wide">
            Customer
          </h2>
          <p className="font-medium text-gray-900">{customerName}</p>
          <p className="text-gray-600">{order.customer_email}</p>
          {order.customer_phone && (
            <p className="text-gray-600">{order.customer_phone}</p>
          )}
        </div>

        {/* Fulfillment Info */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2 uppercase text-sm tracking-wide">
            {fulfillmentLabels[order.fulfillment_type] || "Fulfillment"}
          </h2>
          {order.scheduled_date && (
            <p className="font-medium text-gray-900">
              {format(new Date(order.scheduled_date), "EEEE, MMMM d, yyyy")}
            </p>
          )}
          {order.fulfillment_locations && (
            <p className="text-gray-600">{order.fulfillment_locations.name}</p>
          )}
          {order.shipping_address && (
            <div className="text-gray-600">
              <p>{order.shipping_address.line1}</p>
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              <p>
                {order.shipping_address.city}, {order.shipping_address.state}{" "}
                {order.shipping_address.postalCode}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
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
            <th className="py-2 text-center font-semibold uppercase text-sm tracking-wide w-16">
              Qty
            </th>
            <th className="py-2 text-center font-semibold uppercase text-sm tracking-wide w-24">
              Weight
            </th>
            <th className="py-2 text-right font-semibold uppercase text-sm tracking-wide w-24">
              Price
            </th>
          </tr>
        </thead>
        <tbody>
          {order.order_items?.map(
            (item: {
              id: string;
              product_name: string;
              sku: string | null;
              quantity: number;
              unit_price: number;
              pricing_type: string;
              estimated_weight: number | null;
              actual_weight: number | null;
              final_price: number | null;
            }) => {
              const isWeightBased = item.pricing_type === "weight";
              const weight = item.actual_weight || item.estimated_weight;
              const price = isWeightBased
                ? item.final_price ?? item.unit_price * (weight || 1) * item.quantity
                : item.unit_price * item.quantity;

              return (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                  </td>
                  <td className="py-3">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    {isWeightBased && (
                      <p className="text-sm text-gray-500">
                        @ {formatCurrency(item.unit_price)}/lb
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-gray-600 font-mono text-sm">
                    {item.sku || "-"}
                  </td>
                  <td className="py-3 text-center font-medium">{item.quantity}</td>
                  <td className="py-3 text-center">
                    {isWeightBased ? (
                      <span className={item.actual_weight ? "font-medium" : "text-gray-400"}>
                        {weight ? `${weight} lbs` : "—"}
                        {!item.actual_weight && item.estimated_weight && " (est.)"}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right font-medium">{formatCurrency(price)}</td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.shipping_fee > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-gray-600">
                {order.fulfillment_type === "shipping" ? "Shipping" : "Delivery"}
              </span>
              <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
            </div>
          )}
          {order.tax_amount > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
            </div>
          )}
          {order.discount_amount > 0 && (
            <div className="flex justify-between py-1 text-green-700">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-gray-900 mt-2">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Invoice Notes */}
      {order.invoice_notes && (
        <div className="border border-gray-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-gray-900 mb-2 uppercase text-sm tracking-wide">
            Notes
          </h2>
          <p className="text-gray-600 whitespace-pre-wrap">{order.invoice_notes}</p>
        </div>
      )}

      {/* Customer Notes */}
      {order.customer_notes && (
        <div className="border border-gray-200 rounded-lg p-4 mb-8 bg-gray-50">
          <h2 className="font-semibold text-gray-900 mb-2 uppercase text-sm tracking-wide">
            Customer Notes
          </h2>
          <p className="text-gray-600 whitespace-pre-wrap">{order.customer_notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-400 pt-8 border-t">
        <p>Thank you for your order!</p>
        <p>Amos Miller Farm • amrosmillerfarm.com</p>
      </div>
    </div>
  );
}
