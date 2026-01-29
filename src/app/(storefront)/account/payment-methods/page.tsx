import { redirect } from "next/navigation";
import { CreditCard, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getUserPaymentMethods } from "@/lib/actions/payment-methods";
import { PaymentMethodActions } from "./PaymentMethodActions";
import { AddPaymentMethodButton } from "./AddPaymentMethodButton";

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string | null;
  card_last_four: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
  created_at: string;
}

const cardBrandIcons: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
};

export default async function PaymentMethodsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account/payment-methods");
  }

  const { data: paymentMethods, error } = await getUserPaymentMethods(user.id);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading payment methods: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">
            Payment Methods
          </h1>
          <p className="text-slate-500">
            Manage your saved payment methods
          </p>
        </div>
        <AddPaymentMethodButton userId={user.id} />
      </div>

      {(!paymentMethods || paymentMethods.length === 0) ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold font-heading text-slate-900 mb-2">
            No Payment Methods
          </h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Add a payment method to enable subscriptions and faster checkout.
          </p>
          <AddPaymentMethodButton userId={user.id} />
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method: PaymentMethod) => (
            <div
              key={method.id}
              className={`bg-white rounded-2xl border p-6 ${
                method.is_default
                  ? "border-orange-500"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {cardBrandIcons[method.card_brand || ""] || method.card_brand || "Card"}{" "}
                        ending in {method.card_last_four}
                      </p>
                      {method.is_default && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      Expires {method.card_exp_month}/{method.card_exp_year}
                    </p>
                  </div>
                </div>
                <PaymentMethodActions
                  paymentMethodId={method.id}
                  userId={user.id}
                  isDefault={method.is_default}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-6">
        <h3 className="font-medium text-slate-900 mb-2">
          About Payment Methods
        </h3>
        <ul className="text-sm text-slate-500 space-y-1">
          <li>Your payment information is securely stored with Stripe.</li>
          <li>The default payment method is used for subscription charges.</li>
          <li>You can change the payment method for individual subscriptions.</li>
          <li>We never store your full card number on our servers.</li>
        </ul>
      </div>
    </div>
  );
}
