import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "Meat", href: "/shop/meat" },
    { label: "Dairy", href: "/shop/dairy" },
    { label: "Produce", href: "/shop/produce" },
    { label: "Pantry", href: "/shop/pantry" },
  ],
  account: [
    { label: "My Account", href: "/account" },
    { label: "Order History", href: "/account/orders" },
    { label: "Subscriptions", href: "/account/subscriptions" },
    { label: "Saved Addresses", href: "/account/addresses" },
  ],
  info: [
    { label: "About Us", href: "/about" },
    { label: "Our Farm", href: "/our-farm" },
    { label: "Blog", href: "/blog" },
    { label: "Delivery Areas", href: "/delivery" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refunds" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-charcoal)] text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-white">
                Amos Miller Farm
              </span>
            </Link>
            <p className="text-[var(--color-slate-300)] mb-6 max-w-sm">
              Farm-fresh meats, dairy, and produce delivered directly to your
              door. Supporting sustainable agriculture since 1995.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:orders@amosmillerfarm.com"
                className="flex items-center gap-3 text-[var(--color-slate-300)] hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5 text-[var(--color-primary-400)]" />
                orders@amosmillerfarm.com
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center gap-3 text-[var(--color-slate-300)] hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5 text-[var(--color-primary-400)]" />
                (123) 456-7890
              </a>
              <div className="flex items-start gap-3 text-[var(--color-slate-300)]">
                <MapPin className="w-5 h-5 text-[var(--color-primary-400)] flex-shrink-0 mt-0.5" />
                <span>
                  123 Farm Road
                  <br />
                  Lancaster, PA 17601
                </span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[var(--color-slate-300)] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Account</h3>
            <ul className="space-y-3">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[var(--color-slate-300)] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Information</h3>
            <ul className="space-y-3">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[var(--color-slate-300)] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--color-slate-700)]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[var(--color-slate-400)] text-sm">
              &copy; {currentYear} Amos Miller Farm. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[var(--color-slate-400)] text-sm hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
