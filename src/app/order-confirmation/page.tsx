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
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)] mb-4">
          Order Not Found
        </h1>
        <p className="text-[var(--color-muted)] mb-8">
          We couldn&apos;t find this order. Please check your email for confirmation details.
        </p>
        <Link href="/shop">
          <Button>Continue Shopping</Button>
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
        <div className="w-20 h-20 bg-[var(--color-success-50)] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-[var(--color-success)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-charcoal)] mb-2">
          Thank You for Your Order!
        </h1>
        <p className="text-[var(--color-muted)]">
          Order #{order.order_number} has been received and is being processed.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-xl border border-[var(--color-cream-200)] overflow-hidden mb-8">
        {/* Order Header */}
        <div className="bg-[var(--color-cream-100)] px-6 py-4 border-b border-[var(--color-cream-200)]">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-sm text-[var(--color-muted)]">Order Number</p>
              <p className="font-semibold text-[var(--color-charcoal)]">#{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Order Date</p>
              <p className="font-semibold text-[var(--color-charcoal)]">
                {format(new Date(order.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-6 py-4 border-b border-[var(--color-cream-200)]">
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
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
                  <p className="font-medium text-[var(--color-charcoal)]">{item.name}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    Qty: {item.quantity}
                    {item.pricing_type === "weight" && item.estimated_weight && (
                      <span> × ~{item.estimated_weight} lbs</span>
                    )}
                  </p>
                </div>
                <p className="font-medium text-[var(--color-charcoal)]">
                  {formatPrice(item.unit_price * item.quantity * (item.pricing_type === "weight" ? (item.estimated_weight || 1) : 1))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment Info */}
        <div className="px-6 py-4 border-b border-[var(--color-cream-200)]">
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {fulfillmentLabel} Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--color-muted)]">Method</p>
              <p className="font-medium text-[var(--color-charcoal)]">{fulfillmentLabel}</p>
            </div>
            {order.scheduled_date && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-muted)] mt-0.5" />
                <div>
                  <p className="text-sm text-[var(--color-muted)]">Scheduled Date</p>
                  <p className="font-medium text-[var(--color-charcoal)]">
                    {format(new Date(order.scheduled_date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
            {order.shipping_address && (
              <div className="sm:col-span-2">
                <p className="text-sm text-[var(--color-muted)]">
                  {order.fulfillment_type === "shipping" ? "Shipping" : "Delivery"} Address
                </p>
                <p className="font-medium text-[var(--color-charcoal)]">
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
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Subtotal</span>
              <span className="text-[var(--color-charcoal)]">{formatPrice(order.subtotal)}</span>
            </div>
            {order.shipping_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">
                  {order.fulfillment_type === "shipping" ? "Shipping" : "Delivery Fee"}
                </span>
                <span className="text-[var(--color-charcoal)]">{formatPrice(order.shipping_fee)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">Tax</span>
                <span className="text-[var(--color-charcoal)]">{formatPrice(order.tax)}</span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-[var(--color-success)]">
                <span>Discount</span>
                <span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            {order.gift_card_amount_used > 0 && (
              <div className="flex justify-between text-sm text-[var(--color-success)]">
                <span>Gift Card Applied</span>
                <span>-{formatPrice(order.gift_card_amount_used)}</span>
              </div>
            )}
            {order.store_credit_used > 0 && (
              <div className="flex justify-between text-sm text-[var(--color-success)]">
                <span>Store Credit Applied</span>
                <span>-{formatPrice(order.store_credit_used)}</span>
              </div>
            )}
            <div className="border-t border-[var(--color-cream-200)] pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-[var(--color-charcoal)]">Total</span>
                <span className="text-[var(--color-charcoal)]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
          {order.payment_status === "authorized" && (
            <p className="text-xs text-[var(--color-muted)] mt-4 bg-[var(--color-cream-100)] p-3 rounded-lg">
              Your card has been authorized but not charged. For weight-based items, the final price
              will be determined when your order is packed. You&apos;ll receive an updated total before
              your card is charged.
            </p>
          )}
        </div>
      </div>

      {/* Customer Notes */}
      {order.customer_notes && (
        <div className="bg-[var(--color-cream-100)] rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-2">Your Notes</h3>
          <p className="text-[var(--color-muted)]">{order.customer_notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="text-center space-y-4">
        <p className="text-sm text-[var(--color-muted)]">
          A confirmation email has been sent to <strong>{order.customer_email}</strong>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account/orders">
            <Button size="lg">
              View Order Status
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
