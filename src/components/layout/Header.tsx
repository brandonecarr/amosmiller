"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { label: "Shop", href: "/shop" },
  {
    label: "Meat",
    href: "/shop/meat",
    children: [
      { label: "Beef", href: "/shop/meat/beef" },
      { label: "Pork", href: "/shop/meat/pork" },
      { label: "Chicken", href: "/shop/meat/chicken" },
      { label: "Lamb", href: "/shop/meat/lamb" },
    ],
  },
  { label: "Dairy", href: "/shop/dairy" },
  { label: "Produce", href: "/shop/produce" },
  { label: "Pantry", href: "/shop/pantry" },
  { label: "About", href: "/about" },
];

export function Header({
  cmsNavItems = [],
}: {
  cmsNavItems?: { label: string; href: string }[];
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav
        className={cn(
          "mx-auto max-w-6xl rounded-full border border-slate-200/80 transition-all duration-300",
          scrolled
            ? "bg-white/90 backdrop-blur-lg shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]"
            : "bg-white/80 backdrop-blur-md shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
        )}
      >
        <div className="flex items-center justify-between h-14 px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Leaf className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-semibold text-slate-900 font-heading">
              Amos Miller Farm
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {[
              ...navigation,
              ...cmsNavItems.map((item) => ({
                ...item,
                children: undefined,
              })),
            ].map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() =>
                  item.children && setActiveDropdown(item.label)
                }
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                    activeDropdown === item.label
                      ? "text-slate-900 bg-slate-100"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      className={cn(
                        "w-3 h-3 transition-transform",
                        activeDropdown === item.label && "rotate-180"
                      )}
                    />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {item.children && activeDropdown === item.label && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 py-2 min-w-[180px]">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Account */}
            <Link
              href="/account"
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
              aria-label="Account"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
              aria-label="Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center"
                  role="status"
                  aria-live="polite"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                  <span className="sr-only">
                    {itemCount} {itemCount === 1 ? "item" : "items"} in cart
                  </span>
                </span>
              )}
            </Link>

            {/* Shop Now CTA - Desktop */}
            <Link
              href="/shop"
              className="hidden lg:inline-flex ml-2 px-4 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-full hover:bg-slate-800 transition-colors"
            >
              Shop Now
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 ml-1 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="mx-auto max-w-6xl mt-2">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 animate-slide-down">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search for products..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mx-auto max-w-6xl mt-2">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 animate-slide-down">
            <nav className="space-y-1">
              {[
                ...navigation,
                ...cmsNavItems.map((item) => ({
                  ...item,
                  children: undefined,
                })),
              ].map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="ml-4 space-y-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Link
                href="/shop"
                className="block w-full px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full text-center hover:bg-slate-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
