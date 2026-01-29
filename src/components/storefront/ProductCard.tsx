"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { formatCurrency, formatWeightPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    pricing_type: "fixed" | "weight";
    base_price: number;
    sale_price?: number | null;
    weight_unit?: "lb" | "oz" | "kg" | "g";
    estimated_weight?: number | null;
    min_weight?: number | null;
    max_weight?: number | null;
    stock_quantity: number;
    is_featured?: boolean;
    featured_image_url?: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const isOutOfStock = product.stock_quantity === 0;
  const isOnSale = product.sale_price && product.sale_price < product.base_price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      pricingType: product.pricing_type,
      basePrice: product.base_price,
      salePrice: product.sale_price ?? null,
      weightUnit: product.weight_unit || "lb",
      estimatedWeight: product.estimated_weight ?? null,
      quantity: 1,
      imageUrl: product.featured_image_url ?? null,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const displayPrice = isOnSale ? product.sale_price! : product.base_price;

  const getPriceDisplay = () => {
    if (product.pricing_type === "weight") {
      const unit = product.weight_unit || "lb";
      if (product.min_weight && product.max_weight) {
        const minPrice = displayPrice * product.min_weight;
        const maxPrice = displayPrice * product.max_weight;
        return (
          <span>
            {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
            <span className="text-slate-400 text-sm font-normal">
              {" "}
              (~{product.estimated_weight || product.min_weight} {unit})
            </span>
          </span>
        );
      }
      return formatWeightPrice(displayPrice, unit);
    }
    return formatCurrency(displayPrice);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
      {/* Image */}
      <Link href={`/shop/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
          {product.featured_image_url ? (
            <Image
              src={product.featured_image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-slate-300 text-sm">No image</span>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.category && (
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium rounded-full">
              {product.category}
            </span>
          )}
          {isOnSale && (
            <Badge variant="error" size="sm">Sale</Badge>
          )}
          {product.is_featured && (
            <Badge variant="accent" size="sm">Featured</Badge>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <span className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-medium text-slate-900 text-sm mb-1.5 group-hover:text-orange-500 transition-colors line-clamp-2 font-heading">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mb-3">
          <p className="text-slate-900 font-semibold">
            {getPriceDisplay()}
          </p>
          {isOnSale && (
            <p className="text-slate-400 text-sm line-through">
              {product.pricing_type === "weight"
                ? formatWeightPrice(product.base_price, product.weight_unit || "lb")
                : formatCurrency(product.base_price)}
            </p>
          )}
        </div>
      </div>

      {/* Add to Cart */}
      <div className="px-4 pb-4 pt-0 border-t border-slate-50 bg-slate-50/50">
        <Button
          variant="secondary"
          className="w-full mt-3"
          size="sm"
          disabled={isOutOfStock || justAdded}
          onClick={handleAddToCart}
          aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
