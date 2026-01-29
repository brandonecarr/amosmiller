import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 rounded-2xl" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <Skeleton className="h-4 w-20 mb-3" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-40 rounded-full" />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
                <div className="px-4 pb-4 pt-0 border-t border-slate-50 bg-slate-50/50">
                  <Skeleton className="h-9 w-full mt-3 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
