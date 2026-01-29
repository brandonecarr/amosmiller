"use client";

import Script from "next/script";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

// E-commerce event helpers
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

export function trackPurchase(params: {
  transactionId: string;
  value: number;
  currency?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) {
  trackEvent("purchase", {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency || "USD",
    items: params.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

export function trackAddToCart(params: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  trackEvent("add_to_cart", {
    currency: "USD",
    value: params.price * params.quantity,
    items: [
      {
        item_id: params.id,
        item_name: params.name,
        price: params.price,
        quantity: params.quantity,
      },
    ],
  });
}

export function trackBeginCheckout(params: { value: number; itemCount: number }) {
  trackEvent("begin_checkout", {
    currency: "USD",
    value: params.value,
    items: [{ quantity: params.itemCount }],
  });
}

export function trackViewItem(params: {
  id: string;
  name: string;
  price: number;
  category?: string;
}) {
  trackEvent("view_item", {
    currency: "USD",
    value: params.price,
    items: [
      {
        item_id: params.id,
        item_name: params.name,
        price: params.price,
        item_category: params.category,
      },
    ],
  });
}

// Extend Window type for gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
  }
}
