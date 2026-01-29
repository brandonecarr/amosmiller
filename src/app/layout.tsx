import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/layout/HeaderWrapper";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { FacebookPixel } from "@/components/analytics/FacebookPixel";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Amos Miller Farm - Fresh Farm Products Delivered",
    template: "%s | Amos Miller Farm",
  },
  description:
    "Farm-fresh meats, dairy, and produce delivered directly to your door. Supporting sustainable agriculture with quality products from our family farm.",
  keywords: [
    "farm",
    "organic",
    "meat",
    "dairy",
    "produce",
    "delivery",
    "sustainable",
    "local",
  ],
  authors: [{ name: "Amos Miller Farm" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Amos Miller Farm",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <GoogleAnalytics />
        <FacebookPixel />
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <HeaderWrapper />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
