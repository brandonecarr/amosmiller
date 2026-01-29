import { getProducts } from "@/lib/actions/products";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { ProductsBlock as ProductsBlockType } from "@/types/cms";

interface ProductsBlockProps {
  block: ProductsBlockType;
}

export async function ProductsBlock({ block }: ProductsBlockProps) {
  const { mode, categoryId, limit, title } = block.data;

  const filters: {
    is_active: boolean;
    is_featured?: boolean;
    category_id?: string;
    limit?: number;
  } = {
    is_active: true,
  };

  if (mode === "featured") {
    filters.is_featured = true;
  } else if (mode === "category" && categoryId) {
    filters.category_id = categoryId;
  }

  if (limit) {
    filters.limit = limit;
  }

  const { data: products, error } = await getProducts(filters);

  if (error || !products || products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)] mb-6 text-center">
            {title}
          </h2>
        )}
        <p className="text-center text-[var(--color-muted)] py-8">
          No products available at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)] mb-8 text-center">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {products.map((product: any) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              category: product.categories?.name,
              pricing_type: product.pricing_type,
              base_price: product.base_price,
              sale_price: product.sale_price,
              weight_unit: product.weight_unit ?? undefined,
              estimated_weight: product.estimated_weight,
              min_weight: product.min_weight,
              max_weight: product.max_weight,
              stock_quantity: product.stock_quantity ?? 0,
              is_featured: product.is_featured,
              featured_image_url: product.featured_image_url,
            }}
          />
        ))}
      </div>
    </div>
  );
}
