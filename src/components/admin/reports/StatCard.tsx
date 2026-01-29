import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
}

export function StatCard({ label, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <Card variant="default">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-muted)]">{label}</p>
            <p className="text-2xl font-bold text-[var(--color-charcoal)] mt-1">
              {value}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
            <Icon className="w-6 h-6 text-[var(--color-primary-500)]" />
          </div>
        </div>
        {change && (
          <div className="flex items-center gap-1 mt-3">
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
            ) : trend === "down" ? (
              <TrendingDown className="w-4 h-4 text-[var(--color-error)]" />
            ) : null}
            <span
              className={`text-sm font-medium ${
                trend === "up"
                  ? "text-[var(--color-success)]"
                  : trend === "down"
                    ? "text-[var(--color-error)]"
                    : "text-[var(--color-muted)]"
              }`}
            >
              {change}
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              vs last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
