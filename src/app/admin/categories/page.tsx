"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, GripVertical, FolderTree, Loader2, Star, Upload, X } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from "@/components/ui";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  toggleCategoryFeatured,
} from "@/lib/actions/categories";
import { uploadCategoryImage } from "@/lib/actions/storage";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  product_count?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", parent_id: "", image_url: "" });
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    const result = await getCategories();
    if (result.data) {
      setCategories(result.data);
    }
    if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        parent_id: category.parent_id || "",
        image_url: category.image_url || "",
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", slug: "", description: "", parent_id: "", image_url: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "", parent_id: "", image_url: "" });
    setError(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const categoryId = editingCategory?.id || "temp-" + Date.now();
    const result = await uploadCategoryImage(file, categoryId);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setFormData((prev) => ({ ...prev, image_url: result.url! }));
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const slug = formData.slug || generateSlug(formData.name);

    startTransition(async () => {
      if (editingCategory) {
        const result = await updateCategory(editingCategory.id, {
          name: formData.name,
          slug,
          description: formData.description || null,
          parent_id: formData.parent_id || null,
          image_url: formData.image_url || null,
        });

        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createCategory({
          name: formData.name,
          slug,
          description: formData.description || null,
          parent_id: formData.parent_id || null,
          image_url: formData.image_url || null,
          sort_order: 0,
          is_active: true,
        });

        if (result.error) {
          setError(result.error);
          return;
        }
      }

      handleCloseModal();
      loadCategories();
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      loadCategories();
    });
  };

  const handleToggleActive = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    startTransition(async () => {
      const result = await toggleCategoryActive(id, !category.is_active);
      if (result.error) {
        setError(result.error);
        return;
      }
      loadCategories();
    });
  };

  const handleToggleFeatured = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    startTransition(async () => {
      const result = await toggleCategoryFeatured(id, !category.is_featured);
      if (result.error) {
        setError(result.error);
        return;
      }
      loadCategories();
    });
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
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">
            Categories
          </h1>
          <p className="text-[var(--color-muted)]">
            Organize your products into categories
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} disabled={isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories List */}
      <Card variant="default">
        <CardHeader className="border-b border-[var(--color-border)]">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5" />
            All Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--color-border)]">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[var(--color-slate-50)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-[var(--color-muted)] cursor-grab" />
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderTree className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-charcoal)]">
                        {category.name}
                      </p>
                      {category.is_featured && (
                        <Badge variant="info" size="sm">Featured</Badge>
                      )}
                      {!category.is_active && (
                        <Badge variant="outline" size="sm">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-muted)]">
                      /{category.slug}
                      {category.product_count !== undefined && ` · ${category.product_count} products`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFeatured(category.id)}
                    disabled={isPending}
                    title={category.is_featured ? "Remove from featured" : "Mark as featured"}
                  >
                    <Star className={`w-4 h-4 ${category.is_featured ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(category.id)}
                    disabled={isPending}
                  >
                    {category.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenModal(category)}
                    disabled={isPending}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={isPending}
                    className="text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="px-6 py-12 text-center">
                <FolderTree className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
                <p className="text-[var(--color-muted)]">
                  No categories yet. Create your first category to get started.
                </p>
              </div>
            )}
          </div>
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
              {editingCategory ? "Edit Category" : "New Category"}
            </h2>

            {error && (
              <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Category Name"
                placeholder="e.g., Ground Beef"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: editingCategory ? formData.slug : generateSlug(e.target.value),
                  });
                }}
                required
              />

              <Input
                label="Slug"
                placeholder="e.g., ground-beef"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                helperText="URL-friendly version of the name"
              />

              <Input
                label="Description"
                placeholder="Category description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              {/* Category Image */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Category Image
                </label>
                {formData.image_url ? (
                  <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-slate-100 border border-[var(--color-border)]">
                    <Image
                      src={formData.image_url}
                      alt="Category image"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--color-border)] rounded-lg cursor-pointer hover:border-[var(--color-primary-500)] hover:bg-slate-50 transition-colors">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--color-muted)]" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-[var(--color-muted)] mb-2" />
                        <span className="text-sm text-[var(--color-muted)]">Click to upload</span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Parent Category
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter((cat) => cat.id !== editingCategory?.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

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
                  {editingCategory ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
