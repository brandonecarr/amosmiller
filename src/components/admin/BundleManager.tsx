"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Trash2, Loader2, Package, Search, Minus } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from "@/components/ui";
import {
  getBundle,
  createBundle,
  updateBundleItems,
  deleteBundle,
} from "@/lib/actions/bundles";
import { getProducts } from "@/lib/actions/products";
import { formatCurrency } from "@/lib/utils";

interface BundleItem {
  id?: string;
  product_id: string;
  productId?: string;
  quantity: number;
  sort_order?: number;
  products?: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    pricing_type: string;
    featured_image_url: string | null;
  };
}

interface Bundle {
  id: string;
  product_id: string;
  items: BundleItem[];
  product?: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price: number | null;
    images: string[];
    is_active: boolean;
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  pricing_type: string;
  featured_image_url: string | null;
}

interface BundleManagerProps {
  productId: string;
  productName: string;
}

export function BundleManager({ productId, productName }: BundleManagerProps) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ product_id: string; quantity: number }[]>([]);
  const [bundlePrice, setBundlePrice] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setIsLoading(true);
    const [bundleResult, productsResult] = await Promise.all([
      getBundle(productId),
      getProducts(),
    ]);

    if (bundleResult.data) {
      setBundle(bundleResult.data);
      // Initialize selected items from existing bundle
      setSelectedItems(
        bundleResult.data.items.map((item: BundleItem) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }))
      );
      // Initialize bundle price from product's base_price
      if (bundleResult.data.product?.base_price) {
        setBundlePrice(bundleResult.data.product.base_price.toString());
      }
    }

    if (productsResult.data) {
      // Filter out the current product from the list
      setAllProducts(
        productsResult.data.filter((p: Product) => p.id !== productId)
      );
    }

    if (bundleResult.error) {
      setError(bundleResult.error);
    }

    setIsLoading(false);
  };

  const handleCreateBundle = async () => {
    if (selectedItems.length === 0) {
      setError("Please add at least one product to the bundle");
      return;
    }

    const price = bundlePrice ? parseFloat(bundlePrice) : undefined;
    if (bundlePrice && (isNaN(price!) || price! < 0)) {
      setError("Please enter a valid bundle price");
      return;
    }

    startTransition(async () => {
      const result = await createBundle(productId, selectedItems, price);
      if (result.error) {
        setError(result.error);
        return;
      }
      loadData();
      setIsModalOpen(false);
    });
  };

  const handleUpdateBundle = async () => {
    if (!bundle) return;

    const price = bundlePrice ? parseFloat(bundlePrice) : undefined;
    if (bundlePrice && (isNaN(price!) || price! < 0)) {
      setError("Please enter a valid bundle price");
      return;
    }

    startTransition(async () => {
      const result = await updateBundleItems(bundle.id, productId, selectedItems, price);
      if (result.error) {
        setError(result.error);
        return;
      }
      loadData();
      setIsModalOpen(false);
    });
  };

  const handleDeleteBundle = async () => {
    if (!bundle) return;
    if (!confirm("Are you sure you want to remove the bundle configuration?")) return;

    startTransition(async () => {
      const result = await deleteBundle(bundle.id, productId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBundle(null);
      setSelectedItems([]);
    });
  };

  const handleAddProduct = (product: Product) => {
    if (selectedItems.some((item) => item.product_id === product.id)) {
      return;
    }
    setSelectedItems([...selectedItems, { product_id: product.id, quantity: 1 }]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.product_id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(
      selectedItems.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getSelectedProduct = (productId: string) => {
    return allProducts.find((p) => p.id === productId);
  };

  const filteredProducts = allProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedItems.some((item) => item.product_id === product.id)
  );

  const calculateBundleTotal = () => {
    return selectedItems.reduce((total, item) => {
      const product = getSelectedProduct(item.product_id);
      return total + (product?.base_price || 0) * item.quantity;
    }, 0);
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
              Bundle Configuration
            </CardTitle>
            {bundle ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedItems(
                      bundle.items.map((item) => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                      }))
                    );
                    // Initialize bundle price from product's base_price
                    if (bundle.product?.base_price) {
                      setBundlePrice(bundle.product.base_price.toString());
                    }
                    setIsModalOpen(true);
                  }}
                >
                  Edit Bundle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteBundle}
                  disabled={isPending}
                  className="text-[var(--color-error)] border-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedItems([]);
                  setBundlePrice("");
                  setIsModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Configure as Bundle
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="bg-[var(--color-error-light)] border-b border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {bundle && bundle.items.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {bundle.items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--color-cream-100)] rounded-lg flex items-center justify-center overflow-hidden">
                      {item.products?.featured_image_url ? (
                        <img
                          src={item.products.featured_image_url}
                          alt={item.products.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-[var(--color-muted)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-charcoal)]">
                        {item.products?.name}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {formatCurrency(item.products?.base_price || 0)}
                        {item.products?.pricing_type === "weight" && "/lb"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">x{item.quantity}</Badge>
                </div>
              ))}
              <div className="px-6 py-4 bg-[var(--color-slate-50)] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-muted)]">Retail Total:</span>
                  <span className="font-medium text-[var(--color-charcoal)]">
                    {formatCurrency(
                      bundle.items.reduce(
                        (total, item) =>
                          total + (item.products?.base_price || 0) * item.quantity,
                        0
                      )
                    )}
                  </span>
                </div>
                {bundle.product?.base_price && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--color-muted)]">Bundle Price:</span>
                      <span className="font-bold text-[var(--color-primary-700)]">
                        {formatCurrency(bundle.product.base_price)}
                      </span>
                    </div>
                    {bundle.product.base_price < bundle.items.reduce(
                      (total, item) =>
                        total + (item.products?.base_price || 0) * item.quantity,
                      0
                    ) && (
                      <div className="flex justify-between items-center text-sm text-green-700">
                        <span className="font-medium">Customer Saves:</span>
                        <span className="font-bold">
                          {formatCurrency(
                            bundle.items.reduce(
                              (total, item) =>
                                total + (item.products?.base_price || 0) * item.quantity,
                              0
                            ) - bundle.product.base_price
                          )}
                          {" "}
                          ({Math.round(
                            ((bundle.items.reduce(
                              (total, item) =>
                                total + (item.products?.base_price || 0) * item.quantity,
                              0
                            ) - bundle.product.base_price) /
                            bundle.items.reduce(
                              (total, item) =>
                                total + (item.products?.base_price || 0) * item.quantity,
                              0
                            )) * 100
                          )}% off)
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Package className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
              <p className="text-[var(--color-muted)]">
                This product is not configured as a bundle. Configure it as a bundle
                to include multiple products at a discounted price.
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
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h2 className="text-xl font-bold text-[var(--color-charcoal)]">
                {bundle ? "Edit Bundle" : "Configure Bundle"}
              </h2>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                Select products to include in the &quot;{productName}&quot; bundle
              </p>
            </div>

            {error && (
              <div className="bg-[var(--color-error-light)] border-b border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Selected Items */}
              {selectedItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-[var(--color-charcoal)] mb-3">
                    Bundle Items ({selectedItems.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedItems.map((item) => {
                      const product = getSelectedProduct(item.product_id);
                      return (
                        <div
                          key={item.product_id}
                          className="flex items-center justify-between p-3 bg-[var(--color-slate-50)] rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center overflow-hidden">
                              {product?.featured_image_url ? (
                                <img
                                  src={product.featured_image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-[var(--color-muted)]" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-[var(--color-charcoal)]">
                                {product?.name}
                              </p>
                              <p className="text-xs text-[var(--color-muted)]">
                                {formatCurrency(product?.base_price || 0)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(item.product_id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(item.product_id, item.quantity + 1)
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(item.product_id)}
                              className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-light)] ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center p-3 bg-[var(--color-primary-50)] rounded-lg">
                      <span className="font-medium text-[var(--color-primary-700)]">
                        Retail Total:
                      </span>
                      <span className="font-bold text-[var(--color-primary-700)]">
                        {formatCurrency(calculateBundleTotal())}
                      </span>
                    </div>

                    {/* Custom Bundle Price */}
                    <div className="space-y-2 mt-3">
                      <label className="text-sm font-medium text-[var(--color-charcoal)]">
                        Bundle Price (optional)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter custom bundle price"
                        value={bundlePrice}
                        onChange={(e) => setBundlePrice(e.target.value)}
                      />
                      <p className="text-xs text-[var(--color-muted)]">
                        Leave empty to use the retail total. Set a lower price to offer a bundle discount.
                      </p>
                      {bundlePrice && parseFloat(bundlePrice) > 0 && (
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded text-sm">
                          <span className="text-green-700 font-medium">
                            Customer Saves:
                          </span>
                          <span className="text-green-700 font-bold">
                            {formatCurrency(Math.max(0, calculateBundleTotal() - parseFloat(bundlePrice)))}
                            {" "}
                            ({Math.round(Math.max(0, (calculateBundleTotal() - parseFloat(bundlePrice)) / calculateBundleTotal() * 100))}% off)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Search */}
              <div>
                <h3 className="text-sm font-medium text-[var(--color-charcoal)] mb-3">
                  Add Products
                </h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-slate-50)] cursor-pointer"
                        onClick={() => handleAddProduct(product)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--color-cream-100)] rounded flex items-center justify-center overflow-hidden">
                            {product.featured_image_url ? (
                              <img
                                src={product.featured_image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-[var(--color-muted)]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[var(--color-charcoal)]">
                              {product.name}
                            </p>
                            <p className="text-xs text-[var(--color-muted)]">
                              {formatCurrency(product.base_price)}
                              {product.pricing_type === "weight" && "/lb"}
                            </p>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-[var(--color-primary-500)]" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--color-muted)] text-center py-4">
                      {searchQuery
                        ? "No products match your search"
                        : "All products have been added"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[var(--color-border)] flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={bundle ? handleUpdateBundle : handleCreateBundle}
                isLoading={isPending}
                disabled={selectedItems.length === 0}
              >
                {bundle ? "Save Changes" : "Create Bundle"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
