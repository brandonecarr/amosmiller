import { Metadata } from "next";
import { GiftCardPurchase } from "./GiftCardPurchase";

export const metadata: Metadata = {
  title: "Gift Cards | Amos Miller Farm",
  description: "Give the gift of farm-fresh food. Purchase a digital gift card for friends and family.",
};

export default function GiftCardsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[var(--color-charcoal)] mb-4">
          Gift Cards
        </h1>
        <p className="text-lg text-[var(--color-muted)] max-w-2xl mx-auto">
          Share the gift of farm-fresh, organic food with your loved ones.
          Our digital gift cards are delivered instantly via email and never expire.
        </p>
      </div>

      <GiftCardPurchase />

      {/* Info Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white rounded-xl border border-[var(--color-border)]">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-2">Instant Delivery</h3>
          <p className="text-sm text-[var(--color-muted)]">
            Gift cards are delivered immediately via email to the recipient
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-xl border border-[var(--color-border)]">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-2">Never Expires</h3>
          <p className="text-sm text-[var(--color-muted)]">
            Our gift cards have no expiration date - use them whenever
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-xl border border-[var(--color-border)]">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-charcoal)] mb-2">Easy to Use</h3>
          <p className="text-sm text-[var(--color-muted)]">
            Simply enter the code at checkout to apply the balance
          </p>
        </div>
      </div>
    </div>
  );
}
