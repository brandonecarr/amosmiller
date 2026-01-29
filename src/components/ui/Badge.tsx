import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
  size?: "sm" | "md";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variants = {
      default: "bg-[var(--color-slate-100)] text-[var(--color-slate-700)]",
      success: "bg-[var(--color-success-light)] text-green-800",
      warning: "bg-[var(--color-warning-light)] text-yellow-800",
      error: "bg-[var(--color-error-light)] text-red-800",
      info: "bg-[var(--color-info-light)] text-blue-800",
      outline:
        "bg-transparent border border-[var(--color-border)] text-[var(--color-muted-foreground)]",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
