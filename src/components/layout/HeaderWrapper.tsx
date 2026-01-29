import { getNavPages } from "@/lib/actions/pages";
import { Header } from "./Header";

export async function HeaderWrapper() {
  const { data: pages } = await getNavPages();

  const cmsNavItems = (pages || []).map(
    (page: { slug: string; nav_label: string | null; title: string }) => ({
      label: page.nav_label || page.title,
      href: `/${page.slug}`,
    })
  );

  return <Header cmsNavItems={cmsNavItems} />;
}
