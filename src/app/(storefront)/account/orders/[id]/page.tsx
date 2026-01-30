import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrder } from "@/lib/actions/orders";
import { Button } from "@/components/ui";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  RefreshCw,
  FileText,
} from "lucide-react";
import { ReorderButton } from "./ReorderButton";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: order, error } = await getOrder(id);

  if (error || !order) {
    notFound();
  }

  // Verify the order belongs to this user
  if (order.user_id && order.user_id !== user.id) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    packed: "bg-purple-100 text-purple-800 border-purple-200",
    shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
    delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const statusTimeline = ["pending", "processing", "packed", "shipped", "delivered"];
  const currentStatusIndex = statusTimeline.indexOf(order.status);

  const fulfillmentLabels: Record<string, string> = {
    pickup: "Pickup",
    delivery: "Local Delivery",
    shipping: "Shipping",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/account/orders"
            className="inline-flex items-center text-sm text-slate-500 hover:text-orange-500 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Orders
          </Link>
          <h2 className="text-2xl font-bold font-heading text-slate-900">
            Order #{order.order_number}
          </h2>
          <p className="text-slate-500">
            Placed on {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div className="flex gap-3">
          <ReorderButton orderId={order.id} />
        </div>
      </div>

      {/* Status Timeline */}
      {order.status !== "cancelled" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Order Status</h3>
          <div className="flex items-center justify-between">
            {statusTimeline.map((status, index) => {
              const isActive = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              return (
                <div key={status} className="flex-1 flex items-center">
                  <div
                    className={`flex flex-col items-center ${
                      index < statusTimeline.length - 1 ? "flex-1" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-500"
                      } ${isCurrent ? "ring-4 ring-orange-100" : ""}`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`text-xs mt-2 capitalize ${
                        isActive ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  {index < statusTimeline.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        index < currentStatusIndex
                          ? "bg-orange-500"
                          : "bg-slate-100"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled Status */}
      {order.status === "cancelled" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="font-bold text-red-800 mb-2">Order Cancelled</h3>
          <p className="text-red-600 text-sm">
            This order has been cancelled. If you have any questions, please contact us.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({order.order_items?.length || 0})
            </h3>
          </div>
          <div className="divide-y divide-slate-200">
            {order.order_items?.map((item: {
              id: string;
              name: string;
              quantity: number;
              unit_price: number;
              pricing_type: string;
              estimated_weight?: number;
              actual_weight?: number;
              final_price?: number;
            }) => {
              const weight = item.actual_weight || item.estimated_weight;
              const price = item.final_price || (item.unit_price * item.quantity * (item.pricing_type === "weight" ? (weight || 1) : 1));

              return (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">
                      Qty: {item.quantity}
                      {item.pricing_type === "weight" && weight && (
                        <span>
                          {" "}&times; {item.actual_weight ? `${weight} lbs` : `~${weight} lbs (est.)`}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="font-medium text-slate-900">
                    {formatCurrency(price)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          {/* Fulfillment Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              {order.fulfillment_type === "shipping" ? (
                <Truck className="w-5 h-5" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
              {fulfillmentLabels[order.fulfillment_type]}
            </h3>

            {order.scheduled_date && (
              <div className="flex items-start gap-3 mb-4">
                <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Scheduled Date</p>
                  <p className="font-medium text-slate-900">
                    {format(parseLocalDate(order.scheduled_date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}

            {order.shipping_address && (
              <div>
                <p className="text-sm text-slate-500">Address</p>
                <p className="text-slate-900">
                  {order.shipping_address.line1}
                  {order.shipping_address.line2 && <br />}
                  {order.shipping_address.line2}
                  <br />
                  {order.shipping_address.city}, {order.shipping_address.state}{" "}
                  {order.shipping_address.postalCode}
                </p>
              </div>
            )}

            {order.tracking_number && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">Tracking Number</p>
                <p className="font-mono text-slate-900">{order.tracking_number}</p>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Summary
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.shipping_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    {order.fulfillment_type === "shipping" ? "Shipping" : "Delivery"}
                  </span>
                  <span>{formatCurrency(order.shipping_fee)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.gift_card_amount_used > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Gift Card</span>
                  <span>-{formatCurrency(order.gift_card_amount_used)}</span>
                </div>
              )}
              {order.store_credit_used > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Store Credit</span>
                  <span>-{formatCurrency(order.store_credit_used)}</span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-slate-200">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {order.payment_status === "authorized" && (
              <p className="text-xs text-slate-600 mt-4 bg-slate-50 p-3 rounded-lg">
                Your payment has been authorized. The final amount will be charged when your order
                is packed and weighed.
              </p>
            )}
          </div>

          {/* Customer Notes */}
          {order.customer_notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Your Notes
              </h3>
              <p className="text-slate-500 text-sm">{order.customer_notes}</p>
            </div>
          )}

          {/* Invoice Notes (visible to customer) */}
          {order.invoice_notes && (
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Note from Amos Miller Farm</h3>
              <p className="text-slate-500 text-sm">{order.invoice_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
