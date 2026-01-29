import Link from "next/link";
import { Mail, Phone, MapPin, Leaf } from "lucide-react";

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
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Leaf className="w-5 h-5 text-orange-400" />
              <span className="text-lg font-semibold text-white font-heading">
                Amos Miller Farm
              </span>
            </Link>
            <p className="text-slate-400 mb-6 max-w-sm text-sm leading-relaxed">
              Farm-fresh meats, dairy, and produce delivered directly to your
              door. Supporting sustainable agriculture since 1995.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:orders@amosmillerfarm.com"
                className="flex items-center gap-3 text-slate-400 hover:text-orange-400 transition-colors text-sm"
              >
                <Mail className="w-4 h-4 text-orange-400" />
                orders@amosmillerfarm.com
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center gap-3 text-slate-400 hover:text-orange-400 transition-colors text-sm"
              >
                <Phone className="w-4 h-4 text-orange-400" />
                (123) 456-7890
              </a>
              <div className="flex items-start gap-3 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
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
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-heading">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-orange-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-heading">
              Account
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-orange-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-heading">
              Information
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-orange-400 transition-colors"
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
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {currentYear} Amos Miller Farm. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-500 text-sm hover:text-orange-400 transition-colors"
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
