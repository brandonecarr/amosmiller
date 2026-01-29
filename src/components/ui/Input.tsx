import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-2.5 bg-white border rounded-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent",
            "disabled:bg-[var(--color-slate-100)] disabled:cursor-not-allowed",
            error
              ? "border-[var(--color-error)] focus:ring-[var(--color-error)]"
              : "border-[var(--color-border)]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
