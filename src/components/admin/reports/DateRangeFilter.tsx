"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { subDays, subMonths, format } from "date-fns";
import { Calendar } from "lucide-react";

const presets = [
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
  { label: "12 Months", days: 365 },
  { label: "All", days: 0 },
];

export function DateRangeFilter({
  currentFrom,
  currentTo,
}: {
  currentFrom: string;
  currentTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateRange = (from: string, to: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from);
    params.set("to", to);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePreset = (days: number) => {
    const to = format(new Date(), "yyyy-MM-dd");
    if (days === 0) {
      updateRange("2020-01-01", to);
    } else if (days === 365) {
      updateRange(format(subMonths(new Date(), 12), "yyyy-MM-dd"), to);
    } else {
      updateRange(format(subDays(new Date(), days), "yyyy-MM-dd"), to);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar className="w-4 h-4 text-[var(--color-muted)]" />
      <div className="flex items-center gap-1">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset.days)}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-[var(--color-charcoal)] hover:bg-[var(--color-slate-100)] disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 ml-2">
        <input
          type="date"
          value={currentFrom}
          onChange={(e) => updateRange(e.target.value, currentTo)}
          className="px-2 py-1.5 text-xs border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)]"
        />
        <span className="text-xs text-[var(--color-muted)]">to</span>
        <input
          type="date"
          value={currentTo}
          onChange={(e) => updateRange(currentFrom, e.target.value)}
          className="px-2 py-1.5 text-xs border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)]"
        />
      </div>
      {isPending && (
        <span className="text-xs text-[var(--color-muted)]">Loading...</span>
      )}
    </div>
  );
}
