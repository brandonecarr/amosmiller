"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, X, Plus, ImageIcon } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { createBlogPost, updateBlogPost } from "@/lib/actions/blog";
import type { BlogPost } from "@/types/cms";

interface BlogPostFormProps {
  post?: BlogPost;
}

export function BlogPostForm({ post }: BlogPostFormProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    post?.featured_image_url || ""
  );
  const [metaTitle, setMetaTitle] = useState(post?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(
    post?.meta_description || ""
  );
  const [isPublished, setIsPublished] = useState(post?.is_published ?? false);
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing || slug === generateSlug(post?.title || "")) {
      setSlug(generateSlug(value));
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = {
      title,
      slug,
      excerpt: excerpt || null,
      content: content || null,
      featured_image_url: featuredImageUrl || null,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      is_published: isPublished,
      published_at: isPublished ? post?.published_at || new Date().toISOString() : null,
      tags,
    };

    const result = isEditing
      ? await updateBlogPost(post.id, formData)
      : await createBlogPost(formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/admin/blog");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Slug *
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  placeholder="post-url-slug"
                  required
                  className="font-mono"
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  URL: /blog/{slug || "..."}
                </p>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
              Excerpt
            </h2>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief summary of the post..."
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)] focus:border-[var(--color-primary-500)] resize-none"
            />
          </div>

          {/* Content */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
              Content
            </h2>
            <RichTextEditor
              content={content}
              onChange={(html) => setContent(html)}
              placeholder="Write your blog post content..."
              minHeight="400px"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[var(--color-charcoal)]">
                  Published
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Make this post visible to readers
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary-300)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary-500)]" />
              </label>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
              Featured Image
            </h2>
            <div className="space-y-3">
              <Input
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {featuredImageUrl && (
                <div className="relative rounded-lg overflow-hidden border border-[var(--color-border)]">
                  <Image
                    src={featuredImageUrl}
                    alt="Featured image preview"
                    width={800}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              {!featuredImageUrl && (
                <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-[var(--color-border)] text-[var(--color-muted)]">
                  <div className="text-center">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs">Enter a URL above</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
              Tags
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
              SEO
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Meta Title
                </label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Page title for search engines"
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {metaTitle.length}/60 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Meta Description
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Brief description for search results..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-300)] focus:border-[var(--color-primary-500)] resize-none"
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {metaDescription.length}/160 characters
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? "Update Post" : "Create Post"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/blog")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
