import { Suspense } from "react";
import type { Metadata } from "next";
import { getFulfillmentLocations } from "@/lib/actions/fulfillment-locations";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order from Amos Miller Farm.",
};
import { getDeliveryZones } from "@/lib/actions/delivery-zones";
import { getShippingZones } from "@/lib/actions/shipping-zones";
import { getUserStoreCredits } from "@/lib/actions/store-credits";
import { createClient } from "@/lib/supabase/server";
import { CheckoutContent } from "./CheckoutContent";
import { Loader2 } from "lucide-react";

async function CheckoutData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [locationsResult, deliveryZonesResult, shippingZonesResult, storeCreditResult] =
    await Promise.all([
      getFulfillmentLocations({ is_active: true }),
      getDeliveryZones({ is_active: true }),
      getShippingZones({ is_active: true }),
      user ? getUserStoreCredits(user.id) : Promise.resolve({ balance: 0, error: null }),
    ]);

  const locations = locationsResult.data || [];
  const deliveryZones = deliveryZonesResult.data || [];
  const shippingZones = shippingZonesResult.data || [];
  const storeCreditBalance = storeCreditResult.balance || 0;

  // Get user profile for pre-filling checkout
  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, phone")
      .eq("id", user.id)
      .single();
    userProfile = profile;
  }

  return (
    <CheckoutContent
      locations={locations}
      deliveryZones={deliveryZones}
      shippingZones={shippingZones}
      userId={user?.id || null}
      userEmail={user?.email || userProfile?.email || null}
      userFullName={userProfile?.full_name || null}
      userPhone={userProfile?.phone || null}
      storeCreditBalance={storeCreditBalance}
    />
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
          </div>
        </div>
      }
    >
      <CheckoutData />
    </Suspense>
  );
}
