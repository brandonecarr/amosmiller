import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantsManager } from "@/components/admin/VariantsManager";
import { BundleManager } from "@/components/admin/BundleManager";
import { getProduct } from "@/lib/actions/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await getProduct(id) as any;

  if (result.error || !result.data) {
    return notFound();
  }

  const product = result.data;

  // Transform product data to match form expectations
  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku || "",
    description: product.description || "",
    short_description: product.short_description || "",
    category_id: product.category_id || "",
    pricing_type: product.pricing_type as "fixed" | "weight",
    base_price: product.base_price?.toString() || "",
    sale_price: product.sale_price?.toString() || "",
    weight_unit: (product.weight_unit as "lb" | "oz" | "kg" | "g") || "lb",
    estimated_weight: product.estimated_weight?.toString() || "",
    min_weight: product.min_weight?.toString() || "",
    max_weight: product.max_weight?.toString() || "",
    track_inventory: product.track_inventory ?? true,
    stock_quantity: product.stock_quantity?.toString() || "0",
    low_stock_threshold: product.low_stock_threshold?.toString() || "5",
    shelf_location: product.shelf_location || "",
    is_active: product.is_active ?? true,
    is_featured: product.is_featured ?? false,
    is_taxable: product.is_taxable ?? true,
    tags: product.tags || [],
    images: product.images || [],
    featured_image_url: product.featured_image_url || "",
    // Subscription fields
    is_subscribable: product.is_subscribable ?? false,
    subscription_frequencies: product.subscription_frequencies || [],
    min_subscription_quantity: product.min_subscription_quantity?.toString() || "1",
    max_subscription_quantity: product.max_subscription_quantity?.toString() || "10",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
          Edit Product
        </h1>
        <p className="text-[var(--color-muted)]">
          Update product information
        </p>
      </div>

      <ProductForm initialData={initialData} isEditing />

      {/* Variants & Bundle Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VariantsManager
          productId={product.id}
          basePrice={product.base_price || 0}
        />
        <BundleManager
          productId={product.id}
          productName={product.name}
        />
      </div>
    </div>
  );
}
