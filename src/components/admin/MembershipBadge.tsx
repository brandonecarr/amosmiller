import { Shield, Crown } from "lucide-react";

interface MembershipBadgeProps {
  tier: "standard" | "preserve-america" | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function MembershipBadge({
  tier,
  size = "md",
  showLabel = true,
}: MembershipBadgeProps) {
  if (!tier) return null;

  const isPreserveAmerica = tier === "preserve-america";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${
        isPreserveAmerica
          ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-300"
          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
      }`}
    >
      {isPreserveAmerica ? (
        <Crown className={iconSizes[size]} />
      ) : (
        <Shield className={iconSizes[size]} />
      )}
      {showLabel && (
        <span>{isPreserveAmerica ? "Preserve America" : "Standard"}</span>
      )}
    </span>
  );
}
