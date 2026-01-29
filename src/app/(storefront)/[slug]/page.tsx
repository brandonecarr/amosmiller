import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug } from "@/lib/actions/pages";
import { BlockRenderer } from "@/components/storefront/blocks/BlockRenderer";
import type { ContentBlock } from "@/types/cms";

// Reserved slugs that should NOT be handled by this catch-all
const RESERVED_SLUGS = [
  "shop",
  "cart",
  "checkout",
  "account",
  "admin",
  "blog",
  "order-confirmation",
  "pos",
  "gift-cards",
  "api",
  "login",
  "register",
  "reset-password",
  "callback",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) return {};

  const { data: page } = await getPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || undefined,
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || undefined,
    },
  };
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  const { data: page } = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const blocks = (page.content || []) as ContentBlock[];

  return (
    <div>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
