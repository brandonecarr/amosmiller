import Link from "next/link";
import { CheckCircle, Package, MapPin, Calendar, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { getOrder } from "@/lib/actions/orders";
import { format } from "date-fns";
import { redirect } from "next/navigation";

// Force dynamic rendering since this page depends on searchParams and database
export const dynamic = "force-dynamic";

interface OrderConfirmationPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
  const { orderId } = await searchParams;

  if (!orderId) {
    redirect("/shop");
  }

  const { data: order, error } = await getOrder(orderId);

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-4">
          Order Not Found
        </h1>
        <p className="text-slate-500 mb-8">
          We couldn&apos;t find this order. Please check your email for confirmation details.
        </p>
        <Link href="/shop">
          <Button className="rounded-full bg-slate-900 hover:bg-slate-800 text-white">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const fulfillmentLabels: Record<string, string> = {
    pickup: "Pickup",
    delivery: "Delivery",
    shipping: "Shipping",
  };
  const fulfillmentLabel = fulfillmentLabels[order.fulfillment_type] || order.fulfillment_type;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-orange-500" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
          Thank You for Your Order!
        </h1>
        <p className="text-slate-500">
          Order #{order.order_number} has been received and is being processed.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
        {/* Order Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-sm text-slate-500">Order Number</p>
              <p className="font-semibold text-slate-900">#{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Order Date</p>
              <p className="font-semibold text-slate-900">
                {format(new Date(order.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-heading font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-600" />
            Order Items
          </h3>
          <div className="space-y-3">
            {order.order_items?.map((item: {
              id: string;
              name: string;
              quantity: number;
              unit_price: number;
              pricing_type: string;
              estimated_weight?: number;
            }) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    Qty: {item.quantity}
                    {item.pricing_type === "weight" && item.estimated_weight && (
                      <span> x ~{item.estimated_weight} lbs</span>
                    )}
                  </p>
                </div>
                <p className="font-medium text-slate-900">
                  {formatPrice(item.unit_price * item.quantity * (item.pricing_type === "weight" ? (item.estimated_weight || 1) : 1))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment Info */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-heading font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-slate-600" />
            {fulfillmentLabel} Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Method</p>
              <p className="font-medium text-slate-900">{fulfillmentLabel}</p>
            </div>
            {order.scheduled_date && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Scheduled Date</p>
                  <p className="font-medium text-slate-900">
                    {format(new Date(order.scheduled_date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
            {order.shipping_address && (
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-500">
                  {order.fulfillment_type === "shipping" ? "Shipping" : "Delivery"} Address
                </p>
                <p className="font-medium text-slate-900">
                  {order.shipping_address.line1}
                  {order.shipping_address.line2 && `, ${order.shipping_address.line2}`}
                  <br />
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="px-6 py-4">
          <h3 className="font-heading font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-600" />
            Payment Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-900">{formatPrice(order.subtotal)}</span>
            </div>
            {order.shipping_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  {order.fulfillment_type === "shipping" ? "Shipping" : "Delivery Fee"}
                </span>
                <span className="text-slate-900">{formatPrice(order.shipping_fee)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="text-slate-900">{formatPrice(order.tax)}</span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            {order.gift_card_amount_used > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Gift Card Applied</span>
                <span>-{formatPrice(order.gift_card_amount_used)}</span>
              </div>
            )}
            {order.store_credit_used > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Store Credit Applied</span>
                <span>-{formatPrice(order.store_credit_used)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
          {order.payment_status === "authorized" && (
            <p className="text-xs text-slate-500 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Your card has been authorized but not charged. For weight-based items, the final price
              will be determined when your order is packed. You&apos;ll receive an updated total before
              your card is charged.
            </p>
          )}
        </div>
      </div>

      {/* Customer Notes */}
      {order.customer_notes && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-8">
          <h3 className="font-heading font-semibold text-slate-900 mb-2">Your Notes</h3>
          <p className="text-slate-500">{order.customer_notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="text-center space-y-4">
        <p className="text-sm text-slate-500">
          A confirmation email has been sent to <strong className="text-slate-900">{order.customer_email}</strong>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account/orders">
            <Button size="lg" className="rounded-full bg-slate-900 hover:bg-slate-800 text-white">
              View Order Status
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" size="lg" className="rounded-full border-slate-200 text-slate-900 hover:bg-slate-50">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
