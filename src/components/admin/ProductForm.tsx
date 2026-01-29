"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, Loader2 } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from "@/components/ui";
import { slugify } from "@/lib/utils";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { uploadProductImage, deleteProductImage } from "@/lib/actions/storage";

interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description: string;
  category_id: string;
  pricing_type: "fixed" | "weight";
  base_price: string;
  sale_price: string;
  weight_unit: "lb" | "oz" | "kg" | "g";
  estimated_weight: string;
  min_weight: string;
  max_weight: string;
  track_inventory: boolean;
  stock_quantity: string;
  low_stock_threshold: string;
  shelf_location: string;
  is_active: boolean;
  is_featured: boolean;
  is_taxable: boolean;
  tags: string[];
  images: string[];
  featured_image_url: string;
  // Subscription fields
  is_subscribable: boolean;
  subscription_frequencies: ("weekly" | "biweekly" | "monthly")[];
  min_subscription_quantity: string;
  max_subscription_quantity: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & { id?: string };
  isEditing?: boolean;
}

interface Category {
  id: string;
  name: string;
}

const defaultFormData: ProductFormData = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  short_description: "",
  category_id: "",
  pricing_type: "fixed",
  base_price: "",
  sale_price: "",
  weight_unit: "lb",
  estimated_weight: "",
  min_weight: "",
  max_weight: "",
  track_inventory: true,
  stock_quantity: "",
  low_stock_threshold: "5",
  shelf_location: "",
  is_active: true,
  is_featured: false,
  is_taxable: true,
  tags: [],
  images: [],
  featured_image_url: "",
  // Subscription defaults
  is_subscribable: false,
  subscription_frequencies: [],
  min_subscription_quantity: "1",
  max_subscription_quantity: "10",
};

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const result = await getCategories();
    if (result.data) {
      setCategories(result.data);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "name" && !isEditing
        ? { slug: slugify(value) }
        : {}),
    }));
  };

  const handleFrequencyToggle = (frequency: "weekly" | "biweekly" | "monthly") => {
    setFormData((prev) => {
      const current = prev.subscription_frequencies;
      const newFrequencies = current.includes(frequency)
        ? current.filter((f) => f !== frequency)
        : [...current, frequency];
      return {
        ...prev,
        subscription_frequencies: newFrequencies,
      };
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const productId = initialData?.id || "temp-" + Date.now();

    for (const file of Array.from(files)) {
      const result = await uploadProductImage(file, productId);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, result.url!],
          featured_image_url: prev.featured_image_url || result.url!,
        }));
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    const result = await deleteProductImage(imageUrl);
    if (result.error) {
      setError(result.error);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((url) => url !== imageUrl),
      featured_image_url:
        prev.featured_image_url === imageUrl
          ? prev.images.filter((url) => url !== imageUrl)[0] || ""
          : prev.featured_image_url,
    }));
  };

  const handleSetFeaturedImage = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      featured_image_url: imageUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const productData = {
        name: formData.name,
        slug: formData.slug || slugify(formData.name),
        sku: formData.sku || "",
        description: formData.description || "",
        short_description: formData.short_description || "",
        category_id: formData.category_id || "",
        pricing_type: formData.pricing_type,
        base_price: formData.base_price || "0",
        sale_price: formData.sale_price || "",
        weight_unit: formData.weight_unit,
        estimated_weight: formData.estimated_weight || "",
        min_weight: formData.min_weight || "",
        max_weight: formData.max_weight || "",
        track_inventory: formData.track_inventory,
        stock_quantity: formData.stock_quantity || "0",
        low_stock_threshold: formData.low_stock_threshold || "5",
        shelf_location: formData.shelf_location || "",
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_taxable: formData.is_taxable,
        tags: formData.tags || [],
        images: (formData.images || []).map((url) => ({ url, alt: formData.name })),
        // Subscription fields
        is_subscribable: formData.is_subscribable,
        subscription_frequencies: formData.subscription_frequencies,
        min_subscription_quantity: formData.min_subscription_quantity || "1",
        max_subscription_quantity: formData.max_subscription_quantity || "10",
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await updateProduct(initialData.id, productData);
      } else {
        result = await createProduct(productData);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/admin/products");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Grass-Fed Ground Beef"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="grass-fed-ground-beef"
                  helperText="URL-friendly identifier"
                />
                <Input
                  label="SKU"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="BF-001"
                  helperText="Stock keeping unit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Short Description
                </label>
                <textarea
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  placeholder="Brief description for product cards"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Full Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  placeholder="Detailed product description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Pricing Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pricing_type"
                      value="fixed"
                      checked={formData.pricing_type === "fixed"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[var(--color-primary-500)]"
                    />
                    <span>Fixed Price</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pricing_type"
                      value="weight"
                      checked={formData.pricing_type === "weight"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[var(--color-primary-500)]"
                    />
                    <span>Price by Weight</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={formData.pricing_type === "weight" ? "Price per Unit" : "Base Price"}
                  name="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
                <Input
                  label="Sale Price"
                  name="sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  helperText="Leave empty if not on sale"
                />
              </div>

              {formData.pricing_type === "weight" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                        Weight Unit
                      </label>
                      <select
                        name="weight_unit"
                        value={formData.weight_unit}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      >
                        <option value="lb">Pounds (lb)</option>
                        <option value="oz">Ounces (oz)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="g">Grams (g)</option>
                      </select>
                    </div>
                    <Input
                      label="Estimated Weight"
                      name="estimated_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.estimated_weight}
                      onChange={handleChange}
                      placeholder="1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Min Weight"
                      name="min_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.min_weight}
                      onChange={handleChange}
                      placeholder="1.0"
                    />
                    <Input
                      label="Max Weight"
                      name="max_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.max_weight}
                      onChange={handleChange}
                      placeholder="2.0"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="track_inventory"
                  checked={formData.track_inventory}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                />
                <span className="font-medium">Track inventory</span>
              </label>

              {formData.track_inventory && (
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Stock Quantity"
                    name="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <Input
                    label="Low Stock Threshold"
                    name="low_stock_threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={handleChange}
                    placeholder="5"
                  />
                  <Input
                    label="Shelf Location"
                    name="shelf_location"
                    value={formData.shelf_location}
                    onChange={handleChange}
                    placeholder="A-1-3"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {formData.images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square bg-[var(--color-slate-100)] rounded-lg overflow-hidden group cursor-pointer ${
                      imageUrl === formData.featured_image_url
                        ? "ring-2 ring-[var(--color-primary-500)]"
                        : ""
                    }`}
                    onClick={() => handleSetFeaturedImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {imageUrl === formData.featured_image_url && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="default" size="sm">Featured</Badge>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(imageUrl);
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="aspect-square border-2 border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center gap-2 text-[var(--color-muted)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-500)] transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Add Image</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-[var(--color-muted)] mt-2">
                Click an image to set it as the featured image.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Active</span>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Featured</span>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Taxable</span>
                <input
                  type="checkbox"
                  name="is_taxable"
                  checked={formData.is_taxable}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                />
              </label>
            </CardContent>
          </Card>

          {/* Subscription Settings */}
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Allow Subscriptions</span>
                <input
                  type="checkbox"
                  name="is_subscribable"
                  checked={formData.is_subscribable}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                />
              </label>

              {formData.is_subscribable && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
                      Allowed Frequencies
                    </label>
                    <div className="space-y-2">
                      {(["weekly", "biweekly", "monthly"] as const).map((freq) => (
                        <label key={freq} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.subscription_frequencies.includes(freq)}
                            onChange={() => handleFrequencyToggle(freq)}
                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary-500)]"
                          />
                          <span className="text-sm capitalize">
                            {freq === "biweekly" ? "Every 2 Weeks" : freq}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Min Qty"
                      name="min_subscription_quantity"
                      type="number"
                      min="1"
                      value={formData.min_subscription_quantity}
                      onChange={handleChange}
                      placeholder="1"
                    />
                    <Input
                      label="Max Qty"
                      name="max_subscription_quantity"
                      type="number"
                      min="1"
                      value={formData.max_subscription_quantity}
                      onChange={handleChange}
                      placeholder="10"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Category */}
          <Card variant="default">
            <CardHeader className="border-b border-[var(--color-border)]">
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-[var(--color-error)]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card variant="default">
            <CardContent className="p-6 space-y-3">
              <Button type="submit" className="w-full" isLoading={isPending}>
                {isEditing ? "Save Changes" : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/admin/products")}
                disabled={isPending}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
