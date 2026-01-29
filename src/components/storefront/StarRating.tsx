import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function StarRating({ rating, size = "md", showValue = false }: StarRatingProps) {
  const stars = [];
  const iconSize = sizeMap[size];

  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      // Full star
      stars.push(
        <Star key={i} className={`${iconSize} text-orange-400 fill-orange-400`} />
      );
    } else if (i === Math.ceil(rating) && rating % 1 >= 0.25) {
      // Partial star — use clip-path for fractional fill
      const percent = Math.round((rating % 1) * 100);
      stars.push(
        <span key={i} className="relative inline-block">
          <Star className={`${iconSize} text-slate-200`} />
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${percent}%` }}
          >
            <Star className={`${iconSize} text-orange-400 fill-orange-400`} />
          </span>
        </span>
      );
    } else {
      // Empty star
      stars.push(
        <Star key={i} className={`${iconSize} text-slate-200`} />
      );
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-slate-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
