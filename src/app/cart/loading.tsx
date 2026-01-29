import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-[var(--color-border)] p-4 flex gap-4"
          >
            <Skeleton className="h-24 w-24 rounded-lg shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-10 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 shrink-0" />
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 h-fit">
        <Skeleton className="h-6 w-36 mb-6" />
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="border-t border-[var(--color-border)] pt-3 flex justify-between">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-lg mt-6" />
      </div>
    </div>
  );
}
