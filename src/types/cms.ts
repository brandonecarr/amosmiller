// Content block types for the page builder

export interface HeroBlock {
  id: string;
  type: "hero";
  data: {
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaText: string;
    ctaLink: string;
  };
}

export interface RichTextBlock {
  id: string;
  type: "richtext";
  data: {
    html: string;
  };
}

export interface ImageBlock {
  id: string;
  type: "image";
  data: {
    url: string;
    alt: string;
    caption: string;
  };
}

export interface ProductsBlock {
  id: string;
  type: "products";
  data: {
    mode: "featured" | "category";
    categoryId: string;
    limit: number;
    title: string;
  };
}

export interface FaqBlock {
  id: string;
  type: "faq";
  data: {
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
}

export interface TestimonialsBlock {
  id: string;
  type: "testimonials";
  data: {
    title: string;
    items: Array<{ name: string; quote: string; role: string }>;
  };
}

export interface HtmlBlock {
  id: string;
  type: "html";
  data: {
    html: string;
  };
}

export interface BannerBlock {
  id: string;
  type: "banner";
  data: {
    text: string;
    backgroundColor: string;
    textColor: string;
    linkUrl: string;
    linkText: string;
  };
}

export type ContentBlock =
  | HeroBlock
  | RichTextBlock
  | ImageBlock
  | ProductsBlock
  | FaqBlock
  | TestimonialsBlock
  | HtmlBlock
  | BannerBlock;

export type BlockType = ContentBlock["type"];

// Page interface matching the database schema
export interface Page {
  id: string;
  title: string;
  slug: string;
  content: ContentBlock[];
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  show_in_nav: boolean;
  nav_label: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Blog post interface matching the database schema
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  author_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined field
  author?: { full_name: string | null } | null;
}
