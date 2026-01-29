import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-white shadow-sm",
      elevated: "bg-white shadow-md hover:shadow-lg transition-shadow",
      outlined: "bg-white border border-[var(--color-border)]",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-xl overflow-hidden", variants[variant], className)}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 py-4", className)} {...props} />
  )
);

CardHeader.displayName = "CardHeader";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 py-4", className)} {...props} />
  )
);

CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-6 py-4 bg-[var(--color-slate-50)] border-t border-[var(--color-border)]",
        className
      )}
      {...props}
    />
  )
);

CardFooter.displayName = "CardFooter";

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold text-[var(--color-charcoal)]",
      className
    )}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--color-muted)]", className)}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription };
