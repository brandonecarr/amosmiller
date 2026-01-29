"use client";

import Script from "next/script";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export function FacebookPixel() {
  if (!FB_PIXEL_ID) return null;

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Facebook Pixel event helpers
export function fbTrackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
}

export function fbTrackPurchase(params: { value: number; currency?: string }) {
  fbTrackEvent("Purchase", {
    value: params.value,
    currency: params.currency || "USD",
  });
}

export function fbTrackAddToCart(params: {
  value: number;
  contentName: string;
  currency?: string;
}) {
  fbTrackEvent("AddToCart", {
    value: params.value,
    content_name: params.contentName,
    currency: params.currency || "USD",
  });
}

export function fbTrackInitiateCheckout(params: {
  value: number;
  numItems: number;
}) {
  fbTrackEvent("InitiateCheckout", {
    value: params.value,
    num_items: params.numItems,
    currency: "USD",
  });
}

export function fbTrackViewContent(params: {
  contentName: string;
  value: number;
}) {
  fbTrackEvent("ViewContent", {
    content_name: params.contentName,
    value: params.value,
    currency: "USD",
  });
}
