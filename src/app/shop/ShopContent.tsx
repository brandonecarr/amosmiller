"use client";

import { useState, useMemo } from "react";
import { Filter, X, Grid3X3, LayoutList } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui";
import { ProductCard } from "@/components/storefront/ProductCard";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  category_id: string | null;
  pricing_type: "fixed" | "weight";
  base_price: number;
  sale_price: number | null;
  weight_unit: "lb" | "oz" | "kg" | "g";
  estimated_weight: number | null;
  min_weight: number | null;
  max_weight: number | null;
  stock_quantity: number;
  is_featured: boolean;
  featured_image_url: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface ShopContentProps {
  initialProducts: Product[];
  categories: Category[];
}

const sortOptions = [
  { id: "featured", name: "Featured" },
  { id: "name-asc", name: "Name: A to Z" },
  { id: "name-desc", name: "Name: Z to A" },
  { id: "price-asc", name: "Price: Low to High" },
  { id: "price-desc", name: "Price: High to Low" },
];

export function ShopContent({ initialProducts, categories }: ShopContentProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showInStock, setShowInStock] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);

  // Build category list with counts
  const categoryOptions = useMemo(() => {
    const activeCategories = categories.filter((c) => c.is_active);
    const options = [
      { id: "all", name: "All Products", count: initialProducts.length },
      ...activeCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: initialProducts.filter((p) => p.category_id === cat.id).length,
      })),
    ];
    return options.filter((opt) => opt.count > 0 || opt.id === "all");
  }, [categories, initialProducts]);

  const filteredProducts = useMemo(() => {
    let products = [...initialProducts];

    // Filter by category
    if (selectedCategory !== "all") {
      products = products.filter((p) => p.category_id === selectedCategory);
    }

    // Filter by price
    if (priceRange.min) {
      products = products.filter((p) => p.base_price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      products = products.filter((p) => p.base_price <= Number(priceRange.max));
    }

    // Filter by stock
    if (showInStock) {
      products = products.filter((p) => p.stock_quantity > 0);
    }

    // Filter by sale
    if (showOnSale) {
      products = products.filter((p) => p.sale_price !== null);
    }

    // Sort
    switch (sortBy) {
      case "name-asc":
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        products.sort((a, b) => a.base_price - b.base_price);
        break;
      case "price-desc":
        products.sort((a, b) => b.base_price - a.base_price);
        break;
      case "featured":
      default:
        products.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
    }

    return products;
  }, [initialProducts, selectedCategory, sortBy, priceRange, showInStock, showOnSale]);

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (priceRange.min ? 1 : 0) +
    (priceRange.max ? 1 : 0) +
    (showInStock ? 1 : 0) +
    (showOnSale ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategory("all");
    setPriceRange({ min: "", max: "" });
    setShowInStock(false);
    setShowOnSale(false);
  };

  const getSelectedCategoryName = () => {
    return categoryOptions.find((c) => c.id === selectedCategory)?.name || "";
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-charcoal)] mb-2">
          Shop All Products
        </h1>
        <p className="text-[var(--color-muted)]">
          Browse our selection of farm-fresh products
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-semibold text-[var(--color-charcoal)] mb-3">
                Categories
              </h3>
              <div className="space-y-1">
                {categoryOptions.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === category.id
                        ? "bg-[var(--color-primary-100)] text-[var(--color-primary-600)] font-medium"
                        : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-slate-100)]"
                    )}
                  >
                    <span>{category.name}</span>
                    <span className="text-[var(--color-muted)]">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-semibold text-[var(--color-charcoal)] mb-3">
                Price Range
              </h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Other Filters */}
            <div>
              <h3 className="font-semibold text-[var(--color-charcoal)] mb-3">
                Availability
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInStock}
                    onChange={(e) => setShowInStock(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                  />
                  <span className="text-sm">In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnSale}
                    onChange={(e) => setShowOnSale(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                  />
                  <span className="text-sm">On Sale</span>
                </label>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <Button variant="outline" className="w-full" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setShowFilters(true)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="default" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {/* Results Count */}
              <p className="text-sm text-[var(--color-muted)]">
                {filteredProducts.length} products
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="hidden sm:flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "grid"
                      ? "bg-[var(--color-primary-500)] text-white"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "list"
                      ? "bg-[var(--color-primary-500)] text-white"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-slate-100)]"
                  )}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters (Mobile) */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 lg:hidden">
              {selectedCategory !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {getSelectedCategoryName()}
                  <button onClick={() => setSelectedCategory("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {showInStock && (
                <Badge variant="outline" className="flex items-center gap-1">
                  In Stock
                  <button onClick={() => setShowInStock(false)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {showOnSale && (
                <Badge variant="outline" className="flex items-center gap-1">
                  On Sale
                  <button onClick={() => setShowOnSale(false)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div
              className={cn(
                "grid gap-6",
                viewMode === "grid"
                  ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              )}
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-[var(--color-muted)] mb-4">
                No products found matching your criteria.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto animate-slide-down">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Same filter content as sidebar */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[var(--color-charcoal)] mb-3">
                  Categories
                </h3>
                <div className="space-y-1">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedCategory === category.id
                          ? "bg-[var(--color-primary-100)] text-[var(--color-primary-600)] font-medium"
                          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-slate-100)]"
                      )}
                    >
                      <span>{category.name}</span>
                      <span className="text-[var(--color-muted)]">
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--color-charcoal)] mb-3">
                  Price Range
                </h3>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--color-charcoal)] mb-3">
                  Availability
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInStock}
                      onChange={(e) => setShowInStock(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                    />
                    <span className="text-sm">In Stock Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnSale}
                      onChange={(e) => setShowOnSale(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                    />
                    <span className="text-sm">On Sale</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button className="flex-1" onClick={() => setShowFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
