import { getNavPages } from "@/lib/actions/pages";
import { Header } from "./Header";

export async function HeaderWrapper() {
  let cmsNavItems: { label: string; href: string }[] = [];

  try {
    const { data: pages } = await getNavPages();
    cmsNavItems = (pages || []).map(
      (page: { slug: string; nav_label: string | null; title: string }) => ({
        label: page.nav_label || page.title,
        href: `/${page.slug}`,
      })
    );
  } catch {
    // Supabase not configured yet — render header without CMS nav items
  }

  return <Header cmsNavItems={cmsNavItems} />;
}
