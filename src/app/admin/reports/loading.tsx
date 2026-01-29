import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Skeleton className="h-10 w-64" />

      {/* Tab Bar */}
      <div className="flex gap-1">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Chart Area */}
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
