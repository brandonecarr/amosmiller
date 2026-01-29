"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BarChart3, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SalesReport } from "./SalesReport";
import { InventoryReport } from "./InventoryReport";
import { CustomerReport } from "./CustomerReport";
import type { SalesReportData, InventoryReportData, CustomerReportData } from "@/lib/actions/reports";

const tabs = [
  { id: "sales", label: "Sales", icon: BarChart3 },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
] as const;

interface ReportsTabsProps {
  activeTab: string;
  salesData: SalesReportData;
  inventoryData: InventoryReportData;
  customerData: CustomerReportData;
}

export function ReportsTabs({
  activeTab,
  salesData,
  inventoryData,
  customerData,
}: ReportsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white rounded-xl border border-[var(--color-border)] p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center",
                isActive
                  ? "bg-[var(--color-primary-500)] text-white"
                  : "text-[var(--color-muted)] hover:text-[var(--color-charcoal)] hover:bg-[var(--color-slate-50)]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "sales" && <SalesReport data={salesData} />}
      {activeTab === "inventory" && <InventoryReport data={inventoryData} />}
      {activeTab === "customers" && <CustomerReport data={customerData} />}
    </div>
  );
}
