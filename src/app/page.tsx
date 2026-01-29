import Link from "next/link";
import { ArrowRight, Truck, Leaf, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui";

// Placeholder data for featured products
const featuredProducts = [
  {
    id: 1,
    name: "Grass-Fed Ground Beef",
    price: 8.99,
    unit: "lb",
    image: "/images/products/ground-beef.jpg",
    category: "Beef",
  },
  {
    id: 2,
    name: "Free-Range Whole Chicken",
    price: 5.49,
    unit: "lb",
    image: "/images/products/whole-chicken.jpg",
    category: "Chicken",
  },
  {
    id: 3,
    name: "Farm Fresh Eggs",
    price: 6.99,
    unit: "dozen",
    image: "/images/products/eggs.jpg",
    category: "Dairy",
  },
  {
    id: 4,
    name: "Raw Milk",
    price: 9.99,
    unit: "gallon",
    image: "/images/products/milk.jpg",
    category: "Dairy",
  },
];

const categories = [
  { name: "Beef", href: "/shop/meat/beef", count: 24 },
  { name: "Pork", href: "/shop/meat/pork", count: 18 },
  { name: "Chicken", href: "/shop/meat/chicken", count: 12 },
  { name: "Dairy", href: "/shop/dairy", count: 15 },
  { name: "Produce", href: "/shop/produce", count: 32 },
  { name: "Pantry", href: "/shop/pantry", count: 28 },
];

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

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-[var(--color-cream-100)]">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[var(--color-charcoal)] leading-tight mb-6">
                Farm Fresh,
                <br />
                <span className="text-[var(--color-primary-500)]">
                  Delivered to You
                </span>
              </h1>
              <p className="text-lg text-[var(--color-muted-foreground)] mb-8">
                Experience the difference of truly fresh, sustainably raised
                meats and dairy products. From our family farm to your table.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/shop">
                  <Button size="lg">
                    Shop Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg">
                    Learn Our Story
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden bg-[var(--color-primary-200)]">
              {/* Hero image placeholder */}
              <div className="absolute inset-0 flex items-center justify-center text-[var(--color-primary-500)]">
                <span className="text-lg">Hero Image</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white border-b border-[var(--color-border)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-500)] mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-[var(--color-charcoal)] mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--color-muted)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[var(--color-charcoal)] mb-2">
                Shop by Category
              </h2>
              <p className="text-[var(--color-muted)]">
                Browse our selection of farm-fresh products
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden lg:flex items-center gap-2 text-[var(--color-primary-500)] font-medium hover:underline"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[var(--color-cream-100)] hover:shadow-lg transition-shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-semibold text-white text-lg">
                    {category.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {category.count} products
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 lg:py-24 bg-[var(--color-slate-50)]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[var(--color-charcoal)] mb-2">
                Featured Products
              </h2>
              <p className="text-[var(--color-muted)]">
                Our most popular farm-fresh items
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden lg:flex items-center gap-2 text-[var(--color-primary-500)] font-medium hover:underline"
            >
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-[var(--color-cream-100)] relative">
                  {/* Product image placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--color-muted)]">
                    <span className="text-sm">Product Image</span>
                  </div>
                  <span className="absolute top-3 left-3 px-2 py-1 bg-[var(--color-primary-500)] text-white text-xs font-medium rounded">
                    {product.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-[var(--color-charcoal)] mb-1 group-hover:text-[var(--color-primary-500)] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[var(--color-primary-500)] font-semibold">
                    ${product.price.toFixed(2)}
                    <span className="text-[var(--color-muted)] font-normal">
                      /{product.unit}
                    </span>
                  </p>
                  <Button variant="secondary" className="w-full mt-3" size="sm">
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-[var(--color-primary-500)]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Taste the Difference?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of families who trust Amos Miller Farm for their
            weekly groceries. Fresh, sustainable, and delicious.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/shop">
              <Button
                size="lg"
                className="bg-white text-[var(--color-primary-500)] hover:bg-[var(--color-cream-100)]"
              >
                Start Shopping
              </Button>
            </Link>
            <Link href="/delivery">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Check Delivery Areas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">
              Stay Updated
            </h2>
            <p className="text-[var(--color-muted)] mb-6">
              Subscribe to our newsletter for farm updates, new products, and
              exclusive offers.
            </p>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
