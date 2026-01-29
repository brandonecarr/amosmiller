import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { User, Package, CreditCard, MapPin, Wallet, Gift, RefreshCw, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/account", label: "Dashboard", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/payment-methods", label: "Payment Methods", icon: CreditCard },
  { href: "/account/store-credits", label: "Store Credits", icon: Wallet },
  { href: "/account/gift-cards", label: "Gift Cards", icon: Gift },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <h1 className="text-3xl font-bold text-[var(--color-charcoal)] mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <nav className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-[var(--color-charcoal)] hover:bg-[var(--color-cream-100)] transition-colors border-b border-[var(--color-border)] last:border-b-0"
                >
                  <Icon className="w-5 h-5 text-[var(--color-muted)]" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-3 text-[var(--color-error)] hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </form>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  );
}
