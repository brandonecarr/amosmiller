import { Suspense } from "react";
import type { Metadata } from "next";
import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { ShopContent } from "./ShopContent";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse our selection of farm-fresh meats, dairy, produce, and pantry items. All sustainably raised and locally delivered.",
};

async function ShopData() {
  const [productsResult, categoriesResult] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  const products = (productsResult.data || []).filter((p: { is_active: boolean }) => p.is_active);
  const categories = categoriesResult.data || [];

  // Transform products to match ProductCard expectations
  const transformedProducts = products.map((product: {
    id: string;
    name: string;
    slug: string;
    category_id: string | null;
    pricing_type: string;
    base_price: number;
    sale_price: number | null;
    weight_unit: string | null;
    estimated_weight: number | null;
    min_weight: number | null;
    max_weight: number | null;
    stock_quantity: number;
    is_featured: boolean;
    featured_image_url: string | null;
    categories?: { name: string };
  }) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.categories?.name || "",
    category_id: product.category_id,
    pricing_type: product.pricing_type as "fixed" | "weight",
    base_price: product.base_price || 0,
    sale_price: product.sale_price,
    weight_unit: (product.weight_unit as "lb" | "oz" | "kg" | "g") || "lb",
    estimated_weight: product.estimated_weight,
    min_weight: product.min_weight,
    max_weight: product.max_weight,
    stock_quantity: product.stock_quantity || 0,
    is_featured: product.is_featured || false,
    featured_image_url: product.featured_image_url,
  }));

  return (
    <ShopContent
      initialProducts={transformedProducts}
      categories={categories}
    />
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
          </div>
        </div>
      }
    >
      <ShopData />
    </Suspense>
  );
}
