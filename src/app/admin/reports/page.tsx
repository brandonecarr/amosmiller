import { subDays, format } from "date-fns";
import {
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
} from "@/lib/actions/reports";
import { ReportsTabs } from "@/components/admin/reports/ReportsTabs";
import { DateRangeFilter } from "@/components/admin/reports/DateRangeFilter";

export const metadata = {
  title: "Reports | Admin | Amos Miller Farm",
  description: "Sales, inventory, and customer analytics",
};

interface ReportsPageProps {
  searchParams: Promise<{ from?: string; to?: string; tab?: string }>;
}

export default async function AdminReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params = await searchParams;
  const to = params.to || format(new Date(), "yyyy-MM-dd");
  const from = params.from || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const activeTab = params.tab || "sales";

  const [salesData, inventoryData, customerData] = await Promise.all([
    getSalesReport(from, to),
    getInventoryReport(),
    getCustomerReport(from, to),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Reports
          </h1>
          <p className="text-[var(--color-muted)] mt-1">
            Analytics and insights for your store
          </p>
        </div>
        <DateRangeFilter currentFrom={from} currentTo={to} />
      </div>

      <ReportsTabs
        activeTab={activeTab}
        salesData={salesData}
        inventoryData={inventoryData}
        customerData={customerData}
      />
    </div>
  );
}
