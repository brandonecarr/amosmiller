"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: { url: string; alt: string }[];
  isOnSale: boolean;
  isFeatured: boolean;
}

export function ProductImageGallery({
  images,
  isOnSale,
  isFeatured,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentImage = images[selectedIndex] || images[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative">
        {currentImage?.url ? (
          <Image
            src={currentImage.url}
            alt={currentImage.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            Product Image
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isOnSale && <Badge variant="error">Sale</Badge>}
          {isFeatured && <Badge variant="accent">Featured</Badge>}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={cn(
                "w-20 h-20 rounded-xl bg-slate-50 overflow-hidden border-2 transition-colors",
                index === selectedIndex
                  ? "border-orange-500"
                  : "border-slate-200 hover:border-orange-500"
              )}
            >
              {image.url ? (
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                  {index + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
