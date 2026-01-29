import type { MetadataRoute } from "next";
import { getPages } from "@/lib/actions/pages";
import { getBlogPosts } from "@/lib/actions/blog";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://amosmillerfarm.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/gift-cards`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // CMS pages
  const { data: pages } = await getPages({ is_published: true });
  const cmsPages: MetadataRoute.Sitemap = (pages || []).map(
    (page: { slug: string; updated_at: string }) => ({
      url: `${BASE_URL}/${page.slug}`,
      lastModified: new Date(page.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  // Blog posts
  const { data: posts } = await getBlogPosts({ is_published: true });
  const blogPages: MetadataRoute.Sitemap = (posts || []).map(
    (post: { slug: string; updated_at: string }) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  );

  return [...staticPages, ...cmsPages, ...blogPages];
}
