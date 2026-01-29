"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
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
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
      {/* Announcement Bar */}
      <div className="bg-[var(--color-primary-500)] text-white text-center py-2 px-4 text-sm">
        <p>Free local delivery on orders over $100</p>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 text-[var(--color-charcoal)] hover:text-[var(--color-primary-500)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl lg:text-2xl font-bold text-[var(--color-primary-500)]">
              Amos Miller Farm
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[...navigation, ...cmsNavItems.map((item) => ({ ...item, children: undefined }))].map((item) => (
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
                    "flex items-center gap-1 px-4 py-2 text-sm font-medium text-[var(--color-charcoal)] hover:text-[var(--color-primary-500)] transition-colors",
                    activeDropdown === item.label && "text-[var(--color-primary-500)]"
                  )}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        activeDropdown === item.label && "rotate-180"
                      )}
                    />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {item.children && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 pt-2 animate-slide-down">
                    <div className="bg-white rounded-lg shadow-lg border border-[var(--color-border)] py-2 min-w-[200px]">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-[var(--color-charcoal)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-primary-500)] transition-colors"
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
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              type="button"
              className="p-2 text-[var(--color-charcoal)] hover:text-[var(--color-primary-500)] transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account */}
            <Link
              href="/account"
              className="p-2 text-[var(--color-charcoal)] hover:text-[var(--color-primary-500)] transition-colors"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-[var(--color-charcoal)] hover:text-[var(--color-primary-500)] transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--color-primary-500)] text-white text-xs font-medium rounded-full flex items-center justify-center"
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
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="py-4 border-t border-[var(--color-border)] animate-slide-down">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
              <input
                type="search"
                placeholder="Search for products..."
                className="w-full pl-12 pr-4 py-3 bg-[var(--color-slate-100)] border-0 rounded-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[104px] bg-white z-40 overflow-y-auto animate-fade-in">
          <nav className="container mx-auto px-4 py-6">
            {[...navigation, ...cmsNavItems.map((item) => ({ ...item, children: undefined }))].map((item) => (
              <div key={item.label} className="border-b border-[var(--color-border)]">
                <Link
                  href={item.href}
                  className="block py-4 text-lg font-medium text-[var(--color-charcoal)] hover:text-[var(--color-primary-500)]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="pl-4 pb-4 space-y-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block py-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary-500)]"
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
        </div>
      )}
    </header>
  );
}
