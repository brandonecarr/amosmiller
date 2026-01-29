import { HeaderWrapper } from "@/components/layout/HeaderWrapper";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/contexts/CartContext";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen bg-[#fafafa]">
        <HeaderWrapper />
        <main className="flex-1 pt-24">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
