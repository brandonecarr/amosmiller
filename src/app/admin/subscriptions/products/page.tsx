"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Check, X } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getProducts, updateProductSubscriptionSettings } from "@/lib/actions/products";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  base_price: number;
  is_active: boolean;
  is_subscribable: boolean;
  subscription_frequencies: ("weekly" | "biweekly" | "monthly")[] | null;
  min_subscription_quantity: number | null;
  max_subscription_quantity: number | null;
  categories?: { name: string } | null;
}

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

export default function SubscriptionProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    is_subscribable: boolean;
    subscription_frequencies: ("weekly" | "biweekly" | "monthly")[];
    min_subscription_quantity: number;
    max_subscription_quantity: number;
  } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const result = await getProducts({ is_active: true });
    if (result.data) {
      setProducts(result.data as Product[]);
    }
    setLoading(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product.id);
    setEditForm({
      is_subscribable: product.is_subscribable,
      subscription_frequencies: product.subscription_frequencies || [],
      min_subscription_quantity: product.min_subscription_quantity || 1,
      max_subscription_quantity: product.max_subscription_quantity || 10,
    });
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setEditForm(null);
  };

  const handleSave = async (productId: string) => {
    if (!editForm) return;

    startTransition(async () => {
      await updateProductSubscriptionSettings(productId, editForm);
      setEditingProduct(null);
      setEditForm(null);
      await loadProducts();
    });
  };

  const handleToggleFrequency = (freq: "weekly" | "biweekly" | "monthly") => {
    if (!editForm) return;
    const current = editForm.subscription_frequencies;
    const newFrequencies = current.includes(freq)
      ? current.filter((f) => f !== freq)
      : [...current, freq];
    setEditForm({ ...editForm, subscription_frequencies: newFrequencies });
  };

  const subscribableCount = products.filter((p) => p.is_subscribable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/subscriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Subscription Products
          </h1>
          <p className="text-[var(--color-muted)]">
            Configure which products are available for subscriptions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <Card variant="default">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-charcoal)]">
                  {subscribableCount}
                </p>
                <p className="text-sm text-[var(--color-muted)]">Subscribable</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="default">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-slate-100)] flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-[var(--color-muted)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-charcoal)]">
                  {products.length - subscribableCount}
                </p>
                <p className="text-sm text-[var(--color-muted)]">Not Subscribable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card variant="default">
        <CardHeader className="border-b border-[var(--color-border)]">
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-[var(--color-muted)]">
              Loading products...
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                    Price
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-[var(--color-muted)]">
                    Subscribable
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                    Frequencies
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-muted)]">
                    Qty Range
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {products.map((product) => {
                  const isEditing = editingProduct === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-[var(--color-slate-50)]">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-[var(--color-charcoal)]">
                            {product.name}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {product.sku || "No SKU"} • {product.categories?.name || "Uncategorized"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(product.base_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editForm?.is_subscribable}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, is_subscribable: e.target.checked } : null
                              )
                            }
                            className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                          />
                        ) : product.is_subscribable ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <X className="w-3 h-3 mr-1" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing && editForm?.is_subscribable ? (
                          <div className="flex flex-wrap gap-1">
                            {(["weekly", "biweekly", "monthly"] as const).map((freq) => (
                              <button
                                key={freq}
                                type="button"
                                onClick={() => handleToggleFrequency(freq)}
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                  editForm.subscription_frequencies.includes(freq)
                                    ? "bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]"
                                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary-300)]"
                                }`}
                              >
                                {frequencyLabels[freq]}
                              </button>
                            ))}
                          </div>
                        ) : product.is_subscribable && product.subscription_frequencies?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {product.subscription_frequencies.map((freq) => (
                              <span
                                key={freq}
                                className="px-2 py-1 text-xs rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                              >
                                {frequencyLabels[freq]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--color-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isEditing && editForm?.is_subscribable ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={editForm.min_subscription_quantity}
                              onChange={(e) =>
                                setEditForm((prev) =>
                                  prev
                                    ? { ...prev, min_subscription_quantity: parseInt(e.target.value) || 1 }
                                    : null
                                )
                              }
                              className="w-14 px-2 py-1 text-sm border border-[var(--color-border)] rounded"
                            />
                            <span className="text-[var(--color-muted)]">-</span>
                            <input
                              type="number"
                              min="1"
                              value={editForm.max_subscription_quantity}
                              onChange={(e) =>
                                setEditForm((prev) =>
                                  prev
                                    ? { ...prev, max_subscription_quantity: parseInt(e.target.value) || 10 }
                                    : null
                                )
                              }
                              className="w-14 px-2 py-1 text-sm border border-[var(--color-border)] rounded"
                            />
                          </div>
                        ) : product.is_subscribable ? (
                          <span>
                            {product.min_subscription_quantity || 1} - {product.max_subscription_quantity || 10}
                          </span>
                        ) : (
                          <span className="text-[var(--color-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancel}
                              disabled={isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave(product.id)}
                              isLoading={isPending}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
