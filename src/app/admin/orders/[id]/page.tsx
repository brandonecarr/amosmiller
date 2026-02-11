"use server";

import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Truck,
  Printer,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui";
import { getOrder } from "@/lib/actions/orders";
import { getPaymentIntent } from "@/lib/stripe/server";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { OrderStatusSelect } from "./OrderStatusSelect";
import { OrderNotesForm } from "./OrderNotesForm";
import { WeightEntryForm } from "./WeightEntryForm";
import { PaymentActions } from "./PaymentActions";
import { TrackingForm } from "./TrackingForm";
import { ShipmentTimeline } from "./ShipmentTimeline";
import { SendEmailButton } from "./SendEmailButton";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  authorized: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  partially_refunded: "bg-orange-100 text-orange-800",
  refunded: "bg-gray-100 text-gray-800",
  failed: "bg-red-100 text-red-800",
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const { data: order, error } = await getOrder(id);

  if (error || !order) {
    notFound();
  }

  // Get Stripe payment intent details if available
  let paymentIntent = null;
  if (order.stripe_payment_intent_id) {
    try {
      paymentIntent = await getPaymentIntent(order.stripe_payment_intent_id);
    } catch (e) {
      console.error("Error fetching payment intent:", e);
    }
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

  // Check if any items need weight entry
  const weightBasedItems = order.order_items?.filter(
    (item: { pricing_type: string }) => item.pricing_type === "weight"
  );
  const hasUnweighedItems = weightBasedItems?.some(
    (item: { actual_weight: number | null }) => !item.actual_weight
  );

  // Calculate totals
  const allItemsWeighed = !hasUnweighedItems;
  const canCapture =
    order.payment_status === "authorized" &&
    allItemsWeighed &&
    paymentIntent?.status === "requires_capture";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
              Order #{order.order_number}
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/orders/${order.id}/packing-list`}>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Packing List
            </Button>
          </Link>
          <SendEmailButton order={order} />
        </div>
      </div>

      {/* Status Badges & Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-muted)]">Status:</span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[order.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-muted)]">Payment:</span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              paymentColors[order.payment_status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {order.payment_status.charAt(0).toUpperCase() +
              order.payment_status.slice(1).replace("_", " ")}
          </span>
        </div>
        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
              <h2 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
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
                  is_packed: boolean;
                }) => {
                  const isWeightBased = item.pricing_type === "weight";
                  const price = isWeightBased
                    ? item.final_price ??
                      item.unit_price * (item.estimated_weight || 1) * item.quantity
                    : item.unit_price * item.quantity;

                  return (
                    <div key={item.id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-[var(--color-charcoal)]">
                            {item.product_name}
                          </p>
                          <div className="text-sm text-[var(--color-muted)] space-y-1">
                            {item.sku && <p>SKU: {item.sku}</p>}
                            <p>Qty: {item.quantity}</p>
                            {isWeightBased && (
                              <p>
                                Price: {formatCurrency(item.unit_price)}/lb
                                {item.estimated_weight && (
                                  <span> × ~{item.estimated_weight} lbs (est.)</span>
                                )}
                              </p>
                            )}
                            {item.actual_weight && (
                              <p className="text-[var(--color-success)]">
                                Actual weight: {item.actual_weight} lbs
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[var(--color-charcoal)]">
                            {formatCurrency(price)}
                          </p>
                          {isWeightBased && !item.actual_weight && (
                            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                              Needs weighing
                            </span>
                          )}
                          {item.is_packed && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                              Packed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Weight Entry Form for weight-based items */}
                      {isWeightBased && !item.actual_weight && (
                        <WeightEntryForm
                          itemId={item.id}
                          orderId={order.id}
                          productName={item.product_name}
                          estimatedWeight={item.estimated_weight}
                          quantity={item.quantity}
                          unitPrice={item.unit_price}
                        />
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {/* Order Totals */}
            <div className="px-6 py-4 bg-[var(--color-slate-50)] border-t border-[var(--color-border)]">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.shipping_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-muted)]">
                      {order.fulfillment_type === "shipping" ? "Shipping" : "Delivery Fee"}
                    </span>
                    <span>{formatCurrency(order.shipping_fee)}</span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-muted)]">Tax</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-[var(--color-success)]">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.gift_card_amount_used > 0 && (
                  <div className="flex justify-between text-sm text-[var(--color-success)]">
                    <span>Gift Card</span>
                    <span>-{formatCurrency(order.gift_card_amount_used)}</span>
                  </div>
                )}
                {order.store_credit_used > 0 && (
                  <div className="flex justify-between text-sm text-[var(--color-success)]">
                    <span>Store Credit</span>
                    <span>-{formatCurrency(order.store_credit_used)}</span>
                  </div>
                )}
                <div className="border-t border-[var(--color-border)] pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Information (for shipping/delivery) */}
          {(order.fulfillment_type === "shipping" || order.fulfillment_type === "delivery") && (
            <TrackingForm
              orderId={order.id}
              trackingNumber={order.tracking_number}
              trackingUrl={order.tracking_url}
            />
          )}

          {/* Shipment Timeline */}
          <ShipmentTimeline orderId={order.id} />

          {/* Order Notes */}
          <OrderNotesForm
            orderId={order.id}
            privateNotes={order.private_notes}
            invoiceNotes={order.invoice_notes}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
              <h3 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer
              </h3>
            </div>
            <div className="px-4 py-3 space-y-2">
              <p className="font-medium text-[var(--color-charcoal)]">{customerName}</p>
              <p className="text-sm text-[var(--color-muted)]">{order.customer_email}</p>
              {order.customer_phone && (
                <p className="text-sm text-[var(--color-muted)]">{order.customer_phone}</p>
              )}
              {order.user_id && (
                <Link
                  href={`/admin/customers/${order.user_id}`}
                  className="text-sm text-[var(--color-primary-500)] hover:underline"
                >
                  View Customer Profile →
                </Link>
              )}
            </div>
          </div>

          {/* Fulfillment Info */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
              <h3 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Fulfillment
              </h3>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase">Method</p>
                <p className="font-medium text-[var(--color-charcoal)]">
                  {fulfillmentLabels[order.fulfillment_type] || order.fulfillment_type}
                </p>
              </div>

              {order.scheduled_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-muted)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--color-muted)] uppercase">Scheduled Date</p>
                    <p className="font-medium text-[var(--color-charcoal)]">
                      {format(parseLocalDate(order.scheduled_date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              {order.fulfillment_locations && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[var(--color-muted)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--color-muted)] uppercase">Pickup Location</p>
                    <p className="font-medium text-[var(--color-charcoal)]">
                      {order.fulfillment_locations.name}
                    </p>
                  </div>
                </div>
              )}

              {order.shipping_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[var(--color-muted)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--color-muted)] uppercase">
                      {order.fulfillment_type === "shipping" ? "Shipping" : "Delivery"} Address
                    </p>
                    <p className="text-sm text-[var(--color-charcoal)]">
                      {order.shipping_address.line1}
                      {order.shipping_address.line2 && <br />}
                      {order.shipping_address.line2}
                      <br />
                      {order.shipping_address.city}, {order.shipping_address.state}{" "}
                      {order.shipping_address.postalCode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
              <h3 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment
              </h3>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--color-muted)]">Status</span>
                <span
                  className={`text-sm font-medium ${
                    order.payment_status === "paid"
                      ? "text-green-600"
                      : order.payment_status === "authorized"
                        ? "text-blue-600"
                        : "text-yellow-600"
                  }`}
                >
                  {order.payment_status.charAt(0).toUpperCase() +
                    order.payment_status.slice(1).replace("_", " ")}
                </span>
              </div>
              {order.stripe_payment_intent_id && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-muted)]">Stripe PI</span>
                  <a
                    href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-primary-500)] hover:underline font-mono"
                  >
                    {order.stripe_payment_intent_id.slice(0, 20)}...
                  </a>
                </div>
              )}
              {order.coupon_code && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-muted)]">Coupon</span>
                  <span className="text-sm font-mono">{order.coupon_code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Actions */}
          {paymentIntent && (
            <PaymentActions
              orderId={order.id}
              paymentIntentId={order.stripe_payment_intent_id}
              paymentStatus={order.payment_status}
              stripeStatus={paymentIntent.status}
              amountAuthorized={paymentIntent.amount}
              currentTotal={Math.round(order.total * 100)}
              canCapture={canCapture}
              hasUnweighedItems={hasUnweighedItems}
              totalRefunded={order.amount_refunded || 0}
            />
          )}

          {/* Customer Notes */}
          {order.customer_notes && (
            <div className="bg-[var(--color-cream-100)] rounded-xl p-4">
              <h3 className="font-semibold text-[var(--color-charcoal)] mb-2">Customer Notes</h3>
              <p className="text-sm text-[var(--color-muted)]">{order.customer_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
