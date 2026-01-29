"use client";

import { useState, useTransition } from "react";
import { Loader2, Truck, Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui";
import { addTrackingInfo } from "@/lib/actions/orders";

interface TrackingFormProps {
  orderId: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

export function TrackingForm({ orderId, trackingNumber, trackingUrl }: TrackingFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [number, setNumber] = useState(trackingNumber || "");
  const [url, setUrl] = useState(trackingUrl || "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!number.trim()) {
      alert("Please enter a tracking number");
      return;
    }

    startTransition(async () => {
      const result = await addTrackingInfo(orderId, number, url || undefined);

      if (result.error) {
        alert(`Error saving tracking info: ${result.error}`);
      } else {
        setIsEditing(false);
      }
    });
  };

  const hasChanges = number !== (trackingNumber || "") || url !== (trackingUrl || "");

  // Carrier detection for auto-generating tracking URLs
  const detectCarrier = (trackingNum: string): { name: string; url: string } | null => {
    const cleanNum = trackingNum.replace(/\s/g, "").toUpperCase();

    // USPS
    if (/^(94|93|92|94|95)\d{20}$/.test(cleanNum) || /^\d{22}$/.test(cleanNum)) {
      return {
        name: "USPS",
        url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${cleanNum}`,
      };
    }

    // UPS
    if (/^1Z[A-Z0-9]{16}$/.test(cleanNum)) {
      return {
        name: "UPS",
        url: `https://www.ups.com/track?tracknum=${cleanNum}`,
      };
    }

    // FedEx
    if (/^\d{12,22}$/.test(cleanNum)) {
      return {
        name: "FedEx",
        url: `https://www.fedex.com/fedextrack/?trknbr=${cleanNum}`,
      };
    }

    return null;
  };

  const detectedCarrier = number ? detectCarrier(number) : null;

  if (!isEditing && !trackingNumber) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Tracking Information
          </h2>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Add Tracking
          </Button>
        </div>
        <p className="text-sm text-[var(--color-muted)] mt-2">No tracking information added yet.</p>
      </div>
    );
  }

  if (!isEditing && trackingNumber) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Tracking Information
          </h2>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="text-[var(--color-muted)]">Tracking Number: </span>
            <span className="font-mono font-medium">{trackingNumber}</span>
          </p>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[var(--color-primary-500)] hover:underline"
            >
              Track Package <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
        <h2 className="font-semibold text-[var(--color-charcoal)] flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Tracking Information
        </h2>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1">
            Tracking Number
          </label>
          <input
            type="text"
            value={number}
            onChange={(e) => {
              setNumber(e.target.value);
              // Auto-fill URL if we detect the carrier
              const carrier = detectCarrier(e.target.value);
              if (carrier && !url) {
                setUrl(carrier.url);
              }
            }}
            placeholder="Enter tracking number"
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            disabled={isPending}
          />
          {detectedCarrier && (
            <p className="text-xs text-green-600 mt-1">
              Detected: {detectedCarrier.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1">
            Tracking URL
            <span className="text-[var(--color-muted)] font-normal ml-2">(optional)</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            disabled={isPending}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={isPending || !number.trim()}>
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Tracking
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setNumber(trackingNumber || "");
              setUrl(trackingUrl || "");
              setIsEditing(false);
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
