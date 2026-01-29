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

  // Calculate price range for weight-based products
  const getPriceDisplay = () => {
    if (product.pricing_type === "weight") {
      const unit = product.weight_unit || "lb";
      if (product.min_weight && product.max_weight) {
        const minPrice = displayPrice * product.min_weight;
        const maxPrice = displayPrice * product.max_weight;
        return (
          <span>
            {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
            <span className="text-[var(--color-muted)] text-sm font-normal">
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
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Image */}
      <Link href={`/shop/${product.slug}`} className="block relative aspect-square">
        <div className="absolute inset-0 bg-[var(--color-cream-100)] flex items-center justify-center">
          {product.featured_image_url ? (
            <Image
              src={product.featured_image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-[var(--color-muted)] text-sm">No image</span>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.category && (
            <Badge variant="default" className="bg-[var(--color-primary-500)] text-white">
              {product.category}
            </Badge>
          )}
          {isOnSale && (
            <Badge variant="error">Sale</Badge>
          )}
          {product.is_featured && (
            <Badge variant="info">Featured</Badge>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <Badge variant="outline" className="text-base px-4 py-2">
              Out of Stock
            </Badge>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-medium text-[var(--color-charcoal)] mb-1 group-hover:text-[var(--color-primary-500)] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mb-3">
          <p className="text-[var(--color-primary-500)] font-semibold">
            {getPriceDisplay()}
          </p>
          {isOnSale && (
            <p className="text-[var(--color-muted)] text-sm line-through">
              {product.pricing_type === "weight"
                ? formatWeightPrice(product.base_price, product.weight_unit || "lb")
                : formatCurrency(product.base_price)}
            </p>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          variant="secondary"
          className="w-full"
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
