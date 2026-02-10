import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Truck,
  Leaf,
  ShieldCheck,
  Heart,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui";
import { getCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import { ProductCard } from "@/components/storefront/ProductCard";

const features = [
  {
    icon: Truck,
    title: "Local Delivery",
    description: "Fresh products delivered right to your door",
  },
  {
    icon: Leaf,
    title: "Sustainably Raised",
    description: "Pasture-raised animals, organic practices",
  },
  {
    icon: ShieldCheck,
    title: "Quality Guaranteed",
    description: "100% satisfaction or your money back",
  },
  {
    icon: Heart,
    title: "Family Farm",
    description: "Three generations of farming excellence",
  },
];

export default async function HomePage() {
  const [{ data: allCategories }, { data: featuredData }] = await Promise.all([
    getCategories(),
    getProducts({ is_featured: true, is_active: true, limit: 4 }),
  ]);
  const categories = (allCategories || [])
    .filter((c: { is_active: boolean; productCount: number }) => c.is_active && c.productCount > 0)
    .sort((a: { is_featured: boolean }, b: { is_featured: boolean }) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
    .slice(0, 8);

  const featuredProducts = (featuredData || []).map((product: {
    id: string;
    name: string;
    slug: string;
    category_id: string | null;
    pricing_type: string;
    base_price: number;
    sale_price: number | null;
    weight_unit: string | null;
    estimated_weight: number | null;
    min_weight: number | null;
    max_weight: number | null;
    stock_quantity: number;
    is_featured: boolean;
    tags: string[] | null;
    featured_image_url: string | null;
    categories?: { name: string };
  }) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.categories?.name || "",
    pricing_type: product.pricing_type as "fixed" | "weight",
    base_price: product.base_price || 0,
    sale_price: product.sale_price,
    weight_unit: (product.weight_unit as "lb" | "oz" | "kg" | "g") || "lb",
    estimated_weight: product.estimated_weight,
    min_weight: product.min_weight,
    max_weight: product.max_weight,
    stock_quantity: product.stock_quantity || 0,
    is_featured: product.is_featured || false,
    tags: product.tags || [],
    featured_image_url: product.featured_image_url,
  }));

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full mb-6">
                <Leaf className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-medium text-orange-700">
                  Fresh Harvest Daily
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-[1.1] mb-6 font-heading">
                Farm Fresh,{" "}
                <span className="gradient-text">Delivered to You</span>
              </h1>

              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Experience the difference of truly fresh, sustainably raised
                meats and dairy products. From our family farm to your table.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/shop">
                  <Button size="lg">
                    Shop Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="secondary" size="lg">
                    Learn Our Story
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-6 border-t border-slate-200">
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-heading">
                    2,500+
                  </p>
                  <p className="text-sm text-slate-500">Orders Delivered</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-heading">
                    1,200+
                  </p>
                  <p className="text-sm text-slate-500">Happy Customers</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                  <p className="text-2xl font-bold text-slate-900 font-heading">
                    4.9
                  </p>
                  <p className="text-sm text-slate-500">Rating</p>
                </div>
              </div>
            </div>

            {/* Right Column — Hero Image */}
            <div className="relative">
              <div className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden transition-transform duration-500 hover:scale-[1.03]">
                <Image
                  src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                  alt="Fresh farm produce"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating Verification Card */}
              <div className="absolute -bottom-4 -left-4 lg:-left-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-4 max-w-[220px]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Verified Farm
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      USDA certified organic practices
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 font-heading">
                Shop by Category
              </h2>
              <p className="text-slate-500">
                Browse our selection of farm-fresh products
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden lg:flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-orange-500 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category: { id: string; name: string; slug: string; image_url: string | null; productCount: number }) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.id}`}
                className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all"
              >
                <div className="aspect-[3/2] relative bg-slate-100">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Leaf className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white text-sm mb-0.5 font-heading">
                      {category.name}
                    </h3>
                    <p className="text-xs text-white/70">
                      {category.productCount} {category.productCount === 1 ? "product" : "products"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 font-heading">
                Featured Products
              </h2>
              <p className="text-slate-500">
                Our most popular farm-fresh items
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden lg:flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-orange-500 transition-colors"
            >
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product: { id: string; name: string; slug: string; category: string; pricing_type: "fixed" | "weight"; base_price: number; sale_price: number | null; weight_unit: "lb" | "oz" | "kg" | "g"; estimated_weight: number | null; min_weight: number | null; max_weight: number | null; stock_quantity: number; is_featured: boolean; tags: string[]; featured_image_url: string | null }) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">Check back soon for featured products!</p>
            </div>
          )}
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 font-heading">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="bg-slate-900 rounded-3xl px-8 py-12 lg:px-16 lg:py-16 text-center">
            <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4 font-heading">
              Ready to Taste the Difference?
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Join thousands of families who trust Amos Miller Farm for their
              weekly groceries. Fresh, sustainable, and delicious.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/shop">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-white/90 border-0"
                >
                  Start Shopping
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/delivery">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                >
                  Check Delivery Areas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 font-heading">
              Stay Updated
            </h2>
            <p className="text-slate-500 mb-6">
              Subscribe to our newsletter for farm updates, new products, and
              exclusive offers.
            </p>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-2.5 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-slate-300 transition-colors"
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
