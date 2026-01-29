"use client";

import { useState, useEffect } from "react";
import { MapPin, Truck, Package, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { FulfillmentSelection } from "@/contexts/CartContext";

interface Location {
  id: string;
  name: string;
  type: "pickup" | "delivery" | "shipping";
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
}

export function FulfillmentSelector({
  pickupLocations,
  deliveryZones,
  shippingZones,
  fulfillment,
  setFulfillment,
  shippingAddress,
  setShippingAddress,
}: FulfillmentSelectorProps) {
  const [zipCode, setZipCode] = useState("");
  const [matchedDeliveryZone, setMatchedDeliveryZone] =
    useState<DeliveryZone | null>(null);
  const [state, setState] = useState("");
  const [matchedShippingZone, setMatchedShippingZone] =
    useState<ShippingZone | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Check ZIP code for delivery zone
  useEffect(() => {
    if (zipCode.length >= 5) {
      const zone = deliveryZones.find((z) =>
        z.zip_codes.some((code) => code === zipCode || zipCode.startsWith(code))
      );
      setMatchedDeliveryZone(zone || null);
      if (zone) {
        setFulfillment({ zoneId: zone.id });
      }
    } else {
      setMatchedDeliveryZone(null);
    }
  }, [zipCode, deliveryZones, setFulfillment]);

  // Check state for shipping zone
  useEffect(() => {
    if (state.length >= 2) {
      const upperState = state.toUpperCase();
      const zone = shippingZones.find((z) =>
        z.states.some(
          (s) => s.toUpperCase() === upperState || s.toUpperCase().includes(upperState)
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

  const handleSelectType = (type: "pickup" | "delivery" | "shipping") => {
    setFulfillment({
      type,
      locationId: null,
      zoneId: null,
      scheduledDate: null,
    });
    // Reset form states
    setZipCode("");
    setMatchedDeliveryZone(null);
    setState("");
    setMatchedShippingZone(null);
  };

  const handleSelectLocation = (locationId: string) => {
    setFulfillment({ locationId });
    setShowLocationDropdown(false);
  };

  const selectedLocation = pickupLocations.find(
    (l) => l.id === fulfillment.locationId
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[var(--color-charcoal)]">
        How would you like to receive your order?
      </h2>

      {/* Fulfillment Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pickup Option */}
        {pickupLocations.length > 0 && (
          <button
            onClick={() => handleSelectType("pickup")}
            className={cn(
              "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
              fulfillment.type === "pickup"
                ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                : "border-[var(--color-border)] hover:border-[var(--color-primary-300)] bg-white"
            )}
          >
            {fulfillment.type === "pickup" && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[var(--color-primary-500)] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <MapPin
              className={cn(
                "w-8 h-8",
                fulfillment.type === "pickup"
                  ? "text-[var(--color-primary-500)]"
                  : "text-[var(--color-muted)]"
              )}
            />
            <div className="text-center">
              <p className="font-semibold text-[var(--color-charcoal)]">
                Pickup
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Free · Pick up at our location
              </p>
            </div>
          </button>
        )}

        {/* Delivery Option */}
        {deliveryZones.length > 0 && (
          <button
            onClick={() => handleSelectType("delivery")}
            className={cn(
              "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
              fulfillment.type === "delivery"
                ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                : "border-[var(--color-border)] hover:border-[var(--color-primary-300)] bg-white"
            )}
          >
            {fulfillment.type === "delivery" && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[var(--color-primary-500)] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <Truck
              className={cn(
                "w-8 h-8",
                fulfillment.type === "delivery"
                  ? "text-[var(--color-primary-500)]"
                  : "text-[var(--color-muted)]"
              )}
            />
            <div className="text-center">
              <p className="font-semibold text-[var(--color-charcoal)]">
                Local Delivery
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Delivered to your door
              </p>
            </div>
          </button>
        )}

        {/* Shipping Option */}
        {shippingZones.length > 0 && (
          <button
            onClick={() => handleSelectType("shipping")}
            className={cn(
              "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
              fulfillment.type === "shipping"
                ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                : "border-[var(--color-border)] hover:border-[var(--color-primary-300)] bg-white"
            )}
          >
            {fulfillment.type === "shipping" && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[var(--color-primary-500)] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <Package
              className={cn(
                "w-8 h-8",
                fulfillment.type === "shipping"
                  ? "text-[var(--color-primary-500)]"
                  : "text-[var(--color-muted)]"
              )}
            />
            <div className="text-center">
              <p className="font-semibold text-[var(--color-charcoal)]">
                Shipping
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Ship anywhere in the US
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Pickup Location Selection */}
      {fulfillment.type === "pickup" && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-4">
            Select Pickup Location
          </h3>

          <div className="relative">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-slate-100)] rounded-lg text-left"
            >
              {selectedLocation ? (
                <div>
                  <p className="font-medium text-[var(--color-charcoal)]">
                    {selectedLocation.name}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {[
                      selectedLocation.address_line1,
                      selectedLocation.city,
                      selectedLocation.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              ) : (
                <span className="text-[var(--color-muted)]">
                  Choose a location...
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-[var(--color-muted)] transition-transform",
                  showLocationDropdown && "rotate-180"
                )}
              />
            </button>

            {showLocationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[var(--color-border)] shadow-lg z-10 max-h-64 overflow-y-auto">
                {pickupLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleSelectLocation(location.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-4 text-left hover:bg-[var(--color-slate-100)] transition-colors",
                      location.id === fulfillment.locationId &&
                        "bg-[var(--color-primary-50)]"
                    )}
                  >
                    <MapPin className="w-5 h-5 text-[var(--color-primary-500)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[var(--color-charcoal)]">
                        {location.name}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
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
                        <p className="text-sm text-[var(--color-muted)] mt-1">
                          {location.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedLocation?.instructions && (
            <div className="mt-4 p-4 bg-[var(--color-cream-100)] rounded-lg">
              <p className="text-sm text-[var(--color-charcoal)]">
                <strong>Pickup Instructions:</strong>{" "}
                {selectedLocation.instructions}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delivery Zone Check */}
      {fulfillment.type === "delivery" && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-4">
            Check Delivery Availability
          </h3>

          <div className="space-y-4">
            <Input
              label="Enter your ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="12345"
            />

            {zipCode.length >= 5 && (
              <div
                className={cn(
                  "p-4 rounded-lg",
                  matchedDeliveryZone
                    ? "bg-[var(--color-success-50)] border border-[var(--color-success)]"
                    : "bg-[var(--color-error-50)] border border-[var(--color-error)]"
                )}
              >
                {matchedDeliveryZone ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-[var(--color-success)]" />
                      <p className="font-medium text-[var(--color-success)]">
                        We deliver to your area!
                      </p>
                    </div>
                    <p className="text-sm text-[var(--color-muted)]">
                      {matchedDeliveryZone.name}
                    </p>
                    <p className="text-sm font-medium mt-2">
                      Delivery Fee:{" "}
                      {matchedDeliveryZone.delivery_fee === 0
                        ? "Free"
                        : formatCurrency(matchedDeliveryZone.delivery_fee)}
                      {matchedDeliveryZone.free_delivery_minimum && (
                        <span className="text-[var(--color-muted)] font-normal">
                          {" "}
                          (Free over{" "}
                          {formatCurrency(matchedDeliveryZone.free_delivery_minimum)})
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-[var(--color-error)]">
                    Sorry, we don&apos;t currently deliver to this ZIP code.
                    Please try pickup or shipping instead.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipping Zone Check */}
      {fulfillment.type === "shipping" && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-4">
            Check Shipping Availability
          </h3>

          <div className="space-y-4">
            <Input
              label="Enter your state (e.g., PA, NY)"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="PA"
              maxLength={2}
            />

            {state.length >= 2 && (
              <div
                className={cn(
                  "p-4 rounded-lg",
                  matchedShippingZone
                    ? "bg-[var(--color-success-50)] border border-[var(--color-success)]"
                    : "bg-[var(--color-error-50)] border border-[var(--color-error)]"
                )}
              >
                {matchedShippingZone ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-[var(--color-success)]" />
                      <p className="font-medium text-[var(--color-success)]">
                        We ship to your state!
                      </p>
                    </div>
                    <p className="text-sm text-[var(--color-muted)]">
                      {matchedShippingZone.name}
                    </p>
                    <p className="text-sm font-medium mt-2">
                      Shipping: Starting at{" "}
                      {formatCurrency(matchedShippingZone.base_rate)}
                      {matchedShippingZone.per_lb_rate > 0 && (
                        <span className="text-[var(--color-muted)] font-normal">
                          {" "}
                          + {formatCurrency(matchedShippingZone.per_lb_rate)}/lb
                        </span>
                      )}
                      {matchedShippingZone.free_shipping_minimum && (
                        <span className="text-[var(--color-muted)] font-normal">
                          {" "}
                          (Free over{" "}
                          {formatCurrency(matchedShippingZone.free_shipping_minimum)})
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-[var(--color-error)]">
                    Sorry, we don&apos;t currently ship to this state. Please
                    try pickup or local delivery instead.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
