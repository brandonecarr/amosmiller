"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Mail, Settings as SettingsIcon } from "lucide-react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-charcoal)]">Settings</h1>
        <p className="text-[var(--color-muted)] mt-1">
          Manage notifications, email templates, and system settings
        </p>
      </div>

      <SettingsTabs />

      <div>{children}</div>
    </div>
  );
}

function SettingsTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Notifications",
      href: "/admin/settings/notifications",
      icon: Bell,
    },
    {
      name: "Email Templates",
      href: "/admin/settings/email-templates",
      icon: Mail,
    },
  ];

  return (
    <div className="border-b border-[var(--color-border)]">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? "border-[var(--color-primary-500)] text-[var(--color-primary-500)]"
                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-charcoal)] hover:border-[var(--color-border)]"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
