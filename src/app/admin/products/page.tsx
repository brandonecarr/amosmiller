"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Package,
  Loader2,
} from "lucide-react";
import { Button, Card, CardContent, Input, Badge } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { getProducts, deleteProduct, toggleProductActive } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category_id: string | null;
  pricing_type: "fixed" | "weight";
  base_price: number;
  sale_price: number | null;
  weight_unit: "lb" | "oz" | "kg" | "g" | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  featured_image_url: string | null;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [productsResult, categoriesResult] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    if (productsResult.data) {
      setProducts(productsResult.data as Product[]);
    }
    if (productsResult.error) {
      setError(productsResult.error);
    }

    if (categoriesResult.data) {
      setCategories(categoriesResult.data);
    }

    setIsLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory =
      selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && product.is_active) ||
      (selectedStatus === "inactive" && !product.is_active) ||
      (selectedStatus === "out-of-stock" && product.stock_quantity === 0);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      loadData();
    });
    setOpenMenu(null);
  };

  const handleToggleActive = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    startTransition(async () => {
      const result = await toggleProductActive(id, !product.is_active);
      if (result.error) {
        setError(result.error);
        return;
      }
      loadData();
    });
    setOpenMenu(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Products
          </h1>
          <p className="text-[var(--color-muted)]">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card variant="default">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card variant="default">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-slate-50)]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-muted)]">
                    Product
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-muted)]">
                    SKU
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-muted)]">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-muted)]">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-muted)]">
                    Stock
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-muted)]">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-[var(--color-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-[var(--color-slate-50)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[var(--color-cream-100)] rounded-lg flex items-center justify-center overflow-hidden">
                          {product.featured_image_url ? (
                            <Image
                              src={product.featured_image_url}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="object-cover rounded"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-[var(--color-muted)]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-charcoal)]">
                            {product.name}
                          </p>
                          {product.is_featured && (
                            <Badge variant="info" size="sm">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted)]">
                      {product.sku || "-"}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-muted)]">
                      {product.categories?.name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[var(--color-charcoal)]">
                        {formatCurrency(product.base_price)}
                      </span>
                      {product.pricing_type === "weight" && (
                        <span className="text-[var(--color-muted)]">
                          /{product.weight_unit || "lb"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "font-medium",
                          product.stock_quantity === 0
                            ? "text-[var(--color-error)]"
                            : product.stock_quantity < 10
                            ? "text-[var(--color-warning)]"
                            : "text-[var(--color-charcoal)]"
                        )}
                      >
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={product.is_active ? "success" : "outline"}
                        size="sm"
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        <Link href={`/shop/${product.slug}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === product.id ? null : product.id
                              )
                            }
                            disabled={isPending}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          {openMenu === product.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[var(--color-border)] py-1 z-20">
                                <button
                                  onClick={() => handleToggleActive(product.id)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-slate-50)]"
                                >
                                  {product.is_active
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Package className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
                <p className="text-[var(--color-muted)]">
                  No products found. Try adjusting your filters.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
