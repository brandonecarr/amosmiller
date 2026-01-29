import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { FacebookPixel } from "@/components/analytics/FacebookPixel";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
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
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased`}>
        <GoogleAnalytics />
        <FacebookPixel />
        {children}
      </body>
    </html>
  );
}
