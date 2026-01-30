"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Package,
  Check,
  ChevronDown,
  AlertTriangle,
  Info,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { FulfillmentSelection } from "@/contexts/CartContext";

interface Location {
  id: string;
  name: string;
  type: "pickup" | "delivery" | "shipping";
  is_coop: boolean;
  description: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  instructions: string | null;
}

interface DeliveryZone {
  id: string;
  name: string;
  description: string | null;
  zip_codes: string[];
  delivery_fee: number;
  free_delivery_minimum: number | null;
  min_order_amount: number | null;
}

interface ShippingZone {
  id: string;
  name: string;
  description: string | null;
  states: string[];
  base_rate: number;
  per_lb_rate: number;
  free_shipping_minimum: number | null;
  min_order_amount: number | null;
}

type FulfillmentChoice = "fedex-ups" | "coop" | "farm-pickup" | null;

interface FulfillmentSelectorProps {
  pickupLocations: Location[];
  deliveryZones: DeliveryZone[];
  shippingZones: ShippingZone[];
  fulfillment: FulfillmentSelection;
  setFulfillment: (update: Partial<FulfillmentSelection>) => void;
  shippingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
  };
  setShippingAddress: (address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
  }) => void;
  hasCoopItems: boolean;
  subtotal: number;
}

export function FulfillmentSelector({
  pickupLocations,
  deliveryZones,
  shippingZones,
  fulfillment,
  setFulfillment,
  shippingAddress,
  setShippingAddress,
  hasCoopItems,
  subtotal,
}: FulfillmentSelectorProps) {
  // Partition pickup locations
  const farmLocation = pickupLocations.find((l) => !l.is_coop);
  const coopLocations = pickupLocations.filter((l) => l.is_coop);

  // Business rules
  const isShippingDisabled = subtotal < 50 || hasCoopItems;
  const isFarmPickupDisabled = hasCoopItems;
  const isCoopDisabled = coopLocations.length === 0;

  // Local UI choice state
  const [choice, setChoice] = useState<FulfillmentChoice>(null);

  // Shipping zone matching
  const [state, setState] = useState("");
  const [matchedShippingZone, setMatchedShippingZone] =
    useState<ShippingZone | null>(null);

  // Co-op location dropdown
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Initialize choice from existing fulfillment state (for back-navigation)
  useEffect(() => {
    if (fulfillment.type === "shipping") {
      setChoice("fedex-ups");
    } else if (fulfillment.type === "pickup" && fulfillment.locationId) {
      const loc = pickupLocations.find(
        (l) => l.id === fulfillment.locationId
      );
      if (loc?.is_coop) {
        setChoice("coop");
      } else {
        setChoice("farm-pickup");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select Co-Op when cart has co-op items
  useEffect(() => {
    if (hasCoopItems && choice !== "coop") {
      handleSelectChoice("coop");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCoopItems]);

  // Check state for shipping zone
  useEffect(() => {
    if (state.length >= 2) {
      const upperState = state.toUpperCase();
      const zone = shippingZones.find((z) =>
        z.states.some(
          (s) =>
            s.toUpperCase() === upperState ||
            s.toUpperCase().includes(upperState)
        )
      );
      setMatchedShippingZone(zone || null);
      if (zone) {
        setFulfillment({ zoneId: zone.id });
      }
    } else {
      setMatchedShippingZone(null);
    }
  }, [state, shippingZones, setFulfillment]);

  const handleSelectChoice = (newChoice: FulfillmentChoice) => {
    setChoice(newChoice);

    switch (newChoice) {
      case "fedex-ups":
        setFulfillment({
          type: "shipping",
          locationId: null,
          zoneId: null,
          scheduledDate: null,
        });
        setState("");
        setMatchedShippingZone(null);
        break;
      case "coop":
        setFulfillment({
          type: "pickup",
          locationId: null,
          zoneId: null,
          scheduledDate: null,
        });
        break;
      case "farm-pickup":
        setFulfillment({
          type: "pickup",
          locationId: farmLocation?.id ?? null,
          zoneId: null,
          scheduledDate: null,
        });
        break;
    }
  };

  const handleSelectCoopLocation = (locationId: string) => {
    setFulfillment({ locationId });
    setShowLocationDropdown(false);
  };

  const selectedCoopLocation = coopLocations.find(
    (l) => l.id === fulfillment.locationId
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-heading font-bold text-slate-900">
        Please select Delivery Option
      </h2>

      {/* Notice Banners */}
      <div className="space-y-3">
        {/* PA Dairy Restriction Notice */}
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Please Note</p>
            <p className="text-sm text-amber-700 mt-1">
              We are currently not allowed to sell or ship any of our raw dairy
              products within our home state of PA. We can only process dairy
              orders that are sold and shipped outside of PA. Thank you for your
              understanding.
            </p>
          </div>
        </div>

        {/* Shipping Cost / $50 Minimum Notice */}
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            FedEx/UPS shipping is <strong>NOT</strong> free.{" "}
            <Link
              href="/shipping-faqs"
              className="text-blue-600 underline hover:text-blue-800"
            >
              See shipping FAQs
            </Link>
            . Orders must be $50 or more to choose FedEx/UPS.
          </p>
        </div>

        {/* Co-Op Restriction Notice */}
        {hasCoopItems && (
          <div className="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">
              If you have co-op items in your shopping cart, the only shipping
              option available to you is to have your order shipped to the co-op
              you choose. If you want FedEx/UPS shipping or farm pickup then
              please remove the co-op items from your cart to make those options
              available.
            </p>
          </div>
        )}
      </div>

      {/* Fulfillment Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FedEx/UPS Option */}
        <button
          onClick={() => !isShippingDisabled && handleSelectChoice("fedex-ups")}
          disabled={isShippingDisabled}
          className={cn(
            "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            isShippingDisabled
              ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
              : choice === "fedex-ups"
              ? "border-orange-500 bg-orange-50"
              : "border-slate-200 hover:border-slate-300 bg-white"
          )}
        >
          {choice === "fedex-ups" && (
            <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <Package
            className={cn(
              "w-8 h-8",
              choice === "fedex-ups" ? "text-orange-500" : "text-slate-400"
            )}
          />
          <div className="text-center">
            <p className="font-semibold text-slate-900">FedEx/UPS</p>
            <p className="text-sm text-slate-500">Ship anywhere in the US</p>
            {isShippingDisabled && subtotal < 50 && !hasCoopItems && (
              <p className="text-xs text-red-500 mt-1">
                Min. order: {formatCurrency(50)}
              </p>
            )}
          </div>
        </button>

        {/* Co-Op Option */}
        <button
          onClick={() => !isCoopDisabled && handleSelectChoice("coop")}
          disabled={isCoopDisabled}
          className={cn(
            "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            isCoopDisabled
              ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
              : choice === "coop"
              ? "border-orange-500 bg-orange-50"
              : "border-slate-200 hover:border-slate-300 bg-white"
          )}
        >
          {choice === "coop" && (
            <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <MapPin
            className={cn(
              "w-8 h-8",
              choice === "coop" ? "text-orange-500" : "text-slate-400"
            )}
          />
          <div className="text-center">
            <p className="font-semibold text-slate-900">Co-Op</p>
            <p className="text-sm text-slate-500">Ship to your co-op</p>
            {isCoopDisabled && (
              <p className="text-xs text-red-500 mt-1">
                No co-op locations available
              </p>
            )}
          </div>
        </button>

        {/* Farm Pickup Option */}
        <button
          onClick={() =>
            !isFarmPickupDisabled && handleSelectChoice("farm-pickup")
          }
          disabled={isFarmPickupDisabled}
          className={cn(
            "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            isFarmPickupDisabled
              ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
              : choice === "farm-pickup"
              ? "border-orange-500 bg-orange-50"
              : "border-slate-200 hover:border-slate-300 bg-white"
          )}
        >
          {choice === "farm-pickup" && (
            <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <MapPin
            className={cn(
              "w-8 h-8",
              choice === "farm-pickup" ? "text-orange-500" : "text-slate-400"
            )}
          />
          <div className="text-center">
            <p className="font-semibold text-slate-900">Farm Pickup</p>
            <p className="text-sm text-slate-500">
              648 Mill Creek School Rd
              <br />
              Bird in Hand, PA 17505
            </p>
          </div>
        </button>
      </div>

      {/* Detail Panels */}

      {/* FedEx/UPS: Shipping zone check */}
      {choice === "fedex-ups" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Check Shipping Availability
          </h3>

          <div className="space-y-4">
            <Input
              label="Enter your state (e.g., NY, CA)"
              value={state}
              onChange={(e) =>
                setState(e.target.value.toUpperCase().slice(0, 2))
              }
              placeholder="NY"
              maxLength={2}
            />

            {state.length >= 2 && (
              <div
                className={cn(
                  "p-4 rounded-xl",
                  matchedShippingZone
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                )}
              >
                {matchedShippingZone ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <p className="font-medium text-green-700">
                        We ship to your state!
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {matchedShippingZone.name}
                    </p>
                    <p className="text-sm font-medium text-slate-900 mt-2">
                      Shipping: Starting at{" "}
                      {formatCurrency(matchedShippingZone.base_rate)}
                      {matchedShippingZone.per_lb_rate > 0 && (
                        <span className="text-slate-500 font-normal">
                          {" "}
                          + {formatCurrency(matchedShippingZone.per_lb_rate)}/lb
                        </span>
                      )}
                      {matchedShippingZone.free_shipping_minimum && (
                        <span className="text-slate-500 font-normal">
                          {" "}
                          (Free over{" "}
                          {formatCurrency(
                            matchedShippingZone.free_shipping_minimum
                          )}
                          )
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-red-600">
                    Sorry, we don&apos;t currently ship to this state. Please
                    try a different delivery option.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Co-Op: Location dropdown */}
      {choice === "coop" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Select Co-Op Location
          </h3>

          <div className="relative">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-left hover:border-slate-300 transition-colors"
            >
              {selectedCoopLocation ? (
                <div>
                  <p className="font-medium text-slate-900">
                    {selectedCoopLocation.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {[
                      selectedCoopLocation.address_line1,
                      selectedCoopLocation.city,
                      selectedCoopLocation.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              ) : (
                <span className="text-slate-400">
                  Choose a co-op location...
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-slate-400 transition-transform",
                  showLocationDropdown && "rotate-180"
                )}
              />
            </button>

            {showLocationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-10 max-h-64 overflow-y-auto">
                {coopLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleSelectCoopLocation(location.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors",
                      location.id === fulfillment.locationId && "bg-orange-50"
                    )}
                  >
                    <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">
                        {location.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {[
                          location.address_line1,
                          location.city,
                          location.state,
                          location.postal_code,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {location.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {location.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCoopLocation?.instructions && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-900">
                <strong>Pickup Instructions:</strong>{" "}
                {selectedCoopLocation.instructions}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Farm Pickup: Show address and instructions */}
      {choice === "farm-pickup" && farmLocation && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Farm Pickup Details
          </h3>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">{farmLocation.name}</p>
              <p className="text-sm text-slate-500">
                {[
                  farmLocation.address_line1,
                  farmLocation.city,
                  farmLocation.state,
                  farmLocation.postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>

          {farmLocation.instructions && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-900">
                <strong>Pickup Instructions:</strong>{" "}
                {farmLocation.instructions}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
