import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
          New Product
        </h1>
        <p className="text-[var(--color-muted)]">
          Add a new product to your catalog
        </p>
      </div>

      <ProductForm />
    </div>
  );
}
