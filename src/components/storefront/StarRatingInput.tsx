"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || value;

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none transition-transform hover:scale-110"
          onMouseEnter={() => setHoverRating(star)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= displayRating
                ? "text-orange-400 fill-orange-400"
                : "text-slate-200"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-slate-500">
          {value} / 5
        </span>
      )}
    </div>
  );
}
