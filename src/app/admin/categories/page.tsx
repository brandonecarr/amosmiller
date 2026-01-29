"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Pencil, Trash2, GripVertical, FolderTree, Loader2 } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from "@/components/ui";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
} from "@/lib/actions/categories";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", parent_id: "" });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", slug: "", description: "", parent_id: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "", parent_id: "" });
    setError(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-charcoal)]">
                        {category.name}
                      </p>
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
