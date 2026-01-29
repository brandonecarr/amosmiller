"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Pencil, Trash2, GripVertical, Loader2, Package } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from "@/components/ui";
import {
  getProductVariants,
  createVariant,
  updateVariant,
  deleteVariant,
} from "@/lib/actions/variants";
import { formatCurrency } from "@/lib/utils";

interface Variant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_modifier: number;
  weight_modifier: number;
  stock_quantity: number;
  sort_order: number;
  is_active: boolean;
}

interface VariantsManagerProps {
  productId: string;
  basePrice: number;
}

export function VariantsManager({ productId, basePrice }: VariantsManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price_modifier: "",
    weight_modifier: "",
    stock_quantity: "",
    is_active: true,
  });

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    setIsLoading(true);
    const result = await getProductVariants(productId);
    if (result.data) {
      setVariants(result.data);
    }
    if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (variant?: Variant) => {
    if (variant) {
      setEditingVariant(variant);
      setFormData({
        name: variant.name,
        sku: variant.sku || "",
        price_modifier: variant.price_modifier.toString(),
        weight_modifier: variant.weight_modifier.toString(),
        stock_quantity: variant.stock_quantity.toString(),
        is_active: variant.is_active,
      });
    } else {
      setEditingVariant(null);
      setFormData({
        name: "",
        sku: "",
        price_modifier: "0",
        weight_modifier: "0",
        stock_quantity: "0",
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVariant(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const data = {
        product_id: productId,
        name: formData.name,
        sku: formData.sku || null,
        price_modifier: parseFloat(formData.price_modifier) || 0,
        weight_modifier: parseFloat(formData.weight_modifier) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        is_active: formData.is_active,
        sort_order: editingVariant?.sort_order ?? variants.length,
      };

      let result;
      if (editingVariant) {
        result = await updateVariant(editingVariant.id, data);
      } else {
        result = await createVariant(data);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      handleCloseModal();
      loadVariants();
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;

    startTransition(async () => {
      const result = await deleteVariant(id, productId);
      if (result.error) {
        setError(result.error);
        return;
      }
      loadVariants();
    });
  };

  if (isLoading) {
    return (
      <Card variant="default">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary-500)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card variant="default">
        <CardHeader className="border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Variants
            </CardTitle>
            <Button size="sm" onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-1" />
              Add Variant
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="bg-[var(--color-error-light)] border-b border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {variants.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-slate-50)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-[var(--color-muted)] cursor-grab" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--color-charcoal)]">
                          {variant.name}
                        </p>
                        {!variant.is_active && (
                          <Badge variant="outline" size="sm">Inactive</Badge>
                        )}
                      </div>
                      <div className="text-sm text-[var(--color-muted)] flex items-center gap-3">
                        {variant.sku && <span>SKU: {variant.sku}</span>}
                        <span>
                          Price: {formatCurrency(basePrice + variant.price_modifier)}
                          {variant.price_modifier !== 0 && (
                            <span className={variant.price_modifier > 0 ? "text-green-600" : "text-red-600"}>
                              {" "}({variant.price_modifier > 0 ? "+" : ""}{formatCurrency(variant.price_modifier)})
                            </span>
                          )}
                        </span>
                        <span>Stock: {variant.stock_quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(variant)}
                      disabled={isPending}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(variant.id)}
                      disabled={isPending}
                      className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Package className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
              <p className="text-[var(--color-muted)]">
                No variants yet. Add variants for different sizes, weights, or options.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-[var(--color-charcoal)] mb-6">
              {editingVariant ? "Edit Variant" : "New Variant"}
            </h2>

            {error && (
              <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Variant Name"
                placeholder="e.g., 1 lb, Large, Bone-In"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="SKU (optional)"
                placeholder="e.g., BF-001-1LB"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price Modifier"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price_modifier}
                  onChange={(e) => setFormData({ ...formData, price_modifier: e.target.value })}
                  helperText="+ or - from base price"
                />
                <Input
                  label="Weight Modifier"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.weight_modifier}
                  onChange={(e) => setFormData({ ...formData, weight_modifier: e.target.value })}
                  helperText="+ or - from base weight"
                />
              </div>

              <Input
                label="Stock Quantity"
                type="number"
                min="0"
                placeholder="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                />
                <span className="font-medium">Active</span>
              </label>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCloseModal}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" isLoading={isPending}>
                  {editingVariant ? "Save Changes" : "Create Variant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
