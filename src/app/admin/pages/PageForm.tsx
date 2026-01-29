"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  GripVertical,
  Sparkles,
  Type,
  ImageIcon,
  ShoppingBag,
  HelpCircle,
  Quote,
  Code,
  Flag,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { createPage, updatePage } from "@/lib/actions/pages";
import type { Page, ContentBlock, BlockType } from "@/types/cms";

interface PageFormProps {
  page?: Page;
}

const BLOCK_TYPE_CONFIG: Record<
  BlockType,
  { label: string; icon: React.ReactNode; description: string }
> = {
  hero: {
    label: "Hero",
    icon: <Sparkles className="w-4 h-4" />,
    description: "Large hero section with title, subtitle, and CTA",
  },
  richtext: {
    label: "Rich Text",
    icon: <Type className="w-4 h-4" />,
    description: "Formatted text content with a rich editor",
  },
  image: {
    label: "Image",
    icon: <ImageIcon className="w-4 h-4" />,
    description: "Single image with alt text and caption",
  },
  products: {
    label: "Products",
    icon: <ShoppingBag className="w-4 h-4" />,
    description: "Display featured or category products",
  },
  faq: {
    label: "FAQ",
    icon: <HelpCircle className="w-4 h-4" />,
    description: "Frequently asked questions accordion",
  },
  testimonials: {
    label: "Testimonials",
    icon: <Quote className="w-4 h-4" />,
    description: "Customer testimonials and quotes",
  },
  html: {
    label: "Custom HTML",
    icon: <Code className="w-4 h-4" />,
    description: "Raw HTML content block",
  },
  banner: {
    label: "Banner",
    icon: <Flag className="w-4 h-4" />,
    description: "Colored banner with text and optional link",
  },
};

function createDefaultBlock(type: BlockType): ContentBlock {
  const id = crypto.randomUUID();

  switch (type) {
    case "hero":
      return {
        id,
        type: "hero",
        data: { title: "", subtitle: "", imageUrl: "", ctaText: "", ctaLink: "" },
      };
    case "richtext":
      return { id, type: "richtext", data: { html: "" } };
    case "image":
      return { id, type: "image", data: { url: "", alt: "", caption: "" } };
    case "products":
      return {
        id,
        type: "products",
        data: { title: "", mode: "featured", categoryId: "", limit: 4 },
      };
    case "faq":
      return {
        id,
        type: "faq",
        data: { title: "", items: [{ question: "", answer: "" }] },
      };
    case "testimonials":
      return {
        id,
        type: "testimonials",
        data: { title: "", items: [{ name: "", quote: "", role: "" }] },
      };
    case "html":
      return { id, type: "html", data: { html: "" } };
    case "banner":
      return {
        id,
        type: "banner",
        data: {
          text: "",
          backgroundColor: "#2d5016",
          textColor: "#ffffff",
          linkUrl: "",
          linkText: "",
        },
      };
  }
}

export function PageForm({ page }: PageFormProps) {
  const router = useRouter();
  const isEditing = !!page;
  const slugManuallyEdited = useRef(!!page);

  // Basic fields
  const [title, setTitle] = useState(page?.title || "");
  const [slug, setSlug] = useState(page?.slug || "");
  const [metaTitle, setMetaTitle] = useState(page?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(page?.meta_description || "");
  const [isPublished, setIsPublished] = useState(page?.is_published ?? false);
  const [showInNav, setShowInNav] = useState(page?.show_in_nav ?? false);
  const [navLabel, setNavLabel] = useState(page?.nav_label || "");
  const [sortOrder, setSortOrder] = useState(page?.sort_order?.toString() || "0");

  // Content blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>(page?.content || []);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  // Auto-generate slug from title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slugManuallyEdited.current) {
      const generated = newTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(generated);
    }
  };

  const handleSlugChange = (newSlug: string) => {
    slugManuallyEdited.current = true;
    setSlug(newSlug);
  };

  // Block management
  const addBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, createDefaultBlock(type)]);
    setAddBlockOpen(false);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newBlocks.length) return prev;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      return newBlocks;
    });
  };

  const updateBlock = (id: string, data: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? ({ ...b, data: { ...b.data, ...data } } as ContentBlock) : b
      )
    );
  };

  const toggleCollapsed = (id: string) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = {
      title,
      slug,
      content: blocks,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      is_published: isPublished,
      published_at: page?.published_at || null,
      show_in_nav: showInNav,
      nav_label: showInNav ? navLabel || null : null,
      sort_order: parseInt(sortOrder) || 0,
    };

    const result = isEditing
      ? await updatePage(page.id, formData)
      : await createPage(formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/admin/pages");
    router.refresh();
  };

  // Block editor renderers
  const renderBlockEditor = (block: ContentBlock) => {
    switch (block.type) {
      case "hero":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Title
              </label>
              <Input
                value={block.data.title}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                placeholder="Hero title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Subtitle
              </label>
              <Input
                value={block.data.subtitle}
                onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                placeholder="Hero subtitle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Image URL
              </label>
              <Input
                value={block.data.imageUrl}
                onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  CTA Text
                </label>
                <Input
                  value={block.data.ctaText}
                  onChange={(e) => updateBlock(block.id, { ctaText: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  CTA Link
                </label>
                <Input
                  value={block.data.ctaLink}
                  onChange={(e) => updateBlock(block.id, { ctaLink: e.target.value })}
                  placeholder="/shop"
                />
              </div>
            </div>
          </div>
        );

      case "richtext":
        return (
          <RichTextEditor
            content={block.data.html}
            onChange={(html) => updateBlock(block.id, { html })}
            placeholder="Start writing content..."
          />
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Image URL
              </label>
              <Input
                value={block.data.url}
                onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Alt Text
              </label>
              <Input
                value={block.data.alt}
                onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Caption
              </label>
              <Input
                value={block.data.caption}
                onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                placeholder="Optional image caption"
              />
            </div>
          </div>
        );

      case "products":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Section Title
              </label>
              <Input
                value={block.data.title}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                placeholder="Featured Products"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Display Mode
              </label>
              <select
                value={block.data.mode}
                onChange={(e) => updateBlock(block.id, { mode: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
              >
                <option value="featured">Featured Products</option>
                <option value="category">By Category</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Limit
              </label>
              <Input
                type="number"
                min="1"
                max="24"
                value={block.data.limit.toString()}
                onChange={(e) => updateBlock(block.id, { limit: parseInt(e.target.value) || 4 })}
              />
            </div>
          </div>
        );

      case "faq":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Section Title
              </label>
              <Input
                value={block.data.title}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                placeholder="Frequently Asked Questions"
              />
            </div>
            <div className="space-y-3">
              {block.data.items.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-slate-50)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--color-charcoal)]">
                      Q&A #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = block.data.items.filter((_, i) => i !== idx);
                        updateBlock(block.id, { items: newItems });
                      }}
                      className="p-1 rounded text-red-500 hover:bg-red-50"
                      disabled={block.data.items.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                        Question
                      </label>
                      <textarea
                        value={item.question}
                        onChange={(e) => {
                          const newItems = [...block.data.items];
                          newItems[idx] = { ...newItems[idx], question: e.target.value };
                          updateBlock(block.id, { items: newItems });
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent resize-y min-h-[60px]"
                        rows={2}
                        placeholder="Enter the question..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                        Answer
                      </label>
                      <textarea
                        value={item.answer}
                        onChange={(e) => {
                          const newItems = [...block.data.items];
                          newItems[idx] = { ...newItems[idx], answer: e.target.value };
                          updateBlock(block.id, { items: newItems });
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent resize-y min-h-[80px]"
                        rows={3}
                        placeholder="Enter the answer..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newItems = [...block.data.items, { question: "", answer: "" }];
                  updateBlock(block.id, { items: newItems });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Q&A Pair
              </button>
            </div>
          </div>
        );

      case "testimonials":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Section Title
              </label>
              <Input
                value={block.data.title}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                placeholder="What Our Customers Say"
              />
            </div>
            <div className="space-y-3">
              {block.data.items.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-slate-50)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--color-charcoal)]">
                      Testimonial #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = block.data.items.filter((_, i) => i !== idx);
                        updateBlock(block.id, { items: newItems });
                      }}
                      className="p-1 rounded text-red-500 hover:bg-red-50"
                      disabled={block.data.items.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                        Name
                      </label>
                      <Input
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...block.data.items];
                          newItems[idx] = { ...newItems[idx], name: e.target.value };
                          updateBlock(block.id, { items: newItems });
                        }}
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                        Quote
                      </label>
                      <textarea
                        value={item.quote}
                        onChange={(e) => {
                          const newItems = [...block.data.items];
                          newItems[idx] = { ...newItems[idx], quote: e.target.value };
                          updateBlock(block.id, { items: newItems });
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent resize-y min-h-[80px]"
                        rows={3}
                        placeholder="Their testimonial quote..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                        Role / Title
                      </label>
                      <Input
                        value={item.role}
                        onChange={(e) => {
                          const newItems = [...block.data.items];
                          newItems[idx] = { ...newItems[idx], role: e.target.value };
                          updateBlock(block.id, { items: newItems });
                        }}
                        placeholder="e.g. Local Customer"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newItems = [...block.data.items, { name: "", quote: "", role: "" }];
                  updateBlock(block.id, { items: newItems });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Testimonial
              </button>
            </div>
          </div>
        );

      case "html":
        return (
          <div>
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
              HTML Code
            </label>
            <textarea
              value={block.data.html}
              onChange={(e) => updateBlock(block.id, { html: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent font-mono text-sm resize-y min-h-[200px]"
              rows={10}
              placeholder="<div>Your custom HTML...</div>"
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Enter raw HTML. Be careful with scripts and external resources.
            </p>
          </div>
        );

      case "banner":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                Banner Text
              </label>
              <Input
                value={block.data.text}
                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                placeholder="Free shipping on orders over $100!"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={block.data.backgroundColor}
                    onChange={(e) => updateBlock(block.id, { backgroundColor: e.target.value })}
                    className="w-10 h-10 rounded border border-[var(--color-border)] cursor-pointer"
                  />
                  <Input
                    value={block.data.backgroundColor}
                    onChange={(e) => updateBlock(block.id, { backgroundColor: e.target.value })}
                    placeholder="#2d5016"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={block.data.textColor}
                    onChange={(e) => updateBlock(block.id, { textColor: e.target.value })}
                    className="w-10 h-10 rounded border border-[var(--color-border)] cursor-pointer"
                  />
                  <Input
                    value={block.data.textColor}
                    onChange={(e) => updateBlock(block.id, { textColor: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Link URL
                </label>
                <Input
                  value={block.data.linkUrl}
                  onChange={(e) => updateBlock(block.id, { linkUrl: e.target.value })}
                  placeholder="/shop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Link Text
                </label>
                <Input
                  value={block.data.linkText}
                  onChange={(e) => updateBlock(block.id, { linkText: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
            </div>
            {/* Preview */}
            {block.data.text && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5">
                  Preview
                </label>
                <div
                  className="rounded-lg px-4 py-3 text-center text-sm font-medium"
                  style={{
                    backgroundColor: block.data.backgroundColor || "#2d5016",
                    color: block.data.textColor || "#ffffff",
                  }}
                >
                  {block.data.text}
                  {block.data.linkText && (
                    <span className="ml-2 underline">{block.data.linkText}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Page Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter page title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-muted)] shrink-0">/</span>
                  <Input
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="page-url-slug"
                    required
                  />
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  The URL path for this page. Auto-generated from title.
                </p>
              </div>
            </div>
          </div>

          {/* Content Blocks */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--color-charcoal)]">
                Content Blocks
              </h2>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddBlockOpen(!addBlockOpen)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Block
                </Button>

                {addBlockOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAddBlockOpen(false)}
                    />
                    <div className="absolute right-0 top-10 z-20 w-72 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-2 max-h-[400px] overflow-y-auto">
                      {(Object.keys(BLOCK_TYPE_CONFIG) as BlockType[]).map((type) => {
                        const config = BLOCK_TYPE_CONFIG[type];
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => addBlock(type)}
                            className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-[var(--color-slate-50)] transition-colors"
                          >
                            <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-600)] flex items-center justify-center shrink-0 mt-0.5">
                              {config.icon}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-[var(--color-charcoal)]">
                                {config.label}
                              </p>
                              <p className="text-xs text-[var(--color-muted)]">
                                {config.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {blocks.length === 0 ? (
              <div className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-8 text-center">
                <Type className="w-8 h-8 mx-auto mb-3 text-[var(--color-muted)]" />
                <p className="text-[var(--color-muted)] mb-1">No content blocks yet</p>
                <p className="text-xs text-[var(--color-muted)]">
                  Click &quot;Add Block&quot; to start building your page content.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((block, index) => {
                  const config = BLOCK_TYPE_CONFIG[block.type];
                  const isCollapsed = collapsedBlocks.has(block.id);

                  return (
                    <div
                      key={block.id}
                      className="border border-[var(--color-border)] rounded-lg overflow-hidden"
                    >
                      {/* Block Header */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-slate-50)] border-b border-[var(--color-border)]">
                        <GripVertical className="w-4 h-4 text-[var(--color-muted)] shrink-0" />
                        <span className="w-7 h-7 rounded bg-[var(--color-primary-50)] text-[var(--color-primary-600)] flex items-center justify-center shrink-0">
                          {config.icon}
                        </span>
                        <span className="text-sm font-medium text-[var(--color-charcoal)] flex-1">
                          {config.label}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded text-[var(--color-muted)] hover:bg-white hover:text-[var(--color-charcoal)] disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(index, "down")}
                            disabled={index === blocks.length - 1}
                            className="p-1 rounded text-[var(--color-muted)] hover:bg-white hover:text-[var(--color-charcoal)] disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCollapsed(block.id)}
                            className="p-1 rounded text-[var(--color-muted)] hover:bg-white hover:text-[var(--color-charcoal)]"
                            title={isCollapsed ? "Expand" : "Collapse"}
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                            title="Remove block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Block Body */}
                      {!isCollapsed && (
                        <div className="p-4">{renderBlockEditor(block)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-charcoal)] mb-4">
              Status
            </h2>
            <div className="space-y-4">
              {/* Published Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-charcoal)]">Published</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Make this page visible on the site
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

              {/* Show in Navigation Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-charcoal)]">Show in Navigation</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Display this page in the site navigation
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInNav}
                    onChange={(e) => setShowInNav(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary-300)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary-500)]" />
                </label>
              </div>

              {/* Nav Label (shown when showInNav is true) */}
              {showInNav && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                    Navigation Label
                  </label>
                  <Input
                    value={navLabel}
                    onChange={(e) => setNavLabel(e.target.value)}
                    placeholder={title || "Nav label"}
                  />
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Text shown in the navigation menu. Defaults to page title.
                  </p>
                </div>
              )}

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Sort Order
                </label>
                <Input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Lower numbers appear first in navigation and listings.
                </p>
              </div>
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
                  placeholder={title || "Page title for search engines"}
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {metaTitle.length}/60 characters recommended
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-1.5">
                  Meta Description
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent resize-y min-h-[80px]"
                  rows={3}
                  placeholder="Brief description for search engine results"
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {metaDescription.length}/160 characters recommended
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? "Update Page" : "Create Page"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/pages")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
