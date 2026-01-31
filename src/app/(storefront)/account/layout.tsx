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
      <h1 className="text-3xl font-bold font-heading text-slate-900 mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1 lg:sticky lg:top-28">
          <nav className="bg-white rounded-2xl border border-slate-200 p-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
                >
                  <Icon className="w-4.5 h-4.5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left group"
                >
                  <LogOut className="w-4.5 h-4.5 group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </form>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  );
}
